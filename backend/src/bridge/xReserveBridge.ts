import axios, { type AxiosInstance, AxiosError } from "axios"
import { logger } from "../utils/logger"
import { BridgeError, NetworkError, TimeoutError, ValidationError } from "../utils/errors"
import { retry } from "../utils/retry"

export interface BridgeOperation {
  id: string
  type: "deposit" | "withdrawal"
  status: "pending" | "processing" | "completed" | "failed"
  amount: number
  sourceChain: string
  destinationChain: string
  sourceAddress: string
  destinationAddress: string
  transactionHash?: string
  bridgeTxId?: string
  attestation?: string
  estimatedCompletionTime?: number
  actualCompletionTime?: number
  createdAt: number
  updatedAt: number
}

export interface BridgeQueueStatus {
  queueLength: number
  estimatedWaitTime: number
  averageProcessingTime: number
  currentGasPrice: number
}

export class XReserveBridge {
  private api: AxiosInstance
  private operations: Map<string, BridgeOperation> = new Map()
  private pollingInterval: NodeJS.Timeout | null = null

  constructor(apiKey: string) {
    this.api = axios.create({
      baseURL: "https://xreserve.circle.com/api/v1",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    })
  }

  async initialize(): Promise<void> {
    logger.info("Initializing Circle xReserve Bridge...")

    // Verify API connection with retry
    try {
      await retry(
        () => this.getQueueStatus(),
        {
          maxRetries: 3,
          initialDelay: 2000,
          onRetry: (attempt) => {
            logger.warn(`Retrying xReserve Bridge initialization (attempt ${attempt})`)
          },
        },
      )
      logger.info("xReserve Bridge connection verified")
    } catch (error) {
      logger.error("Failed to connect to xReserve Bridge:", error)
      throw new BridgeError("xReserve Bridge initialization failed", { originalError: error })
    }

    // Start status polling
    this.startPolling()
  }

  async depositToStacks(amount: number, stacksAddress: string, ethereumTxHash?: string): Promise<BridgeOperation> {
    // Validate inputs
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError(`Invalid deposit amount: ${amount}`)
    }

    if (!stacksAddress || stacksAddress.length === 0) {
      throw new ValidationError("Stacks address is required for deposit")
    }

    try {
      logger.info(`Initiating deposit to Stacks: ${amount} USDC`)

      const response = await retry(
        () =>
          this.api.post("/deposits", {
            amount: amount.toString(),
            sourceAsset: "usdc",
            destinationAsset: "usdcx",
            sourceChain: "ethereum",
            destinationChain: "stacks",
            destinationAddress: stacksAddress,
            sourceTransactionHash: ethereumTxHash,
            metadata: {
              purpose: "arbitrage_bot",
              timestamp: Date.now(),
            },
          }),
        {
          maxRetries: 3,
          initialDelay: 2000,
          onRetry: (attempt) => {
            logger.warn(`Retrying deposit initiation (attempt ${attempt})`)
          },
        },
      )

      const operation: BridgeOperation = {
        id: response.data.id || this.generateOperationId(),
        type: "deposit",
        status: "pending",
        amount,
        sourceChain: "ethereum",
        destinationChain: "stacks",
        sourceAddress: "eth_address", // Would come from config
        destinationAddress: stacksAddress,
        transactionHash: ethereumTxHash,
        bridgeTxId: response.data.bridgeTransactionId,
        estimatedCompletionTime: Date.now() + 15 * 60 * 1000, // 15 minutes
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Validate response
      if (!response.data) {
        throw new BridgeError("Invalid response from bridge API")
      }

      this.operations.set(operation.id, operation)
      logger.info(`Deposit initiated: ${operation.id}`)

      return operation
    } catch (error: any) {
      logger.error("Deposit initiation failed:", error.response?.data || error.message)

      // Handle specific error types
      if (error instanceof ValidationError || error instanceof BridgeError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
          throw new NetworkError("Network error during deposit initiation", { originalError: error })
        }
        if (error.response?.status === 400) {
          throw new ValidationError(error.response.data?.message || "Invalid deposit request", {
            originalError: error,
          })
        }
        if (error.response?.status >= 500) {
          throw new BridgeError("Bridge service error", { status: error.response.status, originalError: error })
        }
      }

      throw new BridgeError(`Failed to initiate deposit: ${error.message}`, { originalError: error })
    }
  }

  async withdrawToEthereum(amount: number, ethereumAddress: string, attestation: string): Promise<BridgeOperation> {
    // Validate inputs
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError(`Invalid withdrawal amount: ${amount}`)
    }

    if (!ethereumAddress || ethereumAddress.length === 0) {
      throw new ValidationError("Ethereum address is required for withdrawal")
    }

    if (!attestation || attestation.length === 0) {
      throw new ValidationError("Attestation is required for withdrawal")
    }

    try {
      logger.info(`Initiating withdrawal to Ethereum: ${amount} USDCx`)

      const response = await retry(
        () =>
          this.api.post("/withdrawals", {
            amount: amount.toString(),
            sourceAsset: "usdcx",
            destinationAsset: "usdc",
            sourceChain: "stacks",
            destinationChain: "ethereum",
            destinationAddress: ethereumAddress,
            attestation,
            metadata: {
              purpose: "arbitrage_bot",
              timestamp: Date.now(),
            },
          }),
        {
          maxRetries: 3,
          initialDelay: 2000,
          onRetry: (attempt) => {
            logger.warn(`Retrying withdrawal initiation (attempt ${attempt})`)
          },
        },
      )

      const operation: BridgeOperation = {
        id: response.data.id || this.generateOperationId(),
        type: "withdrawal",
        status: "pending",
        amount,
        sourceChain: "stacks",
        destinationChain: "ethereum",
        sourceAddress: "stacks_address", // Would come from config
        destinationAddress: ethereumAddress,
        bridgeTxId: response.data.bridgeTransactionId,
        attestation,
        estimatedCompletionTime: Date.now() + 30 * 60 * 1000, // 30 minutes
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Validate response
      if (!response.data) {
        throw new BridgeError("Invalid response from bridge API")
      }

      this.operations.set(operation.id, operation)
      logger.info(`Withdrawal initiated: ${operation.id}`)

      return operation
    } catch (error: any) {
      logger.error("Withdrawal initiation failed:", error.response?.data || error.message)

      // Handle specific error types
      if (error instanceof ValidationError || error instanceof BridgeError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
          throw new NetworkError("Network error during withdrawal initiation", { originalError: error })
        }
        if (error.response?.status === 400) {
          throw new ValidationError(error.response.data?.message || "Invalid withdrawal request", {
            originalError: error,
          })
        }
        if (error.response?.status >= 500) {
          throw new BridgeError("Bridge service error", { status: error.response.status, originalError: error })
        }
      }

      throw new BridgeError(`Failed to initiate withdrawal: ${error.message}`, { originalError: error })
    }
  }

  async getOperationStatus(operationId: string): Promise<BridgeOperation> {
    // Validate input
    if (!operationId || operationId.length === 0) {
      throw new ValidationError("Operation ID is required")
    }

    try {
      const response = await retry(
        () => this.api.get(`/operations/${operationId}`),
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (attempt) => {
            logger.warn(`Retrying status check for operation ${operationId} (attempt ${attempt})`)
          },
        },
      )

      const data = response.data

      // Validate response data
      if (!data) {
        throw new BridgeError("Invalid response data from bridge API")
      }

      const operation: BridgeOperation = {
        id: operationId,
        type: data.type,
        status: this.mapStatus(data.status),
        amount: Number.parseFloat(data.amount),
        sourceChain: data.sourceChain,
        destinationChain: data.destinationChain,
        sourceAddress: data.sourceAddress,
        destinationAddress: data.destinationAddress,
        transactionHash: data.sourceTransactionHash,
        bridgeTxId: data.bridgeTransactionId,
        attestation: data.attestation,
        estimatedCompletionTime: data.estimatedCompletionTime
          ? new Date(data.estimatedCompletionTime).getTime()
          : undefined,
        actualCompletionTime: data.completedAt ? new Date(data.completedAt).getTime() : undefined,
        createdAt: new Date(data.createdAt).getTime(),
        updatedAt: Date.now(),
      }

      // Validate parsed operation
      if (!Number.isFinite(operation.amount) || operation.amount <= 0) {
        throw new ValidationError("Invalid operation amount in response")
      }

      this.operations.set(operationId, operation)
      return operation
    } catch (error: any) {
      logger.error(`Failed to get status for operation ${operationId}:`, error.message)

      // Return cached operation if available (graceful degradation)
      const cached = this.operations.get(operationId)
      if (cached) {
        logger.warn(`Returning cached operation status for ${operationId}`)
        return cached
      }

      // Handle specific error types
      if (error instanceof ValidationError || error instanceof BridgeError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new BridgeError(`Operation ${operationId} not found`, { operationId })
        }
        if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
          throw new NetworkError("Network error while fetching operation status", { originalError: error })
        }
      }

      throw new BridgeError(`Failed to get operation status: ${error.message}`, {
        operationId,
        originalError: error,
      })
    }
  }

  async getQueueStatus(): Promise<BridgeQueueStatus> {
    try {
      const response = await this.api.get("/queue/status")

      return {
        queueLength: response.data.queueLength || 0,
        estimatedWaitTime: response.data.estimatedWaitTime || 900000,
        averageProcessingTime: response.data.averageProcessingTime || 600000,
        currentGasPrice: response.data.currentGasPrice || 30,
      }
    } catch (error) {
      logger.warn("Failed to get queue status, using defaults:", error)

      return {
        queueLength: 5,
        estimatedWaitTime: 900000,
        averageProcessingTime: 600000,
        currentGasPrice: 30,
      }
    }
  }

  async estimateFees(direction: "deposit" | "withdrawal", amount: number): Promise<number> {
    try {
      const response = await this.api.post("/fees/estimate", {
        amount: amount.toString(),
        type: direction,
        sourceChain: direction === "deposit" ? "ethereum" : "stacks",
        destinationChain: direction === "deposit" ? "stacks" : "ethereum",
      })

      return Number.parseFloat(response.data.totalFee)
    } catch (error) {
      logger.warn("Failed to estimate fees, using default:", error)
      return amount * 0.001 // 0.1% default fee
    }
  }

  async waitForCompletion(
    operationId: string,
    timeoutMs = 1800000, // 30 minutes
  ): Promise<BridgeOperation> {
    // Validate inputs
    if (!operationId || operationId.length === 0) {
      throw new ValidationError("Operation ID is required")
    }

    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new ValidationError("Timeout must be a positive number")
    }

    const startTime = Date.now()
    const checkInterval = 10000 // 10 seconds
    let lastError: Error | null = null
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 5

    while (Date.now() - startTime < timeoutMs) {
      try {
        const operation = await this.getOperationStatus(operationId)

        // Reset error counter on success
        consecutiveErrors = 0
        lastError = null

        if (operation.status === "completed") {
          logger.info(`Bridge operation ${operationId} completed successfully`)
          return operation
        }

        if (operation.status === "failed") {
          throw new BridgeError(`Bridge operation ${operationId} failed`, { operationId, status: operation.status })
        }

        // Wait before next check
        await new Promise((resolve) => setTimeout(resolve, checkInterval))
      } catch (error) {
        consecutiveErrors++
        lastError = error instanceof Error ? error : new Error(String(error))

        // If we get too many consecutive errors, fail fast
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new BridgeError(
            `Too many consecutive errors while waiting for operation ${operationId}`,
            { operationId, consecutiveErrors, lastError },
          )
        }

        // Log error but continue waiting
        logger.warn(`Error checking operation status (${consecutiveErrors}/${maxConsecutiveErrors}):`, lastError)

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, checkInterval))
      }
    }

    // Timeout reached
    throw new TimeoutError(`Bridge operation ${operationId} timed out after ${timeoutMs}ms`, {
      operationId,
      timeoutMs,
      lastError: lastError?.message,
    })
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      return
    }

    this.pollingInterval = setInterval(async () => {
      for (const [operationId, operation] of this.operations.entries()) {
        if (operation.status === "pending" || operation.status === "processing") {
          try {
            await this.getOperationStatus(operationId)
          } catch (error) {
            logger.error(`Error polling operation ${operationId}:`, error)
          }
        }
      }

      // Clean up old completed operations
      this.cleanupOldOperations()
    }, 15000) // Poll every 15 seconds
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  private cleanupOldOperations(): void {
    const oneHourAgo = Date.now() - 3600000

    for (const [id, operation] of this.operations.entries()) {
      if ((operation.status === "completed" || operation.status === "failed") && operation.updatedAt < oneHourAgo) {
        this.operations.delete(id)
      }
    }
  }

  private mapStatus(circleStatus: string): BridgeOperation["status"] {
    const statusMap: Record<string, BridgeOperation["status"]> = {
      pending: "pending",
      processing: "processing",
      in_progress: "processing",
      completed: "completed",
      confirmed: "completed",
      failed: "failed",
      cancelled: "failed",
      rejected: "failed",
    }

    return statusMap[circleStatus.toLowerCase()] || "pending"
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getActiveOperations(): BridgeOperation[] {
    return Array.from(this.operations.values()).filter((op) => op.status === "pending" || op.status === "processing")
  }

  getTotalExposure(): number {
    return this.getActiveOperations().reduce((sum, op) => sum + op.amount, 0)
  }

  shutdown(): void {
    this.stopPolling()
    logger.info("xReserve Bridge shutdown complete")
  }
}
