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

    // Create terminal instance
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
    
    // Safety: Patch the terminal's internal core to prevent the "dimensions" error
    // This is the most robust way to handle the library's internal race condition
    if (term._core) {
      const core = term._core;
      const originalOpen = term.open.bind(term);
      
      term.open = (parent) => {
        try {
          originalOpen(parent);
          
          // Patch the viewport refresh after opening
          if (core.viewport) {
            const originalRefresh = core.viewport._innerRefresh.bind(core.viewport);
            core.viewport._innerRefresh = () => {
              // Only refresh if dimensions are available
              if (core._renderService && core._renderService.dimensions) {
                try {
                  originalRefresh();
                } catch (e) {}
              }
            };
          }
        } catch (e) {
          console.warn('Terminal open failed', e);
        }
      };
    }
    
    term.open(terminalRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Use a ResizeObserver with layout validation
    const resizeObserver = new ResizeObserver(() => {
      if (!terminalRef.current || terminalRef.current.clientWidth === 0) return;
      
      requestAnimationFrame(() => {
        if (xtermRef.current && fitAddonRef.current) {
          try {
            // Only fit if the terminal has a valid internal size
            const hasSize = xtermRef.current._core?._charSizeService?.hasValidSize;
            if (hasSize && xtermRef.current.element) {
              fitAddonRef.current.fit();
            }
          } catch (e) {}
        }
      });
    });
    
    resizeObserver.observe(terminalRef.current);

    const dataDisposable = term.onData(data => {
      if (socket) {
        socket.emit('terminal_input', { input: data });
      }
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

    // Initial fit attempt after a short delay
    const initialFit = setTimeout(() => {
      if (fitAddonRef.current && xtermRef.current?.element) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {}
      }
    }, 100);

    return () => {
      clearTimeout(initialFit);
      resizeObserver.disconnect();
      dataDisposable.dispose();
      if (socket) {
        socket.off('terminal_output', handleOutput);
      }
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
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
