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
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
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
      scrollback: 10000,
      allowTransparency: true,
      cursorStyle: 'block',
      fontWeight: 'normal',
      fontWeightBold: 'bold',
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;36m╔═══════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║      \x1b[1;32mFlux IDE Terminal v2.0\x1b[1;36m       ║\x1b[0m');
    term.writeln('\x1b[1;36m╚═══════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[2mType "help" for available commands.\x1b[0m');
    term.writeln('');
    term.write('$ ');

    let currentLine = '';
    const commandHistory = [];
    let historyIndex = -1;
    let isExecuting = false;

    // Handle user input
    term.onData((data) => {
      if (isExecuting) return;

      const code = data.charCodeAt(0);

      if (code === 13) {
        // Enter key
        term.write('\r\n');
        if (currentLine.trim()) {
          commandHistory.push(currentLine);
          historyIndex = commandHistory.length;

          // Send command to backend
          if (socket && socket.connected) {
            isExecuting = true;
            socket.emit('terminal_command', { command: currentLine });
          } else {
            // Fallback if not connected
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
        } else if (data === '\x1b[C') {
          // Right arrow - ignore for now
        } else if (data === '\x1b[D') {
          // Left arrow - ignore for now
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
    const handleTerminalOutput = (data) => {
      isExecuting = false;

      if (data.output === '\x1b[2J\x1b[H') {
        term.clear();
        term.write('$ ');
      } else {
        // Write the output
        if (data.output) {
          term.write(data.output);
        }
        // Show prompt
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

        // Notify server of new dimensions
        if (socket && xtermRef.current) {
          socket.emit('terminal_resize', {
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows
          });
        }
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial resize
    setTimeout(() => handleResize(), 100);

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
        background: '#0a0a0a',
      }}
      data-testid="terminal"
    />
  );
};

export default Terminal;