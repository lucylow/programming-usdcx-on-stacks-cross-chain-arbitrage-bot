import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Copy, ExternalLink, RefreshCw, Eye, EyeOff } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

// @ts-ignore
import { useStacks } from "@lib/stacks/StacksProvider"
// @ts-ignore
import { useDapp } from "@lib/dapp/DappProvider"

interface Asset {
  symbol: string
  name: string
  balance: number
  usdValue: number
  change24h: number
  chain: "ethereum" | "stacks"
  icon?: string
}

export default function Portfolio() {
  let stacksData: any = null
  let dappData: any = null
  
  try {
    stacksData = useStacks?.()
  } catch {}
  
  try {
    dappData = useDapp?.()
  } catch {}

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showBalances, setShowBalances] = useState(true)
  const [assets, setAssets] = useState<Asset[]>([
    {
      symbol: "STX",
      name: "Stacks",
      balance: 1250.5,
      usdValue: 1875.75,
      change24h: 2.5,
      chain: "stacks"
    },
    {
      symbol: "USDCx",
      name: "USD Coin (xReserve)",
      balance: 5000.0,
      usdValue: 5000.0,
      change24h: 0.1,
      chain: "stacks"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: 2.5,
      usdValue: 6250.0,
      change24h: -1.2,
      chain: "ethereum"
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: 10000.0,
      usdValue: 10000.0,
      change24h: 0.0,
      chain: "ethereum"
    }
  ])

  const totalValue = assets.reduce((sum, asset) => sum + asset.usdValue, 0)
  const totalChange24h = assets.reduce((sum, asset) => sum + (asset.usdValue * asset.change24h / 100), 0)
  const totalChangePercent = (totalChange24h / totalValue) * 100

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (dappData?.refreshAll) {
      dappData.refreshAll()
    }
    setIsRefreshing(false)
    toast.success("Portfolio refreshed")
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success("Address copied to clipboard")
  }

  const wallet = stacksData?.userSession?.loadUserData?.() || dappData?.wallet || {
    connected: false,
    address: null,
    network: "testnet"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent mb-2">
                Portfolio
              </h1>
              <p className="text-muted-foreground">
                Manage your assets across chains
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className="gap-2"
              >
                {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showBalances ? "Hide" : "Show"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Total Value Card */}
          <Card className="mb-6 bg-dark/60 border-white/10 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl font-bold">
                      {showBalances ? `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
                    </h2>
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      totalChangePercent >= 0 ? "text-accent" : "text-error"
                    )}>
                      {totalChangePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {showBalances ? `${totalChangePercent >= 0 ? "+" : ""}${totalChangePercent.toFixed(2)}%` : "•••"}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    24h change: {showBalances ? `$${totalChange24h >= 0 ? "+" : ""}${totalChange24h.toFixed(2)}` : "•••"}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand/20 to-accent/20 flex items-center justify-center">
                    <Wallet className="w-12 h-12 text-brand" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Info */}
          {wallet.connected && wallet.address && (
            <Card className="mb-6 bg-dark/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Connected Wallet</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyAddress(wallet.address)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assets List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Assets</h3>
            {assets.map((asset, index) => (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-dark/60 border-white/10 backdrop-blur-xl hover:border-brand/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          asset.chain === "stacks" ? "bg-stacks/20" : "bg-ethereum/20"
                        )}>
                          <span className="text-lg font-bold">
                            {asset.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{asset.symbol}</h4>
                            <Badge variant="outline" className="text-xs">
                              {asset.chain}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          <p className="font-semibold">
                            {showBalances ? asset.balance.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "••••"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {showBalances ? `$${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••"}
                          </p>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          asset.change24h >= 0 ? "text-accent" : "text-error"
                        )}>
                          {asset.change24h >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {showBalances ? `${asset.change24h >= 0 ? "+" : ""}${asset.change24h.toFixed(2)}%` : "•••"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/swap">
              <Card className="bg-dark/60 border-white/10 backdrop-blur-xl hover:border-brand/50 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Swap Tokens</h4>
                      <p className="text-sm text-muted-foreground">Exchange assets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/markets">
              <Card className="bg-dark/60 border-white/10 backdrop-blur-xl hover:border-brand/50 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold">View Markets</h4>
                      <p className="text-sm text-muted-foreground">Explore trading pairs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/activity">
              <Card className="bg-dark/60 border-white/10 backdrop-blur-xl hover:border-brand/50 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h4 className="font-semibold">View Activity</h4>
                      <p className="text-sm text-muted-foreground">Transaction history</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
