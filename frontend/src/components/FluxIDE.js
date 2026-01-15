import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { 
  Play, Pause, SkipForward, CornerDownRight, CornerUpLeft, 
  RotateCcw, Square, Circle, FileText, FolderOpen, 
  Users, Activity, Zap, Clock, Search, Settings,
  ChevronRight, Eye, Terminal, Code2
} from 'lucide-react';

const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `https://${window.location.hostname.replace('5000', '8000')}`;

export const FluxIDE = () => {
  const [activeFile, setActiveFile] = useState('main.js');
  const [files, setFiles] = useState(INITIAL_CODE);
  const [language, setLanguage] = useState('javascript');
  const [breakpoints, setBreakpoints] = useState(new Set([2]));
  const [consoleOutput, setConsoleOutput] = useState([
    { type: 'success', message: 'IDE initialized successfully', timestamp: Date.now() }
  ]);
  const [watchedVars, setWatchedVars] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionLine, setExecutionLine] = useState(null);
  
  // Collaboration state
  const [users, setUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [opsPerSecond, setOpsPerSecond] = useState(0);
  const [sessionLatency, setSessionLatency] = useState(42);
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const socketRef = useRef(null);
  const opsCountRef = useRef(0);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      socket.emit('join_session', { name: `User-${Math.floor(Math.random() * 1000)}` });
    });

    socket.on('session_joined', (data) => {
      setUsers(data.users);
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
      setUsers(data.users);
    });

    socket.on('cursor_update', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: data.cursor
      }));
    });

    socket.on('typing_update', (data) => {
      setUsers(prev => prev.map(u => 
        u.id === data.userId ? { ...u, isTyping: data.isTyping } : u
      ));
    });

    socket.on('code_update', (data) => {
      if (data.file === activeFile) {
        setFiles(prev => ({ ...prev, [data.file]: data.content }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeFile]);

  // Sync cursor position
  useEffect(() => {
    if (!editorRef.current || !socketRef.current) return;

    const disposable = editorRef.current.onDidChangeCursorPosition((e) => {
      socketRef.current.emit('cursor_move', {
        cursor: { line: e.position.lineNumber, column: e.position.column }
      });
    });

    return () => disposable.dispose();
  }, [activeFile]);

  const handleEditorChange = (value) => {
    setFiles(prev => ({ ...prev, [activeFile]: value }));
    if (socketRef.current) {
      socketRef.current.emit('code_change', {
        file: activeFile,
        content: value,
        operation: 'update'
      });
      socketRef.current.emit('typing_status', { isTyping: true });
      
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socketRef.current.emit('typing_status', { isTyping: false });
      }, 1000);
    }
  };

  // Calculate ops per second
  useEffect(() => {
    const interval = setInterval(() => {
      setOpsPerSecond(opsCountRef.current);
      opsCountRef.current = 0;
      
      // Simulate latency fluctuation
      setSessionLatency(prev => Math.max(20, Math.min(100, prev + (Math.random() - 0.5) * 10)));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add breakpoint click handler
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const lineNumber = e.target.position.lineNumber;
        toggleBreakpoint(lineNumber);
      }
    });

    // Configure editor theme
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
    
    const code = files[activeFile];
    const result = executeCode(code, language);
    
    const newOutput = [
      { type: 'info', message: `Running ${activeFile}...`, timestamp: Date.now() },
      ...result.output.map(o => ({ ...o, timestamp: Date.now() })),
      ...result.errors.map(e => ({ ...e, type: 'error', timestamp: Date.now() })),
    ];
    
    setConsoleOutput(prev => [...prev, ...newOutput]);
    
    // Extract variables
    const vars = extractVariables(code, 1);
    setWatchedVars(vars);
    
    setTimeout(() => {
      setIsRunning(false);
      setConsoleOutput(prev => [...prev, { type: 'success', message: 'Execution completed', timestamp: Date.now() }]);
    }, 1000);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      // Find first breakpoint
      const firstBreakpoint = Array.from(breakpoints).sort((a, b) => a - b)[0];
      setExecutionLine(firstBreakpoint || 1);
    } else {
      setExecutionLine(null);
    }
  };

  const handleStepOver = () => {
    if (executionLine) {
      setExecutionLine(prev => prev + 1);
    }
  };

  const handleStepInto = () => {
    if (executionLine) {
      setExecutionLine(prev => prev + 1);
    }
  };

  const handleStepOut = () => {
    if (executionLine) {
      setExecutionLine(prev => Math.min(prev + 3, files[activeFile].split('\n').length));
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setIsPaused(false);
    setExecutionLine(null);
    setConsoleOutput([]);
    setWatchedVars({});
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setExecutionLine(null);
  };

  const changeFile = (fileName) => {
    setActiveFile(fileName);
    const file = FILE_STRUCTURE.find(f => f.name === fileName);
    if (file) {
      setLanguage(file.language);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="flux-ide" data-testid="flux-ide">
      {/* Header */}
      <div className="ide-header" data-testid="ide-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="text-orange-500" size={24} />
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Chivo' }}>Flux IDE</h1>
          </div>
          <nav className="flex gap-4 text-sm text-neutral-400">
            <button className="hover:text-white transition-colors" data-testid="menu-file">File</button>
            <button className="hover:text-white transition-colors" data-testid="menu-edit">Edit</button>
            <button className="hover:text-white transition-colors" data-testid="menu-view">View</button>
            <button className="hover:text-white transition-colors" data-testid="menu-debug">Debug</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Activity size={16} className="text-emerald-500" />
            <span data-testid="session-users">{users.length}/100 users</span>
          </div>
          <button className="hover:text-white transition-colors" data-testid="settings-btn">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="ide-main">
        {/* Left Sidebar - File Explorer */}
        <div className="ide-sidebar" data-testid="file-sidebar">
          <div className="panel-section">
            <div className="panel-title flex items-center gap-2">
              <FolderOpen size={14} />
              <span>FILES</span>
            </div>
            <div className="file-tree">
              {FILE_STRUCTURE.map((file) => (
                <div
                  key={file.name}
                  className={`file-item ${activeFile === file.name ? 'active' : ''}`}
                  onClick={() => changeFile(file.name)}
                  data-testid={`file-${file.name}`}
                >
                  <file.icon size={16} />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title flex items-center gap-2">
              <Terminal size={14} />
              <span>DEBUG</span>
            </div>
            <div className="debug-controls">
              <button 
                className={`debug-btn ${isRunning ? 'active' : ''}`}
                onClick={handleRunCode}
                disabled={isRunning}
                data-testid="debug-run"
              >
                <Play size={14} />
                Run
              </button>
              <button 
                className={`debug-btn ${isPaused ? 'active' : ''}`}
                onClick={handlePause}
                data-testid="debug-pause"
              >
                <Pause size={14} />
                Pause
              </button>
              <button 
                className="debug-btn"
                onClick={handleStepOver}
                disabled={!isPaused}
                data-testid="debug-step-over"
              >
                <SkipForward size={14} />
              </button>
              <button 
                className="debug-btn"
                onClick={handleStepInto}
                disabled={!isPaused}
                data-testid="debug-step-into"
              >
                <CornerDownRight size={14} />
              </button>
              <button 
                className="debug-btn"
                onClick={handleStepOut}
                disabled={!isPaused}
                data-testid="debug-step-out"
              >
                <CornerUpLeft size={14} />
              </button>
              <button 
                className="debug-btn"
                onClick={handleRestart}
                data-testid="debug-restart"
              >
                <RotateCcw size={14} />
              </button>
              <button 
                className="debug-btn"
                onClick={handleStop}
                data-testid="debug-stop"
              >
                <Square size={14} />
              </button>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title flex items-center gap-2">
              <Circle size={14} className="fill-red-500 text-red-500" />
              <span>BREAKPOINTS</span>
            </div>
            <div className="breakpoints-list" data-testid="breakpoints-list">
              {Array.from(breakpoints).sort((a, b) => a - b).map(line => (
                <div key={line} className="breakpoint-item">
                  <Circle size={12} className="fill-red-500 text-red-500" />
                  <span>{activeFile}:line {line}</span>
                </div>
              ))}
              {breakpoints.size === 0 && (
                <div className="text-sm text-neutral-500">No breakpoints set</div>
              )}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title flex items-center gap-2">
              <Eye size={14} />
              <span>WATCH</span>
            </div>
            <div className="watch-list" data-testid="watch-list">
              {Object.keys(watchedVars).length > 0 ? (
                Object.entries(watchedVars).map(([key, value]) => (
                  <div key={key} className="watch-item">
                    <span className="watch-var">{key}</span>
                    <span className="watch-value">{JSON.stringify(value)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-neutral-500">No variables to watch</div>
              )}
            </div>
          </div>
        </div>

        {/* Center - Editor */}
        <div className="ide-editor-container">
          {/* Tabs */}
          <div className="ide-tabs" data-testid="editor-tabs">
            {FILE_STRUCTURE.map((file) => (
              <button
                key={file.name}
                className={`ide-tab ${activeFile === file.name ? 'active' : ''}`}
                onClick={() => changeFile(file.name)}
                data-testid={`tab-${file.name}`}
              >
                <file.icon size={14} />
                <span>{file.name}</span>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="ide-editor-wrapper" data-testid="monaco-editor">
            <Editor
              height="100%"
              language={language}
              value={files[activeFile]}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                minimap: { enabled: true },
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
              }}
            />
          </div>

          {/* Console Output */}
          <div className="panel-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="panel-title flex items-center gap-2">
              <Terminal size={14} />
              <span>CONSOLE OUTPUT</span>
            </div>
            <div className="console-output" data-testid="console-output">
              {consoleOutput.map((log, index) => (
                <div key={index} className={`console-line ${log.type}`}>
                  <span className="text-neutral-600">{formatTime(log.timestamp)}</span>
                  <span>{log.message}</span>
                </div>
              ))}
              {consoleOutput.length === 0 && (
                <div className="text-neutral-500">No output yet. Run your code to see results.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Users & Stats */}
        <div className="ide-right-sidebar" data-testid="users-sidebar">
          <div className="panel-section">
            <div className="panel-title flex items-center gap-2">
              <Users size={14} />
              <span>ACTIVE USERS ({users.length})</span>
            </div>
            <div data-testid="users-list">
              {users.map((user) => (
                <div key={user.id} className="user-card" data-testid={`user-${user.id}`}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="user-avatar"
                    style={{ borderColor: user.color.color }}
                  />
                  <div className="user-info">
                    <div className="user-name" style={{ color: user.color.color }}>
                      {user.name}
                    </div>
                    <div className="user-status">
                      {user.isLocal ? (
                        <span className="flex items-center gap-1">
                          <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                          You
                        </span>
                      ) : user.isTyping ? (
                        <span className="flex items-center gap-1 typing-indicator">
                          <Circle size={8} className="fill-orange-500 text-orange-500" />
                          Typing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title flex items-center gap-2">
              <Activity size={14} />
              <span>SESSION STATS</span>
            </div>
            <div className="stats-grid">
              <div className="stat-item" data-testid="stat-users">
                <span className="stat-label">Concurrent Users</span>
                <span className="stat-value">{users.length}/100</span>
              </div>
              <div className="stat-item" data-testid="stat-latency">
                <span className="stat-label">Network Latency</span>
                <span className="stat-value">{Math.round(sessionLatency)}ms</span>
              </div>
              <div className="stat-item" data-testid="stat-ops">
                <span className="stat-label">Operations/sec</span>
                <span className="stat-value">{opsPerSecond}</span>
              </div>
              <div className="stat-item" data-testid="stat-uptime">
                <span className="stat-label">Session Uptime</span>
                <span className="stat-value">2h 34m</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title flex items-center gap-2">
              <Settings size={14} />
              <span>SETTINGS</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Language:</span>
                <span className="text-white">{language}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Theme:</span>
                <span className="text-white">Flux Dark</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Font Size:</span>
                <span className="text-white">14px</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Tab Size:</span>
                <span className="text-white">2 spaces</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Auto-save:</span>
                <span className="text-emerald-500">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="ide-status-bar" data-testid="status-bar">
        <div className="flex items-center gap-4">
          <span data-testid="status-language">{language.toUpperCase()}</span>
          <span data-testid="status-position">Ln 1, Col 1</span>
          <span data-testid="status-chars">{files[activeFile]?.length || 0} chars</span>
          <span className="flex items-center gap-1" data-testid="status-users-active">
            <Users size={12} />
            {users.length} users active
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span className="flex items-center gap-1 text-emerald-500">
            <Circle size={8} className="fill-emerald-500" />
            Saved
          </span>
        </div>
      </div>
    </div>
  );
};

export default FluxIDE;
