import os
import asyncio
import logging
from datetime import datetime
import socketio
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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

# Import AI service
try:
    from services.ai_service import AIService
    from services.git_service import git_service
    from services.auth_service import auth_service
    ai_service = AIService()
    AI_ENABLED = True
    logger.info("✓ AI Assistant enabled (Hugging Face - Llama 3.1)")
except Exception as e:
    AI_ENABLED = False
    ai_service = None
    logger.warning(f"AI Assistant disabled: {str(e)}")

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

@sio.event
async def extension_install(sid, data):
    """Handle extension installation"""
    extension = data.get('extension')
    if not extension:
        return

    logger.info(f"Installing extension request from {sid}: {extension.get('name')}")
    
    # Path for storing extensions configuration
    ext_config_path = ".flux/extensions.json"
    
    # Read existing extensions
    current_config = await virtual_fs.read_json(ext_config_path) or {"extensions": []}
    
    # Check if already installed
    existing = next((e for e in current_config['extensions'] if e['id'] == extension['id']), None)
    if not existing:
        current_config['extensions'].append({**extension, 'installedBy': sid, 'installedAt': str(datetime.now())})
        await virtual_fs.write_json(ext_config_path, current_config)
        
        # Broadcast update to all clients
        await sio.emit('extensions_update', {
            'extensions': current_config['extensions']
        })
        
        # Send detailed log to installer
        await sio.emit('terminal_output', {
            'output': f"\x1b[1;32m✓ Extension '{extension.get('name')}' installed successfully.\x1b[0m\n",
            'success': True
        }, to=sid)

@sio.event
async def extension_uninstall(sid, data):
    """Handle extension uninstallation"""
    ext_id = data.get('id')
    if not ext_id:
        return

    logger.info(f"Uninstalling extension request from {sid}: {ext_id}")
    
    ext_config_path = ".flux/extensions.json"
    current_config = await virtual_fs.read_json(ext_config_path)
    
    if current_config and 'extensions' in current_config:
        # Filter out the extension
        config_len = len(current_config['extensions'])
        current_config['extensions'] = [e for e in current_config['extensions'] if e['id'] != ext_id]
        
        if len(current_config['extensions']) < config_len:
            await virtual_fs.write_json(ext_config_path, current_config)
            
            # Broadcast update
            await sio.emit('extensions_update', {
                'extensions': current_config['extensions']
            })
            
            await sio.emit('terminal_output', {
                'output': f"\x1b[1;33m- Extension uninstalled.\x1b[0m\n",
                'success': True
            }, to=sid)

@sio.event
async def get_extensions(sid):
    """Get list of installed extensions"""
    ext_config_path = ".flux/extensions.json"
    config = await virtual_fs.read_json(ext_config_path) or {"extensions": []}
    await sio.emit('extensions_update', {
        'extensions': config['extensions']
    }, to=sid)

@sio.event
async def extension_search(sid, data):
    """Handle extension search"""
    query = data.get('query', '')
    logger.info(f"Searching extensions for {sid}: {query}")
    
    # Search in NPM registry (simulated or real)
    # If query is empty, registry_client.search returns all mock packages
    results = await registry_client.search('npm', query)
    
    # Map results to extension format
    extensions = []
    for pkg in results:
        extensions.append({
            'id': pkg['name'].lower().replace(' ', '-'),
            'name': pkg['name'],
            'description': pkg.get('description', ''),
            'version': pkg.get('version', 'latest'),
            'author': pkg.get('author', 'Unknown'),
            'category': pkg.get('category', 'productivity'),
            'downloads': pkg.get('downloads', '0'),
            'rating': pkg.get('rating', 0),
            'icon': pkg.get('icon', '📦')
        })
        
    await sio.emit('extension_search_results', {
        'results': extensions
    }, to=sid)

@sio.event
async def ai_promptize(sid, data):
    """Improve user prompt using AI"""
    prompt = data.get('prompt', '')
    logger.info(f"AI promptize request from {sid}")
    
    if not AI_ENABLED:
        await sio.emit('ai_promptize_response', {'success': False, 'error': 'AI not enabled'}, to=sid)
        return

    instruction = f"Improve the following user prompt to be more clear, detailed and effective for a coding assistant. Return ONLY the improved prompt text without any preamble or quotes:\n\n{prompt}"
    
    try:
        improved = await ai_service.query(user_query=instruction)
        # Clean up in case AI adds quotes or preamble
        improved = improved.strip().replace('"', '').replace('Improved prompt:', '').strip()
        
        await sio.emit('ai_promptize_response', {
            'success': True,
            'improvedPrompt': improved
        }, to=sid)
    except Exception as e:
        logger.error(f"AI promptize error: {e}")
        await sio.emit('ai_promptize_response', {'success': False, 'error': str(e)}, to=sid)

@sio.event
async def ai_query(sid, data):
    """Handle AI assistant queries"""
    if not AI_ENABLED or not ai_service:
        await sio.emit('ai_error', {
            'error': 'AI Assistant is not enabled. No API key needed! Using Hugging Face free inference.'
        }, to=sid)
        return
    
    query = data.get('query', '')
    code = data.get('code', '')
    file_context = data.get('file', '')
    context = data.get('context', [])
    
    logger.info(f"AI query from {sid}: {query[:50]}...")
    
    try:
        # Query the AI service
        response = await ai_service.query(
            user_query=query,
            code=code,
            file_context=file_context,
            conversation_history=context
        )
        
        # Send response back
        await sio.emit('ai_response', {
            'response': response
        }, to=sid)
        
    except Exception as e:
        logger.error(f"AI query error: {e}")
        await sio.emit('ai_error', {
            'error': f'AI request failed: {str(e)}'
        }, to=sid)



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

@sio.event
async def git_auth_store(sid, data):
    """Store git token"""
    platform = data.get('platform', 'github.com')
    token = data.get('token')
    username = data.get('username', 'default')
    success = auth_service.store_token(platform, token, username)
    await sio.emit('git_auth_response', {'success': success, 'platform': platform}, to=sid)

@sio.event
async def git_clone(sid, data):
    """Handle git clone with optional auth"""
    url = data.get('url')
    platform = data.get('platform', 'github.com')
    username = data.get('username', 'default')
    
    # Check for stored token
    token = auth_service.get_token(platform, username)
    if token:
        url = git_service._inject_credentials(url, token)
        
    logger.info(f"Git clone request from {sid}: {url}")
    result = await asyncio.to_thread(git_service.clone_repository, url, data.get('targetDir'))
    
    if result.get('success'):
        files_result = await asyncio.to_thread(git_service.get_repo_files, result['path'])
        result['files'] = files_result['files']
        result['fileList'] = files_result['fileList']
    
    await sio.emit('git_response', {'action': 'clone', 'result': result}, to=sid)

@sio.event
async def git_merge(sid, data):
    """Handle git merge"""
    path = data.get('path')
    source = data.get('source')
    result = await asyncio.to_thread(git_service.merge_branches, path, source)
    await sio.emit('git_response', {'action': 'merge', 'result': result}, to=sid)

@sio.event
async def git_branch_delete(sid, data):
    """Handle git branch delete"""
    path = data.get('path')
    name = data.get('name')
    force = data.get('force', False)
    result = await asyncio.to_thread(git_service.delete_branch, path, name, force)
    await sio.emit('git_response', {'action': 'branchDelete', 'result': result}, to=sid)

@sio.event
async def git_repo_create(sid, data):
    """Handle git repo create"""
    name = data.get('name')
    result = await asyncio.to_thread(git_service.create_repository, name)
    await sio.emit('git_response', {'action': 'repoCreate', 'result': result}, to=sid)

@sio.event
async def git_repo_delete(sid, data):
    """Handle git repo delete"""
    name = data.get('name')
    result = await asyncio.to_thread(git_service.delete_repository, name)
    await sio.emit('git_response', {'action': 'repoDelete', 'result': result}, to=sid)

@sio.event
async def git_status(sid, data):
    """Handle git status"""
    path = data.get('path')
    result = await asyncio.to_thread(git_service.get_status, path)
    
    # Also get branches
    branches_result = await asyncio.to_thread(git_service.get_branches, path)
    if branches_result['success']:
        result['branches'] = branches_result['branches']
        result['currentBranch'] = branches_result['current']
        
    await sio.emit('git_response', {'action': 'status', 'result': result}, to=sid)

@sio.event
async def git_add(sid, data):
    """Handle git add"""
    path = data.get('path')
    file = data.get('file')
    result = await asyncio.to_thread(git_service.stage_file, path, file)
    await sio.emit('git_response', {'action': 'add', 'result': result}, to=sid)

@sio.event
async def git_reset(sid, data):
    """Handle git reset"""
    path = data.get('path')
    file = data.get('file')
    result = await asyncio.to_thread(git_service.unstage_file, path, file)
    await sio.emit('git_response', {'action': 'reset', 'result': result}, to=sid)

@sio.event
async def git_commit(sid, data):
    """Handle git commit"""
    path = data.get('path')
    message = data.get('message')
    result = await asyncio.to_thread(git_service.commit, path, message)
    await sio.emit('git_response', {'action': 'commit', 'result': result}, to=sid)

@sio.event
async def git_push(sid, data):
    """Handle git push with auth"""
    path = data.get('path')
    remote = data.get('remote', 'origin')
    branch = data.get('branch')
    platform = data.get('platform', 'github.com')
    username = data.get('username', 'default')
    
    # Integration with auth service
    token = auth_service.get_token(platform, username)
    # Note: For push, we might need to update the remote URL temporarily or use environment variables
    # For this demo, we assume the remote is already authenticated or uses a helper
    
    result = await asyncio.to_thread(git_service.push, path, remote, branch)
    await sio.emit('git_response', {'action': 'push', 'result': result}, to=sid)

@sio.event
async def git_pull(sid, data):
    """Handle git pull with auth"""
    path = data.get('path')
    platform = data.get('platform', 'github.com')
    username = data.get('username', 'default')
    
    result = await asyncio.to_thread(git_service.pull, path)
    await sio.emit('git_response', {'action': 'pull', 'result': result}, to=sid)

@sio.event
async def git_create_branch(sid, data):
    """Handle git create branch"""
    path = data.get('path')
    name = data.get('name')
    result = await asyncio.to_thread(git_service.create_branch, path, name)
    await sio.emit('git_response', {'action': 'createBranch', 'result': result}, to=sid)

@sio.event
async def git_checkout(sid, data):
    """Handle git checkout"""
    path = data.get('path')
    branch = data.get('branch')
    result = await asyncio.to_thread(git_service.checkout_branch, path, branch)
    await sio.emit('git_response', {'action': 'checkout', 'result': result}, to=sid)

@sio.event
async def git_repo_list(sid, data):
    """Handle git repo list"""
    result = await asyncio.to_thread(git_service.list_repositories)
    await sio.emit('git_response', {'action': 'repoList', 'result': result}, to=sid)


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting WebSocket server with Package Management on http://localhost:8000")
    logger.info("Supports: npm, pip, file system commands")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
