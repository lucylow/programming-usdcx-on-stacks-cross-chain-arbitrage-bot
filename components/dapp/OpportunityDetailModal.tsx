"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../src/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign,
  Activity,
  Shield,
  Timer,
  BarChart3,
  ExternalLink
} from "lucide-react"
import type { ArbitrageOpportunity } from "../../lib/dapp/types"
import { useStacks } from "../../lib/stacks/StacksProvider"
import { toast } from "sonner"

interface OpportunityDetailModalProps {
  opportunity: ArbitrageOpportunity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecute?: (id: string) => Promise<void>
  isExecuting?: boolean
}

export function OpportunityDetailModal({
  opportunity,
  open,
  onOpenChange,
  onExecute,
  isExecuting = false,
}: OpportunityDetailModalProps) {
  const { isSignedIn } = useStacks()

  if (!opportunity) return null

  // Calculate risk level based on confidence and spread
  const getRiskLevel = (): "low" | "medium" | "high" => {
    if (opportunity.confidence >= 0.8 && opportunity.spread >= 1.0) return "low"
    if (opportunity.confidence >= 0.6 && opportunity.spread >= 0.5) return "medium"
    return "high"
  }

  const riskLevel = getRiskLevel()
  const riskColors = {
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  // Estimate execution time (in seconds)
  const estimatedExecutionTime = Math.round(
    (opportunity.tradeSize / 10000) * 2 + // Base time based on trade size
    (opportunity.sourceChain === "ethereum" ? 15 : 30) + // Source chain confirmation
    (opportunity.targetChain === "ethereum" ? 15 : 30) + // Target chain confirmation
    180 // Bridge time (average)
  )

  const handleExecute = async () => {
    if (!isSignedIn) {
      toast.error("Please connect your wallet first")
      return
    }
    if (onExecute) {
      await onExecute(opportunity.id)
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const roiPercentage = opportunity.tradeSize > 0 ? (opportunity.expectedProfit / opportunity.tradeSize) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{opportunity.tokenPair}</DialogTitle>
                <DialogDescription className="mt-1">
                  Arbitrage opportunity detected at {new Date(opportunity.detectedAt).toLocaleString()}
                </DialogDescription>
              </div>
            </div>
            <Badge className={riskColors[riskLevel]}>{riskLevel.toUpperCase()} RISK</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Profit Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Expected Profit</span>
              </div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(opportunity.expectedProfit)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {roiPercentage.toFixed(2)}% ROI
              </div>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Spread</span>
              </div>
              <div className="text-2xl font-bold text-accent">{opportunity.spread.toFixed(2)}%</div>
              <div className="text-xs text-muted-foreground mt-1">Price difference</div>
            </div>
          </div>

          {/* Trade Flow */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Trade Flow
            </h3>
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Source</div>
                <div className="font-semibold capitalize">{opportunity.sourceChain}</div>
                <div className="text-sm text-muted-foreground">{opportunity.sourceDex}</div>
                <div className="text-lg font-bold mt-2">{formatCurrency(opportunity.sourcePrice)}</div>
              </div>
              <ArrowRight className="w-6 h-6 text-primary" />
              <div className="flex-1 text-right">
                <div className="text-xs text-muted-foreground mb-1">Target</div>
                <div className="font-semibold capitalize">{opportunity.targetChain}</div>
                <div className="text-sm text-muted-foreground">{opportunity.targetDex}</div>
                <div className="text-lg font-bold mt-2">{formatCurrency(opportunity.targetPrice)}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Risk Assessment
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <Badge variant="outline" className="border-accent/30">
                    {(opportunity.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <Badge className={riskColors[riskLevel]}>{riskLevel.toUpperCase()}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Execution Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Est. Time</span>
                  <span className="font-medium">{formatTime(estimatedExecutionTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Trade Size</span>
                  <span className="font-medium">{formatCurrency(opportunity.tradeSize)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Cost Breakdown</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gas Fees (Est.)</span>
                <span className="font-medium">
                  {formatCurrency((opportunity as any).estimatedGasCost || opportunity.tradeSize * 0.001)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bridge Fee (Est.)</span>
                <span className="font-medium">
                  {formatCurrency((opportunity as any).estimatedBridgeFee || opportunity.tradeSize * 0.002)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Slippage (Est.)</span>
                <span className="font-medium">
                  {formatCurrency((opportunity as any).estimatedSlippage || opportunity.tradeSize * 0.001)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-semibold">
                <span>Net Profit</span>
                <span className="text-primary">{formatCurrency(opportunity.expectedProfit)}</span>
              </div>
            </div>
          </div>

          {/* Status and Expiry */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Expires in</span>
              <span className="font-medium">
                {Math.max(0, Math.floor((new Date(opportunity.expiresAt).getTime() - Date.now()) / 1000 / 60))} minutes
              </span>
            </div>
            <Badge
              className={
                opportunity.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : opportunity.status === "executing"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-muted/20 text-muted-foreground border-muted/30"
              }
            >
              {opportunity.status.toUpperCase()}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {opportunity.status === "active" && (
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !isSignedIn}
                className="flex-1 bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Execute Trade
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              size="lg"
            >
              Close
            </Button>
          </div>

          {/* Warning for high risk */}
          {riskLevel === "high" && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-yellow-400 mb-1">High Risk Opportunity</div>
                <div className="text-xs text-muted-foreground">
                  This opportunity has lower confidence or smaller spread. Consider the risks before executing.
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
