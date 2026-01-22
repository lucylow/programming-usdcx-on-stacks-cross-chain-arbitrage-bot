import type { TransactionStatus } from "./stacks-wallet"

export interface TransactionMonitorOptions {
  pollInterval?: number
  maxPollAttempts?: number
  onStatusChange?: (status: TransactionStatus) => void
  onComplete?: (status: TransactionStatus) => void
  onError?: (error: Error) => void
}

/**
 * Monitor Stacks transactions with automatic polling
 */
export class TransactionMonitor {
  private pollInterval: number
  private maxPollAttempts: number
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map()
  private pollCounts: Map<string, number> = new Map()

  constructor(
    private getStatus: (txId: string) => Promise<TransactionStatus>,
    options: TransactionMonitorOptions = {},
  ) {
    this.pollInterval = options.pollInterval || 5000
    this.maxPollAttempts = options.maxPollAttempts || 60 // 5 minutes default
  }

  /**
   * Start monitoring a transaction
   */
  async monitor(
    txId: string,
    options: TransactionMonitorOptions = {},
  ): Promise<TransactionStatus> {
    return new Promise((resolve, reject) => {
      let pollCount = 0

      const poll = async () => {
        try {
          pollCount++
          this.pollCounts.set(txId, pollCount)

          const status = await this.getStatus(txId)

          // Call status change callback
          if (options.onStatusChange) {
            options.onStatusChange(status)
          }

          // Check if transaction is complete
          if (status.status === "success" || status.status === "failed") {
            this.stop(txId)

            if (options.onComplete) {
              options.onComplete(status)
            }

            resolve(status)
            return
          }

          // Check if we've exceeded max attempts
          if (pollCount >= (options.maxPollAttempts || this.maxPollAttempts)) {
            this.stop(txId)
            const error = new Error(`Transaction monitoring timeout after ${pollCount} attempts`)
            if (options.onError) {
              options.onError(error)
            }
            reject(error)
            return
          }

          // Schedule next poll with adaptive interval
          const adaptiveInterval = this.getAdaptiveInterval(pollCount)
          const timeoutId = setTimeout(poll, adaptiveInterval)
          this.activeMonitors.set(txId, timeoutId)
        } catch (error) {
          this.stop(txId)
          const err = error instanceof Error ? error : new Error(String(error))
          if (options.onError) {
            options.onError(err)
          }
          reject(err)
        }
      }

      // Start polling immediately
      poll()
    })
  }

  /**
   * Stop monitoring a transaction
   */
  stop(txId: string): void {
    const timeoutId = this.activeMonitors.get(txId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.activeMonitors.delete(txId)
      this.pollCounts.delete(txId)
    }
  }

  /**
   * Stop all active monitors
   */
  stopAll(): void {
    this.activeMonitors.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.activeMonitors.clear()
    this.pollCounts.clear()
  }

  /**
   * Get adaptive polling interval based on poll count
   * Increases interval as time goes on
   */
  private getAdaptiveInterval(pollCount: number): number {
    if (pollCount < 6) {
      return this.pollInterval // First 30 seconds: 5s intervals
    } else if (pollCount < 12) {
      return this.pollInterval * 2 // Next 60 seconds: 10s intervals
    } else {
      return this.pollInterval * 4 // After that: 20s intervals
    }
  }

  /**
   * Get active monitor count
   */
  getActiveCount(): number {
    return this.activeMonitors.size
  }

  /**
   * Check if a transaction is being monitored
   */
  isMonitoring(txId: string): boolean {
    return this.activeMonitors.has(txId)
  }
}


