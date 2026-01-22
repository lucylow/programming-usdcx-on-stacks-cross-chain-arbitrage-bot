/**
 * Custom error classes for better error categorization and handling
 */

export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public context?: Record<string, any>,
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
  constructor(message: string, context?: Record<string, any>) {
    super(message, "NETWORK_ERROR", 503, true, context)
  }
}

export class TimeoutError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "TIMEOUT_ERROR", 504, true, context)
  }
}

export class ValidationError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, false, context)
  }
}

export class BridgeError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "BRIDGE_ERROR", 502, true, context)
  }
}

export class ExecutionError extends BotError {
  constructor(message: string, public step?: number, context?: Record<string, any>) {
    super(message, "EXECUTION_ERROR", 500, false, { ...context, step })
  }
}

export class PriceOracleError extends BotError {
  constructor(message: string, public dex?: string, context?: Record<string, any>) {
    super(message, "PRICE_ORACLE_ERROR", 503, true, { ...context, dex })
  }
}

export class RiskManagerError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "RISK_MANAGER_ERROR", 403, false, context)
  }
}

export class ConfigurationError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "CONFIGURATION_ERROR", 500, false, context)
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

