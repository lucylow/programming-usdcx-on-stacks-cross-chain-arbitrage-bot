"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Calendar, Lightbulb } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface PatternAnalysis {
  trend: "increasing" | "decreasing" | "stable"
  volatility: "high" | "medium" | "low"
  bestTimeOfDay: string
  bestDayOfWeek: string
  peakPerformancePeriod: { start: number; end: number }
  anomalies: Array<{ timestamp: number; type: string; description: string }>
  recommendations: string[]
}

export function PatternAnalysis() {
  const [period, setPeriod] = useState<"hourly" | "daily" | "weekly" | "monthly">("daily")
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/analytics/patterns?period=${period}`)
        if (!response.ok) throw new Error("Failed to fetch pattern analysis")
        const data = await response.json()
        setAnalysis(data)
      } catch (error) {
        console.error("Error fetching pattern analysis:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
    const interval = setInterval(fetchAnalysis, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [period])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "decreasing":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-green-500/10 text-green-500 border-green-500/20"
    }
  }

  if (loading && !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pattern Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Analyzing patterns...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pattern Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No pattern data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <CardTitle>Pattern Analysis</CardTitle>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend and Volatility */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Performance Trend</div>
            <Badge className={`${getTrendColor(analysis.trend)} flex items-center gap-2 w-fit`}>
              {getTrendIcon(analysis.trend)}
              <span className="capitalize">{analysis.trend}</span>
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Volatility</div>
            <Badge className={`${getVolatilityColor(analysis.volatility)} flex items-center gap-2 w-fit capitalize`}>
              {analysis.volatility}
            </Badge>
          </div>
        </div>

        {/* Best Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Best Time of Day
            </div>
            <div className="text-lg font-semibold">{analysis.bestTimeOfDay}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Best Day of Week
            </div>
            <div className="text-lg font-semibold">{analysis.bestDayOfWeek}</div>
          </div>
        </div>

        {/* Peak Performance Period */}
        {analysis.peakPerformancePeriod.start > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Peak Performance Period</div>
            <div className="text-sm">
              {new Date(analysis.peakPerformancePeriod.start).toLocaleString()} -{" "}
              {new Date(analysis.peakPerformancePeriod.end).toLocaleString()}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {analysis.anomalies.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Detected Anomalies</div>
            <div className="space-y-2">
              {analysis.anomalies.slice(0, 5).map((anomaly, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/50 border border-border text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={anomaly.type === "spike" ? "default" : "destructive"}>
                      {anomaly.type}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(anomaly.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground">{anomaly.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="w-4 h-4 text-primary" />
              Recommendations
            </div>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
