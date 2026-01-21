"""
Dependency Resolver - Handles dependency resolution and conflict detection
"""
from typing import Dict, List, Set, Optional
from dataclasses import dataclass
import re
import logging

logger = logging.getLogger(__name__)


@dataclass
class DependencyConflict:
    """Represents a dependency conflict"""
    package: str
    required_version: str
    installed_version: str
    required_by: List[str]


class DependencyResolver:
    """Resolves package dependencies and detects conflicts"""
    
    def __init__(self, registry_client):
        self.registry_client = registry_client
    
    async def resolve_dependencies(
        self,
        root_package,
        installed_packages: Dict[str, any],
        max_depth: int = 10
    ) -> List:
        """
        Resolve all dependencies for a package
        Returns a list of all packages that need to be installed
        """
        # Import Package locally to avoid circular imports
        from dataclasses import dataclass
        
        @dataclass
        class Package:
            name: str
            version: str
            description: str = ""
            dependencies: dict = None
            dev_dependencies: dict = None
            installed: bool = False
            
            def __post_init__(self):
                if self.dependencies is None:
                    self.dependencies = {}
                if self.dev_dependencies is None:
                    self.dev_dependencies = {}
        
        resolved = []
        seen = set()
        queue = [(root_package, 0)]
        
        while queue:
            pkg, depth = queue.pop(0)
            
            if depth > max_depth:
                logger.warning(f"Max dependency depth reached for {pkg.name}")
                continue
            
            if pkg.name in seen:
                continue
            
            seen.add(pkg.name)
            resolved.append(pkg)
            
            # Process dependencies
            for dep_name, dep_version in pkg.dependencies.items():
                if dep_name in installed_packages:
                    # Check if installed version satisfies requirement
                    installed_pkg = installed_packages[dep_name]
                    if self._version_satisfies(installed_pkg.version, dep_version):
                        continue
                
                # Fetch dependency info
                registry_type = "npm" if hasattr(pkg, 'package_json') else "pypi"
                
                # Parse version specifier
                version = self._extract_version(dep_version)
                
                dep_info = await self.registry_client.get_package_info(
                    registry_type, dep_name, version
                )
                
                if dep_info:
                    dep_pkg = Package(
                        name=dep_name,
                        version=dep_info['version'],
                        description=dep_info.get('description', ''),
                        dependencies=dep_info.get('dependencies', {}),
                        installed=True
                    )
                    queue.append((dep_pkg, depth + 1))
        
        return resolved
    
    def detect_conflicts(
        self,
        new_packages: List,
        installed_packages: Dict[str, any]
    ) -> List[DependencyConflict]:
        """
        Detect version conflicts between new and installed packages
        """
        conflicts = []
        
        # Build dependency graph
        requirements = {}
        
        for pkg in new_packages:
            for dep_name, dep_version in pkg.dependencies.items():
                if dep_name not in requirements:
                    requirements[dep_name] = []
                requirements[dep_name].append({
                    'version': dep_version,
                    'required_by': pkg.name
                })
        
        # Check for conflicts
        for pkg_name, reqs in requirements.items():
            if len(reqs) <= 1:
                continue
            
            # Check if all requirements are compatible
            versions = [r['version'] for r in reqs]
            if not self._versions_compatible(versions):
                # Found conflict
                if pkg_name in installed_packages:
                    installed_version = installed_packages[pkg_name].version
                else:
                    installed_version = "not installed"
                
                conflicts.append(DependencyConflict(
                    package=pkg_name,
                    required_version=versions[0],
                    installed_version=installed_version,
                    required_by=[r['required_by'] for r in reqs]
                ))
        
        return conflicts
    
    def _version_satisfies(self, installed_version: str, required_version: str) -> bool:
        """Check if installed version satisfies requirement"""
        # Parse version specifier
        operator, version = self._parse_version_spec(required_version)
        
        installed_parts = self._parse_semver(installed_version)
        required_parts = self._parse_semver(version)
        
        if operator == 'exact':
            return installed_parts == required_parts
        elif operator == 'caret':  # ^1.2.3 allows >=1.2.3 <2.0.0
            return (installed_parts[0] == required_parts[0] and
                    installed_parts >= required_parts)
        elif operator == 'tilde':  # ~1.2.3 allows >=1.2.3 <1.3.0
            return (installed_parts[0] == required_parts[0] and
                    installed_parts[1] == required_parts[1] and
                    installed_parts >= required_parts)
        elif operator == 'gte':
            return installed_parts >= required_parts
        elif operator == 'lte':
            return installed_parts <= required_parts
        elif operator == 'gt':
            return installed_parts > required_parts
        elif operator == 'lt':
            return installed_parts < required_parts
        
        return False
    
    def _versions_compatible(self, versions: List[str]) -> bool:
        """Check if multiple version requirements are compatible"""
        # Simplified check - in production this would be more sophisticated
        if len(set(versions)) == 1:
            return True
        
        # Check if all are in compatible range
        try:
            parsed = [self._parse_version_spec(v) for v in versions]
            # If all have same operator or are flexible (^, ~), likely compatible
            operators = [p[0] for p in parsed]
            if all(op in ['caret', 'tilde', 'gte'] for op in operators):
                return True
        except:
            pass
        
        return False
    
    def _parse_version_spec(self, version_spec: str) -> tuple:
        """Parse version specifier"""
        version_spec = version_spec.strip()
        
        if version_spec.startswith('^'):
            return ('caret', version_spec[1:])
        elif version_spec.startswith('~'):
            return ('tilde', version_spec[1:])
        elif version_spec.startswith('>='):
            return ('gte', version_spec[2:])
        elif version_spec.startswith('<='):
            return ('lte', version_spec[2:])
        elif version_spec.startswith('>'):
            return ('gt', version_spec[1:])
        elif version_spec.startswith('<'):
            return ('lt', version_spec[1:])
        elif version_spec.startswith('=='):
            return ('exact', version_spec[2:])
        else:
            return ('exact', version_spec)
    
    def _parse_semver(self, version: str) -> tuple:
        """Parse semantic version into tuple for comparison"""
        # Remove any leading 'v'
        version = version.lstrip('v')
        
        # Extract major.minor.patch
        match = re.match(r'(\d+)\.(\d+)\.(\d+)', version)
        if match:
            return tuple(int(x) for x in match.groups())
        
        # Fallback
        parts = version.split('.')
        return tuple(int(p) if p.isdigit() else 0 for p in parts[:3])
    
    def _extract_version(self, version_spec: str) -> Optional[str]:
        """Extract clean version from specifier"""
        _, version = self._parse_version_spec(version_spec)
        return version
