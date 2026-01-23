"use client"

import { BarChart3, TrendingUp, Activity, DollarSign, Zap, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BotControlPanel } from "@/components/dapp/BotControlPanel"
import { WalletStatus } from "@/components/dapp/WalletStatus"
import { PriceChart } from "@/components/dapp/PriceChart"
import { LiveOpportunities } from "@/components/dapp/LiveOpportunities"
import { RecentTrades } from "@/components/dapp/RecentTrades"
import { useDapp } from "@/lib/dapp/DappProvider"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function BotDashboardPage() {
  const { botStatus, performance, isLoading } = useDapp()

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
              <BarChart3 className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Bot Dashboard</h1>
            </div>
            <p className="text-muted-foreground mb-8">
              Real-time monitoring of your arbitrage bot's performance and activity
            </p>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Total Profit</span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-24 bg-black/20 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-accent">
                    ${((performance?.totalProfit || 0) / 1000).toFixed(1)}K
                  </div>
                )}
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs">Total Trades</span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-24 bg-black/20 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-white">{performance?.totalTrades || 0}</div>
                )}
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Win Rate</span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-24 bg-black/20 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-accent">
                    {((botStatus?.winRate || 0) * 100).toFixed(1)}%
                  </div>
                )}
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs">Active Trades</span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-24 bg-black/20 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-white">{botStatus?.activeTrades || 0}</div>
                )}
              </Card>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              <WalletStatus />
              <BotControlPanel />
              <PriceChart />

              <div className="grid lg:grid-cols-2 gap-6">
                <LiveOpportunities />
                <RecentTrades />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
