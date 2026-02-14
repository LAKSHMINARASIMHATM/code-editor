import React, { useState, useRef } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import './DockPanel.css';

/**
 * DockPanel Component
 * A tabbed panel container with drag-and-drop support
 */
export const DockPanel = ({
    tabs = [],
    activeTab,
    onTabChange,
    onTabClose,
    onTabDrop,
    onMaximize,
    isMaximized = false,
    className = '',
    showHeader = true,
    actions = [],
    children
}) => {
    const [dragOverTabId, setDragOverTabId] = useState(null);
    const draggedTabRef = useRef(null);

    const handleDragStart = (e, tab) => {
        draggedTabRef.current = tab;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tab.id);
        e.target.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        draggedTabRef.current = null;
        setDragOverTabId(null);
    };

    const handleDragOver = (e, tab) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverTabId(tab.id);
    };

    const handleDragLeave = () => {
        setDragOverTabId(null);
    };

    const handleDrop = (e, targetTab) => {
        e.preventDefault();
        setDragOverTabId(null);

        if (draggedTabRef.current && draggedTabRef.current.id !== targetTab.id && onTabDrop) {
            onTabDrop(draggedTabRef.current, targetTab);
        }
    };

    const activeTabData = tabs.find(t => t.id === activeTab);

    return (
        <div className={`dock-panel ${isMaximized ? 'maximized' : ''} ${className}`}>
            {showHeader && (
                <div className="dock-panel-header">
                    <div className="dock-panel-tabs">
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                className={`dock-panel-tab ${activeTab === tab.id ? 'active' : ''} ${dragOverTabId === tab.id ? 'drag-over' : ''}`}
                                onClick={() => onTabChange?.(tab.id)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, tab)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, tab)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, tab)}
                            >
                                {tab.icon && <span className="dock-panel-tab-icon">{tab.icon}</span>}
                                <span className="dock-panel-tab-label">{tab.label}</span>
                                {tab.closable !== false && (
                                    <button
                                        className="dock-panel-tab-close"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTabClose?.(tab.id);
                                        }}
                                        title="Close"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                {tab.badge && <span className="dock-panel-tab-badge">{tab.badge}</span>}
                            </div>
                        ))}
                    </div>

                    <div className="dock-panel-actions">
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                className="dock-panel-action"
                                onClick={action.onClick}
                                title={action.title}
                            >
                                {action.icon}
                            </button>
                        ))}
                        {onMaximize && (
                            <button
                                className="dock-panel-action"
                                onClick={onMaximize}
                                title={isMaximized ? 'Restore' : 'Maximize'}
                            >
                                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="dock-panel-content">
                {/* Render children instead of tab content */}
                {React.Children.toArray(children)}
            </div>
        </div>
    );
};

export default DockPanel;
