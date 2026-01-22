import { StacksClient } from "./stacksClient"
import { uintCV, principalCV, stringAsciiCV } from "@stacks/transactions"
import { logger } from "../utils/logger"

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
    try {
      // ALEX typically uses a swap-router contract
      // This is a simplified implementation - actual ALEX API would be used
      const response = await fetch(
        `https://api.alexlab.co/v1/swap/quote?tokenIn=${params.tokenIn}&tokenOut=${params.tokenOut}&amountIn=${params.amountIn}`,
      )

      if (!response.ok) {
        throw new Error(`ALEX quote failed: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        amountOut: data.amountOut,
        priceImpact: data.priceImpact || 0,
        route: data.route || [params.tokenIn, params.tokenOut],
        fee: this.config.fee,
      }
    } catch (error: unknown) {
      logger.error("ALEX quote failed:", error)
      // Fallback: estimate based on simple calculation
      return {
        amountOut: params.amountIn * 0.997, // Assume 0.3% fee
        priceImpact: 0.5,
        route: [params.tokenIn, params.tokenOut],
        fee: this.config.fee,
      }
    }
  }

  async swap(params: DexSwapParams): Promise<string> {
    const recipient = params.recipient || this.client.getAddress()
    const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

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

    return await this.client.contractCall({
      contractAddress: this.config.routerAddress,
      contractName: this.config.routerName,
      functionName: "swap",
      functionArgs,
      senderKey: this.client.getPrivateKey(),
    })
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
    const recipient = params.recipient || this.client.getAddress()
    const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800

    const functionArgs = [
      principalCV(params.tokenIn),
      principalCV(params.tokenOut),
      uintCV(Math.floor(params.amountIn * 1e6)),
      uintCV(Math.floor(params.minAmountOut * 1e6)),
      principalCV(recipient),
      uintCV(deadline),
    ]

    return await this.client.contractCall({
      contractAddress: this.config.routerAddress,
      contractName: this.config.routerName,
      functionName: "swap",
      functionArgs,
      senderKey: this.client.getPrivateKey(),
    })
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
        throw new Error(`Unknown DEX: ${name}`)
    }
  }

  static getAvailableDexes(): string[] {
    return ["alex", "arkadiko"]
  }
}

