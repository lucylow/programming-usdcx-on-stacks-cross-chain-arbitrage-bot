import { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"
import { BotError, getErrorMessage, getErrorCode, isRetryableError } from "../utils/errors"

/**
 * Standardized API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
    retryable?: boolean
  }
  timestamp: string
}

/**
 * Error handler middleware
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Log the error
  logger.error("Request error:", {
    method: req.method,
    path: req.path,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })

  // Handle BotError instances
  if (error instanceof BotError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.context,
        retryable: error.retryable,
      },
      timestamp: new Date().toISOString(),
    }

    res.status(error.statusCode).json(response)
    return
  }

  // Handle validation errors
  if (error instanceof Error && error.name === "ValidationError") {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }

    res.status(400).json(response)
    return
  }

  // Handle unknown errors
  const response: ApiResponse = {
    success: false,
    error: {
      code: getErrorCode(error),
      message: getErrorMessage(error),
      retryable: isRetryableError(error),
    },
    timestamp: new Date().toISOString(),
  }

  res.status(500).json(response)
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, res: Response, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }

  res.status(statusCode).json(response)
}

