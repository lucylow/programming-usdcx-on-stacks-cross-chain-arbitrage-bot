"use client"

import type React from "react"
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
import { cn } from "@/lib/utils"

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
        label: "Documentation",
        href: "/docs",
        icon: BookOpen,
        description: "Technical guides",
        order: 1,
      },
      {
        label: "FAQ",
        href: "/faq",
        icon: HelpCircle,
        description: "Common questions",
        order: 2,
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
          scrolled ? "bg-darker/95 backdrop-blur-lg border-b border-white/10 shadow-xl" : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-br from-brand to-accent rounded-xl flex items-center justify-center"
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
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
                className="hidden md:flex items-center space-x-2 px-3 py-2 bg-dark/50 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Search</span>
                <kbd className="hidden xl:inline-block px-2 py-0.5 bg-darker rounded text-xs">⌘K</kbd>
              </button>

              <NotificationButton />

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-dark/50 transition-colors"
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
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative",
            isActive ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-dark/50 hover:text-white",
          )}
        >
          <item.icon className="w-4 h-4" />
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-brand to-accent rounded-full text-xs font-bold">
              {item.badge}
            </span>
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
      <motion.button
        whileHover={{ scale: 1.05 }}
        className={cn(
          "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
          isActive ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-dark/50 hover:text-white",
        )}
      >
        <item.icon className="w-4 h-4" />
        <span className="font-medium">{item.label}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === item.label && "rotate-180")} />
        {item.badge && (
          <span className="px-2 py-0.5 bg-gradient-to-r from-brand to-accent rounded-full text-xs font-bold">
            {item.badge}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {activeDropdown === item.label && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-darker border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {item.children
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((child: any, index: number) => (
              <Link key={child.href} to={child.href}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-dark/50 transition-colors border-b border-white/10 last:border-0 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-brand/10 rounded-lg group-hover:bg-brand/20 transition-colors">
                      <child.icon className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1 group-hover:text-brand transition-colors">{child.label}</div>
                      <div className="text-sm text-muted-foreground">{child.description}</div>
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
    <button className="relative p-2 rounded-lg hover:bg-dark/50 transition-colors">
      <Bell className="w-5 h-5" />
      {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse" />}
    </button>
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-80 bg-darker border-l border-white/10 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark/50 transition-colors">
              <X className="w-5 h-5" />
            </button>
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
            "flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors",
            isActive ? "bg-brand/10 text-brand" : "hover:bg-dark/50",
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-brand to-accent rounded-full text-xs font-bold">
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors",
          isActive ? "bg-brand/10 text-brand" : "hover:bg-dark/50",
        )}
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
      </button>

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
                <div className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-dark/50 transition-colors">
                  <child.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{child.label}</span>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
