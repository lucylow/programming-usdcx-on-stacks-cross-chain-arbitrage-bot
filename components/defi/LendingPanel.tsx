"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Badge } from "@/src/components/ui/badge"

interface LendingPosition {
  suppliedAmount: number
  interestEarned: number
  lastUpdateBlock: number
}

interface BorrowingPosition {
  borrowedAmount: number
  interestOwed: number
  collateralAmount: number
  lastUpdateBlock: number
  active: boolean
}

interface PoolStats {
  totalSupplied: number
  totalBorrowed: number
  totalCollateral: number
  utilization: number
  lendingRate: number
  borrowingRate: number
}

interface LendingPanelProps {
  usdcxBalance: number
  onSupply?: (amount: number) => Promise<void>
  onWithdraw?: (amount: number) => Promise<void>
  onBorrow?: (amount: number, collateral: number) => Promise<void>
  onRepay?: (amount: number) => Promise<void>
  lendingPosition?: LendingPosition | null
  borrowingPosition?: BorrowingPosition | null
  poolStats?: PoolStats
}

export default function LendingPanel({
  usdcxBalance,
  onSupply,
  onWithdraw,
  onBorrow,
  onRepay,
  lendingPosition,
  borrowingPosition,
  poolStats,
}: LendingPanelProps) {
  const [supplyAmount, setSupplyAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [collateralAmount, setCollateralAmount] = useState("")
  const [repayAmount, setRepayAmount] = useState("")
  const [activeTab, setActiveTab] = useState<"supply" | "borrow" | "positions">("supply")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSupply = async () => {
    const amount = parseFloat(supplyAmount)
    if (amount <= 0 || amount > usdcxBalance) {
      alert("Invalid supply amount")
      return
    }

    setIsProcessing(true)
    try {
      if (onSupply) {
        await onSupply(amount)
        setSupplyAmount("")
      }
    } catch (error: any) {
      alert(`Supply failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (amount <= 0) {
      alert("Invalid withdraw amount")
      return
    }

    setIsProcessing(true)
    try {
      if (onWithdraw) {
        await onWithdraw(amount)
        setWithdrawAmount("")
      }
    } catch (error: any) {
      alert(`Withdraw failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBorrow = async () => {
    const amount = parseFloat(borrowAmount)
    const collateral = parseFloat(collateralAmount)
    if (amount <= 0 || collateral <= 0) {
      alert("Invalid borrow or collateral amount")
      return
    }

    setIsProcessing(true)
    try {
      if (onBorrow) {
        await onBorrow(amount, collateral)
        setBorrowAmount("")
        setCollateralAmount("")
      }
    } catch (error: any) {
      alert(`Borrow failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRepay = async () => {
    const amount = parseFloat(repayAmount)
    if (amount <= 0) {
      alert("Invalid repay amount")
      return
    }

    setIsProcessing(true)
    try {
      if (onRepay) {
        await onRepay(amount)
        setRepayAmount("")
      }
    } catch (error: any) {
      alert(`Repay failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const totalOwed = borrowingPosition
    ? borrowingPosition.borrowedAmount + borrowingPosition.interestOwed
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>USDCx Lending Pool</CardTitle>
        <CardDescription>Lend or borrow USDCx with competitive interest rates</CardDescription>
      </CardHeader>
      <CardContent>
        {poolStats && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Supplied</p>
              <p className="text-lg font-semibold">{poolStats.totalSupplied.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-lg font-semibold">{poolStats.utilization.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lending APY</p>
              <p className="text-lg font-semibold">{poolStats.lendingRate.toFixed(2)}%</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "supply" ? "default" : "outline"}
            onClick={() => setActiveTab("supply")}
            className="flex-1"
          >
            Supply
          </Button>
          <Button
            variant={activeTab === "borrow" ? "default" : "outline"}
            onClick={() => setActiveTab("borrow")}
            className="flex-1"
          >
            Borrow
          </Button>
          <Button
            variant={activeTab === "positions" ? "default" : "outline"}
            onClick={() => setActiveTab("positions")}
            className="flex-1"
          >
            Positions
          </Button>
        </div>

        {activeTab === "supply" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="supply-amount">Amount to Supply</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="supply-amount"
                  type="number"
                  placeholder="0.00"
                  value={supplyAmount}
                  onChange={(e) => setSupplyAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Button variant="outline" onClick={() => setSupplyAmount(usdcxBalance.toFixed(2))}>
                  Max
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available: {usdcxBalance.toFixed(2)} USDCx
              </p>
              {poolStats && (
                <p className="text-sm text-muted-foreground">
                  Current APY: {poolStats.lendingRate.toFixed(2)}%
                </p>
              )}
            </div>

            <Button
              onClick={handleSupply}
              disabled={isProcessing || !supplyAmount || parseFloat(supplyAmount) <= 0}
              className="w-full"
            >
              {isProcessing ? "Supplying..." : "Supply USDCx"}
            </Button>

            {lendingPosition && lendingPosition.suppliedAmount > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Withdraw from Pool</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      setWithdrawAmount(
                        (lendingPosition.suppliedAmount + lendingPosition.interestEarned).toFixed(2),
                      )
                    }
                  >
                    Max
                  </Button>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="w-full mt-2"
                  variant="outline"
                >
                  {isProcessing ? "Withdrawing..." : "Withdraw"}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "borrow" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="borrow-amount">Amount to Borrow</Label>
              <Input
                id="borrow-amount"
                type="number"
                placeholder="0.00"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="collateral-amount">Collateral Amount</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="collateral-amount"
                  type="number"
                  placeholder="0.00"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Button
                  variant="outline"
                  onClick={() => setCollateralAmount(usdcxBalance.toFixed(2))}
                >
                  Max
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available: {usdcxBalance.toFixed(2)} USDCx
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum collateral: 150% of borrow amount
              </p>
            </div>

            {poolStats && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>Borrowing APY</span>
                  <span className="font-medium">{poolStats.borrowingRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available Liquidity</span>
                  <span className="font-medium">
                    {(poolStats.totalSupplied - poolStats.totalBorrowed).toFixed(2)} USDCx
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleBorrow}
              disabled={
                isProcessing ||
                !borrowAmount ||
                !collateralAmount ||
                parseFloat(borrowAmount) <= 0 ||
                parseFloat(collateralAmount) <= 0
              }
              className="w-full"
            >
              {isProcessing ? "Borrowing..." : "Borrow USDCx"}
            </Button>
          </div>
        )}

        {activeTab === "positions" && (
          <div className="space-y-4">
            {lendingPosition && lendingPosition.suppliedAmount > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Lending Position</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Supplied</span>
                    <span className="font-medium">
                      {lendingPosition.suppliedAmount.toFixed(2)} USDCx
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Interest Earned</span>
                    <span className="font-medium">
                      {lendingPosition.interestEarned.toFixed(4)} USDCx
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Available</span>
                    <span className="font-semibold">
                      {(lendingPosition.suppliedAmount + lendingPosition.interestEarned).toFixed(2)}{" "}
                      USDCx
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {borrowingPosition && borrowingPosition.active && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Borrowing Position</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Borrowed</span>
                    <span className="font-medium">
                      {borrowingPosition.borrowedAmount.toFixed(2)} USDCx
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Interest Owed</span>
                    <span className="font-medium">
                      {borrowingPosition.interestOwed.toFixed(4)} USDCx
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Collateral</span>
                    <span className="font-medium">
                      {borrowingPosition.collateralAmount.toFixed(2)} USDCx
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Total Owed</span>
                    <span className="font-semibold">{totalOwed.toFixed(2)} USDCx</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="repay-amount">Repay Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="repay-amount"
                      type="number"
                      placeholder="0.00"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setRepayAmount(totalOwed.toFixed(2))}
                    >
                      Max
                    </Button>
                  </div>
                  <Button
                    onClick={handleRepay}
                    disabled={isProcessing || !repayAmount || parseFloat(repayAmount) <= 0}
                    className="w-full"
                  >
                    {isProcessing ? "Repaying..." : "Repay"}
                  </Button>
                </div>
              </Card>
            )}

            {(!lendingPosition || lendingPosition.suppliedAmount === 0) &&
              (!borrowingPosition || !borrowingPosition.active) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active positions</p>
                  <p className="text-sm mt-2">Supply or borrow USDCx to get started</p>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

