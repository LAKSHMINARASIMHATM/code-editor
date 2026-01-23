import React, { useState, useMemo } from 'react';
import {
    ChevronRight, ChevronDown,
    Folder, FolderOpen,
    FileText, FileCode, FileJson, FileType, File,
    Image, Database, Settings, Lock, Package
} from 'lucide-react';

// File icon mapping based on extension
const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        // JavaScript/TypeScript
        'js': { icon: FileCode, color: '#F7DF1E' },
        'jsx': { icon: FileCode, color: '#61DAFB' },
        'ts': { icon: FileCode, color: '#3178C6' },
        'tsx': { icon: FileCode, color: '#3178C6' },
        // Styles
        'css': { icon: FileType, color: '#1572B6' },
        'scss': { icon: FileType, color: '#CC6699' },
        'less': { icon: FileType, color: '#1D365D' },
        // Data
        'json': { icon: FileJson, color: '#F7DF1E' },
        'xml': { icon: FileCode, color: '#E34F26' },
        'yaml': { icon: FileCode, color: '#CB171E' },
        'yml': { icon: FileCode, color: '#CB171E' },
        // Python
        'py': { icon: FileCode, color: '#3776AB' },
        'pyw': { icon: FileCode, color: '#3776AB' },
        // Web
        'html': { icon: FileCode, color: '#E34F26' },
        'htm': { icon: FileCode, color: '#E34F26' },
        'vue': { icon: FileCode, color: '#4FC08D' },
        'svelte': { icon: FileCode, color: '#FF3E00' },
        // Config
        'env': { icon: Lock, color: '#ECD53F' },
        'gitignore': { icon: Settings, color: '#F05032' },
        'eslintrc': { icon: Settings, color: '#4B32C3' },
        'prettierrc': { icon: Settings, color: '#F7B93E' },
        // Images
        'png': { icon: Image, color: '#89CFF0' },
        'jpg': { icon: Image, color: '#89CFF0' },
        'jpeg': { icon: Image, color: '#89CFF0' },
        'gif': { icon: Image, color: '#89CFF0' },
        'svg': { icon: Image, color: '#FFB13B' },
        'ico': { icon: Image, color: '#89CFF0' },
        // Docs
        'md': { icon: FileText, color: '#083FA1' },
        'txt': { icon: FileText, color: '#888888' },
        'pdf': { icon: FileText, color: '#FF0000' },
        // Database
        'sql': { icon: Database, color: '#336791' },
        'db': { icon: Database, color: '#336791' },
        // Package
        'lock': { icon: Package, color: '#CB3837' },
    };

    // Special file names
    const nameMap = {
        'package.json': { icon: Package, color: '#CB3837' },
        'package-lock.json': { icon: Package, color: '#CB3837' },
        'tsconfig.json': { icon: Settings, color: '#3178C6' },
        'webpack.config.js': { icon: Settings, color: '#8DD6F9' },
        'vite.config.js': { icon: Settings, color: '#646CFF' },
        '.gitignore': { icon: Settings, color: '#F05032' },
        '.env': { icon: Lock, color: '#ECD53F' },
        '.env.local': { icon: Lock, color: '#ECD53F' },
        'README.md': { icon: FileText, color: '#083FA1' },
    };

    return nameMap[fileName] || iconMap[ext] || { icon: File, color: '#888888' };
};

// Build tree structure from flat file list
const buildFileTree = (files) => {
    const root = { name: '', children: {}, isDirectory: true };

    files.forEach(file => {
        const parts = file.name.split('/');
        let current = root;

        parts.forEach((part, index) => {
            if (!current.children[part]) {
                const isFile = index === parts.length - 1;
                current.children[part] = {
                    name: part,
                    fullPath: parts.slice(0, index + 1).join('/'),
                    children: {},
                    isDirectory: !isFile,
                    language: isFile ? file.language : null,
                };
            }
            current = current.children[part];
        });
    });

    return root;
};

// Sort children: directories first, then files, alphabetically
const sortChildren = (children) => {
    return Object.values(children).sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
    });
};

// TreeNode component
const TreeNode = ({ node, depth, activeFile, onFileClick, expandedFolders, onToggleFolder }) => {
    const isExpanded = expandedFolders.has(node.fullPath);
    const isActive = activeFile === node.fullPath;
    const hasChildren = Object.keys(node.children).length > 0;

    const handleClick = () => {
        if (node.isDirectory) {
            onToggleFolder(node.fullPath);
        } else {
            onFileClick(node.fullPath);
        }
    };

    const { icon: IconComponent, color } = node.isDirectory
        ? { icon: isExpanded ? FolderOpen : Folder, color: '#F97316' }
        : getFileIcon(node.name);

    return (
        <div className="file-tree-node">
            <div
                className={`file-tree-item ${isActive ? 'active' : ''} ${node.isDirectory ? 'directory' : 'file'}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleClick}
            >
                {node.isDirectory ? (
                    <span className="tree-arrow">
                        {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                    </span>
                ) : (
                    <span className="tree-arrow-placeholder" style={{ width: 14 }} />
                )}
                <IconComponent size={16} style={{ color, flexShrink: 0 }} />
                <span className="file-name" title={node.name}>{node.name}</span>
            </div>

            {node.isDirectory && isExpanded && hasChildren && (
                <div className="file-tree-children">
                    {sortChildren(node.children).map((child) => (
                        <TreeNode
                            key={child.fullPath}
                            node={child}
                            depth={depth + 1}
                            activeFile={activeFile}
                            onFileClick={onFileClick}
                            expandedFolders={expandedFolders}
                            onToggleFolder={onToggleFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Main FileTree component
export const FileTree = ({ files, activeFile, onFileClick }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set());

    const tree = useMemo(() => buildFileTree(files), [files]);

    const toggleFolder = (path) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    // Expand all folders on first load
    React.useEffect(() => {
        if (files.length > 0 && expandedFolders.size === 0) {
            const allFolders = new Set();
            files.forEach(file => {
                const parts = file.name.split('/');
                let path = '';
                parts.slice(0, -1).forEach((part, i) => {
                    path = path ? `${path}/${part}` : part;
                    allFolders.add(path);
                });
            });
            // Only expand root folder by default
            const rootFolders = [...allFolders].filter(f => !f.includes('/'));
            setExpandedFolders(new Set(rootFolders));
        }
    }, [files, expandedFolders.size]);

    const rootNodes = sortChildren(tree.children);

    if (rootNodes.length === 0) {
        return null;
    }

    return (
        <div className="file-tree-container">
            {rootNodes.map((node) => (
                <TreeNode
                    key={node.fullPath}
                    node={node}
                    depth={0}
                    activeFile={activeFile}
                    onFileClick={onFileClick}
                    expandedFolders={expandedFolders}
                    onToggleFolder={toggleFolder}
                />
            ))}
        </div>
    );
};

export default FileTree;
