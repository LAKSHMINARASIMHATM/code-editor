"""
Pip Package Manager - Simulates pip package management
"""
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from .base_manager import BasePackageManager, Package, InstallResult

import logging
logger = logging.getLogger(__name__)


class PipManager(BasePackageManager):
    """Pip Package Manager implementation"""
    
    def __init__(self, virtual_fs, registry_client, resolver):
        super().__init__(virtual_fs)
        self.registry_client = registry_client
        self.resolver = resolver
        self.requirements_path = "requirements.txt"
        
    async def install(
        self, 
        package_name: str, 
        version: Optional[str] = None,
        save_dev: bool = False,
        global_install: bool = False
    ) -> InstallResult:
        """Install pip package"""
        output_lines = []
        errors = []
        warnings = []
        installed_packages = []
        
        try:
            # Add initial output
            output_lines.append(f"Collecting {package_name}{('==' + version) if version else ''}")
            
            # Fetch package metadata from PyPI
            package_info = await self.registry_client.get_package_info(
                "pypi", package_name, version
            )
            
            if not package_info:
                errors.append(f"ERROR: Could not find a version that satisfies the requirement {package_name}")
                errors.append(f"ERROR: No matching distribution found for {package_name}")
                return InstallResult(False, None, [], errors, warnings, output_lines)
            
            # Create package object
            pkg = Package(
                name=package_name,
                version=package_info['version'],
                description=package_info.get('description', ''),
                dependencies=package_info.get('dependencies', {}),
                installed=True,
                install_time=datetime.now()
            )
            
            output_lines.append(f"  Downloading {package_name}-{pkg.version}-py3-none-any.whl ({self._random_size()} kB)")
            
            # Resolve dependencies
            all_packages = await self.resolver.resolve_dependencies(
                pkg, self.installed_packages
            )
            
            # Show all dependencies being collected
            for dep_pkg in all_packages[1:]:  # Skip the main package
                output_lines.append(f"Collecting {dep_pkg.name}>={dep_pkg.version}")
                output_lines.append(f"  Downloading {dep_pkg.name}-{dep_pkg.version}-py3-none-any.whl ({self._random_size()} kB)")
            
            # Installation
            output_lines.append("Installing collected packages: " + ", ".join([p.name for p in all_packages]))
            
            for dep_pkg in all_packages:
                self.installed_packages[dep_pkg.name] = dep_pkg
                installed_packages.append(dep_pkg)
            
            # Update requirements.txt
            if not global_install:
                await self._update_requirements(pkg)
            
            output_lines.append(f"Successfully installed " + " ".join([f"{p.name}-{p.version}" for p in all_packages]))
            
            return InstallResult(True, pkg, installed_packages, errors, warnings, output_lines)
            
        except Exception as e:
            logger.error(f"Pip install error: {e}")
            errors.append(f"ERROR: {str(e)}")
            return InstallResult(False, None, [], errors, warnings, output_lines)
    
    async def uninstall(self, package_name: str) -> InstallResult:
        """Uninstall pip package"""
        output_lines = []
        errors = []
        warnings = []
        
        if package_name not in self.installed_packages:
            errors.append(f"WARNING: Skipping {package_name} as it is not installed.")
            return InstallResult(False, None, [], errors, warnings, output_lines)
        
        pkg = self.installed_packages.pop(package_name)
        
        output_lines.append(f"Found existing installation: {package_name} {pkg.version}")
        output_lines.append(f"Uninstalling {package_name}-{pkg.version}:")
        output_lines.append(f"  Successfully uninstalled {package_name}-{pkg.version}")
        
        await self._remove_from_requirements(package_name)
        
        return InstallResult(True, pkg, [pkg], errors, warnings, output_lines)
    
    async def list_packages(self, depth: int = 0) -> List[Package]:
        """List installed packages"""
        return list(self.installed_packages.values())
    
    async def update(self, package_name: Optional[str] = None) -> InstallResult:
        """Update packages"""
        output_lines = []
        updated = []
        
        if package_name:
            packages_to_update = [package_name]
        else:
            packages_to_update = list(self.installed_packages.keys())
        
        for pkg_name in packages_to_update:
            if pkg_name in self.installed_packages:
                output_lines.append(f"Requirement already satisfied: {pkg_name}")
                pkg = self.installed_packages[pkg_name]
                updated.append(pkg)
        
        return InstallResult(True, None, updated, [], [], output_lines)
    
    async def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search PyPI"""
        return await self.registry_client.search("pypi", query, limit)
    
    def get_install_command(self, package_name: str, version: Optional[str] = None) -> str:
        """Get pip install command"""
        if version:
            return f"pip install {package_name}=={version}"
        return f"pip install {package_name}"
    
    def parse_version_specifier(self, version_spec: str) -> tuple:
        """Parse pip version specifier"""
        if version_spec.startswith('=='):
            return ('exact', version_spec[2:])
        elif version_spec.startswith('>='):
            return ('gte', version_spec[2:])
        elif version_spec.startswith('<='):
            return ('lte', version_spec[2:])
        elif version_spec.startswith('>'):
            return ('gt', version_spec[1:])
        elif version_spec.startswith('<'):
            return ('lt', version_spec[1:])
        elif version_spec.startswith('~='):
            return ('compatible', version_spec[2:])
        else:
            return ('exact', version_spec)
    
    async def _update_requirements(self, pkg: Package):
        """Update requirements.txt"""
        requirements = await self.virtual_fs.read_file(self.requirements_path) or ""
        lines = requirements.strip().split('\n') if requirements else []
        
        # Add or update package
        found = False
        for i, line in enumerate(lines):
            if line.startswith(pkg.name + '=='):
                lines[i] = f"{pkg.name}=={pkg.version}"
                found = True
                break
        
        if not found:
            lines.append(f"{pkg.name}=={pkg.version}")
        
        await self.virtual_fs.write_file(
            self.requirements_path, 
            '\n'.join(filter(None, lines))
        )
    
    async def _remove_from_requirements(self, package_name: str):
        """Remove package from requirements.txt"""
        requirements = await self.virtual_fs.read_file(self.requirements_path)
        if requirements:
            lines = requirements.strip().split('\n')
            lines = [l for l in lines if not l.startswith(package_name + '==')]
            await self.virtual_fs.write_file(
                self.requirements_path,
                '\n'.join(filter(None, lines))
            )
    
    def _random_size(self) -> int:
        """Generate random package size"""
        import random
        return random.randint(50, 500)
