"""
NPM Package Manager - Simulates npm package management
"""
import asyncio
import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
from .base_manager import BasePackageManager, Package, InstallResult

import logging
logger = logging.getLogger(__name__)


class NPMManager(BasePackageManager):
    """NPM Package Manager implementation"""
    
    def __init__(self, virtual_fs, registry_client, resolver):
        super().__init__(virtual_fs)
        self.registry_client = registry_client
        self.resolver = resolver
        self.package_json_path = "package.json"
        
    async def install(
        self, 
        package_name: str, 
        version: Optional[str] = None,
        save_dev: bool = False,
        global_install: bool = False
    ) -> InstallResult:
        """Install npm package"""
        output_lines = []
        errors = []
        warnings = []
        installed_packages = []
        
        try:
            # Add initial output
            output_lines.append(f"\x1b[1mnpm\x1b[0m \x1b[2minfo\x1b[0m using npm@10.2.4")
            output_lines.append(f"\x1b[1mnpm\x1b[0m \x1b[2minfo\x1b[0m using node@v20.11.0")
            
            # Fetch package metadata from registry
            output_lines.append(f"\x1b[1mnpm\x1b[0m \x1b[2mhttp\x1b[0m fetch GET 200 https://registry.npmjs.org/{package_name} {self._random_ms()}ms")
            
            package_info = await self.registry_client.get_package_info(
                "npm", package_name, version
            )
            
            if not package_info:
                errors.append(f"npm ERR! code E404")
                errors.append(f"npm ERR! 404 Not Found - GET https://registry.npmjs.org/{package_name} - Not found")
                errors.append(f"npm ERR! 404")
                errors.append(f"npm ERR! 404  '{package_name}@{version or 'latest'}' is not in this registry.")
                return InstallResult(False, None, [], errors, warnings, output_lines)
            
            # Create package object
            pkg = Package(
                name=package_name,
                version=package_info['version'],
                description=package_info.get('description', ''),
                dependencies=package_info.get('dependencies', {}),
                dev_dependencies=package_info.get('devDependencies', {}),
                installed=True,
                install_time=datetime.now()
            )
            
            # Resolve dependencies
            output_lines.append(f"\x1b[1mnpm\x1b[0m \x1b[2mhttp\x1b[0m fetch GET 200 https://registry.npmjs.org/{package_name}/-/{package_name}-{pkg.version}.tgz {self._random_ms()}ms")
            
            all_packages = await self.resolver.resolve_dependencies(
                pkg, self.installed_packages
            )
            
            # Check for conflicts
            conflicts = self.resolver.detect_conflicts(all_packages, self.installed_packages)
            if conflicts:
                for conflict in conflicts:
                    warnings.append(
                        f"npm WARN ERESOLVE overriding peer dependency"
                    )
                    warnings.append(
                        f"npm WARN While resolving: {conflict.required_by[0]}"
                    )
                    warnings.append(
                        f"npm WARN Found: {conflict.package}@{conflict.installed_version}"
                    )
                    
            # Simulate installation progress
            output_lines.append("")
            total = len(all_packages)
            for i, dep_pkg in enumerate(all_packages, 1):
                output_lines.append(
                    f"\x1b[1madded\x1b[0m {dep_pkg.name}@{dep_pkg.version}"
                )
                self.installed_packages[dep_pkg.name] = dep_pkg
                installed_packages.append(dep_pkg)
            
            # Update package.json
            await self._update_package_json(pkg, save_dev)
            
            # Final summary
            output_lines.append("")
            output_lines.append(f"\x1b[1madded {total} package{'s' if total != 1 else ''}\x1b[0m, and audited {total + len(self.installed_packages)} packages in {self._random_seconds()}s")
            output_lines.append(f"")
            output_lines.append(f"{len(all_packages)} packages are looking for funding")
            output_lines.append(f"  run `npm fund` for details")
            
            # Audit summary
            vulnerabilities = self._check_vulnerabilities(all_packages)
            if vulnerabilities['total'] > 0:
                output_lines.append("")
                output_lines.append(f"\x1b[1;33mfound {vulnerabilities['total']} vulnerabilities\x1b[0m ({vulnerabilities['high']} high, {vulnerabilities['moderate']} moderate)")
                output_lines.append(f"  run `npm audit fix` to fix them, or `npm audit` for details")
            else:
                output_lines.append(f"")
                output_lines.append(f"found \x1b[1;32m0 vulnerabilities\x1b[0m")
            
            return InstallResult(True, pkg, installed_packages, errors, warnings, output_lines)
            
        except Exception as e:
            logger.error(f"NPM install error: {e}")
            errors.append(f"npm ERR! {str(e)}")
            return InstallResult(False, None, [], errors, warnings, output_lines)
    
    async def uninstall(self, package_name: str) -> InstallResult:
        """Uninstall npm package"""
        output_lines = []
        errors = []
        
        if package_name not in self.installed_packages:
            errors.append(f"npm ERR! code ENOENT")
            errors.append(f"npm ERR! {package_name} is not installed")
            return InstallResult(False, None, [], errors, [], output_lines)
        
        pkg = self.installed_packages.pop(package_name)
        output_lines.append(f"\x1b[1mremoved\x1b[0m {package_name}@{pkg.version}")
        
        await self._remove_from_package_json(package_name)
        
        output_lines.append(f"")
        output_lines.append(f"removed 1 package in {self._random_seconds()}s")
        
        return InstallResult(True, pkg, [pkg], errors, [], output_lines)
    
    async def list_packages(self, depth: int = 0) -> List[Package]:
        """List installed packages"""
        return list(self.installed_packages.values())
    
    async def update(self, package_name: Optional[str] = None) -> InstallResult:
        """Update packages"""
        output_lines = []
        updated = []
        
        packages_to_update = [package_name] if package_name else list(self.installed_packages.keys())
        
        for pkg_name in packages_to_update:
            if pkg_name in self.installed_packages:
                # Simulate checking for updates
                output_lines.append(f"Checking {pkg_name}...")
                pkg = self.installed_packages[pkg_name]
                # Simulate version bump
                updated.append(pkg)
        
        output_lines.append(f"")
        output_lines.append(f"updated {len(updated)} package{'s' if len(updated) != 1 else ''}")
        
        return InstallResult(True, None, updated, [], [], output_lines)
    
    async def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search npm registry"""
        return await self.registry_client.search("npm", query, limit)
    
    def get_install_command(self, package_name: str, version: Optional[str] = None) -> str:
        """Get npm install command"""
        if version:
            return f"npm install {package_name}@{version}"
        return f"npm install {package_name}"
    
    def parse_version_specifier(self, version_spec: str) -> tuple:
        """Parse npm version specifier"""
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
        else:
            return ('exact', version_spec)
    
    async def _update_package_json(self, pkg: Package, save_dev: bool):
        """Update package.json with new dependency"""
        package_json = await self.virtual_fs.read_json(self.package_json_path) or {
            "name": "flux-ide-project",
            "version": "1.0.0",
            "dependencies": {},
            "devDependencies": {}
        }
        
        dep_key = "devDependencies" if save_dev else "dependencies"
        if dep_key not in package_json:
            package_json[dep_key] = {}
        
        package_json[dep_key][pkg.name] = f"^{pkg.version}"
        await self.virtual_fs.write_json(self.package_json_path, package_json)
    
    async def _remove_from_package_json(self, package_name: str):
        """Remove package from package.json"""
        package_json = await self.virtual_fs.read_json(self.package_json_path)
        if package_json:
            for key in ['dependencies', 'devDependencies']:
                if key in package_json and package_name in package_json[key]:
                    del package_json[key][package_name]
            await self.virtual_fs.write_json(self.package_json_path, package_json)
    
    def _random_ms(self) -> int:
        """Generate random milliseconds for timing"""
        import random
        return random.randint(50, 300)
    
    def _random_seconds(self) -> str:
        """Generate random seconds for timing"""
        import random
        return f"{random.uniform(0.5, 3.0):.1f}s"
    
    def _check_vulnerabilities(self, packages: List[Package]) -> Dict[str, int]:
        """Simulate vulnerability check"""
        import random
        # Randomly assign some vulnerabilities for realism
        total = random.randint(0, 3)
        return {
            'total': total,
            'high': random.randint(0, total),
            'moderate': total - random.randint(0, total)
        }
