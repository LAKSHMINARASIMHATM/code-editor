"""
Virtual File System - Simulates a file system for projects
"""
import json
from typing import Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)


class VirtualFileSystem:
    """
    Virtual file system for managing project files in memory
    """
    
    def __init__(self):
        self.files: Dict[str, str] = {}
        self._init_default_files()
    
    def _init_default_files(self):
        """Initialize with default project files"""
        # Default package.json
        self.files['package.json'] = json.dumps({
            "name": "flux-ide-project",
            "version": "1.0.0",
            "description": "A project created in Flux IDE",
            "main": "index.js",
            "scripts": {
                "start": "node index.js",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            "dependencies": {},
            "devDependencies": {}
        }, indent=2)
        
        # Default requirements.txt
        self.files['requirements.txt'] = ""
        
        # Default index.js
        self.files['index.js'] = "console.log('Hello from Flux IDE!');\n"
        
        # Default README.md
        self.files['README.md'] = "# Flux IDE Project\n\nCreated with Flux IDE\n"
    
    async def read_file(self, path: str) -> Optional[str]:
        """Read a file from the virtual filesystem"""
        return self.files.get(path)
    
    async def write_file(self, path: str, content: str):
        """Write a file to the virtual filesystem"""
        self.files[path] = content
        logger.info(f"Wrote file: {path}")
    
    async def delete_file(self, path: str) -> bool:
        """Delete a file from the virtual filesystem"""
        if path in self.files:
            del self.files[path]
            logger.info(f"Deleted file: {path}")
            return True
        return False
    
    async def list_files(self) -> list:
        """List all files in the virtual filesystem"""
        return list(self.files.keys())
    
    async def file_exists(self, path: str) -> bool:
        """Check if a file exists"""
        return path in self.files
    
    async def read_json(self, path: str) -> Optional[Dict[str, Any]]:
        """Read and parse a JSON file"""
        content = await self.read_file(path)
        if content:
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON from {path}: {e}")
                return None
        return None
    
    async def write_json(self, path: str, data: Dict[str, Any]):
        """Write data as JSON to a file"""
        content = json.dumps(data, indent=2)
        await self.write_file(path, content)
    
    def reset(self):
        """Reset the filesystem to defaults"""
        self.files = {}
        self._init_default_files()
    
    def get_file_tree(self) -> Dict[str, Any]:
        """Get a tree representation of files"""
        tree = {}
        for path in self.files.keys():
            parts = path.split('/')
            current = tree
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    # It's a file
                    current[part] = {
                        'type': 'file',
                        'size': len(self.files[path])
                    }
                else:
                    # It's a directory
                    if part not in current:
                        current[part] = {'type': 'directory', 'children': {}}
                    current = current[part]['children']
        return tree
