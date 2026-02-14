import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, File, Settings, Play, Bug, GitBranch, Terminal } from 'lucide-react';
import './CommandPalette.css';

/**
 * Command Palette Component
 * Universal searchable command launcher (Ctrl+Shift+P)
 */
export const CommandPalette = ({ isOpen, onClose, onExecute, commands = [] }) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    const defaultCommands = [
        { id: 'file.new', label: 'File: New File', icon: File, shortcut: 'Ctrl+N', category: 'File' },
        { id: 'file.open', label: 'File: Open File', icon: File, shortcut: 'Ctrl+O', category: 'File' },
        { id: 'file.save', label: 'File: Save', icon: File, shortcut: 'Ctrl+S', category: 'File' },
        { id: 'view.settings', label: 'Preferences: Open Settings', icon: Settings, category: 'View' },
        { id: 'view.command-palette', label: 'View: Show Command Palette', icon: Command, shortcut: 'Ctrl+Shift+P', category: 'View' },
        { id: 'debug.start', label: 'Debug: Start Debugging', icon: Play, shortcut: 'F5', category: 'Debug' },
        { id: 'debug.stop', label: 'Debug: Stop Debugging', icon: Bug, shortcut: 'Shift+F5', category: 'Debug' },
        { id: 'git.commit', label: 'Git: Commit', icon: GitBranch, category: 'Git' },
        { id: 'git.push', label: 'Git: Push', icon: GitBranch, category: 'Git' },
        { id: 'terminal.new', label: 'Terminal: Create New Terminal', icon: Terminal, shortcut: 'Ctrl+`', category: 'Terminal' },
        ...commands
    ];

    const filteredCommands = defaultCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
            e.preventDefault();
            handleExecute(filteredCommands[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose?.();
        }
    };

    const handleExecute = (command) => {
        onExecute?.(command.id);
        onClose?.();
    };

    if (!isOpen) return null;

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div className="command-palette" onClick={(e) => e.stopPropagation()}>
                <div className="command-palette-header">
                    <Search size={18} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="command-palette-results">
                    {filteredCommands.length === 0 ? (
                        <div className="no-results">No commands found</div>
                    ) : (
                        filteredCommands.map((cmd, idx) => {
                            const IconComponent = cmd.icon || Command;
                            return (
                                <div
                                    key={cmd.id}
                                    className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                                    onClick={() => handleExecute(cmd)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                    <IconComponent size={16} className="command-icon" />
                                    <span className="command-label">{cmd.label}</span>
                                    {cmd.shortcut && (
                                        <span className="command-shortcut">{cmd.shortcut}</span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
