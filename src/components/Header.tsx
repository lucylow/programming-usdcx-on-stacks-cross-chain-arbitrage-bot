import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Bot, Menu, X, BarChart3, TrendingUp, BookOpen, Home, Lightbulb, Play, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { StacksWalletButton } from "./stacks/StacksWalletButton";

// Landing page section links (anchor links)
const sectionLinks = [
  { href: "#features", label: "Features", icon: Sparkles },
  { href: "#stacks", label: "Stacks", icon: Bot },
  { href: "#how-it-works", label: "How It Works", icon: Lightbulb },
  { href: "#demo", label: "Demo", icon: Play },
];

// Multi-page navigation links
const pageLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bot", label: "Bot", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

// Helper function to handle section clicks
const handleSectionClick = (href: string) => {
  const element = document.querySelector(href);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Section link component
const SectionLink = ({ link, onClick }: { link: typeof sectionLinks[number]; onClick: (e: React.MouseEvent) => void }) => (
  <a
    href={link.href}
    onClick={onClick}
    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent/50 group"
  >
    {link.icon && <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
    <span className="font-medium">{link.label}</span>
  </a>
);

// Nav link component
const NavLink = ({ link, isActive }: { link: typeof pageLinks[number]; isActive: boolean }) => (
  <Link
    to={link.href}
    className={cn(
      "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg",
      isActive && "text-primary bg-primary/10"
    )}
  >
    <link.icon className="w-4 h-4" />
    <span className="font-medium">{link.label}</span>
  </Link>
);

export function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Compute active page links
  const activePageLinks = useMemo(() => {
    return pageLinks.map(link => ({
      link,
      isActive: location.pathname === link.href || 
        (link.href !== "/" && location.pathname.startsWith(link.href))
    }));
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-xl border-b border-border" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <nav className="flex items-center justify-between h-20">
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group"
            aria-label="Home - ArbitrageBot"
          >
            <Bot className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="text-xl font-bold text-foreground">ArbitrageBot</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4" aria-label="Main navigation">
            {isHomePage ? (
              // Show section links on home page
              <>
                {sectionLinks.map((link) => (
                  <SectionLink
                    key={link.href}
                    link={link}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSectionClick(link.href);
                    }}
                  />
                ))}
              </>
            ) : (
              // Show page navigation links on other pages
              <>
                {activePageLinks.map(({ link, isActive }) => (
                  <NavLink
                    key={link.href}
                    link={link}
                    isActive={isActive}
                  />
                ))}
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <StacksWalletButton />
            {isHomePage ? (
              <Button asChild className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity">
                <a 
                  href="#demo"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSectionClick("#demo");
                  }}
                >
                  Try Demo
                </a>
              </Button>
            ) : (
              <Button asChild className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity">
                <Link to="/bot/dashboard">Go to Bot</Link>
              </Button>
            )}
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </nav>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-6"
          >
            <div className="flex flex-col gap-2">
              {isHomePage ? (
                // Show section links on home page
                <>
                  {sectionLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-3 px-4 rounded-lg hover:bg-accent/50 group"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        handleSectionClick(link.href);
                      }}
                    >
                      {link.icon && <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      <span className="font-medium">{link.label}</span>
                    </a>
                  ))}
                  <div className="mt-2 space-y-2">
                    <div className="px-4">
                      <StacksWalletButton />
                    </div>
                    <Button asChild className="bg-gradient-to-r from-primary to-primary-dark w-full">
                      <a 
                        href="#demo"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsMobileMenuOpen(false);
                          handleSectionClick("#demo");
                        }}
                      >
                        Try Demo
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                // Show page navigation links on other pages
                <>
                  {pageLinks.map((link) => {
                    const isActive = location.pathname === link.href || 
                      (link.href !== "/" && location.pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                          "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg",
                          isActive && "text-primary bg-primary/10"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="mt-2 space-y-2">
                    <div className="px-4">
                      <StacksWalletButton />
                    </div>
                    <Button asChild className="bg-gradient-to-r from-primary to-primary-dark w-full">
                      <Link to="/bot/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Go to Bot</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
