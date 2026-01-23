import { StacksMainnet, StacksTestnet } from "@stacks/network"
import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, standardPrincipalCV, stringAsciiCV, uintCV } from "@stacks/transactions"
import { logger } from "../utils/logger"
import { config } from "../config"

export interface BadgeCriteria {
  badgeType: "early-adopter" | "trader" | "whale" | "legend"
  minTrades: number
  minProfit: number
}

const BADGE_CRITERIA: BadgeCriteria[] = [
  { badgeType: "early-adopter", minTrades: 1, minProfit: 0 },
  { badgeType: "trader", minTrades: 10, minProfit: 100 },
  { badgeType: "whale", minTrades: 50, minProfit: 1000 },
  { badgeType: "legend", minTrades: 100, minProfit: 5000 },
]

export interface TradeStats {
  address: string
  totalTrades: number
  totalProfit: number
  lastTradeAt: Date
}

export class NFTMinter {
  private network: "mainnet" | "testnet"
  private networkInstance: StacksMainnet | StacksTestnet
  private contractAddress: string
  private contractName: string
  private privateKey?: string

  constructor(
    network: "mainnet" | "testnet",
    contractAddress: string,
    contractName: string = "privacy-badge-nft",
    privateKey?: string,
  ) {
    this.network = network
    this.networkInstance = network === "mainnet" ? new StacksMainnet() : new StacksTestnet()
    this.contractAddress = contractAddress
    this.contractName = contractName
    this.privateKey = privateKey || config.stacks.privateKey
  }

  /**
   * Determine which badge a user should receive based on their trading stats
   */
  determineBadgeType(stats: TradeStats): string | null {
    // Check criteria in reverse order (highest to lowest) to award best badge
    for (let i = BADGE_CRITERIA.length - 1; i >= 0; i--) {
      const criteria = BADGE_CRITERIA[i]
      if (stats.totalTrades >= criteria.minTrades && stats.totalProfit >= criteria.minProfit) {
        return criteria.badgeType
      }
    }
    return null
  }

  /**
   * Mint a badge for a user based on their trading activity
   */
  async mintBadgeForTrader(
    recipient: string,
    badgeType: string,
    tradesCompleted: number,
    profitEarned: number,
  ): Promise<string | null> {
    if (!this.privateKey) {
      logger.warn("Private key not configured, cannot mint badge")
      return null
    }

    try {
      const txOptions = {
        network: this.networkInstance,
        anchorMode: AnchorMode.Any,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: "mint-badge",
        functionArgs: [
          standardPrincipalCV(recipient),
          stringAsciiCV(badgeType),
          uintCV(tradesCompleted),
          uintCV(Math.floor(profitEarned)),
        ],
        senderKey: this.privateKey,
        postConditionMode: PostConditionMode.Deny,
        fee: 1000, // 0.001 STX
      }

      const transaction = await makeContractCall(txOptions)
      const broadcastResponse = await broadcastTransaction(transaction, this.networkInstance)

      if (broadcastResponse.error) {
        logger.error("Error broadcasting badge mint transaction:", broadcastResponse.error)
        return null
      }

      logger.info(`Badge minted for ${recipient}: ${badgeType} (TX: ${broadcastResponse.txid})`)
      return broadcastResponse.txid
    } catch (error) {
      logger.error(`Error minting badge for ${recipient}:`, error)
      return null
    }
  }

  /**
   * Check if user should receive a badge and mint it
   */
  async checkAndMintBadge(stats: TradeStats): Promise<string | null> {
    const badgeType = this.determineBadgeType(stats)
    if (!badgeType) {
      logger.debug(`User ${stats.address} does not meet badge criteria`)
      return null
    }

    // Check if user already has this badge type (would need to query contract)
    // For now, we'll attempt to mint and let the contract handle duplicates

    return await this.mintBadgeForTrader(
      stats.address,
      badgeType,
      stats.totalTrades,
      stats.totalProfit,
    )
  }

  /**
   * Process trade completion and potentially mint badge
   */
  async processTradeCompletion(
    traderAddress: string,
    tradeProfit: number,
    currentStats: TradeStats,
  ): Promise<string | null> {
    // Update stats
    const updatedStats: TradeStats = {
      address: traderAddress,
      totalTrades: currentStats.totalTrades + 1,
      totalProfit: currentStats.totalProfit + tradeProfit,
      lastTradeAt: new Date(),
    }

    // Check if user qualifies for a new badge
    return await this.checkAndMintBadge(updatedStats)
  }
}
