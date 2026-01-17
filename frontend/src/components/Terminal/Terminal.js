import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Terminal = ({ onData, socket }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

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

    // Use a delayed initial fit to ensure the container is fully rendered
    const timeoutId = setTimeout(() => {
      if (fitAddonRef.current && xtermRef.current?.element) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          console.warn('Initial terminal fit failed', e);
        }
      }
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      if (!terminalRef.current || terminalRef.current.clientWidth === 0 || terminalRef.current.clientHeight === 0) return;

      requestAnimationFrame(() => {
        if (!xtermRef.current || !fitAddonRef.current) return;
        try {
          // Terminal must have internal geometry ready before fit()
          if (xtermRef.current.element && xtermRef.current._core?._charSizeService?.hasValidSize) {
            fitAddonRef.current.fit();
          }
        } catch (e) {
          // Ignore transient resize errors
        }
      });
    });
    
    resizeObserver.observe(terminalRef.current);

    const dataDisposable = term.onData(data => {
      if (onData) onData(data);
    });

    const handleOutput = (data) => {
      if (term) {
        term.write(data.output);
      }
    };

    if (socket) {
      socket.on('terminal_output', handleOutput);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      dataDisposable.dispose();
      if (socket) {
        socket.off('terminal_output', handleOutput);
      }
      term.dispose();
    };
  }, [socket, onData]);

  return (
    <div 
      ref={terminalRef} 
      className="w-full h-full min-h-[200px] overflow-hidden bg-[#0a0a0a]"
      style={{ padding: '8px' }}
    />
  );
};

export default Terminal;
