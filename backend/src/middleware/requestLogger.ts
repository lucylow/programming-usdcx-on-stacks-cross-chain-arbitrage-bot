import { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()

  // Log request
  logger.info("Incoming request", {
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  })

  // Override res.json to log response
  const originalJson = res.json.bind(res)
  res.json = function (body: unknown) {
    const duration = Date.now() - startTime

    logger.info("Request completed", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    })

    return originalJson(body)
  }

  next()
}

