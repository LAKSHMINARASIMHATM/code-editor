import os
import asyncio
import logging
import socketio
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

# Import package management modules
from filesystem.virtual_fs import VirtualFileSystem
from registry.registry_client import RegistryClient
from dependency.resolver import DependencyResolver
from package_managers.npm_manager import NPMManager
from package_managers.pip_manager import PipManager
from commands.executor import CommandExecutor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()

# Initialize package management system
virtual_fs = VirtualFileSystem()
registry_client = RegistryClient()
dependency_resolver = DependencyResolver(registry_client)
npm_manager = NPMManager(virtual_fs, registry_client, dependency_resolver)
pip_manager = PipManager(virtual_fs, registry_client, dependency_resolver)
command_executor = CommandExecutor(npm_manager, pip_manager, virtual_fs)

# Store active users and sessions
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
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def join_session(sid, data):
    user_name = data.get('name', f'User-{len(active_users) + 1}')
    color = user_colors[len(active_users) % len(user_colors)]
    avatar = get_avatar_url(len(active_users))
    
    initial_cursor = data.get('cursor', {'lineNumber': 1, 'column': 1})
    
    active_users[sid] = {
        'id': sid,
        'name': user_name,
        'color': color,
        'avatar': avatar,
        'cursor': initial_cursor,
        'isTyping': False
    }
    
    logger.info(f"User joined: {user_name} ({sid})")
    
    await sio.emit('session_joined', {
        'userId': sid,
        'users': [{**user, 'id': uid, 'isLocal': uid == sid} for uid, user in active_users.items()]
    }, to=sid)
    
    await sio.emit('user_joined', active_users[sid], skip_sid=sid)

@sio.event
async def terminal_command(sid, data):
    """Handle terminal command execution with package management"""
    command = data.get('command', '')
    logger.info(f"Terminal command from {sid}: {command}")
    
    try:
        # Execute command
        result = await command_executor.execute(command)
        
        # Send output back to client
        output = result['output']
        if result['error']:
            output += result['error']
        
        await sio.emit('terminal_output', {
            'output': output,
            'success': result['success']
        }, to=sid)
        
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        await sio.emit('terminal_output', {
            'output': f"\x1b[1;31mError: {str(e)}\x1b[0m\n",
            'success': False
        }, to=sid)

@sio.event
async def terminal_input(sid, data):
    """Handle terminal input - deprecated, use terminal_command instead"""
    input_text = data.get('input', '')
    logger.info(f"Terminal input from {sid}: {input_text[:50]}")
    
    # Route to terminal_command
    await terminal_command(sid, {'command': input_text})

@sio.event
async def terminal_resize(sid, data):
    """Handle terminal resize"""
    cols = data.get('cols', 80)
    rows = data.get('rows', 24)
    logger.info(f"Terminal resize from {sid}: {cols}x{rows}")

@sio.event
async def disconnect(sid):
    if sid in active_users:
        user_name = active_users[sid]['name']
        active_users.pop(sid)
        logger.info(f"User disconnected: {user_name} ({sid})")
        await sio.emit('user_left', {'userId': sid})

@sio.event
async def cursor_move(sid, data):
    if sid in active_users:
        active_users[sid]['cursor'] = data.get('cursor', {'lineNumber': 1, 'column': 0})
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
    await sio.emit('code_update', {
        'userId': sid,
        'operation': data.get('operation'),
        'file': data.get('file'),
        'content': data.get('content')
    }, skip_sid=sid)

@sio.event
async def chat_message(sid, data):
    """Handle chat messages between collaborators"""
    logger.info(f"Chat message from {sid}: {data.get('message', '')[:50]}")
    
    # Broadcast message to all users including sender
    await sio.emit('chat_message', {
        'userId': data.get('userId'),
        'userName': data.get('userName'),
        'userColor': data.get('userColor'),
        'userAvatar': data.get('userAvatar'),
        'message': data.get('message'),
        'timestamp': data.get('timestamp')
    })


# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app = socket_app

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting WebSocket server with Package Management on http://localhost:8000")
    logger.info("Supports: npm, pip, file system commands")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
