import { logger } from "../utils/logger"
import type { PaymentRequest } from "./paymentProcessor"

export interface FeeBreakdown {
  gasFee: number
  bridgeFee: number
  dexFee: number
  slippageCost: number
  totalFee: number
  feePercentage: number
}

export interface CostEstimate {
  estimatedCost: number
  minCost: number
  maxCost: number
  confidence: "low" | "medium" | "high"
  breakdown: FeeBreakdown
}

/**
 * Fee Calculator - Calculates and optimizes transaction fees
 */
export class FeeCalculator {
  // Default fee rates
  private readonly defaultBridgeFeeRate = 0.001 // 0.1%
  private readonly defaultDexFeeRate = 0.003 // 0.3%
  private readonly defaultSlippageRate = 0.01 // 1%
  
  // Gas price estimates (in Gwei for Ethereum, microSTX for Stacks)
  private readonly defaultEthGasPrice = 30
  private readonly defaultStacksGasPrice = 1
  
  // Gas limits
  private readonly approveGasLimit = 65000
  private readonly swapGasLimitEth = 150000
  private readonly swapGasLimitStacks = 200000
  
  // ETH price (should be fetched from oracle in production)
  private ethPrice = 2000

  /**
   * Calculate total fees for a payment request
   */
  calculateFees(request: PaymentRequest, gasPrice?: number): FeeBreakdown {
    const gasFee = this.calculateGasFee(request, gasPrice)
    const bridgeFee = this.calculateBridgeFee(request)
    const dexFee = this.calculateDexFee(request)
    const slippageCost = this.calculateSlippageCost(request)
    
    const totalFee = gasFee + bridgeFee + dexFee + slippageCost
    const feePercentage = request.amount > 0 ? (totalFee / request.amount) * 100 : 0

    return {
      gasFee,
      bridgeFee,
      dexFee,
      slippageCost,
      totalFee,
      feePercentage,
    }
  }

  /**
   * Estimate costs with confidence intervals
   */
  estimateCosts(request: PaymentRequest, gasPrice?: number): CostEstimate {
    const baseBreakdown = this.calculateFees(request, gasPrice)
    
    // Calculate min/max based on gas price variations
    const gasPriceVariation = 0.2 // 20% variation
    const minGasPrice = (gasPrice || this.getDefaultGasPrice(request.chain)) * (1 - gasPriceVariation)
    const maxGasPrice = (gasPrice || this.getDefaultGasPrice(request.chain)) * (1 + gasPriceVariation)
    
    const minBreakdown = this.calculateFees(request, minGasPrice)
    const maxBreakdown = this.calculateFees(request, maxGasPrice)
    
    // Determine confidence based on gas price availability
    const confidence: "low" | "medium" | "high" = 
      gasPrice ? "high" : 
      request.priority === "critical" || request.priority === "high" ? "medium" : "low"

    return {
      estimatedCost: baseBreakdown.totalFee,
      minCost: minBreakdown.totalFee,
      maxCost: maxBreakdown.totalFee,
      confidence,
      breakdown: baseBreakdown,
    }
  }

  /**
   * Calculate gas fee
   */
  private calculateGasFee(request: PaymentRequest, gasPrice?: number): number {
    const gasLimit = this.getGasLimit(request.type, request.chain)
    const price = gasPrice || this.getDefaultGasPrice(request.chain)
    
    if (request.chain === "ethereum") {
      // Convert Gwei to Wei, then to USD
      const gasCostEth = (gasLimit * price) / 1e9
      return gasCostEth * this.ethPrice
    } else {
      // Stacks: microSTX to STX, then to USD (assuming 1 STX = $1.5)
      const gasCostStx = (gasLimit * price) / 1e6
      return gasCostStx * 1.5
    }
  }

  /**
   * Calculate bridge fee
   */
  private calculateBridgeFee(request: PaymentRequest): number {
    if (request.type === "bridge_deposit" || request.type === "bridge_withdrawal") {
      return request.amount * this.defaultBridgeFeeRate
    }
    return 0
  }

  /**
   * Calculate DEX fee
   */
  private calculateDexFee(request: PaymentRequest): number {
    if (request.type === "swap") {
      return request.amount * this.defaultDexFeeRate
    }
    return 0
  }

  /**
   * Calculate slippage cost
   */
  private calculateSlippageCost(request: PaymentRequest): number {
    if (request.type === "swap") {
      return request.amount * this.defaultSlippageRate
    }
    return 0
  }

  /**
   * Get gas limit for payment type
   */
  private getGasLimit(type: PaymentRequest["type"], chain: "ethereum" | "stacks"): number {
    if (type === "approve") {
      return this.approveGasLimit
    }
    if (type === "swap") {
      return chain === "ethereum" ? this.swapGasLimitEth : this.swapGasLimitStacks
    }
    // Bridge operations don't use gas directly
    return 0
  }

  /**
   * Get default gas price for chain
   */
  private getDefaultGasPrice(chain: "ethereum" | "stacks"): number {
    return chain === "ethereum" ? this.defaultEthGasPrice : this.defaultStacksGasPrice
  }

  /**
   * Optimize fee by suggesting optimal gas price
   */
  optimizeGasPrice(
    chain: "ethereum" | "stacks",
    currentPrice: number,
    priority: PaymentRequest["priority"],
  ): number {
    // For high priority, use slightly higher gas price
    // For low priority, use slightly lower gas price
    const multipliers: Record<PaymentRequest["priority"], number> = {
      critical: 1.15,
      high: 1.05,
      medium: 1.0,
      low: 0.95,
    }

    return currentPrice * multipliers[priority]
  }

  /**
   * Calculate fee savings from optimization
   */
  calculateSavings(originalFee: number, optimizedFee: number): {
    savings: number
    savingsPercentage: number
  } {
    const savings = originalFee - optimizedFee
    const savingsPercentage = originalFee > 0 ? (savings / originalFee) * 100 : 0

    return {
      savings,
      savingsPercentage,
    }
  }

  /**
   * Update ETH price (should be called periodically)
   */
  updateEthPrice(price: number): void {
    if (Number.isFinite(price) && price > 0) {
      this.ethPrice = price
      logger.debug(`ETH price updated to $${price}`)
    }
  }

  /**
   * Get current ETH price
   */
  getEthPrice(): number {
    return this.ethPrice
  }
}


