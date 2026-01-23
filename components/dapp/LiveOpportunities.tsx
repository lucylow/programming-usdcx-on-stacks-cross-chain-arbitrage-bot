"use client"

import { useState, useMemo } from "react"
import { Zap, ArrowRight, Clock, TrendingUp, Loader2, Filter, ArrowUpDown, Shield, Timer, Eye } from "lucide-react"
import type { ArbitrageOpportunity } from "../../lib/dapp/types"
import { Button } from "../../src/components/ui/button"
import { Card } from "../../src/components/ui/card"
import { Badge } from "../../src/components/ui/badge"
import { Skeleton } from "../../src/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../src/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/ui/select"
import { useDapp } from "../../lib/dapp/DappProvider"
import { useStacks } from "../../lib/stacks/StacksProvider"
import { toast } from "sonner"
import { OpportunityDetailModal } from "./OpportunityDetailModal"

interface LiveOpportunitiesProps {
  embedded?: boolean
}

export function LiveOpportunities({ embedded = false }: LiveOpportunitiesProps) {
  const { opportunities, executeOpportunity, wallet, isLoading } = useDapp()
  const { isSignedIn } = useStacks()
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"spread" | "profit" | "time">("spread")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

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
        setIsDetailModalOpen(false)
      } else {
        toast.error("Failed to execute trade")
      }
    } finally {
      setExecutingId(null)
    }
  }

  const handleViewDetails = (opp: ArbitrageOpportunity) => {
    // Could open a modal or navigate to details page
    console.log("View details for opportunity:", opp)
  }

  // Calculate risk level
  const getRiskLevel = (opp: ArbitrageOpportunity): "low" | "medium" | "high" => {
    if (opp.confidence >= 0.8 && opp.spread >= 1.0) return "low"
    if (opp.confidence >= 0.6 && opp.spread >= 0.5) return "medium"
    return "high"
  }

  // Estimate execution time
  const getEstimatedExecutionTime = (opp: ArbitrageOpportunity): number => {
    return Math.round(
      (opp.tradeSize / 10000) * 2 +
      (opp.sourceChain === "ethereum" ? 15 : 30) +
      (opp.targetChain === "ethereum" ? 15 : 30) +
      180
    )
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
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

  const content = (
    <>
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
          filteredAndSortedOpportunities.slice(0, 10).map((opp) => {
            const riskLevel = getRiskLevel(opp)
            const estimatedTime = getEstimatedExecutionTime(opp)
            const riskColors = {
              low: "bg-green-500/20 text-green-400 border-green-500/30",
              medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
              high: "bg-red-500/20 text-red-400 border-red-500/30",
            }

            return (
              <div
                key={opp.id}
                className="bg-black/20 rounded-lg p-4 border border-white/5 hover:border-white/10 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => handleViewDetails(opp)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{opp.tokenPair}</span>
                    <Badge className={getStatusColor(opp.status)}>{opp.status}</Badge>
                    <Badge className={riskColors[riskLevel]} variant="outline">
                      <Shield className="w-3 h-3 mr-1" />
                      {riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="w-3 h-3" />
                    {new Date(opp.detectedAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-black/30 rounded p-2 text-center">
                    <div className="text-xs text-muted-foreground mb-1 capitalize">{opp.sourceChain}</div>
                    <div className="text-xs text-muted-foreground mb-1">{opp.sourceDex}</div>
                    <div className="text-sm font-medium">${opp.sourcePrice.toFixed(4)}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-accent" />
                  <div className="flex-1 bg-black/30 rounded p-2 text-center">
                    <div className="text-xs text-muted-foreground mb-1 capitalize">{opp.targetChain}</div>
                    <div className="text-xs text-muted-foreground mb-1">{opp.targetDex}</div>
                    <div className="text-sm font-medium">${opp.targetPrice.toFixed(4)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Spread: </span>
                      <span className="text-accent font-medium">{opp.spread.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profit: </span>
                      <span className="text-primary font-semibold">${opp.expectedProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{formatTime(estimatedTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(opp)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                  {opp.status === "active" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExecute(opp.id)
                            }}
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
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!wallet.connected
                          ? "Connect wallet to execute"
                          : executingId === opp.id
                            ? "Executing trade..."
                            : `Execute trade with ${opp.expectedProfit.toFixed(2)} profit`}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onExecute={handleExecute}
        isExecuting={executingId === selectedOpportunity?.id}
      />
    </>
  )

  if (embedded) {
    return <div className="w-full">{content}</div>
  }

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      {content}
    </Card>
  )
}
