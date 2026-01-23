import { Card } from "../components/ui/card"
import { BarChart3, TrendingUp, Shield, Activity, DollarSign, Clock } from "lucide-react"
import Navigation from "../components/layout/Navigation"

export default function Analytics() {
  const isLoading = false;
  const performance = { totalProfit: 12500, totalTrades: 156 };
  const botStatus = { winRate: 0.87 };

  return (
    <div className="min-h-screen bg-darker text-white">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-8 h-8 text-brand" />
            <h1 className="text-4xl font-bold">Analytics Overview</h1>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Comprehensive performance metrics and analytics for your arbitrage bot operations.
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Total Profit</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : `$${((performance?.totalProfit || 0) / 1000).toFixed(1)}K`}
              </div>
              <div className="text-sm text-muted-foreground mt-2">All-time earnings</div>
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-5 h-5 text-brand" />
                <span className="text-sm text-muted-foreground">Total Trades</span>
              </div>
              <div className="text-3xl font-bold text-white">{isLoading ? "..." : performance?.totalTrades || 0}</div>
              <div className="text-sm text-muted-foreground mt-2">Successful executions</div>
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Win Rate</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : `${((botStatus?.winRate || 0) * 100).toFixed(1)}%`}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Success rate</div>
            </Card>
          </div>

          {/* Additional Analytics Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card-bg/50 border-white/10 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand" />
                Performance Trends
              </h3>
              <p className="text-muted-foreground">
                Track your bot's performance over time with detailed charts and metrics. Analyze patterns and optimize
                your strategy.
              </p>
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand" />
                Risk Metrics
              </h3>
              <p className="text-muted-foreground">
                Monitor risk exposure, drawdown periods, and safety metrics to ensure sustainable trading operations.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


