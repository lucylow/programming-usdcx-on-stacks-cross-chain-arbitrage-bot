type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogContext {
  [key: string]: unknown
}

/**
 * Convert an error or unknown value to LogContext format
 */
export function toLogContext(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      error: error.message,
      name: error.name,
      stack: error.stack,
    }
  }
  if (error && typeof error === "object") {
    return error as LogContext
  }
  if (typeof error === "string") {
    return { message: error }
  }
  return { value: String(error) }
}

class Logger {
  private logLevel: LogLevel
  private enabled: boolean

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "info"
    this.enabled = process.env.LOG_ENABLED !== "false"
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false

    const levels: LogLevel[] = ["error", "warn", "info", "debug"]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)

    return messageLevelIndex <= currentLevelIndex
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private normalizeContext(context?: LogContext | unknown): LogContext | undefined {
    if (!context) return undefined
    // If it's already a LogContext-like object (plain object with string keys), return as-is
    if (typeof context === "object" && !Array.isArray(context) && context !== null) {
      // Check if all keys are strings (LogContext requirement)
      const keys = Object.keys(context)
      if (keys.length === 0 || keys.every(key => typeof key === "string")) {
        return context as LogContext
      }
    }
    // Convert Error, string, or other types to LogContext
    return toLogContext(context)
  }

  private log(level: LogLevel, message: string, context?: LogContext | unknown): void {
    if (!this.shouldLog(level)) return

    const normalizedContext = this.normalizeContext(context)
    const formattedMessage = this.formatMessage(level, message, normalizedContext)

    switch (level) {
      case "error":
        console.error(formattedMessage)
        break
      case "warn":
        console.warn(formattedMessage)
        break
      case "debug":
        console.debug(formattedMessage)
        break
      case "info":
      default:
        console.log(formattedMessage)
    }
  }

  info(message: string, context?: LogContext | unknown): void {
    this.log("info", message, context)
  }

  warn(message: string, context?: LogContext | unknown): void {
    this.log("warn", message, context)
  }

  error(message: string, context?: LogContext | unknown): void {
    this.log("error", message, context)
  }

  debug(message: string, context?: LogContext | unknown): void {
    this.log("debug", message, context)
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: LogContext | unknown): void {
    const normalizedContext = this.normalizeContext(context)
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...normalizedContext,
      operation,
      duration,
    })
  }

  /**
   * Log API request/response
   */
  api(method: string, path: string, statusCode: number, duration: number, context?: LogContext | unknown): void {
    const normalizedContext = this.normalizeContext(context)
    this.info(`API ${method} ${path} ${statusCode}`, {
      ...normalizedContext,
      method,
      path,
      statusCode,
      duration,
    })
  }
}

export const logger = new Logger()
