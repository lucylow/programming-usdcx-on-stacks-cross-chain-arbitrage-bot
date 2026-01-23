import { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "./Navigation";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export function Layout({ children, showBreadcrumbs = true, showNavigation = true, className }: LayoutProps) {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Restore scroll position for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const scrollY = sessionStorage.getItem(`scroll-${location.pathname}`);
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY, 10));
        }
      }, 100);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [location.pathname]);

  // Save scroll position before navigation
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${location.pathname}`, window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showNavigation && <Navigation />}
      <main className={cn(showNavigation ? "pt-16" : "", className)}>
        {showBreadcrumbs && location.pathname !== "/" && <BreadcrumbNav />}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
