/**
 * Transaction Queue Manager
 * Handles transaction queuing, priority, and status tracking for Stacks blockchain
 */

import { logger } from "../utils/logger"
import { BlockchainError, getErrorMessage } from "../utils/errors"

export type TransactionPriority = "low" | "medium" | "high" | "urgent"
export type TransactionState = "queued" | "pending" | "broadcasted" | "confirmed" | "failed"

export interface QueuedTransaction {
  id: string
  txId?: string
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: unknown[]
  priority: TransactionPriority
  state: TransactionState
  createdAt: number
  updatedAt: number
  attempts: number
  maxAttempts: number
  error?: string
  metadata?: Record<string, unknown>
}

export interface TransactionQueueConfig {
  maxConcurrent?: number
  maxRetries?: number
  retryDelayMs?: number
  priorityWeights?: Record<TransactionPriority, number>
}

const DEFAULT_CONFIG: Required<TransactionQueueConfig> = {
  maxConcurrent: 3,
  maxRetries: 3,
  retryDelayMs: 5000,
  priorityWeights: {
    urgent: 100,
    high: 75,
    medium: 50,
    low: 25,
  },
}

export class TransactionQueue {
  private queue: Map<string, QueuedTransaction> = new Map()
  private processing: Set<string> = new Set()
  private config: Required<TransactionQueueConfig>
  private listeners: Map<string, (tx: QueuedTransaction) => void> = new Map()

  constructor(config: TransactionQueueConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Add a transaction to the queue
   */
  enqueue(params: {
    contractAddress: string
    contractName: string
    functionName: string
    functionArgs: unknown[]
    priority?: TransactionPriority
    metadata?: Record<string, unknown>
  }): string {
    const id = this.generateId()
    const now = Date.now()

    const tx: QueuedTransaction = {
      id,
      contractAddress: params.contractAddress,
      contractName: params.contractName,
      functionName: params.functionName,
      functionArgs: params.functionArgs,
      priority: params.priority || "medium",
      state: "queued",
      createdAt: now,
      updatedAt: now,
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      metadata: params.metadata,
    }

    this.queue.set(id, tx)
    logger.info(`Transaction ${id} queued: ${params.contractName}.${params.functionName}`)

    return id
  }

  /**
   * Get next transactions to process (sorted by priority)
   */
  getNext(count: number = 1): QueuedTransaction[] {
    const available = Array.from(this.queue.values())
      .filter(tx => tx.state === "queued" && !this.processing.has(tx.id))
      .sort((a, b) => {
        // Sort by priority weight (higher first), then by creation time (older first)
        const weightDiff = this.config.priorityWeights[b.priority] - this.config.priorityWeights[a.priority]
        if (weightDiff !== 0) return weightDiff
        return a.createdAt - b.createdAt
      })

    return available.slice(0, count)
  }

  /**
   * Mark transaction as being processed
   */
  markProcessing(id: string): boolean {
    const tx = this.queue.get(id)
    if (!tx || this.processing.has(id)) {
      return false
    }

    this.processing.add(id)
    tx.state = "pending"
    tx.attempts++
    tx.updatedAt = Date.now()
    
    this.notifyListeners(tx)
    return true
  }

  /**
   * Update transaction with broadcast result
   */
  markBroadcasted(id: string, txId: string): boolean {
    const tx = this.queue.get(id)
    if (!tx) return false

    tx.txId = txId
    tx.state = "broadcasted"
    tx.updatedAt = Date.now()
    this.processing.delete(id)

    logger.info(`Transaction ${id} broadcasted with txId: ${txId}`)
    this.notifyListeners(tx)
    return true
  }

  /**
   * Mark transaction as confirmed
   */
  markConfirmed(id: string): boolean {
    const tx = this.queue.get(id)
    if (!tx) return false

    tx.state = "confirmed"
    tx.updatedAt = Date.now()
    this.processing.delete(id)

    logger.info(`Transaction ${id} confirmed`)
    this.notifyListeners(tx)
    return true
  }

  /**
   * Mark transaction as failed
   */
  markFailed(id: string, error: string, shouldRetry: boolean = true): boolean {
    const tx = this.queue.get(id)
    if (!tx) return false

    this.processing.delete(id)
    tx.error = error
    tx.updatedAt = Date.now()

    if (shouldRetry && tx.attempts < tx.maxAttempts) {
      tx.state = "queued"
      logger.warn(`Transaction ${id} failed (attempt ${tx.attempts}/${tx.maxAttempts}), will retry: ${error}`)
    } else {
      tx.state = "failed"
      logger.error(`Transaction ${id} permanently failed: ${error}`)
    }

    this.notifyListeners(tx)
    return true
  }

  /**
   * Get transaction by ID
   */
  get(id: string): QueuedTransaction | undefined {
    return this.queue.get(id)
  }

  /**
   * Get transaction by txId
   */
  getByTxId(txId: string): QueuedTransaction | undefined {
    return Array.from(this.queue.values()).find(tx => tx.txId === txId)
  }

  /**
   * Remove transaction from queue
   */
  remove(id: string): boolean {
    this.processing.delete(id)
    this.listeners.delete(id)
    return this.queue.delete(id)
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number
    queued: number
    pending: number
    broadcasted: number
    confirmed: number
    failed: number
    processing: number
  } {
    const stats = {
      total: this.queue.size,
      queued: 0,
      pending: 0,
      broadcasted: 0,
      confirmed: 0,
      failed: 0,
      processing: this.processing.size,
    }

    for (const tx of this.queue.values()) {
      stats[tx.state]++
    }

    return stats
  }

  /**
   * Subscribe to transaction updates
   */
  subscribe(id: string, callback: (tx: QueuedTransaction) => void): () => void {
    this.listeners.set(id, callback)
    return () => this.listeners.delete(id)
  }

  /**
   * Notify listeners of transaction updates
   */
  private notifyListeners(tx: QueuedTransaction): void {
    const listener = this.listeners.get(tx.id)
    if (listener) {
      try {
        listener(tx)
      } catch (error) {
        logger.error(`Error in transaction listener for ${tx.id}:`, error)
      }
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Clear completed transactions older than specified age
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs
    let cleaned = 0

    for (const [id, tx] of this.queue) {
      if ((tx.state === "confirmed" || tx.state === "failed") && tx.updatedAt < cutoff) {
        this.queue.delete(id)
        this.listeners.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old transactions`)
    }

    return cleaned
  }
}

// Singleton instance
let queueInstance: TransactionQueue | null = null

export function getTransactionQueue(config?: TransactionQueueConfig): TransactionQueue {
  if (!queueInstance) {
    queueInstance = new TransactionQueue(config)
  }
  return queueInstance
}
