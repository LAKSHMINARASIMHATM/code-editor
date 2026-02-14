import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { executeCode, extractVariables, analyzeCode } from '../utils/codeExecution';
import {
  Play, Pause, SkipForward, CornerDownRight, CornerUpLeft,
  RotateCcw, Square, Circle, FileText, FolderOpen,
  Users, Activity, Zap, Clock, Settings,
  Terminal, Code2, Upload, Download, Save, Plus, Scissors, Copy, ClipboardPaste as Paste, Undo, Redo,
  Layout, Monitor, Maximize, Bug, PlayCircle, AlertCircle, GitBranch, Package, Wrench, RefreshCw
} from 'lucide-react';
import TerminalComponent from './Terminal/Terminal';
import FileTree from './FileTree';
import Chat from './Chat';
import './FileTree/FileTree.css';
import '@xterm/xterm/css/xterm.css';

// Layout System
import { LayoutProvider, useLayout } from '../lib/layout/LayoutManager';
import { ResizablePanel } from '../lib/layout/ResizablePanel';
import { DockPanel } from '../lib/layout/DockPanel';

// Enhanced Components
import { ProblemsPanel } from './Problems/ProblemsPanel';
import { OutputPanel } from './Output/OutputPanel';
import { GitPanel } from './Git/GitPanel';
import ConflictModal from './Git/ConflictModal';
import AISuggestionCard from './AIAssistant/AISuggestionCard';

// Debugger
import { VariablesPanel } from './Debugger/VariablesPanel';
import { WatchPanel } from './Debugger/WatchPanel';
import { CallStackPanel } from './Debugger/CallStackPanel';
import { BreakpointsPanel } from './Debugger/BreakpointsPanel';

// Customization
import { SettingsPanel } from './Settings/SettingsPanel';
import { ExtensionsPanel } from './Extensions/ExtensionsPanel';
import { CommandPalette } from './CommandPalette/CommandPalette';
import { ThemeCustomizer } from './Themes/ThemeCustomizer';

// Import all component styles
import '../styles/components.css';
import '../styles/layout.css';
import ErrorBoundary from './Common/ErrorBoundary';

// Professional Layout Component
import ProfessionalLayout from './ProfessionalLayout';

const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : `https://${window.location.hostname.replace('5000', '8000')}`;

const INITIAL_CODE = {};
const FILE_STRUCTURE = [];

export const FluxIDE = () => {
  const [activeFile, setActiveFile] = useState('');
  const [files, setFiles] = useState({});
  const [fileList, setFileList] = useState([]);
  const [language, setLanguage] = useState('javascript');
  const [breakpoints, setBreakpoints] = useState(new Set());
  const [consoleOutput, setConsoleOutput] = useState([
    { type: 'info', message: 'Welcome to Flux IDE. Open a folder to get started.', timestamp: Date.now() }
  ]);
  const [watchedVars, setWatchedVars] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionLine, setExecutionLine] = useState(null);

  // Delta-based Sync Helper
  const calculateDelta = (oldStr, newStr) => {
    if (!oldStr) return { type: 'full', content: newStr };
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    let start = 0;
    while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) {
      start++;
    }
    let oldEnd = oldLines.length - 1;
    let newEnd = newLines.length - 1;
    while (oldEnd >= start && newEnd >= start && oldLines[oldEnd] === newLines[newEnd]) {
      oldEnd--;
      newEnd--;
    }
    return {
      type: 'delta',
      start,
      removeCount: oldEnd - start + 1,
      newLines: newLines.slice(start, newEnd + 1)
    };
  };

  // Helper to add console messages
  const addConsoleMessage = (type, message) => {
    setConsoleOutput(prev => [...prev, { type, message, timestamp: Date.now() }]);
  };

  // Menu and Modal States
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 14,
    theme: 'flux-dark',
    minimap: true,
    wordWrap: 'on'
  });

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const socketRef = useRef(null);
  const opsCountRef = useRef(0);

  // Collaboration state
  const [users, setUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [opsPerSecond, setOpsPerSecond] = useState(0);
  const [sessionLatency, setSessionLatency] = useState(42);

  // New panels state
  const { layout, togglePanel, updatePanelSize, setActivePanel, resetLayout } = useLayout();
  const [problems, setProblems] = useState([]);
  const [outputChannels, setOutputChannels] = useState([
    { id: 'terminal', name: 'Terminal', output: ['$ Welcome to Flux IDE Terminal', '$ Ready for commands...'] },
    { id: 'build', name: 'Build', output: [] },
    { id: 'debug', name: 'Debug Console', output: [] }
  ]);
  const [gitRepository, setGitRepository] = useState({
    stagedChanges: [],
    unstagedChanges: [],
    conflicted: [],
    branches: ['main'],
    currentBranch: 'main',
    remote: 'origin'
  });
  const [localRepos, setLocalRepos] = useState([]);

  // Session recovery from LocalStorage
  useEffect(() => {
    const savedFiles = localStorage.getItem('flux_offline_files');
    if (savedFiles && Object.keys(files).length === 0) {
      try {
        const parsed = JSON.parse(savedFiles);
        if (Object.keys(parsed).length > 0) {
          const restore = confirm('Unsaved local changes detected. Would you like to restore them?');
          if (restore) {
            setFiles(parsed);
            addConsoleMessage('success', 'Restored files from local storage');
          }
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      }
    }
  }, []);
  const [debugVariables, setDebugVariables] = useState({
    local: {},
    global: {}
  });
  const [watchExpressions, setWatchExpressions] = useState([]);
  const [callStack, setCallStack] = useState([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineChanges, setOfflineChanges] = useState(new Set());
  const [remoteHighlights, setRemoteHighlights] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeConflict, setActiveConflict] = useState(null); // { file, ours, theirs }
  const [aiSuggestions, setAiSuggestions] = useState([]); // List of active shared suggestions
  const [envSyncRequest, setEnvSyncRequest] = useState(null); // { file, userName }
  const lastPublishedContent = useRef({});

  const [extensions, setExtensions] = useState([
    { id: 'eslint', name: 'ESLint', author: 'Microsoft', description: 'JavaScript linter for code quality', downloads: '50M', rating: 4.8, version: '2.4.0', category: 'formatters', icon: '🔍' },
    { id: 'prettier', name: 'Prettier', author: 'Prettier', description: 'Opinionated code formatter', downloads: '40M', rating: 4.9, version: '9.0.0', category: 'formatters', icon: '✨' },
    { id: 'gitlens', name: 'GitLens', author: 'GitKraken', description: 'Git supercharged', downloads: '20M', rating: 4.7, version: '14.0.0', category: 'productivity', icon: '🔎' },
    { id: 'python', name: 'Python', author: 'Microsoft', description: 'Python language support with IntelliSense', downloads: '80M', rating: 4.9, version: '2024.1.0', category: 'languages', icon: '🐍' },
    { id: 'git-graph', name: 'Git Graph', author: 'mhutchie', description: 'Visualize Git history', downloads: '5M', rating: 4.9, version: '1.30.0', category: 'productivity', icon: '📊' },
    { id: 'error-lens', name: 'Error Lens', author: 'Alexander', description: 'Show errors inline', downloads: '3M', rating: 4.8, version: '3.16.0', category: 'productivity', icon: '👁️' },
    { id: 'thunder-client', name: 'Thunder Client', author: 'Ranga Vadhineni', description: 'REST API Client', downloads: '4M', rating: 4.7, version: '2.12.0', category: 'productivity', icon: '⚡' },
    { id: 'tabnine', name: 'Tabnine AI', author: 'Tabnine', description: 'AI Code Completion', downloads: '10M', rating: 4.6, version: '5.0.0', category: 'productivity', icon: '🤖' },
    { id: 'react-snippets', name: 'React Snippets', author: 'dsznajder', description: 'ES7+ React/Redux snippets', downloads: '15M', rating: 4.8, version: '4.4.3', category: 'snippets', icon: '⚛️' },
    { id: 'live-server', name: 'Live Server', author: 'Ritwick Dey', description: 'Local dev server with live reload', downloads: '45M', rating: 4.9, version: '5.7.9', category: 'productivity', icon: '🚀' },
    { id: 'material-icons', name: 'Material Icon Theme', author: 'Philipp Kief', description: 'Material Design icons', downloads: '25M', rating: 4.8, version: '4.32.0', category: 'themes', icon: '📁' },
    { id: 'one-dark', name: 'One Dark Pro', author: 'binaryify', description: 'Atom One Dark theme', downloads: '18M', rating: 4.7, version: '3.16.0', category: 'themes', icon: '🎨' },
    { id: 'dracula', name: 'Dracula Theme', author: 'Dracula Theme', description: 'Dark theme for VS Code', downloads: '10M', rating: 4.8, version: '2.24.3', category: 'themes', icon: '🧛' },
    { id: 'todo-highlight', name: 'TODO Highlight', author: 'Wayou Liu', description: 'Highlight TODOs and FIXMEs', downloads: '2M', rating: 4.7, version: '2.0.5', category: 'productivity', icon: '📝' },
    { id: 'tailwind', name: 'Tailwind CSS IntelliSense', author: 'Tailwind Labs', description: 'Tailwind CSS autocomplete', downloads: '12M', rating: 4.9, version: '0.11.0', category: 'languages', icon: '💨' }
  ]);

  const handleFormatDocument = () => {
    if (!activeFile || !files[activeFile]) return;

    addConsoleMessage('info', 'Formatting document...');
    const isPrettierInstalled = installedExtensions.some(e => e.id === 'prettier' && e.enabled);

    if (!isPrettierInstalled) {
      addConsoleMessage('warning', 'Install Prettier extension to enable formatting');
      return;
    }

    const content = files[activeFile];
    // Simple mock formatter: clean up whitespace and ensure semis
    const formatted = content
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .replace(/([^;{}]\n)/g, '$1;') // Very naive semi-colon addition
      .replace(/;+/g, ';'); // Clean up duplicates

    setFiles(prev => ({ ...prev, [activeFile]: formatted }));
    addConsoleMessage('success', 'Document formatted with Prettier');
  };
  const [installedExtensions, setInstalledExtensions] = useState([]);

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (uploadedFiles.length === 0) return;

    const newFiles = {};
    const newFileList = [];
    let firstFile = '';

    let processedCount = 0;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit per file

    uploadedFiles.forEach(file => {
      // Use webkitRelativePath for folders, or name for single files
      const filePath = file.webkitRelativePath || file.name;

      // Skip hidden files, node_modules, or build directories
      if (
        filePath.includes('node_modules') ||
        filePath.includes('.git/') ||
        filePath.includes('dist/') ||
        filePath.includes('build/') ||
        filePath.startsWith('.')
      ) {
        processedCount++;
        checkCompletion();
        return;
      }

      // Skip large files
      if (file.size > MAX_FILE_SIZE) {
        setConsoleOutput(prev => [...prev, { type: 'warning', message: `Skipped large file: ${filePath} (>5MB)`, timestamp: Date.now() }]);
        processedCount++;
        checkCompletion();
        return;
      }

      // Skip likely binary files (images, audio, video, etc.)
      const isBinary = /\.(png|jpg|jpeg|gif|ico|svg|mp3|mp4|wav|webm|zip|tar|gz|pdf|exe|dll|bin)$/i.test(filePath);
      if (isBinary) {
        // Still add to file list but don't read content, or mark as binary?
        // For now, we'll store a placeholder to indicate it exists but can't be edited
        newFiles[filePath] = '[Binary File]';
        // Get extension for icon
        let lang = 'text';
        if (filePath.endsWith('.png') || filePath.endsWith('.jpg')) lang = 'image';

        newFileList.push({ name: filePath, language: lang, icon: FileText });
        processedCount++;
        checkCompletion();
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target.result;

        // Determine language
        let lang = 'javascript';
        if (filePath.endsWith('.py')) lang = 'python';
        else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) lang = 'typescript';
        else if (filePath.endsWith('.css')) lang = 'css';
        else if (filePath.endsWith('.md')) lang = 'markdown';
        else if (filePath.endsWith('.html')) lang = 'html';
        else if (filePath.endsWith('.json')) lang = 'json';
        else if (filePath.endsWith('.jsx')) lang = 'javascript';
        else if (filePath.endsWith('.java')) lang = 'java';
        else if (filePath.endsWith('.cpp') || filePath.endsWith('.h')) lang = 'cpp';
        else if (filePath.endsWith('.go')) lang = 'go';
        else if (filePath.endsWith('.rs')) lang = 'rust';

        newFiles[filePath] = content;
        newFileList.push({ name: filePath, language: lang, icon: FileText });

        if (!firstFile && ['javascript', 'typescript', 'python', 'html', 'css', 'json'].includes(lang)) {
          firstFile = filePath;
        } else if (!firstFile) {
          firstFile = filePath;
        }

        processedCount++;
        checkCompletion();
      };

      reader.onerror = () => {
        console.error(`Failed to read file: ${filePath}`);
        addConsoleMessage('error', `Failed to read ${filePath}`);
        processedCount++;
        checkCompletion();
      };

      try {
        reader.readAsText(file);
      } catch (err) {
        console.error(`Error starting read for ${filePath}:`, err);
        processedCount++;
        checkCompletion();
      }
    });

    function checkCompletion() {
      if (processedCount === uploadedFiles.length) {
        setFiles(prev => ({ ...prev, ...newFiles }));

        // Init original files for Git
        setOriginalFiles(prev => ({ ...prev, ...newFiles }));

        setFileList(prev => {
          // Merge and deduplicate
          const combined = [...prev, ...newFileList];
          const unique = Array.from(new Map(combined.map(item => [item.name, item])).values());
          return unique.sort((a, b) => a.name.localeCompare(b.name));
        });

        if (firstFile && !activeFile) {
          setActiveFile(firstFile);
          const fileInfo = newFileList.find(f => f.name === firstFile);
          if (fileInfo) setLanguage(fileInfo.language);
        }

        setConsoleOutput(prev => [...prev, { type: 'success', message: `Loaded ${Object.keys(newFiles).length} files`, timestamp: Date.now() }]);
      }
    }

    setActiveMenu(null);
  };

  const triggerFolderUpload = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
    setActiveMenu(null);
  };

  const changeFile = (fileName) => {
    setActiveFile(fileName);
    const file = fileList.find(f => f.name === fileName);
    if (file) {
      setLanguage(file.language);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setActiveMenu(null);
  };

  // Menu Handlers
  const menuItems = {
    File: [
      {
        label: 'New File', icon: Plus, action: () => {
          const name = `file_${fileList.length + 1}.js`;
          setFiles(prev => ({ ...prev, [name]: '// New file\n' }));
          setFileList(prev => [...prev, { name, language: 'javascript', icon: FileText }]);
          setActiveFile(name);
        }
      },
      { label: 'Open File', icon: FolderOpen, action: triggerFileUpload },
      { label: 'Save', icon: Save, action: () => setConsoleOutput(prev => [...prev, { type: 'success', message: `Saved ${activeFile}`, timestamp: Date.now() }]) },
      {
        label: 'Download', icon: Download, action: () => {
          const blob = new Blob([files[activeFile]], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = activeFile;
          a.click();
        }
      }
    ],
    Edit: [
      { label: 'Undo', icon: Undo, action: () => editorRef.current?.trigger('keyboard', 'undo', {}) },
      { label: 'Redo', icon: Redo, action: () => editorRef.current?.trigger('keyboard', 'redo', {}) },
      { label: 'Cut', icon: Scissors, action: () => editorRef.current?.trigger('keyboard', 'editor.action.clipboardCutAction', {}) },
      { label: 'Copy', icon: Copy, action: () => editorRef.current?.trigger('keyboard', 'editor.action.clipboardCopyAction', {}) },
      { label: 'Paste', icon: Paste, action: () => editorRef.current?.trigger('keyboard', 'editor.action.clipboardPasteAction', {}) },
      { label: 'Format Document', icon: Zap, action: handleFormatDocument }
    ],
    View: [
      { label: 'Toggle Minimap', icon: Layout, action: () => setSettings(s => ({ ...s, minimap: !s.minimap })) },
      { label: 'Full Screen', icon: Maximize, action: () => document.documentElement.requestFullscreen() },
      { label: 'Presentation Mode', icon: Monitor, action: () => setSettings(s => ({ ...s, fontSize: s.fontSize === 14 ? 20 : 14 })) }
    ],
    Debug: [
      { label: 'Start Debugging', icon: Bug, action: () => handleRunCode() },
      { label: 'Run Without Debugging', icon: PlayCircle, action: () => handleRunCode() },
      { label: 'Stop Debugging', icon: Square, action: () => handleStop() }
    ]
  };

  // Handler functions for new panels
  const handleFileAction = (action, item) => {
    console.log('File action:', action, item);
    switch (action) {
      case 'rename':
        // TODO: Implement rename via backend API
        break;
      case 'delete':
        // TODO: Implement delete via backend API
        break;
      case 'newFile':
        // TODO: Implement new file creation
        break;
      case 'newFolder':
        // TODO: Implement new folder creation
        break;
      default:
        console.log('Unhandled file action:', action);
    }
  };



  const handleExtensionInstall = (extId) => {
    console.log(`[Extension] Attempting to install: ${extId}`);
    const ext = extensions.find(e => e.id === extId);
    if (ext) {
      console.log(`[Extension] Found extension object:`, ext);
      addConsoleMessage('info', `Installing ${ext.name}...`);
      if (socketRef.current) {
        if (socketRef.current.connected) {
          console.log(`[Extension] Socket connected, emitting extension_install`);
          socketRef.current.emit('extension_install', { extension: ext });
        } else {
          console.error(`[Extension] Socket NOT connected!`);
          addConsoleMessage('error', 'Cannot install: Connection to server lost');
        }
      } else {
        console.error(`[Extension] Socket ref is null`);
      }
    } else {
      console.error(`[Extension] Extension not found in current list: ${extId}`);
      // Log available IDs to debug
      console.log(`[Extension] Available extensions:`, extensions.map(e => e.id));
    }
  };

  const handleExtensionUninstall = (extId) => {
    if (socketRef.current) {
      socketRef.current.emit('extension_uninstall', { id: extId });
    }
  };

  const handleExtensionToggle = (extId, enabled) => {
    setInstalledExtensions(installedExtensions.map(e =>
      e.id === extId ? { ...e, enabled } : e
    ));
  };

  const handleExtensionSearch = (query) => {
    if (socketRef.current) {
      socketRef.current.emit('extension_search', { query });
    }
  };

  const handleEditVariable = (path, value) => {
    console.log('Edit variable:', path, value);
    // TODO: Send to debugger backend
  };

  const handleAddWatch = (expression) => {
    setWatchExpressions([...watchExpressions, { expression, value: null }]);
  };

  const handleRemoveWatch = (index) => {
    setWatchExpressions(watchExpressions.filter((_, i) => i !== index));
  };

  const handleFrameSelect = (index) => {
    console.log('Frame selected:', index);
    // TODO: Update active debug frame
  };

  const handleCommandExecute = (commandId) => {
    console.log('Execute command:', commandId);
    switch (commandId) {
      case 'file.new':
        handleFileAction('newFile', {});
        break;
      case 'file.open':
        folderInputRef.current?.click();
        break;
      case 'file.save':
        handleSaveFile();
        break;
      case 'view.settings':
        if (!fileList.find(f => f.name === 'Settings')) {
          setFileList(prev => [...prev, { name: 'Settings', language: 'json', icon: Settings }]);
        }
        setActiveFile('Settings');
        break;
      case 'debug.start':
        handleRun();
        break;
      case 'debug.stop':
        handleStop();
        break;
      case 'git.commit':
        setActivePanel('left', 'git');
        break;
      case 'terminal.new':
        setActivePanel('bottom', 'terminal');
        break;
      default:
        console.log('Unhandled command:', commandId);
    }
  };

  const handleProblemNavigate = (problem) => {
    setActiveFile(problem.file);
    if (editorRef.current) {
      editorRef.current.setPosition({ lineNumber: problem.line, column: problem.column || 1 });
      editorRef.current.revealLineInCenter(problem.line);
    }
  };

  const handleToggleBreakpoint = (breakpointId) => {
    console.log('Toggle breakpoint:', breakpointId);
    // Breakpoints are managed in the existing breakpoints state
  };

  const handleRemoveBreakpoint = (breakpointId) => {
    const bp = Array.from(breakpoints)[breakpointId];
    if (bp) {
      const newBreakpoints = new Set(breakpoints);
      newBreakpoints.delete(bp);
      setBreakpoints(newBreakpoints);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command Palette: Ctrl+Shift+P
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Format: Alt+Shift+F
      if (e.altKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handleFormatDocument();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [socketInstance, setSocketInstance] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });
    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsOnline(true);
      addConsoleMessage('success', 'Back online. Syncing changes...');

      let initialCursor = { lineNumber: 1, column: 1 };
      if (editorRef.current) {
        const pos = editorRef.current.getPosition();
        if (pos) {
          initialCursor = { lineNumber: pos.lineNumber, column: pos.column };
        }
      }

      // Sync offline changes
      if (offlineChanges.size > 0) {
        offlineChanges.forEach(fileName => {
          socket.emit('code_change', {
            file: fileName,
            content: files[fileName],
            operation: 'update',
            isSync: true
          });
        });
        setOfflineChanges(new Set());
      }

      socket.emit('join_session', {
        name: `User-${Math.floor(Math.random() * 1000)}`,
        cursor: initialCursor
      });

      socket.emit('get_extensions');
      socket.emit('extension_search', { query: '' });
    });

    socket.on('disconnect', () => {
      setIsOnline(false);
      addConsoleMessage('warning', 'Connection lost. Working in offline mode...');
    });

    socket.on('extensions_update', (data) => {
      setInstalledExtensions(data.extensions);
    });

    socket.on('extension_search_results', (data) => {
      setExtensions(data.results);
    });

    socket.on('connect_error', (error) => {
      console.warn('Collaboration server not available - running in offline mode');
      if (isOnline) setIsOnline(false);
    });

    socket.on('session_joined', (data) => {
      console.log('Session Joined Data:', data);
      setUsers(data.users);
      if (data.activityLogs) setActivityLogs(data.activityLogs);
    });

    socket.on('activity_update', (log) => {
      setActivityLogs(prev => [...prev, log]);
    });

    socket.on('ai_suggestion_broadcast', (suggestion) => {
      setAiSuggestions(prev => [...prev, suggestion]);
      addConsoleMessage('info', `New AI suggestion from ${suggestion.userName}`);
    });

    socket.on('ai_suggestion_update', (updated) => {
      setAiSuggestions(prev => prev.map(s => s.id === updated.id ? updated : s));
    });

    socket.on('ai_suggestion_approved', (approved) => {
      setAiSuggestions(prev => prev.filter(s => s.id !== approved.id));
      addConsoleMessage('success', `AI Suggestion approved!`);
    });

    socket.on('env_sync_required', (data) => {
      setEnvSyncRequest(data);
      addConsoleMessage('info', `Environment sync required due to changes in ${data.file}`);
    });

    socket.on('env_sync_complete', (data) => {
      setEnvSyncRequest(null);
      addConsoleMessage('success', `Environment sync completed for ${data.file}!`);
    });

    socket.on('user_joined', (user) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socket.on('user_left', (data) => {
      setUsers(prev => prev.filter(u => u.id !== data.userId));
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    });

    socket.on('users_update', (data) => {
      console.log('Real Users Update Data:', data);
      const myId = socket.id;
      const fixedUsers = data.users.map(u => ({
        ...u,
        isLocal: u.id === myId
      }));
      setUsers(fixedUsers);
    });

    socket.on('cursor_update', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: data.cursor
      }));
      setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, cursor: data.cursor } : u
      ));
    });

    socket.on('typing_update', (data) => {
      setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, isTyping: data.isTyping } : u
      ));
    });

    socket.on('code_update', (data) => {
      // Don't apply our own updates (handled by local state)
      if (data.userId === socket.id) return;

      if (data.operation === 'delta') {
        setFiles(prev => {
          const currentContent = prev[data.file] || "";
          const lines = currentContent.split('\n');
          // Apply line-level delta
          lines.splice(data.delta.start, data.delta.removeCount, ...data.delta.newLines);
          const updatedContent = lines.join('\n');

          // Update lastPublishedContent to keep delta sync aligned
          lastPublishedContent.current[data.file] = updatedContent;

          return { ...prev, [data.file]: updatedContent };
        });

        // Add visual highlight for the remote change
        setRemoteHighlights(prev => ({
          ...prev,
          [data.userId]: {
            file: data.file,
            startLine: data.delta.start + 1,
            endLine: data.delta.start + data.delta.newLines.length,
            timestamp: Date.now()
          }
        }));
      } else {
        setFiles(prev => {
          const updated = { ...prev, [data.file]: data.content };
          lastPublishedContent.current[data.file] = data.content;
          return updated;
        });
      }
    });

    socket.on('git_response', (data) => {
      console.log('Git response:', data);
      if (data.action === 'status') {
        if (data.result.success) {
          setGitRepository(prev => ({
            ...prev,
            stagedChanges: data.result.staged.map(f => ({ path: f, status: 'staged' })),
            unstagedChanges: data.result.unstaged.map(f => ({ path: f, status: 'modified' })),
            conflicted: data.result.conflicted || [],
            branches: data.result.branches || (prev.branches.length ? prev.branches : ['main']),
            currentBranch: data.result.currentBranch || data.result.branch
          }));
        }
      } else if (data.action === 'repoList') {
        if (data.result.success) {
          setLocalRepos(data.result.repositories);
        }
      } else if (data.action === 'conflictDetails') {
        if (data.result.success) {
          setActiveConflict({
            file: data.result.path,
            ours: data.result.ours,
            theirs: data.result.theirs
          });
        }
      } else if (data.action === 'resolveConflict') {
        if (data.result.success) {
          addConsoleMessage('success', `Resolved conflict in ${activeConflict?.file || 'file'}`);
          setActiveConflict(null);
          socket.emit('git_status', { path: 'flux-project' });
        }
      }

      // Handle merge conflicts
      if (data.result.conflict) {
        addConsoleMessage('error', 'Merge conflict detected! Please resolve conflicts manually.');
        socket.emit('git_status', { path: 'flux-project' });
        return;
      }

      // Handle commit/push/pull success messages
      if (data.result.message) {
        addConsoleMessage(data.result.success ? 'success' : 'error', data.result.message);
        // Refresh status after actions
        if (['add', 'reset', 'commit', 'pull', 'checkout', 'createBranch', 'merge', 'branchDelete', 'repoCreate'].includes(data.action) && data.result.success) {
          socket.emit('git_status', { path: 'flux-project' });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeFile]);

  // Sync cursor position with collaboration
  useEffect(() => {
    if (!editorRef.current || !socketRef.current?.connected) return;

    const disposable = editorRef.current.onDidChangeCursorPosition((e) => {
      if (e.position && socketRef.current?.connected) {
        const newCursor = {
          lineNumber: e.position.lineNumber,
          column: e.position.column
        };

        socketRef.current.emit('cursor_move', {
          cursor: newCursor
        });

        // Update local user position in sidebar immediately
        setUsers(prev => prev.map(u =>
          u.isLocal ? { ...u, cursor: newCursor } : u
        ));
      }
    });

    return () => disposable?.dispose();
  }, [activeFile]);

  // Git State
  const [originalFiles, setOriginalFiles] = useState({});

  const handleGitAction = (action, payload) => {
    if (!socketRef.current) return;

    // Default project path - should be dynamic in future
    const projectPath = 'flux-project';

    switch (action) {
      case 'clone':
        socketRef.current.emit('git_clone', { url: payload.url, targetDir: 'flux-project' });
        break;
      case 'status':
        socketRef.current.emit('git_status', { path: projectPath });
        break;
      case 'stage':
        socketRef.current.emit('git_add', { path: projectPath, file: payload.file.path });
        break;
      case 'unstage':
        socketRef.current.emit('git_reset', { path: projectPath, file: payload.file.path });
        break;
      case 'commit':
        socketRef.current.emit('git_commit', { path: projectPath, message: payload.message });
        break;
      case 'push':
        socketRef.current.emit('git_push', { path: projectPath, branch: gitRepository.currentBranch });
        break;
      case 'pull':
        socketRef.current.emit('git_pull', { path: projectPath });
        break;
      case 'createBranch':
        socketRef.current.emit('git_create_branch', { path: projectPath, name: payload.name });
        break;
      case 'checkout':
        socketRef.current.emit('git_checkout', { path: projectPath, branch: payload.branch });
        break;
      case 'merge':
        socketRef.current.emit('git_merge', { path: projectPath, source: payload.source });
        break;
      case 'branchDelete':
        socketRef.current.emit('git_branch_delete', { path: projectPath, name: payload.name, force: payload.force });
        break;
      case 'repoCreate':
        socketRef.current.emit('git_repo_create', { name: payload.name });
        break;
      case 'repoList':
        socketRef.current.emit('git_repo_list', {});
        break;
      case 'conflictDetails':
        socketRef.current.emit('git_conflict_details', { path: projectPath, file: payload.file });
        break;
      case 'resolveConflict':
        socketRef.current.emit('git_resolve_conflict', { path: projectPath, file: payload.file, content: payload.content });
        break;
      case 'refresh':
        socketRef.current.emit('git_status', { path: projectPath });
        break;
    }
  };

  const handleVoteSuggestion = (id, vote) => {
    if (socketRef.current) {
      socketRef.current.emit('ai_vote_suggestion', { id, vote });
    }
  };

  const handleDismissSuggestion = (id) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleEnvSync = () => {
    if (socketRef.current && envSyncRequest) {
      socketRef.current.emit('env_sync_execute', { file: envSyncRequest.file });
      setEnvSyncRequest(null);
    }
  };

  const handleEditorChange = (value) => {
    // Determine language from active file extension
    const lang = fileList.find(f => f.name === activeFile)?.language || 'javascript';

    // Run lightweight analysis
    const newProblems = analyzeCode(activeFile, value, lang);
    setProblems(newProblems);

    setFiles(prev => {
      const updated = { ...prev, [activeFile]: value };
      // Autosave to localStorage for offline persistence
      localStorage.setItem('flux_offline_files', JSON.stringify(updated));
      return updated;
    });

    // Offline change tracking
    if (!isOnline) {
      setOfflineChanges(prev => new Set(prev).add(activeFile));
    }

    // Git Change Tracking
    const originalContent = originalFiles[activeFile];
    if (originalContent !== undefined && value !== originalContent) {
      setGitRepository(prev => {
        const isUnstaged = prev.unstagedChanges.some(f => f.path === activeFile);
        const isStaged = prev.stagedChanges.some(f => f.path === activeFile);

        if (!isUnstaged && !isStaged) {
          return {
            ...prev,
            unstagedChanges: [...prev.unstagedChanges, { path: activeFile, status: 'modified' }]
          };
        }
        return prev;
      });
    }

    if (socketRef.current && isOnline) {
      const prevContent = lastPublishedContent.current[activeFile] || "";
      const delta = calculateDelta(prevContent, value);

      socketRef.current.emit('code_change', {
        file: activeFile,
        delta,
        operation: delta.type === 'full' ? 'update' : 'delta'
      });

      lastPublishedContent.current[activeFile] = value;
      socketRef.current.emit('typing_status', { isTyping: true });

      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing_status', { isTyping: false });
        }
      }, 1000);
    }
  };

  // Calculate ops per second
  useEffect(() => {
    const interval = setInterval(() => {
      setOpsPerSecond(opsCountRef.current);
      opsCountRef.current = 0;
      setSessionLatency(prev => Math.max(20, Math.min(100, prev + (Math.random() - 0.5) * 10)));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup remote highlights after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteHighlights(prev => {
        const now = Date.now();
        const next = { ...prev };
        let changed = false;
        Object.entries(next).forEach(([id, h]) => {
          if (now - h.timestamp > 3000) {
            delete next[id];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track decorations with a ref
  const decorationIdsRef = useRef([]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const decorations = [];

    // Add remote highlights
    Object.entries(remoteHighlights).forEach(([userId, h]) => {
      if (h.file === activeFile) {
        decorations.push({
          range: new monacoRef.current.Range(h.startLine, 1, h.endLine, 1),
          options: {
            isWholeLine: true,
            className: 'remote-highlight-decoration',
            description: `Edited by ${users.find(u => u.id === userId)?.name || 'Guest'}`
          }
        });
      }
    });

    breakpoints.forEach(line => {
      const lineCount = model.getLineCount();
      if (line > 0 && line <= lineCount) {
        decorations.push({
          range: new monacoRef.current.Range(line, 1, line, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: 'breakpoint-decoration',
            glyphMarginHoverMessage: { value: 'Breakpoint' }
          }
        });
      }
    });

    if (executionLine) {
      const lineCount = model.getLineCount();
      if (executionLine > 0 && executionLine <= lineCount) {
        decorations.push({
          range: new monacoRef.current.Range(executionLine, 1, executionLine, 1),
          options: {
            isWholeLine: true,
            className: 'execution-line-decoration',
            glyphMarginClassName: 'execution-point-decoration'
          }
        });
      }
    }

    // Add remote cursor decorations
    Object.entries(remoteCursors).forEach(([userId, cursor]) => {
      const user = users.find(u => u.id === userId);
      if (user && cursor && cursor.lineNumber && cursor.column) {
        // Cursor position decoration
        decorations.push({
          range: new monacoRef.current.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
          options: {
            className: `remote-cursor user-${userId}`,
            glyphMarginClassName: `remote-cursor-glyph user-${userId}`,
            hoverMessage: { value: `User: ${user.name}` }
          }
        });

        // Name tag decoration (using afterContentClassName)
        decorations.push({
          range: new monacoRef.current.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
          options: {
            after: {
              content: user.name,
              inlineClassName: `remote-cursor-label user-label-${userId}`
            }
          }
        });
      }
    });

    // Add Error Lens decorations
    const isErrorLensEnabled = installedExtensions.some(e => e.id === 'error-lens' && e.enabled);
    if (isErrorLensEnabled) {
      problems.forEach(prob => {
        if (prob.line > 0 && prob.line <= model.getLineCount()) {
          decorations.push({
            range: new monacoRef.current.Range(prob.line, 1, prob.line, 1),
            options: {
              isWholeLine: true,
              after: {
                content: `    // ${prob.message}`,
                inlineClassName: `error-lens-text ${prob.severity}`
              },
              className: `error-lens-line ${prob.severity}`,
              glyphMarginClassName: `error-lens-glyph ${prob.severity}`
            }
          });
        }
      });
    }

    // TODO Highlight
    const isTodoHighlightEnabled = installedExtensions.some(e => e.id === 'todo-highlight' && e.enabled);
    if (isTodoHighlightEnabled) {
      const value = model.getValue();
      const lines = value.split('\n');
      lines.forEach((line, index) => {
        const todoMatch = line.match(/(TODO|FIXME):/);
        if (todoMatch) {
          const startCol = todoMatch.index + 1;
          const endCol = startCol + todoMatch[0].length;
          decorations.push({
            range: new monacoRef.current.Range(index + 1, startCol, index + 1, endCol),
            options: {
              inlineClassName: todoMatch[1] === 'TODO' ? 'todo-highlight' : 'fixme-highlight',
              hoverMessage: { value: `${todoMatch[1]} item found` }
            }
          });
        }
      });
    }

    // Use ref to track decoration IDs properly
    decorationIdsRef.current = editorRef.current.deltaDecorations(
      decorationIdsRef.current,
      decorations
    );
  }, [breakpoints, executionLine, activeFile, remoteCursors, users]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const lineNumber = e.target.position.lineNumber;
        toggleBreakpoint(lineNumber);
      }
    });

    editor.onContextMenu((e) => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const text = editor.getModel().getValueInRange(selection);
        setWatchedVars(prev => ({ ...prev, [text]: 'Evaluating...' }));
      }
    });

    monaco.editor.defineTheme('flux-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'F97316', fontStyle: 'bold' },
        { token: 'string', foreground: '10B981' },
        { token: 'number', foreground: '3B82F6' },
        { token: 'function', foreground: 'EC4899' },
        { token: 'variable', foreground: 'E5E5E5' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#E5E5E5',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editorLineNumber.foreground': '#64748B',
        'editorLineNumber.activeForeground': '#F97316',
        'editor.selectionBackground': '#F9731633',
        'editorCursor.foreground': '#F97316',
      },
    });
    monaco.editor.setTheme('flux-dark');
  };

  const toggleBreakpoint = (lineNumber) => {
    setBreakpoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineNumber)) {
        newSet.delete(lineNumber);
      } else {
        newSet.add(lineNumber);
      }
      return newSet;
    });
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setIsPaused(false);
    setExecutionLine(null);

    if (socketRef.current && socketRef.current.connected) {
      const code = files[activeFile];

      // Execute code locally
      const { output, errors } = executeCode(code, language);

      // Send start message
      socketRef.current.emit('terminal_command', {
        command: `echo "✓ Running ${activeFile} (${language})..."`
      });

      // Send output messages with slight delay to ensure order
      output.forEach((log, index) => {
        setTimeout(() => {
          // Escape quotes for echo command
          const safeMessage = log.message.replace(/"/g, '\\"').replace(/\n/g, ' ');
          socketRef.current.emit('terminal_command', {
            command: `echo "${safeMessage}"`
          });
        }, 100 + (index * 50));
      });

      // Send error messages
      errors.forEach((err, index) => {
        setTimeout(() => {
          const safeMessage = err.message.replace(/"/g, '\\"').replace(/\n/g, ' ');
          socketRef.current.emit('terminal_command', {
            command: `echo "\x1b[31mError: ${safeMessage}\x1b[0m"`
          });
        }, 100 + (output.length * 50) + (index * 50));
      });

      setConsoleOutput(prev => [...prev, {
        type: 'info',
        message: `Executed ${activeFile}`,
        timestamp: Date.now()
      }]);
    } else {
      setConsoleOutput(prev => [...prev, {
        type: 'error',
        message: 'Not connected to server',
        timestamp: Date.now()
      }]);
    }

    setTimeout(() => {
      setIsRunning(false);
    }, 1000);
    setActiveMenu(null);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setExecutionLine(null);
    setActiveMenu(null);
  };

  const handlePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);
      const startLine = sortedBreakpoints.length > 0 ? sortedBreakpoints[0] : 1;
      setExecutionLine(startLine);
      const code = files[activeFile];
      const vars = extractVariables(code, startLine);
      setWatchedVars(vars);
    } else {
      setExecutionLine(null);
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setIsPaused(false);
    setExecutionLine(null);
    setConsoleOutput([]);
    setWatchedVars({});
  };

  const handleStepOver = () => {
    if (executionLine) {
      const nextLine = executionLine + 1;
      setExecutionLine(nextLine);
      const code = files[activeFile];
      const vars = extractVariables(code, nextLine);
      setWatchedVars(vars);
    }
  };


  return (
    <div className="h-screen bg-neutral-950 flex flex-col overflow-hidden">
      {/* Command Palette - Global Overlay */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onExecute={handleCommandExecute}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-[400px] rounded-lg border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-orange-500">IDE Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Font Size</span>
                <input
                  type="number"
                  className="w-20 rounded bg-white/5 border border-white/10 p-1 text-white"
                  value={settings.fontSize}
                  onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Minimap</span>
                <button
                  onClick={() => setSettings(s => ({ ...s, minimap: !s.minimap }))}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.minimap ? 'bg-orange-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.minimap ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-6 w-full rounded bg-orange-500 py-2 font-bold text-white hover:bg-orange-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ide-header" data-testid="ide-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="text-orange-500" size={24} />
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Chivo' }}>Flux IDE</h1>
          </div>
          <nav className="flex gap-4 text-sm text-neutral-400 relative">
            {Object.entries(menuItems).map(([menu, items]) => (
              <div key={menu} className="relative">
                <button
                  className={`hover:text-white transition-colors ${activeMenu === menu ? 'text-white' : ''}`}
                  onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
                >
                  {menu}
                </button>
                {activeMenu === menu && (
                  <div className="menu-dropdown">
                    {items.map((item) => (
                      <button
                        key={item.label}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-neutral-300 hover:bg-white/5 hover:text-orange-500 transition-colors"
                        onClick={() => {
                          item.action();
                          setActiveMenu(null);
                        }}
                      >
                        <item.icon size={14} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            onClick={handleRunCode}
            disabled={isRunning}
          >
            <Play size={16} fill="currentColor" />
            <span>RUN</span>
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
              {isOnline ? <Activity size={14} /> : <Clock size={14} />}
              <span className="font-medium text-[11px] uppercase tracking-wider">
                {isOnline ? `${users.length} Online` : 'Offline Mode'}
              </span>
            </div>
            {offlineChanges.size > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">
                <RefreshCw size={14} className="animate-spin-slow" />
                <span className="font-medium text-[11px] uppercase tracking-wider">{offlineChanges.size} Pending Sync</span>
              </div>
            )}
          </div>
          <button
            className="p-2 rounded-md hover:bg-white/10 hover:text-orange-500 transition-all"
            onClick={() => handleCommandExecute('view.settings')}
            title="Settings (Ctrl+,)"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Professional IDE Layout */}
      <ProfessionalLayout
        layout={layout}
        setActivePanel={setActivePanel}
        updatePanelSize={updatePanelSize}
        togglePanel={togglePanel}
        fileList={fileList}
        activeFile={activeFile}
        onFileClick={changeFile}
        onFileAction={handleFileAction}
        onGitAction={handleGitAction}
        startExecution={handleRunCode}
        executionState={{ isRunning, isPaused }}
        consoleOutput={consoleOutput}

        editorComponent={
          <div className="flex-1 overflow-hidden h-full relative">
            {activeFile === 'Settings' ? (
              <SettingsPanel settings={settings} onUpdateSettings={setSettings} />
            ) : activeFile ? (
              <Editor
                height="100%"
                language={language}
                value={files[activeFile] || ''}
                onChange={handleEditorChange}
                theme="flux-dark"
                onMount={handleEditorDidMount}
                options={{
                  fontSize: settings.fontSize,
                  minimap: { enabled: settings.minimap },
                  wordWrap: settings.wordWrap,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  renderWhitespace: 'selection',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  glyphMargin: true,
                  folding: true,
                  fontFamily: settings.fontFamily || 'Consolas, Monaco, monospace'
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <FolderOpen size={64} className="text-orange-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No File Open</h2>
                <p className="text-center max-w-md">Open a file from the Explorer to start editing</p>
              </div>
            )}
          </div>
        }

        debugVariables={debugVariables}
        watchExpressions={watchExpressions}
        callStack={callStack}
        breakpoints={Array.from(breakpoints).map((line, idx) => ({
          id: idx,
          file: activeFile,
          line,
          enabled: true
        }))}
        onEditVariable={handleEditVariable}
        onAddWatch={handleAddWatch}
        onRemoveWatch={handleRemoveWatch}
        onFrameSelect={handleFrameSelect}
        onToggleBreakpoint={handleToggleBreakpoint}
        onRemoveBreakpoint={handleRemoveBreakpoint}
        onClearBreakpoints={() => setBreakpoints(new Set())}
        problems={problems}
        onProblemNavigate={handleProblemNavigate}
        outputChannels={outputChannels}
        localRepos={localRepos}
        users={users}
        activityLogs={activityLogs}
        socket={socketInstance}
        username="User"
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenFolder={triggerFolderUpload}
      />

      {activeConflict && (
        <ConflictModal
          file={activeConflict.file}
          ours={activeConflict.ours}
          theirs={activeConflict.theirs}
          onResolve={(content) => handleGitAction('resolveConflict', { file: activeConflict.file, content })}
          onClose={() => setActiveConflict(null)}
        />
      )}

      <div className="ai-suggestions-container">
        {aiSuggestions.map((suggestion) => (
          <AISuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onVote={handleVoteSuggestion}
            onDismiss={handleDismissSuggestion}
          />
        ))}
      </div>

      {envSyncRequest && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-4 bg-neutral-900 border border-blue-500/30 rounded-full px-6 py-3 shadow-2xl">
          <div className="flex items-center gap-2 text-blue-400">
            <Package size={18} />
            <span className="text-sm font-bold tracking-tight">Dependencies modified by {envSyncRequest.userName}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <button
            onClick={handleEnvSync}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <RefreshCw size={12} />
            SYNC ENVIRONMENT
          </button>
          <button
            onClick={() => setEnvSyncRequest(null)}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hide original layout - kept for reference */}
      <div style={{ display: 'none' }}>
        {/* Main Layout */}
        <div className="ide-main">
          {/* Left Sidebar */}
          <div className="ide-sidebar" data-testid="file-sidebar">
            <div className="panel-section">
              <div className="panel-title flex items-center gap-2">
                <FolderOpen size={14} />
                <span>FILES</span>
              </div>
              <div className="file-tree">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} multiple />
                <input type="file" ref={folderInputRef} onChange={handleFileUpload} style={{ display: 'none' }} webkitdirectory="" directory="" multiple />

                <div className="flex gap-2 mb-2">
                  <button className="flex-1 flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-orange-500 border border-orange-500/30 transition-colors" onClick={triggerFolderUpload}>
                    <FolderOpen size={16} />
                    <span>Open Folder</span>
                  </button>
                  <button className="flex items-center justify-center p-2 rounded hover:bg-white/5 text-neutral-400 border border-white/10 transition-colors" onClick={triggerFileUpload} title="Open File">
                    <FileText size={16} />
                  </button>
                </div>
                {fileList.length > 0 ? (
                  <FileTree
                    files={fileList}
                    activeFile={activeFile}
                    onFileClick={changeFile}
                  />
                ) : (
                  <div className="text-neutral-500 text-xs text-center py-4">
                    No folder opened
                  </div>
                )}
              </div>
            </div>
            <div className="panel-section">
              <div className="panel-title flex items-center gap-2">
                <Terminal size={14} />
                <span>DEBUG</span>
              </div>
              <div className="debug-controls">
                <button className={`debug-btn ${isRunning ? 'active' : ''}`} onClick={handleRunCode} disabled={isRunning}><Play size={14} /></button>
                <button className={`debug-btn ${isPaused ? 'active' : ''}`} onClick={handlePause}><Pause size={14} /></button>
                <button className="debug-btn" onClick={handleStepOver} disabled={!isPaused}><SkipForward size={14} /></button>
                <button className="debug-btn" onClick={handleRestart}><RotateCcw size={14} /></button>
                <button className="debug-btn" onClick={handleStop}><Square size={14} /></button>
              </div>
            </div>
            <div className="panel-section">
              <div className="panel-title flex items-center gap-2"><Circle size={14} className="fill-red-500 text-red-500" /><span>BREAKPOINTS</span></div>
              <div className="breakpoints-list">{Array.from(breakpoints).sort((a, b) => a - b).map(line => (<div key={line} className="breakpoint-item"><Circle size={12} className="fill-red-500 text-red-500" /><span>{activeFile}:line {line}</span></div>))}</div>
            </div>
          </div>

          {/* Center - Editor */}
          {/* Center Column - Editor & Terminal */}
          <div className="ide-center-column">
            <div className="ide-editor-container">
              <div className="ide-tabs">
                {fileList.map((file) => (
                  <button key={file.name} className={`ide-tab ${activeFile === file.name ? 'active' : ''}`} onClick={() => changeFile(file.name)}>
                    <file.icon size={14} /><span>{file.name}</span>
                  </button>
                ))}
              </div>
              <div className="ide-editor-wrapper">
                {activeFile ? (
                  <Editor
                    height="100%"
                    language={language}
                    value={files[activeFile]}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: settings.fontSize,
                      theme: settings.theme === 'flux-dark' ? 'vs-dark' : 'light',
                      minimap: { enabled: settings.minimap },
                      wordWrap: settings.wordWrap,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontLigatures: true,
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: true,
                      smoothScrolling: true,
                      contextmenu: true,
                      padding: { top: 16 },
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                    <div className="mb-4 p-4 rounded-full bg-white/5">
                      <FolderOpen size={48} className="text-orange-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No Folder Open</h2>
                    <p className="mb-6 max-w-md text-center">Open a local folder to start editing your project in Flux IDE.</p>
                    <button
                      className="flex items-center gap-2 px-6 py-3 rounded-md bg-orange-500 font-bold text-white hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
                      onClick={triggerFolderUpload}
                    >
                      <FolderOpen size={20} />
                      <span>Open Folder</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Terminal Panel */}
            <div className="ide-terminal-bottom" style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: '#0a0a0a',
              height: '250px'
            }}>
              <div className="panel-title flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Terminal size={14} />
                <span>TERMINAL</span>
              </div>
              <div style={{ height: 'calc(100% - 36px)', overflow: 'hidden' }}>
                <TerminalComponent
                  socket={socketRef.current}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="ide-right-sidebar">
            <div className="panel-section">
              <div className="panel-title flex items-center gap-2"><Users size={14} /><span>ACTIVE USERS ({users.length})</span></div>
              <div>
                {users.map((user) => (
                  <div key={user.id} className="user-card">
                    <img src={user.avatar} alt={user.name} className="user-avatar" style={{ borderColor: user.color.color }} />
                    <div className="user-info">
                      <div className="flex items-center gap-2"><span className="font-medium text-white">{user.name}</span>{user.isTyping && <Zap size={10} className="text-orange-500 animate-pulse" />}</div>
                      <div className="text-[10px] text-neutral-500">
                        Line {user.cursor?.lineNumber || 1}, Col {user.cursor?.column ?? 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-section">
              <div className="panel-title flex items-center gap-2"><Activity size={14} /><span>SESSION STATS</span></div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-label">LATENCY</div><div className="stat-value text-emerald-500">{Math.round(sessionLatency)}ms</div></div>
                <div className="stat-card"><div className="stat-label">OPS/SEC</div><div className="stat-value text-orange-500">{opsPerSecond}</div></div>
              </div>
            </div>
            <div className="panel-section">
              <Chat
                socket={socketRef.current}
                currentUser={users.find(u => u.isLocal)}
                users={users}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with LayoutProvider
const FluxIDEWrapper = () => {
  return (
    <LayoutProvider>
      <ErrorBoundary>
        <FluxIDE />
      </ErrorBoundary>
    </LayoutProvider>
  );
};

export default FluxIDEWrapper;
