"use client"

import { TrendingUp, BarChart3, Activity, DollarSign, Target, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PriceChart } from "@/components/dapp/PriceChart"
import { useDapp } from "@/lib/dapp/DappProvider"
import Link from "next/link"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function AnalyticsPage() {
  const { botStatus, performance, opportunities, recentTrades, isLoading } = useDapp()

  const avgProfitPerTrade =
    recentTrades.length > 0 ? recentTrades.reduce((sum, t) => sum + t.profit, 0) / recentTrades.length : 0

  const successfulTrades = recentTrades.filter((t) => t.status === "success")
  const failedTrades = recentTrades.filter((t) => t.status === "failed")

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-darker text-white">
        <Navigation />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="pt-24 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-brand" />
                <div>
                  <h1 className="text-4xl font-bold">Analytics Overview</h1>
                  <p className="text-muted-foreground mt-2">
                    Comprehensive performance metrics and insights for your arbitrage bot
                  </p>
                </div>
              </div>
              <Link href="/analytics/risk">
                <Card className="bg-card-bg border-white/10 p-4 hover:border-brand transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Risk Analysis</span>
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </Card>
              </Link>
            </div>

            {/* Key Performance Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Profit</div>
                    {isLoading ? (
                      <div className="h-6 w-20 bg-black/20 rounded animate-pulse mt-1" />
                    ) : (
                      <div className="text-xl font-bold text-accent">
                        ${((performance?.totalProfit || 0) / 1000).toFixed(1)}K
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {recentTrades.length} trades executed
                </div>
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-brand/10 rounded-lg">
                    <Target className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                    {isLoading ? (
                      <div className="h-6 w-20 bg-black/20 rounded animate-pulse mt-1" />
                    ) : (
                      <div className="text-xl font-bold text-white">
                        {((botStatus?.winRate || 0) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {successfulTrades.length} successful, {failedTrades.length} failed
                </div>
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avg Profit/Trade</div>
                    {isLoading ? (
                      <div className="h-6 w-20 bg-black/20 rounded animate-pulse mt-1" />
                    ) : (
                      <div className="text-xl font-bold text-white">${avgProfitPerTrade.toFixed(2)}</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {opportunities.length} opportunities detected
                </div>
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Trades</div>
                    {isLoading ? (
                      <div className="h-6 w-20 bg-black/20 rounded animate-pulse mt-1" />
                    ) : (
                      <div className="text-xl font-bold text-white">{performance?.totalTrades || 0}</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {botStatus?.activeTrades || 0} currently active
                </div>
              </Card>
            </div>

            {/* Charts and Visualizations */}
            <div className="space-y-6">
              <PriceChart />

              {/* Performance Breakdown */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card-bg border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4">Trade Status Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Successful</span>
                        <span className="text-accent font-medium">
                          {((successfulTrades.length / recentTrades.length) * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${(successfulTrades.length / recentTrades.length) * 100 || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Failed</span>
                        <span className="text-error font-medium">
                          {((failedTrades.length / recentTrades.length) * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-error transition-all"
                          style={{ width: `${(failedTrades.length / recentTrades.length) * 100 || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-card-bg border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4">Opportunity Detection</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Opportunities</span>
                      <span className="text-xl font-bold text-accent">
                        {opportunities.filter((o) => o.status === "active").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Detected</span>
                      <span className="text-xl font-bold text-white">{opportunities.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Executed</span>
                      <span className="text-xl font-bold text-brand">
                        {opportunities.filter((o) => o.status === "completed").length}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
