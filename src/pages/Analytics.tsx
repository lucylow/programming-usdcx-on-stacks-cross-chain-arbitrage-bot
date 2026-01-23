import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { BarChart3, TrendingUp, Shield, Activity, DollarSign, Clock, ArrowUpRight, Target, Percent, Zap, Layers, TrendingDown, ArrowDownRight, ExternalLink } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { InteractivePerformanceChart } from "../components/InteractivePerformanceChart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart"
import { AreaChart, Area, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { PerformanceTrendsChart } from "../../components/analytics/PerformanceTrendsChart"
import { PatternAnalysis } from "../../components/analytics/PatternAnalysis"
import { StrategyInsights } from "../../components/analytics/StrategyInsights"

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d")
  const [isLoading, setIsLoading] = useState(true)
  const [performance, setPerformance] = useState({ 
    totalProfit: 12500, 
    totalTrades: 156, 
    profitChange: 12.5,
    avgProfitPerTrade: 80.13,
    roi: 15.8,
    totalVolume: 125000
  })
  const [botStatus, setBotStatus] = useState({ winRate: 0.87, activeTrades: 3 })
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch performance summary
        const summaryRes = await fetch("/api/analytics/summary?period=daily")
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json()
          setSummary(summaryData)
          if (summaryData.totalProfit > 0) {
            setPerformance(prev => ({
              ...prev,
              totalProfit: summaryData.totalProfit,
              totalTrades: summaryData.totalTrades,
              winRate: summaryData.winRate,
              avgProfitPerTrade: summaryData.avgProfitPerTrade,
            }))
            setBotStatus(prev => ({
              ...prev,
              winRate: summaryData.winRate,
            }))
          }
        }

        // Fetch bot status
        const statusRes = await fetch("/api/bot/status")
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setBotStatus(prev => ({
            ...prev,
            activeTrades: statusData.activeTrades || 0,
            winRate: statusData.winRate || prev.winRate,
          }))
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Generate chart data
  const profitData = useMemo(() => {
    const data = []
    const now = Date.now()
    const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const interval = timeRange === "24h" ? 3600000 : 86400000
    
    let cumulativeProfit = 0
    for (let i = days; i >= 0; i--) {
      const profit = (Math.random() - 0.2) * 200
      cumulativeProfit += profit
      data.push({
        date: new Date(now - i * interval).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: Math.max(0, cumulativeProfit),
        trades: Math.floor(Math.random() * 8) + 2,
        volume: Math.floor(Math.random() * 5000) + 1000
      })
    }
    return data
  }, [timeRange])

  const tradeDistribution = [
    { name: 'Ethereum → Stacks', value: 45, profit: 5625 },
    { name: 'Stacks → Ethereum', value: 38, profit: 4750 },
    { name: 'Both Chains', value: 17, profit: 2125 }
  ]

  const chainPerformance = [
    { chain: 'Ethereum', trades: 65, profit: 5200, avgProfit: 80.0 },
    { chain: 'Stacks', trades: 91, profit: 7300, avgProfit: 80.2 }
  ]

  const recentTrades = [
    { id: 1, timestamp: new Date(Date.now() - 3600000), profit: 125.50, chain: 'ETH→STX', status: 'completed', roi: 2.5 },
    { id: 2, timestamp: new Date(Date.now() - 7200000), profit: 98.30, chain: 'STX→ETH', status: 'completed', roi: 1.9 },
    { id: 3, timestamp: new Date(Date.now() - 10800000), profit: 156.80, chain: 'ETH→STX', status: 'completed', roi: 3.1 },
    { id: 4, timestamp: new Date(Date.now() - 14400000), profit: 87.20, chain: 'STX→ETH', status: 'completed', roi: 1.7 },
    { id: 5, timestamp: new Date(Date.now() - 18000000), profit: 142.10, chain: 'ETH→STX', status: 'completed', roi: 2.8 },
  ]

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--muted))']

  const metrics = [
    {
      icon: DollarSign,
      label: "Total Profit",
      value: `$${((performance?.totalProfit || 0) / 1000).toFixed(1)}K`,
      change: `+${performance?.profitChange || 0}%`,
      description: "All-time earnings",
      color: "text-secondary",
      bgGradient: "from-secondary/20 to-secondary/5",
    },
    {
      icon: Activity,
      label: "Total Trades",
      value: performance?.totalTrades || 0,
      change: "+23 this week",
      description: "Successful executions",
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
    },
    {
      icon: TrendingUp,
      label: "Win Rate",
      value: `${((botStatus?.winRate || 0) * 100).toFixed(1)}%`,
      change: "Excellent",
      description: "Success rate",
      color: "text-secondary",
      bgGradient: "from-secondary/20 to-secondary/5",
    },
    {
      icon: Percent,
      label: "ROI",
      value: `${performance?.roi || 0}%`,
      change: "+2.3% this month",
      description: "Return on investment",
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
    },
    {
      icon: DollarSign,
      label: "Avg Profit/Trade",
      value: `$${performance?.avgProfitPerTrade?.toFixed(2) || 0}`,
      change: "+$5.20",
      description: "Average per trade",
      color: "text-secondary",
      bgGradient: "from-secondary/20 to-secondary/5",
    },
    {
      icon: Layers,
      label: "Total Volume",
      value: `$${((performance?.totalVolume || 0) / 1000).toFixed(1)}K`,
      change: "+15%",
      description: "Trading volume",
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <BarChart3 className="w-8 h-8 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                    Analytics Overview
                  </h1>
                  <p className="text-muted-foreground mt-1.5">
                    Comprehensive performance insights and metrics
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(["24h", "7d", "30d", "all"] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${metric.bgGradient} ${metric.color} opacity-80 group-hover:opacity-100 transition-all duration-300 shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <metric.icon className="w-5 h-5" />
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-1 text-xs text-secondary font-medium bg-secondary/10 px-2 py-1 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        <ArrowUpRight className="w-3 h-3" />
                      </motion.div>
                    </div>
                    {isLoading ? (
                      <div className="text-3xl font-bold">...</div>
                    ) : (
                      <>
                        <div className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          {metric.value}
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs sm:text-sm text-muted-foreground font-medium">{metric.label}</span>
                          <span className="text-xs text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded-full">
                            {metric.change}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground/60 mt-2">{metric.description}</div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Analytics Section */}
          <Tabs defaultValue="trends" className="mb-8">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-card/50 mb-6">
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Trends</span>
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Patterns</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="trades" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Trades</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <PerformanceTrendsChart period="daily" />
              </motion.div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <PatternAnalysis />
              </motion.div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <StrategyInsights />
              </motion.div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Interactive Performance Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <InteractivePerformanceChart />
              </motion.div>

              {/* Profit Over Time Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Profit Over Time</CardTitle>
                      </div>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {timeRange}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        profit: {
                          label: "Profit",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <AreaChart data={profitData}>
                        <defs>
                          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <YAxis 
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          stroke="hsl(var(--primary))"
                          fill="url(#profitGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Trade Volume Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <BarChart3 className="w-5 h-5 text-secondary" />
                      </div>
                      <CardTitle className="text-xl">Trade Volume & Count</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        volume: {
                          label: "Volume",
                          color: "hsl(var(--secondary))",
                        },
                        trades: {
                          label: "Trades",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <BarChart data={profitData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar yAxisId="left" dataKey="volume" fill="hsl(var(--secondary))" opacity={0.8} />
                        <Line yAxisId="right" type="monotone" dataKey="trades" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="trades" className="space-y-6">
              {/* Trade Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">Trade Distribution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <ChartContainer
                          config={{
                            ethereum: { label: "Ethereum → Stacks", color: "hsl(var(--primary))" },
                            stacks: { label: "Stacks → Ethereum", color: "hsl(var(--secondary))" },
                            both: { label: "Both Chains", color: "hsl(var(--muted))" },
                          }}
                          className="h-[250px] w-full"
                        >
                          <PieChart>
                            <Pie
                              data={tradeDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {tradeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                      </div>
                      <div className="space-y-4">
                        {tradeDistribution.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">{item.value} trades</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-secondary">${item.profit.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Profit</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="chains" className="space-y-6">
              {/* Chain Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <Layers className="w-5 h-5 text-secondary" />
                      </div>
                      <CardTitle className="text-xl">Chain Performance</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {chainPerformance.map((chain, index) => (
                        <div key={chain.chain} className="p-6 rounded-lg border border-border/50 bg-card/50">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{chain.chain}</h3>
                            <Badge variant="outline">{chain.trades} trades</Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Profit</span>
                              <span className="font-semibold text-secondary">${chain.profit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg Profit/Trade</span>
                              <span className="font-semibold">${chain.avgProfit.toFixed(2)}</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span>Performance: Excellent</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Recent Trades Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Recent Trades</CardTitle>
                      </div>
                      <Button variant="outline" size="sm">
                        View All
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Chain</TableHead>
                            <TableHead>Profit</TableHead>
                            <TableHead>ROI</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentTrades.map((trade) => (
                            <TableRow key={trade.id}>
                              <TableCell className="font-mono text-sm">
                                {trade.timestamp.toLocaleTimeString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{trade.chain}</Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-secondary">
                                ${trade.profit.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-primary">
                                {trade.roi}%
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-green-500/30 text-green-500">
                                  {trade.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
