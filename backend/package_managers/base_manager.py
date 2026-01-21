"""
Base Package Manager - Abstract interface for all package managers
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class Package:
    """Represents a package"""
    name: str
    version: str
    description: str = ""
    dependencies: Dict[str, str] = None
    dev_dependencies: Dict[str, str] = None
    installed: bool = False
    install_time: Optional[datetime] = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = {}
        if self.dev_dependencies is None:
            self.dev_dependencies = {}


@dataclass
class InstallResult:
    """Result of a package installation"""
    success: bool
    package: Optional[Package]
    installed_packages: List[Package]
    errors: List[str]
    warnings: List[str]
    output_lines: List[str]
    
    
@dataclass
class DependencyConflict:
    """Represents a dependency conflict"""
    package: str
    required_version: str
    installed_version: str
    required_by: List[str]


class BasePackageManager(ABC):
    """Abstract base class for package managers"""
    
    def __init__(self, virtual_fs: 'VirtualFileSystem'):
        self.virtual_fs = virtual_fs
        self.installed_packages: Dict[str, Package] = {}
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    async def install(
        self, 
        package_name: str, 
        version: Optional[str] = None,
        save_dev: bool = False,
        global_install: bool = False
    ) -> InstallResult:
        """Install a package"""
        pass
    
    @abstractmethod
    async def uninstall(self, package_name: str) -> InstallResult:
        """Uninstall a package"""
        pass
    
    @abstractmethod
    async def list_packages(self, depth: int = 0) -> List[Package]:
        """List installed packages"""
        pass
    
    @abstractmethod
    async def update(self, package_name: Optional[str] = None) -> InstallResult:
        """Update packages"""
        pass
    
    @abstractmethod
    async def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search for packages in registry"""
        pass
    
    @abstractmethod
    def get_install_command(self, package_name: str, version: Optional[str] = None) -> str:
        """Get the install command string"""
        pass
    
    @abstractmethod
    def parse_version_specifier(self, version_spec: str) -> tuple:
        """Parse version specifier like ^1.0.0, ~2.3.4, >=1.2.3"""
        pass
