import { logger } from "../utils/logger"
import { PaymentProcessor, PaymentResult } from "./paymentProcessor"
import { retry } from "../utils/retry"

export interface PaymentMetrics {
  totalPayments: number
  successfulPayments: number
  failedPayments: number
  averageProcessingTime: number
  totalGasCost: number
  totalBridgeFees: number
  averageFee: number
  successRate: number
}

/**
 * Payment Monitor - Monitors and tracks payment processing
 */
export class PaymentMonitor {
  private processor: PaymentProcessor
  private metrics: Map<string, PaymentMetrics> = new Map()
  private paymentHistory: PaymentResult[] = []
  private maxHistorySize = 1000
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(processor: PaymentProcessor) {
    this.processor = processor
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return
    }

    // Update metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics()
    }, 30000)

    logger.info("Payment Monitor started")
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    logger.info("Payment Monitor stopped")
  }

  /**
   * Record payment result
   */
  recordPayment(result: PaymentResult): void {
    this.paymentHistory.push(result)

    // Maintain history size
    if (this.paymentHistory.length > this.maxHistorySize) {
      this.paymentHistory.shift()
    }

    // Update metrics
    this.updateMetrics()
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const allTime = this.calculateMetrics(this.paymentHistory)
    this.metrics.set("allTime", allTime)

    // Calculate last hour metrics
    const oneHourAgo = Date.now() - 3600000
    const recentPayments = this.paymentHistory.filter(
      (p) => p.completedAt && p.completedAt > oneHourAgo,
    )
    const lastHour = this.calculateMetrics(recentPayments)
    this.metrics.set("lastHour", lastHour)

    // Log metrics
    logger.debug("Payment metrics updated", {
      allTime: {
        total: allTime.totalPayments,
        successRate: `${(allTime.successRate * 100).toFixed(2)}%`,
        avgFee: `$${allTime.averageFee.toFixed(4)}`,
      },
      lastHour: {
        total: lastHour.totalPayments,
        successRate: `${(lastHour.successRate * 100).toFixed(2)}%`,
      },
    })
  }

  /**
   * Calculate metrics from payment results
   */
  private calculateMetrics(payments: PaymentResult[]): PaymentMetrics {
    const totalPayments = payments.length
    const successfulPayments = payments.filter((p) => p.status === "completed").length
    const failedPayments = payments.filter((p) => p.status === "failed").length

    const completedPayments = payments.filter((p) => p.status === "completed" && p.completedAt && p.createdAt)
    const processingTimes = completedPayments.map((p) => (p.completedAt! - p.createdAt) / 1000)
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0

    const totalGasCost = payments
      .filter((p) => p.totalCost)
      .reduce((sum, p) => sum + (p.totalCost || 0), 0)

    const totalBridgeFees = payments
      .filter((p) => p.fee)
      .reduce((sum, p) => sum + (p.fee || 0), 0)

    const fees = payments.filter((p) => p.fee).map((p) => p.fee!)
    const averageFee = fees.length > 0 ? fees.reduce((sum, fee) => sum + fee, 0) / fees.length : 0

    const successRate = totalPayments > 0 ? successfulPayments / totalPayments : 0

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      averageProcessingTime,
      totalGasCost,
      totalBridgeFees,
      averageFee,
      successRate,
    }
  }

  /**
   * Get metrics
   */
  getMetrics(period: "allTime" | "lastHour" = "allTime"): PaymentMetrics | null {
    return this.metrics.get(period) || null
  }

  /**
   * Get payment history
   */
  getHistory(limit = 100): PaymentResult[] {
    return this.paymentHistory.slice(-limit).reverse()
  }

  /**
   * Get failed payments
   */
  getFailedPayments(limit = 50): PaymentResult[] {
    return this.paymentHistory
      .filter((p) => p.status === "failed")
      .slice(-limit)
      .reverse()
  }

  /**
   * Check payment health
   */
  checkHealth(): {
    healthy: boolean
    issues: string[]
    metrics: PaymentMetrics | null
  } {
    const metrics = this.getMetrics("lastHour")
    const issues: string[] = []

    if (!metrics) {
      return {
        healthy: false,
        issues: ["No metrics available"],
        metrics: null,
      }
    }

    // Check success rate
    if (metrics.successRate < 0.9 && metrics.totalPayments > 10) {
      issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(2)}%`)
    }

    // Check average processing time
    if (metrics.averageProcessingTime > 300) {
      issues.push(`High average processing time: ${metrics.averageProcessingTime.toFixed(2)}s`)
    }

    // Check for recent failures
    if (metrics.failedPayments > metrics.successfulPayments && metrics.totalPayments > 5) {
      issues.push("More failures than successes in the last hour")
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics,
    }
  }
}

