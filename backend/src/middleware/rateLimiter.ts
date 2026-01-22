import { Request, Response, NextFunction } from "express"
import { config } from "../config"
import { logger } from "../utils/logger"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */
export function rateLimiter(
  windowMs: number = config.api.rateLimitWindowMs,
  maxRequests: number = config.api.rateLimitMaxRequests,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || "unknown"
    const now = Date.now()

    // Clean up expired entries
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k]
      }
    })

    // Get or create entry
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      }
    }

    const entry = store[key]

    // Check if window has expired
    if (entry.resetTime < now) {
      entry.count = 0
      entry.resetTime = now + windowMs
    }

    // Increment count
    entry.count++

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests.toString())
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count).toString())
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetTime).toISOString())

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn("Rate limit exceeded", {
        ip: key,
        path: req.path,
        count: entry.count,
      })

      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs}ms`,
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    next()
  }
}

