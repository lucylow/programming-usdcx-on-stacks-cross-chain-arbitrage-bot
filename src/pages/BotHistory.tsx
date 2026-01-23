import { Card } from "../components/ui/card"
import { FileText, Filter, Download, Calendar, TrendingUp, TrendingDown, Search } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { Button } from "../components/ui/button"
import { EmptyState } from "../components/ui/empty-state"
import { Input } from "../components/ui/input"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

export default function BotHistory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const trades: any[] = [] // Will be populated from API

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-bold">Trading History</h1>
              </div>
              <p className="text-muted-foreground max-w-3xl">
                Complete history of all arbitrage trades executed by the bot. Review past performance, analyze patterns,
                and optimize your trading strategy.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Trades List */}
          {trades.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No trading history yet"
              description="Your completed trades will appear here once the bot starts executing arbitrage opportunities. Start the bot and connect your wallet to begin trading."
              action={{
                label: "Go to Dashboard",
                onClick: () => window.location.href = "/bot/dashboard",
              }}
              secondaryAction={{
                label: "View Opportunities",
                onClick: () => window.location.href = "/bot/opportunities",
              }}
            />
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => (
                <Card key={trade.id} className="bg-card/50 border-border p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${trade.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {trade.status === 'success' ? (
                          <TrendingUp className={`w-5 h-5 ${trade.status === 'success' ? 'text-green-500' : 'text-red-500'}`} />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Trade #{trade.id}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(trade.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ROI: {(trade.roi * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
