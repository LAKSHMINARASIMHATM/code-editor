import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const Terminal = ({ socket }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new XTerm({
      theme: {
        background: '#0a0a0a',
        foreground: '#E5E5E5',
        cursor: '#F97316',
        black: '#000000',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#EC4899',
        cyan: '#06B6D4',
        white: '#E5E5E5',
        brightBlack: '#64748B',
        brightRed: '#F87171',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#60A5FA',
        brightMagenta: '#F472B6',
        brightCyan: '#22D3EE',
        brightWhite: '#F5F5F5',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Safety patches for xterm dimension issues
    try {
      if (!XTerm.prototype._isGlobalPatched) {
        const originalOnError = window.onerror;
        window.onerror = function (message, source, lineno, colno, error) {
          if (typeof message === 'string' && (message.includes('cell') || message.includes('getCoords'))) {
            return true;
          }
          if (originalOnError) return originalOnError.apply(this, arguments);
          return false;
        };
        XTerm.prototype._isGlobalPatched = true;
      }
    } catch (e) {
      console.warn('xterm safety patch failed', e);
    }

    term.open(terminalRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Command line state
    let currentLine = '';
    const commandHistory = [];
    let historyIndex = -1;
    let isExecuting = false;

    // Welcome message
    term.writeln('\x1b[1;36m╔═══════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║      \x1b[1;32mFlux IDE Terminal v2.0\x1b[1;36m       ║\x1b[0m');
    term.writeln('\x1b[1;36m╚═══════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[2mType "help" for available commands.\x1b[0m');
    term.writeln('');
    term.write('$ ');

    // Handle user input with command line support
    const dataDisposable = term.onData(data => {
      if (isExecuting) return;

      const code = data.charCodeAt(0);

      if (code === 13) {
        // Enter key - execute command
        term.write('\r\n');
        if (currentLine.trim()) {
          commandHistory.push(currentLine);
          historyIndex = commandHistory.length;

          // Send command to backend
          if (socket && socket.connected) {
            isExecuting = true;
            socket.emit('terminal_command', { command: currentLine });
          } else {
            term.writeln('\x1b[1;31m✗ Error: Not connected to server\x1b[0m');
            term.write('$ ');
          }
        } else {
          term.write('$ ');
        }
        currentLine = '';
      } else if (code === 127) {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code === 27) {
        // Escape sequences (arrow keys)
        if (data === '\x1b[A') {
          // Up arrow - previous command
          if (historyIndex > 0) {
            historyIndex--;
            term.write('\r\x1b[K$ ');
            currentLine = commandHistory[historyIndex];
            term.write(currentLine);
          }
        } else if (data === '\x1b[B') {
          // Down arrow - next command
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            term.write('\r\x1b[K$ ');
            currentLine = commandHistory[historyIndex];
            term.write(currentLine);
          } else if (historyIndex === commandHistory.length - 1) {
            historyIndex = commandHistory.length;
            term.write('\r\x1b[K$ ');
            currentLine = '';
          }
        }
      } else if (code >= 32 && code <= 126) {
        // Printable characters
        currentLine += data;
        term.write(data);
      } else if (code === 3) {
        // Ctrl+C
        term.write('^C\r\n$ ');
        currentLine = '';
        isExecuting = false;
      } else if (code === 12) {
        // Ctrl+L (clear)
        term.clear();
        term.write('$ ');
        currentLine = '';
      }
    });

    // Handle terminal output from server
    const handleOutput = (data) => {
      isExecuting = false;
      if (term && data.output) {
        if (data.output === '\x1b[2J\x1b[H') {
          term.clear();
        } else {
          term.write(data.output);
        }
        term.write('$ ');
      }
    };

    if (socket) {
      socket.on('terminal_output', handleOutput);
    }

    // ResizeObserver for responsive fitting
    const resizeObserver = new ResizeObserver(() => {
      if (!terminalRef.current || terminalRef.current.clientWidth === 0) return;
      requestAnimationFrame(() => {
        if (xtermRef.current && fitAddonRef.current) {
          try {
            const hasSize = xtermRef.current._core?._charSizeService?.hasValidSize;
            if (hasSize && xtermRef.current.element) {
              fitAddonRef.current.fit();
              if (socket && xtermRef.current.cols && xtermRef.current.rows) {
                socket.emit('terminal_resize', {
                  cols: xtermRef.current.cols,
                  rows: xtermRef.current.rows
                });
              }
            }
          } catch (e) { }
        }
      });
    });

    resizeObserver.observe(terminalRef.current);

    // Initial fit
    const initialFit = setTimeout(() => {
      if (fitAddonRef.current && xtermRef.current?.element) {
        try {
          fitAddonRef.current.fit();
          // Focus terminal automatically
          xtermRef.current.focus();
        } catch (e) { }
      }
    }, 100);

    // Focus terminal on click
    const focusHandler = () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    };

    if (terminalRef.current) {
      terminalRef.current.addEventListener('click', focusHandler);
    }

    return () => {
      clearTimeout(initialFit);
      resizeObserver.disconnect();
      dataDisposable.dispose();
      if (socket) {
        socket.off('terminal_output', handleOutput);
      }
      if (terminalRef.current) {
        terminalRef.current.removeEventListener('click', focusHandler);
      }
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [socket]); // Only depend on socket, not onData!

  return (
    <div
      ref={terminalRef}
      className="w-full h-full min-h-[200px] overflow-hidden bg-[#0a0a0a]"
      style={{ padding: '8px', cursor: 'text' }}
    />
  );
};

export default Terminal;
