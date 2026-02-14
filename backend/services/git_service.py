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

    def pull(self, repo_path: str, remote: str = "origin", branch: str = None) -> Dict:
        try:
            if not branch:
                branch = self._get_current_branch(repo_path)
            
            subprocess.run(["git", "pull", remote, branch], cwd=repo_path, check=True)
            return {"success": True, "message": f"Pulled from {remote}/{branch}"}
        except subprocess.CalledProcessError as e:
            # Check for conflict
            if "conflict" in e.stdout.decode() or "conflict" in e.stderr.decode():
                return {"success": False, "error": "Merge conflict detected", "conflict": True}
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_branch(self, repo_path: str, branch_name: str) -> Dict:
        try:
            subprocess.run(["git", "checkout", "-b", branch_name], cwd=repo_path, check=True)
            return {"success": True, "message": f"Created and switched to branch {branch_name}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def checkout_branch(self, repo_path: str, branch_name: str) -> Dict:
        try:
            subprocess.run(["git", "checkout", branch_name], cwd=repo_path, check=True)
            return {"success": True, "message": f"Switched to branch {branch_name}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_branches(self, repo_path: str) -> Dict:
        try:
            result = subprocess.run(
                ["git", "branch", "--list"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                check=True
            )
            branches = [b.strip().replace('* ', '') for b in result.stdout.split('\n') if b]
            current = self._get_current_branch(repo_path)
            return {"success": True, "branches": branches, "current": current}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_status(self, repo_path: str) -> Dict:
        """
        Get git status including conflict detection
        """
        try:
            # Get staged files
            staged_result = subprocess.run(
                ["git", "diff", "--name-only", "--cached"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            staged_files = [f for f in staged_result.stdout.split('\n') if f]

            # Get unstaged/modified files
            unstaged_result = subprocess.run(
                ["git", "diff", "--name-only"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            unstaged_files = [f for f in unstaged_result.stdout.split('\n') if f]
            
            # Get untracked files
            untracked_result = subprocess.run(
                ["git", "ls-files", "--others", "--exclude-standard"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            untracked_files = [f for f in untracked_result.stdout.split('\n') if f]
            
            # Check for conflicts
            conflict_result = subprocess.run(
                ["git", "diff", "--name-only", "--diff-filter=U"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            conflicted_files = [f for f in conflict_result.stdout.split('\n') if f]

            return {
                "success": True,
                "staged": staged_files,
                "unstaged": list(set(unstaged_files + untracked_files) - set(conflicted_files)),
                "conflicted": conflicted_files,
                "branch": self._get_current_branch(repo_path)
            }
        except Exception as e:
            logger.error(f"Git status error: {e}")
            return {"success": False, "error": str(e)}

    def create_repository(self, name: str) -> Dict:
        """Create a new local repository"""
        repo_path = os.path.join(self.base_path, name)
        try:
            if os.path.exists(repo_path):
                return {"success": False, "error": "Repository already exists"}
            
            os.makedirs(repo_path)
            subprocess.run(["git", "init"], cwd=repo_path, check=True)
            
            # Create a first commit to establish 'main'
            with open(os.path.join(repo_path, "README.md"), "w") as f:
                f.write(f"# {name}\nCreated via Flux IDE")
            
            subprocess.run(["git", "add", "README.md"], cwd=repo_path, check=True)
            subprocess.run(["git", "commit", "-m", "Initial commit"], cwd=repo_path, check=True)
            
            return {"success": True, "message": f"Repository {name} created", "path": repo_path}
        except Exception as e:
            logger.error(f"Failed to create repo: {e}")
            return {"success": False, "error": str(e)}

    def delete_repository(self, name: str) -> Dict:
        """Delete a local repository"""
        repo_path = os.path.join(self.base_path, name)
        try:
            if not os.path.exists(repo_path):
                return {"success": False, "error": "Repository not found"}
            
            shutil.rmtree(repo_path)
            return {"success": True, "message": f"Repository {name} deleted"}
        except Exception as e:
            logger.error(f"Failed to delete repo: {e}")
            return {"success": False, "error": str(e)}

    def list_repositories(self) -> Dict:
        """List all managed repositories"""
        try:
            repos = []
            for item in os.listdir(self.base_path):
                path = os.path.join(self.base_path, item)
                if os.path.isdir(path) and os.path.exists(os.path.join(path, ".git")):
                    repos.append({
                        "name": item,
                        "path": path,
                        "branch": self._get_current_branch(path)
                    })
            return {"success": True, "repositories": repos}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def merge_branches(self, repo_path: str, source: str) -> Dict:
        """Merge a branch into the current one"""
        try:
            subprocess.run(["git", "merge", source], cwd=repo_path, check=True, capture_output=True)
            return {"success": True, "message": f"Merged {source} into current branch"}
        except subprocess.CalledProcessError as e:
            if "CONFLICT" in e.stdout.decode() or "CONFLICT" in e.stderr.decode():
                return {"success": False, "error": "Merge conflict detected", "conflict": True}
            return {"success": False, "error": e.stderr.decode()}

    def delete_branch(self, repo_path: str, branch_name: str, force: bool = False) -> Dict:
        """Delete a branch"""
        try:
            flag = "-D" if force else "-d"
            subprocess.run(["git", "branch", flag, branch_name], cwd=repo_path, check=True)
            return {"success": True, "message": f"Branch {branch_name} deleted"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _inject_credentials(self, url: str, token: str) -> str:
        """Inject token into HTTPS URL for authenticated operations"""
        if url.startswith("https://") and token:
            parts = url.split("https://")
            return f"https://oauth2:{token}@{parts[1]}"
        return url

# Global Git service instance
git_service = GitService()
