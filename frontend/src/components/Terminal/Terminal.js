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
    
    // ULTIMATE MONKEY PATCH: The Global fix for xterm internal dimension and cell crashes
    try {
      // 1. Patch the XTerm prototype itself before any instances are created
      if (!XTerm.prototype._isGlobalPatched) {
        const originalOpen = XTerm.prototype.open;
        XTerm.prototype.open = function(parent) {
          originalOpen.call(this, parent);
          const core = this._core;
          
          if (core) {
            // Patch RenderService if it exists
            if (core._renderService && !core._renderService._isPatched) {
              patchRenderService(core._renderService);
            }
            
            // Patch Viewport refresh
            if (core.viewport && !core.viewport._isPatched) {
              const originalRefresh = core.viewport._innerRefresh.bind(core.viewport);
              core.viewport._innerRefresh = () => {
                if (core._renderService && core._renderService.dimensions) {
                  try { originalRefresh(); } catch (e) {}
                }
              };
              core.viewport._isPatched = true;
            }

            // Patch MouseService globally when open is called
            if (core.mouseService && !core.mouseService._isPatched) {
              patchMouseService(core.mouseService, core);
            }
          }
        };

        // 2. Patch MouseService prototype directly if possible
        // Since we can't easily access MouseService constructor, we'll patch the instance
        // But we can also attempt to patch the internal _serviceBrand if xterm exposes it
        XTerm.prototype._isGlobalPatched = true;
      }

      // Helper to apply dimension safety
      function patchRenderService(rs) {
        if (!rs || rs._isPatched) return;
        
        const safeDimensions = {
          device: { 
            char: { width: 0, height: 0 }, 
            cell: { width: 0, height: 0 } 
          },
          canvas: { width: 0, height: 0 },
          scaledChar: { width: 0, height: 0 },
          scaledCell: { width: 0, height: 0 }
        };

        Object.defineProperty(rs, 'dimensions', {
          get: function() { return this._dimensions || safeDimensions; },
          set: function(val) { this._dimensions = val; },
          configurable: true
        });
        rs._isPatched = true;
      }

      // Helper to apply mouse service safety
      function patchMouseService(ms, core) {
        if (!ms || ms._isPatched) return;
        const originalGetCoords = ms.getCoords;
        if (typeof originalGetCoords === 'function') {
          ms.getCoords = function(event, element, colCount, rowCount, isPrecomputed) {
            try {
              // The crash happens because core._renderService.dimensions is undefined
              if (!core._renderService || !core._renderService.dimensions) {
                return undefined;
              }
              return originalGetCoords.call(this, event, element, colCount, rowCount, isPrecomputed);
            } catch (e) {
              return undefined;
            }
          };
        }
        ms._isPatched = true;
      }

      // 3. Patch the specific instance for triple safety
      if (term._core) {
        const core = term._core;
        const instOpen = term.open.bind(term);
        term.open = (parent) => {
          try {
            if (core._renderService) patchRenderService(core._renderService);
            if (core.mouseService) patchMouseService(core.mouseService, core);
            instOpen(parent);
            if (core._renderService) patchRenderService(core._renderService);
            if (core.mouseService) patchMouseService(core.mouseService, core);
          } catch (e) {}
        };
      }
    } catch (e) {
      console.warn('Deep xterm safety patch failed', e);
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
