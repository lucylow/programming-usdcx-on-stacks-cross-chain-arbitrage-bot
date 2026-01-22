"use client"

import { useState } from "react"
import { Play, Pause, RefreshCw, Activity, Zap, TrendingUp, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDapp } from "@/lib/dapp/DappProvider"
import { toast } from "sonner"

export function BotControlPanel() {
  const { botStatus, wallet, startBot, stopBot, refreshAll, isLoading } = useDapp()
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleBot = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsToggling(true)
    try {
      if (botStatus?.running) {
        const success = await stopBot()
        if (success) {
          toast.success("Bot stopped successfully")
        } else {
          toast.error("Failed to stop bot")
        }
      } else {
        const success = await startBot()
        if (success) {
          toast.success("Bot started successfully")
        } else {
          toast.error("Failed to start bot")
        }
      }
    } finally {
      setIsToggling(false)
    }
  }

  const handleRefresh = async () => {
    await refreshAll()
    toast.success("Data refreshed")
  }

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${botStatus?.running ? "bg-accent animate-pulse" : "bg-muted-foreground"}`}
          />
          <h3 className="text-lg font-semibold">Bot Status: {botStatus?.running ? "Running" : "Stopped"}</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-white/20 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleToggleBot}
            disabled={isToggling || !wallet.connected}
            className={botStatus?.running ? "bg-error hover:bg-error/80" : "bg-accent hover:bg-accent/80"}
          >
            {isToggling ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : botStatus?.running ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {botStatus?.running ? "Stop Bot" : "Start Bot"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Active Trades</span>
          </div>
          <div className="text-2xl font-bold text-white">{botStatus?.activeTrades || 0}</div>
        </div>

        <div className="bg-black/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Opportunities</span>
          </div>
          <div className="text-2xl font-bold text-white">{botStatus?.opportunitiesDetected || 0}</div>
        </div>

        <div className="bg-black/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-accent">{((botStatus?.winRate || 0) * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-black/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Total Profit</span>
          </div>
          <div className="text-2xl font-bold text-accent">
            $
            {(botStatus?.totalProfit || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {!wallet.connected && (
        <div className="mt-4 p-3 bg-brand/10 border border-brand/30 rounded-lg text-sm text-center">
          Connect your Stacks wallet to control the bot and execute trades
        </div>
      )}
    </Card>
  )
}
