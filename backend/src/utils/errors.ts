/**
 * Custom error classes for better error categorization and handling
 */

// Error code constants for type safety
export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BRIDGE_ERROR: "BRIDGE_ERROR",
  EXECUTION_ERROR: "EXECUTION_ERROR",
  PRICE_ORACLE_ERROR: "PRICE_ORACLE_ERROR",
  RISK_MANAGER_ERROR: "RISK_MANAGER_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  USDCX_ERROR: "USDCX_ERROR",
  ALLOWANCE_ERROR: "ALLOWANCE_ERROR",
  STAKING_ERROR: "STAKING_ERROR",
  LENDING_ERROR: "LENDING_ERROR",
  BLOCKCHAIN_ERROR: "BLOCKCHAIN_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  CIRCUIT_BREAKER_OPEN: "CIRCUIT_BREAKER_OPEN",
  RESOURCE_EXHAUSTED: "RESOURCE_EXHAUSTED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Type definitions for better type safety
export interface ErrorContext extends Record<string, unknown> {
  step?: number
  dex?: string
  operation?: string
  stakeId?: number
  chain?: "ethereum" | "stacks"
}

export interface ErrorOptions {
  statusCode?: number
  retryable?: boolean
  context?: ErrorContext
}

/**
 * Base error class for all bot-related errors
 */
export class BotError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly retryable: boolean
  public readonly context?: ErrorContext

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: ErrorContext,
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.retryable = retryable
    this.context = context

    // Error.captureStackTrace is Node.js specific, make it optional for browser compatibility
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    }

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, BotError.prototype)
  }

  /**
   * Convert error to a serializable format
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
    }
  }
}

/**
 * Network-related errors (retryable)
 */
export class NetworkError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.NETWORK_ERROR, 503, true, context)
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * Timeout errors (retryable)
 */
export class TimeoutError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.TIMEOUT_ERROR, 504, true, context)
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * Validation errors (not retryable)
 */
export class ValidationError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, false, context)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Bridge-related errors (retryable)
 */
export class BridgeError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.BRIDGE_ERROR, 502, true, context)
    Object.setPrototypeOf(this, BridgeError.prototype)
  }
}

/**
 * Execution errors with step tracking
 */
export class ExecutionError extends BotError {
  public readonly step?: number

  constructor(message: string, step?: number, context?: ErrorContext) {
    super(message, ERROR_CODES.EXECUTION_ERROR, 500, false, { ...context, step })
    this.step = step
    Object.setPrototypeOf(this, ExecutionError.prototype)
  }
}

/**
 * Price oracle errors (retryable)
 */
export class PriceOracleError extends BotError {
  public readonly dex?: string

  constructor(message: string, dex?: string, context?: ErrorContext) {
    super(message, ERROR_CODES.PRICE_ORACLE_ERROR, 503, true, { ...context, dex })
    this.dex = dex
    Object.setPrototypeOf(this, PriceOracleError.prototype)
  }
}

/**
 * Risk manager errors (not retryable)
 */
export class RiskManagerError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.RISK_MANAGER_ERROR, 403, false, context)
    Object.setPrototypeOf(this, RiskManagerError.prototype)
  }
}

/**
 * Configuration errors (not retryable)
 */
export class ConfigurationError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.CONFIGURATION_ERROR, 500, false, context)
    Object.setPrototypeOf(this, ConfigurationError.prototype)
  }
}

/**
 * USDCx operation errors
 */
export class USDCxError extends BotError {
  public readonly operation?: string

  constructor(message: string, operation?: string, context?: ErrorContext) {
    super(message, ERROR_CODES.USDCX_ERROR, 500, false, { ...context, operation })
    this.operation = operation
    Object.setPrototypeOf(this, USDCxError.prototype)
  }
}

/**
 * Allowance-related errors
 */
export class AllowanceError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.ALLOWANCE_ERROR, 400, false, context)
    Object.setPrototypeOf(this, AllowanceError.prototype)
  }
}

/**
 * Staking operation errors
 */
export class StakingError extends BotError {
  public readonly stakeId?: number

  constructor(message: string, stakeId?: number, context?: ErrorContext) {
    super(message, ERROR_CODES.STAKING_ERROR, 500, false, { ...context, stakeId })
    this.stakeId = stakeId
    Object.setPrototypeOf(this, StakingError.prototype)
  }
}

/**
 * Lending operation errors
 */
export type LendingOperation = "supply" | "withdraw" | "borrow" | "repay"

export class LendingError extends BotError {
  public readonly operation?: LendingOperation

  constructor(message: string, operation?: LendingOperation, context?: ErrorContext) {
    super(message, ERROR_CODES.LENDING_ERROR, 500, false, { ...context, operation })
    this.operation = operation
    Object.setPrototypeOf(this, LendingError.prototype)
  }
}

/**
 * Blockchain-specific errors (retryable)
 */
export type BlockchainChain = "ethereum" | "stacks"

export class BlockchainError extends BotError {
  public readonly chain?: BlockchainChain

  constructor(message: string, chain?: BlockchainChain, context?: ErrorContext) {
    super(message, ERROR_CODES.BLOCKCHAIN_ERROR, 502, true, { ...context, chain })
    this.chain = chain
    Object.setPrototypeOf(this, BlockchainError.prototype)
  }
}

/**
 * Rate limit errors (retryable with backoff)
 */
export class RateLimitError extends BotError {
  public readonly retryAfter?: number

  constructor(message: string, retryAfter?: number, context?: ErrorContext) {
    super(message, ERROR_CODES.RATE_LIMIT_ERROR, 429, true, { ...context, retryAfter })
    this.retryAfter = retryAfter
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * Database errors (may be retryable)
 */
export class DatabaseError extends BotError {
  constructor(message: string, retryable: boolean = true, context?: ErrorContext) {
    super(message, ERROR_CODES.DATABASE_ERROR, 500, retryable, context)
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

/**
 * Authentication errors (not retryable)
 */
export class AuthenticationError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.AUTHENTICATION_ERROR, 401, false, context)
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/**
 * Authorization errors (not retryable)
 */
export class AuthorizationError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.AUTHORIZATION_ERROR, 403, false, context)
    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

/**
 * Circuit breaker open errors (retryable after cooldown)
 */
export class CircuitBreakerOpenError extends BotError {
  public readonly cooldownUntil?: number

  constructor(message: string, cooldownUntil?: number, context?: ErrorContext) {
    super(message, ERROR_CODES.CIRCUIT_BREAKER_OPEN, 503, true, { ...context, cooldownUntil })
    this.cooldownUntil = cooldownUntil
    Object.setPrototypeOf(this, CircuitBreakerOpenError.prototype)
  }
}

/**
 * Resource exhausted errors (retryable with backoff)
 */
export class ResourceExhaustedError extends BotError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.RESOURCE_EXHAUSTED, 503, true, context)
    Object.setPrototypeOf(this, ResourceExhaustedError.prototype)
  }
}

/**
 * Network error patterns that indicate retryable errors
 */
const RETRYABLE_ERROR_PATTERNS = [
  "network",
  "timeout",
  "econnrefused",
  "enotfound",
  "etimedout",
  "econnreset",
  "socket",
  "eai_again",
  "epipe",
  "ehostunreach",
] as const

/**
 * Non-retryable error patterns
 */
const NON_RETRYABLE_ERROR_PATTERNS = [
  "invalid",
  "unauthorized",
  "forbidden",
  "not found",
  "bad request",
  "malformed",
  "parse error",
] as const

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): error is BotError & { retryable: true } {
  if (error instanceof BotError) {
    return error.retryable
  }

  // Network errors are typically retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Check for non-retryable patterns first
    if (NON_RETRYABLE_ERROR_PATTERNS.some((pattern) => message.includes(pattern))) {
      return false
    }
    
    return RETRYABLE_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
  }

  return false
}

/**
 * Extract error message safely from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  return "Unknown error occurred"
}

/**
 * Extract error code safely
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof BotError) {
    return error.code
  }
  return ERROR_CODES.UNKNOWN_ERROR
}

/**
 * Check if error is a BotError instance
 */
export function isBotError(error: unknown): error is BotError {
  return error instanceof BotError
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown): {
  error: string
  code: ErrorCode
  statusCode: number
  retryable: boolean
  context?: ErrorContext
} {
  if (error instanceof BotError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      context: error.context,
    }
  }

  return {
    error: getErrorMessage(error),
    code: ERROR_CODES.UNKNOWN_ERROR,
    statusCode: 500,
    retryable: isRetryableError(error),
  }
}

/**
 * Mock data generators for fallback when errors occur
 * Used by Lovable and other frontend clients when backend is unavailable
 */

// Type definitions for mock data
interface MockBotStatus {
  running: boolean
  activeTrades: number
  queueLength: number
  opportunitiesDetected: number
  tradesExecuted: number
  totalProfit: number
  winRate: number
  avgProfit: number
  uptime: number
}

interface MockPriceData {
  chain: "ethereum" | "stacks"
  dex: string
  pair: string
  price: number
  liquidity: number
  confidence: number
  change24h: number
  timestamp: number
}

interface MockOpportunity {
  id: string
  sourceChain: "ethereum" | "stacks"
  targetChain: "ethereum" | "stacks"
  sourceDex: string
  targetDex: string
  tokenPair: string
  sourcePrice: number
  targetPrice: number
  spread: number
  expectedProfit: number
  confidence: number
  status: "active" | "executing" | "completed" | "expired" | "failed"
  tradeSize: number
  detectedAt: string
  expiresAt: string
}

interface MockTrade {
  id: string
  opportunityId: string
  status: "success" | "failed" | "pending"
  profit: number
  roi: number
  executionTime: number
  gasCost: number
  bridgeFee: number
  slippage: number
  txHashes: {
    source: string
    bridge: string
    target: string
  }
  timestamp: number
}

interface MockPerformance {
  period: "daily" | "weekly" | "monthly"
  totalTrades: number
  profitableTrades: number
  totalVolume: number
  totalProfit: number
  avgProfitPerTrade: number
  maxProfit: number
  maxLoss: number
  sharpeRatio: number
  winRate: number
}

interface MockHealth {
  status: string
  timestamp: string
  message: string
}

// Endpoint mapping type
type EndpointKey = "/health" | "/bot/status" | "/prices" | "/opportunities" | "/trades" | "/performance"

/**
 * Mock data fallback generator
 * Provides safe fallback data when backend errors occur
 */
export const MockDataFallback = {
  /**
   * Generate mock bot status
   */
  botStatus: (): MockBotStatus => ({
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
  prices: (): MockPriceData[] => [
    {
      chain: "ethereum",
      dex: "Uniswap V3",
      pair: "USDC/ETH",
      price: 0.00041,
      liquidity: 45000000,
      confidence: 0.95,
      change24h: 0.5,
      timestamp: Date.now(),
    },
    {
      chain: "stacks",
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
  opportunities: (): MockOpportunity[] => [
    {
      id: `opp_mock_${Date.now()}`,
      sourceChain: "ethereum",
      targetChain: "stacks",
      sourceDex: "Uniswap V3",
      targetDex: "ALEX",
      tokenPair: "USDC/ETH",
      sourcePrice: 1.0,
      targetPrice: 1.005,
      spread: 0.5,
      expectedProfit: 50,
      confidence: 0.75,
      status: "active",
      tradeSize: 10000,
      detectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    },
  ],

  /**
   * Generate mock trade results
   */
  trades: (): MockTrade[] => [
    {
      id: `trade_mock_${Date.now()}`,
      opportunityId: `opp_mock_${Date.now()}`,
      status: "success",
      profit: 45.5,
      roi: 0.00455,
      executionTime: 3500,
      gasCost: 12.5,
      bridgeFee: 15.0,
      slippage: 0.2,
      txHashes: {
        source: `0x${"0".repeat(64)}`,
        bridge: `0x${"0".repeat(64)}`,
        target: `0x${"0".repeat(64)}`,
      },
      timestamp: Date.now(),
    },
  ],

  /**
   * Generate mock performance metrics
   */
  performance: (): MockPerformance => ({
    period: "daily",
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
  health: (): MockHealth => ({
    status: "degraded",
    timestamp: new Date().toISOString(),
    message: "Using fallback mock data due to errors",
  }),

  /**
   * Get mock data based on endpoint pattern
   * Compatible with Lovable and other frontend clients
   */
  getMockDataForEndpoint: <T = unknown>(endpoint: string): T | null => {
    const endpointMap: Record<EndpointKey, () => unknown> = {
      "/health": MockDataFallback.health,
      "/bot/status": MockDataFallback.botStatus,
      "/prices": MockDataFallback.prices,
      "/opportunities": MockDataFallback.opportunities,
      "/trades": MockDataFallback.trades,
      "/performance": MockDataFallback.performance,
    }

    // Find matching endpoint (supports partial matches for flexibility)
    const matchedKey = Object.keys(endpointMap).find((key) =>
      endpoint.includes(key),
    ) as EndpointKey | undefined

    if (matchedKey && endpointMap[matchedKey]) {
      return endpointMap[matchedKey]() as T
    }

    return null
  },
} as const

// ==================== Advanced Error Handling Utilities ====================

/**
 * Circuit Breaker implementation for preventing cascading failures
 */
export class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number = 0
  private state: "closed" | "open" | "half-open" = "closed"

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeout: number = 60000, // 1 minute
    private readonly halfOpenMaxAttempts: number = 3,
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, context?: ErrorContext): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "half-open"
        this.failures = 0
      } else {
        throw new CircuitBreakerOpenError(
          "Circuit breaker is open. Service unavailable.",
          this.lastFailureTime + this.resetTimeout,
          context,
        )
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    if (this.state === "half-open") {
      this.state = "closed"
    }
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = "open"
    } else if (this.state === "half-open" && this.failures >= this.halfOpenMaxAttempts) {
      this.state = "open"
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    }
  }

  /**
   * Reset circuit breaker manually
   */
  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = "closed"
  }
}

/**
 * Error rate tracker for monitoring error frequency
 */
export class ErrorRateTracker {
  private errors: Array<{ timestamp: number; code: ErrorCode }> = []
  private readonly windowSize: number

  constructor(windowSizeMs: number = 60000) {
    this.windowSize = windowSizeMs
  }

  /**
   * Record an error
   */
  recordError(error: unknown): void {
    const code = getErrorCode(error)
    this.errors.push({ timestamp: Date.now(), code })
    this.cleanup()
  }

  /**
   * Get error rate (errors per minute)
   */
  getErrorRate(): number {
    this.cleanup()
    const windowStart = Date.now() - this.windowSize
    const recentErrors = this.errors.filter((e) => e.timestamp >= windowStart)
    return (recentErrors.length / this.windowSize) * 60000
  }

  /**
   * Get error count by code
   */
  getErrorCounts(): Record<ErrorCode, number> {
    this.cleanup()
    const counts = {} as Record<ErrorCode, number>
    const windowStart = Date.now() - this.windowSize
    const recentErrors = this.errors.filter((e) => e.timestamp >= windowStart)

    for (const error of recentErrors) {
      counts[error.code] = (counts[error.code] || 0) + 1
    }

    return counts
  }

  /**
   * Check if error rate exceeds threshold
   */
  exceedsThreshold(threshold: number): boolean {
    return this.getErrorRate() > threshold
  }

  private cleanup(): void {
    const windowStart = Date.now() - this.windowSize
    this.errors = this.errors.filter((e) => e.timestamp >= windowStart)
  }

  /**
   * Reset error tracker
   */
  reset(): void {
    this.errors = []
  }
}

/**
 * Error recovery strategies
 */
export interface RecoveryStrategy<T> {
  shouldRetry(error: unknown, attempt: number): boolean
  getDelay(attempt: number): number
  onRecovery?(result: T): void
  onFailure?(error: unknown, attempt: number): void
}

/**
 * Default recovery strategy with exponential backoff
 */
export class ExponentialBackoffStrategy<T> implements RecoveryStrategy<T> {
  constructor(
    private readonly maxAttempts: number = 5,
    private readonly initialDelay: number = 1000,
    private readonly maxDelay: number = 30000,
    private readonly multiplier: number = 2,
  ) {}

  shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.maxAttempts) {
      return false
    }
    return isRetryableError(error)
  }

  getDelay(attempt: number): number {
    const delay = this.initialDelay * Math.pow(this.multiplier, attempt - 1)
    return Math.min(delay, this.maxDelay)
  }
}

/**
 * Execute a function with error recovery
 */
export async function withErrorRecovery<T>(
  fn: () => Promise<T>,
  strategy: RecoveryStrategy<T> = new ExponentialBackoffStrategy(),
): Promise<T> {
  let lastError: unknown
  let attempt = 0

  while (true) {
    attempt++
    try {
      const result = await fn()
      if (strategy.onRecovery) {
        strategy.onRecovery(result)
      }
      return result
    } catch (error) {
      lastError = error

      if (strategy.onFailure) {
        strategy.onFailure(error, attempt)
      }

      if (!strategy.shouldRetry(error, attempt)) {
        throw error
      }

      const delay = strategy.getDelay(attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Aggregate multiple errors into a single error
 */
export class AggregatedError extends BotError {
  public readonly errors: readonly unknown[]

  constructor(message: string, errors: unknown[], context?: ErrorContext) {
    const allRetryable = errors.every((e) => isRetryableError(e))
    super(message, ERROR_CODES.UNKNOWN_ERROR, 500, allRetryable, context)
    this.errors = errors
    Object.setPrototypeOf(this, AggregatedError.prototype)
  }

  /**
   * Get all error messages
   */
  getAllMessages(): string[] {
    return this.errors.map((e) => getErrorMessage(e))
  }

  /**
   * Get all error codes
   */
  getAllCodes(): ErrorCode[] {
    return this.errors.map((e) => getErrorCode(e))
  }
}

/**
 * Wrap multiple promises and aggregate errors
 */
export async function aggregateResults<T>(
  promises: Promise<T>[],
): Promise<{ successes: T[]; errors: unknown[] }> {
  const results = await Promise.allSettled(promises)
  const successes: T[] = []
  const errors: unknown[] = []

  for (const result of results) {
    if (result.status === "fulfilled") {
      successes.push(result.value)
    } else {
      errors.push(result.reason)
    }
  }

  return { successes, errors }
}

/**
 * Safe async wrapper that never throws
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  defaultValue?: T,
): Promise<{ success: boolean; data?: T; error?: unknown }> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    return { success: false, error, data: defaultValue }
  }
}

/**
 * Error context builder for better error tracking
 */
export class ErrorContextBuilder {
  private context: ErrorContext = {}

  add(key: string, value: unknown): this {
    this.context[key] = value
    return this
  }

  addStep(step: number): this {
    this.context.step = step
    return this
  }

  addChain(chain: "ethereum" | "stacks"): this {
    this.context.chain = chain
    return this
  }

  addOperation(operation: string): this {
    this.context.operation = operation
    return this
  }

  addDex(dex: string): this {
    this.context.dex = dex
    return this
  }

  addStakeId(stakeId: number): this {
    this.context.stakeId = stakeId
    return this
  }

  build(): ErrorContext {
    return { ...this.context }
  }

  reset(): this {
    this.context = {}
    return this
  }
}

/**
 * Create a new error context builder
 */
export function createErrorContext(): ErrorContextBuilder {
  return new ErrorContextBuilder()
}

/**
 * Wrap an error with additional context
 */
export function wrapError(
  error: unknown,
  additionalContext?: ErrorContext,
  message?: string,
): BotError {
  const errorMessage = message || getErrorMessage(error)
  const errorCode = getErrorCode(error)
  const isRetryable = isRetryableError(error)

  // Merge contexts
  let context: ErrorContext = {}
  if (error instanceof BotError && error.context) {
    context = { ...error.context }
  }
  if (additionalContext) {
    context = { ...context, ...additionalContext }
  }

  return new BotError(errorMessage, errorCode, 500, isRetryable, context)
}

/**
 * Error boundary for critical operations
 * Prevents errors from propagating and provides fallback behavior
 */
export interface ErrorBoundaryOptions<T> {
  fallback?: () => T | Promise<T>
  onError?: (error: unknown) => void
  shouldCatch?: (error: unknown) => boolean
  maxRetries?: number
  retryDelay?: number
}

/**
 * Execute a function within an error boundary
 */
export async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  options: ErrorBoundaryOptions<T> = {},
): Promise<T> {
  const {
    fallback,
    onError,
    shouldCatch = () => true,
    maxRetries = 0,
    retryDelay = 1000,
  } = options

  let lastError: unknown
  let attempts = 0

  while (attempts <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      attempts++

      if (!shouldCatch(error)) {
        throw error
      }

      if (onError) {
        onError(error)
      }

      if (attempts <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        continue
      }

      if (fallback) {
        try {
          return await fallback()
        } catch (fallbackError) {
          throw new AggregatedError(
            "Both primary operation and fallback failed",
            [error, fallbackError],
          )
        }
      }

      throw error
    }
  }

  throw lastError
}

/**
 * Execute a function with timeout and error handling
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage?: string,
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new TimeoutError(
            errorMessage || `Operation timed out after ${timeoutMs}ms`,
            { timeoutMs },
          ),
        )
      }, timeoutMs)
    }),
  ])
}

/**
 * Execute multiple operations with error isolation
 * Errors in one operation don't affect others
 */
export async function withErrorIsolation<T>(
  operations: Array<() => Promise<T>>,
  options: {
    continueOnError?: boolean
    onError?: (error: unknown, index: number) => void
  } = {},
): Promise<Array<{ success: boolean; data?: T; error?: unknown; index: number }>> {
  const { continueOnError = true, onError } = options

  const results = await Promise.allSettled(
    operations.map((op, index) =>
      op().then(
        (data) => ({ success: true, data, index }),
        (error) => {
          if (onError) {
            onError(error, index)
          }
          if (!continueOnError) {
            throw error
          }
          return { success: false, error, index }
        },
      ),
    ),
  )

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value
    }
    return { success: false, error: result.reason, index }
  })
}

/**
 * Retry with exponential backoff and error tracking
 */
export async function retryWithTracking<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    multiplier?: number
    onRetry?: (attempt: number, error: unknown) => void
    shouldRetry?: (error: unknown, attempt: number) => boolean
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    onRetry,
    shouldRetry = isRetryableError,
  } = options

  let lastError: unknown
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      attempt++

      if (!shouldRetry(error, attempt) || attempt > maxRetries) {
        throw error
      }

      if (onRetry) {
        onRetry(attempt, error)
      }

      const delay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Graceful degradation wrapper
 * Tries primary function, falls back to secondary if it fails
 */
export async function withGracefulDegradation<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  options: {
    onFallback?: (error: unknown) => void
    shouldUseFallback?: (error: unknown) => boolean
  } = {},
): Promise<T> {
  const { onFallback, shouldUseFallback = () => true } = options

  try {
    return await primary()
  } catch (error) {
    if (!shouldUseFallback(error)) {
      throw error
    }

    if (onFallback) {
      onFallback(error)
    }

    try {
      return await fallback()
    } catch (fallbackError) {
      throw new AggregatedError(
        "Both primary and fallback operations failed",
        [error, fallbackError],
      )
    }
  }
}

// ==================== Additional Error Handling Utilities ====================

/**
 * Error correlation ID for tracking related errors
 */
let correlationIdCounter = 0

/**
 * Generate a unique correlation ID for error tracking
 */
export function generateCorrelationId(): string {
  return `err_${Date.now()}_${++correlationIdCounter}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Sanitize error messages to remove sensitive information
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove private keys, API keys, passwords, etc.
  const sensitivePatterns = [
    /private[_\s]?key[=:]\s*[a-zA-Z0-9]+/gi,
    /api[_\s]?key[=:]\s*[a-zA-Z0-9]+/gi,
    /password[=:]\s*[^\s]+/gi,
    /secret[=:]\s*[^\s]+/gi,
    /token[=:]\s*[a-zA-Z0-9]{20,}/gi,
    /0x[a-fA-F0-9]{64}/g, // Private keys
    /sk[a-zA-Z0-9]{50,}/g, // Stacks private keys
  ]

  let sanitized = message
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]")
  }

  return sanitized
}

/**
 * Sanitize error object to remove sensitive data
 */
export function sanitizeError(error: unknown): unknown {
  if (error instanceof Error) {
    const sanitized = new Error(sanitizeErrorMessage(error.message))
    sanitized.name = error.name
    sanitized.stack = error.stack
    return sanitized
  }

  if (typeof error === "string") {
    return sanitizeErrorMessage(error)
  }

  if (error && typeof error === "object") {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(error)) {
      if (typeof value === "string") {
        sanitized[key] = sanitizeErrorMessage(value)
      } else if (key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password")) {
        sanitized[key] = "[REDACTED]"
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  return error
}

/**
 * Parse error from various sources (HTTP, blockchain, etc.)
 */
export function parseError(error: unknown, context?: ErrorContext): BotError {
  // Already a BotError
  if (error instanceof BotError) {
    if (context) {
      return wrapError(error, context)
    }
    return error
  }

  // HTTP errors
  if (error && typeof error === "object" && "response" in error) {
    const httpError = error as { response?: { status?: number; data?: unknown }; message?: string }
    const status = httpError.response?.status || 500
    const message = httpError.message || "HTTP request failed"
    
    if (status === 429) {
      const retryAfter = httpError.response?.data && typeof httpError.response.data === "object" && "retryAfter" in httpError.response.data
        ? Number(httpError.response.data.retryAfter)
        : undefined
      return new RateLimitError(message, retryAfter, context)
    }

    if (status >= 500) {
      return new NetworkError(message, context)
    }

    if (status === 401) {
      return new AuthenticationError(message, context)
    }

    if (status === 403) {
      return new AuthorizationError(message, context)
    }

    if (status >= 400 && status < 500) {
      return new ValidationError(message, context)
    }
  }

  // Network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes("timeout") || message.includes("timed out")) {
      return new TimeoutError(error.message, context)
    }

    if (message.includes("network") || message.includes("econnrefused") || message.includes("enotfound")) {
      return new NetworkError(error.message, context)
    }

    if (message.includes("invalid") || message.includes("malformed")) {
      return new ValidationError(error.message, context)
    }
  }

  // Unknown error - wrap it
  return wrapError(error, context)
}

/**
 * Error metrics collector
 */
export class ErrorMetrics {
  private errors: Array<{ timestamp: number; code: ErrorCode; context?: ErrorContext }> = []
  private readonly maxErrors = 1000

  /**
   * Record an error
   */
  recordError(error: unknown, context?: ErrorContext): void {
    const code = getErrorCode(error)
    this.errors.push({ timestamp: Date.now(), code, context })
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }
  }

  /**
   * Get error statistics
   */
  getStats(timeWindowMs: number = 60000): {
    total: number
    byCode: Record<ErrorCode, number>
    recentErrors: Array<{ code: ErrorCode; timestamp: number; context?: ErrorContext }>
  } {
    const windowStart = Date.now() - timeWindowMs
    const recent = this.errors.filter((e) => e.timestamp >= windowStart)
    
    const byCode = {} as Record<ErrorCode, number>
    for (const error of recent) {
      byCode[error.code] = (byCode[error.code] || 0) + 1
    }

    return {
      total: recent.length,
      byCode,
      recentErrors: recent.map((e) => ({ code: e.code, timestamp: e.timestamp, context: e.context })),
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.errors = []
  }
}

/**
 * Global error metrics instance
 */
export const errorMetrics = new ErrorMetrics()

/**
 * Input validation error helper
 */
export class InputValidationError extends ValidationError {
  public readonly field: string
  public readonly value: unknown
  public readonly reason: string

  constructor(field: string, value: unknown, reason: string, context?: ErrorContext) {
    super(`Invalid input for field '${field}': ${reason}`, { ...context, field, value })
    this.field = field
    this.value = value
    this.reason = reason
    Object.setPrototypeOf(this, InputValidationError.prototype)
  }
}

/**
 * Validate and throw InputValidationError if invalid
 */
export function validateInput<T>(
  value: T | null | undefined,
  field: string,
  validator: (value: T) => boolean,
  reason: string = "validation failed",
): asserts value is T {
  if (value === null || value === undefined) {
    throw new InputValidationError(field, value, "value is required")
  }

  if (!validator(value)) {
    throw new InputValidationError(field, value, reason)
  }
}

/**
 * Safe number parsing with error handling
 */
export function safeParseNumber(
  value: string | number | null | undefined,
  field: string,
  options: {
    min?: number
    max?: number
    allowNaN?: boolean
    allowInfinity?: boolean
  } = {},
): number {
  if (value === null || value === undefined) {
    throw new InputValidationError(field, value, "value is required")
  }

  const num = typeof value === "number" ? value : Number.parseFloat(String(value))

  if (Number.isNaN(num) && !options.allowNaN) {
    throw new InputValidationError(field, value, "value is not a valid number")
  }

  if (!Number.isFinite(num) && !options.allowInfinity) {
    throw new InputValidationError(field, value, "value is not finite")
  }

  if (options.min !== undefined && num < options.min) {
    throw new InputValidationError(field, value, `value must be >= ${options.min}`)
  }

  if (options.max !== undefined && num > options.max) {
    throw new InputValidationError(field, value, `value must be <= ${options.max}`)
  }

  return num
}

/**
 * Safe integer parsing with error handling
 */
export function safeParseInt(
  value: string | number | null | undefined,
  field: string,
  options: {
    min?: number
    max?: number
    radix?: number
  } = {},
): number {
  if (value === null || value === undefined) {
    throw new InputValidationError(field, value, "value is required")
  }

  const num = typeof value === "number" ? value : Number.parseInt(String(value), options.radix || 10)

  if (Number.isNaN(num)) {
    throw new InputValidationError(field, value, "value is not a valid integer")
  }

  if (options.min !== undefined && num < options.min) {
    throw new InputValidationError(field, value, `value must be >= ${options.min}`)
  }

  if (options.max !== undefined && num > options.max) {
    throw new InputValidationError(field, value, `value must be <= ${options.max}`)
  }

  return num
}

/**
 * Safe string validation
 */
export function safeParseString(
  value: unknown,
  field: string,
  options: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    required?: boolean
  } = {},
): string {
  if (value === null || value === undefined) {
    if (options.required !== false) {
      throw new InputValidationError(field, value, "value is required")
    }
    return ""
  }

  const str = String(value)

  if (options.minLength !== undefined && str.length < options.minLength) {
    throw new InputValidationError(field, value, `value must be at least ${options.minLength} characters`)
  }

  if (options.maxLength !== undefined && str.length > options.maxLength) {
    throw new InputValidationError(field, value, `value must be at most ${options.maxLength} characters`)
  }

  if (options.pattern && !options.pattern.test(str)) {
    throw new InputValidationError(field, value, "value does not match required pattern")
  }

  return str
}

/**
 * Safe array validation
 */
export function safeParseArray<T>(
  value: unknown,
  field: string,
  validator?: (item: unknown, index: number) => T,
  options: {
    minLength?: number
    maxLength?: number
    required?: boolean
  } = {},
): T[] {
  if (value === null || value === undefined) {
    if (options.required !== false) {
      throw new InputValidationError(field, value, "value is required")
    }
    return []
  }

  if (!Array.isArray(value)) {
    throw new InputValidationError(field, value, "value must be an array")
  }

  if (options.minLength !== undefined && value.length < options.minLength) {
    throw new InputValidationError(field, value, `array must have at least ${options.minLength} items`)
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new InputValidationError(field, value, `array must have at most ${options.maxLength} items`)
  }

  if (validator) {
    return value.map((item, index) => {
      try {
        return validator(item, index)
      } catch (error) {
        throw new InputValidationError(field, item, `item at index ${index} is invalid: ${getErrorMessage(error)}`)
      }
    })
  }

  return value as T[]
}

/**
 * Execute with error correlation tracking
 */
export async function withErrorCorrelation<T>(
  fn: () => Promise<T>,
  correlationId?: string,
): Promise<T> {
  const id = correlationId || generateCorrelationId()
  
  try {
    return await fn()
  } catch (error) {
    // Add correlation ID to error context by wrapping the error
    const contextWithCorrelation = { correlationId: id }
    if (error instanceof BotError) {
      // Merge existing context with correlation ID
      const mergedContext = error.context 
        ? { ...error.context, ...contextWithCorrelation }
        : contextWithCorrelation
      const wrappedError = wrapError(error, mergedContext)
      errorMetrics.recordError(wrappedError, mergedContext)
      throw wrappedError
    }
    
    errorMetrics.recordError(error, contextWithCorrelation)
    throw error
  }
}

/**
 * Retry with correlation tracking
 */
export async function retryWithCorrelation<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    multiplier?: number
    correlationId?: string
  } = {},
): Promise<T> {
  const correlationId = options.correlationId || generateCorrelationId()
  
  return retryWithTracking(fn, {
    ...options,
    onRetry: (attempt, error) => {
      errorMetrics.recordError(error, { correlationId, attempt })
    },
  })
}

