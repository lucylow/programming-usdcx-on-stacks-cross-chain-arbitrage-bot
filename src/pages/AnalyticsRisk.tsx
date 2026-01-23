import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  FileCode,
  CheckCircle2,
  Info,
  Gauge,
  Lock,
  Settings,
  AlertCircle,
  Download,
  BarChart3,
  XCircle
} from "lucide-react"
import Navigation from "@/components/layout/Navigation"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { RiskAssessmentDashboard } from "@/components/RiskAssessmentDashboard"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts"
import { motion } from "framer-motion"

interface GasPriceData {
  ethereum: number
  stacks: number
  ethereumStatus: "low" | "medium" | "high"
  stacksStatus: "low" | "medium" | "high"
  lastUpdate: number
}

interface SlippageConfig {
  maxSlippage: number
  currentSlippage: number
  protectionActive: boolean
  dynamicAdjustment: boolean
}

interface RiskLimits {
  maxPositionSize: number
  dailyLossLimit: number
  maxConcurrentTrades: number
  currentExposure: number
  remainingBuffer: number
}

interface MultiSigStatus {
  enabled: boolean
  requiredSignatures: number
  totalSigners: number
  pendingApprovals: number
}

interface RiskDataPoint {
  time: string
  riskScore: number
  slippage: number
  liquidity: number
  volatility: number
  gasPrice: number
  drawdown: number
}

interface RiskAlert {
  id: string
  type: "warning" | "danger" | "info"
  message: string
  timestamp: Date
  resolved: boolean
}

export default function AnalyticsRisk() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d")
  const [riskHistory, setRiskHistory] = useState<RiskDataPoint[]>([])
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [currentRiskScore, setCurrentRiskScore] = useState(15)
  const [maxDrawdown, setMaxDrawdown] = useState(2.3)
  const [volatility, setVolatility] = useState(12.5)
  const [safetyMargin, setSafetyMargin] = useState(85)

  const [gasPrices, setGasPrices] = useState<GasPriceData>({
    ethereum: 32,
    stacks: 1.2,
    ethereumStatus: "medium",
    stacksStatus: "low",
    lastUpdate: Date.now()
  })

  const [slippageConfig, setSlippageConfig] = useState<SlippageConfig>({
    maxSlippage: 1.0,
    currentSlippage: 0.45,
    protectionActive: true,
    dynamicAdjustment: true
  })

  const [riskLimits, setRiskLimits] = useState<RiskLimits>({
    maxPositionSize: 10000,
    dailyLossLimit: 2500,
    maxConcurrentTrades: 3,
    currentExposure: 18500,
    remainingBuffer: 6500
  })

  const [multiSigStatus, setMultiSigStatus] = useState<MultiSigStatus>({
    enabled: true,
    requiredSignatures: 2,
    totalSigners: 3,
    pendingApprovals: 0
  })

  // Generate historical risk data
  useEffect(() => {
    const generateHistory = () => {
      const data: RiskDataPoint[] = []
      const now = Date.now()
      const interval = timeRange === "24h" ? 3600000 : timeRange === "7d" ? 86400000 : 86400000
      const count = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30

      for (let i = count; i >= 0; i--) {
        const timestamp = new Date(now - i * interval)
        data.push({
          time: timestamp.toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric",
            ...(timeRange === "24h" && { hour: "numeric" })
          }),
          riskScore: 10 + Math.random() * 20,
          slippage: 0.1 + Math.random() * 0.3,
          liquidity: 70 + Math.random() * 25,
          volatility: 8 + Math.random() * 10,
          gasPrice: 20 + Math.random() * 50,
          drawdown: 1 + Math.random() * 3
        })
      }
      setRiskHistory(data)
    }

    generateHistory()
    const interval = setInterval(() => {
      setRiskHistory(prev => {
        const newPoint: RiskDataPoint = {
          time: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          riskScore: 10 + Math.random() * 20,
          slippage: 0.1 + Math.random() * 0.3,
          liquidity: 70 + Math.random() * 25,
          volatility: 8 + Math.random() * 10,
          gasPrice: 20 + Math.random() * 50,
          drawdown: 1 + Math.random() * 3
        }
        return [...prev.slice(1), newPoint]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [timeRange])

  // Generate risk alerts
  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: RiskAlert[] = [
        {
          id: "1",
          type: "warning",
          message: "Gas price increased by 25% in the last hour",
          timestamp: new Date(Date.now() - 1800000),
          resolved: false
        },
        {
          id: "2",
          type: "info",
          message: "Liquidity pool depth increased on Stacks DEX",
          timestamp: new Date(Date.now() - 3600000),
          resolved: false
        }
      ]
      setAlerts(newAlerts)
    }

    generateAlerts()
  }, [])

  // Update current metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRiskScore(10 + Math.random() * 20)
      setMaxDrawdown(1.5 + Math.random() * 2)
      setVolatility(10 + Math.random() * 8)
      setSafetyMargin(80 + Math.random() * 15)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Simulate real-time gas price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGasPrices(prev => {
        const newEth = Math.max(15, Math.min(150, prev.ethereum + (Math.random() - 0.5) * 5))
        const newStacks = Math.max(0.5, Math.min(5, prev.stacks + (Math.random() - 0.5) * 0.3))
        
        const ethStatus = newEth < 30 ? "low" : newEth < 80 ? "medium" : "high"
        const stacksStatus = newStacks < 2 ? "low" : newStacks < 4 ? "medium" : "high"
        
        return {
          ethereum: Math.round(newEth * 10) / 10,
          stacks: Math.round(newStacks * 100) / 100,
          ethereumStatus: ethStatus,
          stacksStatus: stacksStatus,
          lastUpdate: Date.now()
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Simulate slippage updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSlippageConfig(prev => ({
        ...prev,
        currentSlippage: Math.max(0.1, Math.min(prev.maxSlippage, prev.currentSlippage + (Math.random() - 0.5) * 0.1))
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: "low" | "medium" | "high") => {
    switch (status) {
      case "low": return "text-green-400"
      case "medium": return "text-yellow-400"
      case "high": return "text-red-400"
    }
  }

  const getStatusBadge = (status: "low" | "medium" | "high") => {
    switch (status) {
      case "low": return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Low</Badge>
      case "medium": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Medium</Badge>
      case "high": return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">High</Badge>
    }
  }

  const exposurePercentage = (riskLimits.currentExposure / (riskLimits.maxPositionSize * riskLimits.maxConcurrentTrades)) * 100
  const bufferPercentage = (riskLimits.remainingBuffer / riskLimits.dailyLossLimit) * 100

  const getRiskLevel = (score: number) => {
    if (score < 20) return { label: "Low", color: "text-success", bg: "bg-success/10", border: "border-success/30" }
    if (score < 40) return { label: "Medium", color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" }
    return { label: "High", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" }
  }

  const riskLevel = getRiskLevel(currentRiskScore)

  const chartConfig = {
    riskScore: {
      label: "Risk Score",
      color: "hsl(var(--primary))",
    },
    slippage: {
      label: "Slippage",
      color: "hsl(var(--destructive))",
    },
    liquidity: {
      label: "Liquidity",
      color: "hsl(var(--success))",
    },
    volatility: {
      label: "Volatility",
      color: "hsl(var(--warning))",
    },
    gasPrice: {
      label: "Gas Price",
      color: "hsl(var(--accent))",
    },
    drawdown: {
      label: "Drawdown",
      color: "hsl(var(--destructive))",
    },
  }

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      currentRiskScore,
      maxDrawdown,
      volatility,
      safetyMargin,
      gasPrices,
      slippageConfig,
      riskLimits,
      riskHistory: riskHistory.slice(-10),
      alerts: alerts.filter(a => !a.resolved)
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `risk-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-darker text-white">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-brand" />
              <div>
                <h1 className="text-4xl font-bold">Risk Analysis</h1>
                <p className="text-muted-foreground mt-1 max-w-3xl">
                  Comprehensive risk management metrics and analysis for your arbitrage operations.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Link to="/analytics">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Analytics
                </Button>
              </Link>
            </div>
          </div>

          {/* Risk Alerts */}
          {alerts.filter(a => !a.resolved).length > 0 && (
            <div className="mb-6 space-y-2">
              {alerts.filter(a => !a.resolved).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border ${
                    alert.type === "danger" 
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : alert.type === "warning"
                      ? "bg-warning/10 border-warning/30 text-warning"
                      : "bg-primary/10 border-primary/30 text-primary"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.type === "danger" ? (
                      <XCircle className="w-5 h-5 mt-0.5" />
                    ) : alert.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Risk Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`bg-card-bg/50 border-white/10 p-6 ${riskLevel.border} border-2`}>
                <div className="flex items-center justify-between mb-4">
                  <Shield className="w-5 h-5 text-accent" />
                  <Badge className={riskLevel.bg + " " + riskLevel.color}>
                    {riskLevel.label}
                  </Badge>
                </div>
                <div className={`text-3xl font-bold ${riskLevel.color}`}>
                  {currentRiskScore.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mt-2">Overall Risk Score</div>
                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${riskLevel.bg.replace("/10", "")}`}
                    style={{ width: `${currentRiskScore}%` }}
                  />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card-bg/50 border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <TrendingDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold text-white">{maxDrawdown.toFixed(2)}%</div>
                <div className="text-sm text-muted-foreground mt-2">Max Drawdown</div>
                <div className="text-xs text-success mt-2 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  -0.3% from last period
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card-bg/50 border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-5 h-5 text-accent" />
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold text-white">{volatility.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground mt-2">Volatility (30d avg)</div>
                <div className="text-xs text-warning mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +1.2% from last period
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-card-bg/50 border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-5 h-5 text-brand" />
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <div className="text-3xl font-bold text-success">{safetyMargin.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground mt-2">Safety Margin</div>
                <div className="text-xs text-success mt-2">Within acceptable range</div>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="factors">Risk Factors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Risk Score Trend */}
                <Card className="bg-card-bg/50 border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Risk Score Trend</h3>
                    <div className="flex gap-2">
                      {(["24h", "7d", "30d"] as const).map((range) => (
                        <Button
                          key={range}
                          variant={timeRange === range ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setTimeRange(range)}
                          className="h-7 text-xs"
                        >
                          {range}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <AreaChart data={riskHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="time" 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="riskScore"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </Card>

                {/* Risk Factor Distribution */}
                <Card className="bg-card-bg/50 border-white/10 p-6">
                  <h3 className="text-xl font-semibold mb-4">Risk Factor Distribution</h3>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={[
                      { name: "Slippage", value: slippageConfig.currentSlippage * 100 },
                      { name: "Liquidity", value: 85 },
                      { name: "Volatility", value: volatility },
                      { name: "Bridge", value: 45 },
                      { name: "Gas", value: gasPrices.ethereum }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ChartContainer>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="dashboard">
              <RiskAssessmentDashboard />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="bg-card-bg/50 border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Historical Risk Metrics</h3>
                  <div className="flex gap-2">
                    {(["24h", "7d", "30d"] as const).map((range) => (
                      <Button
                        key={range}
                        variant={timeRange === range ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTimeRange(range)}
                        className="h-7 text-xs"
                      >
                        {range}
                      </Button>
                    ))}
                  </div>
                </div>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <LineChart data={riskHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: "12px" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="riskScore"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="slippage"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="liquidity"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="volatility"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card-bg/50 border-white/10 p-6">
                  <h3 className="text-xl font-semibold mb-4">Gas Price History</h3>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <AreaChart data={riskHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="time" 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="gasPrice"
                        stroke="hsl(var(--accent))"
                        fill="hsl(var(--accent))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </Card>

                <Card className="bg-card-bg/50 border-white/10 p-6">
                  <h3 className="text-xl font-semibold mb-4">Drawdown History</h3>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <AreaChart data={riskHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="time" 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="drawdown"
                        stroke="hsl(var(--destructive))"
                        fill="hsl(var(--destructive))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="factors">

              {/* Risk Factors - Enhanced */}
              <Card className="bg-card-bg/50 border-white/10 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-brand" />
              <h3 className="text-2xl font-semibold">Risk Factors</h3>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {/* Gas Price Volatility */}
              <AccordionItem value="gas-volatility" className="border-b border-white/10">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Gas Price Volatility on Ethereum</span>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          Medium Risk
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Current: {gasPrices.ethereum.toFixed(1)} gwei | Threshold: 100 gwei | Status: {getStatusBadge(gasPrices.ethereumStatus)}
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={Math.min((gasPrices.ethereum / 100) * 100, 100)} className="h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-16 space-y-4">
                    <Alert className="bg-warning/10 border-warning/30">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <AlertTitle className="text-warning">Impact</AlertTitle>
                      <AlertDescription className="text-muted-foreground">
                        Ethereum gas prices can fluctuate dramatically during network congestion, 
                        potentially increasing transaction costs by 5-10x. High gas prices can 
                        eliminate profit margins, especially for smaller arbitrage opportunities. 
                        A sudden spike from 30 gwei to 150 gwei could turn a profitable trade 
                        into a loss.
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand" />
                        Mitigation Strategies
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Real-time gas monitoring:</strong> Continuously track gas prices and pause trading when prices exceed thresholds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Dynamic cost calculation:</strong> Recalculate profitability before execution if gas prices spike</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Gas price limits:</strong> Set maximum acceptable gas price (currently 100 gwei) to prevent unprofitable trades</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Time-based execution:</strong> Prefer executing during low-activity periods when gas prices are typically lower</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Bridge Transaction Delays */}
              <AccordionItem value="bridge-delays" className="border-b border-white/10">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Bridge Transaction Delays</span>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          Medium Risk
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Average: 45s | Max: 120s | Timeout: 30min
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={37.5} className="h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-16 space-y-4">
                    <Alert className="bg-warning/10 border-warning/30">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <AlertTitle className="text-warning">Impact</AlertTitle>
                      <AlertDescription className="text-muted-foreground">
                        Cross-chain bridge operations can experience delays due to network congestion, 
                        validator processing times, or bridge protocol limitations. Delays of 5-30 minutes 
                        are common, during which market prices can move significantly, eroding arbitrage 
                        opportunities. Extended delays (over 30 min) may result in complete opportunity loss.
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand" />
                        Mitigation Strategies
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Bridge status monitoring:</strong> Continuously monitor bridge health and pause trading during outages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Timeout mechanisms:</strong> Automatic cancellation after 30 minutes with refund processing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Price revalidation:</strong> Re-check prices after bridge completion before final swap execution</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Multi-bridge support:</strong> Fallback to alternative bridges if primary bridge is experiencing delays</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Historical delay tracking:</strong> Use past performance data to estimate completion times and adjust strategy</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Market Slippage */}
              <AccordionItem value="market-slippage" className="border-b border-white/10">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Market Slippage During Execution</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Low Risk
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Current: {slippageConfig.currentSlippage.toFixed(2)}% | Max Allowed: {slippageConfig.maxSlippage}% | Threshold: 0.5%
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={Math.min((slippageConfig.currentSlippage / slippageConfig.maxSlippage) * 100, 100)} className="h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-16 space-y-4">
                    <Alert className="bg-success/10 border-success/30">
                      <Info className="h-4 w-4 text-success" />
                      <AlertTitle className="text-success">Impact</AlertTitle>
                      <AlertDescription className="text-muted-foreground">
                        Slippage occurs when the execution price differs from the expected price due to 
                        insufficient liquidity or rapid price movements. While our current slippage is 
                        well-controlled at 0.15%, larger trades or volatile markets can experience 
                        slippage up to 1-2%, significantly reducing profitability or causing losses.
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand" />
                        Mitigation Strategies
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Slippage protection:</strong> Hard limit of 1% maximum slippage per swap with automatic rejection if exceeded</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Pre-execution validation:</strong> Verify prices haven't moved more than 0.5% before executing trades</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Liquidity depth analysis:</strong> Check available liquidity before trade execution to estimate slippage</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Dynamic slippage tolerance:</strong> Adjust slippage limits based on trade size and market conditions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Trade size optimization:</strong> Limit trade sizes to maintain low slippage (optimal: $5,000-$10,000)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Multi-DEX routing:</strong> Split large trades across multiple DEXs to reduce price impact</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Smart Contract Risks */}
              <AccordionItem value="smart-contract" className="border-b-0">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <FileCode className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Smart Contract Risks</span>
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          High Risk
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Audit Status: Audited | Reentrancy Protection: Active
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={20} className="h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-16 space-y-4">
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertTitle className="text-destructive">Impact</AlertTitle>
                      <AlertDescription className="text-muted-foreground">
                        Smart contract vulnerabilities can lead to complete loss of funds. Risks include 
                        reentrancy attacks, integer overflow/underflow, access control issues, and 
                        logic errors. While our contracts use battle-tested libraries and have been 
                        audited, the risk of undiscovered vulnerabilities or exploits in integrated 
                        third-party contracts (DEX routers, bridges) remains a concern.
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand" />
                        Mitigation Strategies
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>OpenZeppelin libraries:</strong> Use battle-tested, audited OpenZeppelin contracts for security-critical functions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Reentrancy guards:</strong> All external calls protected with reentrancy guards to prevent attack vectors</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Access control:</strong> Role-based access control (RBAC) restricts sensitive functions to authorized addresses</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Input validation:</strong> Comprehensive validation of all inputs before contract execution</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Security audits:</strong> Regular third-party security audits and code reviews</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Multi-signature wallets:</strong> Critical operations require multi-sig approval for additional security</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Position limits:</strong> Maximum per-trade limits ($10,000) reduce exposure to potential exploits</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand mt-1">•</span>
                          <span><strong>Circuit breakers:</strong> Automatic trading halt on detection of anomalous behavior or potential exploits</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

              {/* Mitigation Strategies Summary */}
              <Card className="bg-card-bg/50 border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-brand" />
              <h3 className="text-xl font-semibold">Active Mitigation Strategies</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand/10 border border-brand/20">
                  <CheckCircle2 className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">Real-time Gas Price Monitoring</div>
                    <div className="text-xs text-muted-foreground mt-1">Continuously tracks Ethereum gas prices and pauses trading when thresholds are exceeded</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand/10 border border-brand/20">
                  <CheckCircle2 className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">Slippage Protection Mechanisms</div>
                    <div className="text-xs text-muted-foreground mt-1">Hard limits and pre-execution validation prevent excessive slippage</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand/10 border border-brand/20">
                  <CheckCircle2 className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">Automated Risk Limits</div>
                    <div className="text-xs text-muted-foreground mt-1">Position limits, daily exposure caps, and circuit breakers enforce risk boundaries</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand/10 border border-brand/20">
                  <CheckCircle2 className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">Multi-signature Wallet Support</div>
                    <div className="text-xs text-muted-foreground mt-1">Critical operations require multiple approvals for enhanced security</div>
                  </div>
                </div>
              </div>
            </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


