import { Zap, Shield, Globe, Code, Users, Bug, GitBranch, Cpu } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Sub-20ms Sync",
    description: "Operational Transformation (OT) engine with Redis pub/sub for instant global synchronization.",
  },
  {
    icon: Code,
    title: "50+ Languages",
    description: "Full syntax highlighting, LSP integration for intelligent completion and diagnostics.",
  },
  {
    icon: Bug,
    title: "Live Debugging",
    description: "Set breakpoints, step through code, and inspect variables—shared across all participants.",
  },
  {
    icon: Users,
    title: "Real-time Presence",
    description: "Multi-user cursors, selection highlights, and live user indicators with identity.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "TLS everywhere, OAuth 2.0, RBAC, sandboxed execution with network isolation.",
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "Kubernetes orchestration with horizontal autoscaling. 1,000+ concurrent sessions.",
  },
  {
    icon: GitBranch,
    title: "Git Integration",
    description: "Connect to GitHub and GitLab. Clone, push, and pull directly from the editor.",
  },
  {
    icon: Cpu,
    title: "Sandboxed Runtime",
    description: "Isolated container execution with resource limits for safe code execution.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border bg-card px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-accent">Features</p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl text-balance">
            Built for modern development teams
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Everything you need to collaborate on code in real-time, with enterprise-grade security and scalability.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-background p-6 transition-colors hover:border-accent/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
