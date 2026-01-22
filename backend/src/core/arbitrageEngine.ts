import type { PriceOracle, ArbitrageOpportunity } from "./priceOracle"
import { config } from "../config"
import { logger } from "../utils/logger"

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

  // Performance metrics
  private metrics = {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    totalVolume: 0,
  }

  constructor(priceOracle: PriceOracle) {
    this.priceOracle = priceOracle
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Arbitrage engine already running")
      return
    }

    logger.info("Starting Arbitrage Engine...")
    this.isRunning = true

    // Start opportunity scanning
    this.scanInterval = setInterval(() => {
      this.scanOpportunities()
    }, 1000) // Scan every second

    logger.info("Arbitrage Engine started successfully")
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

      // Execute top opportunities
      for (const opportunity of opportunities.slice(0, config.risk.maxConcurrentTrades)) {
        if (this.shouldExecute(opportunity)) {
          await this.executeTrade(opportunity)
        }
      }
    } catch (error) {
      logger.error("Error scanning opportunities:", error)
    }
  }

  private shouldExecute(opportunity: ArbitrageOpportunity): boolean {
    // Check if already executing
    const activeTrades = Array.from(this.trades.values()).filter((t) => t.status === "executing")

    if (activeTrades.length >= config.risk.maxConcurrentTrades) {
      return false
    }

    // Check profitability
    if (opportunity.estimatedProfit < config.risk.minProfitThreshold * 10000) {
      return false
    }

    // Check confidence
    if (opportunity.confidence < 0.7) {
      return false
    }

    return true
  }

  private async executeTrade(opportunity: ArbitrageOpportunity): Promise<void> {
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
      // Simulate trade execution in demo mode
      if (config.mode === "demo") {
        await this.simulateTradeExecution(trade)
      } else {
        await this.executeRealTrade(trade)
      }

      trade.status = "completed"
      trade.endTime = Date.now()
      trade.profit = opportunity.estimatedProfit * 0.9 // 90% of estimated

      this.metrics.successfulTrades++
      this.metrics.totalProfit += trade.profit

      logger.info(`Trade ${tradeId} completed successfully. Profit: $${trade.profit.toFixed(2)}`)
    } catch (error: any) {
      trade.status = "failed"
      trade.endTime = Date.now()
      trade.error = error.message

      this.metrics.failedTrades++

      logger.error(`Trade ${tradeId} failed:`, error)
    }

    this.metrics.totalTrades++
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
    // Real trade execution would involve:
    // 1. Approve tokens
    // 2. Execute swap on source chain
    // 3. Bridge tokens
    // 4. Execute swap on destination chain
    // 5. Bridge back (if needed)

    throw new Error("Real trade execution not implemented")
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getActiveTrades(): Trade[] {
    return Array.from(this.trades.values()).filter((t) => t.status === "executing")
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
