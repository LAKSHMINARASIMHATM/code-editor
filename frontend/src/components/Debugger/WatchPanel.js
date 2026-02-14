import React, { useState } from 'react';
import { Plus, X, Eye } from 'lucide-react';
import './WatchPanel.css';

/**
 * Watch Panel Component
 * Allows watching custom expressions during debugging
 */
export const WatchPanel = ({ watches = [], onAddWatch, onRemoveWatch, onEvaluate }) => {
    const [newExpression, setNewExpression] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        if (newExpression.trim() && onAddWatch) {
            onAddWatch(newExpression.trim());
            setNewExpression('');
            setIsAdding(false);
        }
    };

    const renderValue = (value) => {
        if (value === null) return <span className="watch-value null">null</span>;
        if (value === undefined) return <span className="watch-value undefined">undefined</span>;
        if (typeof value === 'string') return <span className="watch-value string">"{value}"</span>;
        if (typeof value === 'number') return <span className="watch-value number">{value}</span>;
        if (typeof value === 'boolean') return <span className="watch-value boolean">{String(value)}</span>;
        if (typeof value === 'object') {
            const preview = Array.isArray(value) ? `[${value.length}]` : '{...}';
            return <span className="watch-value object">{preview}</span>;
        }
        return <span className="watch-value">{String(value)}</span>;
    };

    return (
        <div className="watch-panel">
            <div className="watch-header">
                <button
                    className="add-watch-btn"
                    onClick={() => setIsAdding(!isAdding)}
                    title="Add watch expression"
                >
                    <Plus size={14} />
                    Add Watch
                </button>
            </div>

            {isAdding && (
                <div className="watch-input-container">
                    <input
                        className="watch-input"
                        placeholder="Expression to watch..."
                        value={newExpression}
                        onChange={(e) => setNewExpression(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd();
                            if (e.key === 'Escape') {
                                setIsAdding(false);
                                setNewExpression('');
                            }
                        }}
                        autoFocus
                    />
                    <button className="watch-input-btn confirm" onClick={handleAdd}>
                        ✓
                    </button>
                    <button
                        className="watch-input-btn cancel"
                        onClick={() => {
                            setIsAdding(false);
                            setNewExpression('');
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="watch-list">
                {watches.map((watch, idx) => (
                    <div key={idx} className="watch-item">
                        <div className="watch-expression">
                            <code>{watch.expression}</code>
                        </div>
                        <div className="watch-result">
                            {watch.error ? (
                                <span className="watch-error">{watch.error}</span>
                            ) : (
                                renderValue(watch.value)
                            )}
                        </div>
                        <button
                            className="watch-remove"
                            onClick={() => onRemoveWatch?.(idx)}
                            title="Remove watch"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {watches.length === 0 && !isAdding && (
                    <div className="watch-empty">
                        <Eye size={32} />
                        <p>No watch expressions</p>
                        <p className="watch-hint">Click "Add Watch" to monitor an expression</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchPanel;
