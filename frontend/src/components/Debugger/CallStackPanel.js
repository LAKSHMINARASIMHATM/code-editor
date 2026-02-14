import React from 'react';
import { Layers } from 'lucide-react';
import './CallStackPanel.css';

/**
 * Call Stack Panel Component
 * Shows the call stack during debugging
 */
export const CallStackPanel = ({ stack = [], activeFrame = 0, onFrameSelect }) => {
    return (
        <div className="callstack-panel">
            {stack.length === 0 ? (
                <div className="callstack-empty">
                    <Layers size={32} />
                    <p>No call stack available</p>
                    <p className="callstack-hint">Pause execution to view the call stack</p>
                </div>
            ) : (
                <div className="callstack-list">
                    {stack.map((frame, idx) => (
                        <div
                            key={idx}
                            className={`callstack-frame ${idx === activeFrame ? 'active' : ''}`}
                            onClick={() => onFrameSelect?.(idx)}
                        >
                            <div className="frame-index">{idx}</div>
                            <div className="frame-content">
                                <div className="frame-function">{frame.function || '(anonymous)'}</div>
                                <div className="frame-location">
                                    {frame.file}
                                    {frame.line && `:${frame.line}`}
                                    {frame.column && `:${frame.column}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CallStackPanel;
