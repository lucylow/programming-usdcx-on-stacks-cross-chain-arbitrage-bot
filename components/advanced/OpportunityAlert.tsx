"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Opportunity {
  id: string
  direction: "eth_to_stacks" | "stacks_to_eth"
  spread: number
  expectedProfit: number
  timestamp: number
}

export default function OpportunityAlert() {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkOpportunities = setInterval(() => {
      const spread = Math.random() * 3 - 1
      if (spread > 1.2 && !dismissed) {
        setOpportunity({
          id: `opp_${Date.now()}`,
          direction: spread > 0 ? "eth_to_stacks" : "stacks_to_eth",
          spread,
          expectedProfit: spread * 100,
          timestamp: Date.now(),
        })
      }
    }, 10000)

    return () => clearInterval(checkOpportunities)
  }, [dismissed])

  const handleDismiss = () => {
    setDismissed(true)
    setOpportunity(null)
    setTimeout(() => setDismissed(false), 30000)
  }

  return (
    <AnimatePresence>
      {opportunity && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-20 right-4 z-50 w-full max-w-md"
        >
          <Card className="bg-success/10 border-success/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-success">Opportunity Detected!</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(opportunity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Direction</span>
                <span className="font-semibold capitalize">{opportunity.direction.replace("_to_", " → ")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Spread</span>
                <span className="font-semibold text-success">{opportunity.spread.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expected Profit</span>
                <span className="font-semibold text-success">${opportunity.expectedProfit.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="flex-1 bg-success hover:bg-success/80">Execute Trade</Button>
              <Button variant="outline" className="flex-1 border-white/20 bg-transparent" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
