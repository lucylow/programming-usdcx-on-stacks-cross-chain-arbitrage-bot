"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import {
  Home,
  Bot,
  BarChart3,
  BookOpen,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  Zap,
  Shield,
  TrendingUp,
  FileText,
  HelpCircle,
} from "lucide-react"
import { cn } from "../../src/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
  order?: number
  children?: {
    label: string
    href: string
    icon: React.ElementType
    description: string
    order?: number
  }[]
}

const navigationItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    order: 1,
  },
  {
    label: "Bot",
    href: "/bot",
    icon: Bot,
    badge: "Live",
    order: 2,
    children: [
      {
        label: "Dashboard",
        href: "/bot/dashboard",
        icon: BarChart3,
        description: "Monitor bot performance",
        order: 1,
      },
      {
        label: "Opportunities",
        href: "/bot/opportunities",
        icon: Zap,
        description: "View detected arbitrage",
        order: 2,
      },
      {
        label: "History",
        href: "/bot/history",
        icon: FileText,
        description: "Past trades and results",
        order: 3,
      },
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    order: 3,
    children: [
      {
        label: "Overview",
        href: "/analytics",
        icon: BarChart3,
        description: "Performance metrics",
        order: 1,
      },
      {
        label: "Risk Analysis",
        href: "/analytics/risk",
        icon: Shield,
        description: "Risk management stats",
        order: 2,
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    icon: BookOpen,
    order: 4,
    children: [
      {
        label: "Interactive Demo",
        href: "/demo",
        icon: Zap,
        description: "Try our interactive features",
        order: 1,
      },
      {
        label: "Documentation",
        href: "/docs",
        icon: BookOpen,
        description: "Technical guides",
        order: 2,
      },
      {
        label: "FAQ",
        href: "/faq",
        icon: HelpCircle,
        description: "Common questions",
        order: 3,
      },
    ],
  },
].sort((a, b) => (a.order || 0) - (b.order || 0))
  .map(item => ({
    ...item,
    children: item.children?.sort((a, b) => (a.order || 0) - (b.order || 0))
  }))

export default function Navigation() {
  const location = useLocation()
  const pathname = location.pathname
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled 
            ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5" 
            : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow"
              >
                <Bot className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:from-primary-dark group-hover:to-secondary transition-all">
                ArbitrageBot
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                />
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
                }}
                className="hidden md:flex items-center space-x-2 px-3 py-2 bg-card/50 border border-border/50 rounded-lg hover:border-primary/50 hover:bg-card transition-all group"
              >
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Search</span>
                <kbd className="hidden xl:inline-block px-2 py-0.5 bg-background border border-border/50 rounded text-xs">⌘K</kbd>
              </button>

              <NotificationButton />

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-card/50 border border-transparent hover:border-border/50 transition-all"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <MobileMenu
        isOpen={mobileMenuOpen}
        items={navigationItems}
        pathname={pathname}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  )
}

function NavItem({ item, pathname, activeDropdown, setActiveDropdown }: any) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren) {
    return (
      <Link to={item.href}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all relative group",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20" 
              : "text-muted-foreground hover:bg-card/50 hover:text-foreground hover:border-border/50 border border-transparent",
          )}
        >
          <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-gradient-to-r from-primary to-secondary rounded-full text-xs font-bold text-primary-foreground shadow-sm"
            >
              {item.badge}
            </motion.span>
          )}
        </motion.div>
      </Link>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setActiveDropdown(item.label)}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <Link to={item.href}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all group border",
            isActive 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "text-muted-foreground hover:bg-card/50 hover:text-foreground border-transparent hover:border-border/50",
          )}
        >
          <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">{item.label}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", activeDropdown === item.label && "rotate-180")} />
          {item.badge && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-gradient-to-r from-primary to-secondary rounded-full text-xs font-bold text-primary-foreground shadow-sm"
            >
              {item.badge}
            </motion.span>
          )}
        </motion.button>
      </Link>

      <AnimatePresence>
        {activeDropdown === item.label && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-primary/10 overflow-hidden"
          >
            {item.children
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((child: any, index: number) => (
              <Link key={child.href} to={child.href}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-card/80 transition-all border-b border-border/20 last:border-0 group cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                      <child.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1 group-hover:text-primary transition-colors">{child.label}</div>
                      <div className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">{child.description}</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationButton() {
  const [hasUnread, setHasUnread] = useState(true)

  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2 rounded-lg hover:bg-card/50 border border-transparent hover:border-border/50 transition-all group"
    >
      <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
      {hasUnread && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse shadow-lg shadow-destructive/50" 
        />
      )}
    </motion.button>
  )
}

function MobileMenu({ isOpen, items, pathname, onClose }: any) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 lg:hidden"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-80 bg-card/95 backdrop-blur-xl border-l border-border/50 overflow-y-auto shadow-2xl shadow-primary/10"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-card/50 border border-transparent hover:border-border/50 transition-all"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-2">
            {items.map((item: NavItem) => (
              <MobileNavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function MobileNavItem({ item, pathname, onClose }: any) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren) {
    return (
      <Link to={item.href} onClick={onClose}>
        <div
          className={cn(
            "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all border",
            isActive 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "hover:bg-card/50 border-transparent hover:border-border/50",
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto px-2 py-0.5 bg-gradient-to-r from-primary to-secondary rounded-full text-xs font-bold text-primary-foreground shadow-sm"
            >
              {item.badge}
            </motion.span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div>
      <div className="flex items-center">
        <Link
          to={item.href}
          onClick={onClose}
          className={cn(
            "flex-1 flex items-center space-x-3 px-4 py-3 rounded-xl transition-all border",
            isActive 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "hover:bg-card/50 border-transparent hover:border-border/50",
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className={cn(
            "px-2 py-3 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ChevronDown className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-8 mt-2 space-y-1 overflow-hidden"
          >
            {item.children
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((child: any) => (
              <Link key={child.href} to={child.href} onClick={onClose}>
                <div className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-card/50 transition-all group border border-transparent hover:border-border/30">
                  <child.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm group-hover:text-foreground transition-colors">{child.label}</span>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
