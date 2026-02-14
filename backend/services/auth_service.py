import keyring
import logging
from typing import Optional, Dict
from cryptography.fernet import Fernet
import os

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, service_name: str = "FluxIDE"):
        self.service_name = service_name
        # In a real app, this key would be stored securely or derived from user login
        self.secret_key_path = ".flux/.auth_key"
        self._init_key()

    def _init_key(self):
        if not os.path.exists(".flux"):
            os.makedirs(".flux")
        
        if not os.path.exists(self.secret_key_path):
            key = Fernet.generate_key()
            with open(self.secret_key_path, "wb") as f:
                f.write(key)
        
        with open(self.secret_key_path, "rb") as f:
            self.key = f.read()
        self.cipher = Fernet(self.key)

    def store_token(self, platform: str, token: str, username: str = "default"):
        """Store a personal access token encrypted"""
        try:
            encrypted_token = self.cipher.encrypt(token.encode()).decode()
            keyring.set_password(f"{self.service_name}_{platform}", username, encrypted_token)
            logger.info(f"Successfully stored token for {platform} ({username})")
            return True
        except Exception as e:
            logger.error(f"Failed to store token: {e}")
            return False

    def get_token(self, platform: str, username: str = "default") -> Optional[str]:
        """Retrieve and decrypt a personal access token"""
        try:
            encrypted_token = keyring.get_password(f"{self.service_name}_{platform}", username)
            if encrypted_token:
                return self.cipher.decrypt(encrypted_token.encode()).decode()
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve token: {e}")
            return None

    def delete_token(self, platform: str, username: str = "default"):
        """Delete a stored token"""
        try:
            keyring.delete_password(f"{self.service_name}_{platform}", username)
            return True
        except Exception as e:
            logger.error(f"Failed to delete token: {e}")
            return False

# Global Auth Service instance
auth_service = AuthService()
