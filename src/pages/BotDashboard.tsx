import { BotControlPanel } from "@/components/dapp/BotControlPanel"
import { LiveOpportunities } from "@/components/dapp/LiveOpportunities"
import { RecentTrades } from "@/components/dapp/RecentTrades"
import { WalletStatus } from "@/components/dapp/WalletStatus"
import { PriceChart } from "@/components/dapp/PriceChart"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, TrendingUp, DollarSign, Activity } from "lucide-react"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useDapp } from "@/lib/dapp/DappProvider"

export default function BotDashboard() {
  const { performance, botStatus, isLoading } = useDapp()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-darker text-white">
        <Navigation />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-8 h-8 text-brand" />
            <h1 className="text-4xl font-bold">Bot Dashboard</h1>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Monitor and control your arbitrage bot in real-time. View performance metrics, active opportunities, and
            trading history.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Total Profit</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <div className="text-3xl font-bold text-white">
                  ${((performance?.totalProfit || 0) / 1000).toFixed(1)}K
                </div>
              )}
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-5 h-5 text-brand" />
                <span className="text-sm text-muted-foreground">Total Trades</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-white">{performance?.totalTrades || 0}</div>
              )}
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Win Rate</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-white">
                  {((botStatus?.winRate || 0) * 100).toFixed(1)}%
                </div>
              )}
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-5 h-5 text-brand" />
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="text-3xl font-bold text-white">
                  {botStatus?.isActive ? "Active" : "Inactive"}
                </div>
              )}
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <WalletStatus />
            <BotControlPanel />
            <PriceChart />
            <div className="grid lg:grid-cols-2 gap-6">
              <LiveOpportunities />
              <RecentTrades />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

