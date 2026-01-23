import sqlite3
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_path: str = "flux_ide.db"):
        """Initialize database connection"""
        self.db_path = db_path
        self.connection: Optional[sqlite3.Connection] = None
        
    def connect(self):
        """Connect to the database"""
        if not self.connection:
            self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
            self.connection.row_factory = sqlite3.Row
            logger.info(f"Connected to database: {self.db_path}")
        return self.connection
    
    def initialize(self):
        """Initialize database with schema"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Read and execute schema
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            cursor.executescript(schema_sql)
        
        conn.commit()
        logger.info("Database initialized successfully")
    
    def get_connection(self):
        """Get database connection"""
        if not self.connection:
            self.connect()
        return self.connection
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
            logger.info("Database connection closed")

# Global database instance
db = Database()
