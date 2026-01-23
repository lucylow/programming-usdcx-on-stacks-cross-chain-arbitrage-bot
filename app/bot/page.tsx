"use client"

import { Bot, BarChart3, Zap, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BotControlPanel } from "@/components/dapp/BotControlPanel"
import { WalletStatus } from "@/components/dapp/WalletStatus"
import { PriceChart } from "@/components/dapp/PriceChart"
import Link from "next/link"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function BotPage() {
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
              <Bot className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Bot Control Center</h1>
            </div>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              Monitor and control your cross-chain arbitrage bot. View real-time performance, manage opportunities, and track trading history.
            </p>

            {/* Quick Navigation Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Link href="/bot/dashboard">
                <Card className="bg-card-bg border-white/10 p-6 hover:border-brand transition-colors cursor-pointer h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-brand/10 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-brand" />
                    </div>
                    <h3 className="text-xl font-semibold">Dashboard</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Monitor bot performance metrics, active trades, and real-time statistics
                  </p>
                </Card>
              </Link>

              <Link href="/bot/opportunities">
                <Card className="bg-card-bg border-white/10 p-6 hover:border-brand transition-colors cursor-pointer h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold">Opportunities</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    View detected arbitrage opportunities and execute trades manually
                  </p>
                </Card>
              </Link>

              <Link href="/bot/history">
                <Card className="bg-card-bg border-white/10 p-6 hover:border-brand transition-colors cursor-pointer h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold">History</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Review past trades, execution results, and performance analytics
                  </p>
                </Card>
              </Link>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              <WalletStatus />
              <BotControlPanel />
              <PriceChart />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
