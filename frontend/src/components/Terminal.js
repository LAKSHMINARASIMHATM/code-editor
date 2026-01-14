import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const Terminal = ({ socket, isVisible }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current || !isVisible) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
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
      cols: 80,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;32mFlux IDE Terminal\x1b[0m');
    term.writeln('Type "help" for available commands.\n');
    term.write('$ ');

    let currentLine = '';
    const commandHistory = [];
    let historyIndex = -1;

    // Handle user input
    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        // Enter key
        term.write('\r\n');
        if (currentLine.trim()) {
          commandHistory.push(currentLine);
          historyIndex = commandHistory.length;
          
          // Send command to backend
          if (socket && socket.connected) {
            socket.emit('terminal_command', { command: currentLine });
          } else {
            // Fallback if not connected
            term.writeln('\x1b[1;31mError: Not connected to server\x1b[0m');
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
        // Escape sequences (arrow keys, etc.)
        // Handle arrow keys for command history
        if (data === '\x1b[A') {
          // Up arrow
          if (historyIndex > 0) {
            historyIndex--;
            // Clear current line
            term.write('\r\x1b[K$ ');
            currentLine = commandHistory[historyIndex];
            term.write(currentLine);
          }
        } else if (data === '\x1b[B') {
          // Down arrow
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
      }
    });

    // Handle terminal output from server
    const handleTerminalOutput = (data) => {
      if (data.output === '\x1b[2J\x1b[H') {
        term.clear();
        term.write('$ ');
      } else {
        term.write(data.output);
        term.write('$ ');
      }
    };

    if (socket) {
      socket.on('terminal_output', handleTerminalOutput);
    }

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (socket) {
        socket.off('terminal_output', handleTerminalOutput);
      }
      term.dispose();
    };
  }, [socket, isVisible]);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        padding: '8px',
        display: isVisible ? 'block' : 'none',
      }}
      data-testid="terminal"
    />
  );
};

export default Terminal;