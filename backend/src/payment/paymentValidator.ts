import { logger } from "../utils/logger"
import { ValidationError } from "../utils/errors"
import type { PaymentRequest, PaymentResult } from "./paymentProcessor"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Payment Validator - Validates payment requests and results
 */
export class PaymentValidator {
  private readonly minAmount = 0.01 // Minimum payment amount
  private readonly maxAmount = 1000000 // Maximum payment amount
  private readonly validChains = ["ethereum", "stacks"]
  private readonly validTypes = ["approve", "swap", "bridge_deposit", "bridge_withdrawal"]

  /**
   * Validate payment request
   */
  validateRequest(request: Partial<PaymentRequest>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate amount
    if (!request.amount) {
      errors.push("Amount is required")
    } else if (!Number.isFinite(request.amount)) {
      errors.push("Amount must be a valid number")
    } else if (request.amount < this.minAmount) {
      errors.push(`Amount must be at least ${this.minAmount}`)
    } else if (request.amount > this.maxAmount) {
      errors.push(`Amount exceeds maximum of ${this.maxAmount}`)
    }

    // Validate chain
    if (!request.chain) {
      errors.push("Chain is required")
    } else if (!this.validChains.includes(request.chain)) {
      errors.push(`Invalid chain: ${request.chain}. Must be one of: ${this.validChains.join(", ")}`)
    }

    // Validate type
    if (!request.type) {
      errors.push("Payment type is required")
    } else if (!this.validTypes.includes(request.type)) {
      errors.push(`Invalid payment type: ${request.type}. Must be one of: ${this.validTypes.join(", ")}`)
    }

    // Validate addresses based on type
    if (request.type === "bridge_deposit" || request.type === "bridge_withdrawal") {
      if (!request.recipientAddress) {
        errors.push("Recipient address is required for bridge operations")
      } else if (request.chain && !this.isValidAddress(request.recipientAddress, request.chain)) {
        errors.push(`Invalid ${request.chain} address: ${request.recipientAddress}`)
      }
    }

    if (request.type === "approve" || request.type === "swap") {
      if (!request.tokenAddress) {
        warnings.push("Token address not provided, may use default")
      } else if (request.chain && !this.isValidAddress(request.tokenAddress, request.chain)) {
        errors.push(`Invalid token address: ${request.tokenAddress}`)
      }
    }

    // Validate priority
    if (request.priority && !["low", "medium", "high", "critical"].includes(request.priority)) {
      warnings.push(`Invalid priority: ${request.priority}, defaulting to medium`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate payment result
   */
  validateResult(result: Partial<PaymentResult>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!result.requestId) {
      errors.push("Request ID is required")
    }

    if (!result.status) {
      errors.push("Status is required")
    } else if (!["pending", "processing", "completed", "failed"].includes(result.status)) {
      errors.push(`Invalid status: ${result.status}`)
    }

    if (result.status === "completed" && !result.transactionHash) {
      warnings.push("Payment completed but no transaction hash provided")
    }

    if (result.status === "failed" && !result.error) {
      warnings.push("Payment failed but no error message provided")
    }

    if (result.gasUsed && (!Number.isFinite(result.gasUsed) || result.gasUsed < 0)) {
      errors.push("Invalid gas used value")
    }

    if (result.gasPrice && (!Number.isFinite(result.gasPrice) || result.gasPrice < 0)) {
      errors.push("Invalid gas price value")
    }

    if (result.totalCost && (!Number.isFinite(result.totalCost) || result.totalCost < 0)) {
      errors.push("Invalid total cost value")
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate address format
   */
  private isValidAddress(address: string, chain: "ethereum" | "stacks"): boolean {
    if (!address || typeof address !== "string") {
      return false
    }

    if (chain === "ethereum") {
      // Ethereum address: 0x followed by 40 hex characters
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    } else {
      // Stacks address: STX or SP prefix followed by alphanumeric characters
      return /^[SP][0-9A-Z]{38,41}$/.test(address)
    }
  }

  /**
   * Sanitize payment request
   */
  sanitizeRequest(request: Partial<PaymentRequest>): Partial<PaymentRequest> {
    const sanitized = { ...request }

    // Ensure amount is a number
    if (sanitized.amount !== undefined) {
      sanitized.amount = Number.parseFloat(String(sanitized.amount))
    }

    // Trim addresses
    if (sanitized.recipientAddress) {
      sanitized.recipientAddress = sanitized.recipientAddress.trim()
    }
    if (sanitized.tokenAddress) {
      sanitized.tokenAddress = sanitized.tokenAddress.trim()
    }

    // Normalize priority
    if (sanitized.priority && !["low", "medium", "high", "critical"].includes(sanitized.priority)) {
      sanitized.priority = "medium"
    }

    return sanitized
  }
}

