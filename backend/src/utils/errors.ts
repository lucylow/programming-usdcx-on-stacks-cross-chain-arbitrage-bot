/**
 * Custom error classes for better error categorization and handling
 */

export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
    // Error.captureStackTrace is Node.js specific, make it optional for browser compatibility
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class NetworkError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "NETWORK_ERROR", 503, true, context)
  }
}

export class TimeoutError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "TIMEOUT_ERROR", 504, true, context)
  }
}

export class ValidationError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, false, context)
  }
}

export class BridgeError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "BRIDGE_ERROR", 502, true, context)
  }
}

export class ExecutionError extends BotError {
  constructor(message: string, public step?: number, context?: Record<string, unknown>) {
    super(message, "EXECUTION_ERROR", 500, false, { ...context, step })
  }
}

export class PriceOracleError extends BotError {
  constructor(message: string, public dex?: string, context?: Record<string, unknown>) {
    super(message, "PRICE_ORACLE_ERROR", 503, true, { ...context, dex })
  }
}

export class RiskManagerError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "RISK_MANAGER_ERROR", 403, false, context)
  }
}

export class ConfigurationError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CONFIGURATION_ERROR", 500, false, context)
  }
}

export class USDCxError extends BotError {
  constructor(message: string, public operation?: string, context?: Record<string, any>) {
    super(message, "USDCX_ERROR", 500, false, { ...context, operation })
  }
}

export class AllowanceError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "ALLOWANCE_ERROR", 400, false, context)
  }
}

export class StakingError extends BotError {
  constructor(message: string, public stakeId?: number, context?: Record<string, unknown>) {
    super(message, "STAKING_ERROR", 500, false, { ...context, stakeId })
  }
}

export class LendingError extends BotError {
  constructor(message: string, public operation?: "supply" | "withdraw" | "borrow" | "repay", context?: Record<string, unknown>) {
    super(message, "LENDING_ERROR", 500, false, { ...context, operation })
  }
}

export class BlockchainError extends BotError {
  constructor(
    message: string,
    public chain?: "ethereum" | "stacks",
    context?: Record<string, unknown>,
  ) {
    super(message, "BLOCKCHAIN_ERROR", 502, true, { ...context, chain })
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof BotError) {
    return error.retryable
  }

  // Network errors are typically retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("etimedout")
    )
  }

  return false
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Unknown error occurred"
}

/**
 * Extract error code safely
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof BotError) {
    return error.code
  }
  return "UNKNOWN_ERROR"
}

/**
 * Mock data generators for fallback when errors occur
 */
export const MockDataFallback = {
  /**
   * Generate mock bot status
   */
  botStatus: () => ({
    running: false,
    activeTrades: 0,
    queueLength: 0,
    opportunitiesDetected: 0,
    tradesExecuted: 0,
    totalProfit: 0,
    winRate: 0,
    avgProfit: 0,
    uptime: 0,
  }),

  /**
   * Generate mock price data
   */
  prices: () => [
    {
      chain: "ethereum" as const,
      dex: "Uniswap V3",
      pair: "USDC/ETH",
      price: 0.00041,
      liquidity: 45000000,
      confidence: 0.95,
      change24h: 0.5,
      timestamp: Date.now(),
    },
    {
      chain: "stacks" as const,
      dex: "ALEX",
      pair: "USDCx/STX",
      price: 0.52,
      liquidity: 8500000,
      confidence: 0.92,
      change24h: 1.2,
      timestamp: Date.now(),
    },
  ],

  /**
   * Generate mock arbitrage opportunities
   */
  opportunities: () => [
    {
      id: `opp_mock_${Date.now()}`,
      sourceChain: "ethereum" as const,
      targetChain: "stacks" as const,
      sourceDex: "Uniswap V3",
      targetDex: "ALEX",
      tokenPair: "USDC/ETH",
      sourcePrice: 1.0,
      targetPrice: 1.005,
      spread: 0.5,
      expectedProfit: 50,
      confidence: 0.75,
      status: "active" as const,
      tradeSize: 10000,
      detectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    },
  ],

  /**
   * Generate mock trade results
   */
  trades: () => [
    {
      id: `trade_mock_${Date.now()}`,
      opportunityId: `opp_mock_${Date.now()}`,
      status: "success" as const,
      profit: 45.5,
      roi: 0.00455,
      executionTime: 3500,
      gasCost: 12.5,
      bridgeFee: 15.0,
      slippage: 0.2,
      txHashes: {
        source: "0x" + "0".repeat(64),
        bridge: "0x" + "0".repeat(64),
        target: "0x" + "0".repeat(64),
      },
      timestamp: Date.now(),
    },
  ],

  /**
   * Generate mock performance metrics
   */
  performance: () => ({
    period: "daily" as const,
    totalTrades: 0,
    profitableTrades: 0,
    totalVolume: 0,
    totalProfit: 0,
    avgProfitPerTrade: 0,
    maxProfit: 0,
    maxLoss: 0,
    sharpeRatio: 0,
    winRate: 0,
  }),

  /**
   * Generate mock health check response
   */
  health: () => ({
    status: "degraded",
    timestamp: new Date().toISOString(),
    message: "Using fallback mock data due to errors",
  }),

  /**
   * Get mock data based on endpoint pattern
   */
  getMockDataForEndpoint: <T>(endpoint: string): T | null => {
    const endpointMap: Record<string, () => unknown> = {
      "/health": MockDataFallback.health,
      "/bot/status": MockDataFallback.botStatus,
      "/prices": MockDataFallback.prices,
      "/opportunities": MockDataFallback.opportunities,
      "/trades": MockDataFallback.trades,
      "/performance": MockDataFallback.performance,
    }

    for (const [key, generator] of Object.entries(endpointMap)) {
      if (endpoint.includes(key)) {
        return generator() as T
      }
    }

    return null
  },
}

