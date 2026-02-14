import React, { useState, useRef, useEffect } from 'react';
import './ResizablePanel.css';

/**
 * ResizablePanel Component
 * A panel that can be resized by dragging its edge
 */
export const ResizablePanel = ({
    children,
    direction = 'horizontal', // 'horizontal' or 'vertical'
    defaultSize = 250,
    minSize = 150,
    maxSize = 600,
    onResize,
    className = '',
    collapsible = true,
    collapsed = false,
    onCollapse
}) => {
    const [size, setSize] = useState(defaultSize);
    const [isResizing, setIsResizing] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const panelRef = useRef(null);
    const startPosRef = useRef(0);
    const startSizeRef = useRef(0);

    useEffect(() => {
        setIsCollapsed(collapsed);
    }, [collapsed]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsResizing(true);
        startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
        startSizeRef.current = size;

        document.body.style.cursor = direction === 'horizontal' ? 'ew-resize' : 'ns-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;

            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
            const delta = currentPos - startPosRef.current;
            const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));

            setSize(newSize);
            if (onResize) {
                onResize(newSize);
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, direction, minSize, maxSize, onResize]);

    const toggleCollapse = () => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        if (onCollapse) {
            onCollapse(newCollapsed);
        }
    };

    const sizeStyle = direction === 'horizontal'
        ? { width: isCollapsed ? 0 : size }
        : { height: isCollapsed ? 0 : size };

    return (
        <div
            ref={panelRef}
            className={`resizable-panel ${direction} ${isCollapsed ? 'collapsed' : ''} ${className}`}
            style={sizeStyle}
        >
            <div className="resizable-panel-content">
                {!isCollapsed && children}
            </div>

            {!isCollapsed && (
                <div
                    className={`resize-handle ${direction} ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={handleMouseDown}
                >
                    <div className="resize-handle-indicator" />
                </div>
            )}

            {collapsible && (
                <button
                    className={`collapse-button ${direction} ${isCollapsed ? 'collapsed' : ''}`}
                    onClick={toggleCollapse}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d={direction === 'horizontal'
                            ? (isCollapsed ? 'M4 2 L8 6 L4 10' : 'M8 2 L4 6 L8 10')
                            : (isCollapsed ? 'M2 4 L6 8 L10 4' : 'M2 8 L6 4 L10 8')
                        } />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default ResizablePanel;
