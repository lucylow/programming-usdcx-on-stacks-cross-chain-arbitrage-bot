"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Coins,
  TrendingUp,
  Clock,
  Lock,
  Unlock,
  Bitcoin,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Wallet,
  Users,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useStacks } from "../../../lib/stacks/StacksProvider"
import { useStacksStacking, STACKING_CONFIG } from "../../../lib/stacks/hooks/useStacksStacking"

interface StackingPanelProps {
  className?: string
}

export function StackingPanel({ className }: StackingPanelProps) {
  const { isSignedIn, walletInfo, network } = useStacks()
  const {
    stackingInfo,
    isLoading,
    error,
    stackStx,
    stackExtend,
    stackIncrease,
    delegateStx,
    refreshStackingInfo,
    calculateRewards,
    getMinimumStacking,
    isAmountValid,
  } = useStacksStacking()

  const [activeTab, setActiveTab] = useState("stake")
  const [stakeAmount, setStakeAmount] = useState("")
  const [lockCycles, setLockCycles] = useState([6])
  const [btcAddress, setBtcAddress] = useState("")
  const [poolAddress, setPoolAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stxBalance = walletInfo?.stxBalance || 0
  const minStacking = getMinimumStacking()

  const estimatedRewards = useMemo(() => {
    const amount = parseFloat(stakeAmount) || 0
    return calculateRewards(amount, lockCycles[0])
  }, [stakeAmount, lockCycles, calculateRewards])

  const isFormValid = useMemo(() => {
    const amount = parseFloat(stakeAmount) || 0
    return amount > 0 && isAmountValid(amount) && amount <= stxBalance && btcAddress.length > 0
  }, [stakeAmount, btcAddress, stxBalance, isAmountValid])

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount)
    if (!amount || !btcAddress) return

    setIsSubmitting(true)
    try {
      await stackStx(amount, lockCycles[0], btcAddress)
      setStakeAmount("")
      setBtcAddress("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelegate = async () => {
    const amount = parseFloat(stakeAmount)
    if (!amount || !poolAddress) return

    setIsSubmitting(true)
    try {
      await delegateStx(amount, poolAddress)
      setStakeAmount("")
      setPoolAddress("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const cycleLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]

  if (!isSignedIn) {
    return (
      <Card className={`bg-card border-border ${className}`}>
        <CardContent className="py-12 text-center">
          <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Connect your Leather Wallet to start stacking STX and earning Bitcoin rewards.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available STX</p>
                <p className="text-xl font-bold">{stxBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Lock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stacked</p>
                <p className="text-xl font-bold">
                  {stackingInfo?.position?.amountStx?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Bitcoin className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Rewards</p>
                <p className="text-xl font-bold">
                  {stackingInfo?.position?.estimatedRewardsBtc?.toFixed(6) || "0"} BTC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Cycle</p>
                <p className="text-xl font-bold">{stackingInfo?.currentCycle || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Position */}
      <AnimatePresence>
        {stackingInfo?.isStacking && stackingInfo.position && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <CardTitle>Active Stacking Position</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Stacked</p>
                    <p className="text-2xl font-bold">{stackingInfo.position.amountStx.toLocaleString()} STX</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lock Period</p>
                    <p className="text-2xl font-bold">{stackingInfo.position.lockPeriodCycles} cycles</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unlock Height</p>
                    <p className="text-2xl font-bold">#{stackingInfo.position.unlockHeight.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. BTC Rewards</p>
                    <p className="text-2xl font-bold text-success">
                      {stackingInfo.position.estimatedRewardsBtc.toFixed(6)} BTC
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => stackExtend(1)}
                    disabled={isLoading}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Extend +1 Cycle
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => stackIncrease(100)}
                    disabled={isLoading}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Increase Position
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stacking Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Stack STX
              </CardTitle>
              <CardDescription>Lock your STX to earn Bitcoin rewards through Proof of Transfer</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshStackingInfo}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="stake" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Direct Stacking
              </TabsTrigger>
              <TabsTrigger value="delegate" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pool Delegation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stake" className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stake-amount">Amount to Stack</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setStakeAmount(stxBalance.toString())}
                  >
                    Max: {stxBalance.toLocaleString()} STX
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder={`Min ${minStacking.toLocaleString()} STX`}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    STX
                  </span>
                </div>
                {stakeAmount && !isAmountValid(parseFloat(stakeAmount)) && (
                  <p className="text-sm text-destructive">
                    Minimum stacking amount is {minStacking.toLocaleString()} STX
                  </p>
                )}
              </div>

              {/* Lock Period Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Lock Period</Label>
                  <span className="text-sm font-medium">{lockCycles[0]} cycles (~{lockCycles[0] * 14} days)</span>
                </div>
                <Slider
                  value={lockCycles}
                  onValueChange={setLockCycles}
                  min={1}
                  max={12}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {cycleLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>

              {/* BTC Address Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="btc-address">Bitcoin Reward Address</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Your BTC rewards will be sent to this address</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="btc-address"
                  type="text"
                  placeholder="bc1q... or 1..."
                  value={btcAddress}
                  onChange={(e) => setBtcAddress(e.target.value)}
                />
              </div>

              {/* Rewards Preview */}
              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bitcoin className="h-5 w-5 text-warning" />
                      <span className="text-sm">Estimated Rewards</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">~{estimatedRewards.toFixed(6)} BTC</p>
                      <p className="text-xs text-muted-foreground">Over {lockCycles[0]} cycles</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleStake}
                disabled={!isFormValid || isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Stack {stakeAmount || "0"} STX
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="delegate" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Pool Delegation</AlertTitle>
                <AlertDescription>
                  Delegate your STX to a stacking pool. The pool operator will stack on your behalf
                  and distribute rewards. Delegation requires less than the minimum solo stacking amount.
                </AlertDescription>
              </Alert>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delegate-amount">Amount to Delegate</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setStakeAmount(stxBalance.toString())}
                  >
                    Max: {stxBalance.toLocaleString()} STX
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="delegate-amount"
                    type="number"
                    placeholder="Amount in STX"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    STX
                  </span>
                </div>
              </div>

              {/* Pool Address Input */}
              <div className="space-y-2">
                <Label htmlFor="pool-address">Pool Address</Label>
                <Input
                  id="pool-address"
                  type="text"
                  placeholder="SP... (Pool operator address)"
                  value={poolAddress}
                  onChange={(e) => setPoolAddress(e.target.value)}
                />
              </div>

              {/* Popular Pools */}
              <div className="space-y-3">
                <Label>Popular Pools</Label>
                <div className="grid gap-3">
                  {[
                    { name: "Xverse Pool", address: "SP21...", fee: "5%", minDelegation: "100 STX" },
                    { name: "Stacked Pool", address: "SP3V...", fee: "4%", minDelegation: "50 STX" },
                    { name: "Fast Pool", address: "SP2J...", fee: "3%", minDelegation: "200 STX" },
                  ].map((pool) => (
                    <button
                      key={pool.name}
                      type="button"
                      onClick={() => setPoolAddress(pool.address)}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium">{pool.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{pool.address}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{pool.fee} fee</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Min: {pool.minDelegation}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleDelegate}
                disabled={!stakeAmount || !poolAddress || isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Delegating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Delegate {stakeAmount || "0"} STX
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Proof of Transfer</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Stackers earn BTC rewards by locking STX and supporting network consensus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h4 className="font-medium">~14 Days per Cycle</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Each reward cycle lasts approximately 2 weeks ({STACKING_CONFIG.cycleLength} blocks).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Bitcoin className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-medium">Native BTC Rewards</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Rewards are paid in real Bitcoin, sent directly to your BTC address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Skeleton loader
export function StackingPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
