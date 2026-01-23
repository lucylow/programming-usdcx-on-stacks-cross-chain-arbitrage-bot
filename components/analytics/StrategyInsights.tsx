"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Target, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Progress } from "../ui/progress"

interface StrategyInsight {
  metric: string
  currentValue: number
  optimalValue: number
  recommendation: string
  priority: "high" | "medium" | "low"
}

export function StrategyInsights() {
  const [insights, setInsights] = useState<StrategyInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/analytics/insights")
        if (!response.ok) throw new Error("Failed to fetch strategy insights")
        const result = await response.json()
        setInsights(result.insights || [])
      } catch (error) {
        console.error("Error fetching strategy insights:", error)
        setInsights([])
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
    const interval = setInterval(fetchInsights, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-4 h-4" />
      case "medium":
        return <Info className="w-4 h-4" />
      default:
        return <CheckCircle2 className="w-4 h-4" />
    }
  }

  const calculateProgress = (current: number, optimal: number) => {
    if (optimal === 0) return 0
    const progress = (current / optimal) * 100
    return Math.min(100, Math.max(0, progress))
  }

  const formatValue = (metric: string, value: number) => {
    if (metric.includes("Rate") || metric.includes("Ratio")) {
      return value.toFixed(2)
    }
    if (metric.includes("Time")) {
      return `${(value / 1000).toFixed(0)}s`
    }
    if (metric.includes("Cost") || metric.includes("Profit")) {
      return `$${value.toFixed(2)}`
    }
    return value.toFixed(2)
  }

  if (loading && insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Analyzing strategy...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle>Strategy Optimization</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <div>All metrics are within optimal ranges!</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle>Strategy Optimization</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => {
          const progress = calculateProgress(insight.currentValue, insight.optimalValue)
          const isBelowOptimal = insight.currentValue < insight.optimalValue

          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-border bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{insight.metric}</span>
                  <Badge className={getPriorityColor(insight.priority)}>
                    {getPriorityIcon(insight.priority)}
                    <span className="ml-1 capitalize">{insight.priority}</span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-medium">{formatValue(insight.metric, insight.currentValue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Optimal</span>
                  <span className="font-medium text-primary">{formatValue(insight.metric, insight.optimalValue)}</span>
                </div>
                <Progress
                  value={progress}
                  className={`h-2 ${isBelowOptimal ? "bg-red-500/20" : "bg-green-500/20"}`}
                />
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-sm text-muted-foreground mb-1">Recommendation:</div>
                <div className="text-sm">{insight.recommendation}</div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
