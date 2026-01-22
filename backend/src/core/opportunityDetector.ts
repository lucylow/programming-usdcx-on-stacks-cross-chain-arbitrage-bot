import type { PriceData } from "../config/types"
import { logger } from "../utils/logger"
import { PriceOracleError, ValidationError } from "../utils/errors"
import { retry } from "../utils/retry"

export interface ArbitrageOpportunity {
  id: string
  sourceChain: "ethereum" | "stacks"
  destChain: "ethereum" | "stacks"
  sourceDex: string
  destDex: string
  direction: "eth_to_stacks" | "stacks_to_eth"
  inputAmount: number
  expectedOutput: number
  expectedProfit: number
  profitPercentage: number
  confidence: number
  spread: number
  estimatedGasCost: number
  estimatedBridgeFee: number
  estimatedSlippage: number
  executionSteps: ExecutionStep[]
  timestamp: number
  expiresAt: number
}

export interface ExecutionStep {
  step: number
  action: "swap" | "approve" | "bridge"
  chain: "ethereum" | "stacks"
  contract: string
  params: Record<string, any>
  estimatedGas: number
}

export class OpportunityDetector {
  private minProfitThreshold = 0.005 // 0.5%
  private maxSlippage = 0.01 // 1%
  private opportunityTTL = 30000 // 30 seconds

  async detectOpportunities(prices: PriceData[]): Promise<ArbitrageOpportunity[]> {
    try {
      // Validate input
      if (!prices || prices.length === 0) {
        throw new ValidationError("Price data is required for opportunity detection")
      }

      const opportunities: ArbitrageOpportunity[] = []

      // Group prices by chain
      const ethPrices = prices.filter((p) => p.chain === "ethereum")
      const stacksPrices = prices.filter((p) => p.chain === "stacks")

      // Validate we have prices from both chains
      if (ethPrices.length === 0 || stacksPrices.length === 0) {
        logger.warn("Insufficient price data: missing prices from one or both chains")
        return []
      }

      // Compare all ETH vs Stacks price combinations
      for (const ethPrice of ethPrices) {
        for (const stacksPrice of stacksPrices) {
          try {
            // Only compare same trading pairs (e.g., USDC/ETH vs USDCx/STX)
            if (this.areSimilarPairs(ethPrice.pair, stacksPrice.pair)) {
              const opportunity = await this.evaluateSpread(ethPrice, stacksPrice)

              if (opportunity && opportunity.expectedProfit >= this.minProfitThreshold) {
                opportunities.push(opportunity)
              }
            }
          } catch (error) {
            logger.error(
              `Error evaluating spread between ${ethPrice.pair} and ${stacksPrice.pair}:`,
              error,
            )
            // Continue with other pairs
          }
        }
      }

      // Rank opportunities by risk-adjusted profit
      return this.rankOpportunities(opportunities)
    } catch (error) {
      logger.error("Error detecting opportunities:", error)
      throw new PriceOracleError("Failed to detect opportunities", undefined, { originalError: error })
    }
  }

  private async evaluateSpread(ethPrice: PriceData, stacksPrice: PriceData): Promise<ArbitrageOpportunity | null> {
    try {
      // Validate price data
      if (!ethPrice || !stacksPrice) {
        throw new ValidationError("Both price data objects are required")
      }

      if (ethPrice.price <= 0 || stacksPrice.price <= 0) {
        logger.warn(`Invalid price detected: ETH=${ethPrice.price}, Stacks=${stacksPrice.price}`)
        return null
      }

      // Calculate raw spread
      const spread = Math.abs(ethPrice.price - stacksPrice.price) / Math.min(ethPrice.price, stacksPrice.price)

      // Validate spread calculation
      if (!Number.isFinite(spread) || spread < 0) {
        logger.warn(`Invalid spread calculated: ${spread}`)
        return null
      }

      // Skip if spread is too small
      if (spread < this.minProfitThreshold * 2) {
        return null
      }

      // Determine direction
      const direction: "eth_to_stacks" | "stacks_to_eth" =
        ethPrice.price < stacksPrice.price ? "eth_to_stacks" : "stacks_to_eth"

      // Calculate optimal trade size
      const inputAmount = this.calculateOptimalSize(
        direction === "eth_to_stacks" ? ethPrice : stacksPrice,
        direction === "eth_to_stacks" ? stacksPrice : ethPrice,
      )

      // Estimate all costs with retry
      const costs = await retry(
        () => this.estimateTotalCosts(direction, inputAmount),
        {
          maxRetries: 2,
          initialDelay: 500,
          onRetry: (attempt) => {
            logger.warn(`Retrying cost estimation (attempt ${attempt})`)
          },
        },
      )

      // Validate costs
      if (!costs || !Number.isFinite(costs.total)) {
        logger.warn("Invalid cost estimation received")
        return null
      }

      // Calculate expected output
      const expectedOutput = this.calculateExpectedOutput(
        inputAmount,
        direction === "eth_to_stacks" ? ethPrice.price : stacksPrice.price,
        direction === "eth_to_stacks" ? stacksPrice.price : ethPrice.price,
        costs,
      )

      // Validate expected output
      if (!Number.isFinite(expectedOutput) || expectedOutput <= 0) {
        logger.warn(`Invalid expected output calculated: ${expectedOutput}`)
        return null
      }

      // Calculate profit
      const expectedProfit = expectedOutput - inputAmount - costs.total
      const profitPercentage = expectedProfit / inputAmount

      // Validate profitability
      if (!Number.isFinite(profitPercentage) || profitPercentage < this.minProfitThreshold) {
        return null
      }

      // Build execution steps
      const executionSteps = this.buildExecutionPlan(direction, inputAmount, ethPrice.dex, stacksPrice.dex)

      // Calculate confidence score
      const confidence = this.calculateConfidence(
        spread,
        ethPrice.confidence,
        stacksPrice.confidence,
        ethPrice.liquidity,
        stacksPrice.liquidity,
      )

      const opportunity: ArbitrageOpportunity = {
        id: this.generateOpportunityId(direction, ethPrice.dex, stacksPrice.dex),
        sourceChain: direction === "eth_to_stacks" ? "ethereum" : "stacks",
        destChain: direction === "eth_to_stacks" ? "stacks" : "ethereum",
        sourceDex: direction === "eth_to_stacks" ? ethPrice.dex : stacksPrice.dex,
        destDex: direction === "eth_to_stacks" ? stacksPrice.dex : ethPrice.dex,
        direction,
        inputAmount,
        expectedOutput,
        expectedProfit,
        profitPercentage,
        confidence,
        spread,
        estimatedGasCost: costs.gas,
        estimatedBridgeFee: costs.bridge,
        estimatedSlippage: costs.slippage,
        executionSteps,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.opportunityTTL,
      }

      logger.info(`Opportunity detected: ${opportunity.id}`, {
        profit: `$${expectedProfit.toFixed(2)}`,
        profitPercent: `${(profitPercentage * 100).toFixed(2)}%`,
        spread: `${(spread * 100).toFixed(2)}%`,
      })

      return opportunity
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Error evaluating spread between ${ethPrice?.pair} and ${stacksPrice?.pair}:`, errorMessage)
      
      // Return null for non-critical errors, but log them
      if (error instanceof ValidationError) {
        return null
      }
      
      // For other errors, return null but log for monitoring
      return null
    }
  }

  private calculateOptimalSize(sourcePrice: PriceData, destPrice: PriceData): number {
    try {
      // Validate input
      if (!sourcePrice || !destPrice) {
        throw new ValidationError("Both source and destination prices are required")
      }

      if (sourcePrice.liquidity <= 0 || destPrice.liquidity <= 0) {
        logger.warn("Invalid liquidity detected in optimal size calculation")
        return 1000 // Return minimum safe size
      }

      // Consider available liquidity on both sides
      const maxByLiquidity = Math.min(
        sourcePrice.liquidity * 0.05, // Use max 5% of liquidity
        destPrice.liquidity * 0.05,
      )

      // Consider configured max position size
      const maxPositionSize = 10000 // $10k max per trade

      // Calculate optimal size based on slippage impact
      const optimalBySlippage = this.calculateOptimalBySlippage(sourcePrice.liquidity, destPrice.liquidity)

      // Return minimum of all constraints, with a floor
      const optimalSize = Math.min(maxByLiquidity, maxPositionSize, optimalBySlippage)
      
      // Ensure we return a valid positive number
      if (!Number.isFinite(optimalSize) || optimalSize <= 0) {
        logger.warn("Calculated optimal size is invalid, using minimum")
        return 1000
      }

      return Math.max(1000, optimalSize) // Minimum $1000
    } catch (error) {
      logger.error("Error calculating optimal size:", error)
      return 1000 // Return safe minimum on error
    }
  }

  private calculateOptimalBySlippage(sourceLiquidity: number, destLiquidity: number): number {
    // Simplified slippage model: slippage = k * (size / liquidity)^2
    const k = 0.001 // Slippage coefficient
    const avgLiquidity = (sourceLiquidity + destLiquidity) / 2

    // Solve for size where slippage = maxSlippage
    const optimalSize = Math.sqrt((this.maxSlippage * avgLiquidity * avgLiquidity) / k)

    return Math.min(optimalSize, avgLiquidity * 0.1) // Max 10% of liquidity
  }

  private async estimateTotalCosts(
    direction: "eth_to_stacks" | "stacks_to_eth",
    amount: number,
  ): Promise<{ gas: number; bridge: number; slippage: number; dexFees: number; total: number }> {
    try {
      // Validate input
      if (!direction || (direction !== "eth_to_stacks" && direction !== "stacks_to_eth")) {
        throw new ValidationError("Invalid direction for cost estimation")
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError(`Invalid amount for cost estimation: ${amount}`)
      }

      const costs = {
        gas: 0,
        bridge: 0,
        slippage: 0,
        dexFees: 0,
        total: 0,
      }

      // Gas costs (in USD)
      if (direction === "eth_to_stacks") {
        costs.gas = 50 // Ethereum gas ~$50
        costs.gas += 2 // Stacks gas ~$2
      } else {
        costs.gas = 2 // Stacks gas ~$2
        costs.gas += 50 // Ethereum gas ~$50
      }

      // Bridge fee (0.1% of amount)
      costs.bridge = amount * 0.001

      // Estimated slippage (0.5% per swap, 2 swaps total)
      costs.slippage = amount * this.maxSlippage * 2

      // DEX fees (0.3% per swap, 2 swaps total)
      costs.dexFees = amount * 0.003 * 2

      costs.total = costs.gas + costs.bridge + costs.slippage + costs.dexFees

      // Validate all costs are finite
      if (!Object.values(costs).every((v) => Number.isFinite(v) && v >= 0)) {
        throw new ValidationError("Invalid cost calculation result")
      }

      return costs
    } catch (error) {
      logger.error("Error estimating total costs:", error)
      // Return default costs on error
      return {
        gas: 52,
        bridge: amount * 0.001,
        slippage: amount * this.maxSlippage * 2,
        dexFees: amount * 0.003 * 2,
        total: 52 + amount * 0.001 + amount * this.maxSlippage * 2 + amount * 0.003 * 2,
      }
    }
  }

  private calculateExpectedOutput(
    inputAmount: number,
    buyPrice: number,
    sellPrice: number,
    costs: { total: number },
  ): number {
    // Simple calculation: (sellPrice / buyPrice) * inputAmount - costs
    const grossOutput = (sellPrice / buyPrice) * inputAmount
    return grossOutput - costs.total
  }

  private buildExecutionPlan(
    direction: "eth_to_stacks" | "stacks_to_eth",
    amount: number,
    ethDex: string,
    stacksDex: string,
  ): ExecutionStep[] {
    const steps: ExecutionStep[] = []

    if (direction === "eth_to_stacks") {
      // Step 1: Approve USDC on Ethereum
      steps.push({
        step: 1,
        action: "approve",
        chain: "ethereum",
        contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        params: {
          spender: this.getDexRouter(ethDex),
          amount: amount,
        },
        estimatedGas: 45000,
      })

      // Step 2: Swap on Ethereum DEX
      steps.push({
        step: 2,
        action: "swap",
        chain: "ethereum",
        contract: this.getDexRouter(ethDex),
        params: {
          tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
          amountIn: amount,
          minAmountOut: amount * 0.99, // 1% slippage tolerance
        },
        estimatedGas: 150000,
      })

      // Step 3: Bridge to Stacks
      steps.push({
        step: 3,
        action: "bridge",
        chain: "ethereum",
        contract: "0x...", // xReserve bridge contract
        params: {
          amount: amount,
          destinationChain: "stacks",
          destinationAddress: "SP...",
        },
        estimatedGas: 100000,
      })

      // Step 4: Swap on Stacks DEX
      steps.push({
        step: 4,
        action: "swap",
        chain: "stacks",
        contract: this.getStacksDexContract(stacksDex),
        params: {
          tokenIn: "USDCx",
          tokenOut: "STX",
          amountIn: amount,
          minAmountOut: amount * 1.01, // Expected profit
        },
        estimatedGas: 50000,
      })
    } else {
      // Reverse order for stacks_to_eth
      // Similar steps but in opposite direction
    }

    return steps
  }

  private calculateConfidence(
    spread: number,
    ethConfidence: number,
    stacksConfidence: number,
    ethLiquidity: number,
    stacksLiquidity: number,
  ): number {
    let confidence = 1.0

    // Adjust based on spread size (larger spread = higher confidence)
    confidence *= Math.min(1.0, spread / (this.minProfitThreshold * 4))

    // Adjust based on price data confidence
    confidence *= (ethConfidence + stacksConfidence) / 2

    // Adjust based on liquidity (higher liquidity = higher confidence)
    const minLiquidity = Math.min(ethLiquidity, stacksLiquidity)
    const liquidityScore = Math.min(1.0, minLiquidity / 1000000) // $1M baseline
    confidence *= liquidityScore

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence))
  }

  private rankOpportunities(opportunities: ArbitrageOpportunity[]): ArbitrageOpportunity[] {
    return opportunities.sort((a, b) => {
      // Primary: Risk-adjusted profit
      const aScore = a.expectedProfit * a.confidence
      const bScore = b.expectedProfit * b.confidence

      if (Math.abs(aScore - bScore) > 0.01) {
        return bScore - aScore
      }

      // Secondary: Confidence
      return b.confidence - a.confidence
    })
  }

  private areSimilarPairs(ethPair: string, stacksPair: string): boolean {
    // Normalize pair names for comparison
    // E.g., "USDC/ETH" on Ethereum should match "USDCx/STX" on Stacks
    const ethNormalized = ethPair.toLowerCase().replace(/[^a-z]/g, "")
    const stacksNormalized = stacksPair.toLowerCase().replace(/[^a-z]/g, "")

    // Check if they represent the same type of pair
    return (
      (ethNormalized.includes("usdc") && stacksNormalized.includes("usdcx")) ||
      (ethNormalized.includes("eth") && stacksNormalized.includes("stx"))
    )
  }

  private generateOpportunityId(direction: string, ethDex: string, stacksDex: string): string {
    const timestamp = Date.now()
    const hash = require("crypto")
      .createHash("md5")
      .update(`${direction}_${ethDex}_${stacksDex}_${timestamp}`)
      .digest("hex")
      .substring(0, 8)

    return `opp_${hash}`
  }

  private getDexRouter(dexName: string): string {
    const routers: Record<string, string> = {
      uniswap_v3: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      curve: "0x99a58482BD75cbab83b27EC03CA68fF489b5788f",
      balancer: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    }

    return routers[dexName] || routers["uniswap_v3"]
  }

  private getStacksDexContract(dexName: string): string {
    const contracts: Record<string, string> = {
      alex: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool",
      arkadiko: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v2-1",
      lydian: "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.lydian-swap",
    }

    return contracts[dexName] || contracts["alex"]
  }
}
