import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const benefits = [
  "Multi-user cursors with real-time position sync",
  "Role-based permissions: owner, editor, viewer",
  "In-editor comments and annotations",
  "Session chat and communication",
  "Automatic conflict resolution with OT",
  "Persistent sessions with save and resume",
]

export function CollaborationSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-accent">Collaboration</p>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl text-balance">Make teamwork seamless</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Tools for your team to share feedback and iterate faster. Focus on shipping features instead of managing
              infrastructure.
            </p>

            <ul className="mb-8 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button className="bg-foreground text-background hover:bg-foreground/90">Start Collaborating</Button>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-accent/5 blur-3xl" />
            <div className="relative rounded-xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Active Collaborators</span>
                <span className="text-xs text-muted-foreground">Session: code-review-42</span>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Sarah Chen", role: "Owner", status: "editing index.tsx", color: "bg-chart-1" },
                  { name: "Mike Johnson", role: "Editor", status: "viewing App.tsx", color: "bg-chart-2" },
                  { name: "Alex Rivera", role: "Viewer", status: "watching", color: "bg-chart-3" },
                ].map((user) => (
                  <div key={user.name} className="flex items-center gap-4 rounded-lg bg-secondary/50 p-3">
                    <div
                      className={`h-10 w-10 rounded-full ${user.color} flex items-center justify-center text-sm font-medium text-card`}
                    >
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs text-accent">{user.role}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.status}</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-chart-2 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
