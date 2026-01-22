import { Request, Response, NextFunction } from "express"
import { ValidationError } from "../utils/errors"

/**
 * Validation middleware factory
 */
export function validateRequest(schema: {
  body?: (body: unknown) => boolean | string
  query?: (query: unknown) => boolean | string
  params?: (params: unknown) => boolean | string
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body
      if (schema.body) {
        const bodyResult = schema.body(req.body)
        if (bodyResult !== true) {
          throw new ValidationError(
            typeof bodyResult === "string" ? bodyResult : "Invalid request body",
            { body: req.body },
          )
        }
      }

      // Validate query
      if (schema.query) {
        const queryResult = schema.query(req.query)
        if (queryResult !== true) {
          throw new ValidationError(
            typeof queryResult === "string" ? queryResult : "Invalid query parameters",
            { query: req.query },
          )
        }
      }

      // Validate params
      if (schema.params) {
        const paramsResult = schema.params(req.params)
        if (paramsResult !== true) {
          throw new ValidationError(
            typeof paramsResult === "string" ? paramsResult : "Invalid route parameters",
            { params: req.params },
          )
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Common validation helpers
 */
export const validators = {
  chainId: (value: unknown): boolean | string => {
    if (typeof value !== "string" && typeof value !== "number") {
      return "Chain ID must be a string or number"
    }
    const chainId = typeof value === "string" ? Number.parseInt(value, 10) : value
    if (Number.isNaN(chainId) || chainId <= 0) {
      return "Chain ID must be a positive number"
    }
    return true
  },

  address: (value: unknown): boolean | string => {
    if (typeof value !== "string") {
      return "Address must be a string"
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(value) && !/^[SP][0-9A-Z]{38}$/.test(value)) {
      return "Invalid address format"
    }
    return true
  },

  txHash: (value: unknown): boolean | string => {
    if (typeof value !== "string") {
      return "Transaction hash must be a string"
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
      return "Invalid transaction hash format"
    }
    return true
  },

  positiveNumber: (value: unknown): boolean | string => {
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    if (typeof num !== "number" || Number.isNaN(num) || num <= 0) {
      return "Must be a positive number"
    }
    return true
  },

  array: (value: unknown): boolean | string => {
    if (!Array.isArray(value)) {
      return "Must be an array"
    }
    return true
  },

  nonEmptyString: (value: unknown): boolean | string => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return "Must be a non-empty string"
    }
    return true
  },
}

