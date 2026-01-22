"use client"

import { useState, useMemo } from "react"
import { Zap, ArrowRight, Clock, TrendingUp, Loader2, Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDapp } from "@/lib/dapp/DappProvider"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { toast } from "sonner"

export function LiveOpportunities() {
  const { opportunities, executeOpportunity, wallet, isLoading } = useDapp()
  const { isSignedIn } = useStacks()
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"spread" | "profit" | "time">("spread")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleExecute = async (id: string) => {
    if (!isSignedIn) {
      toast.error("Please connect your wallet first")
      return
    }

    setExecutingId(id)
    try {
      const success = await executeOpportunity(id)
      if (success) {
        toast.success("Trade execution started!")
      } else {
        toast.error("Failed to execute trade")
      }
    } finally {
      setExecutingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent/20 text-accent border-accent/30"
      case "executing":
        return "bg-brand/20 text-brand border-brand/30"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "expired":
        return "bg-muted/20 text-muted-foreground border-muted/30"
      case "failed":
        return "bg-error/20 text-error border-error/30"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  const filteredAndSortedOpportunities = useMemo(() => {
    let filtered = opportunities

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "spread":
          comparison = a.spread - b.spread
          break
        case "profit":
          comparison = a.expectedProfit - b.expectedProfit
          break
        case "time":
          comparison = new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [opportunities, statusFilter, sortBy, sortOrder])

  const activeOpportunities = opportunities.filter((o) => o.status === "active")

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-brand" />
          <h3 className="text-lg font-semibold">Live Opportunities</h3>
        </div>
        <Badge variant="outline" className="border-accent/30 text-accent">
          {activeOpportunities.length} Active
        </Badge>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] border-white/20 bg-transparent">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="executing">Executing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px] border-white/20 bg-transparent">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spread">Spread</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="time">Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border-white/20 bg-transparent"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {isLoading && opportunities.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-black/20 rounded-lg p-4 border border-white/5">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedOpportunities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No opportunities detected yet</p>
            <p className="text-sm mt-2">The bot is scanning for arbitrage opportunities...</p>
          </div>
        ) : (
          filteredAndSortedOpportunities.slice(0, 10).map((opp) => (
            <div
              key={opp.id}
              className="bg-black/20 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{opp.tokenPair}</span>
                  <Badge className={getStatusColor(opp.status)}>{opp.status}</Badge>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="w-3 h-3" />
                  {new Date(opp.detectedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-black/30 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{opp.sourceDex}</div>
                  <div className="text-sm font-medium">${opp.sourcePrice.toFixed(4)}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-accent" />
                <div className="flex-1 bg-black/30 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{opp.targetDex}</div>
                  <div className="text-sm font-medium">${opp.targetPrice.toFixed(4)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Spread: </span>
                    <span className="text-accent font-medium">{opp.spread.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Profit: </span>
                    <span className="text-accent font-medium">${opp.expectedProfit.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className="font-medium">{(opp.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {opp.status === "active" && (
                  <Button
                    size="sm"
                    onClick={() => handleExecute(opp.id)}
                    disabled={executingId === opp.id || !wallet.connected}
                    className="bg-brand hover:bg-brand-dark"
                  >
                    {executingId === opp.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Execute
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
