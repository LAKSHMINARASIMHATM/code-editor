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
 * Implements VS Code-style 3-panel layout
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

    return (
        <div className="professional-layout">
            {/* LEFT SIDEBAR */}
            <div className="layout-sidebar left" style={{ width: leftPanel.size }}>
                <div className="sidebar-tabs">
                    <button
                        className={`sidebar-tab ${(leftPanel.activePanel || 'explorer') === 'explorer' ? 'active' : ''}`}
                        onClick={() => setActivePanel?.('left', 'explorer')}
                    >
                        <FolderOpen size={14} />
                        <span>EXPLORER</span>
                    </button>
                    <button
                        className={`sidebar-tab ${leftPanel.activePanel === 'git' ? 'active' : ''}`}
                        onClick={() => setActivePanel?.('left', 'git')}
                    >
                        <GitBranch size={14} />
                        <span>GIT</span>
                    </button>
                    <button
                        className={`sidebar-tab ${leftPanel.activePanel === 'extensions' ? 'active' : ''}`}
                        onClick={() => setActivePanel?.('left', 'extensions')}
                    >
                        <Package size={14} />
                        <span>EXTENSIONS</span>
                    </button>
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
                            <Terminal size={14} />
                            <span>TERMINAL</span>
                        </button>
                        <button
                            className={`bottom-tab ${bottomPanel.activePanel === 'problems' ? 'active' : ''}`}
                            onClick={() => setActivePanel?.('bottom', 'problems')}
                        >
                            <AlertCircle size={14} />
                            <span>PROBLEMS</span>
                            {problems?.length > 0 && <span className="tab-badge">{problems.length}</span>}
                        </button>
                        <button
                            className={`bottom-tab ${bottomPanel.activePanel === 'output' ? 'active' : ''}`}
                            onClick={() => setActivePanel?.('bottom', 'output')}
                        >
                            <FileText size={14} />
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

            {/* RIGHT SIDEBAR */}
            <div className="layout-sidebar right" style={{ width: rightPanel.size }}>
                <div className="sidebar-tabs">
                    <button
                        className={`sidebar-tab ${rightPanel.activePanel === 'debug' ? 'active' : ''}`}
                        onClick={() => setActivePanel?.('right', 'debug')}
                    >
                        <Bug size={14} />
                        <span>DEBUG</span>
                    </button>
                    <button
                        className={`sidebar-tab ${(rightPanel.activePanel || 'collaboration') === 'collaboration' ? 'active' : ''}`}
                        onClick={() => setActivePanel?.('right', 'collaboration')}
                    >
                        <Users size={14} />
                        <span>COLLABORATION</span>
                        {users?.length > 0 && <span className="tab-badge">{users.length}</span>}
                    </button>
                    <button
                        className={`sidebar-tab ${rightPanel.activePanel === 'timeline' ? 'active' : ''}`}
                        onClick={() => setActivePanel?.('right', 'timeline')}
                    >
                        <History size={14} />
                        <span>TIMELINE</span>
                        {activityLogs?.length > 0 && <span className="tab-badge">{activityLogs.length}</span>}
                    </button>
                    <button
                        className={`sidebar-tab ${rightPanel.activePanel === 'ai' ? 'active' : ''}`}
                        onClick={() => setActivePanel?.('right', 'ai')}
                    >
                        <Sparkles size={14} />
                        <span>AI ASSISTANT</span>
                    </button>
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
                                    currentUser={users?.find(u => u.isLocal) || { name: username || 'User', id: socket?.id, color: { color: '#F97316' }, role: 'member' }}
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
    );
};

export default ProfessionalLayout;
