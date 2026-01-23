import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { BarChart3, TrendingUp, DollarSign, Activity, ArrowUpRight, Zap, Clock, Sparkles, AlertCircle } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { EmptyState } from "../../components/ui/empty-state"
import { Badge } from "../components/ui/badge"
import { useState, useEffect } from "react"

export default function BotDashboard() {
  // Mock data for standalone page
  const [isLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const performance = { totalProfit: 12500, totalTrades: 156, profitChange: 12.5 };
  const botStatus = { winRate: 0.87, isActive: true };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statCards = [
    {
      icon: DollarSign,
      label: "Total Profit",
      value: `$${((performance?.totalProfit || 0) / 1000).toFixed(1)}K`,
      change: `+${performance?.profitChange || 0}%`,
      trend: "up",
      color: "text-secondary",
      bgGradient: "from-secondary/20 to-secondary/5",
    },
    {
      icon: Activity,
      label: "Total Trades",
      value: performance?.totalTrades || 0,
      change: "+23 this week",
      trend: "up",
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
    },
    {
      icon: TrendingUp,
      label: "Win Rate",
      value: `${((botStatus?.winRate || 0) * 100).toFixed(1)}%`,
      change: "Excellent",
      trend: "up",
      color: "text-secondary",
      bgGradient: "from-secondary/20 to-secondary/5",
    },
    {
      icon: BarChart3,
      label: "Status",
      value: botStatus?.isActive ? "Active" : "Inactive",
      change: botStatus?.isActive ? "Running" : "Stopped",
      trend: botStatus?.isActive ? "up" : "neutral",
      color: botStatus?.isActive ? "text-secondary" : "text-muted-foreground",
      bgGradient: botStatus?.isActive ? "from-secondary/20 to-secondary/5" : "from-muted/20 to-muted/5",
    },
  ];

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
                    {botStatus?.isActive && (
                      <Badge variant="outline" className="border-secondary/30 text-secondary text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5 animate-pulse" />
                        Live
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 border border-border/50 rounded-lg px-4 py-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
            <p className="text-muted-foreground max-w-3xl text-base sm:text-lg leading-relaxed">
              Monitor and control your arbitrage bot in real-time. View performance metrics, active opportunities, and
              trading history.
            </p>
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
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${stat.bgGradient} ${stat.color} opacity-80 group-hover:opacity-100 transition-all duration-300 shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                      {stat.trend === "up" && (
                        <motion.div 
                          className="flex items-center gap-1 text-xs text-secondary font-medium bg-secondary/10 px-2 py-1 rounded-full"
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
                        <div className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          {stat.value}
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</span>
                          <span className="text-xs text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded-full">
                            {stat.change}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Content Cards */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 h-full cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Zap className="w-5 h-5 text-primary" />
                      </motion.div>
                      <CardTitle className="text-xl font-semibold">Live Opportunities</CardTitle>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI-Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
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
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/20 h-full cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Clock className="w-5 h-5 text-secondary" />
                      </motion.div>
                      <CardTitle className="text-xl font-semibold">Recent Trades</CardTitle>
                    </div>
                    <Badge variant="outline" className="border-secondary/30 text-secondary text-xs">
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
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
                    <motion.a
                      href="/bot/history"
                      className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group/link"
                      whileHover={{ x: 4 }}
                    >
                      View full history
                      <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                    </motion.a>
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
