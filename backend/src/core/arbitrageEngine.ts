import type { PriceOracle, ArbitrageOpportunity } from "./priceOracle"
import { config } from "../config"
import { logger } from "../utils/logger"
import { ExecutionError, ValidationError, NetworkError } from "../utils/errors"
import { retry } from "../utils/retry"
import { NFTMinter, type TradeStats } from "../nft/nftMinter"

export interface Trade {
  id: string
  opportunity: ArbitrageOpportunity
  status: "pending" | "executing" | "completed" | "failed"
  profit: number
  startTime: number
  endTime?: number
  error?: string
}

export class ArbitrageEngine {
  private priceOracle: PriceOracle
  private trades: Map<string, Trade> = new Map()
  private isRunning = false
  private scanInterval: NodeJS.Timeout | null = null
  private nftMinter?: NFTMinter
  private traderStats: Map<string, TradeStats> = new Map()

  // Performance metrics
  private metrics = {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    totalVolume: 0,
  }

  constructor(priceOracle: PriceOracle, nftMinter?: NFTMinter) {
    this.priceOracle = priceOracle
    this.nftMinter = nftMinter
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Arbitrage engine already running")
      return
    }

    try {
      logger.info("Starting Arbitrage Engine...")
      this.isRunning = true

      // Start opportunity scanning
      this.scanInterval = setInterval(() => {
        this.scanOpportunities().catch((error) => {
          logger.error("Unhandled error in scanOpportunities:", error)
        })
      }, 1000) // Scan every second

      logger.info("Arbitrage Engine started successfully")
    } catch (error) {
      this.isRunning = false
      logger.error("Failed to start Arbitrage Engine:", error)
      throw new ExecutionError("Failed to start arbitrage engine", undefined, { originalError: error })
    }
  }

  stop(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }
    this.isRunning = false
    logger.info("Arbitrage Engine stopped")
  }

  private async scanOpportunities(): Promise<void> {
    if (!this.isRunning) return

    try {
      const opportunities = this.priceOracle.detectOpportunities(config.risk.minProfitThreshold)

      // Validate opportunities
      if (!Array.isArray(opportunities)) {
        logger.warn("Invalid opportunities data received")
        return
      }

      // Execute top opportunities with error handling per trade
      const executionPromises = opportunities
        .slice(0, config.risk.maxConcurrentTrades)
        .filter((opp) => this.shouldExecute(opp))
        .map((opportunity) =>
          this.executeTrade(opportunity).catch((error) => {
            logger.error(`Failed to execute trade for opportunity ${opportunity.ethDex}-${opportunity.stacksDex}:`, error)
            // Don't throw - continue with other trades
          }),
        )

      await Promise.allSettled(executionPromises)
    } catch (error) {
      logger.error("Error scanning opportunities:", error)
      // Don't stop the engine on scan errors
    }
  }

  private shouldExecute(opportunity: ArbitrageOpportunity): boolean {
    try {
      // Validate opportunity
      if (!opportunity) {
        logger.warn("Invalid opportunity provided to shouldExecute")
        return false
      }

      // Check if already executing
      const activeTrades = Array.from(this.trades.values()).filter((t) => t.status === "executing")

      if (activeTrades.length >= config.risk.maxConcurrentTrades) {
        return false
      }

      // Validate profit data
      if (!Number.isFinite(opportunity.estimatedProfit)) {
        logger.warn("Invalid estimatedProfit in opportunity")
        return false
      }

      // Check profitability
      if (opportunity.estimatedProfit < config.risk.minProfitThreshold * 10000) {
        return false
      }

      // Validate confidence
      if (!Number.isFinite(opportunity.confidence) || opportunity.confidence < 0 || opportunity.confidence > 1) {
        logger.warn("Invalid confidence score in opportunity")
        return false
      }

      // Check confidence
      if (opportunity.confidence < 0.7) {
        return false
      }

      return true
    } catch (error) {
      logger.error("Error in shouldExecute:", error)
      return false
    }
  }

  /**
   * Execute a single opportunity by id (optional). Returns trade id.
   * Used by POST /api/trades/execute.
   */
  async executeSingleOpportunity(opportunityId?: string): Promise<{ success: boolean; tradeId: string }> {
    const opportunities = this.priceOracle.detectOpportunities(config.risk.minProfitThreshold)
    const opp = opportunityId
      ? opportunities.find((o) => {
          const idx = opportunities.indexOf(o)
          const syntheticId = `opp_${o.timestamp}_${idx}`
          return syntheticId.includes(opportunityId) || opportunityId.includes(String(o.timestamp))
        }) ?? opportunities[0]
      : opportunities[0]
    if (!opp) {
      return { success: false, tradeId: "" }
    }
    try {
      const tradeId = await this.executeTrade(opp)
      return { success: true, tradeId }
    } catch {
      const recent = this.getRecentTrades(1)
      return { success: false, tradeId: recent[0]?.id ?? "" }
    }
  }

  private async executeTrade(opportunity: ArbitrageOpportunity): Promise<string> {
    // Validate opportunity
    if (!opportunity) {
      throw new ValidationError("Opportunity is required for trade execution")
    }

    const tradeId = this.generateTradeId()

    const trade: Trade = {
      id: tradeId,
      opportunity,
      status: "executing",
      profit: 0,
      startTime: Date.now(),
    }

    this.trades.set(tradeId, trade)
    logger.info(`Executing trade ${tradeId}: ${opportunity.direction}`)

    try {
      // Execute with retry logic for network operations
      if (config.mode === "demo") {
        await retry(
          () => this.simulateTradeExecution(trade),
          {
            maxRetries: 2,
            initialDelay: 1000,
            onRetry: (attempt) => {
              logger.warn(`Retrying trade execution ${tradeId} (attempt ${attempt})`)
            },
          },
        )
      } else {
        await retry(
          () => this.executeRealTrade(trade),
          {
            maxRetries: 3,
            initialDelay: 2000,
            onRetry: (attempt) => {
              logger.warn(`Retrying real trade execution ${tradeId} (attempt ${attempt})`)
            },
          },
        )
      }

      // Validate profit calculation
      const calculatedProfit = opportunity.estimatedProfit * 0.9 // 90% of estimated
      if (!Number.isFinite(calculatedProfit)) {
        throw new ValidationError("Invalid profit calculation")
      }

      trade.status = "completed"
      trade.endTime = Date.now()
      trade.profit = calculatedProfit

      this.metrics.successfulTrades++
      this.metrics.totalProfit += trade.profit

      logger.info(`Trade ${tradeId} completed successfully. Profit: $${trade.profit.toFixed(2)}`)

      // Check and mint NFT badge if enabled
      if (this.nftMinter && config.stacks.walletAddress) {
        this.handleTradeCompletionForNFT(config.stacks.walletAddress, trade.profit).catch((error) => {
          logger.error("Error handling NFT minting for trade completion:", error)
        })
      }

      return tradeId
    } catch (error: unknown) {
      trade.status = "failed"
      trade.endTime = Date.now()
      trade.error = error instanceof Error ? error.message : String(error)

      this.metrics.failedTrades++

      logger.error(`Trade ${tradeId} failed:`, error)

      // Re-throw critical errors
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error
      }
      return tradeId
    } finally {
      this.metrics.totalTrades++
    }
  }

  private async simulateTradeExecution(trade: Trade): Promise<void> {
    // Simulate execution time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 90% success rate in demo mode
    if (Math.random() < 0.9) {
      return // Success
    } else {
      throw new Error("Simulated trade failure")
    }
  }

  private async executeRealTrade(trade: Trade): Promise<void> {
    try {
      // Validate trade
      if (!trade || !trade.opportunity) {
        throw new ValidationError("Invalid trade data for execution")
      }

      // Real trade execution would involve:
      // 1. Approve tokens
      // 2. Execute swap on source chain
      // 3. Bridge tokens
      // 4. Execute swap on destination chain
      // 5. Bridge back (if needed)

      // For now, throw a more descriptive error
      throw new ExecutionError(
        "Real trade execution not implemented - use demo mode for testing",
        undefined,
        { tradeId: trade.id },
      )
    } catch (error) {
      if (error instanceof ExecutionError || error instanceof ValidationError) {
        throw error
      }
      throw new ExecutionError("Failed to execute real trade", undefined, {
        tradeId: trade.id,
        originalError: error,
      })
    }
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getActiveTrades(): Trade[] {
    return Array.from(this.trades.values()).filter((t) => t.status === "executing")
  }

  /**
   * Handle trade completion for NFT badge minting
   */
  private async handleTradeCompletionForNFT(traderAddress: string, tradeProfit: number): Promise<void> {
    if (!this.nftMinter) return

    // Get or create trader stats
    let stats = this.traderStats.get(traderAddress)
    if (!stats) {
      stats = {
        address: traderAddress,
        totalTrades: 0,
        totalProfit: 0,
        lastTradeAt: new Date(),
      }
      this.traderStats.set(traderAddress, stats)
    }

    // Update stats
    stats.totalTrades += 1
    stats.totalProfit += tradeProfit
    stats.lastTradeAt = new Date()

    // Check if user qualifies for a badge
    const txId = await this.nftMinter.processTradeCompletion(traderAddress, tradeProfit, stats)
    if (txId) {
      logger.info(`NFT badge minted for trader ${traderAddress}: ${txId}`)
    }
  }

  getRecentTrades(limit = 20): Trade[] {
    return Array.from(this.trades.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit)
  }

  getMetrics() {
    return {
      ...this.metrics,
      winRate: this.metrics.totalTrades > 0 ? this.metrics.successfulTrades / this.metrics.totalTrades : 0,
      avgProfit: this.metrics.successfulTrades > 0 ? this.metrics.totalProfit / this.metrics.successfulTrades : 0,
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      activeTrades: this.getActiveTrades().length,
      metrics: this.getMetrics(),
    }
  }
}
