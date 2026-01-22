/**
 * USDCx DeFi Services
 * Provides services for staking, lending, and yield farming operations
 */

import { StacksClient } from "./stacksClient"
import { logger } from "../utils/logger"
import { USDCxError, ValidationError, NetworkError } from "../utils/errors"
import { retry } from "../utils/retry"
import {
  uintCV,
  principalCV,
  stringAsciiCV,
  ClarityValue,
} from "@stacks/transactions"

export interface StakingPosition {
  stakeId: number
  amount: number
  startBlock: number
  periodBlocks: number
  apyBps: number
  claimedRewards: number
  active: boolean
  pendingRewards?: number
}

export interface LendingPosition {
  suppliedAmount: number
  interestEarned: number
  lastUpdateBlock: number
}

export interface BorrowingPosition {
  borrowedAmount: number
  interestOwed: number
  collateralAmount: number
  lastUpdateBlock: number
  active: boolean
}

export interface PoolStats {
  totalSupplied: number
  totalBorrowed: number
  totalCollateral: number
  utilization: number
  lendingRate: number
  borrowingRate: number
}

export class USDCxDefiService {
  private stacksClient: StacksClient
  private stakingContractAddress: string
  private stakingContractName: string
  private lendingContractAddress: string
  private lendingContractName: string
  private usdcxContractAddress: string
  private usdcxContractName: string

  constructor(
    stacksClient: StacksClient,
    config: {
      stakingContractAddress: string
      stakingContractName?: string
      lendingContractAddress: string
      lendingContractName?: string
      usdcxContractAddress: string
      usdcxContractName?: string
    },
  ) {
    this.stacksClient = stacksClient
    this.stakingContractAddress = config.stakingContractAddress
    this.stakingContractName = config.stakingContractName || "usdcx-staking"
    this.lendingContractAddress = config.lendingContractAddress
    this.lendingContractName = config.lendingContractName || "usdcx-lending"
    this.usdcxContractAddress = config.usdcxContractAddress
    this.usdcxContractName = config.usdcxContractName || "usdcx-token"
  }

  // ==========================================
  // Staking Functions
  // ==========================================

  /**
   * Stake USDCx tokens for a specific period
   * @param amount Amount to stake in USDCx
   * @param periodDays Staking period in days (30, 90, 180, or 365)
   */
  async stake(amount: number, periodDays: 30 | 90 | 180 | 365): Promise<number> {
    if (amount <= 0) {
      throw new ValidationError("Stake amount must be greater than 0")
    }

    if (![30, 90, 180, 365].includes(periodDays)) {
      throw new ValidationError("Invalid staking period. Must be 30, 90, 180, or 365 days")
    }

    // Convert days to blocks (assuming ~10 minutes per block = 144 blocks per day)
    const blocksPerDay = 144
    const periodBlocks = periodDays * blocksPerDay

    try {
      const amountMicro = Math.floor(amount * 1e6)

      const txId = await retry(
        async () => {
          return await this.stacksClient.contractCall({
            contractAddress: this.stakingContractAddress,
            contractName: this.stakingContractName,
            functionName: "stake",
            functionArgs: [uintCV(amountMicro), uintCV(periodBlocks)],
            senderKey: this.stacksClient.getPrivateKey(),
          })
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
          onRetry: (attempt) => {
            logger.warn(`Retrying stake operation (attempt ${attempt})`)
          },
        },
      )

      logger.info(`Staked ${amount} USDCx for ${periodDays} days. TX: ${txId}`)
      return parseInt(txId, 16) // Return stake ID (simplified)
    } catch (error: any) {
      logger.error("Staking failed:", error)
      throw new USDCxError(`Failed to stake USDCx: ${error.message}`, "stake", { amount, periodDays })
    }
  }

  /**
   * Unstake USDCx tokens after lock period
   */
  async unstake(stakeId: number): Promise<string> {
    try {
      const txId = await retry(
        async () => {
          return await this.stacksClient.contractCall({
            contractAddress: this.stakingContractAddress,
            contractName: this.stakingContractName,
            functionName: "unstake",
            functionArgs: [uintCV(stakeId)],
            senderKey: this.stacksClient.getPrivateKey(),
          })
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
        },
      )

      logger.info(`Unstaked position ${stakeId}. TX: ${txId}`)
      return txId
    } catch (error: any) {
      logger.error("Unstaking failed:", error)
      throw new USDCxError(`Failed to unstake: ${error.message}`, "unstake", { stakeId })
    }
  }

  /**
   * Claim staking rewards without unstaking
   */
  async claimStakingRewards(stakeId: number): Promise<string> {
    try {
      const txId = await retry(
        async () => {
          return await this.stacksClient.contractCall({
            contractAddress: this.stakingContractAddress,
            contractName: this.stakingContractName,
            functionName: "claim-rewards",
            functionArgs: [uintCV(stakeId)],
            senderKey: this.stacksClient.getPrivateKey(),
          })
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
        },
      )

      logger.info(`Claimed rewards for stake ${stakeId}. TX: ${txId}`)
      return txId
    } catch (error: any) {
      logger.error("Claim rewards failed:", error)
      throw new USDCxError(`Failed to claim rewards: ${error.message}`, "claim-rewards", { stakeId })
    }
  }

  /**
   * Get staking position details
   */
  async getStakePosition(stakeId: number, address?: string): Promise<StakingPosition | null> {
    try {
      const targetAddress = address || this.stacksClient.getAddress()

      const position = await this.stacksClient.readOnlyCall<{
        amount: { value: string }
        "start-block": { value: string }
        "period-blocks": { value: string }
        "apy-bps": { value: string }
        "claimed-rewards": { value: string }
        active: { value: boolean }
      }>({
        contractAddress: this.stakingContractAddress,
        contractName: this.stakingContractName,
        functionName: "get-stake",
        functionArgs: [principalCV(targetAddress), uintCV(stakeId)],
        senderAddress: targetAddress,
      })

      if (!position) {
        return null
      }

      // Get pending rewards
      const pendingRewards = await this.getPendingRewards(stakeId, targetAddress)

      return {
        stakeId,
        amount: parseInt(position.amount.value, 16) / 1e6,
        startBlock: parseInt(position["start-block"].value, 16),
        periodBlocks: parseInt(position["period-blocks"].value, 16),
        apyBps: parseInt(position["apy-bps"].value, 16),
        claimedRewards: parseInt(position["claimed-rewards"].value, 16) / 1e6,
        active: position.active.value,
        pendingRewards: pendingRewards / 1e6,
      }
    } catch (error: any) {
      logger.error("Failed to get stake position:", error)
      return null
    }
  }

  /**
   * Get pending rewards for a stake
   */
  async getPendingRewards(stakeId: number, address?: string): Promise<number> {
    try {
      const targetAddress = address || this.stacksClient.getAddress()

      const rewards = await this.stacksClient.readOnlyCall<{ value: string }>({
        contractAddress: this.stakingContractAddress,
        contractName: this.stakingContractName,
        functionName: "calculate-pending-rewards",
        functionArgs: [principalCV(targetAddress), uintCV(stakeId)],
        senderAddress: targetAddress,
      })

      return parseInt(rewards.value, 16)
    } catch (error: any) {
      logger.error("Failed to get pending rewards:", error)
      return 0
    }
  }

  /**
   * Get total staked amount
   */
  async getTotalStaked(): Promise<number> {
    try {
      const total = await this.stacksClient.readOnlyCall<{ value: string }>({
        contractAddress: this.stakingContractAddress,
        contractName: this.stakingContractName,
        functionName: "get-total-staked",
        functionArgs: [],
        senderAddress: this.stacksClient.getAddress(),
      })

      return parseInt(total.value, 16) / 1e6
    } catch (error: any) {
      logger.error("Failed to get total staked:", error)
      return 0
    }
  }

  // ==========================================
  // Lending Functions
  // ==========================================

  /**
   * Supply USDCx to the lending pool
   */
  async supply(amount: number): Promise<string> {
    if (amount <= 0) {
      throw new ValidationError("Supply amount must be greater than 0")
    }

    try {
      const amountMicro = Math.floor(amount * 1e6)

      const txId = await retry(
        async () => {
          return await this.stacksClient.contractCall({
            contractAddress: this.lendingContractAddress,
            contractName: this.lendingContractName,
            functionName: "supply",
            functionArgs: [uintCV(amountMicro)],
            senderKey: this.stacksClient.getPrivateKey(),
          })
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
        },
      )

      logger.info(`Supplied ${amount} USDCx to lending pool. TX: ${txId}`)
      return txId
    } catch (error: any) {
      logger.error("Supply failed:", error)
      throw new USDCxError(`Failed to supply USDCx: ${error.message}`, "supply", { amount })
    }
  }

  /**
   * Withdraw supplied USDCx from lending pool
   */
  async withdraw(amount: number): Promise<string> {
    if (amount <= 0) {
      throw new ValidationError("Withdraw amount must be greater than 0")
    }

    try {
      const amountMicro = Math.floor(amount * 1e6)

      const txId = await retry(
        async () => {
          return await this.stacksClient.contractCall({
            contractAddress: this.lendingContractAddress,
            contractName: this.lendingContractName,
            functionName: "withdraw",
            functionArgs: [uintCV(amountMicro)],
            senderKey: this.stacksClient.getPrivateKey(),
          })
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
        },
      )

      logger.info(`Withdrew ${amount} USDCx from lending pool. TX: ${txId}`)
      return txId
    } catch (error: any) {
      logger.error("Withdraw failed:", error)
      throw new USDCxError(`Failed to withdraw USDCx: ${error.message}`, "withdraw", { amount })
    }
  }

  /**
   * Borrow USDCx with collateral
   */
  async borrow(amount: number, collateralAmount: number): Promise<string> {
    if (amount <= 0 || collateralAmount <= 0) {
      throw new ValidationError("Borrow and collateral amounts must be greater than 0")
    }

    try {
      const amountMicro = Math.floor(amount * 1e6)
      const collateralMicro = Math.floor(collateralAmount * 1e6)

      const txId = await retry(
        async () => {
          return await this.stacksClient.contractCall({
            contractAddress: this.lendingContractAddress,
            contractName: this.lendingContractName,
            functionName: "borrow",
            functionArgs: [uintCV(amountMicro), uintCV(collateralMicro)],
            senderKey: this.stacksClient.getPrivateKey(),
          })
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
        },
      )

      logger.info(`Borrowed ${amount} USDCx with ${collateralAmount} collateral. TX: ${txId}`)
      return txId
    } catch (error: any) {
      logger.error("Borrow failed:", error)
      throw new USDCxError(`Failed to borrow USDCx: ${error.message}`, "borrow", { amount, collateralAmount })
    }
  }

  /**
   * Repay borrowed USDCx
   */
  async repay(amount: number): Promise<string> {
    if (amount <= 0) {
      throw new ValidationError("Repay amount must be greater than 0")
    }

    try {
      const amountMicro = Math.floor(amount * 1e6)

      const txId = await retry(
        async () => {
          return await this.stacksClient.contractCall({
            contractAddress: this.lendingContractAddress,
            contractName: this.lendingContractName,
            functionName: "repay",
            functionArgs: [uintCV(amountMicro)],
            senderKey: this.stacksClient.getPrivateKey(),
          })
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
        },
      )

      logger.info(`Repaid ${amount} USDCx. TX: ${txId}`)
      return txId
    } catch (error: any) {
      logger.error("Repay failed:", error)
      throw new USDCxError(`Failed to repay USDCx: ${error.message}`, "repay", { amount })
    }
  }

  /**
   * Get lending position
   */
  async getLendingPosition(address?: string): Promise<LendingPosition | null> {
    try {
      const targetAddress = address || this.stacksClient.getAddress()

      const position = await this.stacksClient.readOnlyCall<{
        "supplied-amount": { value: string }
        "interest-earned": { value: string }
        "last-update-block": { value: string }
      }>({
        contractAddress: this.lendingContractAddress,
        contractName: this.lendingContractName,
        functionName: "get-lender-position",
        functionArgs: [principalCV(targetAddress)],
        senderAddress: targetAddress,
      })

      if (!position) {
        return null
      }

      return {
        suppliedAmount: parseInt(position["supplied-amount"].value, 16) / 1e6,
        interestEarned: parseInt(position["interest-earned"].value, 16) / 1e6,
        lastUpdateBlock: parseInt(position["last-update-block"].value, 16),
      }
    } catch (error: any) {
      logger.error("Failed to get lending position:", error)
      return null
    }
  }

  /**
   * Get borrowing position
   */
  async getBorrowingPosition(address?: string): Promise<BorrowingPosition | null> {
    try {
      const targetAddress = address || this.stacksClient.getAddress()

      const position = await this.stacksClient.readOnlyCall<{
        "borrowed-amount": { value: string }
        "interest-owed": { value: string }
        "collateral-amount": { value: string }
        "last-update-block": { value: string }
        active: { value: boolean }
      }>({
        contractAddress: this.lendingContractAddress,
        contractName: this.lendingContractName,
        functionName: "get-borrower-position",
        functionArgs: [principalCV(targetAddress)],
        senderAddress: targetAddress,
      })

      if (!position) {
        return null
      }

      return {
        borrowedAmount: parseInt(position["borrowed-amount"].value, 16) / 1e6,
        interestOwed: parseInt(position["interest-owed"].value, 16) / 1e6,
        collateralAmount: parseInt(position["collateral-amount"].value, 16) / 1e6,
        lastUpdateBlock: parseInt(position["last-update-block"].value, 16),
        active: position.active.value,
      }
    } catch (error: any) {
      logger.error("Failed to get borrowing position:", error)
      return null
    }
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(): Promise<PoolStats> {
    try {
      const stats = await this.stacksClient.readOnlyCall<{
        "total-supplied": { value: string }
        "total-borrowed": { value: string }
        "total-collateral": { value: string }
        utilization: { value: string }
        "lending-rate": { value: string }
        "borrowing-rate": { value: string }
      }>({
        contractAddress: this.lendingContractAddress,
        contractName: this.lendingContractName,
        functionName: "get-pool-stats",
        functionArgs: [],
        senderAddress: this.stacksClient.getAddress(),
      })

      return {
        totalSupplied: parseInt(stats["total-supplied"].value, 16) / 1e6,
        totalBorrowed: parseInt(stats["total-borrowed"].value, 16) / 1e6,
        totalCollateral: parseInt(stats["total-collateral"].value, 16) / 1e6,
        utilization: parseInt(stats.utilization.value, 16) / 100, // Convert from basis points to percentage
        lendingRate: parseInt(stats["lending-rate"].value, 16) / 100, // Convert from basis points to percentage
        borrowingRate: parseInt(stats["borrowing-rate"].value, 16) / 100,
      }
    } catch (error: any) {
      logger.error("Failed to get pool stats:", error)
      throw new NetworkError(`Failed to get pool statistics: ${error.message}`)
    }
  }
}

