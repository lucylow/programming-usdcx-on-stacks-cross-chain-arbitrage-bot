"use client"

import { useMockOpportunities } from "@/hooks/useMockOpportunities"
import { StatusPill } from "./StatusPill"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RefreshCw, Zap, TrendingUp, Radio } from "lucide-react"

export function OpportunitiesTable() {
  const {
    data,
    page,
    pageSize,
    total,
    loading,
    error,
    filter,
    setFilter,
    goToPage,
    reload,
    realTimeEnabled,
    setRealTimeEnabled,
  } = useMockOpportunities()

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Card className="w-full bg-dark border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand" />
              Arbitrage Opportunities
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Real-time cross-chain arbitrage detection</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="bg-darker border border-white/10 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-brand"
              value={filter.status ?? "all"}
              onChange={(e) =>
                setFilter({ status: e.target.value as "active" | "executing" | "completed" | "expired" | "all" })
              }
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="executing">Executing</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>

            <select
              className="bg-darker border border-white/10 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-brand"
              value={filter.sourceChain ?? "all"}
              onChange={(e) => setFilter({ sourceChain: e.target.value as "ethereum" | "stacks" | "all" })}
            >
              <option value="all">All Chains</option>
              <option value="ethereum">Ethereum</option>
              <option value="stacks">Stacks</option>
            </select>

            <Button
              variant={realTimeEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              className={
                realTimeEnabled ? "bg-brand hover:bg-brand-dark" : "border-white/10 bg-transparent hover:bg-white/5"
              }
            >
              <Radio className={`w-4 h-4 mr-2 ${realTimeEnabled ? "animate-pulse" : ""}`} />
              Live
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              className="border-white/10 bg-transparent hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
          Loading opportunities...
        </div>
      )}

      {error && <div className="py-8 text-center text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-darker/50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Route</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Pair</th>
                  <th className="px-6 py-4 text-right font-medium text-muted-foreground">Spread</th>
                  <th className="px-6 py-4 text-right font-medium text-muted-foreground">Expected Profit</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Confidence</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-right font-medium text-muted-foreground">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((opp) => (
                  <tr key={opp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${opp.sourceChain === "ethereum" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}
                        >
                          {opp.sourceChain.toUpperCase()}
                        </span>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${opp.targetChain === "ethereum" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}
                        >
                          {opp.targetChain.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {opp.sourceDex} → {opp.targetDex}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-white">{opp.tokenPair}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-accent font-semibold">{opp.spread.toFixed(2)}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-emerald-400 font-semibold">${opp.expectedProfit.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-darker rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${opp.confidence >= 0.9 ? "bg-emerald-500" : opp.confidence >= 0.8 ? "bg-blue-500" : "bg-yellow-500"}`}
                            style={{ width: `${opp.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs">{(opp.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusPill status={opp.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {new Date(opp.detectedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      No opportunities match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <span className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-white">{page}</span> of{" "}
              <span className="font-semibold text-white">{pageCount}</span> &bull;{" "}
              <span className="font-semibold text-white">{total}</span> total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="border-white/10 bg-transparent hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= pageCount}
                className="border-white/10 bg-transparent hover:bg-white/5 disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
