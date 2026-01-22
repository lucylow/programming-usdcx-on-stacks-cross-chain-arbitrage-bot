"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Badge } from "@/src/components/ui/badge"

interface StakingPosition {
  stakeId: number
  amount: number
  startBlock: number
  periodBlocks: number
  apyBps: number
  claimedRewards: number
  active: boolean
  pendingRewards?: number
}

interface StakingPanelProps {
  usdcxBalance: number
  onStake?: (amount: number, period: number) => Promise<void>
  onUnstake?: (stakeId: number) => Promise<void>
  onClaimRewards?: (stakeId: number) => Promise<void>
  positions?: StakingPosition[]
}

const STAKING_PERIODS = [
  { days: 30, apy: 5, label: "30 Days", blocks: 4320 },
  { days: 90, apy: 8, label: "90 Days", blocks: 12960 },
  { days: 180, apy: 12, label: "180 Days", blocks: 25920 },
  { days: 365, apy: 15, label: "365 Days", blocks: 52560 },
]

export default function StakingPanel({
  usdcxBalance,
  onStake,
  onUnstake,
  onClaimRewards,
  positions = [],
}: StakingPanelProps) {
  const [stakeAmount, setStakeAmount] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [isStaking, setIsStaking] = useState(false)
  const [activeTab, setActiveTab] = useState<"stake" | "positions">("stake")

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount)
    if (amount <= 0 || amount > usdcxBalance) {
      alert("Invalid stake amount")
      return
    }

    setIsStaking(true)
    try {
      if (onStake) {
        await onStake(amount, selectedPeriod)
        setStakeAmount("")
      }
    } catch (error: any) {
      alert(`Staking failed: ${error.message}`)
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async (stakeId: number) => {
    if (onUnstake) {
      try {
        await onUnstake(stakeId)
      } catch (error: any) {
        alert(`Unstaking failed: ${error.message}`)
      }
    }
  }

  const handleClaimRewards = async (stakeId: number) => {
    if (onClaimRewards) {
      try {
        await onClaimRewards(stakeId)
      } catch (error: any) {
        alert(`Claim rewards failed: ${error.message}`)
      }
    }
  }

  const selectedPeriodInfo = STAKING_PERIODS.find((p) => p.days === selectedPeriod)

  return (
    <Card>
      <CardHeader>
        <CardTitle>USDCx Staking</CardTitle>
        <CardDescription>Stake your USDCx to earn rewards with flexible lock periods</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "stake" ? "default" : "outline"}
            onClick={() => setActiveTab("stake")}
            className="flex-1"
          >
            Stake
          </Button>
          <Button
            variant={activeTab === "positions" ? "default" : "outline"}
            onClick={() => setActiveTab("positions")}
            className="flex-1"
          >
            My Positions ({positions.length})
          </Button>
        </div>

        {activeTab === "stake" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="stake-amount">Amount to Stake</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Button
                  variant="outline"
                  onClick={() => setStakeAmount(usdcxBalance.toFixed(2))}
                >
                  Max
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available: {usdcxBalance.toFixed(2)} USDCx
              </p>
            </div>

            <div>
              <Label>Staking Period</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {STAKING_PERIODS.map((period) => (
                  <Button
                    key={period.days}
                    variant={selectedPeriod === period.days ? "default" : "outline"}
                    onClick={() => setSelectedPeriod(period.days)}
                    className="flex flex-col h-auto py-3"
                  >
                    <span className="font-semibold">{period.label}</span>
                    <span className="text-xs opacity-80">{period.apy}% APY</span>
                  </Button>
                ))}
              </div>
            </div>

            {selectedPeriodInfo && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Estimated APY</span>
                  <Badge variant="secondary">{selectedPeriodInfo.apy}%</Badge>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Lock Period</span>
                  <span className="text-sm font-medium">{selectedPeriodInfo.days} days</span>
                </div>
                {stakeAmount && parseFloat(stakeAmount) > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Estimated Rewards</span>
                    <span className="text-sm font-bold">
                      {((parseFloat(stakeAmount) * selectedPeriodInfo.apy) / 100).toFixed(2)} USDCx
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="w-full"
            >
              {isStaking ? "Staking..." : "Stake USDCx"}
            </Button>
          </div>
        )}

        {activeTab === "positions" && (
          <div className="space-y-4">
            {positions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active staking positions</p>
                <p className="text-sm mt-2">Stake USDCx to start earning rewards</p>
              </div>
            ) : (
              positions.map((position) => {
                const daysRemaining = Math.max(
                  0,
                  Math.ceil(
                    (position.periodBlocks - (Date.now() / 1000 - position.startBlock * 10 * 60)) /
                      (60 * 60 * 24),
                  ),
                )
                const canUnstake = daysRemaining <= 0
                const apy = position.apyBps / 100

                return (
                  <Card key={position.stakeId} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">Position #{position.stakeId}</p>
                        <p className="text-sm text-muted-foreground">
                          {position.amount.toFixed(2)} USDCx staked
                        </p>
                      </div>
                      <Badge variant={position.active ? "default" : "secondary"}>
                        {position.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">APY</span>
                        <span className="font-medium">{apy}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending Rewards</span>
                        <span className="font-medium">
                          {(position.pendingRewards || 0).toFixed(4)} USDCx
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Claimed Rewards</span>
                        <span className="font-medium">{position.claimedRewards.toFixed(4)} USDCx</span>
                      </div>
                      {!canUnstake && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Days Remaining</span>
                          <span className="font-medium">{daysRemaining} days</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {position.pendingRewards && position.pendingRewards > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClaimRewards(position.stakeId)}
                          className="flex-1"
                        >
                          Claim Rewards
                        </Button>
                      )}
                      {canUnstake && position.active && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUnstake(position.stakeId)}
                          className="flex-1"
                        >
                          Unstake
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

