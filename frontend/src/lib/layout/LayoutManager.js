import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Layout Manager Context
 * Manages panel states, sizes, and layout persistence for the IDE
 */

const LayoutContext = createContext();

const DEFAULT_LAYOUT = {
    leftSidebarWidth: 250,
    rightSidebarWidth: 280,
    bottomPanelHeight: 250,
    panels: {
        // Individual panel definitions (legacy)
        fileExplorer: { visible: true, position: 'left' },
        git: { visible: true, position: 'left' },
        extensions: { visible: false, position: 'left' },
        debugger: { visible: true, position: 'left' },
        activeUsers: { visible: true, position: 'right' },
        chat: { visible: true, position: 'right' },
        terminal: { visible: true, position: 'bottom' },
        problems: { visible: true, position: 'bottom' },
        output: { visible: false, position: 'bottom' },
        debugConsole: { visible: false, position: 'bottom' },
        search: { visible: false, position: 'left' },
        documentation: { visible: false, position: 'right' },
        // Grouped panel structure for ProfessionalLayout
        left: { visible: true, size: 250, activePanel: 'explorer' },
        right: { visible: true, size: 280, activePanel: 'collaboration' },
        bottom: { visible: true, size: 250, activePanel: 'terminal' }
    },
    activePanels: {
        left: 'fileExplorer',
        right: 'activeUsers',
        bottom: 'terminal'
    },
    editorSplits: []
};

export const LayoutProvider = ({ children }) => {
    const [layout, setLayout] = useState(() => {
        // Load layout from localStorage
        const saved = localStorage.getItem('flux-ide-layout');
        if (saved) {
            const savedLayout = JSON.parse(saved);
            // Deep merge panels to preserve new grouped panel structure
            return {
                ...DEFAULT_LAYOUT,
                ...savedLayout,
                panels: {
                    ...DEFAULT_LAYOUT.panels,
                    ...savedLayout.panels,
                    // Ensure grouped panels always exist
                    left: savedLayout.panels?.left || DEFAULT_LAYOUT.panels.left,
                    right: savedLayout.panels?.right || DEFAULT_LAYOUT.panels.right,
                    bottom: savedLayout.panels?.bottom || DEFAULT_LAYOUT.panels.bottom
                }
            };
        }
        return DEFAULT_LAYOUT;
    });

    const [maximizedPanel, setMaximizedPanel] = useState(null);
    const [draggedPanel, setDraggedPanel] = useState(null);

    // Persist layout changes
    useEffect(() => {
        localStorage.setItem('flux-ide-layout', JSON.stringify(layout));
    }, [layout]);

    const updatePanelSize = (region, size) => {
        setLayout(prev => {
            const updates = {
                [`${region}SidebarWidth`]: size,
                [`${region}PanelHeight`]: size
            };

            // Also update the grouped panel structure
            if (prev.panels[region]) {
                updates.panels = {
                    ...prev.panels,
                    [region]: {
                        ...prev.panels[region],
                        size
                    }
                };
            }

            return { ...prev, ...updates };
        });
    };

    const togglePanel = (panelId) => {
        setLayout(prev => {
            // Handle grouped panel regions (left, right, bottom)
            if (['left', 'right', 'bottom'].includes(panelId)) {
                return {
                    ...prev,
                    panels: {
                        ...prev.panels,
                        [panelId]: {
                            ...prev.panels[panelId],
                            visible: !prev.panels[panelId]?.visible
                        }
                    }
                };
            }

            // Handle individual panel IDs
            return {
                ...prev,
                panels: {
                    ...prev.panels,
                    [panelId]: {
                        ...prev.panels[panelId],
                        visible: !prev.panels[panelId]?.visible
                    }
                }
            };
        });
    };

    const showPanel = (panelId) => {
        setLayout(prev => {
            const panel = prev.panels[panelId];
            if (!panel) return prev;

            return {
                ...prev,
                panels: {
                    ...prev.panels,
                    [panelId]: { ...panel, visible: true }
                },
                activePanels: {
                    ...prev.activePanels,
                    [panel.position]: panelId
                }
            };
        });
    };

    const hidePanel = (panelId) => {
        setLayout(prev => ({
            ...prev,
            panels: {
                ...prev.panels,
                [panelId]: {
                    ...prev.panels[panelId],
                    visible: false
                }
            }
        }));
    };

    const setActivePanel = (position, panelId) => {
        setLayout(prev => {
            const updates = {
                ...prev,
                activePanels: {
                    ...prev.activePanels,
                    [position]: panelId
                }
            };

            // Also update the grouped panel structure
            if (prev.panels[position]) {
                updates.panels = {
                    ...prev.panels,
                    [position]: {
                        ...prev.panels[position],
                        activePanel: panelId
                    }
                };
            }

            return updates;
        });
    };

    const movePanel = (panelId, newPosition) => {
        setLayout(prev => ({
            ...prev,
            panels: {
                ...prev.panels,
                [panelId]: {
                    ...prev.panels[panelId],
                    position: newPosition
                }
            }
        }));
    };

    const maximizePanel = (panelId) => {
        setMaximizedPanel(panelId === maximizedPanel ? null : panelId);
    };

    const resetLayout = () => {
        setLayout(DEFAULT_LAYOUT);
        setMaximizedPanel(null);
    };

    const addEditorSplit = (orientation = 'horizontal') => {
        setLayout(prev => ({
            ...prev,
            editorSplits: [...prev.editorSplits, { id: Date.now(), orientation }]
        }));
    };

    const removeEditorSplit = (splitId) => {
        setLayout(prev => ({
            ...prev,
            editorSplits: prev.editorSplits.filter(s => s.id !== splitId)
        }));
    };

    const value = {
        layout,
        maximizedPanel,
        draggedPanel,
        setDraggedPanel,
        updatePanelSize,
        togglePanel,
        showPanel,
        hidePanel,
        setActivePanel,
        movePanel,
        maximizePanel,
        resetLayout,
        addEditorSplit,
        removeEditorSplit
    };

    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};

export default LayoutContext;
