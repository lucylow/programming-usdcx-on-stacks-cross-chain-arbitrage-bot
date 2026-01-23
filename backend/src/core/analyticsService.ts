import { logger } from "../utils/logger"

export interface PerformanceDataPoint {
  timestamp: number
  totalProfit: number
  totalTrades: number
  profitableTrades: number
  totalVolume: number
  avgProfitPerTrade: number
  winRate: number
  maxProfit: number
  maxLoss: number
  sharpeRatio: number
  executionTime: number
  gasCost: number
  bridgeFee: number
}

export interface PatternAnalysis {
  trend: "increasing" | "decreasing" | "stable"
  volatility: "high" | "medium" | "low"
  bestTimeOfDay: string
  bestDayOfWeek: string
  peakPerformancePeriod: { start: number; end: number }
  anomalies: Array<{ timestamp: number; type: string; description: string }>
  recommendations: string[]
}

export interface StrategyInsight {
  metric: string
  currentValue: number
  optimalValue: number
  recommendation: string
  priority: "high" | "medium" | "low"
}

export class AnalyticsService {
  private performanceHistory: PerformanceDataPoint[] = []
  private maxHistorySize = 10000 // Keep last 10k data points
  private aggregationIntervals = {
    hourly: 3600000, // 1 hour
    daily: 86400000, // 24 hours
    weekly: 604800000, // 7 days
    monthly: 2592000000, // 30 days
  }

  /**
   * Record a performance data point
   */
  recordPerformance(data: Omit<PerformanceDataPoint, "timestamp">): void {
    const dataPoint: PerformanceDataPoint = {
      ...data,
      timestamp: Date.now(),
    }

    this.performanceHistory.push(dataPoint)

    // Trim history if it exceeds max size
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Get performance data for a specific period
   */
  getPerformanceData(
    period: "hourly" | "daily" | "weekly" | "monthly",
    limit = 100,
  ): PerformanceDataPoint[] {
    const interval = this.aggregationIntervals[period]
    const now = Date.now()
    const cutoff = now - (limit * interval)

    // Filter data points within the period
    let filtered = this.performanceHistory.filter((point) => point.timestamp >= cutoff)

    // Aggregate data points by interval
    const aggregated: Map<number, PerformanceDataPoint[]> = new Map()

    for (const point of filtered) {
      // Round timestamp to interval boundary
      const bucket = Math.floor(point.timestamp / interval) * interval

      if (!aggregated.has(bucket)) {
        aggregated.set(bucket, [])
      }
      aggregated.get(bucket)!.push(point)
    }

    // Aggregate each bucket
    const result: PerformanceDataPoint[] = []
    for (const [bucket, points] of aggregated.entries()) {
      if (points.length === 0) continue

      const aggregatedPoint: PerformanceDataPoint = {
        timestamp: bucket,
        totalProfit: points.reduce((sum, p) => sum + p.totalProfit, 0),
        totalTrades: points.reduce((sum, p) => sum + p.totalTrades, 0),
        profitableTrades: points.reduce((sum, p) => sum + p.profitableTrades, 0),
        totalVolume: points.reduce((sum, p) => sum + p.totalVolume, 0),
        avgProfitPerTrade:
          points.reduce((sum, p) => sum + p.avgProfitPerTrade, 0) / points.length,
        winRate: points.reduce((sum, p) => sum + p.winRate, 0) / points.length,
        maxProfit: Math.max(...points.map((p) => p.maxProfit)),
        maxLoss: Math.min(...points.map((p) => p.maxLoss)),
        sharpeRatio: points.reduce((sum, p) => sum + p.sharpeRatio, 0) / points.length,
        executionTime: points.reduce((sum, p) => sum + p.executionTime, 0) / points.length,
        gasCost: points.reduce((sum, p) => sum + p.gasCost, 0),
        bridgeFee: points.reduce((sum, p) => sum + p.bridgeFee, 0),
      }

      result.push(aggregatedPoint)
    }

    // Sort by timestamp
    return result.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Analyze patterns in performance data
   */
  analyzePatterns(period: "hourly" | "daily" | "weekly" | "monthly" = "daily"): PatternAnalysis {
    const data = this.getPerformanceData(period, 100)
    if (data.length < 2) {
      return {
        trend: "stable",
        volatility: "low",
        bestTimeOfDay: "N/A",
        bestDayOfWeek: "N/A",
        peakPerformancePeriod: { start: 0, end: 0 },
        anomalies: [],
        recommendations: ["Insufficient data for pattern analysis"],
      }
    }

    // Calculate trend
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.totalProfit, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.totalProfit, 0) / secondHalf.length
    const trend = secondAvg > firstAvg * 1.1 ? "increasing" : secondAvg < firstAvg * 0.9 ? "decreasing" : "stable"

    // Calculate volatility
    const profits = data.map((p) => p.totalProfit)
    const mean = profits.reduce((sum, p) => sum + p, 0) / profits.length
    const variance = profits.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / profits.length
    const stdDev = Math.sqrt(variance)
    const volatility = stdDev > mean * 0.5 ? "high" : stdDev > mean * 0.2 ? "medium" : "low"

    // Find best time of day
    const hourlyProfits: Map<number, number[]> = new Map()
    for (const point of data) {
      const date = new Date(point.timestamp)
      const hour = date.getHours()
      if (!hourlyProfits.has(hour)) {
        hourlyProfits.set(hour, [])
      }
      hourlyProfits.get(hour)!.push(point.totalProfit)
    }

    let bestHour = 0
    let bestAvg = -Infinity
    for (const [hour, profits] of hourlyProfits.entries()) {
      const avg = profits.reduce((sum, p) => sum + p, 0) / profits.length
      if (avg > bestAvg) {
        bestAvg = avg
        bestHour = hour
      }
    }
    const bestTimeOfDay = `${bestHour}:00`

    // Find best day of week
    const dailyProfits: Map<number, number[]> = new Map()
    for (const point of data) {
      const date = new Date(point.timestamp)
      const day = date.getDay()
      if (!dailyProfits.has(day)) {
        dailyProfits.set(day, [])
      }
      dailyProfits.get(day)!.push(point.totalProfit)
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    let bestDay = 0
    let bestDayAvg = -Infinity
    for (const [day, profits] of dailyProfits.entries()) {
      const avg = profits.reduce((sum, p) => sum + p, 0) / profits.length
      if (avg > bestDayAvg) {
        bestDayAvg = avg
        bestDay = day
      }
    }
    const bestDayOfWeek = dayNames[bestDay]

    // Find peak performance period
    let maxProfit = -Infinity
    let peakStart = 0
    let peakEnd = 0
    for (let i = 0; i < data.length - 1; i++) {
      const windowProfit = data.slice(i, Math.min(i + 3, data.length)).reduce((sum, p) => sum + p.totalProfit, 0)
      if (windowProfit > maxProfit) {
        maxProfit = windowProfit
        peakStart = data[i].timestamp
        peakEnd = data[Math.min(i + 3, data.length - 1)].timestamp
      }
    }

    // Detect anomalies (profits more than 2 standard deviations from mean)
    const anomalies: Array<{ timestamp: number; type: string; description: string }> = []
    for (const point of data) {
      const deviation = Math.abs(point.totalProfit - mean) / stdDev
      if (deviation > 2) {
        anomalies.push({
          timestamp: point.timestamp,
          type: point.totalProfit > mean ? "spike" : "drop",
          description: `Profit ${point.totalProfit > mean ? "spike" : "drop"} of $${Math.abs(point.totalProfit - mean).toFixed(2)}`,
        })
      }
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (trend === "decreasing") {
      recommendations.push("Performance is declining. Consider reviewing strategy parameters.")
    }
    if (volatility === "high") {
      recommendations.push("High volatility detected. Consider implementing risk management measures.")
    }
    if (data[data.length - 1].winRate < 0.7) {
      recommendations.push("Win rate is below optimal. Review opportunity selection criteria.")
    }
    if (data[data.length - 1].avgProfitPerTrade < 10) {
      recommendations.push("Average profit per trade is low. Consider increasing trade size or improving opportunity detection.")
    }
    if (recommendations.length === 0) {
      recommendations.push("Performance metrics look good. Continue monitoring.")
    }

    return {
      trend,
      volatility,
      bestTimeOfDay,
      bestDayOfWeek,
      peakPerformancePeriod: { start: peakStart, end: peakEnd },
      anomalies,
      recommendations,
    }
  }

  /**
   * Get strategy optimization insights
   */
  getStrategyInsights(): StrategyInsight[] {
    const recentData = this.getPerformanceData("daily", 30)
    if (recentData.length === 0) {
      return []
    }

    const latest = recentData[recentData.length - 1]
    const insights: StrategyInsight[] = []

    // Win rate insight
    if (latest.winRate < 0.75) {
      insights.push({
        metric: "Win Rate",
        currentValue: latest.winRate,
        optimalValue: 0.85,
        recommendation: "Increase confidence threshold for opportunity selection",
        priority: latest.winRate < 0.6 ? "high" : "medium",
      })
    }

    // Average profit insight
    if (latest.avgProfitPerTrade < 50) {
      insights.push({
        metric: "Average Profit per Trade",
        currentValue: latest.avgProfitPerTrade,
        optimalValue: 100,
        recommendation: "Focus on higher-value opportunities or increase trade size",
        priority: latest.avgProfitPerTrade < 20 ? "high" : "medium",
      })
    }

    // Execution time insight
    if (latest.executionTime > 300000) {
      insights.push({
        metric: "Execution Time",
        currentValue: latest.executionTime,
        optimalValue: 120000,
        recommendation: "Optimize transaction batching or use faster bridge options",
        priority: latest.executionTime > 600000 ? "high" : "medium",
      })
    }

    // Gas cost insight
    if (latest.gasCost > 50) {
      insights.push({
        metric: "Gas Cost",
        currentValue: latest.gasCost,
        optimalValue: 30,
        recommendation: "Consider using gas optimization techniques or layer 2 solutions",
        priority: latest.gasCost > 100 ? "high" : "low",
      })
    }

    // Sharpe ratio insight
    if (latest.sharpeRatio < 1.5) {
      insights.push({
        metric: "Sharpe Ratio",
        currentValue: latest.sharpeRatio,
        optimalValue: 2.0,
        recommendation: "Improve risk-adjusted returns by reducing volatility",
        priority: latest.sharpeRatio < 1.0 ? "high" : "low",
      })
    }

    return insights
  }

  /**
   * Get summary statistics
   */
  getSummary(period: "hourly" | "daily" | "weekly" | "monthly" = "daily"): {
    totalProfit: number
    totalTrades: number
    winRate: number
    avgProfitPerTrade: number
    bestDay: { timestamp: number; profit: number }
    worstDay: { timestamp: number; profit: number }
  } {
    const data = this.getPerformanceData(period, 100)
    if (data.length === 0) {
      return {
        totalProfit: 0,
        totalTrades: 0,
        winRate: 0,
        avgProfitPerTrade: 0,
        bestDay: { timestamp: 0, profit: 0 },
        worstDay: { timestamp: 0, profit: 0 },
      }
    }

    const totalProfit = data.reduce((sum, p) => sum + p.totalProfit, 0)
    const totalTrades = data.reduce((sum, p) => sum + p.totalTrades, 0)
    const profitableTrades = data.reduce((sum, p) => sum + p.profitableTrades, 0)
    const winRate = totalTrades > 0 ? profitableTrades / totalTrades : 0
    const avgProfitPerTrade = profitableTrades > 0 ? totalProfit / profitableTrades : 0

    let bestDay = data[0]
    let worstDay = data[0]
    for (const point of data) {
      if (point.totalProfit > bestDay.totalProfit) {
        bestDay = point
      }
      if (point.totalProfit < worstDay.totalProfit) {
        worstDay = point
      }
    }

    return {
      totalProfit,
      totalTrades,
      winRate,
      avgProfitPerTrade,
      bestDay: { timestamp: bestDay.timestamp, profit: bestDay.totalProfit },
      worstDay: { timestamp: worstDay.timestamp, profit: worstDay.totalProfit },
    }
  }

  /**
   * Clear all history (useful for testing)
   */
  clearHistory(): void {
    this.performanceHistory = []
    logger.info("Analytics history cleared")
  }
}
