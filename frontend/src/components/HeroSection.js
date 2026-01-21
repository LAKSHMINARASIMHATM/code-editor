import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
    const [demoOpen, setDemoOpen] = useState(false);

    return (
        <section className="relative overflow-hidden px-6 py-24 md:py-32">
            <div className="mx-auto max-w-7xl">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <div className="flex flex-col gap-8">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                            Now in Public Beta
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl text-balance">
                            The complete platform to <span className="text-accent">code together</span>
                        </h1>

                        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                            Real-time collaborative editing with sub-20ms latency. Edit, debug, and ship code with your team—no matter
                            where they are.
                        </p>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link
                                to="/auth/sign-up"
                                className="inline-flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded-md font-medium transition-colors"
                            >
                                Start for Free
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                            <button
                                className="inline-flex items-center justify-center border border-border text-foreground hover:bg-secondary bg-transparent px-6 py-3 rounded-md font-medium transition-colors"
                                onClick={() => setDemoOpen(true)}
                            >
                                <Play className="mr-2 h-4 w-4" />
                                Watch Demo
                            </button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            No credit card required · Free tier includes 1,000 sessions/month
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 rounded-2xl blur-3xl bg-chart-4 text-shadow-color" />
                        <div className="relative rounded-xl border border-border bg-card p-2 shadow-2xl">
                            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                                <div className="h-3 w-3 rounded-full bg-chart-3/60" />
                                <div className="h-3 w-3 rounded-full bg-chart-2/60" />
                                <span className="ml-4 text-sm text-muted-foreground">main.tsx</span>
                            </div>
                            <div className="p-4 font-mono text-sm text-shadow-color bg-sidebar-accent">
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">1</span>
                                    <span>
                                        <span className="text-chart-1">import</span> {'{'} <span className="text-accent-foreground">useState</span>{' '}
                                        {'}'} <span className="text-chart-1">from</span> <span className="text-chart-2">{"'react'"}</span>
                                    </span>
                                </div>
                                <div className="flex gap-4 text-secondary">
                                    <span className="text-muted-foreground">2</span>
                                    <span></span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">3</span>
                                    <span>
                                        <span className="text-chart-1">function</span> <span className="text-chart-3">App</span>() {'{'}
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">4</span>
                                    <span className="pl-4">
                                        <span className="text-chart-1">const</span> [count, setCount] ={' '}
                                        <span className="text-chart-3">useState</span>(0)
                                    </span>
                                </div>
                                <div className="flex gap-4 relative">
                                    <span className="text-muted-foreground">5</span>
                                    <span className="pl-4">
                                        <span className="text-chart-1">return</span> {'<'}
                                        <span className="text-chart-4">button</span>
                                        {'>'}
                                        <span className="absolute -right-2 top-0 flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                            Sarah
                                        </span>
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">6</span>
                                    <span className="pl-8">
                                        {'{'}count{'}'}
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">7</span>
                                    <span className="pl-4">
                                        {'</'}
                                        <span className="text-chart-4">button</span>
                                        {'>'}
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">8</span>
                                    <span>{'}'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {demoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setDemoOpen(false)}>
                    <div className="max-w-4xl w-full mx-4 bg-card border border-border rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold text-foreground mb-4">CodeSync Demo</h3>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Demo video would play here</p>
                                <p className="text-sm text-muted-foreground mt-2">See real-time collaboration in action</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDemoOpen(false)}
                            className="mt-4 px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
