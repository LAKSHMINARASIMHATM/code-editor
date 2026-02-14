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
            },
            'eslint': {
                'name': 'ESLint',
                'version': '2.4.0',
                'description': 'JavaScript linter for code quality',
                'author': 'Microsoft',
                'downloads': '50M',
                'rating': 4.8,
                'category': 'formatters',
                'icon': '🔍',
                'dependencies': {}
            },
            'prettier': {
                'name': 'Prettier',
                'version': '9.0.0',
                'description': 'Opinionated code formatter',
                'author': 'Prettier',
                'downloads': '40M',
                'rating': 4.9,
                'category': 'formatters',
                'icon': '✨',
                'dependencies': {}
            },
            'python': {
                'name': 'Python',
                'version': '2024.1.0',
                'description': 'Python language support with IntelliSense',
                'author': 'Microsoft',
                'downloads': '80M',
                'rating': 4.9,
                'category': 'languages',
                'icon': '🐍',
                'dependencies': {}
            },
            'gitlens': {
                'name': 'GitLens',
                'version': '14.0.0',
                'description': 'Git supercharged',
                'author': 'GitKraken',
                'downloads': '20M',
                'rating': 4.7,
                'category': 'productivity',
                'icon': '🔎',
                'dependencies': {}
            },
            'docker': {
                'name': 'Docker',
                'version': '1.28.0',
                'description': 'Docker support for VS Code',
                'author': 'Microsoft',
                'downloads': '22M',
                'rating': 4.8,
                'category': 'productivity',
                'icon': '🐳',
                'dependencies': {}
            },
            'react-snippets': {
                'name': 'React Snippets',
                'version': '4.4.3',
                'description': 'ES7+ React/Redux snippets',
                'author': 'dsznajder',
                'downloads': '15M',
                'rating': 4.8,
                'category': 'snippets',
                'icon': '⚛️',
                'dependencies': {}
            },
            'auto-rename-tag': {
                'name': 'Auto Rename Tag',
                'version': '0.1.10',
                'description': 'Auto rename paired HTML/XML tag',
                'author': 'Jun Han',
                'downloads': '12M',
                'rating': 4.6,
                'category': 'productivity',
                'icon': '🏷️',
                'dependencies': {}
            },
            'bracket-colorizer': {
                'name': 'Bracket Pair Colorizer',
                'version': '2.0.2',
                'description': 'Colorize matching brackets',
                'author': 'CoenraadS',
                'downloads': '8M',
                'rating': 4.7,
                'category': 'productivity',
                'icon': '🌈',
                'dependencies': {}
            },
            'live-server': {
                'name': 'Live Server',
                'version': '5.7.9',
                'description': 'Launch a local dev server with live reload',
                'author': 'Ritwick Dey',
                'downloads': '45M',
                'rating': 4.9,
                'category': 'productivity',
                'icon': '🚀',
                'dependencies': {}
            },
            'material-icons': {
                'name': 'Material Icon Theme',
                'version': '4.32.0',
                'description': 'Material Design icons for files',
                'author': 'Philipp Kief',
                'downloads': '25M',
                'rating': 4.8,
                'category': 'themes',
                'icon': '📁',
                'dependencies': {}
            },
            'one-dark': {
                'name': 'One Dark Pro',
                'version': '3.16.0',
                'description': 'Atom One Dark theme for VS Code',
                'author': 'binaryify',
                'downloads': '18M',
                'rating': 4.7,
                'category': 'themes',
                'icon': '🎨',
                'dependencies': {}
            },
            'dracula': {
                'name': 'Dracula Theme',
                'version': '2.24.3',
                'description': 'Dark theme for VS Code',
                'author': 'Dracula Theme',
                'downloads': '10M',
                'rating': 4.8,
                'category': 'themes',
                'icon': '🧛',
                'dependencies': {}
            },
            'tailwind': {
                'name': 'Tailwind CSS IntelliSense',
                'version': '0.11.0',
                'description': 'Tailwind CSS class autocomplete',
                'author': 'Tailwind Labs',
                'downloads': '12M',
                'rating': 4.9,
                'category': 'languages',
                'icon': '💨',
                'dependencies': {}
            },
            'debugger-chrome': {
                'name': 'Debugger for Chrome',
                'version': '4.13.0',
                'description': 'Debug JavaScript in Chrome',
                'author': 'Microsoft',
                'downloads': '30M',
                'rating': 4.6,
                'category': 'debuggers',
                'icon': '🐛',
                'dependencies': {}
            },
            'path-intellisense': {
                'name': 'Path Intellisense',
                'version': '2.8.5',
                'description': 'Autocomplete file paths',
                'author': 'Christian Kohler',
                'downloads': '8M',
                'rating': 4.7,
                'category': 'productivity',
                'icon': '📂',
                'dependencies': {}
            },
            'import-cost': {
                'name': 'Import Cost',
                'version': '3.3.0',
                'description': 'Display import/require package size',
                'author': 'Wix',
                'downloads': '4M',
                'rating': 4.4,
                'category': 'productivity',
                'icon': '📊',
                'dependencies': {}
            },
            'github-copilot': {
                'name': 'GitHub Copilot',
                'version': '1.150.0',
                'description': 'AI pair programmer',
                'author': 'GitHub',
                'downloads': '10M',
                'rating': 4.7,
                'category': 'productivity',
                'icon': '🤖',
                'dependencies': {}
            },
            'code-runner': {
                'name': 'Code Runner',
                'version': '0.12.1',
                'description': 'Run code snippet in multiple languages',
                'author': 'Jun Han',
                'downloads': '35M',
                'rating': 4.8,
                'category': 'productivity',
                'icon': '▶️',
                'dependencies': {}
            },
            'todo-highlight': {
                'name': 'TODO Highlight',
                'version': '2.0.5',
                'description': 'Highlight TODOs and FIXMEs in your code.',
                'author': 'Wayou Liu',
                'downloads': '2M',
                'rating': 4.7,
                'category': 'productivity',
                'icon': '📝',
                'dependencies': {}
            },
            'vscode-icons': {
                'name': 'vscode-icons',
                'version': '12.6.0',
                'description': 'Icons for VS Code',
                'author': 'VSCode Icons Team',
                'downloads': '20M',
                'rating': 4.9,
                'category': 'themes',
                'icon': '🎭',
                'dependencies': {}
            },
            'git-graph': {
                'name': 'Git Graph',
                'version': '1.30.0',
                'description': 'View a Git Graph of your repository, and perform Git actions from the graph.',
                'author': 'mhutchie',
                'downloads': '5M',
                'rating': 4.9,
                'category': 'productivity',
                'icon': '📊',
                'dependencies': {}
            },
            'error-lens': {
                'name': 'Error Lens',
                'version': '3.16.0',
                'description': 'Improve highlighting of errors, warnings and other language diagnostics.',
                'author': 'Alexander',
                'downloads': '3M',
                'rating': 4.8,
                'category': 'productivity',
                'icon': '👁️',
                'dependencies': {}
            },
            'thunder-client': {
                'name': 'Thunder Client',
                'version': '2.12.0',
                'description': 'Lightweight Rest Client for VS Code',
                'author': 'Ranga Vadhineni',
                'downloads': '4M',
                'rating': 4.7,
                'category': 'productivity',
                'icon': '⚡',
                'dependencies': {}
            },
            'tabnine': {
                'name': 'Tabnine AI',
                'version': '5.0.0',
                'description': 'AI Code Completion',
                'author': 'Tabnine',
                'downloads': '10M',
                'rating': 4.6,
                'category': 'productivity',
                'icon': '🤖',
                'dependencies': {}
            },
            'remote-ssh': {
                'name': 'Remote - SSH',
                'version': '0.107.0',
                'description': 'Open any folder on a remote machine using SSH.',
                'author': 'Microsoft',
                'downloads': '15M',
                'rating': 4.8,
                'category': 'productivity',
                'icon': '🌐',
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
                        'description': pkg_data['description'],
                        'author': pkg_data.get('author', 'Unknown'),
                        'category': pkg_data.get('category', 'library'),
                        'downloads': pkg_data.get('downloads', '0'),
                        'rating': pkg_data.get('rating', 0),
                        'icon': pkg_data.get('icon', '📦')
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
