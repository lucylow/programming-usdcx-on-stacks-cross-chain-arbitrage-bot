"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { TrendingUp, DollarSign, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface PerformanceDataPoint {
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

interface PerformanceTrendsChartProps {
  period?: "hourly" | "daily" | "weekly" | "monthly"
}

export function PerformanceTrendsChart({ period: initialPeriod = "daily" }: PerformanceTrendsChartProps) {
  const [period, setPeriod] = useState<"hourly" | "daily" | "weekly" | "monthly">(initialPeriod)
  const [chartType, setChartType] = useState<"profit" | "trades" | "winrate">("profit")
  const [data, setData] = useState<PerformanceDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/analytics/performance?period=${period}&limit=100`)
        if (!response.ok) throw new Error("Failed to fetch performance data")
        const result = await response.json()
        setData(result.data || [])
      } catch (error) {
        console.error("Error fetching performance data:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [period])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    if (period === "hourly") {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else if (period === "daily") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else if (period === "weekly") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const chartData = data.map((point) => ({
    ...point,
    date: formatDate(point.timestamp),
    winRatePercent: point.winRate * 100,
  }))

  const getChartConfig = () => {
    switch (chartType) {
      case "profit":
        return {
          dataKey: "totalProfit",
          name: "Total Profit",
          color: "hsl(var(--primary))",
          formatter: formatCurrency,
        }
      case "trades":
        return {
          dataKey: "totalTrades",
          name: "Total Trades",
          color: "hsl(var(--secondary))",
          formatter: (value: number) => value.toString(),
        }
      case "winrate":
        return {
          dataKey: "winRatePercent",
          name: "Win Rate (%)",
          color: "hsl(var(--primary))",
          formatter: (value: number) => `${value.toFixed(1)}%`,
        }
      default:
        return {
          dataKey: "totalProfit",
          name: "Total Profit",
          color: "hsl(var(--primary))",
          formatter: formatCurrency,
        }
    }
  }

  const config = getChartConfig()

  if (loading && data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading performance data...</div>
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
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle>Performance Trends</CardTitle>
          </div>
          <div className="flex gap-2">
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
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={chartType === "profit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("profit")}
              >
                <DollarSign className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === "trades" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("trades")}
              >
                <Activity className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === "winrate" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("winrate")}
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No performance data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === "profit" ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={config.formatter} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => config.formatter(value)}
                />
                <Area
                  type="monotone"
                  dataKey={config.dataKey}
                  stroke={config.color}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  name={config.name}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={config.formatter} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => config.formatter(value)}
                />
                <Line
                  type="monotone"
                  dataKey={config.dataKey}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  name={config.name}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
