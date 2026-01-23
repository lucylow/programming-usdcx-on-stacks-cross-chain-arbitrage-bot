import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Bot, Menu, X, BarChart3, TrendingUp, BookOpen, Home, AlertCircle, Lightbulb, Play, Sparkles, Users, Info } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Landing page section links (anchor links)
const sectionLinks = [
  { href: "#problem", label: "Challenge", icon: AlertCircle },
  { href: "#solution", label: "Solution", icon: Lightbulb },
  { href: "#demo", label: "Demo", icon: Play },
  { href: "#features", label: "Features", icon: Sparkles },
  { href: "#zephyr", label: "About", icon: Info },
  { href: "#team", label: "Team", icon: Users },
];

// Multi-page navigation links
const pageLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bot", label: "Bot", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

export function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <Link to="/" className="flex items-center gap-2.5 group">
            <Bot className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-foreground">ArbitrageBot</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {isHomePage ? (
              // Show section links on home page
              <>
                {sectionLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all relative group font-medium px-3 py-2 rounded-lg hover:bg-accent/50"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector(link.href);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  >
                    {link.icon && <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    <span>{link.label}</span>
                    <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </a>
                ))}
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
                        "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors relative group font-medium px-3 py-2 rounded-lg",
                        isActive && "text-primary bg-primary/10"
                      )}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                      {isActive && (
                        <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isHomePage ? (
              <Button asChild className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity">
                <a 
                  href="#demo"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector("#demo");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                >
                  Try Demo
                </a>
              </Button>
            ) : (
              <Button asChild className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity">
                <Link to="/bot">Go to Bot</Link>
              </Button>
            )}
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                        const element = document.querySelector(link.href);
                        if (element) {
                          setTimeout(() => {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }
                      }}
                    >
                      {link.icon && <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      <span className="font-medium">{link.label}</span>
                    </a>
                  ))}
                  <Button asChild className="bg-gradient-to-r from-primary to-primary-dark mt-2">
                    <a 
                      href="#demo"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        const element = document.querySelector("#demo");
                        if (element) {
                          setTimeout(() => {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }
                      }}
                    >
                      Try Demo
                    </a>
                  </Button>
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
                  <Button asChild className="bg-gradient-to-r from-primary to-primary-dark">
                    <Link to="/bot" onClick={() => setIsMobileMenuOpen(false)}>Go to Bot</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
