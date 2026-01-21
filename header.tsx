"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const sectionId = href.replace("#", "")

    if (pathname !== "/") {
      router.push(`/${href}`)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex gap-2 bg-lime-950 items-end rounded-4xl">
          <div className="flex h-8 w-8 items-center justify-center bg-accent rounded-4xl">
            <Zap className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">CodeSync</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            onClick={(e) => handleNavClick(e, "#features")}
            className="text-sm transition-colors hover:text-foreground cursor-pointer text-chart-4"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleNavClick(e, "#pricing")}
            className="text-sm transition-colors hover:text-foreground cursor-pointer text-secondary"
          >
            Pricing
          </a>
          <Link href="/docs" className="text-sm transition-colors hover:text-foreground text-primary">
            Docs
          </Link>
          <Link href="/test-editor" className="text-sm font-medium transition-colors hover:text-foreground text-accent-foreground bg-accent px-3 py-1.5 rounded-md">
            Try IDE
          </Link>
          <Link href="/enterprise" className="text-sm transition-colors hover:text-foreground text-shadow-color">
            Enterprise
          </Link>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="hover:text-foreground text-indigo-900" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button className="hover:bg-foreground/90 text-rose-200 bg-sidebar-primary" asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={(e) => handleNavClick(e, "#features")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, "#pricing")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Pricing
            </a>
            <Link href="/docs" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
              Docs
            </Link>
            <Link href="/test-editor" className="text-sm font-medium text-accent-foreground" onClick={() => setMobileMenuOpen(false)}>
              Try IDE
            </Link>
            <Link href="/enterprise" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
              Enterprise
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              {user ? (
                <>
                  <Button variant="ghost" className="justify-start text-muted-foreground" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start text-muted-foreground" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start text-muted-foreground" asChild>
                    <Link href="/auth/login">Log in</Link>
                  </Button>
                  <Button className="bg-foreground text-background" asChild>
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
