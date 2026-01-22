"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Home, Bot, BarChart3, FileText, Settings, HelpCircle, Command } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ElementType
  action: () => void
  keywords: string[]
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const commands: CommandItem[] = [
    {
      id: "home",
      label: "Go to Home",
      description: "Navigate to homepage",
      icon: Home,
      action: () => router.push("/"),
      keywords: ["home", "main", "landing"],
    },
    {
      id: "dashboard",
      label: "Bot Dashboard",
      description: "View bot performance",
      icon: Bot,
      action: () => router.push("/bot/dashboard"),
      keywords: ["dashboard", "bot", "monitor", "performance"],
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "View detailed analytics",
      icon: BarChart3,
      action: () => router.push("/analytics"),
      keywords: ["analytics", "stats", "metrics", "performance"],
    },
    {
      id: "history",
      label: "Trade History",
      description: "View past trades",
      icon: FileText,
      action: () => router.push("/bot/history"),
      keywords: ["history", "trades", "past", "transactions"],
    },
    {
      id: "settings",
      label: "Settings",
      description: "Configure bot settings",
      icon: Settings,
      action: () => router.push("/settings"),
      keywords: ["settings", "config", "preferences"],
    },
    {
      id: "help",
      label: "Help & Documentation",
      description: "Get help and view docs",
      icon: HelpCircle,
      action: () => router.push("/docs"),
      keywords: ["help", "docs", "documentation", "faq", "support"],
    },
  ]

  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase()
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.keywords.some((keyword) => keyword.includes(searchLower))
    )
  })

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      if (!isOpen) return

      if (e.key === "Escape") {
        setIsOpen(false)
        setSearch("")
        setSelectedIndex(0)
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      }

      if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
        setIsOpen(false)
        setSearch("")
        setSelectedIndex(0)
      }
    },
    [isOpen, filteredCommands, selectedIndex],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-darker border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent outline-none text-white placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="px-2 py-1 bg-dark rounded text-xs text-muted-foreground flex items-center gap-1">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No commands found</div>
            ) : (
              <div className="p-2">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action()
                      setIsOpen(false)
                      setSearch("")
                      setSelectedIndex(0)
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                      index === selectedIndex ? "bg-brand/10" : "hover:bg-dark/50",
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", index === selectedIndex ? "bg-brand/20" : "bg-dark")}>
                      <command.icon
                        className={cn("w-5 h-5", index === selectedIndex ? "text-brand" : "text-muted-foreground")}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={cn("font-medium", index === selectedIndex ? "text-brand" : "text-white")}>
                        {command.label}
                      </div>
                      <div className="text-sm text-muted-foreground">{command.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-white/10 bg-black/20 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-dark rounded">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark rounded">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-dark rounded">ESC</kbd>
              Close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
