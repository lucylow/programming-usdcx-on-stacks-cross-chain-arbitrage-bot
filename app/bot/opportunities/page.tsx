"use client"

import { Zap } from "lucide-react"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LiveOpportunities } from "@/components/dapp/LiveOpportunities"
import { WalletStatus } from "@/components/dapp/WalletStatus"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function BotOpportunitiesPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-darker text-white">
        <Navigation />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="pt-24 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Arbitrage Opportunities</h1>
            </div>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              Discover and execute profitable cross-chain arbitrage opportunities detected by the AI-powered bot.
              Each opportunity shows the price difference, expected profit, and execution confidence.
            </p>

            <div className="space-y-6">
              <WalletStatus />
              <LiveOpportunities />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
