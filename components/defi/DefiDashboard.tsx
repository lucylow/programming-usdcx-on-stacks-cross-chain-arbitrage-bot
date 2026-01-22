"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import StakingPanel from "./StakingPanel"
import LendingPanel from "./LendingPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"

interface DefiDashboardProps {
  usdcxBalance: number
  // Staking callbacks
  onStake?: (amount: number, period: number) => Promise<void>
  onUnstake?: (stakeId: number) => Promise<void>
  onClaimStakingRewards?: (stakeId: number) => Promise<void>
  stakingPositions?: Array<{
    stakeId: number
    amount: number
    startBlock: number
    periodBlocks: number
    apyBps: number
    claimedRewards: number
    active: boolean
    pendingRewards?: number
  }>
  // Lending callbacks
  onSupply?: (amount: number) => Promise<void>
  onWithdraw?: (amount: number) => Promise<void>
  onBorrow?: (amount: number, collateral: number) => Promise<void>
  onRepay?: (amount: number) => Promise<void>
  lendingPosition?: {
    suppliedAmount: number
    interestEarned: number
    lastUpdateBlock: number
  } | null
  borrowingPosition?: {
    borrowedAmount: number
    interestOwed: number
    collateralAmount: number
    lastUpdateBlock: number
    active: boolean
  } | null
  poolStats?: {
    totalSupplied: number
    totalBorrowed: number
    totalCollateral: number
    utilization: number
    lendingRate: number
    borrowingRate: number
  }
}

export default function DefiDashboard({
  usdcxBalance,
  onStake,
  onUnstake,
  onClaimStakingRewards,
  stakingPositions = [],
  onSupply,
  onWithdraw,
  onBorrow,
  onRepay,
  lendingPosition,
  borrowingPosition,
  poolStats,
}: DefiDashboardProps) {
  const [activeTab, setActiveTab] = useState<"staking" | "lending">("staking")

  // Calculate total stats
  const totalStaked = stakingPositions
    .filter((p) => p.active)
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPendingRewards = stakingPositions
    .filter((p) => p.active)
    .reduce((sum, p) => sum + (p.pendingRewards || 0), 0)

  const totalClaimedRewards = stakingPositions.reduce((sum, p) => sum + p.claimedRewards, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">USDCx DeFi Platform</h2>
        <p className="text-muted-foreground">
          Stake, lend, and borrow USDCx to maximize your yield
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USDCx Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usdcxBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaked.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stakingPositions.filter((p) => p.active).length} active positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendingRewards.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Available to claim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaimedRewards.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All-time rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Main DeFi Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "staking" | "lending")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staking">Staking</TabsTrigger>
          <TabsTrigger value="lending">Lending & Borrowing</TabsTrigger>
        </TabsList>

        <TabsContent value="staking" className="space-y-4">
          <StakingPanel
            usdcxBalance={usdcxBalance}
            onStake={onStake}
            onUnstake={onUnstake}
            onClaimRewards={onClaimStakingRewards}
            positions={stakingPositions}
          />
        </TabsContent>

        <TabsContent value="lending" className="space-y-4">
          <LendingPanel
            usdcxBalance={usdcxBalance}
            onSupply={onSupply}
            onWithdraw={onWithdraw}
            onBorrow={onBorrow}
            onRepay={onRepay}
            lendingPosition={lendingPosition}
            borrowingPosition={borrowingPosition}
            poolStats={poolStats}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

