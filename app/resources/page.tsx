"use client"

import { BookOpen, FileText, HelpCircle, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function ResourcesPage() {
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
              <BookOpen className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Resources</h1>
            </div>
            <p className="text-muted-foreground mb-12 max-w-3xl">
              Access documentation, guides, and helpful resources to get the most out of the arbitrage bot
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/docs">
                <Card className="bg-card-bg border-white/10 p-8 hover:border-brand transition-colors cursor-pointer h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-brand/10 rounded-lg">
                      <FileText className="w-8 h-8 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Documentation</h3>
                      <p className="text-muted-foreground text-sm">Technical guides and API reference</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Comprehensive documentation covering bot setup, configuration, smart contracts, and integration
                    guides
                  </p>
                </Card>
              </Link>

              <Link href="/faq">
                <Card className="bg-card-bg border-white/10 p-8 hover:border-brand transition-colors cursor-pointer h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <HelpCircle className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">FAQ</h3>
                      <p className="text-muted-foreground text-sm">Frequently asked questions</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Answers to common questions about the bot, trading strategies, fees, and troubleshooting
                  </p>
                </Card>
              </Link>
            </div>

            {/* Additional Resources */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Additional Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-card-bg border-white/10 p-6">
                  <h4 className="font-semibold mb-2">Smart Contracts</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and interact with deployed smart contracts
                  </p>
                  <a
                    href="#"
                    className="text-brand hover:text-brand-dark text-sm flex items-center gap-1"
                  >
                    View Contracts <ExternalLink className="w-3 h-3" />
                  </a>
                </Card>

                <Card className="bg-card-bg border-white/10 p-6">
                  <h4 className="font-semibold mb-2">API Reference</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    RESTful API documentation for developers
                  </p>
                  <a
                    href="#"
                    className="text-brand hover:text-brand-dark text-sm flex items-center gap-1"
                  >
                    API Docs <ExternalLink className="w-3 h-3" />
                  </a>
                </Card>

                <Card className="bg-card-bg border-white/10 p-6">
                  <h4 className="font-semibold mb-2">Community</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join discussions and get support
                  </p>
                  <a
                    href="#"
                    className="text-brand hover:text-brand-dark text-sm flex items-center gap-1"
                  >
                    Join Discord <ExternalLink className="w-3 h-3" />
                  </a>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
