import bcrypt
from typing import Optional, Dict
from datetime import datetime
from database.db import db

class User:
    def __init__(self, id: int, username: str, email: str, password_hash: str, 
                 created_at: datetime, updated_at: datetime):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.created_at = created_at
        self.updated_at = updated_at
    
    def to_dict(self) -> Dict:
        """Convert user to dictionary (without password)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def create(username: str, email: str, password: str) -> Optional['User']:
        """Create new user"""
        conn = db.get_connection()
        cursor = conn.cursor()
        
        password_hash = User.hash_password(password)
        
        try:
            cursor.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                (username, email, password_hash)
            )
            conn.commit()
            
            user_id = cursor.lastrowid
            return User.get_by_id(user_id)
        except Exception as e:
            conn.rollback()
            raise e
    
    @staticmethod
    def get_by_id(user_id: int) -> Optional['User']:
        """Get user by ID"""
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        
        if row:
            return User(**dict(row))
        return None
    
    @staticmethod
    def get_by_email(email: str) -> Optional['User']:
        """Get user by email"""
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if row:
            return User(**dict(row))
        return None
    
    @staticmethod
    def get_by_username(username: str) -> Optional['User']:
        """Get user by username"""
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if row:
            return User(**dict(row))
        return None
    
    @staticmethod
    def authenticate(email: str, password: str) -> Optional['User']:
        """Authenticate user with email and password"""
        user = User.get_by_email(email)
        
        if user and User.verify_password(password, user.password_hash):
            return user
        return None
