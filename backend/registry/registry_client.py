"""
Registry Client - Interfaces with package registries (npm, PyPI)
"""
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
import logging
import json

logger = logging.getLogger(__name__)


class RegistryClient:
    """Client for interacting with package registries"""
    
    # Mock package data for common packages
    MOCK_PACKAGES = {
        'npm': {
            'react': {
                'name': 'react',
                'version': '18.2.0',
                'description': 'React is a JavaScript library for building user interfaces.',
                'dependencies': {
                    'loose-envify': '^1.1.0'
                }
            },
            'express': {
                'name': 'express',
                'version': '4.18.2',
                'description': 'Fast, unopinionated, minimalist web framework',
                'dependencies': {
                    'accepts': '~1.3.8',
                    'body-parser': '1.20.1',
                    'cookie': '0.5.0',
                    'debug': '2.6.9'
                }
            },
            'lodash': {
                'name': 'lodash',
                'version': '4.17.21',
                'description': 'Lodash modular utilities.',
                'dependencies': {}
            },
            'axios': {
                'name': 'axios',
                'version': '1.6.2',
                'description': 'Promise based HTTP client for the browser and node.js',
                'dependencies': {
                    'follow-redirects': '^1.15.0',
                    'form-data': '^4.0.0'
                }
            },
            'typescript': {
                'name': 'typescript',
                'version': '5.3.3',
                'description': 'TypeScript is a language for application scale JavaScript development',
                'dependencies': {}
            },
            'webpack': {
                'name': 'webpack',
                'version': '5.89.0',
                'description': 'Packs CommonJs/AMD modules for the browser.',
                'dependencies': {
                    '@types/node': '*',
                    'tapable': '^2.2.0',
                    'terser-webpack-plugin': '^5.3.9'
                }
            },
            'loose-envify': {
                'name': 'loose-envify',
                'version': '1.4.0',
                'description': 'Fast (and loose) selective `process.env` replacer',
                'dependencies': {
                    'js-tokens': '^3.0.0 || ^4.0.0'
                }
            },
            'accepts': {
                'name': 'accepts',
                'version': '1.3.8',
                'description': 'Higher-level content negotiation',
                'dependencies': {
                    'mime-types': '~2.1.34'
                }
            },
            'body-parser': {
                'name': 'body-parser',
                'version': '1.20.1',
                'description': 'Node.js body parsing middleware',
                'dependencies': {}
            }
        },
        'pypi': {
            'requests': {
                'name': 'requests',
                'version': '2.31.0',
                'description': 'Python HTTP for Humans.',
                'dependencies': {
                    'charset-normalizer': '>=2,<4',
                    'idna': '>=2.5,<4',
                    'urllib3': '>=1.21.1,<3'
                }
            },
            'flask': {
                'name': 'flask',
                'version': '3.0.0',
                'description': 'A simple framework for building complex web applications.',
                'dependencies': {
                    'Werkzeug': '>=3.0.0',
                    'Jinja2': '>=3.1.2',
                    'click': '>=8.1.3'
                }
            },
            'django': {
                'name': 'django',
                'version': '5.0.0',
                'description': 'A high-level Python web framework',
                'dependencies': {
                    'asgiref': '>=3.7.0,<4',
                    'sqlparse': '>=0.3.1'
                }
            },
            'numpy': {
                'name': 'numpy',
                'version': '1.26.2',
                'description': 'Fundamental package for array computing in Python',
                'dependencies': {}
            },
            'pandas': {
                'name': 'pandas',
                'version': '2.1.4',
                'description': 'Powerful data structures for data analysis',
                'dependencies': {
                    'numpy': '>=1.23.2',
                    'python-dateutil': '>=2.8.2',
                    'pytz': '>=2020.1'
                }
            },
            'pytest': {
                'name': 'pytest',
                'version': '7.4.3',
                'description': 'pytest: simple powerful testing with Python',
                'dependencies': {
                    'pluggy': '>=0.12,<2.0',
                    'packaging': '*'
                }
            },
            'Werkzeug': {
                'name': 'Werkzeug',
                'version': '3.0.1',
                'description': 'The comprehensive WSGI web application library.',
                'dependencies': {}
            },
            'Jinja2': {
                'name': 'Jinja2',
                'version': '3.1.2',
                'description': 'A very fast and expressive template engine.',
                'dependencies': {
                    'MarkupSafe': '>=2.0'
                }
            }
        }
    }
    
    def __init__(self):
        self.session = None
        self.cache = {}
    
    async def get_package_info(
        self,
        registry_type: str,
        package_name: str,
        version: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get package information from registry
        
        Args:
            registry_type: 'npm' or 'pypi'
            package_name: Name of the package
            version: Optional version, defaults to latest
        
        Returns:
            Package metadata dict or None if not found
        """
        cache_key = f"{registry_type}:{package_name}:{version or 'latest'}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Check mock data first
        if registry_type in self.MOCK_PACKAGES:
            if package_name.lower() in self.MOCK_PACKAGES[registry_type]:
                pkg_data = self.MOCK_PACKAGES[registry_type][package_name.lower()]
                self.cache[cache_key] = pkg_data
                return pkg_data
        
        # Try real registry (with fallback)
        try:
            if registry_type == 'npm':
                return await self._fetch_npm_package(package_name, version)
            elif registry_type == 'pypi':
                return await self._fetch_pypi_package(package_name, version)
        except Exception as e:
            logger.error(f"Error fetching from {registry_type}: {e}")
        
        return None
    
    async def search(
        self,
        registry_type: str,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search for packages in registry"""
        # Return mock search results
        results = []
        
        if registry_type in self.MOCK_PACKAGES:
            packages = self.MOCK_PACKAGES[registry_type]
            for pkg_name, pkg_data in packages.items():
                if query.lower() in pkg_name.lower() or query.lower() in pkg_data.get('description', '').lower():
                    results.append({
                        'name': pkg_data['name'],
                        'version': pkg_data['version'],
                        'description': pkg_data['description']
                    })
                    if len(results) >= limit:
                        break
        
        return results
    
    async def _fetch_npm_package(
        self,
        package_name: str,
        version: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Fetch package info from npm registry"""
        url = f"https://registry.npmjs.org/{package_name}"
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            async with self.session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Get specific version or latest
                    if version and version in data.get('versions', {}):
                        version_data = data['versions'][version]
                    else:
                        latest_version = data.get('dist-tags', {}).get('latest')
                        version_data = data.get('versions', {}).get(latest_version, {})
                    
                    return {
                        'name': package_name,
                        'version': version_data.get('version', version or '0.0.0'),
                        'description': version_data.get('description', ''),
                        'dependencies': version_data.get('dependencies', {}),
                        'devDependencies': version_data.get('devDependencies', {})
                    }
        except Exception as e:
            logger.warning(f"Failed to fetch npm package {package_name}: {e}")
        
        return None
    
    async def _fetch_pypi_package(
        self,
        package_name: str,
        version: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Fetch package info from PyPI"""
        if version:
            url = f"https://pypi.org/pypi/{package_name}/{version}/json"
        else:
            url = f"https://pypi.org/pypi/{package_name}/json"
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            async with self.session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    info = data.get('info', {})
                    
                    # Parse dependencies from requires_dist
                    dependencies = {}
                    for req in info.get('requires_dist', []) or []:
                        if ';' in req:  # Skip conditional dependencies
                            req = req.split(';')[0].strip()
                        match = req.split('(')[0].strip() if '(' in req else req
                        parts = match.split()
                        if parts:
                            dep_name = parts[0]
                            dep_version = parts[1] if len(parts) > 1 else '*'
                            dependencies[dep_name] = dep_version
                    
                    return {
                        'name': package_name,
                        'version': info.get('version', version or '0.0.0'),
                        'description': info.get('summary', ''),
                        'dependencies': dependencies
                    }
        except Exception as e:
            logger.warning(f"Failed to fetch PyPI package {package_name}: {e}")
        
        return None
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None
