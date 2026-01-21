const stats = [
  { value: "<20ms", label: "sync latency", company: "Real-time" },
  { value: "1,000+", label: "concurrent sessions", company: "Scalable" },
  { value: "50+", label: "languages supported", company: "Universal" },
  { value: "99.9%", label: "uptime SLA", company: "Reliable" },
]

export function StatsSection() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <p className="text-3xl font-bold text-foreground md:text-4xl">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-accent">{stat.company}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
