import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { BarChart3, TrendingUp, Shield, Activity, DollarSign, Clock, ArrowUpRight, Target } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"

export default function Analytics() {
  const isLoading = false;
  const performance = { totalProfit: 12500, totalTrades: 156, profitChange: 12.5 };
  const botStatus = { winRate: 0.87 };

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
                  Analytics Overview
                </h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive performance insights
                </p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-3xl text-lg">
              Comprehensive performance metrics and analytics for your arbitrage bot operations.
            </p>
          </motion.div>

          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${metric.bgGradient} ${metric.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <metric.icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-secondary font-medium">
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                    {isLoading ? (
                      <div className="text-3xl font-bold">...</div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold mb-1">{metric.value}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{metric.label}</span>
                          <span className="text-xs text-muted-foreground/70">{metric.change}</span>
                        </div>
                        <div className="text-sm text-muted-foreground/60 mt-2">{metric.description}</div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Analytics Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">Performance Trends</CardTitle>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      <Target className="w-3 h-3 mr-1" />
                      Insights
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground leading-relaxed">
                    Track your bot's performance over time with detailed charts and metrics. Analyze patterns and optimize
                    your strategy for maximum profitability.
                  </p>
                  <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span>Advanced analytics coming soon</span>
                    </div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <Shield className="w-5 h-5 text-secondary" />
                      </div>
                      <CardTitle className="text-xl">Risk Metrics</CardTitle>
                    </div>
                    <Badge variant="outline" className="border-secondary/30 text-secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      Safety
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground leading-relaxed">
                    Monitor risk exposure, drawdown periods, and safety metrics to ensure sustainable trading operations
                    and protect your capital.
                  </p>
                  <div className="mt-6 p-4 rounded-lg bg-secondary/5 border border-secondary/10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-secondary" />
                      <span>Risk analysis tools coming soon</span>
                    </div>
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


