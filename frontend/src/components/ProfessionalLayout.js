import { FolderOpen, GitBranch, Package, Bug, Users, Settings, Terminal, AlertCircle, FileText, Wrench, Sparkles, History } from 'lucide-react';
import { ResizablePanel } from '../lib/layout/ResizablePanel';
import { DockPanel } from '../lib/layout/DockPanel';
import FileTree from './FileTree/FileTree';
import { GitPanel } from './Git/GitPanel';
import { ExtensionsPanel } from './Extensions/ExtensionsPanel';
import { VariablesPanel } from './Debugger/VariablesPanel';
import { WatchPanel } from './Debugger/WatchPanel';
import { CallStackPanel } from './Debugger/CallStackPanel';
import { BreakpointsPanel } from './Debugger/BreakpointsPanel';
import { SettingsPanel } from './Settings/SettingsPanel';
import { ThemeCustomizer } from './Themes/ThemeCustomizer';
import { ProblemsPanel } from './Problems/ProblemsPanel';
import { OutputPanel } from './Output/OutputPanel';
import TerminalComponent from './Terminal/Terminal';
import Chat from './Chat/Chat';
import ActiveUsers from './Collaboration/ActiveUsers';
import ActivityPanel from './Collaboration/ActivityPanel';
import { AIAssistant } from './AIAssistant/AIAssistant';
import './ProfessionalLayout.css';

/**
 * Professional IDE Layout Component
 * Implements VS Code-style 3-panel layout with Activity Bar and Status Bar
 */
export const ProfessionalLayout = ({
    layout,
    setActivePanel,
    updatePanelSize,
    togglePanel,
    fileList,
    activeFile,
    onFileClick,
    onFileAction,
    editorComponent,
    gitRepository,
    onGitAction,
    extensions,
    installedExtensions,
    onExtensionInstall,
    onExtensionUninstall,
    onExtensionToggle,
    onExtensionSearch,
    debugVariables,
    watchExpressions,
    callStack,
    breakpoints,
    onEditVariable,
    onAddWatch,
    onRemoveWatch,
    onFrameSelect,
    onToggleBreakpoint,
    onRemoveBreakpoint,
    onClearBreakpoints,
    problems,
    onProblemNavigate,
    outputChannels,
    localRepos,
    users,
    activityLogs,
    socket,
    username,
    settings,
    onUpdateSettings,
    onOpenFolder
}) => {
    const leftPanel = layout?.panels?.left || { visible: true, size: 280, activePanel: 'explorer' };
    const rightPanel = layout?.panels?.right || { visible: true, size: 300, activePanel: 'collaboration' };
    const bottomPanel = layout?.panels?.bottom || { visible: true, size: 200, activePanel: 'terminal' };

    // Activity Bar Items (Left)
    const activityItems = [
        { id: 'explorer', icon: FolderOpen, label: 'Explorer' },
        { id: 'git', icon: GitBranch, label: 'Source Control' },
        { id: 'extensions', icon: Package, label: 'Extensions' },
    ];

    const currentLocalUser = users?.find(u => u.isLocal);

    return (
        <div className="professional-layout">
            <div className="workspace-container">
                {/* ACTIVITY BAR (Far Left) */}
                <div className="activity-bar">
                    {activityItems.map(item => (
                        <div
                            key={item.id}
                            className={`activity-item ${(leftPanel.activePanel || 'explorer') === item.id ? 'active' : ''}`}
                            onClick={() => setActivePanel?.('left', item.id)}
                            title={item.label}
                        >
                            <item.icon />
                        </div>
                    ))}
                    <div className="activity-spacer" />
                    <div className="activity-item" title="Accounts">
                        <Users size={24} />
                    </div>
                    <div className="activity-item" title="Settings">
                        <Settings size={24} />
                    </div>
                </div>

                {/* LEFT SIDEBAR */}
                <div className="layout-sidebar left" style={{ width: leftPanel.size }}>
                    <div className="sidebar-header">
                        <span>{activityItems.find(i => i.id === (leftPanel.activePanel || 'explorer'))?.label || 'EXPLORER'}</span>
                    </div>
                    <div className="sidebar-content">
                        {(leftPanel.activePanel || 'explorer') === 'explorer' && (
                            <FileTree
                                files={fileList || []}
                                activeFile={activeFile}
                                onFileClick={onFileClick}
                                onFileAction={(action, item) => {
                                    if (action === 'openFolder') {
                                        onOpenFolder?.();
                                    } else {
                                        onFileAction?.(action, item);
                                    }
                                    // Ensure panel stays open or focuses editor if needed
                                }}
                            />
                        )}
                        {leftPanel.activePanel === 'git' && (
                            <GitPanel
                                repository={{ ...gitRepository, localRepos }}
                                onGitAction={onGitAction}
                                socket={socket}
                                users={users}
                            />
                        )}
                        {leftPanel.activePanel === 'extensions' && (
                            <ExtensionsPanel
                                extensions={extensions || []}
                                installedExtensions={installedExtensions || []}
                                onInstall={onExtensionInstall}
                                onUninstall={onExtensionUninstall}
                                onToggle={onExtensionToggle}
                            />
                        )}
                    </div>
                </div>

                {/* CENTER AREA - Editor + Bottom Panel */}
                <div className="layout-center-wrapper">
                    {/* Editor */}
                    <div className="layout-center">
                        {editorComponent}
                    </div>

                    {/* BOTTOM PANEL - Below Editor */}
                    <div className="layout-bottom" style={{ height: bottomPanel.size }}>
                        <div className="bottom-tabs">
                            <button
                                className={`bottom-tab ${(bottomPanel.activePanel || 'terminal') === 'terminal' ? 'active' : ''}`}
                                onClick={() => setActivePanel?.('bottom', 'terminal')}
                            >
                                <Terminal size={14} style={{ marginRight: 6 }} />
                                <span>TERMINAL</span>
                            </button>
                            <button
                                className={`bottom-tab ${bottomPanel.activePanel === 'problems' ? 'active' : ''}`}
                                onClick={() => setActivePanel?.('bottom', 'problems')}
                            >
                                <AlertCircle size={14} style={{ marginRight: 6 }} />
                                <span>PROBLEMS</span>
                                {problems?.length > 0 && <span className="tab-badge">{problems.length}</span>}
                            </button>
                            <button
                                className={`bottom-tab ${bottomPanel.activePanel === 'output' ? 'active' : ''}`}
                                onClick={() => setActivePanel?.('bottom', 'output')}
                            >
                                <FileText size={14} style={{ marginRight: 6 }} />
                                <span>OUTPUT</span>
                            </button>
                        </div>
                        <div className="bottom-content">
                            {(bottomPanel.activePanel || 'terminal') === 'terminal' && (
                                <TerminalComponent socket={socket} isVisible={true} />
                            )}
                            {bottomPanel.activePanel === 'problems' && (
                                <ProblemsPanel problems={problems || []} onNavigate={onProblemNavigate} onClear={() => { }} />
                            )}
                            {bottomPanel.activePanel === 'output' && (
                                <OutputPanel channels={outputChannels || []} activeChannel="terminal" />
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR (Auxiliary Tools) */}
                <div className="layout-sidebar right" style={{ width: rightPanel.size }}>
                    {/* Right panels use a header-tab style similar to left but inline */}
                    <div className="sidebar-header" style={{ justifyContent: 'space-between', paddingRight: 5 }}>
                        <span style={{ opacity: 0.7 }}>AUXILIARY</span>
                        <div className="flex gap-1" style={{ display: 'flex' }}>
                            {[
                                { id: 'debug', icon: Bug },
                                { id: 'collaboration', icon: Users },
                                { id: 'timeline', icon: History },
                                { id: 'ai', icon: Sparkles }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActivePanel?.('right', item.id)}
                                    className={`p-1 rounded hover:bg-white/10 ${rightPanel.activePanel === item.id ? 'text-blue-500' : 'text-gray-400'}`}
                                    title={item.id.toUpperCase()}
                                >
                                    <item.icon size={16} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="sidebar-content">
                        {rightPanel.activePanel === 'debug' && (
                            <div className="debug-panels">
                                <VariablesPanel variables={debugVariables || []} onEditVariable={onEditVariable} />
                                <WatchPanel watches={watchExpressions || []} onAddWatch={onAddWatch} onRemoveWatch={onRemoveWatch} />
                                <CallStackPanel stack={callStack || []} activeFrame={0} onFrameSelect={onFrameSelect} />
                                <BreakpointsPanel
                                    breakpoints={breakpoints || []}
                                    onToggleBreakpoint={onToggleBreakpoint}
                                    onRemoveBreakpoint={onRemoveBreakpoint}
                                    onClearAll={onClearBreakpoints}
                                />
                            </div>
                        )}
                        {(rightPanel.activePanel === 'collaboration' || !rightPanel.activePanel) && (
                            <div className="h-full flex flex-col">
                                <ActiveUsers users={users || []} />
                                <div className="flex-1 min-h-0">
                                    <Chat
                                        socket={socket}
                                        currentUser={currentLocalUser || { name: username || 'User', id: socket?.id, color: { color: '#F97316' }, role: 'member' }}
                                        users={users}
                                    />
                                </div>
                            </div>
                        )}
                        {rightPanel.activePanel === 'timeline' && (
                            <ActivityPanel logs={activityLogs || []} />
                        )}
                        {rightPanel.activePanel === 'ai' && (
                            <AIAssistant
                                socket={socket}
                                activeFile={activeFile}
                                selectedCode={""}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* STATUS BAR */}
            <div className="status-bar">
                <div className="flex items-center" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="status-item bg-blue-600/20 px-2 rounded-sm text-blue-400">
                        <GitBranch size={12} style={{ marginRight: 4 }} />
                        <span>{gitRepository?.currentBranch || 'main'}</span>
                    </div>
                    <div className="status-item">
                        <AlertCircle size={12} style={{ marginRight: 4 }} />
                        <span>{problems?.length || 0} Problems</span>
                    </div>
                    {currentLocalUser && (
                        <div className="status-item">
                            <Users size={12} style={{ marginRight: 4 }} />
                            <span>{users?.length || 1} Online</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center" style={{ display: 'flex', alignItems: 'center' }}>
                    {currentLocalUser?.cursor && (
                        <div className="status-item">
                            Ln {currentLocalUser.cursor.lineNumber}, Col {currentLocalUser.cursor.column}
                        </div>
                    )}
                    <div className="status-item">UTF-8</div>
                    <div className="status-item">JavaScript</div>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalLayout;
