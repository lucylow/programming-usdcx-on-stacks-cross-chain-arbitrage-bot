"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useStacks, Transaction } from "../../../lib/stacks/StacksProvider"
import { formatDistanceToNow } from "date-fns"

interface TransactionHistoryPanelProps {
  maxItems?: number
  showHeader?: boolean
  compact?: boolean
}

export function TransactionHistoryPanel({
  maxItems = 10,
  showHeader = true,
  compact = false,
}: TransactionHistoryPanelProps) {
  const { transactions, network, isSignedIn, refreshBalances, isRefreshing } = useStacks()
  const [isExpanded, setIsExpanded] = useState(true)

  const displayedTransactions = transactions.slice(0, maxItems)
  const pendingCount = transactions.filter((tx) => tx.status === "pending").length

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-warning" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case "failed":
      case "abort_by_response":
      case "abort_by_post_condition":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            Pending
          </Badge>
        )
      case "success":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Success
          </Badge>
        )
      case "failed":
      case "abort_by_response":
      case "abort_by_post_condition":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatTxId = (txId: string) => {
    return `${txId.slice(0, 6)}...${txId.slice(-6)}`
  }

  const openExplorer = (txId: string) => {
    window.open(`https://explorer.hiro.so/txid/${txId}?chain=${network}`, "_blank")
  }

  if (!isSignedIn) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Connect your wallet to view transaction history</p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {displayedTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions yet
          </p>
        ) : (
          displayedTransactions.map((tx) => (
            <motion.div
              key={tx.txId}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(tx.status)}
                <span className="text-xs font-mono">{formatTxId(tx.txId)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => openExplorer(tx.txId)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </motion.div>
          ))
        )}
      </div>
    )
  }

  return (
    <Card className="bg-card border-border">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refreshBalances()}
                disabled={isRefreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {displayedTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your transactions will appear here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {displayedTransactions.map((tx, index) => (
                      <motion.div
                        key={tx.txId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                      >
                        <div className="mt-0.5">{getStatusIcon(tx.status)}</div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm truncate">
                              {formatTxId(tx.txId)}
                            </span>
                            {getStatusBadge(tx.status)}
                          </div>
                          
                          {tx.type && (
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {tx.type}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                            </span>
                            {tx.blockHeight && (
                              <span className="text-muted-foreground/50">
                                • Block #{tx.blockHeight}
                              </span>
                            )}
                          </div>
                          
                          {tx.error && (
                            <p className="text-xs text-destructive mt-1 truncate">
                              {tx.error}
                            </p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openExplorer(tx.txId)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// Skeleton loader for the panel
export function TransactionHistoryPanelSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
