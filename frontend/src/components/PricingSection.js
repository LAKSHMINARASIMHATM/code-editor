import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "For individual developers",
        features: [
            "Up to 3 collaborators",
            "1,000 sessions/month",
            "10 languages",
            "Basic code completion",
            "Community support",
        ],
        cta: "Get Started",
        highlighted: false,
        href: "/auth/sign-up",
    },
    {
        name: "Pro",
        price: "$19",
        period: "/month",
        description: "For professional teams",
        features: [
            "Unlimited collaborators",
            "Unlimited sessions",
            "50+ languages",
            "Full LSP integration",
            "Live debugging",
            "Git integration",
            "Priority support",
        ],
        cta: "Start Free Trial",
        highlighted: true,
        href: "/auth/sign-up?plan=pro",
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large organizations",
        features: [
            "Everything in Pro",
            "SSO & SAML",
            "Custom SLA (99.99%)",
            "On-premise option",
            "Dedicated support",
            "Security audit logs",
        ],
        cta: "Contact Sales",
        highlighted: false,
        href: "contact",
    },
];

export function PricingSection() {
    const [contactOpen, setContactOpen] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);

    const handleContactSubmit = (e) => {
        e.preventDefault();
        setFormSubmitted(true);
        setTimeout(() => {
            setContactOpen(false);
            setFormSubmitted(false);
        }, 2000);
    };

    return (
        <section id="pricing" className="border-t border-border bg-card px-6 py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center">
                    <p className="mb-4 text-sm font-medium uppercase tracking-wider text-accent">Pricing</p>
                    <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl text-balance">
                        Simple, transparent pricing
                    </h2>
                    <p className="mx-auto max-w-2xl text-muted-foreground">Start free and scale as you grow. No hidden fees.</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-xl border p-8 ${plan.highlighted ? "border-accent bg-accent/5" : "border-border bg-background"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-medium text-accent-foreground">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="mb-2 text-xl font-semibold text-foreground">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                            </div>

                            <ul className="mb-8 space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-4 w-4 shrink-0 text-accent" />
                                        <span className="text-sm text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {plan.href === "contact" ? (
                                <button
                                    onClick={() => setContactOpen(true)}
                                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${plan.highlighted
                                            ? "bg-accent text-accent-foreground hover:bg-accent/90"
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                        }`}
                                >
                                    {plan.cta}
                                </button>
                            ) : (
                                <Link
                                    to={plan.href}
                                    className={`block w-full text-center px-4 py-2 rounded-md font-medium transition-colors ${plan.highlighted
                                            ? "bg-accent text-accent-foreground hover:bg-accent/90"
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {contactOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setContactOpen(false)}>
                    <div className="w-full max-w-md mx-4 bg-card border border-border rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Contact Sales</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Fill out the form below and our team will get back to you within 24 hours.
                        </p>
                        {formSubmitted ? (
                            <div className="py-8 text-center">
                                <Check className="h-12 w-12 text-accent mx-auto mb-4" />
                                <p className="text-foreground font-medium">Thank you for your interest!</p>
                                <p className="text-sm text-muted-foreground">We'll be in touch soon.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                                            First Name
                                        </label>
                                        <input id="firstName" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                                            Last Name
                                        </label>
                                        <input id="lastName" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                                        Work Email
                                    </label>
                                    <input id="email" type="email" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="company" className="text-sm font-medium text-foreground">
                                        Company
                                    </label>
                                    <input id="company" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-foreground">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        placeholder="Tell us about your needs..."
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground min-h-[100px]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setContactOpen(false)} className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                                        Submit
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
