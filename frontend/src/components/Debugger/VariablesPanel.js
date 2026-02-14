import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';
import './VariablesPanel.css';

/**
 * Variables Panel Component
 * Displays local and global variables during debugging
 */
export const VariablesPanel = ({ variables = {}, onEditVariable }) => {
    const [expandedPaths, setExpandedPaths] = useState(new Set());
    const [editingVar, setEditingVar] = useState(null);
    const [editValue, setEditValue] = useState('');

    const toggleExpand = (path) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const handleEdit = (path, value) => {
        setEditingVar(path);
        setEditValue(String(value));
    };

    const handleSaveEdit = (path) => {
        if (onEditVariable) {
            onEditVariable(path, editValue);
        }
        setEditingVar(null);
    };

    const renderValue = (value, path, depth = 0) => {
        const isExpanded = expandedPaths.has(path);
        const isEditing = editingVar === path;

        // Primitive types
        if (value === null) return <span className="var-value null">null</span>;
        if (value === undefined) return <span className="var-value undefined">undefined</span>;
        if (typeof value === 'string') return <span className="var-value string">"{value}"</span>;
        if (typeof value === 'number') return <span className="var-value number">{value}</span>;
        if (typeof value === 'boolean') return <span className="var-value boolean">{String(value)}</span>;
        if (typeof value === 'function') return <span className="var-value function">ƒ {value.name || 'anonymous'}</span>;

        // Objects and Arrays
        if (typeof value === 'object') {
            const isArray = Array.isArray(value);
            const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
            const preview = isArray ? `Array(${value.length})` : `Object {${entries.length}}`;

            return (
                <div className="var-object">
                    <div className="var-object-header" onClick={() => toggleExpand(path)}>
                        {entries.length > 0 && (
                            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        )}
                        <span className="var-value object">{preview}</span>
                    </div>
                    {isExpanded && entries.length > 0 && (
                        <div className="var-object-children">
                            {entries.map(([key, val]) => {
                                const childPath = `${path}.${key}`;
                                return (
                                    <div key={key} className="var-item" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                                        <span className="var-name">{key}:</span>
                                        {renderValue(val, childPath, depth + 1)}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return <span className="var-value unknown">{String(value)}</span>;
    };

    const scopes = {
        Local: variables.local || {},
        Global: variables.global || {},
        Closure: variables.closure || {}
    };

    return (
        <div className="variables-panel">
            {Object.entries(scopes).map(([scopeName, scopeVars]) => {
                const vars = Object.entries(scopeVars);
                if (vars.length === 0) return null;

                return (
                    <div key={scopeName} className="variable-scope">
                        <div className="scope-header">{scopeName}</div>
                        <div className="scope-variables">
                            {vars.map(([name, value]) => {
                                const path = `${scopeName}.${name}`;
                                const isEditing = editingVar === path;

                                return (
                                    <div key={name} className="var-item">
                                        <span className="var-name">{name}:</span>
                                        {isEditing ? (
                                            <input
                                                className="var-edit-input"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => handleSaveEdit(path)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit(path);
                                                    if (e.key === 'Escape') setEditingVar(null);
                                                }}
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="var-value-container" onDoubleClick={() => handleEdit(path, value)}>
                                                {renderValue(value, path)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {Object.values(scopes).every(s => Object.keys(s).length === 0) && (
                <div className="variables-empty">
                    <Eye size={32} />
                    <p>No variables in scope</p>
                </div>
            )}
        </div>
    );
};

export default VariablesPanel;
