import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { BarChart3, TrendingUp, DollarSign, Activity, ArrowUpRight, Zap, Clock, Sparkles, AlertCircle, Play, Pause, RefreshCw, TrendingDown, ExternalLink, Settings, Bell } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

// Import providers - they may not be available in all environments
// Using @ts-ignore to suppress TypeScript errors if providers aren't in the expected location
// @ts-ignore
import { useDapp } from "../../lib/dapp/DappProvider"
// @ts-ignore
import { useStacks } from "../../lib/stacks/StacksProvider"

export default function BotDashboard() {
  // Try to use DappProvider, fallback to mock data if not available
  let dappData: any = null
  let stacksData: any = null
  
  try {
    // @ts-ignore
    dappData = useDapp?.()
  } catch {
    // DappProvider not available, use mock data
  }
  
  try {
    // @ts-ignore
    stacksData = useStacks?.()
  } catch {
    // StacksProvider not available
  }

  const [currentTime, setCurrentTime] = useState(new Date())
  const [isToggling, setIsToggling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Use real data if available, otherwise fallback to mock
  const botStatus = dappData?.botStatus || { 
    running: false, 
    activeTrades: 0, 
    queueLength: 0, 
    opportunitiesDetected: 0, 
    tradesExecuted: 0, 
    totalProfit: 12500, 
    winRate: 0.87, 
    avgProfit: 27.79, 
    uptime: 86400 
  }
  
  const performance = dappData?.performance || { 
    period: "daily" as const,
    totalTrades: 156, 
    profitableTrades: 135,
    totalVolume: 450000,
    totalProfit: 12500, 
    avgProfitPerTrade: 27.79,
    maxProfit: 125.50,
    maxLoss: -25.00,
    sharpeRatio: 1.56,
    winRate: 0.78
  }
  
  const opportunities = dappData?.opportunities || []
  const recentTrades = dappData?.recentTrades || []
  const isLoading = dappData?.isLoading || false
  const wallet = dappData?.wallet || { connected: false, address: null, network: "testnet" as const, chain: "stacks" as const, stxBalance: 0, usdcxBalance: 0 }
  const isSignedIn = stacksData?.isSignedIn || false

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    if (!dappData) return
    const interval = setInterval(() => {
      dappData.refreshAll()
    }, 10000)
    return () => clearInterval(interval)
  }, [dappData])

  const handleToggleBot = async () => {
    if (!dappData) {
      toast.error("Bot controls not available")
      return
    }
    
    if (!isSignedIn) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsToggling(true)
    try {
      if (botStatus.running) {
        const success = await dappData.stopBot()
        if (success) {
          toast.success("Bot stopped successfully")
        } else {
          toast.error("Failed to stop bot")
        }
      } else {
        const success = await dappData.startBot()
        if (success) {
          toast.success("Bot started successfully")
        } else {
          toast.error("Failed to start bot")
        }
      }
    } finally {
      setIsToggling(false)
    }
  }

  const handleRefresh = async () => {
    if (!dappData) {
      toast.info("Using mock data")
      return
    }
    setIsRefreshing(true)
    try {
      await dappData.refreshAll()
      toast.success("Data refreshed")
    } catch (error) {
      toast.error("Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Top opportunities (sorted by expected profit)
  const topOpportunities = useMemo(() => {
    return opportunities
      .filter(o => o.status === "active")
      .sort((a, b) => b.expectedProfit - a.expectedProfit)
      .slice(0, 3)
  }, [opportunities])

  // Recent successful trades
  const recentSuccessfulTrades = useMemo(() => {
    return recentTrades
      .filter(t => t.status === "success")
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
  }, [recentTrades])

  const statCards = [
    {
      icon: DollarSign,
      label: "Total Profit",
      value: `$${((performance?.totalProfit || 0) / 1000).toFixed(1)}K`,
      change: `+${((performance?.totalProfit || 0) / (performance?.totalProfit || 1) * 100).toFixed(1)}%`,
      trend: "up",
      color: "text-green-500",
      bgGradient: "from-green-500/20 to-green-500/5",
      subtitle: `Avg: $${performance?.avgProfitPerTrade?.toFixed(2) || 0}`,
    },
    {
      icon: Activity,
      label: "Total Trades",
      value: performance?.totalTrades || 0,
      change: `${performance?.profitableTrades || 0} profitable`,
      trend: "up",
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
      subtitle: `${((performance?.winRate || 0) * 100).toFixed(1)}% win rate`,
    },
    {
      icon: TrendingUp,
      label: "Win Rate",
      value: `${((performance?.winRate || 0) * 100).toFixed(1)}%`,
      change: `${performance?.profitableTrades || 0}/${performance?.totalTrades || 0} wins`,
      trend: "up",
      color: "text-secondary",
      bgGradient: "from-secondary/20 to-secondary/5",
      subtitle: `Sharpe: ${performance?.sharpeRatio?.toFixed(2) || 0}`,
    },
    {
      icon: BarChart3,
      label: "Status",
      value: botStatus?.running ? "Active" : "Inactive",
      change: botStatus?.running ? `${botStatus.activeTrades} active trades` : "Stopped",
      trend: botStatus?.running ? "up" : "neutral",
      color: botStatus?.running ? "text-green-500" : "text-muted-foreground",
      bgGradient: botStatus?.running ? "from-green-500/20 to-green-500/5" : "from-muted/20 to-muted/5",
      subtitle: botStatus?.running ? `${Math.floor((botStatus.uptime || 0) / 3600)}h uptime` : "Connect wallet to start",
    },
  ]

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
                    Bot Dashboard
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-muted-foreground">
                      Real-time monitoring and control
                    </p>
                    {botStatus?.running && (
                      <Badge variant="outline" className="border-green-500/30 text-green-500 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                        Live
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    Refresh
                  </Button>
                </motion.div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 border border-border/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground max-w-3xl text-base sm:text-lg leading-relaxed">
              Monitor and control your arbitrage bot in real-time. View performance metrics, active opportunities, and
              trading history.
            </p>
          </motion.div>

          {/* Bot Control Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="relative p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={cn(
                        "w-4 h-4 rounded-full",
                        botStatus?.running ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                      )}
                      animate={botStatus?.running ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold">
                        Bot Status: {botStatus?.running ? "Running" : "Stopped"}
                      </h3>
                      {botStatus?.running && (
                        <p className="text-sm text-muted-foreground">
                          Uptime: {formatUptime(botStatus.uptime || 0)} • {botStatus.activeTrades} active trades
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSignedIn && (
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Wallet not connected
                      </Badge>
                    )}
                    <Button
                      onClick={handleToggleBot}
                      disabled={isToggling || !isSignedIn}
                      className={cn(
                        "gap-2",
                        botStatus?.running 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "bg-green-500 hover:bg-green-600 text-white"
                      )}
                    >
                      {isToggling ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : botStatus?.running ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {botStatus?.running ? "Stop Bot" : "Start Bot"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 cursor-pointer">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", stat.bgGradient)} />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className={cn("p-2.5 sm:p-3 rounded-xl shadow-lg", stat.bgGradient, stat.color, "opacity-80 group-hover:opacity-100 transition-all duration-300")}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                      {stat.trend === "up" && (
                        <motion.div 
                          className="flex items-center gap-1 text-xs text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          <ArrowUpRight className="w-3 h-3" />
                        </motion.div>
                      )}
                    </div>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-9 w-24 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          {stat.value}
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <span className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</span>
                          <span className="text-xs text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded-full">
                            {stat.change}
                          </span>
                        </div>
                        {stat.subtitle && (
                          <p className="text-xs text-muted-foreground/60 mt-1">{stat.subtitle}</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Live Opportunities - Takes 2 columns */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -4 }}
              className="lg:col-span-2"
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Zap className="w-5 h-5 text-primary" />
                      </motion.div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Live Opportunities</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {opportunities.filter(o => o.status === "active").length} active opportunities
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI-Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {isLoading && opportunities.length === 0 ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : topOpportunities.length > 0 ? (
                    <div className="space-y-3">
                      {topOpportunities.map((opp, index) => (
                        <motion.div
                          key={opp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-lg border border-border/50 bg-card/50 hover:border-primary/50 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {opp.tokenPair}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {opp.sourceChain} → {opp.targetChain}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Spread: </span>
                                  <span className="font-semibold text-green-500">{(opp.spread * 100).toFixed(2)}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Profit: </span>
                                  <span className="font-semibold text-primary">${opp.expectedProfit.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className={cn(
                              "text-xs",
                              opp.confidence > 0.8 ? "bg-green-500/20 text-green-500" :
                              opp.confidence > 0.6 ? "bg-yellow-500/20 text-yellow-500" :
                              "bg-muted/20 text-muted-foreground"
                            )}>
                              {Math.round(opp.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                      <Link to="/bot/opportunities">
                        <motion.div
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link mt-4 cursor-pointer"
                          whileHover={{ x: 4 }}
                        >
                          View all opportunities
                          <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                        </motion.div>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
                      <motion.div 
                        className="relative mb-6"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                          <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                        </div>
                      </motion.div>
                      <h3 className="text-lg font-semibold mb-2">No Opportunities Detected</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-2 max-w-sm">
                        Real-time arbitrage opportunities will appear here as they are detected
                      </p>
                      <p className="text-xs text-muted-foreground/70 mb-6">
                        The bot is actively scanning Ethereum ↔ Stacks networks
                      </p>
                      <motion.a
                        href="/bot/opportunities"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
                        whileHover={{ x: 4 }}
                      >
                        View all opportunities
                        <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                      </motion.a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Trades - Takes 1 column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/20 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Activity className="w-5 h-5 text-secondary" />
                      </motion.div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Recent Trades</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {recentTrades.length} total trades
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-secondary/30 text-secondary text-xs">
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {isLoading && recentTrades.length === 0 ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : recentSuccessfulTrades.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {recentSuccessfulTrades.map((trade, index) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-lg border border-border/50 bg-card/50 hover:border-green-500/50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-mono text-muted-foreground">
                                {trade.id.slice(0, 8)}...
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(trade.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-green-500">
                                +${trade.profit.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ROI: {(trade.roi * 100).toFixed(2)}%
                              </div>
                            </div>
                            {trade.txHashes?.source && (
                              <a
                                href={`https://explorer.hiro.so/txid/${trade.txHashes.source}?chain=testnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      <Link to="/bot/history">
                        <motion.div
                          className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group/link mt-4 cursor-pointer"
                          whileHover={{ x: 4 }}
                        >
                          View full history
                          <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                        </motion.div>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
                      <motion.div 
                        className="relative mb-6"
                        animate={{ 
                          y: [0, -8, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl" />
                        <div className="relative p-5 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20">
                          <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-secondary" />
                        </div>
                      </motion.div>
                      <h3 className="text-lg font-semibold mb-2">No Recent Trades</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-2 max-w-sm">
                        Your completed trades will be displayed here once the bot starts executing
                      </p>
                      <p className="text-xs text-muted-foreground/70 mb-6">
                        Connect your wallet and start the bot to begin trading
                      </p>
                      <Link to="/bot/history">
                        <motion.div
                          className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group/link cursor-pointer"
                          whileHover={{ x: 4 }}
                        >
                          View full history
                          <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                        </motion.div>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Total Volume</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    ${((performance?.totalVolume || 0) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Across {performance?.totalTrades || 0} trades
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Best Trade</span>
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    +${performance?.maxProfit?.toFixed(2) || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Worst: ${performance?.maxLoss?.toFixed(2) || 0}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">
                    {performance?.sharpeRatio?.toFixed(2) || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Risk-adjusted returns
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
