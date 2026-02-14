import React, { useState, useRef, useEffect } from 'react';
import {
    FileText, Folder, FolderOpen, ChevronRight, ChevronDown,
    MoreVertical, Edit2, Trash2, FilePlus, FolderPlus, Eye,
    Copy, Scissors, ClipboardPaste, File
} from 'lucide-react';
import './ContextMenu.css';

/**
 * Context Menu Component for File Tree
 * Provides right-click menu with file/folder operations
 */
export const ContextMenu = ({ x, y, item, onClose, onAction }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const menuItems = item?.isDirectory ? [
        { id: 'newFile', label: 'New File', icon: FilePlus, shortcut: 'Ctrl+N' },
        { id: 'newFolder', label: 'New Folder', icon: FolderPlus, shortcut: 'Ctrl+Shift+N' },
        { divider: true },
        { id: 'rename', label: 'Rename', icon: Edit2, shortcut: 'F2' },
        { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'Del', danger: true },
        { divider: true },
        { id: 'copy', label: 'Copy', icon: Copy, shortcut: 'Ctrl+C' },
        { id: 'cut', label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X' },
        { id: 'paste', label: 'Paste', icon: ClipboardPaste, shortcut: 'Ctrl+V' },
        { divider: true },
        { id: 'reveal', label: 'Reveal in File Explorer', icon: Eye }
    ] : [
        { id: 'open', label: 'Open', icon: File },
        { id: 'openWith', label: 'Open With...', icon: FileText },
        { divider: true },
        { id: 'rename', label: 'Rename', icon: Edit2, shortcut: 'F2' },
        { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'Del', danger: true },
        { divider: true },
        { id: 'copy', label: 'Copy', icon: Copy, shortcut: 'Ctrl+C' },
        { id: 'cut', label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X' },
        { divider: true },
        { id: 'copyPath', label: 'Copy Path', icon: Copy },
        { id: 'copyRelativePath', label: 'Copy Relative Path', icon: Copy },
        { divider: true },
        { id: 'reveal', label: 'Reveal in File Explorer', icon: Eye }
    ];

    const handleItemClick = (actionId) => {
        onAction(actionId, item);
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{ left: x, top: y }}
        >
            {menuItems.map((menuItem, idx) =>
                menuItem.divider ? (
                    <div key={idx} className="context-menu-divider" />
                ) : (
                    <button
                        key={menuItem.id}
                        className={`context-menu-item ${menuItem.danger ? 'danger' : ''}`}
                        onClick={() => handleItemClick(menuItem.id)}
                    >
                        <menuItem.icon size={14} className="context-menu-item-icon" />
                        <span className="context-menu-item-label">{menuItem.label}</span>
                        {menuItem.shortcut && (
                            <span className="context-menu-item-shortcut">{menuItem.shortcut}</span>
                        )}
                    </button>
                )
            )}
        </div>
    );
};

export default ContextMenu;
