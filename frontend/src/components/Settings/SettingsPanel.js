import React, { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import './SettingsPanel.css';

/**
 * Settings Panel Component
 * Side-by-side GUI and JSON editor for IDE settings
 */
export const SettingsPanel = ({ settings = {}, onUpdateSettings, schema = {} }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState('gui'); // 'gui' or 'json'
    const [jsonValue, setJsonValue] = useState(JSON.stringify(settings, null, 2));
    const [jsonError, setJsonError] = useState(null);

    const handleSettingChange = (category, key, value) => {
        if (onUpdateSettings) {
            onUpdateSettings({
                ...settings,
                [category]: {
                    ...settings[category],
                    [key]: value
                }
            });
        }
    };

    const handleJsonSave = () => {
        try {
            const parsed = JSON.parse(jsonValue);
            setJsonError(null);
            if (onUpdateSettings) {
                onUpdateSettings(parsed);
            }
        } catch (error) {
            setJsonError(error.message);
        }
    };

    const handleResetDefaults = () => {
        if (window.confirm('Reset all settings to defaults?')) {
            onUpdateSettings?.({});
        }
    };

    const settingsConfig = {
        editor: {
            fontSize: { type: 'number', label: 'Font Size', min: 10, max: 30, default: 14 },
            fontFamily: { type: 'text', label: 'Font Family', default: 'Consolas, Monaco, monospace' },
            tabSize: { type: 'number', label: 'Tab Size', min: 2, max: 8, default: 4 },
            wordWrap: { type: 'select', label: 'Word Wrap', options: ['off', 'on', 'wordWrapColumn'], default: 'off' },
            minimap: { type: 'boolean', label: 'Show Minimap', default: true },
            lineNumbers: { type: 'boolean', label: 'Show Line Numbers', default: true },
            rulers: { type: 'text', label: 'Rulers (comma-separated)', default: '80' }
        },
        workbench: {
            colorTheme: { type: 'select', label: 'Color Theme', options: ['Flux Dark', 'Light', 'High Contrast'], default: 'Flux Dark' },
            iconTheme: { type: 'select', label: 'Icon Theme', options: ['Material', 'VS Code', 'Eclipse', 'Minimal'], default: 'Material' },
            sideBarLocation: { type: 'select', label: 'Sidebar Location', options: ['left', 'right'], default: 'left' },
            activityBarVisible: { type: 'boolean', label: 'Show Activity Bar', default: true },
            statusBarVisible: { type: 'boolean', label: 'Show Status Bar', default: true }
        },
        terminal: {
            defaultShell: { type: 'select', label: 'Default Shell', options: ['bash', 'zsh', 'PowerShell', 'cmd', 'sh'], default: 'bash' },
            fontSize: { type: 'number', label: 'Font Size', min: 10, max: 20, default: 12 },
            cursorStyle: { type: 'select', label: 'Cursor Style', options: ['block', 'underline', 'bar'], default: 'block' }
        },
        extensions: {
            autoUpdate: { type: 'boolean', label: 'Auto Update Extensions', default: true },
            recommendationsEnabled: { type: 'boolean', label: 'Show Recommendations', default: true }
        }
    };

    const filteredSettings = Object.entries(settingsConfig).reduce((acc, [category, categorySettings]) => {
        const filtered = Object.entries(categorySettings).filter(([key, config]) =>
            !searchTerm ||
            key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            config.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[category] = Object.fromEntries(filtered);
        }
        return acc;
    }, {});

    const renderSetting = (category, key, config) => {
        const value = settings[category]?.[key] ?? config.default;

        switch (config.type) {
            case 'boolean':
                return (
                    <label className="setting-toggle">
                        <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleSettingChange(category, key, e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                );
            case 'number':
                return (
                    <input
                        type="number"
                        className="setting-input"
                        value={value}
                        min={config.min}
                        max={config.max}
                        onChange={(e) => handleSettingChange(category, key, parseInt(e.target.value))}
                    />
                );
            case 'text':
                return (
                    <input
                        type="text"
                        className="setting-input"
                        value={value}
                        onChange={(e) => handleSettingChange(category, key, e.target.value)}
                    />
                );
            case 'select':
                return (
                    <select
                        className="setting-select"
                        value={value}
                        onChange={(e) => handleSettingChange(category, key, e.target.value)}
                    >
                        {config.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                );
            default:
                return null;
        }
    };

    return (
        <div className="settings-panel">
            <div className="settings-header">
                <div className="settings-view-toggle">
                    <button
                        className={`view-btn ${activeView === 'gui' ? 'active' : ''}`}
                        onClick={() => setActiveView('gui')}
                    >
                        Settings
                    </button>
                    <button
                        className={`view-btn ${activeView === 'json' ? 'active' : ''}`}
                        onClick={() => setActiveView('json')}
                    >
                        JSON
                    </button>
                </div>

                <button className="reset-btn" onClick={handleResetDefaults} title="Reset to defaults">
                    <RotateCcw size={14} />
                    Reset
                </button>
            </div>

            {activeView === 'gui' ? (
                <>
                    <div className="settings-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search settings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="settings-content">
                        {Object.entries(filteredSettings).map(([category, categorySettings]) => (
                            <div key={category} className="settings-category">
                                <h3 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                                <div className="category-settings">
                                    {Object.entries(categorySettings).map(([key, config]) => (
                                        <div key={key} className="setting-item">
                                            <div className="setting-label">
                                                <span>{config.label}</span>
                                                <span className="setting-key">{category}.{key}</span>
                                            </div>
                                            <div className="setting-control">
                                                {renderSetting(category, key, config)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="settings-json">
                    <textarea
                        className={`json-editor ${jsonError ? 'error' : ''}`}
                        value={jsonValue}
                        onChange={(e) => setJsonValue(e.target.value)}
                        spellCheck={false}
                    />
                    {jsonError && <div className="json-error">{jsonError}</div>}
                    <button className="json-save-btn" onClick={handleJsonSave}>
                        Save JSON
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsPanel;
