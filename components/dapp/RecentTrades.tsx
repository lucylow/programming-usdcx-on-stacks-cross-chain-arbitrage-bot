"use client"

import { ExternalLink, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDapp } from "@/lib/dapp/DappProvider"

export function RecentTrades() {
  const { recentTrades } = useDapp()

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

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {recentTrades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trades executed yet</p>
          </div>
        ) : (
          recentTrades.map((trade) => (
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
