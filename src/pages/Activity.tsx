import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Search, ExternalLink, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  type: "swap" | "bridge" | "arbitrage" | "deposit" | "withdraw"
  status: "pending" | "completed" | "failed"
  fromToken: string
  toToken: string
  amount: number
  value: number
  chain: "ethereum" | "stacks"
  timestamp: Date
  txHash: string
  fee: number
}

const transactions: Transaction[] = [
  {
    id: "1",
    type: "arbitrage",
    status: "completed",
    fromToken: "USDC",
    toToken: "USDCx",
    amount: 1000,
    value: 1000,
    chain: "stacks",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    txHash: "0x1234...5678",
    fee: 0.5
  },
  {
    id: "2",
    type: "swap",
    status: "completed",
    fromToken: "STX",
    toToken: "USDCx",
    amount: 500,
    value: 750,
    chain: "stacks",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    txHash: "0xabcd...efgh",
    fee: 0.3
  },
  {
    id: "3",
    type: "bridge",
    status: "pending",
    fromToken: "USDC",
    toToken: "USDCx",
    amount: 2000,
    value: 2000,
    chain: "ethereum",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    txHash: "0x9876...5432",
    fee: 1.0
  },
  {
    id: "4",
    type: "arbitrage",
    status: "completed",
    fromToken: "USDCx",
    toToken: "USDC",
    amount: 1500,
    value: 1500,
    chain: "ethereum",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    txHash: "0x1111...2222",
    fee: 0.8
  },
  {
    id: "5",
    type: "swap",
    status: "failed",
    fromToken: "ETH",
    toToken: "USDC",
    amount: 1,
    value: 2500,
    chain: "ethereum",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    txHash: "0x3333...4444",
    fee: 0.0
  }
]

export default function Activity() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | Transaction["type"]>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | Transaction["status"]>("all")

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.fromToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.toToken.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || tx.type === filterType
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-accent" />
      case "pending":
        return <Loader2 className="w-4 h-4 text-brand animate-spin" />
      case "failed":
        return <XCircle className="w-4 h-4 text-error" />
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent/20 text-accent border-accent/30">Completed</Badge>
      case "pending":
        return <Badge className="bg-brand/20 text-brand border-brand/30">Pending</Badge>
      case "failed":
        return <Badge className="bg-error/20 text-error border-error/30">Failed</Badge>
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-darker via-dark to-darker">
      <Navigation />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent mb-2">
              Activity
            </h1>
            <p className="text-muted-foreground">
              View your transaction history
            </p>
          </div>

          {/* Filters */}
          <Card className="bg-dark/60 border-white/10 backdrop-blur-xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by hash, token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground self-center">Type:</span>
                    <Button
                      variant={filterType === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterType === "swap" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("swap")}
                    >
                      Swap
                    </Button>
                    <Button
                      variant={filterType === "bridge" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("bridge")}
                    >
                      Bridge
                    </Button>
                    <Button
                      variant={filterType === "arbitrage" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("arbitrage")}
                    >
                      Arbitrage
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground self-center">Status:</span>
                    <Button
                      variant={filterStatus === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("completed")}
                    >
                      Completed
                    </Button>
                    <Button
                      variant={filterStatus === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={filterStatus === "failed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("failed")}
                    >
                      Failed
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <div className="space-y-4">
            {filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-dark/60 border-white/10 backdrop-blur-xl hover:border-brand/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          tx.type === "arbitrage" ? "bg-brand/20" :
                          tx.type === "swap" ? "bg-accent/20" :
                          "bg-muted/20"
                        )}>
                          {tx.type === "arbitrage" ? (
                            <ArrowUpRight className="w-6 h-6 text-brand" />
                          ) : tx.type === "bridge" ? (
                            <ArrowDownRight className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <ArrowUpRight className="w-6 h-6 text-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold capitalize">{tx.type}</h4>
                            {getStatusBadge(tx.status)}
                            <Badge variant="outline" className="text-xs">
                              {tx.chain}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span>{tx.amount} {tx.fromToken}</span>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>{tx.amount} {tx.toToken}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(tx.timestamp)}
                            </div>
                            <span className="font-mono">{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}</span>
                            {tx.fee > 0 && (
                              <span>Fee: {tx.fee} {tx.chain === "stacks" ? "STX" : "ETH"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">${tx.value.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Value</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredTransactions.length === 0 && (
              <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No transactions found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
