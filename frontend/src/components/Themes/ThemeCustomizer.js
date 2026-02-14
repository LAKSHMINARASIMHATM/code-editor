import React, { useState } from 'react';
import { Palette, Eye, Download, Upload, Trash2 } from 'lucide-react';
import './ThemeCustomizer.css';

/**
 * Theme Customizer Component
 * Preview and customize color themes
 */
export const ThemeCustomizer = ({ currentTheme = 'fluxDark', onThemeChange, onSaveTheme }) => {
    const [activeTab, setActiveTab] = useState('presets'); // 'presets' or 'custom'
    const [customColors, setCustomColors] = useState({});

    const themes = [
        {
            id: 'fluxDark',
            name: 'Flux Dark',
            preview: {
                background: '#0a0a0a',
                foreground: '#ffffff',
                accent: '#F97316',
                sidebar: '#141414'
            }
        },
        {
            id: 'light',
            name: 'Light',
            preview: {
                background: '#ffffff',
                foreground: '#000000',
                accent: '#F97316',
                sidebar: '#f5f5f5'
            }
        },
        {
            id: 'highContrast',
            name: 'High Contrast',
            preview: {
                background: '#000000',
                foreground: '#ffffff',
                accent: '#00ff00',
                sidebar: '#000000'
            }
        },
        {
            id: 'monokai',
            name: 'Monokai',
            preview: {
                background: '#272822',
                foreground: '#F8F8F2',
                accent: '#F92672',
                sidebar: '#3E3D32'
            }
        },
        {
            id: 'dracula',
            name: 'Dracula',
            preview: {
                background: '#282a36',
                foreground: '#f8f8f2',
                accent: '#ff79c6',
                sidebar: '#21222c'
            }
        },
        {
            id: 'nord',
            name: 'Nord',
            preview: {
                background: '#2e3440',
                foreground: '#eceff4',
                accent: '#88c0d0',
                sidebar: '#3b4252'
            }
        }
    ];

    const colorCategories = {
        'Base Colors': ['background', 'foreground', 'accent', 'sidebar', 'panel'],
        'Syntax': ['keyword', 'string', 'number', 'comment', 'function', 'variable'],
        'UI Elements': ['button', 'input', 'border', 'selection', 'warning', 'error']
    };

    const handleThemeSelect = (themeId) => {
        onThemeChange?.(themeId);
    };

    const handleColorChange = (category, key, value) => {
        setCustomColors({
            ...customColors,
            [key]: value
        });
    };

    const handleSaveCustomTheme = () => {
        const themeName = prompt('Enter theme name:');
        if (themeName && onSaveTheme) {
            onSaveTheme({
                id: `custom-${Date.now()}`,
                name: themeName,
                colors: customColors
            });
        }
    };

    const handleExportTheme = () => {
        const theme = themes.find(t => t.id === currentTheme);
        const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${theme?.name || 'theme'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportTheme = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const theme = JSON.parse(event.target.result);
                    onSaveTheme?.(theme);
                } catch (error) {
                    alert('Invalid theme file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="theme-customizer">
            <div className="theme-header">
                <div className="view-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
                        onClick={() => setActiveTab('presets')}
                    >
                        <Palette size={16} />
                        Presets
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
                        onClick={() => setActiveTab('custom')}
                    >
                        Custom
                    </button>
                </div>

                <div className="theme-actions">
                    <button className="icon-action" onClick={handleImportTheme} title="Import theme">
                        <Upload size={16} />
                    </button>
                    <button className="icon-action" onClick={handleExportTheme} title="Export theme">
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {activeTab === 'presets' ? (
                <div className="themes-grid">
                    {themes.map(theme => (
                        <div
                            key={theme.id}
                            className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
                            onClick={() => handleThemeSelect(theme.id)}
                        >
                            <div className="theme-preview">
                                <div className="preview-colors">
                                    <div style={{ background: theme.preview.background }} />
                                    <div style={{ background: theme.preview.sidebar }} />
                                    <div style={{ background: theme.preview.accent }} />
                                    <div style={{ background: theme.preview.foreground }} />
                                </div>
                            </div>
                            <div className="theme-info">
                                <span className="theme-name">{theme.name}</span>
                                {currentTheme === theme.id && <Eye size={14} className="active-icon" />}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="custom-colors">
                    {Object.entries(colorCategories).map(([category, colors]) => (
                        <div key={category} className="color-category">
                            <h4 className="category-title">{category}</h4>
                            <div className="color-inputs">
                                {colors.map(colorKey => (
                                    <div key={colorKey} className="color-input-group">
                                        <label>{colorKey}</label>
                                        <div className="color-input">
                                            <input
                                                type="color"
                                                value={customColors[colorKey] || '#F97316'}
                                                onChange={(e) => handleColorChange(category, colorKey, e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                value={customColors[colorKey] || '#F97316'}
                                                onChange={(e) => handleColorChange(category, colorKey, e.target.value)}
                                                placeholder="#F97316"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button className="save-theme-btn" onClick={handleSaveCustomTheme}>
                        Save Custom Theme
                    </button>
                </div>
            )}
        </div>
    );
};

export default ThemeCustomizer;
