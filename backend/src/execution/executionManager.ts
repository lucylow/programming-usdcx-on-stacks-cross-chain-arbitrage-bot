import type { ArbitrageOpportunity, ExecutionStep } from "../core/opportunityDetector"
import type { XReserveBridge, BridgeOperation } from "../bridge/xReserveBridge"
import { logger } from "../monitoring/logger"

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
  private activeTrades: Map<string, TradeResult> = new Map()
  private maxConcurrentTrades = 3

  constructor(bridge: XReserveBridge) {
    this.bridge = bridge
  }

  async executeTrade(opportunity: ArbitrageOpportunity): Promise<TradeResult> {
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
      if (Date.now() > opportunity.expiresAt) {
        throw new Error("Opportunity expired")
      }

      // Check concurrent trade limit
      if (this.activeTrades.size > this.maxConcurrentTrades) {
        throw new Error("Max concurrent trades reached")
      }

      // Execute each step sequentially
      for (const step of opportunity.executionSteps) {
        const stepResult = await this.executeStep(step, opportunity)
        result.transactions.push(stepResult)
        result.executedSteps++

        if (stepResult.status === "failed") {
          throw new Error(`Step ${step.step} failed: ${stepResult.error}`)
        }

        // Update costs
        if (step.chain === "ethereum") {
          result.gasCostEth += stepResult.gasUsed || 0
        } else {
          result.gasCostStacks += stepResult.gasUsed || 0
        }
      }

      // Calculate actual profit
      result.actualProfit = this.calculateActualProfit(result, opportunity)
      result.roi = result.actualProfit / opportunity.inputAmount
      result.status = result.actualProfit > 0 ? "success" : "failed"

      logger.info(`Trade ${tradeId} completed with ${result.status}`, {
        expectedProfit: opportunity.expectedProfit,
        actualProfit: result.actualProfit,
        roi: `${(result.roi * 100).toFixed(2)}%`,
      })
    } catch (error: any) {
      logger.error(`Trade ${tradeId} failed:`, error)
      result.status = "failed"
      result.error = error.message
    } finally {
      result.executionTime = Date.now() - startTime
      this.activeTrades.delete(tradeId)
    }

    return result
  }

  private async executeStep(step: ExecutionStep, opportunity: ArbitrageOpportunity): Promise<TransactionRecord> {
    const record: TransactionRecord = {
      step: step.step,
      chain: step.chain,
      action: step.action,
      status: "pending",
      timestamp: Date.now(),
    }

    try {
      logger.info(`Executing step ${step.step}: ${step.action} on ${step.chain}`)

      switch (step.action) {
        case "approve":
          record.txHash = await this.executeApprove(step)
          break

        case "swap":
          record.txHash = await this.executeSwap(step, opportunity)
          break

        case "bridge":
          record.txHash = await this.executeBridge(step, opportunity)
          break

        default:
          throw new Error(`Unknown action: ${step.action}`)
      }

      record.status = "success"
      record.gasUsed = step.estimatedGas

      logger.info(`Step ${step.step} completed: ${record.txHash}`)
    } catch (error: any) {
      logger.error(`Step ${step.step} failed:`, error)
      record.status = "failed"
      record.error = error.message
    }

    return record
  }

  private async executeApprove(step: ExecutionStep): Promise<string> {
    logger.info(`Approving ${step.params.amount} tokens for ${step.params.spender}`)

    // In production, this would call the actual blockchain
    await this.simulateTransaction(1000)

    return this.generateTxHash()
  }

  private async executeSwap(step: ExecutionStep, opportunity: ArbitrageOpportunity): Promise<string> {
    logger.info(`Swapping ${step.params.amountIn} on ${step.chain}`)

    // In production, this would call the DEX contract
    await this.simulateTransaction(2000)

    return this.generateTxHash()
  }

  private async executeBridge(step: ExecutionStep, opportunity: ArbitrageOpportunity): Promise<string> {
    logger.info(`Bridging ${step.params.amount} from ${step.chain}`)

    try {
      let bridgeOp: BridgeOperation

      if (opportunity.direction === "eth_to_stacks") {
        bridgeOp = await this.bridge.depositToStacks(step.params.amount, step.params.destinationAddress)
      } else {
        bridgeOp = await this.bridge.withdrawToEthereum(
          step.params.amount,
          step.params.destinationAddress,
          step.params.attestation || "",
        )
      }

      // Wait for bridge completion (with timeout)
      const completedOp = await this.bridge.waitForCompletion(
        bridgeOp.id,
        1800000, // 30 minutes timeout
      )

      return completedOp.bridgeTxId || completedOp.id
    } catch (error) {
      logger.error("Bridge execution failed:", error)
      throw error
    }
  }

  private calculateActualProfit(result: TradeResult, opportunity: ArbitrageOpportunity): number {
    // Calculate total costs
    const totalCosts =
      result.gasCostEth * 0.00000003 + // Convert gas to USD
      result.gasCostStacks * 0.00000001 +
      result.bridgeFee +
      opportunity.estimatedSlippage

    // Actual profit = expected output - input - actual costs
    return opportunity.expectedOutput - opportunity.inputAmount - totalCosts
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
