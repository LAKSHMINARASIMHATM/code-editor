"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
]

export function PricingSection() {
  const [contactOpen, setContactOpen] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => {
      setContactOpen(false)
      setFormSubmitted(false)
    }, 2000)
  }

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
              className={`relative rounded-xl border p-8 ${
                plan.highlighted ? "border-accent bg-accent/5" : "border-border bg-background"
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
                <Button
                  onClick={() => setContactOpen(true)}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                </Button>
              ) : (
                <Button
                  asChild
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Contact Sales</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill out the form below and our team will get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
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
                  <Label htmlFor="firstName" className="text-foreground">
                    First Name
                  </Label>
                  <Input id="firstName" required className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">
                    Last Name
                  </Label>
                  <Input id="lastName" required className="bg-background border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Work Email
                </Label>
                <Input id="email" type="email" required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-foreground">
                  Company
                </Label>
                <Input id="company" required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-foreground">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your needs..."
                  className="bg-background border-border"
                />
              </div>
              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
                Submit
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
