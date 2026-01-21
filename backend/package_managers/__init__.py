"""
Package Managers Module
"""
from .base_manager import BasePackageManager, Package, InstallResult, DependencyConflict
from .npm_manager import NPMManager
from .pip_manager import PipManager

__all__ = [
    'BasePackageManager',
    'Package',
    'InstallResult',
    'DependencyConflict',
    'NPMManager',
    'PipManager'
]
