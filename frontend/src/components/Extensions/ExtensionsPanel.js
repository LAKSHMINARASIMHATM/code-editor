import React, { useState } from 'react';
import { Search, Download, Trash2, RefreshCw, Star, Check } from 'lucide-react';
import './ExtensionsPanel.css';

/**
 * Extensions Marketplace Panel
 * Browse, install, and manage IDE extensions
 */
export const ExtensionsPanel = ({
    extensions = [],
    installedExtensions = [],
    onInstall,
    onUninstall,
    onToggle,
    onUpdate,
    onSearch
}) => {
    const [view, setView] = useState('marketplace'); // 'marketplace' or 'installed'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = ['all', 'themes', 'languages', 'debuggers', 'formatters', 'snippets', 'productivity'];

    const filteredExtensions = (view === 'marketplace' ? extensions : installedExtensions).filter(ext => {
        if (view === 'marketplace' && onSearch) return true; // Let backend handle filtering for marketplace
        const matchesSearch = !searchTerm ||
            ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ext.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const isInstalled = (extId) => installedExtensions.some(e => e.id === extId);
    const getInstalledExt = (extId) => installedExtensions.find(e => e.id === extId);

    return (
        <div className="extensions-panel">
            <div className="extensions-header">
                <div className="view-toggle">
                    <button
                        className={`view-btn ${view === 'marketplace' ? 'active' : ''}`}
                        onClick={() => setView('marketplace')}
                    >
                        Marketplace
                    </button>
                    <button
                        className={`view-btn ${view === 'installed' ? 'active' : ''}`}
                        onClick={() => setView('installed')}
                    >
                        Installed ({installedExtensions.length})
                    </button>
                </div>
            </div>

            <div className="extensions-filters">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search extensions..."
                        value={searchTerm}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchTerm(value);
                            if (onSearch) {
                                // Debounce search
                                if (window.searchTimeout) clearTimeout(window.searchTimeout);
                                window.searchTimeout = setTimeout(() => {
                                    onSearch(value);
                                }, 500);
                            }
                        }}
                    />
                </div>

                <div className="category-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="extensions-list">
                {filteredExtensions.length === 0 ? (
                    <div className="extensions-empty">
                        <p>No extensions found</p>
                    </div>
                ) : (
                    filteredExtensions.map(ext => {
                        const installed = isInstalled(ext.id);
                        const installedExt = getInstalledExt(ext.id);

                        return (
                            <div key={ext.id} className="extension-card">
                                <div className="ext-icon">
                                    {ext.icon || '📦'}
                                </div>
                                <div className="ext-content">
                                    <div className="ext-header">
                                        <h3 className="ext-name">{ext.name}</h3>
                                        <div className="ext-rating">
                                            <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                            <span>{ext.rating || '4.5'}</span>
                                        </div>
                                    </div>
                                    <p className="ext-description">{ext.description}</p>
                                    <div className="ext-meta">
                                        <span className="ext-author">{ext.author}</span>
                                        <span className="ext-downloads">{ext.downloads || '1K'} downloads</span>
                                        <span className="ext-version">v{ext.version || '1.0.0'}</span>
                                    </div>
                                </div>
                                <div className="ext-actions">
                                    {installed ? (
                                        <>
                                            {installedExt?.enabled ? (
                                                <button
                                                    className="ext-btn success"
                                                    onClick={() => onToggle?.(ext.id, false)}
                                                    title="Disable"
                                                >
                                                    <Check size={16} />
                                                    Enabled
                                                </button>
                                            ) : (
                                                <button
                                                    className="ext-btn"
                                                    onClick={() => onToggle?.(ext.id, true)}
                                                    title="Enable"
                                                >
                                                    Enable
                                                </button>
                                            )}
                                            {ext.hasUpdate && (
                                                <button
                                                    className="ext-btn update"
                                                    onClick={() => onUpdate?.(ext.id)}
                                                    title="Update available"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            )}
                                            <button
                                                className="ext-btn danger"
                                                onClick={() => onUninstall?.(ext.id)}
                                                title="Uninstall"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="ext-btn install"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onInstall?.(ext.id);
                                            }}
                                        >
                                            <Download size={14} />
                                            Install
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ExtensionsPanel;
