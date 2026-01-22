import { config } from "../config"
import { logger } from "../utils/logger"
import type { ArbitrageOpportunity } from "./priceOracle"

export interface RiskAssessment {
  approved: boolean
  reason?: string
  maxAmount?: number
  confidenceScore: number
  warnings: string[]
}

export class RiskManager {
  private dailyPnL = 0
  private dailyTradeCount = 0
  private circuitBreakerActive = false
  private lastResetTime = Date.now()

  validateOpportunity(opportunity: ArbitrageOpportunity): RiskAssessment {
    const warnings: string[] = []
    let approved = true
    let reason: string | undefined
    let confidenceScore = opportunity.confidence

    // Check circuit breaker
    if (this.circuitBreakerActive) {
      return {
        approved: false,
        reason: "Circuit breaker is active",
        confidenceScore: 0,
        warnings: ["Trading halted due to risk limits"],
      }
    }

    // Check daily loss limit
    if (this.dailyPnL < config.risk.dailyLossLimit) {
      return {
        approved: false,
        reason: "Daily loss limit reached",
        confidenceScore: 0,
        warnings: [`Daily loss: $${Math.abs(this.dailyPnL).toFixed(2)}`],
      }
    }

    // Check minimum profit threshold
    if (opportunity.estimatedProfit < config.risk.minProfitThreshold * 10000) {
      approved = false
      reason = "Profit below minimum threshold"
      warnings.push(`Profit too low: $${opportunity.estimatedProfit.toFixed(2)}`)
    }

    // Check spread validity
    if (opportunity.spread < 0 || opportunity.spread > 0.5) {
      approved = false
      reason = "Invalid spread detected"
      warnings.push(`Unusual spread: ${(opportunity.spread * 100).toFixed(2)}%`)
      confidenceScore *= 0.5
    }

    // Check confidence score
    if (opportunity.confidence < 0.6) {
      warnings.push("Low confidence opportunity")
      confidenceScore *= 0.8
    }

    // Check if spread is too good to be true
    if (opportunity.spread > 0.1) {
      warnings.push("Suspiciously high spread - possible data error")
      confidenceScore *= 0.6
    }

    // Adjust max amount based on risk
    const maxAmount = this.calculateMaxTradeAmount(opportunity)

    // Final approval check
    if (!approved) {
      confidenceScore = 0
    }

    return {
      approved,
      reason,
      maxAmount,
      confidenceScore,
      warnings,
    }
  }

  private calculateMaxTradeAmount(opportunity: ArbitrageOpportunity): number {
    // Start with configured max position size
    let maxAmount = config.risk.maxPositionSize

    // Reduce based on confidence
    maxAmount *= opportunity.confidence

    // Reduce based on spread (higher spread = higher risk)
    if (opportunity.spread > 0.05) {
      maxAmount *= 0.5
    }

    // Reduce if approaching daily loss limit
    const remainingBuffer = Math.abs(config.risk.dailyLossLimit - this.dailyPnL)
    if (remainingBuffer < maxAmount * 0.5) {
      maxAmount = remainingBuffer * 0.5
    }

    return Math.max(1000, maxAmount) // Minimum $1000
  }

  recordTrade(profit: number): void {
    this.dailyPnL += profit
    this.dailyTradeCount++

    // Check if circuit breaker should activate
    if (this.dailyPnL < config.risk.dailyLossLimit * config.risk.circuitBreakerThreshold) {
      this.activateCircuitBreaker()
    }

    // Reset daily counters at midnight
    this.checkDailyReset()
  }

  private activateCircuitBreaker(): void {
    this.circuitBreakerActive = true
    logger.warn("🚨 Circuit breaker activated due to excessive losses")
  }

  deactivateCircuitBreaker(): void {
    this.circuitBreakerActive = false
    logger.info("✅ Circuit breaker deactivated")
  }

  private checkDailyReset(): void {
    const now = Date.now()
    const timeSinceReset = now - this.lastResetTime

    // Reset every 24 hours
    if (timeSinceReset > 24 * 60 * 60 * 1000) {
      this.dailyPnL = 0
      this.dailyTradeCount = 0
      this.lastResetTime = now
      this.circuitBreakerActive = false
      logger.info("📊 Daily risk metrics reset")
    }
  }

  getRiskMetrics() {
    return {
      dailyPnL: this.dailyPnL,
      dailyTradeCount: this.dailyTradeCount,
      circuitBreakerActive: this.circuitBreakerActive,
      remainingDailyBuffer: config.risk.dailyLossLimit - Math.abs(this.dailyPnL),
      maxPositionSize: config.risk.maxPositionSize,
    }
  }

  isHealthy(): boolean {
    return !this.circuitBreakerActive && this.dailyPnL > config.risk.dailyLossLimit
  }
}
