"use client"

import { useMockTransactions } from "@/hooks/useMockTransactions"
import { StatusPill } from "./StatusPill"
import { PrivacyScoreChip } from "./PrivacyScoreChip"
import type { TxStatus } from "@/lib/mock/types"
import { mockUsers } from "@/lib/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search, RefreshCw, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react"

const statusOptions: (TxStatus | "all")[] = ["all", "completed", "pending", "failed"]
const directionOptions = ["all", "deposit", "withdraw", "internal"] as const

export function MockTransactionsTable() {
  const { data, page, pageSize, total, loading, error, filter, setFilter, goToPage, reload } = useMockTransactions()

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
      case "withdraw":
        return <ArrowUpRight className="w-4 h-4 text-red-400" />
      default:
        return <ArrowLeftRight className="w-4 h-4 text-blue-400" />
    }
  }

  return (
    <Card className="w-full bg-dark border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">USDCx Transactions</h2>
            <p className="text-sm text-muted-foreground mt-1">Mock data demo with filters and pagination</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="bg-darker border border-white/10 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-brand"
              value={filter.status ?? "all"}
              onChange={(e) => setFilter({ status: e.target.value as TxStatus | "all" })}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>

            <select
              className="bg-darker border border-white/10 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-brand"
              value={filter.direction ?? "all"}
              onChange={(e) => setFilter({ direction: e.target.value as "deposit" | "withdraw" | "internal" | "all" })}
            >
              {directionOptions.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "All Directions" : d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-darker border border-white/10 text-sm pl-9 pr-3 py-2 rounded-lg text-white w-40 focus:outline-none focus:border-brand"
                value={filter.search ?? ""}
                onChange={(e) => setFilter({ search: e.target.value })}
              />
            </div>

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
          Loading transactions...
        </div>
      )}

      {error && <div className="py-8 text-center text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-darker/50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Transaction</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Direction</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Privacy</th>
                  <th className="px-6 py-4 text-right font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((tx) => {
                  const user = mockUsers.find((u) => u.id === tx.userId)
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-white">{tx.id}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">{tx.hash}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user?.avatarUrl || "/placeholder.svg"}
                            alt={user?.name}
                            className="w-8 h-8 rounded-full bg-darker"
                          />
                          <div>
                            <div className="text-white font-medium">{user?.name ?? "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{user?.country ?? "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-white font-medium">
                          ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <div className="text-xs text-muted-foreground">USDCx</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusPill status={tx.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {getDirectionIcon(tx.direction)}
                          <span className="text-muted-foreground capitalize">{tx.direction}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <PrivacyScoreChip score={tx.privacyScore} />
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                        <div className="text-xs">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                      </td>
                    </tr>
                  )
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      No transactions match your filters.
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
