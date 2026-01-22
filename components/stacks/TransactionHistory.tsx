"use client"

import { useState } from "react"
import { Clock, CheckCircle2, XCircle, ExternalLink, Copy, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStacksTransactions } from "@/lib/stacks/hooks"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export function TransactionHistory() {
  const { transactions, pendingTransactions, successfulTransactions, failedTransactions } = useStacksTransactions()
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "success" | "failed">("all")

  const getFilteredTransactions = () => {
    switch (filter) {
      case "pending":
        return pendingTransactions
      case "success":
        return successfulTransactions
      case "failed":
        return failedTransactions
      default:
        return transactions
    }
  }

  const copyTxId = (txId: string) => {
    navigator.clipboard.writeText(txId)
    setCopiedTxId(txId)
    setTimeout(() => setCopiedTxId(null), 2000)
    toast.success("Transaction ID copied")
  }

  const formatTxId = (txId: string) => {
    return `${txId.slice(0, 8)}...${txId.slice(-8)}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "failed":
      case "abort_by_response":
      case "abort_by_post_condition":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-500"
      case "failed":
      case "abort_by_response":
      case "abort_by_post_condition":
        return "text-red-500"
      default:
        return "text-yellow-500"
    }
  }

  const filteredTxs = getFilteredTransactions()

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            All ({transactions.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className="text-xs"
          >
            Pending ({pendingTransactions.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "success" ? "default" : "outline"}
            onClick={() => setFilter("success")}
            className="text-xs"
          >
            Success ({successfulTransactions.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "failed" ? "default" : "outline"}
            onClick={() => setFilter("failed")}
            className="text-xs"
          >
            Failed ({failedTransactions.length})
          </Button>
        </div>
      </div>

      {filteredTxs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTxs.map((tx) => (
            <div
              key={tx.txId}
              className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(tx.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getStatusColor(tx.status)} capitalize`}>
                      {tx.status}
                    </span>
                    {tx.type && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-white/5 rounded">
                        {tx.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-muted-foreground">{formatTxId(tx.txId)}</span>
                    <button
                      onClick={() => copyTxId(tx.txId)}
                      className="hover:text-brand transition-colors"
                      title="Copy transaction ID"
                    >
                      {copiedTxId === tx.txId ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <a
                      href={`https://explorer.hiro.so/txid/${tx.txId}?chain=testnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                    {tx.blockHeight && ` • Block ${tx.blockHeight}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

