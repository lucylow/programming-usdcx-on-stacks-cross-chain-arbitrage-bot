"use client"

import { useMemo, useState } from "react"
import { ExternalLink, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownRight, Filter, ArrowUpDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDapp } from "@/lib/dapp/DappProvider"

export function RecentTrades() {
  const { recentTrades, isLoading } = useDapp()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"profit" | "time" | "roi">("time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const filteredAndSortedTrades = useMemo(() => {
    let filtered = recentTrades

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "profit":
          comparison = a.profit - b.profit
          break
        case "roi":
          comparison = a.roi - b.roi
          break
        case "time":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [recentTrades, statusFilter, sortBy, sortOrder])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-accent" />
      case "failed":
        return <XCircle className="w-4 h-4 text-error" />
      case "pending":
      case "executing":
        return <Clock className="w-4 h-4 text-brand animate-pulse" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-accent/20 text-accent border-accent/30",
      failed: "bg-error/20 text-error border-error/30",
      pending: "bg-brand/20 text-brand border-brand/30",
      executing: "bg-brand/20 text-brand border-brand/30",
    }
    return colors[status] || "bg-muted/20 text-muted-foreground border-muted/30"
  }

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>

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
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="executing">Executing</SelectItem>
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
              <SelectItem value="time">Time</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="roi">ROI</SelectItem>
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

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading && recentTrades.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-black/20 rounded-lg p-4 border border-white/5">
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedTrades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trades executed yet</p>
          </div>
        ) : (
          filteredAndSortedTrades.map((trade) => (
            <div key={trade.id} className="bg-black/20 rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(trade.status)}
                  <span className="font-medium text-sm">{trade.id.slice(0, 12)}...</span>
                  <Badge className={getStatusBadge(trade.status)}>{trade.status}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(trade.timestamp).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Profit</span>
                  <span
                    className={`font-medium flex items-center gap-1 ${
                      trade.profit >= 0 ? "text-accent" : "text-error"
                    }`}
                  >
                    {trade.profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}$
                    {Math.abs(trade.profit).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">ROI</span>
                  <span className={`font-medium ${trade.roi >= 0 ? "text-accent" : "text-error"}`}>
                    {trade.roi >= 0 ? "+" : ""}
                    {trade.roi.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Time</span>
                  <span className="font-medium">{(trade.executionTime / 1000).toFixed(1)}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Fees</span>
                  <span className="font-medium">${(trade.gasCost + trade.bridgeFee).toFixed(2)}</span>
                </div>
              </div>

              {trade.txHashes.source && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-xs">
                  <a
                    href={`https://explorer.hiro.so/txid/${trade.txHashes.source}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-dark flex items-center gap-1"
                  >
                    View TX <ExternalLink className="w-3 h-3" />
                  </a>
                  {trade.error && <span className="text-error">{trade.error}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
