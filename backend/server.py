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
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# WebSocket event handlers
@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    
@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")
    if sid in active_users:
        user_data = active_users[sid]
        del active_users[sid]
        # Notify other users
        await sio.emit('user_left', {
            'userId': sid,
            'userName': user_data['name']
        }, skip_sid=sid)
        # Broadcast updated user list
        await broadcast_users()

@sio.event
async def join_session(sid, data):
    user_name = data.get('name', f'User-{len(active_users) + 1}')
    color = user_colors[len(active_users) % len(user_colors)]
    
    active_users[sid] = {
        'id': sid,
        'name': user_name,
        'color': color,
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