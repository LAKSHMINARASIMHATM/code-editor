from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
import socketio
import asyncio
import random


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Store active users and their session data
active_users = {}

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Store active users and their session data
active_users = {}
user_colors = [
    {'color': '#3B82F6', 'name': 'blue'},
    {'color': '#10B981', 'name': 'emerald'},
    {'color': '#F59E0B', 'name': 'amber'},
    {'color': '#EC4899', 'name': 'pink'},
    {'color': '#8B5CF6', 'name': 'violet'},
    {'color': '#06B6D4', 'name': 'cyan'},
    {'color': '#F97316', 'name': 'orange'},
    {'color': '#EF4444', 'name': 'red'},
]

def get_avatar_url(index):
    AVATAR_URLS = [
        "https://images.unsplash.com/photo-1615843423179-bea071facf96?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1650913406617-bd9b0ab07d07?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1648293821367-b39c09679658?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1740252117027-4275d3f84385?w=100&h=100&fit=crop",
    ]
    return AVATAR_URLS[index % len(AVATAR_URLS)]

@sio.event
async def join_session(sid, data):
    user_name = data.get('name', f'User-{len(active_users) + 1}')
    color = user_colors[len(active_users) % len(user_colors)]
    avatar = get_avatar_url(len(active_users))
    
    active_users[sid] = {
        'id': sid,
        'name': user_name,
        'color': color,
        'avatar': avatar,
        'cursor': {'line': 1, 'column': 0},
        'isTyping': False
    }
    
    # Send current users to the new user
    await sio.emit('session_joined', {
        'userId': sid,
        'users': [
            {**user, 'id': user_id, 'isLocal': user_id == sid}
            for user_id, user in active_users.items()
        ]
    }, to=sid)
    
    # Notify others about the new user
    await sio.emit('user_joined', active_users[sid], skip_sid=sid)
    
    logger.info(f"User joined: {user_name} ({sid})")

@sio.event
async def cursor_move(sid, data):
    if sid in active_users:
        active_users[sid]['cursor'] = data.get('cursor', {'line': 1, 'column': 0})
        # Broadcast cursor position to other users
        await sio.emit('cursor_update', {
            'userId': sid,
            'cursor': active_users[sid]['cursor']
        }, skip_sid=sid)

@sio.event
async def typing_status(sid, data):
    if sid in active_users:
        active_users[sid]['isTyping'] = data.get('isTyping', False)
        await sio.emit('typing_update', {
            'userId': sid,
            'isTyping': active_users[sid]['isTyping']
        }, skip_sid=sid)

@sio.event
async def code_change(sid, data):
    # Broadcast code changes to other users
    await sio.emit('code_update', {
        'userId': sid,
        'operation': data.get('operation'),
        'file': data.get('file'),
        'content': data.get('content')
    }, skip_sid=sid)

@sio.event
async def terminal_command(sid, data):
    command = data.get('command', '')
    logger.info(f"Terminal command from {sid}: {command}")
    
    # Simple command simulation
    output = ""
    if command.strip() == "ls":
        output = "main.js  utils.py  App.tsx  styles.css  README.md"
    elif command.strip().startswith("echo"):
        output = command.replace("echo", "").strip()
    elif command.strip() == "pwd":
        output = "/workspace"
    elif command.strip() == "whoami":
        output = active_users.get(sid, {}).get('name', 'user')
    elif command.strip() == "date":
        output = datetime.now().strftime("%a %b %d %H:%M:%S UTC %Y")
    elif command.strip() == "help":
        output = "Available commands: ls, pwd, whoami, date, echo, clear, help"
    elif command.strip() == "clear":
        output = "\x1b[2J\x1b[H"  # ANSI clear screen
    else:
        output = f"bash: {command.strip()}: command not found"
    
    await sio.emit('terminal_output', {
        'output': output + '\n'
    }, to=sid)

async def broadcast_users():
    users_list = [
        {**user, 'id': user_id}
        for user_id, user in active_users.items()
    ]
    await sio.emit('users_update', {'users': users_list})

# Include the router in the main app
app.include_router(api_router)

# Mount Socket.IO
socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path='/socket.io'
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Export socket_app as the main ASGI application
app = socket_app