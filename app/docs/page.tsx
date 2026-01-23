"use client"

import { FileText, Code, Settings, Zap, Shield, BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: Zap,
      content: [
        "Installation and setup instructions",
        "Wallet connection guide",
        "Initial configuration",
        "First trade execution",
      ],
    },
    {
      title: "Bot Configuration",
      icon: Settings,
      content: [
        "Setting up bot parameters",
        "Risk management settings",
        "Gas optimization",
        "Opportunity detection thresholds",
      ],
    },
    {
      title: "Smart Contracts",
      icon: Code,
      content: [
        "Contract architecture",
        "Deployment guide",
        "Contract interactions",
        "Security considerations",
      ],
    },
    {
      title: "API Reference",
      icon: BookOpen,
      content: [
        "REST API endpoints",
        "Authentication",
        "WebSocket connections",
        "Rate limits and quotas",
      ],
    },
    {
      title: "Security",
      icon: Shield,
      content: [
        "Best practices",
        "Wallet security",
        "Smart contract audits",
        "Risk mitigation strategies",
      ],
    },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-darker text-white">
        <Navigation />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="pt-24 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Documentation</h1>
            </div>
            <p className="text-muted-foreground mb-12 max-w-3xl">
              Complete technical documentation for the cross-chain arbitrage bot
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {sections.map((section, index) => (
                <Card key={index} className="bg-card-bg border-white/10 p-6 hover:border-brand transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand/10 rounded-lg">
                      <section.icon className="w-6 h-6 text-brand" />
                    </div>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-brand mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            {/* Quick Start Guide */}
            <Card className="bg-card-bg border-white/10 p-8 mt-12">
              <h2 className="text-2xl font-bold mb-6">Quick Start Guide</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center font-bold text-brand">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Connect Your Wallet</h4>
                    <p className="text-sm text-muted-foreground">
                      Use Hiro Wallet or another Stacks-compatible wallet to connect to the platform
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center font-bold text-brand">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Configure Bot Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Set your risk tolerance, minimum profit thresholds, and gas preferences
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center font-bold text-brand">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Start the Bot</h4>
                    <p className="text-sm text-muted-foreground">
                      Activate the bot and let it automatically detect and execute arbitrage opportunities
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center font-bold text-brand">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Monitor Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      Track trades, profits, and bot performance through the dashboard and analytics pages
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
