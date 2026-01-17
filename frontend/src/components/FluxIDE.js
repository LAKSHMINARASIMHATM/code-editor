import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { executeCode, extractVariables } from '../utils/codeExecution';
import { 
  Play, Pause, SkipForward, CornerDownRight, CornerUpLeft, 
  RotateCcw, Square, Circle, FileText, FolderOpen, 
  Users, Activity, Zap, Clock, Settings,
  Terminal, Code2, Upload, Download, Save, Plus, Scissors, Copy, ClipboardPaste as Paste, Undo, Redo,
  Layout, Monitor, Maximize, Bug, PlayCircle
} from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `https://${window.location.hostname.replace('5000', '8000')}`;

const FILE_STRUCTURE = [
  { name: 'main.js', language: 'javascript', icon: FileText },
  { name: 'utils.py', language: 'python', icon: FileText },
  { name: 'App.tsx', language: 'typescript', icon: FileText },
  { name: 'styles.css', language: 'css', icon: FileText },
  { name: 'README.md', language: 'markdown', icon: FileText },
];

const INITIAL_CODE = {
  'main.js': `function calculateSum(a, b) {\n  const result = a + b;\n  console.log("Result:", result);\n  return result;\n}\n\nconst numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconsole.log("Doubled:", doubled);\n\n// Collaborative IDE Demo\n`,
  'utils.py': `def calculate_sum(a, b):\n    result = a + b\n    print(f"Result: {result}")\n    return result\n\nnumbers = [1, 2, 3, 4, 5]\ndoubled = [n * 2 for n in numbers]\nprint(f"Doubled: {doubled}")\n`,
  'App.tsx': `import React from 'react';\n\ninterface Props {\n  name: string;\n}\n\nconst App: React.FC<Props> = ({ name }) => {\n  return (\n    <div>\n      <h1>Hello, {name}!</h1>\n    </div>\n  );\n};\n\nexport default App;\n`,
  'styles.css': `.container {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}\n`,
  'README.md': `# Flux IDE\n\nA production-grade collaborative code editor.\n\n## Features\n- Multi-language syntax highlighting\n- Real-time collaboration\n- Intelligent code completion\n- Live debugging\n`,
};

export const FluxIDE = () => {
  const [activeFile, setActiveFile] = useState('main.js');
  const [files, setFiles] = useState(INITIAL_CODE);
  const [fileList, setFileList] = useState(FILE_STRUCTURE);
  const [language, setLanguage] = useState('javascript');
  const [breakpoints, setBreakpoints] = useState(new Set([2]));
  const [consoleOutput, setConsoleOutput] = useState([
    { type: 'success', message: 'IDE initialized successfully', timestamp: Date.now() }
  ]);
  const [watchedVars, setWatchedVars] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionLine, setExecutionLine] = useState(null);
  
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const fileName = file.name;
      
      let lang = 'javascript';
      if (fileName.endsWith('.py')) lang = 'python';
      else if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) lang = 'typescript';
      else if (fileName.endsWith('.css')) lang = 'css';
      else if (fileName.endsWith('.md')) lang = 'markdown';
      else if (fileName.endsWith('.html')) lang = 'html';
      else if (fileName.endsWith('.json')) lang = 'json';

      setFiles(prev => ({ ...prev, [fileName]: content }));
      setFileList(prev => {
        if (prev.find(f => f.name === fileName)) return prev;
        return [...prev, { name: fileName, language: lang, icon: FileText }];
      });
      setActiveFile(fileName);
      setLanguage(lang);
      setConsoleOutput(prev => [...prev, { type: 'success', message: `Imported local file: ${fileName}`, timestamp: Date.now() }]);
    };
    reader.readAsText(file);
    setActiveMenu(null);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
    setActiveMenu(null);
  };

  const changeFile = (fileName) => {
    setActiveFile(fileName);
    const file = fileList.find(f => f.name === fileName);
    if (file) {
      setLanguage(file.language);
    }
  };

  // Menu Handlers
  const menuItems = {
    File: [
      { label: 'New File', icon: Plus, action: () => {
        const name = `file_${fileList.length + 1}.js`;
        setFiles(prev => ({ ...prev, [name]: '// New file\n' }));
        setFileList(prev => [...prev, { name, language: 'javascript', icon: FileText }]);
        setActiveFile(name);
      }},
      { label: 'Open File', icon: FolderOpen, action: triggerFileUpload },
      { label: 'Save', icon: Save, action: () => setConsoleOutput(prev => [...prev, { type: 'success', message: `Saved ${activeFile}`, timestamp: Date.now() }]) },
      { label: 'Download', icon: Download, action: () => {
        const blob = new Blob([files[activeFile]], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile;
        a.click();
      }}
    ],
    Edit: [
      { label: 'Undo', icon: Undo, action: () => editorRef.current?.trigger('keyboard', 'undo', {}) },
      { label: 'Redo', icon: Redo, action: () => editorRef.current?.trigger('keyboard', 'redo', {}) },
      { label: 'Cut', icon: Scissors, action: () => editorRef.current?.trigger('keyboard', 'editor.action.clipboardCutAction', {}) },
      { label: 'Copy', icon: Copy, action: () => editorRef.current?.trigger('keyboard', 'editor.action.clipboardCopyAction', {}) },
      { label: 'Paste', icon: Paste, action: () => editorRef.current?.trigger('keyboard', 'editor.action.clipboardPasteAction', {}) }
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

  // Terminal logic
  useEffect(() => {
    if (!terminalRef.current || !socketRef.current) return;

    const term = new XTerm({
      theme: {
        background: '#0a0a0a',
        foreground: '#E5E5E5',
        cursor: '#F97316',
      },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      allowProposedApi: true
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
        requestAnimationFrame(() => {
          if (xtermRef.current && fitAddonRef.current) {
            try {
              // The terminal itself should exist and be initialized before fitting.
              // We check internal components of the terminal that indicate it's ready.
              const buffer = xtermRef.current._core?._bufferService?.buffer;
              if (buffer && xtermRef.current.element) {
                fitAddonRef.current.fit();
              }
            } catch (e) {
              console.warn('Xterm fit failed', e);
            }
          }
        });
      }
    });
    
    resizeObserver.observe(terminalRef.current);

    term.onData(data => {
      if (socketRef.current) {
        socketRef.current.emit('terminal_input', { input: data });
      }
    });

    const handleOutput = (data) => {
      if (term) {
        term.write(data.output);
      }
    };

    socketRef.current.on('terminal_output', handleOutput);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('terminal_output', handleOutput);
      }
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [socketRef.current]);

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

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = [];
    breakpoints.forEach(line => {
      decorations.push({
        range: new monacoRef.current.Range(line, 1, line, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'breakpoint-decoration',
          glyphMarginHoverMessage: { value: 'Breakpoint' }
        }
      });
    });

    if (executionLine) {
      decorations.push({
        range: new monacoRef.current.Range(executionLine, 1, executionLine, 1),
        options: {
          isWholeLine: true,
          className: 'execution-line-decoration',
          glyphMarginClassName: 'execution-point-decoration'
        }
      });
    }

    const oldDecorations = editorRef.current.getModel()._decorations || [];
    editorRef.current.getModel()._decorations = editorRef.current.deltaDecorations(
      oldDecorations,
      decorations
    );
  }, [breakpoints, executionLine, activeFile]);

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
    const code = files[activeFile];
    const result = executeCode(code, language);
    setConsoleOutput(prev => [...prev, { type: 'info', message: `Running ${activeFile}...`, timestamp: Date.now() }, ...result.output.map(o => ({ ...o, timestamp: Date.now() }))]);
    const vars = extractVariables(code, 1);
    setWatchedVars(vars);
    setTimeout(() => {
      setIsRunning(false);
      setConsoleOutput(prev => [...prev, { type: 'success', message: 'Execution completed', timestamp: Date.now() }]);
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
    <div className="flux-ide" data-testid="flux-ide">
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
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Activity size={16} className="text-emerald-500" />
            <span data-testid="session-users">{users.length}/100 users</span>
          </div>
          <button 
            className="hover:text-white transition-colors" 
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

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
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".js,.py,.tsx,.ts,.css,.md,.html,.json" />
              <button className="file-item w-full flex items-center gap-2 mb-2 p-2 rounded hover:bg-white/5 text-orange-500 border border-orange-500/30 transition-colors" onClick={triggerFileUpload}>
                <Upload size={16} />
                <span>Import Local File</span>
              </button>
              {fileList.map((file) => (
                <div key={file.name} className={`file-item ${activeFile === file.name ? 'active' : ''}`} onClick={() => changeFile(file.name)}>
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
        <div className="ide-editor-container">
          <div className="ide-tabs">
            {fileList.map((file) => (
              <button key={file.name} className={`ide-tab ${activeFile === file.name ? 'active' : ''}`} onClick={() => changeFile(file.name)}>
                <file.icon size={14} /><span>{file.name}</span>
              </button>
            ))}
          </div>
          <div className="ide-editor-wrapper">
            <Editor
              height="100%"
              language={language}
              value={files[activeFile]}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: settings.fontSize,
                minimap: { enabled: settings.minimap },
                wordWrap: settings.wordWrap,
                fontFamily: 'JetBrains Mono, monospace',
                lineNumbers: 'on',
                glyphMargin: true,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
          <div className="panel-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="panel-title flex items-center gap-2"><Terminal size={14} /><span>TERMINAL</span></div>
            <div className="console-output" ref={terminalRef} style={{ height: '200px', overflow: 'hidden' }}></div>
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
                    <div className="text-[10px] text-neutral-500">Line {user.cursor.line}, Col {user.cursor.column}</div>
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
        </div>
      </div>
    </div>
  );
};

export default FluxIDE;
