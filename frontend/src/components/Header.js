import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Simulate auth check - replace with actual Supabase integration if needed
        setLoading(false);
    }, []);

    const handleSignOut = async () => {
        // Implement sign out logic
        setUser(null);
        navigate('/');
    };

    const handleNavClick = (e, href) => {
        e.preventDefault();
        const sectionId = href.replace('#', '');

        if (location.pathname !== '/') {
            navigate(`/${href}`);
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link to="/" className="flex gap-2 bg-lime-950 items-end rounded-4xl">
                    <div className="flex h-8 w-8 items-center justify-center bg-accent rounded-4xl">
                        <Zap className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <span className="text-xl font-semibold text-foreground">CodeSync</span>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    <a
                        href="#features"
                        onClick={(e) => handleNavClick(e, '#features')}
                        className="text-sm transition-colors hover:text-foreground cursor-pointer text-chart-4"
                    >
                        Features
                    </a>
                    <a
                        href="#pricing"
                        onClick={(e) => handleNavClick(e, '#pricing')}
                        className="text-sm transition-colors hover:text-foreground cursor-pointer text-secondary"
                    >
                        Pricing
                    </a>
                    <Link to="/docs" className="text-sm transition-colors hover:text-foreground text-primary">
                        Docs
                    </Link>
                    <Link to="/ide" className="text-sm font-medium transition-colors hover:text-foreground text-accent-foreground bg-accent px-3 py-1.5 rounded-md">
                        Try IDE
                    </Link>
                    <Link to="/enterprise" className="text-sm transition-colors hover:text-foreground text-shadow-color">
                        Enterprise
                    </Link>
                </div>

                <div className="hidden items-center gap-4 md:flex">
                    {loading ? (
                        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
                    ) : user ? (
                        <>
                            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors">
                                Dashboard
                            </Link>
                            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors">
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/auth/login" className="hover:text-foreground text-indigo-900 px-3 py-2 rounded-md transition-colors">
                                Log in
                            </Link>
                            <Link to="/auth/sign-up" className="hover:bg-foreground/90 text-rose-200 bg-sidebar-primary px-4 py-2 rounded-md transition-colors">
                                Get Started
                            </Link>
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
                            onClick={(e) => handleNavClick(e, '#features')}
                            className="text-sm text-muted-foreground cursor-pointer"
                        >
                            Features
                        </a>
                        <a
                            href="#pricing"
                            onClick={(e) => handleNavClick(e, '#pricing')}
                            className="text-sm text-muted-foreground cursor-pointer"
                        >
                            Pricing
                        </a>
                        <Link to="/docs" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                            Docs
                        </Link>
                        <Link to="/ide" className="text-sm font-medium text-accent-foreground" onClick={() => setMobileMenuOpen(false)}>
                            Try IDE
                        </Link>
                        <Link to="/enterprise" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                            Enterprise
                        </Link>
                        <div className="flex flex-col gap-2 pt-4">
                            {user ? (
                                <>
                                    <Link to="/dashboard" className="text-muted-foreground px-3 py-2 rounded-md text-left">
                                        Dashboard
                                    </Link>
                                    <button onClick={handleSignOut} className="text-muted-foreground px-3 py-2 rounded-md text-left">
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/auth/login" className="text-muted-foreground px-3 py-2 rounded-md text-left">
                                        Log in
                                    </Link>
                                    <Link to="/auth/sign-up" className="bg-foreground text-background px-4 py-2 rounded-md">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
