"use client"

import type React from "react"

import { useState } from "react"
import {
  Users,
  MessageSquare,
  Play,
  Bug,
  FolderTree,
  ChevronRight,
  Circle,
  Pause,
  StepBack as StepInto,
  Server as StepOver,
  Sprout as StepOut,
  RotateCcw,
  Square,
} from "lucide-react"

const tabs = [
  { id: "editor", label: "Live Editor", icon: Users },
  { id: "debug", label: "Debugging", icon: Bug },
  { id: "files", label: "Project Files", icon: FolderTree },
]

const fileContents: Record<string, { language: string; lines: { num: number; code: React.ReactNode }[] }> = {
  "index.tsx": {
    language: "TypeScript",
    lines: [
      {
        num: 1,
        code: (
          <>
            <span className="text-chart-1">import</span> {"{"} createServer {"}"}{" "}
            <span className="text-chart-1">from</span> <span className="text-chart-2">{'"http"'}</span>
          </>
        ),
      },
      {
        num: 2,
        code: (
          <>
            <span className="text-chart-1">import</span> {"{"} WebSocketServer {"}"}{" "}
            <span className="text-chart-1">from</span> <span className="text-chart-2">{'"ws"'}</span>
          </>
        ),
      },
      { num: 3, code: "" },
      {
        num: 4,
        code: (
          <>
            <span className="text-chart-1">const</span> server = <span className="text-chart-3">createServer</span>()
          </>
        ),
      },
      {
        num: 5,
        code: (
          <>
            <span className="text-chart-1">const</span> wss = <span className="text-chart-1">new</span>{" "}
            <span className="text-chart-3">WebSocketServer</span>({"{"} server {"}"})
          </>
        ),
      },
      { num: 6, code: "" },
      {
        num: 7,
        code: (
          <>
            wss.<span className="text-chart-3">on</span>(<span className="text-chart-2">{'"connection"'}</span>, (ws) =
            {">"} {"{"}
          </>
        ),
      },
      {
        num: 8,
        code: (
          <span className="pl-4">
            ws.<span className="text-chart-3">on</span>(<span className="text-chart-2">{'"message"'}</span>, (data) =
            {">"} {"{"}
          </span>
        ),
      },
      {
        num: 9,
        code: <span className="pl-8 text-muted-foreground">{"// Transform and broadcast OT operations"}</span>,
      },
      {
        num: 10,
        code: (
          <span className="pl-8">
            wss.clients.<span className="text-chart-3">forEach</span>((client) ={">"} {"{"}
          </span>
        ),
      },
      {
        num: 11,
        code: (
          <span className="pl-12">
            client.<span className="text-chart-3">send</span>(data)
          </span>
        ),
      },
      { num: 12, code: <span className="pl-8">{"}"})</span> },
    ],
  },
  "App.tsx": {
    language: "TypeScript",
    lines: [
      {
        num: 1,
        code: (
          <>
            <span className="text-chart-1">import</span> {"{"} useState {"}"} <span className="text-chart-1">from</span>{" "}
            <span className="text-chart-2">{'"react"'}</span>
          </>
        ),
      },
      {
        num: 2,
        code: (
          <>
            <span className="text-chart-1">import</span> {"{"} Editor {"}"} <span className="text-chart-1">from</span>{" "}
            <span className="text-chart-2">{'"./Editor"'}</span>
          </>
        ),
      },
      { num: 3, code: "" },
      {
        num: 4,
        code: (
          <>
            <span className="text-chart-1">export default function</span> <span className="text-chart-3">App</span>(){" "}
            {"{"}
          </>
        ),
      },
      {
        num: 5,
        code: (
          <span className="pl-4">
            <span className="text-chart-1">const</span> [code, setCode] = <span className="text-chart-3">useState</span>
            (<span className="text-chart-2">{'"// Start coding!"'}</span>)
          </span>
        ),
      },
      { num: 6, code: "" },
      {
        num: 7,
        code: (
          <span className="pl-4">
            <span className="text-chart-1">return</span> (
          </span>
        ),
      },
      {
        num: 8,
        code: (
          <span className="pl-8">
            {"<"}
            <span className="text-chart-3">div</span> className=
            <span className="text-chart-2">{'"app-container"'}</span>
            {">"}
          </span>
        ),
      },
      {
        num: 9,
        code: (
          <span className="pl-12">
            {"<"}
            <span className="text-chart-3">Editor</span> value={"{"}code{"}"} onChange={"{"}setCode{"}"} {"/>"}
          </span>
        ),
      },
      {
        num: 10,
        code: (
          <span className="pl-8">
            {"</"}
            <span className="text-chart-3">div</span>
            {">"}
          </span>
        ),
      },
      { num: 11, code: <span className="pl-4">)</span> },
      { num: 12, code: "}" },
    ],
  },
  "styles.css": {
    language: "CSS",
    lines: [
      {
        num: 1,
        code: (
          <>
            <span className="text-chart-1">:root</span> {"{"}
          </>
        ),
      },
      {
        num: 2,
        code: (
          <span className="pl-4">
            <span className="text-chart-3">--primary</span>: <span className="text-chart-2">#6366f1</span>;
          </span>
        ),
      },
      {
        num: 3,
        code: (
          <span className="pl-4">
            <span className="text-chart-3">--background</span>: <span className="text-chart-2">#0a0a0a</span>;
          </span>
        ),
      },
      {
        num: 4,
        code: (
          <span className="pl-4">
            <span className="text-chart-3">--foreground</span>: <span className="text-chart-2">#fafafa</span>;
          </span>
        ),
      },
      { num: 5, code: "}" },
      { num: 6, code: "" },
      {
        num: 7,
        code: (
          <>
            <span className="text-chart-1">.app-container</span> {"{"}
          </>
        ),
      },
      {
        num: 8,
        code: (
          <span className="pl-4">
            <span className="text-chart-3">display</span>: <span className="text-chart-2">flex</span>;
          </span>
        ),
      },
      {
        num: 9,
        code: (
          <span className="pl-4">
            <span className="text-chart-3">min-height</span>: <span className="text-chart-2">100vh</span>;
          </span>
        ),
      },
      {
        num: 10,
        code: (
          <span className="pl-4">
            <span className="text-chart-3">background</span>: <span className="text-chart-3">var</span>(
            <span className="text-chart-2">--background</span>);
          </span>
        ),
      },
      { num: 11, code: "}" },
    ],
  },
}

const debugData = {
  breakpoints: [
    { file: "index.tsx", line: 8, enabled: true },
    { file: "index.tsx", line: 11, enabled: true },
    { file: "App.tsx", line: 5, enabled: false },
  ],
  variables: [
    { name: "server", value: "Server {}", type: "object" },
    { name: "wss", value: "WebSocketServer {}", type: "object" },
    { name: "data", value: '"{"op":"insert","pos":42}"', type: "string" },
    { name: "client", value: "WebSocket {}", type: "object" },
  ],
  callStack: [
    { fn: "broadcast", file: "index.tsx", line: 10 },
    { fn: "onMessage", file: "index.tsx", line: 8 },
    { fn: "WebSocket.emit", file: "ws.js", line: 312 },
  ],
}

const projectStructure = [
  {
    name: "src",
    type: "folder" as const,
    expanded: true,
    children: [
      { name: "index.tsx", type: "file" as const, size: "1.2 KB" },
      { name: "App.tsx", type: "file" as const, size: "0.8 KB" },
      { name: "styles.css", type: "file" as const, size: "0.4 KB" },
      {
        name: "components",
        type: "folder" as const,
        expanded: true,
        children: [
          { name: "Editor.tsx", type: "file" as const, size: "2.1 KB" },
          { name: "Toolbar.tsx", type: "file" as const, size: "1.5 KB" },
          { name: "StatusBar.tsx", type: "file" as const, size: "0.6 KB" },
        ],
      },
      {
        name: "utils",
        type: "folder" as const,
        expanded: false,
        children: [
          { name: "ot.ts", type: "file" as const, size: "3.2 KB" },
          { name: "websocket.ts", type: "file" as const, size: "1.8 KB" },
        ],
      },
    ],
  },
  { name: "package.json", type: "file" as const, size: "0.5 KB" },
  { name: "tsconfig.json", type: "file" as const, size: "0.3 KB" },
  { name: "README.md", type: "file" as const, size: "1.1 KB" },
]

export function CodeEditorPreview() {
  const [activeTab, setActiveTab] = useState("editor")
  const [selectedFile, setSelectedFile] = useState("index.tsx")
  const [isDebugging, setIsDebugging] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    components: true,
    utils: false,
  })

  const currentFile = fileContents[selectedFile]

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderName]: !prev[folderName] }))
  }

  const renderFileTree = (items: typeof projectStructure, depth = 0) => {
    return items.map((item) => (
      <div key={item.name}>
        {item.type === "folder" ? (
          <>
            <button
              onClick={() => toggleFolder(item.name)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-secondary transition-colors"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${expandedFolders[item.name] ? "rotate-90" : ""}`}
              />
              <FolderTree className="h-4 w-4 text-chart-1" />
              {item.name}
            </button>
            {expandedFolders[item.name] && item.children && renderFileTree(item.children, depth + 1)}
          </>
        ) : (
          <div
            className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 16 + 32}px` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-chart-2">{item.name.split(".").pop()}</span>
              {item.name}
            </div>
            <span className="text-xs text-muted-foreground/50">{item.size}</span>
          </div>
        )}
      </div>
    ))
  }

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
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.id ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
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
                    <button
                      onClick={() => setSelectedFile("index.tsx")}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors ${
                        selectedFile === "index.tsx"
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="h-4 w-4 text-center text-xs">ts</span>
                      index.tsx
                    </button>
                    <button
                      onClick={() => setSelectedFile("App.tsx")}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors ${
                        selectedFile === "App.tsx"
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="h-4 w-4 text-center text-xs">ts</span>
                      App.tsx
                    </button>
                    <button
                      onClick={() => setSelectedFile("styles.css")}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors ${
                        selectedFile === "styles.css"
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="h-4 w-4 text-center text-xs">css</span>
                      styles.css
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-[400px] p-4 font-mono text-sm">
                <div className="space-y-1">
                  {currentFile.lines.map((line) => (
                    <div key={line.num} className="flex gap-4 leading-6">
                      <span className="w-6 text-right text-muted-foreground/50">{line.num}</span>
                      <span className="text-foreground">{line.code}</span>
                    </div>
                  ))}
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
            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="border-r border-border p-4 space-y-6">
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Controls</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsDebugging(!isDebugging)}
                      className={`rounded p-2 transition-colors ${isDebugging ? "bg-chart-1/20 text-chart-1" : "bg-chart-2/20 text-chart-2"} hover:opacity-80`}
                    >
                      {isDebugging ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                      <Square className="h-4 w-4" />
                    </button>
                    <button className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <div className="mx-2 h-4 w-px bg-border" />
                    <button className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                      <StepOver className="h-4 w-4" />
                    </button>
                    <button className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                      <StepInto className="h-4 w-4" />
                    </button>
                    <button className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                      <StepOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Variables</p>
                  <div className="space-y-1 text-sm">
                    {debugData.variables.map((variable) => (
                      <div
                        key={variable.name}
                        className="flex items-center justify-between rounded px-2 py-1 hover:bg-secondary"
                      >
                        <span className="text-chart-3">{variable.name}</span>
                        <span className="text-muted-foreground truncate ml-2 max-w-[120px]" title={variable.value}>
                          {variable.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Breakpoints</p>
                  <div className="space-y-1 text-sm">
                    {debugData.breakpoints.map((bp, i) => (
                      <div key={i} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-secondary">
                        <Circle
                          className={`h-3 w-3 ${bp.enabled ? "fill-chart-1 text-chart-1" : "text-muted-foreground"}`}
                        />
                        <span className="text-muted-foreground">{bp.file}</span>
                        <span className="text-foreground">:{bp.line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Call Stack</p>
                  <div className="space-y-1 text-sm">
                    {debugData.callStack.map((frame, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded px-2 py-1 ${i === 0 ? "bg-chart-1/10" : "hover:bg-secondary"}`}
                      >
                        <span className="text-chart-2">{frame.fn}</span>
                        <span className="text-muted-foreground text-xs">
                          {frame.file}:{frame.line}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-h-[400px] p-4 font-mono text-sm">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-chart-1/20 px-2 py-0.5 text-chart-1">Paused at line 10</span>
                  <span>index.tsx</span>
                </div>
                <div className="space-y-1">
                  {fileContents["index.tsx"].lines.map((line) => (
                    <div
                      key={line.num}
                      className={`flex gap-4 leading-6 ${line.num === 10 ? "bg-chart-1/10 -mx-2 px-2 rounded" : ""}`}
                    >
                      <span className="w-6 text-right text-muted-foreground/50 relative">
                        {(line.num === 8 || line.num === 11) && (
                          <Circle className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 fill-chart-1 text-chart-1" />
                        )}
                        {line.num}
                      </span>
                      <span className="text-foreground">{line.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="grid md:grid-cols-[1fr_300px]">
              <div className="min-h-[400px] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project Files</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>8 files</span>
                    <span>•</span>
                    <span>11.3 KB total</span>
                  </div>
                </div>
                <div className="space-y-0.5">{renderFileTree(projectStructure)}</div>
              </div>

              <div className="border-l border-border p-4">
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Project Info</p>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Project Name</p>
                    <p className="text-foreground font-medium">codesync-demo</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Language</p>
                    <p className="text-foreground">TypeScript / React</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Last Modified</p>
                    <p className="text-foreground">2 minutes ago</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Collaborators</p>
                    <div className="flex items-center gap-2 mt-2">
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
                      <span className="text-muted-foreground">+2 more</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-muted-foreground mb-2">Quick Actions</p>
                    <div className="space-y-2">
                      <button className="w-full rounded bg-secondary px-3 py-2 text-left text-foreground hover:bg-secondary/80 transition-colors">
                        Download as ZIP
                      </button>
                      <button className="w-full rounded bg-secondary px-3 py-2 text-left text-foreground hover:bg-secondary/80 transition-colors">
                        Share Project
                      </button>
                      <button className="w-full rounded bg-secondary px-3 py-2 text-left text-foreground hover:bg-secondary/80 transition-colors">
                        View Git History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${activeTab === "debug" && isDebugging ? "bg-chart-1" : "bg-chart-2"}`}
                />
                {activeTab === "debug" && isDebugging ? "Debugging" : "Connected"}
              </span>
              <span>{currentFile.language}</span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Ln {activeTab === "debug" ? 10 : 8}, Col 12</span>
              <button className="flex items-center gap-1 rounded bg-chart-2/20 px-2 py-0.5 text-chart-2 hover:bg-chart-2/30">
                <Play className="h-3 w-3" />
                Run
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
