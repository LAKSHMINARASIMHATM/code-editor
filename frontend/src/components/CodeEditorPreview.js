import { useState } from 'react';
import {
    Users,
    MessageSquare,
    Play,
    Bug,
    FolderTree,
    ChevronRight,
} from 'lucide-react';

const tabs = [
    { id: "editor", label: "Live Editor", icon: Users },
    { id: "debug", label: "Debugging", icon: Bug },
    { id: "files", label: "Project Files", icon: FolderTree },
];

export function CodeEditorPreview() {
    const [activeTab, setActiveTab] = useState("editor");
    const [selectedFile, setSelectedFile] = useState("index.tsx");

    return (
        <section className="px-6 py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl text-balance">
                        Everything you need in one place
                    </h2>
                    <p className="mx-auto max-w-2xl text-muted-foreground">
                        A complete cloud IDE with real-time collaboration, intelligent code completion, and live debugging—all in
                        your browser.
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex items-center gap-1 border-b border-border bg-secondary/50 p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${activeTab === tab.id ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                        <div className="ml-auto flex items-center gap-2 px-4">
                            <div className="flex -space-x-2">
                                <div className="h-6 w-6 rounded-full border-2 border-card bg-chart-1 flex items-center justify-center text-xs text-card font-medium">
                                    S
                                </div>
                                <div className="h-6 w-6 rounded-full border-2 border-card bg-chart-2 flex items-center justify-center text-xs text-card font-medium">
                                    M
                                </div>
                                <div className="h-6 w-6 rounded-full border-2 border-card bg-chart-3 flex items-center justify-center text-xs text-card font-medium">
                                    A
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">3 online</span>
                        </div>
                    </div>

                    {activeTab === "editor" && (
                        <div className="grid md:grid-cols-[240px_1fr_280px]">
                            <div className="hidden border-r border-border p-4 md:block">
                                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Explorer</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2 rounded px-2 py-1 text-muted-foreground">
                                        <FolderTree className="h-4 w-4" />
                                        src
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        {['index.tsx', 'App.tsx', 'styles.css'].map((file) => (
                                            <button
                                                key={file}
                                                onClick={() => setSelectedFile(file)}
                                                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors ${selectedFile === file
                                                        ? "bg-accent/10 text-accent"
                                                        : "text-muted-foreground hover:bg-secondary"
                                                    }`}
                                            >
                                                <span className="h-4 w-4 text-center text-xs">ts</span>
                                                {file}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="min-h-[400px] p-4 font-mono text-sm">
                                <div className="space-y-1">
                                    <div className="flex gap-4 leading-6">
                                        <span className="w-6 text-right text-muted-foreground/50">1</span>
                                        <span className="text-foreground">
                                            <span className="text-chart-1">import</span> {'{'} <span className="text-accent-foreground">createServer</span> {'}'}{' '}
                                            <span className="text-chart-1">from</span> <span className="text-chart-2">"http"</span>
                                        </span>
                                    </div>
                                    <div className="flex gap-4 leading-6">
                                        <span className="w-6 text-right text-muted-foreground/50">2</span>
                                        <span className="text-foreground">
                                            <span className="text-chart-1">import</span> {'{'} <span className="text-accent-foreground">WebSocketServer</span> {'}'}{' '}
                                            <span className="text-chart-1">from</span> <span className="text-chart-2">"ws"</span>
                                        </span>
                                    </div>
                                    <div className="flex gap-4 leading-6">
                                        <span className="w-6 text-right text-muted-foreground/50">3</span>
                                        <span className="text-foreground"></span>
                                    </div>
                                    <div className="flex gap-4 leading-6">
                                        <span className="w-6 text-right text-muted-foreground/50">4</span>
                                        <span className="text-foreground">
                                            <span className="text-chart-1">const</span> server = <span className="text-chart-3">createServer</span>()
                                        </span>
                                    </div>
                                    <div className="flex gap-4 leading-6">
                                        <span className="w-6 text-right text-muted-foreground/50">5</span>
                                        <span className="text-foreground">
                                            <span className="text-chart-1">const</span> wss = <span className="text-chart-1">new</span>{' '}
                                            <span className="text-chart-3">WebSocketServer</span>({'{'} server {'}'})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden border-l border-border p-4 md:block">
                                <div className="mb-4 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Session Chat
                                    </span>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded-full bg-chart-1 flex items-center justify-center text-xs text-card font-medium">
                                                S
                                            </div>
                                            <span className="text-muted-foreground">Sarah</span>
                                            <span className="text-xs text-muted-foreground/50">2m ago</span>
                                        </div>
                                        <p className="ml-7 mt-1 text-foreground">Can you review the WebSocket handler?</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded-full bg-chart-2 flex items-center justify-center text-xs text-card font-medium">
                                                M
                                            </div>
                                            <span className="text-muted-foreground">Mike</span>
                                            <span className="text-xs text-muted-foreground/50">1m ago</span>
                                        </div>
                                        <p className="ml-7 mt-1 text-foreground">Looking at it now 👀</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "debug" && (
                        <div className="min-h-[400px] p-8 text-center">
                            <Bug className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">Live Debugging</h3>
                            <p className="text-muted-foreground">Set breakpoints, inspect variables, and debug collaboratively in real-time.</p>
                        </div>
                    )}

                    {activeTab === "files" && (
                        <div className="min-h-[400px] p-8 text-center">
                            <FolderTree className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">Project Files</h3>
                            <p className="text-muted-foreground">Organize and manage your project files with an intuitive file explorer.</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-chart-2" />
                                Connected
                            </span>
                            <span>TypeScript</span>
                            <span>UTF-8</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Ln 8, Col 12</span>
                            <button className="flex items-center gap-1 rounded bg-chart-2/20 px-2 py-0.5 text-chart-2 hover:bg-chart-2/30">
                                <Play className="h-3 w-3" />
                                Run
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
