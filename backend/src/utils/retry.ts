import { logger } from "./logger"
import { isRetryableError, getErrorMessage, TimeoutError } from "./errors"

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  timeout?: number
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  timeout: 30000,
  onRetry: (attempt, error) => {
    logger.warn(`Retry attempt ${attempt} after error: ${getErrorMessage(error)}`)
  },
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1)
  return Math.min(delay, options.maxDelay)
}

/**
 * Create a timeout promise
 */
function createTimeout(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      // Race between the function and timeout
      const result = await Promise.race([fn(), createTimeout(opts.timeout)])
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt > opts.maxRetries) {
        break
      }

      // Call onRetry callback
      if (opts.onRetry) {
        opts.onRetry(attempt, lastError)
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, opts)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // All retries exhausted
  if (lastError) {
    throw lastError
  }

  throw new Error("Retry failed with unknown error")
}

/**
 * Retry with exponential backoff and jitter
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Add jitter to delay calculation
  const originalOnRetry = opts.onRetry
  opts.onRetry = (attempt, error) => {
    if (originalOnRetry) {
      originalOnRetry(attempt, error)
    }
  }

  return retry(fn, {
    ...opts,
    initialDelay: opts.initialDelay + Math.random() * 1000, // Add jitter
  })
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: "closed" | "open" | "half-open" = "closed"

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "half-open"
        logger.info("Circuit breaker: transitioning to half-open state")
      } else {
        throw new Error("Circuit breaker is open")
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
      logger.info("Circuit breaker: closed after successful operation")
    }
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = "open"
      logger.warn(`Circuit breaker: opened after ${this.failures} failures`)
    }
  }

  reset(): void {
    this.failures = 0
    this.state = "closed"
    this.lastFailureTime = 0
  }

  getState(): string {
    return this.state
  }
}

