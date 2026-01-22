"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PriceData {
  chain: "ethereum" | "stacks"
  price: number
  change24h: number
  liquidity: number
  lastUpdate: number
}

export default function LivePriceMonitor() {
  const [prices, setPrices] = useState<Record<string, PriceData>>({
    ethereum: {
      chain: "ethereum",
      price: 1000.25,
      change24h: 0.5,
      liquidity: 5000000,
      lastUpdate: Date.now(),
    },
    stacks: {
      chain: "stacks",
      price: 1015.8,
      change24h: -0.3,
      liquidity: 500000,
      lastUpdate: Date.now(),
    },
  })

  const [spread, setSpread] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        const newEthPrice = 1000 + Math.random() * 30 - 15
        const newStacksPrice = 1015 + Math.random() * 30 - 15

        const newSpread = ((newStacksPrice - newEthPrice) / newEthPrice) * 100
        setSpread(newSpread)

        return {
          ethereum: {
            ...prev.ethereum,
            price: newEthPrice,
            change24h: (Math.random() - 0.5) * 2,
            lastUpdate: Date.now(),
          },
          stacks: {
            ...prev.stacks,
            price: newStacksPrice,
            change24h: (Math.random() - 0.5) * 2,
            lastUpdate: Date.now(),
          },
        }
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Price Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <PriceCard data={prices.ethereum} />
        <PriceCard data={prices.stacks} />
      </div>

      {/* Spread Indicator */}
      <Card className="bg-black/20 border-white/10 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Current Spread</span>
          </div>
          <motion.div
            key={spread}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-6xl font-bold mb-2",
              spread > 1 ? "text-success" : spread < -1 ? "text-error" : "text-accent",
            )}
          >
            {spread.toFixed(2)}%
          </motion.div>
          <div className="text-sm text-muted-foreground">
            {Math.abs(spread) > 1 ? "🎯 Arbitrage Opportunity!" : "⏳ Monitoring..."}
          </div>
        </div>
      </Card>
    </div>
  )
}

function PriceCard({ data }: { data: PriceData }) {
  const isPositive = data.change24h > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "bg-black/20 border-white/10 p-6 border-t-4",
          data.chain === "ethereum" ? "border-t-ethereum" : "border-t-stacks",
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-lg capitalize">{data.chain}</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        <motion.div
          key={data.price}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold mb-3"
        >
          ${data.price.toFixed(2)}
        </motion.div>

        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold",
              isPositive ? "bg-success/20 text-success" : "bg-error/20 text-error",
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}
            {data.change24h.toFixed(2)}%
          </span>

          <div className="text-right">
            <div className="text-xs text-muted-foreground">Liquidity</div>
            <div className="text-sm font-semibold">${(data.liquidity / 1000000).toFixed(2)}M</div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
