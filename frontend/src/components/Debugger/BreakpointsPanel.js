import React from 'react';
import { Circle, Trash2, Play, Pause } from 'lucide-react';
import './BreakpointsPanel.css';

/**
 * Breakpoints Panel Component
 * Manages all breakpoints with conditional and hit-count support
 */
export const BreakpointsPanel = ({
    breakpoints = [],
    onToggleBreakpoint,
    onRemoveBreakpoint,
    onEditCondition,
    onClearAll
}) => {
    const handleConditionEdit = (bp) => {
        const condition = prompt('Enter condition (e.g., x > 10):', bp.condition || '');
        if (condition !== null && onEditCondition) {
            onEditCondition(bp.id, condition);
        }
    };

    return (
        <div className="breakpoints-panel">
            <div className="breakpoints-header">
                {breakpoints.length > 0 && (
                    <button className="clear-all-bp" onClick={onClearAll} title="Remove all breakpoints">
                        <Trash2 size={14} />
                        Clear All
                    </button>
                )}
            </div>

            <div className="breakpoints-list">
                {breakpoints.length === 0 ? (
                    <div className="breakpoints-empty">
                        <Circle size={32} />
                        <p>No breakpoints set</p>
                        <p className="breakpoints-hint">Click in the editor gutter to add</p>
                    </div>
                ) : (
                    breakpoints.map((bp) => (
                        <div key={bp.id} className={`breakpoint-item ${bp.enabled ? 'enabled' : 'disabled'}`}>
                            <button
                                className="bp-toggle"
                                onClick={() => onToggleBreakpoint?.(bp.id)}
                                title={bp.enabled ? 'Disable' : 'Enable'}
                            >
                                {bp.enabled ? (
                                    <Circle size={12} className="bp-icon enabled" fill="currentColor" />
                                ) : (
                                    <Circle size={12} className="bp-icon disabled" />
                                )}
                            </button>

                            <div className="bp-content" onClick={() => handleConditionEdit(bp)}>
                                <div className="bp-location">
                                    {bp.file}:{bp.line}
                                </div>
                                {bp.condition && (
                                    <div className="bp-condition">
                                        Condition: <code>{bp.condition}</code>
                                    </div>
                                )}
                                {bp.hitCount && (
                                    <div className="bp-hitcount">
                                        Hit count: {bp.hitCount}
                                    </div>
                                )}
                            </div>

                            <button
                                className="bp-remove"
                                onClick={() => onRemoveBreakpoint?.(bp.id)}
                                title="Remove breakpoint"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BreakpointsPanel;
