import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { TrendingUp, TrendingDown, Search, ArrowUpRight, BarChart3 } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

interface Market {
  pair: string
  base: string
  quote: string
  price: number
  change24h: number
  volume24h: number
  liquidity: number
  chain: "ethereum" | "stacks"
  dex: string
}

const markets: Market[] = [
  {
    pair: "STX/USDCx",
    base: "STX",
    quote: "USDCx",
    price: 1.50,
    change24h: 2.5,
    volume24h: 1250000,
    liquidity: 5000000,
    chain: "stacks",
    dex: "ALEX"
  },
  {
    pair: "USDCx/USDC",
    base: "USDCx",
    quote: "USDC",
    price: 1.001,
    change24h: 0.1,
    volume24h: 2500000,
    liquidity: 10000000,
    chain: "stacks",
    dex: "ALEX"
  },
  {
    pair: "ETH/USDC",
    base: "ETH",
    quote: "USDC",
    price: 2500.0,
    change24h: -1.2,
    volume24h: 5000000,
    liquidity: 25000000,
    chain: "ethereum",
    dex: "Uniswap V3"
  },
  {
    pair: "USDC/ETH",
    base: "USDC",
    quote: "ETH",
    price: 0.0004,
    change24h: 1.2,
    volume24h: 4500000,
    liquidity: 20000000,
    chain: "ethereum",
    dex: "Curve"
  },
  {
    pair: "STX/ETH",
    base: "STX",
    quote: "ETH",
    price: 0.0006,
    change24h: 3.1,
    volume24h: 750000,
    liquidity: 3000000,
    chain: "stacks",
    dex: "Arkadiko"
  },
  {
    pair: "USDCx/STX",
    base: "USDCx",
    quote: "STX",
    price: 0.6667,
    change24h: -2.5,
    volume24h: 1800000,
    liquidity: 8000000,
    chain: "stacks",
    dex: "ALEX"
  }
]

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterChain, setFilterChain] = useState<"all" | "ethereum" | "stacks">("all")

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.quote.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChain = filterChain === "all" || market.chain === filterChain
    return matchesSearch && matchesChain
  })

  const totalVolume24h = markets.reduce((sum, m) => sum + m.volume24h, 0)
  const totalLiquidity = markets.reduce((sum, m) => sum + m.liquidity, 0)

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
              Markets
            </h1>
            <p className="text-muted-foreground">
              Explore trading pairs across chains
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Volume (24h)</p>
                    <p className="text-2xl font-bold">${(totalVolume24h / 1000000).toFixed(2)}M</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-brand" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Liquidity</p>
                    <p className="text-2xl font-bold">${(totalLiquidity / 1000000).toFixed(2)}M</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Markets</p>
                    <p className="text-2xl font-bold">{markets.length}</p>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-brand" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-dark/60 border-white/10 backdrop-blur-xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterChain === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterChain("all")}
                  >
                    All Chains
                  </Button>
                  <Button
                    variant={filterChain === "ethereum" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterChain("ethereum")}
                  >
                    Ethereum
                  </Button>
                  <Button
                    variant={filterChain === "stacks" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterChain("stacks")}
                  >
                    Stacks
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markets Table */}
          <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Trading Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pair</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">24h Change</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">24h Volume</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Liquidity</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">DEX</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMarkets.map((market, index) => (
                      <motion.tr
                        key={market.pair}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-dark/40 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold">{market.pair}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {market.chain}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4">
                          <p className="font-semibold">
                            ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </p>
                        </td>
                        <td className="text-right py-4 px-4">
                          <div className={cn(
                            "flex items-center justify-end gap-1",
                            market.change24h >= 0 ? "text-accent" : "text-error"
                          )}>
                            {market.change24h >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {market.change24h >= 0 ? "+" : ""}{market.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4">
                          <p className="text-sm">
                            ${(market.volume24h / 1000).toFixed(0)}K
                          </p>
                        </td>
                        <td className="text-right py-4 px-4">
                          <p className="text-sm">
                            ${(market.liquidity / 1000).toFixed(0)}K
                          </p>
                        </td>
                        <td className="text-center py-4 px-4">
                          <Badge variant="outline" className="text-xs">
                            {market.dex}
                          </Badge>
                        </td>
                        <td className="text-center py-4 px-4">
                          <Link to="/swap">
                            <Button variant="ghost" size="sm" className="gap-2">
                              Trade
                              <ArrowUpRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {filteredMarkets.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No markets found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
