import type { ArbitrageOpportunity, ExecutionStep } from "../core/opportunityDetector"
import type { XReserveBridge, BridgeOperation } from "../bridge/xReserveBridge"
import { StacksClient } from "../blockchain/stacksClient"
import { StacksDexFactory } from "../blockchain/stacksDex"
import { logger } from "../utils/logger"
import { config } from "../config"
import { ValidationError, ExecutionError, BridgeError, TimeoutError } from "../utils/errors"
import { retry } from "../utils/retry"
import type { PaymentProcessor } from "../payment/paymentProcessor"

export interface TradeResult {
  id: string
  opportunityId: string
  status: "success" | "partial" | "failed"
  executedSteps: number
  totalSteps: number
  profit: number
  actualProfit: number
  roi: number
  executionTime: number
  gasCostEth: number
  gasCostStacks: number
  bridgeFee: number
  slippage: number
  error?: string
  transactions: TransactionRecord[]
  timestamp: number
}

export interface TransactionRecord {
  step: number
  chain: "ethereum" | "stacks"
  action: string
  txHash?: string
  status: "success" | "failed" | "pending"
  gasUsed?: number
  error?: string
  timestamp: number
}

export class ExecutionManager {
  private bridge: XReserveBridge
  private stacksClient: StacksClient | null = null
  private paymentProcessor: PaymentProcessor | null = null
  private activeTrades: Map<string, TradeResult> = new Map()
  private maxConcurrentTrades = 3

  constructor(bridge: XReserveBridge, stacksClient?: StacksClient, paymentProcessor?: PaymentProcessor) {
    this.bridge = bridge
    this.stacksClient = stacksClient || null
    this.paymentProcessor = paymentProcessor || null
  }

  /**
   * Initialize Stacks client if not provided
   */
  private getStacksClient(): StacksClient {
    if (!this.stacksClient) {
      this.stacksClient = new StacksClient(config.stacks)
    }
    return this.stacksClient
  }

  /**
   * Type-safe helper to extract number from step params
   */
  private getNumberParam(params: Record<string, unknown>, key: string, defaultValue = 0): number {
    const value = params[key]
    if (typeof value === "number") {
      return value
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? defaultValue : parsed
    }
    return defaultValue
  }

  /**
   * Type-safe helper to extract string from step params
   */
  private getStringParam(params: Record<string, unknown>, key: string, defaultValue = ""): string {
    const value = params[key]
    if (typeof value === "string") {
      return value
    }
    if (typeof value !== "undefined" && value !== null) {
      return String(value)
    }
    return defaultValue
  }

  async executeTrade(opportunity: ArbitrageOpportunity): Promise<TradeResult> {
    // Validate opportunity
    if (!opportunity) {
      throw new ValidationError("Opportunity is required for trade execution")
    }

    if (!opportunity.executionSteps || opportunity.executionSteps.length === 0) {
      throw new ValidationError("Opportunity must have execution steps")
    }

    const tradeId = this.generateTradeId()
    const startTime = Date.now()

    logger.info(`Starting trade execution: ${tradeId} for opportunity ${opportunity.id}`)

    const result: TradeResult = {
      id: tradeId,
      opportunityId: opportunity.id,
      status: "failed",
      executedSteps: 0,
      totalSteps: opportunity.executionSteps.length,
      profit: opportunity.expectedProfit,
      actualProfit: 0,
      roi: 0,
      executionTime: 0,
      gasCostEth: 0,
      gasCostStacks: 0,
      bridgeFee: 0,
      slippage: 0,
      transactions: [],
      timestamp: startTime,
    }

    this.activeTrades.set(tradeId, result)

    try {
      // Validate opportunity is still valid
      if (!Number.isFinite(opportunity.expiresAt) || Date.now() > opportunity.expiresAt) {
        throw new ValidationError("Opportunity expired or has invalid expiration time")
      }

      // Check concurrent trade limit
      if (this.activeTrades.size > this.maxConcurrentTrades) {
        throw new ValidationError(`Max concurrent trades reached (${this.maxConcurrentTrades})`)
      }

      // Execute each step sequentially with error recovery
      for (const step of opportunity.executionSteps) {
        try {
          const stepResult = await retry(
            () => this.executeStep(step, opportunity),
            {
              maxRetries: 2,
              initialDelay: 1000,
              onRetry: (attempt) => {
                logger.warn(`Retrying step ${step.step} for trade ${tradeId} (attempt ${attempt})`)
              },
            },
          )

          result.transactions.push(stepResult)
          result.executedSteps++

          if (stepResult.status === "failed") {
            throw new ExecutionError(
              `Step ${step.step} failed: ${stepResult.error || "Unknown error"}`,
              step.step,
              { tradeId, step: step.step, error: stepResult.error },
            )
          }

          // Update costs with validation
          const gasUsed = stepResult.gasUsed || 0
          if (Number.isFinite(gasUsed) && gasUsed >= 0) {
            if (step.chain === "ethereum") {
              result.gasCostEth += gasUsed
            } else {
              result.gasCostStacks += gasUsed
            }
          }
        } catch (error) {
          // Log step failure but continue to record it
          logger.error(`Step ${step.step} failed for trade ${tradeId}:`, error)

          const failedStepResult: TransactionRecord = {
            step: step.step,
            chain: step.chain,
            action: step.action,
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          }

          result.transactions.push(failedStepResult)
          result.executedSteps++

          // Re-throw to stop execution
          throw error
        }
      }

      // Update bridge fee from payment processor if available
      if (this.paymentProcessor) {
        // Try to get bridge fee from payment results
        const bridgeSteps = result.transactions.filter((t) => t.action === "bridge")
        for (const bridgeStep of bridgeSteps) {
          // Bridge fees are tracked in payment processor
          // This would be enhanced to fetch actual fees from payment results
        }
      }

      // Calculate actual profit with validation
      result.actualProfit = this.calculateActualProfit(result, opportunity)

      // Validate profit calculation
      if (!Number.isFinite(result.actualProfit)) {
        throw new ValidationError("Invalid profit calculation result")
      }

      // Validate input amount
      if (!Number.isFinite(opportunity.inputAmount) || opportunity.inputAmount <= 0) {
        throw new ValidationError("Invalid input amount for ROI calculation")
      }

      result.roi = result.actualProfit / opportunity.inputAmount
      result.status = result.actualProfit > 0 ? "success" : "failed"

      logger.info(`Trade ${tradeId} completed with ${result.status}`, {
        expectedProfit: opportunity.expectedProfit,
        actualProfit: result.actualProfit,
        roi: `${(result.roi * 100).toFixed(2)}%`,
      })
    } catch (error: unknown) {
      logger.error(`Trade ${tradeId} failed:`, error)
      result.status = "failed"
      result.error = error instanceof Error ? error.message : String(error)

      // Determine if this is a partial success
      if (result.executedSteps > 0 && result.executedSteps < result.totalSteps) {
        result.status = "partial"
        logger.warn(`Trade ${tradeId} partially executed: ${result.executedSteps}/${result.totalSteps} steps completed`)
      }
    } finally {
      result.executionTime = Date.now() - startTime
      this.activeTrades.delete(tradeId)
    }

    return result
  }

  private async executeStep(step: ExecutionStep, opportunity: ArbitrageOpportunity): Promise<TransactionRecord> {
    // Validate step
    if (!step) {
      throw new ValidationError("Execution step is required")
    }

    if (!step.action || !step.chain) {
      throw new ValidationError("Execution step must have action and chain")
    }

    const record: TransactionRecord = {
      step: step.step,
      chain: step.chain,
      action: step.action,
      status: "pending",
      timestamp: Date.now(),
    }

    try {
      logger.info(`Executing step ${step.step}: ${step.action} on ${step.chain}`)

      let txHash: string | undefined

      switch (step.action) {
        case "approve":
          txHash = await this.executeApprove(step)
          break

        case "swap":
          txHash = await this.executeSwap(step, opportunity)
          break

        case "bridge":
          txHash = await this.executeBridge(step, opportunity)
          break

        default:
          throw new ExecutionError(`Unknown action: ${step.action}`, step.step, { action: step.action })
      }

      // Validate transaction hash
      if (!txHash || txHash.length === 0) {
        throw new ExecutionError("Transaction hash is missing", step.step)
      }

      record.status = "success"
      record.txHash = txHash
      record.gasUsed = step.estimatedGas || 0

      logger.info(`Step ${step.step} completed: ${record.txHash}`)
    } catch (error: unknown) {
      logger.error(`Step ${step.step} failed:`, error)
      record.status = "failed"
      record.error = error instanceof Error ? error.message : String(error)

      // Re-throw execution errors
      if (error instanceof ExecutionError || error instanceof ValidationError) {
        throw error
      }

      // Wrap other errors
      throw new ExecutionError(`Step ${step.step} execution failed`, step.step, {
        action: step.action,
        chain: step.chain,
        originalError: error,
      })
    }

    return record
  }

  private async executeApprove(step: ExecutionStep): Promise<string> {
    const amount = this.getNumberParam(step.params, "amount")
    const spender = this.getStringParam(step.params, "spender")
    logger.info(`Approving ${amount} tokens for ${spender}`)

    // In production, this would call the actual blockchain
    await this.simulateTransaction(1000)

    return this.generateTxHash()
  }

  private async executeSwap(step: ExecutionStep, opportunity: ArbitrageOpportunity): Promise<string> {
    const amountIn = this.getNumberParam(step.params, "amountIn") || this.getNumberParam(step.params, "amount")
    logger.info(`Swapping ${amountIn} on ${step.chain}`)

    if (step.chain === "stacks") {
      // Use Stacks DEX integration
      const stacksClient = this.getStacksClient()
      // Get DEX name from opportunity
      const dexName = opportunity.destChain === "stacks" ? opportunity.destDex : opportunity.sourceDex
      const dex = StacksDexFactory.createDex(dexName || "alex", stacksClient)

      const swapParams = {
        tokenIn: this.getStringParam(step.params, "tokenIn"),
        tokenOut: this.getStringParam(step.params, "tokenOut"),
        amountIn: amountIn,
        minAmountOut: this.getNumberParam(step.params, "minAmountOut", amountIn * 0.99),
        recipient: stacksClient.getAddress(),
      }

      const txId = await dex.swap(swapParams)
      
      // Wait for confirmation
      const status = await stacksClient.waitForConfirmation(txId, 300000)
      
      if (status.status === "failed") {
        throw new Error(`Stacks swap failed: ${status.error || "Unknown error"}`)
      }

      return txId
    } else {
      // Ethereum swap - would use ethers.js here
      // For now, simulate
      await this.simulateTransaction(2000)
      return this.generateTxHash()
    }
  }

  private async executeBridge(step: ExecutionStep, opportunity: ArbitrageOpportunity): Promise<string> {
    const amount = this.getNumberParam(step.params, "amount")
    const destinationAddress = this.getStringParam(step.params, "destinationAddress")
    logger.info(`Bridging ${amount} from ${step.chain}`)

    try {
      // Validate bridge parameters
      if (!step.params || !Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError("Invalid bridge amount")
      }

      if (!destinationAddress) {
        throw new ValidationError("Destination address is required for bridge operation")
      }

      // Use payment processor if available for better fee management
      if (this.paymentProcessor) {
        const paymentType = opportunity.direction === "eth_to_stacks" ? "bridge_deposit" : "bridge_withdrawal"
        const priority = opportunity.expectedProfit > 1000 ? "high" : "medium"
        
        const paymentRequest = await this.paymentProcessor.submitPayment({
          type: paymentType,
          chain: step.chain,
          amount: amount,
          recipientAddress: destinationAddress,
          priority,
          metadata: {
            step: step.step,
            opportunityId: opportunity.id,
            attestation: this.getStringParam(step.params, "attestation"),
          },
        })

        const paymentResult = await this.paymentProcessor.processPayment(paymentRequest)
        
        if (paymentResult.status === "failed") {
          throw new BridgeError(`Payment processing failed: ${paymentResult.error}`, {
            step: step.step,
            paymentId: paymentRequest.id,
          })
        }

        if (!paymentResult.transactionHash) {
          throw new BridgeError("Payment completed but no transaction hash", {
            step: step.step,
            paymentId: paymentRequest.id,
          })
        }

        // Update bridge fee in result tracking
        if (paymentResult.fee) {
          // This will be used in calculateActualProfit
        }

        return paymentResult.transactionHash
      }

      // Fallback to direct bridge execution
      let bridgeOp: BridgeOperation

      // Execute bridge with retry
      if (opportunity.direction === "eth_to_stacks") {
        bridgeOp = await retry(
          () => this.bridge.depositToStacks(amount, destinationAddress),
          {
            maxRetries: 3,
            initialDelay: 2000,
            onRetry: (attempt) => {
              logger.warn(`Retrying bridge deposit (attempt ${attempt})`)
            },
          },
        )
      } else {
        const attestation = this.getStringParam(step.params, "attestation")
        if (!attestation) {
          throw new ValidationError("Attestation is required for withdrawal")
        }

        bridgeOp = await retry(
          () =>
            this.bridge.withdrawToEthereum(
              amount,
              destinationAddress,
              attestation,
            ),
          {
            maxRetries: 3,
            initialDelay: 2000,
            onRetry: (attempt) => {
              logger.warn(`Retrying bridge withdrawal (attempt ${attempt})`)
            },
          },
        )
      }

      // Validate bridge operation
      if (!bridgeOp || !bridgeOp.id) {
        throw new BridgeError("Bridge operation failed to initialize")
      }

      // Wait for bridge completion (with timeout)
      const completedOp = await retry(
        () => this.bridge.waitForCompletion(bridgeOp.id, 1800000), // 30 minutes timeout
        {
          maxRetries: 1, // Don't retry the wait itself
          timeout: 1800000,
        },
      )

      if (!completedOp || (!completedOp.bridgeTxId && !completedOp.id)) {
        throw new BridgeError("Bridge operation completed but no transaction ID available")
      }

      return completedOp.bridgeTxId || completedOp.id
    } catch (error) {
      logger.error("Bridge execution failed:", error)

      if (error instanceof BridgeError || error instanceof ValidationError || error instanceof TimeoutError) {
        throw error
      }

      throw new BridgeError("Bridge execution failed", {
        step: step.step,
        chain: step.chain,
        amount: this.getNumberParam(step.params, "amount"),
        originalError: error,
      })
    }
  }

  private calculateActualProfit(result: TradeResult, opportunity: ArbitrageOpportunity): number {
    try {
      // Validate inputs
      if (!result || !opportunity) {
        throw new ValidationError("Result and opportunity are required for profit calculation")
      }

      if (!Number.isFinite(opportunity.expectedOutput) || !Number.isFinite(opportunity.inputAmount)) {
        throw new ValidationError("Invalid opportunity amounts for profit calculation")
      }

      // Calculate total costs with validation
      const gasCostEthUsd = Number.isFinite(result.gasCostEth) ? result.gasCostEth * 0.00000003 : 0
      const gasCostStacksUsd = Number.isFinite(result.gasCostStacks) ? result.gasCostStacks * 0.00000001 : 0
      const bridgeFee = Number.isFinite(result.bridgeFee) ? result.bridgeFee : 0
      const slippage = Number.isFinite(opportunity.estimatedSlippage) ? opportunity.estimatedSlippage : 0

      const totalCosts = gasCostEthUsd + gasCostStacksUsd + bridgeFee + slippage

      // Validate costs
      if (!Number.isFinite(totalCosts) || totalCosts < 0) {
        throw new ValidationError("Invalid cost calculation")
      }

      // Actual profit = expected output - input - actual costs
      const actualProfit = opportunity.expectedOutput - opportunity.inputAmount - totalCosts

      // Validate result
      if (!Number.isFinite(actualProfit)) {
        throw new ValidationError("Invalid profit calculation result")
      }

      return actualProfit
    } catch (error) {
      logger.error("Error calculating actual profit:", error)
      // Return 0 on error to prevent invalid data
      return 0
    }
  }

  private async simulateTransaction(delayMs: number): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTxHash(): string {
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  }

  getActiveTrades(): TradeResult[] {
    return Array.from(this.activeTrades.values())
  }

  canExecuteMore(): boolean {
    return this.activeTrades.size < this.maxConcurrentTrades
  }
}
