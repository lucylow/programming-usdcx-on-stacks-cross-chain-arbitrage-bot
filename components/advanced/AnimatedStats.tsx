"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import CountUp from "react-countup"
import { TrendingUp, DollarSign, Activity, Target } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Stat {
  icon: React.ReactNode
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  color: string
}

export default function AnimatedStats() {
  const [stats, setStats] = useState<Stat[]>([
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: "Total Profit",
      value: 127432,
      prefix: "$",
      decimals: 0,
      color: "text-success",
    },
    {
      icon: <Activity className="w-6 h-6" />,
      label: "Trades Executed",
      value: 2341,
      decimals: 0,
      color: "text-accent",
    },
    {
      icon: <Target className="w-6 h-6" />,
      label: "Success Rate",
      value: 98.5,
      suffix: "%",
      decimals: 1,
      color: "text-success",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: "Avg ROI",
      value: 1.8,
      suffix: "%",
      decimals: 2,
      color: "text-accent",
    },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) =>
        prev.map((stat) => ({
          ...stat,
          value: stat.value + Math.random() * 10,
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-card-bg border-white/10 p-6 hover:border-brand/50 transition-colors">
            <div className={`flex items-center justify-center mb-3 ${stat.color}`}>{stat.icon}</div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${stat.color}`}>
                <CountUp
                  start={stat.value * 0.9}
                  end={stat.value}
                  duration={2}
                  decimals={stat.decimals}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
