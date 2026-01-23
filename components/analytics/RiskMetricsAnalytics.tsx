import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  TrendingUp,
  Zap,
  Gauge,
  Target,
  AlertCircle,
} from "lucide-react"
import { motion } from "framer-motion"

interface RiskExposure {
  totalExposure: number
  activePositions: number
  maxPositionSize: number
  averagePositionSize: number
  leverage: number
  concentrationRisk: number
  liquidityRisk: number
}

interface SafetyMetrics {
  sharpeRatio: number
  volatility: number
  maxDrawdown: number
  currentDrawdown: number
  winRate: number
  profitFactor: number
  riskAdjustedReturn: number
  safetyScore: number
}

interface DrawdownPeriod {
  startTime: number
  endTime?: number
  peakValue: number
  troughValue: number
  drawdown: number
  drawdownPercentage: number
  duration: number
  isActive: boolean
}

interface RiskMetricsData {
  dailyPnL: number
  dailyTradeCount: number
  circuitBreakerActive: boolean
  remainingDailyBuffer: number
  maxPositionSize: number
  riskExposure: RiskExposure
  safetyMetrics: SafetyMetrics
  drawdownPeriods: DrawdownPeriod[]
  currentDrawdownPeriod?: DrawdownPeriod
  equityCurve: Array<{ timestamp: number; value: number }>
}

export function RiskMetricsAnalytics() {
  const [metrics, setMetrics] = useState<RiskMetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/risk/metrics")
        if (!response.ok) {
          throw new Error("Failed to fetch risk metrics")
        }
        const data = await response.json()
        setMetrics(data.data || data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load risk metrics")
        console.error("Error fetching risk metrics:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Error loading risk metrics: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No risk metrics available</p>
        </CardContent>
      </Card>
    )
  }

  const { riskExposure, safetyMetrics, drawdownPeriods, currentDrawdownPeriod } = metrics

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: "Low", color: "bg-green-500/20 text-green-500 border-green-500/30" }
    if (score >= 60) return { label: "Medium", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" }
    return { label: "High", color: "bg-red-500/20 text-red-500 border-red-500/30" }
  }

  const safetyLevel = getRiskLevel(safetyMetrics.safetyScore)

  return (
    <div className="space-y-6">
      {/* Safety Score Overview */}
      <Card className="border-2" style={{ borderColor: safetyLevel.color.includes("green") ? "rgba(34, 197, 94, 0.3)" : safetyLevel.color.includes("yellow") ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${safetyLevel.color}`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Overall Safety Score</CardTitle>
                <p className="text-sm text-muted-foreground">Comprehensive risk assessment</p>
              </div>
            </div>
            <Badge variant="outline" className={safetyLevel.color}>
              {safetyLevel.label} Risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <div className={`text-5xl font-bold ${getSafetyScoreColor(safetyMetrics.safetyScore)}`}>
                {safetyMetrics.safetyScore.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Out of 100</p>
            </div>
            <div className="flex-1 ml-8">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${safetyLevel.color.includes("green") ? "bg-green-500" : safetyLevel.color.includes("yellow") ? "bg-yellow-500" : "bg-red-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${safetyMetrics.safetyScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">Sharpe Ratio</span>
            </div>
            <div className="text-3xl font-bold mb-1">{safetyMetrics.sharpeRatio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {safetyMetrics.sharpeRatio > 1.5 ? "Excellent" : safetyMetrics.sharpeRatio > 1 ? "Good" : "Needs Improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-5 h-5 text-secondary" />
              <span className="text-xs text-muted-foreground">Volatility</span>
            </div>
            <div className="text-3xl font-bold mb-1">{(safetyMetrics.volatility * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Annualized</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <span className="text-xs text-muted-foreground">Max Drawdown</span>
            </div>
            <div className="text-3xl font-bold mb-1">{(safetyMetrics.maxDrawdown * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {currentDrawdownPeriod ? "Active drawdown" : "Historical peak"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">Win Rate</span>
            </div>
            <div className="text-3xl font-bold mb-1">{(safetyMetrics.winRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Win rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Exposure Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <CardTitle>Risk Exposure</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Exposure</p>
              <p className="text-2xl font-bold">${riskExposure.totalExposure.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {riskExposure.activePositions} active position{riskExposure.activePositions !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Average Position Size</p>
              <p className="text-2xl font-bold">${riskExposure.averagePositionSize.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Max: ${riskExposure.maxPositionSize.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Concentration Risk</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${riskExposure.concentrationRisk > 0.5 ? "bg-red-500" : riskExposure.concentrationRisk > 0.3 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${riskExposure.concentrationRisk * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{(riskExposure.concentrationRisk * 100).toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {riskExposure.concentrationRisk > 0.5 ? "High" : riskExposure.concentrationRisk > 0.3 ? "Moderate" : "Low"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Liquidity Risk</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${riskExposure.liquidityRisk > 0.7 ? "bg-red-500" : riskExposure.liquidityRisk > 0.5 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${riskExposure.liquidityRisk * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{(riskExposure.liquidityRisk * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Leverage</p>
              <p className="text-2xl font-bold">{riskExposure.leverage.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Profit Factor</p>
              <p className="text-2xl font-bold">{safetyMetrics.profitFactor.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {safetyMetrics.profitFactor > 2 ? "Excellent" : safetyMetrics.profitFactor > 1 ? "Good" : "Poor"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawdown Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <CardTitle>Current Drawdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {currentDrawdownPeriod ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Drawdown</span>
                    <Badge variant="destructive">Active</Badge>
                  </div>
                  <div className="text-3xl font-bold text-destructive">
                    {(currentDrawdownPeriod.drawdownPercentage * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ${currentDrawdownPeriod.drawdown.toLocaleString()} from peak
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Peak Value</p>
                    <p className="text-lg font-semibold">${currentDrawdownPeriod.peakValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trough Value</p>
                    <p className="text-lg font-semibold">${currentDrawdownPeriod.troughValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="text-lg font-semibold">
                      {Math.floor(currentDrawdownPeriod.duration / (1000 * 60 * 60))}h{" "}
                      {Math.floor((currentDrawdownPeriod.duration % (1000 * 60 * 60)) / (1000 * 60))}m
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Started</p>
                    <p className="text-lg font-semibold">
                      {new Date(currentDrawdownPeriod.startTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-3xl font-bold text-green-500 mb-2">No Active Drawdown</div>
                <p className="text-sm text-muted-foreground">Equity is at or near peak</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <CardTitle>Drawdown History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {drawdownPeriods.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {drawdownPeriods.slice(-10).reverse().map((period, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {new Date(period.startTime).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {(period.drawdownPercentage * 100).toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Duration: {Math.floor(period.duration / (1000 * 60 * 60))}h</span>
                      <span>•</span>
                      <span>${period.drawdown.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No drawdown periods recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Safety Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <CardTitle>Additional Safety Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Risk-Adjusted Return</p>
              <p className="text-2xl font-bold">{safetyMetrics.riskAdjustedReturn.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Annualized return / volatility</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Drawdown</p>
              <p className="text-2xl font-bold">{(safetyMetrics.currentDrawdown * 100).toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentDrawdownPeriod ? "Active" : "None"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Daily P&L</p>
              <p className={`text-2xl font-bold ${metrics.dailyPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${metrics.dailyPnL >= 0 ? "+" : ""}{metrics.dailyPnL.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.dailyTradeCount} trades today
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Circuit Breaker Status */}
      {metrics.circuitBreakerActive && (
        <Card className="border-destructive border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Circuit Breaker Active</h3>
                <p className="text-sm text-muted-foreground">
                  Trading has been halted due to risk limits. Daily loss limit reached.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
