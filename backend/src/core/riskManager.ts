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

export interface DrawdownPeriod {
  startTime: number
  endTime?: number
  peakValue: number
  troughValue: number
  drawdown: number
  drawdownPercentage: number
  duration: number
  isActive: boolean
}

export interface RiskExposure {
  totalExposure: number
  activePositions: number
  maxPositionSize: number
  averagePositionSize: number
  leverage: number
  concentrationRisk: number
  liquidityRisk: number
}

export interface SafetyMetrics {
  sharpeRatio: number
  volatility: number
  maxDrawdown: number
  currentDrawdown: number
  winRate: number
  profitFactor: number
  riskAdjustedReturn: number
  safetyScore: number
}

export interface ComprehensiveRiskMetrics {
  dailyPnL: number
  dailyTradeCount: number
  circuitBreakerActive: boolean
  remainingDailyBuffer: number
  maxPositionSize: number
  riskExposure: RiskExposure
  safetyMetrics: SafetyMetrics
  drawdownPeriods: DrawdownPeriod[]
  currentDrawdownPeriod?: DrawdownPeriod
  equityCurve: Array<{ timestamp: number; value: number }>
}

export class RiskManager {
  private dailyPnL = 0
  private dailyTradeCount = 0
  private circuitBreakerActive = false
  private lastResetTime = Date.now()
  
  // Enhanced tracking for comprehensive metrics
  private equityCurve: Array<{ timestamp: number; value: number }> = []
  private drawdownPeriods: DrawdownPeriod[] = []
  private currentDrawdownPeriod: DrawdownPeriod | null = null
  private peakEquity = 0
  private totalProfit = 0
  private totalLoss = 0
  private profitableTrades = 0
  private losingTrades = 0
  private tradeReturns: number[] = []
  private activePositions: Map<string, number> = new Map()
  private positionHistory: Array<{ timestamp: number; size: number }> = []

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

  recordTrade(profit: number, positionSize?: number, positionId?: string): void {
    this.dailyPnL += profit
    this.dailyTradeCount++
    
    // Track profit/loss for safety metrics
    if (profit > 0) {
      this.totalProfit += profit
      this.profitableTrades++
    } else {
      this.totalLoss += Math.abs(profit)
      this.losingTrades++
    }
    
    // Calculate return percentage if position size is provided
    if (positionSize && positionSize > 0) {
      const returnPct = profit / positionSize
      this.tradeReturns.push(returnPct)
      // Keep only last 100 trades for volatility calculation
      if (this.tradeReturns.length > 100) {
        this.tradeReturns.shift()
      }
    }
    
    // Update equity curve
    const currentEquity = this.peakEquity + this.totalProfit - this.totalLoss
    this.equityCurve.push({
      timestamp: Date.now(),
      value: currentEquity,
    })
    
    // Keep only last 1000 data points
    if (this.equityCurve.length > 1000) {
      this.equityCurve.shift()
    }
    
    // Update peak equity
    if (currentEquity > this.peakEquity) {
      this.peakEquity = currentEquity
      // End current drawdown if we've reached a new peak
      if (this.currentDrawdownPeriod) {
        this.endDrawdownPeriod()
      }
    } else {
      // Track drawdown
      this.updateDrawdown(currentEquity)
    }
    
    // Track position
    if (positionId && positionSize) {
      this.activePositions.set(positionId, positionSize)
      this.positionHistory.push({
        timestamp: Date.now(),
        size: positionSize,
      })
      // Keep only last 1000 position records
      if (this.positionHistory.length > 1000) {
        this.positionHistory.shift()
      }
    }
    
    // Remove closed positions (after a delay)
    if (positionId) {
      setTimeout(() => {
        this.activePositions.delete(positionId)
      }, 60000) // Remove after 1 minute
    }

    // Check if circuit breaker should activate
    if (this.dailyPnL < config.risk.dailyLossLimit * config.risk.circuitBreakerThreshold) {
      this.activateCircuitBreaker()
    }

    // Reset daily counters at midnight
    this.checkDailyReset()
  }
  
  private updateDrawdown(currentEquity: number): void {
    const drawdown = this.peakEquity - currentEquity
    const drawdownPercentage = this.peakEquity > 0 ? drawdown / this.peakEquity : 0
    
    if (!this.currentDrawdownPeriod) {
      // Start new drawdown period
      this.currentDrawdownPeriod = {
        startTime: Date.now(),
        peakValue: this.peakEquity,
        troughValue: currentEquity,
        drawdown,
        drawdownPercentage,
        duration: 0,
        isActive: true,
      }
    } else {
      // Update existing drawdown period
      if (currentEquity < this.currentDrawdownPeriod.troughValue) {
        this.currentDrawdownPeriod.troughValue = currentEquity
        this.currentDrawdownPeriod.drawdown = drawdown
        this.currentDrawdownPeriod.drawdownPercentage = drawdownPercentage
      }
      this.currentDrawdownPeriod.duration = Date.now() - this.currentDrawdownPeriod.startTime
    }
  }
  
  private endDrawdownPeriod(): void {
    if (this.currentDrawdownPeriod) {
      this.currentDrawdownPeriod.endTime = Date.now()
      this.currentDrawdownPeriod.duration = this.currentDrawdownPeriod.endTime - this.currentDrawdownPeriod.startTime
      this.currentDrawdownPeriod.isActive = false
      this.drawdownPeriods.push(this.currentDrawdownPeriod)
      
      // Keep only last 50 drawdown periods
      if (this.drawdownPeriods.length > 50) {
        this.drawdownPeriods.shift()
      }
      
      this.currentDrawdownPeriod = null
    }
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
  
  private calculateVolatility(): number {
    if (this.tradeReturns.length < 2) return 0
    
    const mean = this.tradeReturns.reduce((a, b) => a + b, 0) / this.tradeReturns.length
    const variance = this.tradeReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / this.tradeReturns.length
    return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility (assuming daily trades)
  }
  
  private calculateSharpeRatio(): number {
    if (this.tradeReturns.length < 2) return 0
    
    const mean = this.tradeReturns.reduce((a, b) => a + b, 0) / this.tradeReturns.length
    const volatility = this.calculateVolatility()
    
    if (volatility === 0) return 0
    
    // Risk-free rate assumed to be 0 for simplicity
    return (mean * Math.sqrt(252)) / volatility // Annualized Sharpe ratio
  }
  
  private calculateMaxDrawdown(): number {
    if (this.drawdownPeriods.length === 0 && !this.currentDrawdownPeriod) return 0
    
    const allDrawdowns = [
      ...this.drawdownPeriods.map(d => d.drawdownPercentage),
      ...(this.currentDrawdownPeriod ? [this.currentDrawdownPeriod.drawdownPercentage] : []),
    ]
    
    return Math.max(...allDrawdowns, 0)
  }
  
  private calculateCurrentDrawdown(): number {
    if (!this.currentDrawdownPeriod) return 0
    return this.currentDrawdownPeriod.drawdownPercentage
  }
  
  private calculateRiskExposure(): RiskExposure {
    const activePositionsArray = Array.from(this.activePositions.values())
    const totalExposure = activePositionsArray.reduce((sum, size) => sum + size, 0)
    const activePositionsCount = activePositionsArray.length
    const averagePositionSize = activePositionsCount > 0 ? totalExposure / activePositionsCount : 0
    
    // Calculate concentration risk (how much is in largest position)
    const maxPosition = activePositionsArray.length > 0 ? Math.max(...activePositionsArray) : 0
    const concentrationRisk = totalExposure > 0 ? maxPosition / totalExposure : 0
    
    // Leverage (simplified - assuming no borrowing for now)
    const leverage = 1.0
    
    // Liquidity risk (based on position sizes vs max)
    const liquidityRisk = config.risk.maxPositionSize > 0 
      ? Math.min(totalExposure / (config.risk.maxPositionSize * config.risk.maxConcurrentTrades), 1)
      : 0
    
    return {
      totalExposure,
      activePositions: activePositionsCount,
      maxPositionSize: config.risk.maxPositionSize,
      averagePositionSize,
      leverage,
      concentrationRisk,
      liquidityRisk,
    }
  }
  
  private calculateSafetyMetrics(): SafetyMetrics {
    const sharpeRatio = this.calculateSharpeRatio()
    const volatility = this.calculateVolatility()
    const maxDrawdown = this.calculateMaxDrawdown()
    const currentDrawdown = this.calculateCurrentDrawdown()
    
    const totalTrades = this.profitableTrades + this.losingTrades
    const winRate = totalTrades > 0 ? this.profitableTrades / totalTrades : 0
    
    const profitFactor = this.totalLoss > 0 ? this.totalProfit / this.totalLoss : this.totalProfit > 0 ? 10 : 0
    
    // Risk-adjusted return (annualized return / volatility)
    const annualizedReturn = this.tradeReturns.length > 0
      ? (this.tradeReturns.reduce((a, b) => a + b, 0) / this.tradeReturns.length) * 252
      : 0
    const riskAdjustedReturn = volatility > 0 ? annualizedReturn / volatility : 0
    
    // Safety score (0-100) based on multiple factors
    const drawdownScore = Math.max(0, 100 - (maxDrawdown * 2000)) // Penalize high drawdown
    const sharpeScore = Math.min(100, sharpeRatio * 20) // Reward high Sharpe
    const winRateScore = winRate * 100
    const profitFactorScore = Math.min(100, profitFactor * 10)
    
    const safetyScore = (drawdownScore * 0.3 + sharpeScore * 0.3 + winRateScore * 0.2 + profitFactorScore * 0.2)
    
    return {
      sharpeRatio,
      volatility,
      maxDrawdown,
      currentDrawdown,
      winRate,
      profitFactor,
      riskAdjustedReturn,
      safetyScore,
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
  
  getComprehensiveRiskMetrics(): ComprehensiveRiskMetrics {
    const riskExposure = this.calculateRiskExposure()
    const safetyMetrics = this.calculateSafetyMetrics()
    
    return {
      dailyPnL: this.dailyPnL,
      dailyTradeCount: this.dailyTradeCount,
      circuitBreakerActive: this.circuitBreakerActive,
      remainingDailyBuffer: config.risk.dailyLossLimit - Math.abs(this.dailyPnL),
      maxPositionSize: config.risk.maxPositionSize,
      riskExposure,
      safetyMetrics,
      drawdownPeriods: [...this.drawdownPeriods],
      currentDrawdownPeriod: this.currentDrawdownPeriod || undefined,
      equityCurve: [...this.equityCurve],
    }
  }

  isHealthy(): boolean {
    return !this.circuitBreakerActive && this.dailyPnL > config.risk.dailyLossLimit
  }
}
