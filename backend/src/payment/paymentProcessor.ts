import { logger } from "../utils/logger"
import { ValidationError, ExecutionError, NetworkError } from "../utils/errors"
import { retry } from "../utils/retry"
import { XReserveBridge, BridgeOperation } from "../bridge/xReserveBridge"
import { config } from "../config"

export interface PaymentRequest {
  id: string
  type: "approve" | "swap" | "bridge_deposit" | "bridge_withdrawal"
  chain: "ethereum" | "stacks"
  amount: number
  tokenAddress?: string
  recipientAddress?: string
  priority: "low" | "medium" | "high" | "critical"
  metadata?: Record<string, unknown>
  createdAt: number
}

export interface PaymentResult {
  id: string
  requestId: string
  status: "pending" | "processing" | "completed" | "failed"
  transactionHash?: string
  gasUsed?: number
  gasPrice?: number
  totalCost?: number
  fee?: number
  error?: string
  confirmedAt?: number
  completedAt?: number
}

export interface FeeEstimate {
  gasFee: number
  bridgeFee: number
  dexFee: number
  totalFee: number
  estimatedGasPrice: number
  confidence: "low" | "medium" | "high"
}

export interface GasPriceInfo {
  chain: "ethereum" | "stacks"
  currentPrice: number
  fastPrice: number
  standardPrice: number
  slowPrice: number
  timestamp: number
}

export class PaymentProcessor {
  private bridge: XReserveBridge
  private paymentQueue: PaymentRequest[] = []
  private activePayments: Map<string, PaymentResult> = new Map()
  private gasPriceCache: Map<string, GasPriceInfo> = new Map()
  private gasPriceUpdateInterval: NodeJS.Timeout | null = null
  private maxQueueSize = 100
  private processingLimit = 5

  constructor(bridge: XReserveBridge) {
    this.bridge = bridge
    this.startGasPriceMonitoring()
  }

  /**
   * Initialize payment processor
   */
  async initialize(): Promise<void> {
    logger.info("Initializing Payment Processor...")
    
    // Validate bridge connection
    try {
      await this.bridge.getQueueStatus()
      logger.info("Payment Processor initialized successfully")
    } catch (error) {
      logger.error("Failed to initialize Payment Processor:", error)
      throw new ExecutionError("Payment Processor initialization failed", undefined, { originalError: error })
    }
  }

  /**
   * Submit a payment request
   */
  async submitPayment(request: Omit<PaymentRequest, "id" | "createdAt">): Promise<PaymentRequest> {
    // Validate request
    this.validatePaymentRequest(request)

    // Check queue size
    if (this.paymentQueue.length >= this.maxQueueSize) {
      throw new ValidationError("Payment queue is full")
    }

    const paymentRequest: PaymentRequest = {
      ...request,
      id: this.generatePaymentId(),
      createdAt: Date.now(),
    }

    // Add to queue based on priority
    this.insertByPriority(paymentRequest)
    
    logger.info(`Payment request submitted: ${paymentRequest.id} (${paymentRequest.type})`)
    
    return paymentRequest
  }

  /**
   * Process payment from queue
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Check if already processing
    const existing = this.activePayments.get(request.id)
    if (existing && (existing.status === "processing" || existing.status === "pending")) {
      return existing
    }

    const result: PaymentResult = {
      id: this.generateResultId(),
      requestId: request.id,
      status: "processing",
    }

    this.activePayments.set(request.id, result)

    try {
      logger.info(`Processing payment: ${request.id} (${request.type})`)

      // Get fee estimate
      const feeEstimate = await this.estimateFees(request)
      result.fee = feeEstimate.totalFee

      // Execute payment based on type
      switch (request.type) {
        case "bridge_deposit":
          await this.processBridgeDeposit(request, result)
          break
        case "bridge_withdrawal":
          await this.processBridgeWithdrawal(request, result)
          break
        case "approve":
          await this.processApprove(request, result)
          break
        case "swap":
          await this.processSwap(request, result)
          break
        default:
          throw new ValidationError(`Unknown payment type: ${request.type}`)
      }

      result.status = "completed"
      result.completedAt = Date.now()
      
      logger.info(`Payment completed: ${request.id}`)
    } catch (error: unknown) {
      logger.error(`Payment failed: ${request.id}`, error)
      result.status = "failed"
      result.error = error instanceof Error ? error.message : String(error)
      result.completedAt = Date.now()
    }

    return result
  }

  /**
   * Process bridge deposit
   */
  private async processBridgeDeposit(request: PaymentRequest, result: PaymentResult): Promise<void> {
    if (!request.recipientAddress) {
      throw new ValidationError("Recipient address required for bridge deposit")
    }

    const bridgeOp = await retry(
      () => this.bridge.depositToStacks(request.amount, request.recipientAddress!),
      {
        maxRetries: 3,
        initialDelay: 2000,
        onRetry: (attempt) => {
          logger.warn(`Retrying bridge deposit for payment ${request.id} (attempt ${attempt})`)
        },
      },
    )

    result.transactionHash = bridgeOp.bridgeTxId || bridgeOp.id
    
    // Wait for completion if high priority
    if (request.priority === "high" || request.priority === "critical") {
      try {
        const completed = await this.bridge.waitForCompletion(bridgeOp.id, 1800000)
        result.confirmedAt = completed.actualCompletionTime || Date.now()
      } catch (error) {
        logger.warn(`Bridge deposit completion wait failed for ${request.id}:`, error)
        // Don't fail the payment if wait times out
      }
    }
  }

  /**
   * Process bridge withdrawal
   */
  private async processBridgeWithdrawal(request: PaymentRequest, result: PaymentResult): Promise<void> {
    if (!request.recipientAddress) {
      throw new ValidationError("Recipient address required for bridge withdrawal")
    }

    const attestation = request.metadata?.attestation
    if (!attestation || typeof attestation !== "string") {
      throw new ValidationError("Attestation required for bridge withdrawal")
    }

    const bridgeOp = await retry(
      () => this.bridge.withdrawToEthereum(request.amount, request.recipientAddress!, attestation),
      {
        maxRetries: 3,
        initialDelay: 2000,
        onRetry: (attempt) => {
          logger.warn(`Retrying bridge withdrawal for payment ${request.id} (attempt ${attempt})`)
        },
      },
    )

    result.transactionHash = bridgeOp.bridgeTxId || bridgeOp.id
    
    // Wait for completion if high priority
    if (request.priority === "high" || request.priority === "critical") {
      try {
        const completed = await this.bridge.waitForCompletion(bridgeOp.id, 1800000)
        result.confirmedAt = completed.actualCompletionTime || Date.now()
      } catch (error) {
        logger.warn(`Bridge withdrawal completion wait failed for ${request.id}:`, error)
      }
    }
  }

  /**
   * Process token approval
   */
  private async processApprove(request: PaymentRequest, result: PaymentResult): Promise<void> {
    // Get optimal gas price
    const gasPrice = await this.getOptimalGasPrice(request.chain)
    result.gasPrice = gasPrice

    // Estimate gas
    const estimatedGas = 65000 // Standard approval gas
    result.gasUsed = estimatedGas

    // Calculate cost
    if (request.chain === "ethereum") {
      const ethPrice = await this.getEthPrice()
      result.totalCost = (estimatedGas * gasPrice * ethPrice) / 1e9
    } else {
      result.totalCost = (estimatedGas * gasPrice) / 1e6 // microSTX to STX
    }

    // In production, this would execute the actual approval transaction
    // For now, simulate
    result.transactionHash = this.generateTxHash()
    result.confirmedAt = Date.now()
  }

  /**
   * Process swap
   */
  private async processSwap(request: PaymentRequest, result: PaymentResult): Promise<void> {
    // Get optimal gas price
    const gasPrice = await this.getOptimalGasPrice(request.chain)
    result.gasPrice = gasPrice

    // Estimate gas (swap is more expensive)
    const estimatedGas = request.chain === "ethereum" ? 150000 : 200000
    result.gasUsed = estimatedGas

    // Calculate cost
    if (request.chain === "ethereum") {
      const ethPrice = await this.getEthPrice()
      result.totalCost = (estimatedGas * gasPrice * ethPrice) / 1e9
    } else {
      result.totalCost = (estimatedGas * gasPrice) / 1e6
    }

    // In production, this would execute the actual swap transaction
    result.transactionHash = this.generateTxHash()
    result.confirmedAt = Date.now()
  }

  /**
   * Estimate fees for a payment request
   */
  async estimateFees(request: PaymentRequest): Promise<FeeEstimate> {
    const gasPrice = await this.getOptimalGasPrice(request.chain)
    
    let gasFee = 0
    let bridgeFee = 0
    let dexFee = 0

    // Estimate gas fee
    const estimatedGas = this.estimateGasForType(request.type, request.chain)
    if (request.chain === "ethereum") {
      const ethPrice = await this.getEthPrice()
      gasFee = (estimatedGas * gasPrice * ethPrice) / 1e9
    } else {
      gasFee = (estimatedGas * gasPrice) / 1e6
    }

    // Estimate bridge fee
    if (request.type === "bridge_deposit" || request.type === "bridge_withdrawal") {
      try {
        bridgeFee = await this.bridge.estimateFees(
          request.type === "bridge_deposit" ? "deposit" : "withdrawal",
          request.amount,
        )
      } catch (error) {
        logger.warn("Failed to estimate bridge fee, using default:", error)
        bridgeFee = request.amount * 0.001 // 0.1% default
      }
    }

    // Estimate DEX fee (for swaps)
    if (request.type === "swap") {
      dexFee = request.amount * 0.003 // 0.3% default
    }

    const totalFee = gasFee + bridgeFee + dexFee

    // Determine confidence based on data freshness
    const gasInfo = this.gasPriceCache.get(request.chain)
    const confidence: "low" | "medium" | "high" = 
      gasInfo && Date.now() - gasInfo.timestamp < 60000 ? "high" :
      gasInfo && Date.now() - gasInfo.timestamp < 300000 ? "medium" : "low"

    return {
      gasFee,
      bridgeFee,
      dexFee,
      totalFee,
      estimatedGasPrice: gasPrice,
      confidence,
    }
  }

  /**
   * Get optimal gas price for a chain
   */
  async getOptimalGasPrice(chain: "ethereum" | "stacks"): Promise<number> {
    const cached = this.gasPriceCache.get(chain)
    
    // Use cached value if fresh (less than 1 minute old)
    if (cached && Date.now() - cached.timestamp < 60000) {
      // Use standard price for balance between speed and cost
      return cached.standardPrice
    }

    // Fetch fresh gas prices
    await this.updateGasPrices(chain)
    
    const updated = this.gasPriceCache.get(chain)
    return updated?.standardPrice || (chain === "ethereum" ? 30 : 1)
  }

  /**
   * Update gas prices for a chain
   */
  private async updateGasPrices(chain: "ethereum" | "stacks"): Promise<void> {
    try {
      if (chain === "ethereum") {
        // In production, fetch from gas oracle (e.g., ETH Gas Station, Blocknative)
        // For now, simulate
        const gasInfo: GasPriceInfo = {
          chain: "ethereum",
          currentPrice: 30,
          fastPrice: 35,
          standardPrice: 30,
          slowPrice: 25,
          timestamp: Date.now(),
        }
        this.gasPriceCache.set(chain, gasInfo)
      } else {
        // Stacks gas prices are more stable
        const gasInfo: GasPriceInfo = {
          chain: "stacks",
          currentPrice: 1,
          fastPrice: 1.2,
          standardPrice: 1,
          slowPrice: 0.8,
          timestamp: Date.now(),
        }
        this.gasPriceCache.set(chain, gasInfo)
      }
    } catch (error) {
      logger.error(`Failed to update gas prices for ${chain}:`, error)
      // Use defaults
      const defaultPrice = chain === "ethereum" ? 30 : 1
      this.gasPriceCache.set(chain, {
        chain,
        currentPrice: defaultPrice,
        fastPrice: defaultPrice * 1.1,
        standardPrice: defaultPrice,
        slowPrice: defaultPrice * 0.9,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Start gas price monitoring
   */
  private startGasPriceMonitoring(): void {
    // Update gas prices every 30 seconds
    this.gasPriceUpdateInterval = setInterval(async () => {
      await Promise.all([
        this.updateGasPrices("ethereum"),
        this.updateGasPrices("stacks"),
      ])
    }, 30000)

    // Initial update
    Promise.all([
      this.updateGasPrices("ethereum"),
      this.updateGasPrices("stacks"),
    ]).catch((error) => {
      logger.error("Failed to initialize gas price monitoring:", error)
    })
  }

  /**
   * Get ETH price (for cost calculation)
   */
  private async getEthPrice(): Promise<number> {
    // In production, fetch from price oracle
    // For now, return default
    return 2000 // $2000 per ETH
  }

  /**
   * Estimate gas for payment type
   */
  private estimateGasForType(type: PaymentRequest["type"], chain: "ethereum" | "stacks"): number {
    if (type === "approve") {
      return chain === "ethereum" ? 65000 : 100000
    }
    if (type === "swap") {
      return chain === "ethereum" ? 150000 : 200000
    }
    // Bridge operations don't use gas directly
    return 0
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: Omit<PaymentRequest, "id" | "createdAt">): void {
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      throw new ValidationError("Invalid payment amount")
    }

    if (!request.type || !request.chain) {
      throw new ValidationError("Payment type and chain are required")
    }

    if ((request.type === "bridge_deposit" || request.type === "bridge_withdrawal") && !request.recipientAddress) {
      throw new ValidationError("Recipient address required for bridge operations")
    }
  }

  /**
   * Insert payment request by priority
   */
  private insertByPriority(request: PaymentRequest): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const requestPriority = priorityOrder[request.priority]

    let insertIndex = this.paymentQueue.length
    for (let i = 0; i < this.paymentQueue.length; i++) {
      if (priorityOrder[this.paymentQueue[i].priority] > requestPriority) {
        insertIndex = i
        break
      }
    }

    this.paymentQueue.splice(insertIndex, 0, request)
  }

  /**
   * Get payment status
   */
  getPaymentStatus(requestId: string): PaymentResult | null {
    return this.activePayments.get(requestId) || null
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number
    activePayments: number
    estimatedWaitTime: number
  } {
    const avgProcessingTime = 30000 // 30 seconds average
    return {
      queueLength: this.paymentQueue.length,
      activePayments: this.activePayments.size,
      estimatedWaitTime: this.paymentQueue.length * avgProcessingTime,
    }
  }

  /**
   * Process next payment from queue
   */
  async processNext(): Promise<PaymentResult | null> {
    if (this.paymentQueue.length === 0) {
      return null
    }

    if (this.activePayments.size >= this.processingLimit) {
      return null
    }

    const request = this.paymentQueue.shift()
    if (!request) {
      return null
    }

    return this.processPayment(request)
  }

  /**
   * Start processing queue
   */
  startProcessing(): void {
    setInterval(async () => {
      try {
        await this.processNext()
      } catch (error) {
        logger.error("Error processing payment from queue:", error)
      }
    }, 5000) // Process every 5 seconds
  }

  /**
   * Generate payment ID
   */
  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate result ID
   */
  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate transaction hash
   */
  private generateTxHash(): string {
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  }

  /**
   * Shutdown payment processor
   */
  shutdown(): void {
    if (this.gasPriceUpdateInterval) {
      clearInterval(this.gasPriceUpdateInterval)
      this.gasPriceUpdateInterval = null
    }
    logger.info("Payment Processor shutdown complete")
  }
}

