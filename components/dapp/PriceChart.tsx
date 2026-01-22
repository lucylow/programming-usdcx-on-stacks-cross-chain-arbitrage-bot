"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card } from "@/components/ui/card"
import { useDapp } from "@/lib/dapp/DappProvider"
import { TrendingUp } from "lucide-react"

interface PriceDataPoint {
  time: string
  ethereum: number
  stacks: number
  spread: number
}

export function PriceChart() {
  const { prices } = useDapp()

  const chartData = useMemo<PriceDataPoint[]>(() => {
    // Generate chart data from recent prices
    const data: PriceDataPoint[] = []
    const now = Date.now()
    
    // Create data points for the last 30 minutes (one per minute)
    for (let i = 29; i >= 0; i--) {
      const timestamp = now - i * 60 * 1000
      const ethPrice = prices.find((p) => p.chain === "ethereum")?.price || 1
      const stxPrice = prices.find((p) => p.chain === "stacks")?.price || 1
      const spread = Math.abs(((ethPrice - stxPrice) / ethPrice) * 100)
      
      data.push({
        time: new Date(timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        ethereum: ethPrice,
        stacks: stxPrice,
        spread: spread,
      })
    }
    
    return data
  }, [prices])

  const formatPrice = (value: number) => `$${value.toFixed(4)}`
  const formatSpread = (value: number) => `${value.toFixed(2)}%`

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-brand" />
        <h3 className="text-lg font-semibold">Price History (30 min)</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: "12px" }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: "12px" }}
            tickFormatter={formatPrice}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "spread") return [formatSpread(value), "Spread"]
              return [formatPrice(value), name === "ethereum" ? "Ethereum" : "Stacks"]
            }}
          />
          <Legend 
            wrapperStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(value) => {
              if (value === "ethereum") return "Ethereum"
              if (value === "stacks") return "Stacks"
              return "Spread"
            }}
          />
          <Line
            type="monotone"
            dataKey="ethereum"
            stroke="hsl(var(--ethereum))"
            strokeWidth={2}
            dot={false}
            name="ethereum"
          />
          <Line
            type="monotone"
            dataKey="stacks"
            stroke="hsl(var(--stacks))"
            strokeWidth={2}
            dot={false}
            name="stacks"
          />
          <Line
            type="monotone"
            dataKey="spread"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="spread"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}


