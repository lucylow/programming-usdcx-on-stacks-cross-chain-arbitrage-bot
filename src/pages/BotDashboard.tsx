import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { BarChart3, TrendingUp, DollarSign, Activity, ArrowUpRight, Zap, Clock } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { EmptyState } from "../components/ui/empty-state"

export default function BotDashboard() {
  // Mock data for standalone page
  const isLoading = false;
  const performance = { totalProfit: 12500, totalTrades: 156, profitChange: 12.5 };
  const botStatus = { winRate: 0.87, isActive: true };

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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Bot Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Real-time monitoring and control
                </p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-3xl text-lg">
              Monitor and control your arbitrage bot in real-time. View performance metrics, active opportunities, and
              trading history.
            </p>
          </motion.div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.bgGradient} ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      {stat.trend === "up" && (
                        <div className="flex items-center gap-1 text-xs text-secondary font-medium">
                          <ArrowUpRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-9 w-24 mb-2" />
                    ) : (
                      <>
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{stat.label}</span>
                          <span className="text-xs text-muted-foreground/70">{stat.change}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Content Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Live Opportunities</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-primary/10 mb-4">
                      <Zap className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <p className="text-muted-foreground mb-2">Real-time arbitrage opportunities</p>
                    <p className="text-sm text-muted-foreground/70 mb-4">Opportunities will appear here as they are detected</p>
                    <a
                      href="/bot/opportunities"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View all opportunities
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Clock className="w-5 h-5 text-secondary" />
                    </div>
                    <CardTitle className="text-xl">Recent Trades</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-secondary/10 mb-4">
                      <Activity className="w-8 h-8 text-secondary" />
                    </div>
                    <p className="text-muted-foreground mb-2">Your recent trading history</p>
                    <p className="text-sm text-muted-foreground/70 mb-4">Completed trades will be displayed here</p>
                    <a
                      href="/bot/history"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View full history
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
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
