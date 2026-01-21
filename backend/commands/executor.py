"""
Command Execution Engine - Parses and executes terminal commands
"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class CommandExecutor:
    """
    Executes terminal commands with package management support
    """
    
    def __init__(self, npm_manager, pip_manager, virtual_fs):
        self.npm_manager = npm_manager
        self.pip_manager = pip_manager
        self.virtual_fs = virtual_fs
        self.command_history = []
        self.current_directory = "/"
    
    async def execute(self, command: str) -> Dict:
        """
        Execute a terminal command and return result
        
        Returns:
            Dict with 'output', 'error', 'success' keys
        """
        command = command.strip()
        
        if not command:
            return {'output': '', 'error': '', 'success': True}
        
        # Add to history
        self.command_history.append({
            'command': command,
            'timestamp': datetime.now()
        })
        
        # Parse command
        parts = command.split()
        cmd = parts[0].lower()
        args = parts[1:] if len(parts) > 1 else []
        
        # Route to appropriate handler
        if cmd in ['npm', 'yarn', 'pnpm']:
            return await self._handle_npm_command(cmd, args)
        elif cmd in ['pip', 'pip3', 'python', 'python3'] and (args and args[0] in ['-m', 'pip']):
            # Handle "python -m pip install ..." format
            if args[0] == '-m' and len(args) > 1 and args[1] == 'pip':
                return await self._handle_pip_command(args[1], args[2:])
            return await self._handle_pip_command(cmd, args)
        elif cmd == 'ls' or cmd == 'dir':
            return await self._handle_ls()
        elif cmd == 'cat' or cmd == 'type':
            return await self._handle_cat(args)
        elif cmd == 'clear' or cmd == 'cls':
            return {'output': '\x1b[2J\x1b[H', 'error': '', 'success': True}
        elif cmd == 'pwd':
            return {'output': self.current_directory + '\n', 'error': '', 'success': True}
        elif cmd == 'help':
            return await self._handle_help()
        elif cmd == 'history':
            return await self._handle_history()
        elif cmd == 'echo':
            return {'output': ' '.join(args) + '\n', 'error': '', 'success': True}
        else:
            return {
                'output': '',
                'error': f"bash: {cmd}: command not found\n",
                'success': False
            }
    
    async def _handle_npm_command(self, cmd: str, args: List[str]) -> Dict:
        """Handle npm/yarn/pnpm commands"""
        if not args:
            return {
                'output': 'Usage: npm <command>\n\nCommon commands:\n  install, i          Install packages\n  uninstall, remove   Remove a package\n  list, ls            List installed packages\n  update              Update packages\n  search              Search for packages\n',
                'error': '',
                'success': True
            }
        
        subcmd = args[0]
        rest_args = args[1:]
        
        try:
            if subcmd in ['install', 'i', 'add']:
                return await self._npm_install(rest_args)
            elif subcmd in ['uninstall', 'remove', 'rm', 'un']:
                return await self._npm_uninstall(rest_args)
            elif subcmd in ['list', 'ls']:
                return await self._npm_list(rest_args)
            elif subcmd in ['update', 'upgrade']:
                return await self._npm_update(rest_args)
            elif subcmd == 'search':
                return await self._npm_search(rest_args)
            else:
                return {
                    'output': '',
                    'error': f"npm ERR! Unknown command: \"{subcmd}\"\n",
                    'success': False
                }
        except Exception as e:
            logger.error(f"NPM command error: {e}")
            return {
                'output': '',
                'error': f"npm ERR! {str(e)}\n",
                'success': False
            }
    
    async def _handle_pip_command(self, cmd: str, args: List[str]) -> Dict:
        """Handle pip commands"""
        if not args:
            return {
                'output': 'Usage:\n  pip <command> [options]\n\nCommands:\n  install      Install packages\n  uninstall    Uninstall packages\n  list         List installed packages\n  search       Search PyPI\n',
                'error': '',
                'success': True
            }
        
        subcmd = args[0]
        rest_args = args[1:]
        
        try:
            if subcmd == 'install':
                return await self._pip_install(rest_args)
            elif subcmd == 'uninstall':
                return await self._pip_uninstall(rest_args)
            elif subcmd == 'list':
                return await self._pip_list(rest_args)
            elif subcmd == 'search':
                return await self._pip_search(rest_args)
            else:
                return {
                    'output': '',
                    'error': f"ERROR: unknown command \"{subcmd}\"\n",
                    'success': False
                }
        except Exception as e:
            logger.error(f"Pip command error: {e}")
            return {
                'output': '',
                'error': f"ERROR: {str(e)}\n",
                'success': False
            }
    
    async def _npm_install(self, args: List[str]) -> Dict:
        """Handle npm install"""
        if not args:
            # Install from package.json
            return {
                'output': 'Installing from package.json...\n\nup to date in 0.5s\n',
                'error': '',
                'success': True
            }
        
        # Parse flags and package name
        save_dev = '--save-dev' in args or '-D' in args
        global_install = '--global' in args or '-g' in args
        
        # Remove flags
        package_args = [a for a in args if not a.startswith('-')]
        
        if not package_args:
            return {'output': '', 'error': 'No package specified\n', 'success': False}
        
        package_spec = package_args[0]
        
        # Parse package@version
        if '@' in package_spec and not package_spec.startswith('@'):
            package_name, version = package_spec.split('@', 1)
        else:
            package_name = package_spec
            version = None
        
        result = await self.npm_manager.install(
            package_name,
            version,
            save_dev=save_dev,
            global_install=global_install
        )
        
        output = '\n'.join(result.output_lines)
        if result.warnings:
            output += '\n' + '\n'.join(result.warnings)
        
        return {
            'output': output + '\n',
            'error': '\n'.join(result.errors) if result.errors else '',
            'success': result.success
        }
    
    async def _npm_uninstall(self, args: List[str]) -> Dict:
        """Handle npm uninstall"""
        if not args:
            return {'output': '', 'error': 'No package specified\n', 'success': False}
        
        package_name = args[0]
        result = await self.npm_manager.uninstall(package_name)
        
        return {
            'output': '\n'.join(result.output_lines) + '\n',
            'error': '\n'.join(result.errors) if result.errors else '',
            'success': result.success
        }
    
    async def _npm_list(self, args: List[str]) -> Dict:
        """Handle npm list"""
        packages = await self.npm_manager.list_packages()
        
        if not packages:
            output = "flux-ide-project@1.0.0\n└── (empty)\n"
        else:
            output = "flux-ide-project@1.0.0\n"
            for i, pkg in enumerate(packages):
                prefix = "└──" if i == len(packages) - 1 else "├──"
                output += f"{prefix} {pkg.name}@{pkg.version}\n"
        
        return {'output': output, 'error': '', 'success': True}
    
    async def _npm_update(self, args: List[str]) -> Dict:
        """Handle npm update"""
        package_name = args[0] if args else None
        result = await self.npm_manager.update(package_name)
        
        return {
            'output': '\n'.join(result.output_lines) + '\n',
            'error': '',
            'success': True
        }
    
    async def _npm_search(self, args: List[str]) -> Dict:
        """Handle npm search"""
        if not args:
            return {'output': '', 'error': 'No search term specified\n', 'success': False}
        
        query = ' '.join(args)
        results = await self.npm_manager.search(query)
        
        if not results:
            output = "No matches found\n"
        else:
            output = "NAME                      | DESCRIPTION\n"
            output += "-" * 60 + "\n"
            for result in results[:10]:
                name = result['name'][:24].ljust(24)
                desc = result['description'][:33]
                output += f"{name} | {desc}\n"
        
        return {'output': output, 'error': '', 'success': True}
    
    async def _pip_install(self, args: List[str]) -> Dict:
        """Handle pip install"""
        if not args:
            return {'output': '', 'error': 'ERROR: You must give at least one requirement to install\n', 'success': False}
        
        package_spec = args[0]
        
        # Parse package==version
        if '==' in package_spec:
            package_name, version = package_spec.split('==', 1)
        else:
            package_name = package_spec
            version = None
        
        result = await self.pip_manager.install(package_name, version)
        
        return {
            'output': '\n'.join(result.output_lines) + '\n',
            'error': '\n'.join(result.errors) if result.errors else '',
            'success': result.success
        }
    
    async def _pip_uninstall(self, args: List[str]) -> Dict:
        """Handle pip uninstall"""
        if not args:
            return {'output': '', 'error': 'ERROR: You must give at least one requirement to uninstall\n', 'success': False}
        
        package_name = args[0]
        result = await self.pip_manager.uninstall(package_name)
        
        return {
            'output': '\n'.join(result.output_lines) + '\n',
            'error': '\n'.join(result.errors) if result.errors else '',
            'success': result.success
        }
    
    async def _pip_list(self, args: List[str]) -> Dict:
        """Handle pip list"""
        packages = await self.pip_manager.list_packages()
        
        output = "Package    Version\n"
        output += "---------- -------\n"
        for pkg in packages:
            output += f"{pkg.name.ljust(10)} {pkg.version}\n"
        
        return {'output': output, 'error': '', 'success': True}
    
    async def _pip_search(self, args: List[str]) -> Dict:
        """Handle pip search"""
        if not args:
            return {'output': '', 'error': 'ERROR: Missing required argument (search query)\n', 'success': False}
        
        query = ' '.join(args)
        results = await self.pip_manager.search(query)
        
        if not results:
            output = "No results found\n"
        else:
            for result in results[:10]:
                output = ""
                output += f"{result['name']} ({result['version']})\n"
                output += f"  {result['description']}\n"
        
        return {'output': output, 'error': '', 'success': True}
    
    async def _handle_ls(self) -> Dict:
        """List files"""
        files = await self.virtual_fs.list_files()
        output = '\n'.join(files) + '\n' if files else ''
        return {'output': output, 'error': '', 'success': True}
    
    async def _handle_cat(self, args: List[str]) -> Dict:
        """Display file contents"""
        if not args:
            return {'output': '', 'error': 'cat: missing file operand\n', 'success': False}
        
        filename = args[0]
        content = await self.virtual_fs.read_file(filename)
        
        if content is None:
            return {
                'output': '',
                'error': f"cat: {filename}: No such file or directory\n",
                'success': False
            }
        
        return {'output': content + '\n', 'error': '', 'success': True}
    
    async def _handle_help(self) -> Dict:
        """Show help"""
        help_text = """
\x1b[1mFlux IDE Terminal\x1b[0m

\x1b[1mPackage Management:\x1b[0m
  npm install <package>     Install npm package
  npm uninstall <package>   Uninstall npm package
  npm list                  List installed npm packages
  npm search <query>        Search npm registry
  
  pip install <package>     Install Python package
  pip uninstall <package>   Uninstall Python package
  pip list                  List installed Python packages

\x1b[1mFile System:\x1b[0m
  ls, dir                   List files
  cat <file>                Display file contents
  pwd                       Print working directory

\x1b[1mOther:\x1b[0m
  clear, cls                Clear terminal
  history                   Show command history
  help                      Show this help message
  echo <text>               Print text
"""
        return {'output': help_text, 'error': '', 'success': True}
    
    async def _handle_history(self) -> Dict:
        """Show command history"""
        output = ""
        for i, cmd in enumerate(self.command_history[-50:], 1):
            output += f"  {i}  {cmd['command']}\n"
        return {'output': output, 'error': '', 'success': True}
