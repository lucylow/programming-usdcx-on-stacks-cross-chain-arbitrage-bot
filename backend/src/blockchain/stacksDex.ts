import { StacksClient } from "./stacksClient"
import { uintCV, principalCV, stringAsciiCV } from "@stacks/transactions"
import { logger } from "../utils/logger"
import {
  ValidationError,
  NetworkError,
  PriceOracleError,
  withErrorBoundary,
  withErrorLogging,
  parseError,
  wrapError,
} from "../utils/errors"

export interface DexSwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: number
  minAmountOut: number
  recipient?: string
  deadline?: number
}

export interface DexQuote {
  amountOut: number
  priceImpact: number
  route: string[]
  fee: number
}

export interface StacksDexConfig {
  name: string
  routerAddress: string
  routerName: string
  factoryAddress?: string
  factoryName?: string
  fee: number // Fee in basis points (e.g., 30 = 0.3%)
}

/**
 * Base class for Stacks DEX integrations
 */
export abstract class StacksDex {
  protected client: StacksClient
  protected config: StacksDexConfig

  constructor(client: StacksClient, config: StacksDexConfig) {
    this.client = client
    this.config = config
  }

  /**
   * Get a quote for a swap
   */
  abstract getQuote(params: DexSwapParams): Promise<DexQuote>

  /**
   * Execute a swap
   */
  abstract swap(params: DexSwapParams): Promise<string>

  /**
   * Get the name of this DEX
   */
  getName(): string {
    return this.config.name
  }
}

/**
 * ALEX DEX integration
 * ALEX is a major DEX on Stacks with AMM functionality
 */
export class AlexDex extends StacksDex {
  constructor(client: StacksClient) {
    super(client, {
      name: "alex",
      routerAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
      routerName: "alex-vault",
      fee: 30, // 0.3%
    })
  }

  async getQuote(params: DexSwapParams): Promise<DexQuote> {
    return withErrorLogging(
      async () => {
        // Validate input parameters
        if (params.amountIn <= 0) {
          throw new ValidationError("Amount in must be positive", {
            amountIn: params.amountIn,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
          })
        }

        try {
          // Try to get quote from ALEX API first
          const response = await fetch(
            `https://api.alexlab.co/v1/swap/quote?tokenIn=${params.tokenIn}&tokenOut=${params.tokenOut}&amountIn=${params.amountIn}`,
            {
              signal: AbortSignal.timeout(5000), // 5 second timeout
            },
          )

          if (!response.ok) {
            throw new NetworkError(`ALEX quote API failed: ${response.statusText}`, {
              status: response.status,
              statusText: response.statusText,
              dex: this.config.name,
            })
          }

          const data = await response.json()

          // Validate quote data
          if (!data.amountOut || data.amountOut <= 0) {
            throw new ValidationError("Invalid quote: amountOut must be positive", {
              amountOut: data.amountOut,
              dex: this.config.name,
            })
          }

          // Calculate price impact if not provided
          const priceImpact = data.priceImpact ?? this.calculatePriceImpact(params.amountIn, data.amountOut)

          return {
            amountOut: data.amountOut,
            priceImpact,
            route: data.route || [params.tokenIn, params.tokenOut],
            fee: this.config.fee,
          }
        } catch (error: unknown) {
          logger.warn("ALEX API quote failed, trying contract read-only call:", error)
          
          // Fallback: try contract read-only call
          try {
            const quote = await this.client.readOnlyCall<{ value: string }>({
              contractAddress: this.config.routerAddress,
              contractName: this.config.routerName,
              functionName: "get-swap-quote",
              functionArgs: [
                principalCV(params.tokenIn),
                principalCV(params.tokenOut),
                uintCV(Math.floor(params.amountIn * 1e6)),
              ],
              senderAddress: this.client.getAddress(),
            })

            const amountOut = Number.parseInt(quote.value, 16) / 1e6
            const priceImpact = this.calculatePriceImpact(params.amountIn, amountOut)

            return {
              amountOut,
              priceImpact,
              route: [params.tokenIn, params.tokenOut],
              fee: this.config.fee,
            }
          } catch (contractError) {
            logger.error("Contract quote also failed:", contractError)
            // Final fallback: conservative estimate
            const feeMultiplier = 1 - this.config.fee / 10000
            return {
              amountOut: params.amountIn * feeMultiplier * 0.995, // Apply fee and 0.5% slippage buffer
              priceImpact: 1.0, // Conservative estimate
              route: [params.tokenIn, params.tokenOut],
              fee: this.config.fee,
            }
          }
        }
      },
      { dex: this.config.name, operation: "getQuote" },
    )
  }

  /**
   * Calculate price impact based on input and output amounts
   */
  private calculatePriceImpact(amountIn: number, amountOut: number): number {
    // Simple price impact calculation
    // In production, this would consider pool liquidity
    const expectedOut = amountIn * (1 - this.config.fee / 10000)
    const impact = Math.abs((expectedOut - amountOut) / expectedOut) * 100
    return Math.min(impact, 10) // Cap at 10%
  }

  async swap(params: DexSwapParams): Promise<string> {
    return withErrorLogging(
      async () => {
        const recipient = params.recipient || this.client.getAddress()
        const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

        // Validate swap parameters
        if (params.amountIn <= 0) {
          throw new ValidationError("Amount in must be positive", {
            amountIn: params.amountIn,
            dex: this.config.name,
          })
        }
        if (params.minAmountOut <= 0) {
          throw new ValidationError("Min amount out must be positive", {
            minAmountOut: params.minAmountOut,
            dex: this.config.name,
          })
        }
        if (params.minAmountOut > params.amountIn) {
          throw new ValidationError("Min amount out cannot exceed amount in", {
            amountIn: params.amountIn,
            minAmountOut: params.minAmountOut,
            dex: this.config.name,
          })
        }

        // Get quote to validate slippage
        const quote = await this.getQuote(params)
        
        // Check slippage tolerance (default 1%)
        const slippageTolerance = 0.01
        const minExpectedOut = quote.amountOut * (1 - slippageTolerance)
        
        if (params.minAmountOut < minExpectedOut) {
          logger.warn(
            `Slippage protection: minAmountOut (${params.minAmountOut}) is below expected (${minExpectedOut})`,
          )
        }

        // Validate price impact
        if (quote.priceImpact > 5) {
          throw new ValidationError(
            `Price impact too high: ${quote.priceImpact}% (max 5%)`,
            {
              priceImpact: quote.priceImpact,
              maxPriceImpact: 5,
              dex: this.config.name,
            },
          )
        }

        // ALEX swap function signature
        // swap(token-in, token-out, amount-in, min-amount-out, recipient, deadline)
        const functionArgs = [
          principalCV(params.tokenIn),
          principalCV(params.tokenOut),
          uintCV(Math.floor(params.amountIn * 1e6)), // Convert to micro units
          uintCV(Math.floor(params.minAmountOut * 1e6)),
          principalCV(recipient),
          uintCV(deadline),
        ]

        // Validate transaction before execution
        const validation = await this.client.validateTransaction({
          contractAddress: this.config.routerAddress,
          contractName: this.config.routerName,
          functionName: "swap",
          functionArgs,
          senderKey: this.client.getPrivateKey(),
        })

        if (!validation.valid) {
          throw new ValidationError(
            `Transaction validation failed: ${validation.errors.join(", ")}`,
            {
              errors: validation.errors,
              warnings: validation.warnings,
              dex: this.config.name,
            },
          )
        }

        if (validation.warnings.length > 0) {
          logger.warn(`Transaction warnings: ${validation.warnings.join(", ")}`)
        }

        try {
          return await this.client.contractCall({
            contractAddress: this.config.routerAddress,
            contractName: this.config.routerName,
            functionName: "swap",
            functionArgs,
            senderKey: this.client.getPrivateKey(),
          })
        } catch (error) {
          throw wrapError(error, {
            dex: this.config.name,
            operation: "swap",
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
          })
        }
      },
      { dex: this.config.name, operation: "swap" },
    )
  }
}

/**
 * Arkadiko DEX integration
 * Arkadiko is another major DEX on Stacks
 */
export class ArkadikoDex extends StacksDex {
  constructor(client: StacksClient) {
    super(client, {
      name: "arkadiko",
      routerAddress: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR",
      routerName: "arkadiko-swap-v2-1",
      fee: 30, // 0.3%
    })
  }

  async getQuote(params: DexSwapParams): Promise<DexQuote> {
    try {
      // Arkadiko swap quote
      // This would typically call the contract's read-only function
      const quote = await this.client.readOnlyCall<{ value: string }>({
        contractAddress: this.config.routerAddress,
        contractName: this.config.routerName,
        functionName: "get-swap-quote",
        functionArgs: [
          principalCV(params.tokenIn),
          principalCV(params.tokenOut),
          uintCV(Math.floor(params.amountIn * 1e6)),
        ],
        senderAddress: this.client.getAddress(),
      })

      const amountOut = Number.parseInt(quote.value, 16) / 1e6

      return {
        amountOut,
        priceImpact: 0.5, // Would be calculated from liquidity
        route: [params.tokenIn, params.tokenOut],
        fee: this.config.fee,
      }
    } catch (error: unknown) {
      logger.error("Arkadiko quote failed:", error)
      // Fallback estimate
      return {
        amountOut: params.amountIn * 0.997,
        priceImpact: 0.5,
        route: [params.tokenIn, params.tokenOut],
        fee: this.config.fee,
      }
    }
  }

  async swap(params: DexSwapParams): Promise<string> {
    return withErrorLogging(
      async () => {
        const recipient = params.recipient || this.client.getAddress()
        const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800

        // Validate swap parameters
        if (params.amountIn <= 0) {
          throw new ValidationError("Amount in must be positive", {
            amountIn: params.amountIn,
            dex: this.config.name,
          })
        }
        if (params.minAmountOut <= 0) {
          throw new ValidationError("Min amount out must be positive", {
            minAmountOut: params.minAmountOut,
            dex: this.config.name,
          })
        }

        // Get quote to validate slippage
        const quote = await this.getQuote(params)
        
        // Check slippage tolerance
        const slippageTolerance = 0.01
        const minExpectedOut = quote.amountOut * (1 - slippageTolerance)
        
        if (params.minAmountOut < minExpectedOut) {
          logger.warn(
            `Slippage protection: minAmountOut (${params.minAmountOut}) is below expected (${minExpectedOut})`,
          )
        }

        // Validate price impact
        if (quote.priceImpact > 5) {
          throw new ValidationError(
            `Price impact too high: ${quote.priceImpact}% (max 5%)`,
            {
              priceImpact: quote.priceImpact,
              maxPriceImpact: 5,
              dex: this.config.name,
            },
          )
        }

        const functionArgs = [
          principalCV(params.tokenIn),
          principalCV(params.tokenOut),
          uintCV(Math.floor(params.amountIn * 1e6)),
          uintCV(Math.floor(params.minAmountOut * 1e6)),
          principalCV(recipient),
          uintCV(deadline),
        ]

        // Validate transaction before execution
        const validation = await this.client.validateTransaction({
          contractAddress: this.config.routerAddress,
          contractName: this.config.routerName,
          functionName: "swap",
          functionArgs,
          senderKey: this.client.getPrivateKey(),
        })

        if (!validation.valid) {
          throw new ValidationError(
            `Transaction validation failed: ${validation.errors.join(", ")}`,
            {
              errors: validation.errors,
              warnings: validation.warnings,
              dex: this.config.name,
            },
          )
        }

        if (validation.warnings.length > 0) {
          logger.warn(`Transaction warnings: ${validation.warnings.join(", ")}`)
        }

        try {
          return await this.client.contractCall({
            contractAddress: this.config.routerAddress,
            contractName: this.config.routerName,
            functionName: "swap",
            functionArgs,
            senderKey: this.client.getPrivateKey(),
          })
        } catch (error) {
          throw wrapError(error, {
            dex: this.config.name,
            operation: "swap",
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
          })
        }
      },
      { dex: this.config.name, operation: "swap" },
    )
  }
}

/**
 * Factory to create DEX instances
 */
export class StacksDexFactory {
  static createDex(name: string, client: StacksClient): StacksDex {
    switch (name.toLowerCase()) {
      case "alex":
        return new AlexDex(client)
      case "arkadiko":
        return new ArkadikoDex(client)
      default:
        throw new ValidationError(`Unknown DEX: ${name}`, {
          requestedDex: name,
          availableDexes: this.getAvailableDexes(),
        })
    }
  }

  static getAvailableDexes(): string[] {
    return ["alex", "arkadiko"]
  }
}

