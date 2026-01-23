"use client"

import { FileText, Download, Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { RecentTrades } from "@/components/dapp/RecentTrades"
import { WalletStatus } from "@/components/dapp/WalletStatus"
import { useDapp } from "@/lib/dapp/DappProvider"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function BotHistoryPage() {
  const { recentTrades, performance } = useDapp()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-darker text-white">
        <Navigation />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="pt-24 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-brand" />
                <div>
                  <h1 className="text-4xl font-bold">Trading History</h1>
                  <p className="text-muted-foreground mt-2">
                    Review all executed trades, their outcomes, and performance metrics
                  </p>
                </div>
              </div>
              <Button variant="outline" className="border-white/20 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-card-bg border-white/10 p-6">
                <div className="text-sm text-muted-foreground mb-2">Total Trades</div>
                <div className="text-2xl font-bold">{recentTrades.length}</div>
              </Card>
              <Card className="bg-card-bg border-white/10 p-6">
                <div className="text-sm text-muted-foreground mb-2">Total Profit</div>
                <div className="text-2xl font-bold text-accent">
                  ${((performance?.totalProfit || 0) / 1000).toFixed(1)}K
                </div>
              </Card>
              <Card className="bg-card-bg border-white/10 p-6">
                <div className="text-sm text-muted-foreground mb-2">Success Rate</div>
                <div className="text-2xl font-bold text-accent">
                  {recentTrades.length > 0
                    ? ((recentTrades.filter((t) => t.status === "success").length / recentTrades.length) * 100).toFixed(1)
                    : 0}
                  %
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <WalletStatus />
              <RecentTrades />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
