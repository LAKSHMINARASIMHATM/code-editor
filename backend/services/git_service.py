import subprocess
import os
import shutil
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class GitService:
    def __init__(self, base_path: str = "temp_repos"):
        """Initialize Git service"""
        self.base_path = base_path
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path)
            
    def clone_repository(self, url: str, target_dir: Optional[str] = None) -> Dict:
        """
        Clone a GitHub repository
        
        Args:
            url: Repository URL
            target_dir: Optional target directory name
            
        Returns:
            Dictionary with success status and message/path
        """
        if not target_dir:
            # Extract repo name from URL
            target_dir = url.split('/')[-1].replace('.git', '')
            
        repo_path = os.path.join(self.base_path, target_dir)
        
        # If directory already exists, remove it (or we could pull, but for now let's re-clone)
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path)
            
        try:
            logger.info(f"Cloning repository {url} to {repo_path}")
            result = subprocess.run(
                ["git", "clone", url, repo_path],
                capture_output=True,
                text=True,
                check=True
            )
            
            return {
                "success": True,
                "message": "Repository cloned successfully",
                "path": repo_path,
                "repo_name": target_dir
            }
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to clone repository: {e.stderr}")
            return {
                "success": False,
                "message": f"Failed to clone repository: {e.stderr}",
                "error": e.stderr
            }
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            return {
                "success": False,
                "message": f"An error occurred: {str(e)}",
                "error": str(e)
            }

    def get_repo_files(self, repo_path: str) -> Dict:
        """
        Get file structure of a cloned repository
        """
        files = {}
        file_list = []
        
        for root, dirs, filenames in os.walk(repo_path):
            # Skip .git directory
            if '.git' in dirs:
                dirs.remove('.git')
                
            for filename in filenames:
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, repo_path)
                
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        files[relative_path] = content
                        file_list.append(relative_path)
                except Exception as e:
                    logger.warning(f"Could not read file {full_path}: {e}")
                    
        return {
            "files": files,
            "fileList": file_list
        }

# Global Git service instance
git_service = GitService()
