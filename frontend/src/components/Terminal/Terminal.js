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

    // ULTIMATE MONKEY PATCH: Safeguard at the Prototype Level
    // We're patching the xterm.js internals to handle undefined dimensions globally
    try {
      if (term._core) {
        // Intercept viewport initialization at the instance level
        const originalOpen = term.open.bind(term);
        term.open = (parent) => {
          originalOpen(parent);
          
          // Once opened, we can access the viewport
          const core = term._core;
          if (core.viewport && !core.viewport._isPatched) {
            const originalRefresh = core.viewport._innerRefresh.bind(core.viewport);
            core.viewport._innerRefresh = () => {
              // The CRITICAL Check: Ensure renderService and its dimensions exist
              if (core._renderService && core._renderService.dimensions) {
                try {
                  originalRefresh();
                } catch (e) {
                  // Silent catch for race conditions during render
                }
              }
            };
            core.viewport._isPatched = true;
          }
        };

        // Also safeguard the RenderService.onResize method
        const originalOnResize = term._core._renderService.onResize?.bind(term._core._renderService);
        if (originalOnResize) {
          term._core._renderService.onResize = (cols, rows) => {
            try {
              originalOnResize(cols, rows);
            } catch (e) {
              // Ignore resize errors during layout transitions
            }
          };
        }
      }
    } catch (e) {
      console.warn('Xterm safety patch failed', e);
    }
    
    // Safety Wrapper for FitAddon
    const fitAddon = new FitAddon();
    const safeFit = () => {
      if (!term.element || !term._core?._charSizeService?.hasValidSize) return;
      try {
        fitAddon.fit();
      } catch (e) {
        // Silent catch for xterm internal dimensions errors
      }
    };

    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Use a series of delayed fits to ensure the container is fully rendered
    const timers = [
      setTimeout(safeFit, 50),
      setTimeout(safeFit, 200),
      setTimeout(safeFit, 500)
    ];

    const resizeObserver = new ResizeObserver(() => {
      if (!terminalRef.current || terminalRef.current.clientWidth === 0 || terminalRef.current.clientHeight === 0) return;
      requestAnimationFrame(safeFit);
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
      timers.forEach(clearTimeout);
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
