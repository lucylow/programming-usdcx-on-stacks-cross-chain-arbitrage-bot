"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
// Note: WalletConnect is in root components/ directory
// Using StacksWalletButton from src/components instead
import { StacksWalletButton } from "@/components/stacks/StacksWalletButton"
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
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled 
            ? "bg-darker/98 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/20" 
            : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Link to="/" className="flex items-center space-x-3 group relative">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-10 h-10 bg-gradient-to-br from-brand to-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand/20"
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent group-hover:from-accent group-hover:to-brand transition-all duration-300">
                ArbitrageBot
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-1.5">
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

            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
                }}
                className="hidden md:flex items-center space-x-2 px-3 py-2 bg-dark/60 border border-white/10 rounded-lg hover:border-brand/50 hover:bg-dark/80 transition-all duration-200 group"
              >
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Search</span>
                <kbd className="hidden xl:inline-flex items-center px-2 py-0.5 bg-darker/80 border border-white/10 rounded text-xs font-mono text-muted-foreground group-hover:border-brand/30 group-hover:text-foreground transition-colors">
                  ⌘K
                </kbd>
              </motion.button>

              <NotificationButton />
              <StacksWalletButton />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-lg hover:bg-dark/60 transition-all duration-200 relative"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    if (activeDropdown === item.label) {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setActiveDropdown(null)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeDropdown, item.label, setActiveDropdown])

  if (!hasChildren) {
    return (
      <Link to={item.href}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 relative group",
            isActive 
              ? "bg-brand/15 text-brand shadow-lg shadow-brand/10" 
              : "text-muted-foreground hover:bg-dark/60 hover:text-white",
          )}
        >
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute inset-0 bg-brand/10 rounded-lg -z-10"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <item.icon className={cn(
            "w-4 h-4 transition-transform duration-200",
            isActive && "scale-110"
          )} />
          <span className="font-medium text-sm">{item.label}</span>
          {item.badge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-gradient-to-r from-brand to-accent rounded-full text-xs font-bold shadow-lg shadow-brand/30"
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
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setActiveDropdown(item.label)}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 relative group",
          isActive 
            ? "bg-brand/15 text-brand shadow-lg shadow-brand/10" 
            : "text-muted-foreground hover:bg-dark/60 hover:text-white",
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 bg-brand/10 rounded-lg -z-10"
            initial={false}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <item.icon className={cn(
          "w-4 h-4 transition-transform duration-200",
          isActive && "scale-110"
        )} />
        <span className="font-medium text-sm">{item.label}</span>
        <motion.div
          animate={{ rotate: activeDropdown === item.label ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
        {item.badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-0.5 bg-gradient-to-r from-brand to-accent rounded-full text-xs font-bold shadow-lg shadow-brand/30"
          >
            {item.badge}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {activeDropdown === item.label && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 mt-2 w-72 bg-darker/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
            style={{ 
              filter: "drop-shadow(0 20px 25px rgb(0 0 0 / 0.3))"
            }}
          >
            <div className="p-1.5">
              {item.children
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((child: any, index: number) => {
                  const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/")
                  return (
                    <Link key={child.href} to={child.href}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.15 }}
                        className={cn(
                          "p-3.5 rounded-lg transition-all duration-200 border-b border-white/5 last:border-0 group cursor-pointer",
                          isChildActive 
                            ? "bg-brand/10 border-brand/20" 
                            : "hover:bg-dark/60"
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={cn(
                              "p-2.5 rounded-lg transition-all duration-200",
                              isChildActive
                                ? "bg-brand/20 shadow-lg shadow-brand/20"
                                : "bg-brand/10 group-hover:bg-brand/20"
                            )}
                          >
                            <child.icon className={cn(
                              "w-5 h-5 transition-colors",
                              isChildActive ? "text-brand" : "text-brand/80"
                            )} />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-semibold mb-1 text-sm transition-colors",
                              isChildActive 
                                ? "text-brand" 
                                : "group-hover:text-brand"
                            )}>
                              {child.label}
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              {child.description}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  )
                })}
            </div>
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
      className="relative p-2.5 rounded-lg hover:bg-dark/60 transition-all duration-200 group"
      aria-label="Notifications"
    >
      <Bell className={cn(
        "w-5 h-5 transition-colors duration-200",
        hasUnread ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
      )} />
      {hasUnread && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full shadow-lg shadow-error/50"
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-error rounded-full opacity-75"
          />
        </motion.span>
      )}
    </motion.button>
  )
}

function MobileMenu({ isOpen, items, pathname, onClose }: any) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 lg:hidden"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-darker/98 backdrop-blur-xl border-l border-white/10 shadow-2xl overflow-y-auto"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand to-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                    Menu
                  </h2>
                  <p className="text-xs text-muted-foreground">Navigation</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-dark/60 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Navigation Items */}
            <div className="space-y-1.5">
              {items.map((item: NavItem, index: number) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <MobileNavItem item={item} pathname={pathname} onClose={onClose} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function MobileNavItem({ item, pathname, onClose }: any) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren) {
    return (
      <Link to={item.href} onClick={onClose}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 relative group",
            isActive 
              ? "bg-brand/15 text-brand shadow-lg shadow-brand/10" 
              : "hover:bg-dark/60 active:bg-dark/70",
          )}
        >
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isActive ? "bg-brand/20" : "bg-dark/40 group-hover:bg-dark/60"
          )}>
            <item.icon className="w-5 h-5" />
          </div>
          <span className="font-semibold flex-1">{item.label}</span>
          {item.badge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-1 bg-gradient-to-r from-brand to-accent rounded-full text-xs font-bold shadow-lg shadow-brand/30"
            >
              {item.badge}
            </motion.span>
          )}
        </motion.div>
      </Link>
    )
  }

  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 relative group",
          isActive 
            ? "bg-brand/15 text-brand shadow-lg shadow-brand/10" 
            : "hover:bg-dark/60 active:bg-dark/70",
        )}
      >
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          isActive ? "bg-brand/20" : "bg-dark/40 group-hover:bg-dark/60"
        )}>
          <item.icon className="w-5 h-5" />
        </div>
        <span className="font-semibold flex-1 text-left">{item.label}</span>
        {item.badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2.5 py-1 bg-gradient-to-r from-brand to-accent rounded-full text-xs font-bold shadow-lg shadow-brand/30 mr-2"
          >
            {item.badge}
          </motion.span>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="ml-4 mt-2 space-y-1 overflow-hidden border-l-2 border-white/10 pl-4"
          >
            {item.children
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((child: any, index: number) => {
                const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/")
                return (
                  <Link key={child.href} to={child.href} onClick={onClose}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                        isChildActive
                          ? "bg-brand/10 text-brand"
                          : "hover:bg-dark/60 active:bg-dark/70"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded transition-colors",
                        isChildActive ? "bg-brand/20" : "bg-dark/40 group-hover:bg-dark/60"
                      )}>
                        <child.icon className={cn(
                          "w-4 h-4",
                          isChildActive ? "text-brand" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1">
                        <span className={cn(
                          "text-sm font-medium block",
                          isChildActive ? "text-brand" : "text-foreground"
                        )}>
                          {child.label}
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {child.description}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

