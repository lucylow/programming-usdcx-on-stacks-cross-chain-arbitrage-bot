"use client"

import { Shield, AlertTriangle, TrendingDown, BarChart3, Activity } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useDapp } from "@/lib/dapp/DappProvider"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function RiskAnalysisPage() {
  const { recentTrades, botStatus, opportunities, isLoading } = useDapp()

  const failedTrades = recentTrades.filter((t) => t.status === "failed")
  const totalLoss = failedTrades.reduce((sum, t) => sum + Math.abs(Math.min(0, t.profit)), 0)
  const avgExecutionTime =
    recentTrades.length > 0
      ? recentTrades.reduce((sum, t) => sum + t.executionTime, 0) / recentTrades.length
      : 0

  const riskScore = (() => {
    let score = 100
    const failureRate = recentTrades.length > 0 ? failedTrades.length / recentTrades.length : 0
    score -= failureRate * 50
    if (avgExecutionTime > 30000) score -= 20
    if (botStatus?.winRate && botStatus.winRate < 0.5) score -= 30
    return Math.max(0, Math.min(100, score))
  })()

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: "Low", color: "bg-accent/20 text-accent border-accent/30" }
    if (score >= 60) return { label: "Medium", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
    return { label: "High", color: "bg-error/20 text-error border-error/30" }
  }

  const riskLevel = getRiskLevel(riskScore)

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
              <Shield className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Risk Analysis</h1>
            </div>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              Comprehensive risk assessment and management metrics for your arbitrage bot operations
            </p>

            {/* Risk Score Card */}
            <Card className="bg-card-bg border-white/10 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Overall Risk Score</h2>
                  <p className="text-muted-foreground text-sm">
                    Calculated based on failure rate, execution time, and win rate
                  </p>
                </div>
                <Badge className={`${riskLevel.color} text-lg px-4 py-2`}>{riskLevel.label} Risk</Badge>
              </div>
              <div className="relative">
                <div className="h-4 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      riskScore >= 80 ? "bg-accent" : riskScore >= 60 ? "bg-yellow-500" : "bg-error"
                    }`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
                <div className="text-center mt-2 text-2xl font-bold">{riskScore}/100</div>
              </div>
            </Card>

            {/* Risk Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-error/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-error" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Failure Rate</div>
                    {isLoading ? (
                      <div className="h-6 w-20 bg-black/20 rounded animate-pulse mt-1" />
                    ) : (
                      <div className="text-xl font-bold text-white">
                        {recentTrades.length > 0
                          ? ((failedTrades.length / recentTrades.length) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {failedTrades.length} failed out of {recentTrades.length} total trades
                </div>
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Losses</div>
                    {isLoading ? (
                      <div className="h-6 w-20 bg-black/20 rounded animate-pulse mt-1" />
                    ) : (
                      <div className="text-xl font-bold text-error">${totalLoss.toFixed(2)}</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Cumulative losses from failed trades
                </div>
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avg Execution Time</div>
                    {isLoading ? (
                      <div className="h-6 w-20 bg-black/20 rounded animate-pulse mt-1" />
                    ) : (
                      <div className="text-xl font-bold text-white">{(avgExecutionTime / 1000).toFixed(1)}s</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {avgExecutionTime > 30000 ? "⚠️ Above optimal threshold" : "✓ Within optimal range"}
                </div>
              </Card>
            </div>

            {/* Risk Factors */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card-bg border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand" />
                  Risk Factors
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-sm">Win Rate</span>
                    <Badge
                      className={
                        (botStatus?.winRate || 0) >= 0.7
                          ? "bg-accent/20 text-accent"
                          : (botStatus?.winRate || 0) >= 0.5
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-error/20 text-error"
                      }
                    >
                      {((botStatus?.winRate || 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-sm">Execution Speed</span>
                    <Badge
                      className={
                        avgExecutionTime < 30000
                          ? "bg-accent/20 text-accent"
                          : avgExecutionTime < 60000
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-error/20 text-error"
                      }
                    >
                      {(avgExecutionTime / 1000).toFixed(1)}s
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-sm">Failure Rate</span>
                    <Badge
                      className={
                        (failedTrades.length / recentTrades.length || 0) < 0.1
                          ? "bg-accent/20 text-accent"
                          : (failedTrades.length / recentTrades.length || 0) < 0.3
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-error/20 text-error"
                      }
                    >
                      {((failedTrades.length / recentTrades.length) * 100 || 0).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="bg-card-bg border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {riskScore < 60 && (
                    <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-sm">
                      <strong className="text-error">High Risk Detected:</strong> Consider reviewing bot parameters
                      and reducing trade size
                    </div>
                  )}
                  {avgExecutionTime > 30000 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                      <strong className="text-yellow-400">Slow Execution:</strong> Execution time exceeds optimal
                      threshold. Check network conditions and gas settings.
                    </div>
                  )}
                  {(botStatus?.winRate || 0) < 0.5 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                      <strong className="text-yellow-400">Low Win Rate:</strong> Consider adjusting opportunity
                      detection thresholds
                    </div>
                  )}
                  {riskScore >= 80 && (
                    <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm">
                      <strong className="text-accent">System Healthy:</strong> All risk metrics are within optimal
                      ranges
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
