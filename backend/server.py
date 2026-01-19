import os
import pty
import termios
import struct
import fcntl
import asyncio
import logging
import socketio
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()

# Store active terminal sessions
terminal_sessions = {}
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

async def read_terminal_output(sid, master_fd):
    loop = asyncio.get_event_loop()
    while sid in terminal_sessions:
        try:
            # Non-blocking read from PTY
            output = await loop.run_in_executor(None, lambda: os.read(master_fd, 4096).decode(errors='replace'))
            if output:
                await sio.emit('terminal_output', {'output': output}, to=sid)
            else:
                break # EOF
        except (OSError, EOFError):
            break
        except Exception as e:
            logger.error(f"Terminal read error for {sid}: {e}")
            break
    
    if sid in terminal_sessions:
        cleanup_terminal(sid)

def cleanup_terminal(sid):
    if sid in terminal_sessions:
        session = terminal_sessions.pop(sid)
        try:
            os.close(session['master_fd'])
            session['process'].terminate()
        except:
            pass

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

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
    
    # Initialize real PTY for this session
    master_fd, slave_fd = pty.openpty()
    
    # Start bash in the PTY
    process = await asyncio.create_subprocess_exec(
        'bash',
        stdin=slave_fd,
        stdout=slave_fd,
        stderr=slave_fd,
        env=os.environ.copy(),
        preexec_fn=os.setsid
    )
    
    # Close slave_fd in parent
    os.close(slave_fd)
    
    terminal_sessions[sid] = {
        'master_fd': master_fd,
        'process': process
    }
    
    # Start reading task
    asyncio.create_task(read_terminal_output(sid, master_fd))
    
    await sio.emit('session_joined', {
        'userId': sid,
        'users': [{**user, 'id': uid, 'isLocal': uid == sid} for uid, user in active_users.items()]
    }, to=sid)
    
    await sio.emit('user_joined', active_users[sid], skip_sid=sid)

@sio.event
async def terminal_input(sid, data):
    if sid in terminal_sessions:
        master_fd = terminal_sessions[sid]['master_fd']
        os.write(master_fd, data.get('input', '').encode())

@sio.event
async def terminal_resize(sid, data):
    if sid in terminal_sessions:
        master_fd = terminal_sessions[sid]['master_fd']
        cols = data.get('cols', 80)
        rows = data.get('rows', 24)
        # Set window size for PTY
        s = struct.pack('HHHH', rows, cols, 0, 0)
        fcntl.ioctl(master_fd, termios.TIOCSWINSZ, s)

@sio.event
async def disconnect(sid):
    if sid in active_users:
        active_users.pop(sid)
        await sio.emit('user_left', {'userId': sid})
    cleanup_terminal(sid)

@sio.event
async def cursor_move(sid, data):
    if sid in active_users:
        active_users[sid]['cursor'] = data.get('cursor', {'line': 1, 'column': 0})
        await sio.emit('cursor_update', {'userId': sid, 'cursor': active_users[sid]['cursor']}, skip_sid=sid)

@sio.event
async def code_change(sid, data):
    await sio.emit('code_update', {
        'userId': sid,
        'operation': data.get('operation'),
        'file': data.get('file'),
        'content': data.get('content')
    }, skip_sid=sid)

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
