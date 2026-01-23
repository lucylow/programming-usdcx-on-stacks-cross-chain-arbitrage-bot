import axios from "axios"
import { config } from "../config"
import { logger } from "../utils/logger"
import {
  PriceOracleError,
  NetworkError,
  ValidationError,
  withTimeout,
  withErrorBoundary,
  parseError,
  safeParseNumber,
  InputValidationError,
} from "../utils/errors"

export interface PriceData {
  chain: "ethereum" | "stacks"
  dex: string
  pair: string
  price: number
  liquidity: number
  timestamp: number
  confidence: number
  source: string
}

export interface ArbitrageOpportunity {
  ethDex: string
  stacksDex: string
  ethPair: string
  stacksPair: string
  ethPrice: number
  stacksPrice: number
  spread: number
  direction: "eth_to_stacks" | "stacks_to_eth"
  estimatedProfit: number
  confidence: number
  timestamp: number
}

export class PriceOracle {
  private prices: Map<string, PriceData> = new Map()
  private updateInterval: NodeJS.Timeout | null = null

  // DEX configurations
  private readonly ethDexes = [
    {
      name: "uniswap_v3",
      router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      pairs: ["USDC/ETH", "USDC/USDT"],
    },
    {
      name: "curve",
      router: "0x99a58482BD75cbab83b27EC03CA68fF489b5788f",
      pairs: ["USDC/USDT", "USDC/DAI"],
    },
  ]

  private readonly stacksDexes = [
    {
      name: "alex",
      router: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
      pairs: ["USDCx/STX", "USDCx/BTC"],
    },
    {
      name: "arkadiko",
      router: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR",
      pairs: ["USDCx/STX", "USDCx/USDA"],
    },
  ]

  async start(): Promise<void> {
    logger.info("Starting Price Oracle...")

    try {
      // Initial price fetch with timeout and error handling
      await withTimeout(
        () => this.updateAllPrices(),
        30000, // 30 second timeout
        "Price Oracle initial update timed out",
      )
    } catch (error) {
      const parsedError = parseError(error, { operation: "price_oracle_start" })
      logger.warn("Initial price update failed, continuing with periodic updates:", parsedError)
      // Don't throw - allow periodic updates to retry
    }

    // Start periodic updates with error isolation
    this.updateInterval = setInterval(() => {
      // Use error boundary to prevent interval from crashing
      this.updateAllPrices().catch((error) => {
        const parsedError = parseError(error, { operation: "periodic_price_update" })
        logger.error("Periodic price update failed:", parsedError)
      })
    }, 2000) // Update every 2 seconds

    logger.info("Price Oracle started successfully")
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    logger.info("Price Oracle stopped")
  }

  private async updateAllPrices(): Promise<void> {
    try {
      // Update Ethereum DEX prices with error isolation
      const ethUpdates = this.ethDexes.flatMap((dex) =>
        dex.pairs.map((pair) =>
          this.updateEthPrice(dex.name, pair).catch((error) => {
            const parsedError = parseError(error, { chain: "ethereum", dex: dex.name, pair })
            logger.error(`Failed to update ${dex.name} ${pair} price:`, parsedError)
            // Continue with other updates
          }),
        ),
      )

      // Update Stacks DEX prices with error isolation
      const stacksUpdates = this.stacksDexes.flatMap((dex) =>
        dex.pairs.map((pair) =>
          this.updateStacksPrice(dex.name, pair).catch((error) => {
            const parsedError = parseError(error, { chain: "stacks", dex: dex.name, pair })
            logger.error(`Failed to update ${dex.name} ${pair} price:`, parsedError)
            // Continue with other updates
          }),
        ),
      )

      // Execute all updates in parallel, errors are isolated
      await Promise.all([...ethUpdates, ...stacksUpdates])
    } catch (error) {
      const parsedError = parseError(error, { operation: "update_all_prices" })
      logger.error("Error updating prices:", parsedError)
      throw new PriceOracleError("Failed to update all prices", undefined, parsedError.context)
    }
  }

  private async updateEthPrice(dexName: string, pair: string): Promise<void> {
    try {
      // Validate inputs
      if (!dexName || !pair) {
        throw new InputValidationError("dexName or pair", { dexName, pair }, "both are required")
      }

      // Fetch price with timeout
      const price = await withTimeout(
        () => this.fetchEthPrice(dexName, pair),
        10000, // 10 second timeout
        `Price fetch timeout for ${dexName} ${pair}`,
      )

      // Validate price
      if (!Number.isFinite(price) || price <= 0) {
        throw new ValidationError(`Invalid price value: ${price}`, { dexName, pair, price })
      }

      // Fetch liquidity with timeout
      const liquidity = await withTimeout(
        () => this.fetchEthLiquidity(dexName, pair),
        10000,
        `Liquidity fetch timeout for ${dexName} ${pair}`,
      )

      // Validate liquidity
      if (!Number.isFinite(liquidity) || liquidity < 0) {
        throw new ValidationError(`Invalid liquidity value: ${liquidity}`, { dexName, pair, liquidity })
      }

      const priceData: PriceData = {
        chain: "ethereum",
        dex: dexName,
        pair,
        price: safeParseNumber(price, "price", { min: 0 }),
        liquidity: safeParseNumber(liquidity, "liquidity", { min: 0 }),
        timestamp: Date.now(),
        confidence: this.calculateConfidence(liquidity),
        source: "on-chain",
      }

      this.prices.set(`${dexName}:${pair}`, priceData)
    } catch (error) {
      const parsedError = parseError(error, { chain: "ethereum", dex: dexName, pair })
      logger.error(`Error updating ${dexName} ${pair} price:`, parsedError)
      throw new PriceOracleError(
        `Failed to update ${dexName} ${pair} price: ${parsedError.message}`,
        dexName,
        parsedError.context,
      )
    }
  }

  private async fetchEthPrice(dexName: string, pair: string): Promise<number> {
    // In production, this would query actual DEX contracts
    // For demo, we simulate realistic price movements

    if (config.mode === "demo") {
      return this.simulatePrice(dexName, pair)
    }

    // Production implementation would go here
    if (dexName === "uniswap_v3") {
      return await this.getUniswapV3Price(pair)
    }

    return 1.0
  }

  private async getUniswapV3Price(pair: string): Promise<number> {
    // Actual Uniswap V3 pool query
    // This is a simplified example
    const poolAddresses: Record<string, string> = {
      "USDC/ETH": "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
      "USDC/USDT": "0x3416cF6C708Da44DB2624D63ea0AAef7113527C6",
    }

    const poolAddress = poolAddresses[pair]
    if (!poolAddress) {
      logger.warn(`No pool address found for pair: ${pair}`)
      return 1.0
    }

    try {
      // Query pool contract for current price with timeout
      // Implementation would use ethers.js to call slot0()
      return await withTimeout(
        async () => {
          // Placeholder - would query actual contract
          return 1.0
        },
        5000,
        `Uniswap V3 price query timeout for ${pair}`,
      )
    } catch (error) {
      const parsedError = parseError(error, { dex: "uniswap_v3", pair })
      logger.error(`Error fetching Uniswap V3 price for ${pair}:`, parsedError)
      throw new PriceOracleError(
        `Failed to fetch Uniswap V3 price for ${pair}: ${parsedError.message}`,
        "uniswap_v3",
        parsedError.context,
      )
    }
  }

  private async fetchEthLiquidity(dexName: string, pair: string): Promise<number> {
    // Simulate liquidity based on DEX
    const baseLiquidity: Record<string, number> = {
      uniswap_v3: 5000000,
      curve: 10000000,
    }

    return baseLiquidity[dexName] || 1000000
  }

  private async updateStacksPrice(dexName: string, pair: string): Promise<void> {
    try {
      // Validate inputs
      if (!dexName || !pair) {
        throw new InputValidationError("dexName or pair", { dexName, pair }, "both are required")
      }

      // Fetch price with timeout
      const price = await withTimeout(
        () => this.fetchStacksPrice(dexName, pair),
        10000, // 10 second timeout
        `Price fetch timeout for ${dexName} ${pair}`,
      )

      // Validate price
      if (!Number.isFinite(price) || price <= 0) {
        throw new ValidationError(`Invalid price value: ${price}`, { dexName, pair, price })
      }

      // Fetch liquidity with timeout
      const liquidity = await withTimeout(
        () => this.fetchStacksLiquidity(dexName, pair),
        10000,
        `Liquidity fetch timeout for ${dexName} ${pair}`,
      )

      // Validate liquidity
      if (!Number.isFinite(liquidity) || liquidity < 0) {
        throw new ValidationError(`Invalid liquidity value: ${liquidity}`, { dexName, pair, liquidity })
      }

      const priceData: PriceData = {
        chain: "stacks",
        dex: dexName,
        pair,
        price: safeParseNumber(price, "price", { min: 0 }),
        liquidity: safeParseNumber(liquidity, "liquidity", { min: 0 }),
        timestamp: Date.now(),
        confidence: this.calculateConfidence(liquidity),
        source: "on-chain",
      }

      this.prices.set(`${dexName}:${pair}`, priceData)
    } catch (error) {
      const parsedError = parseError(error, { chain: "stacks", dex: dexName, pair })
      logger.error(`Error updating ${dexName} ${pair} price:`, parsedError)
      throw new PriceOracleError(
        `Failed to update ${dexName} ${pair} price: ${parsedError.message}`,
        dexName,
        parsedError.context,
      )
    }
  }

  private async fetchStacksPrice(dexName: string, pair: string): Promise<number> {
    if (config.mode === "demo") {
      return this.simulatePrice(dexName, pair)
    }

    // Production: Query Stacks DEX contracts
    if (dexName === "alex") {
      return await this.getAlexPrice(pair)
    }

    return 1.0
  }

  private async getAlexPrice(pair: string): Promise<number> {
    try {
      // Query ALEX DEX API or contract with timeout and error handling
      const response = await axios.get(`https://api.alexlab.co/v1/pools/${pair}`, {
        timeout: 5000, // 5 second timeout
        validateStatus: (status) => status >= 200 && status < 300,
      })

      if (!response.data || typeof response.data.price !== "number") {
        throw new ValidationError(`Invalid response format from ALEX API for ${pair}`, { pair, response: response.data })
      }

      const price = response.data.price
      if (!Number.isFinite(price) || price <= 0) {
        throw new ValidationError(`Invalid price from ALEX API: ${price}`, { pair, price })
      }

      return price
    } catch (error) {
      const parsedError = parseError(error, { dex: "alex", pair })
      
      // If it's a network/timeout error, throw it
      if (parsedError instanceof NetworkError || parsedError instanceof TimeoutError) {
        throw new PriceOracleError(
          `Network error fetching ALEX price for ${pair}: ${parsedError.message}`,
          "alex",
          parsedError.context,
        )
      }

      // For other errors, log and throw
      logger.error(`Error fetching ALEX price for ${pair}:`, parsedError)
      throw new PriceOracleError(
        `Failed to fetch ALEX price for ${pair}: ${parsedError.message}`,
        "alex",
        parsedError.context,
      )
    }
  }

  private async fetchStacksLiquidity(dexName: string, pair: string): Promise<number> {
    const baseLiquidity: Record<string, number> = {
      alex: 2000000,
      arkadiko: 1000000,
    }

    return baseLiquidity[dexName] || 500000
  }

  private simulatePrice(dexName: string, pair: string): number {
    // Simulate realistic price with small variations
    const basePrice = 1.0
    const volatility = 0.002 // 0.2% volatility
    const random = (Math.random() - 0.5) * 2 * volatility

    // Add small bias based on DEX to create arbitrage opportunities
    let bias = 0
    if (dexName === "uniswap_v3") bias = 0.001
    if (dexName === "alex") bias = -0.001

    return basePrice + random + bias
  }

  private calculateConfidence(liquidity: number): number {
    // Validate input
    if (!Number.isFinite(liquidity) || liquidity < 0) {
      logger.warn(`Invalid liquidity for confidence calculation: ${liquidity}, using default 0.5`)
      return 0.5
    }

    // Higher liquidity = higher confidence
    const minLiquidity = 100000
    const maxLiquidity = 10000000

    // Avoid division by zero
    if (maxLiquidity <= minLiquidity) {
      return 0.5
    }

    const normalized = Math.min(Math.max((liquidity - minLiquidity) / (maxLiquidity - minLiquidity), 0), 1)

    return 0.5 + normalized * 0.5 // Range: 0.5 to 1.0
  }

  getPrice(dex: string, pair: string): PriceData | undefined {
    return this.prices.get(`${dex}:${pair}`)
  }

  getAllPrices(): PriceData[] {
    return Array.from(this.prices.values())
  }

  detectOpportunities(minSpread = 0.005): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = []
    const allPrices = this.getAllPrices()

    // Compare Ethereum and Stacks prices for arbitrage
    const ethPrices = allPrices.filter((p) => p.chain === "ethereum")
    const stacksPrices = allPrices.filter((p) => p.chain === "stacks")

    for (const ethPrice of ethPrices) {
      for (const stacksPrice of stacksPrices) {
        // Check if pairs are compatible for arbitrage
        if (!this.arePairsCompatible(ethPrice.pair, stacksPrice.pair)) {
          continue
        }

        const spread = Math.abs(ethPrice.price - stacksPrice.price) / Math.min(ethPrice.price, stacksPrice.price)

        if (spread >= minSpread) {
          const direction = ethPrice.price < stacksPrice.price ? "eth_to_stacks" : "stacks_to_eth"

          const estimatedProfit = this.calculateEstimatedProfit(
            ethPrice,
            stacksPrice,
            direction,
            10000, // Default trade size
          )

          opportunities.push({
            ethDex: ethPrice.dex,
            stacksDex: stacksPrice.dex,
            ethPair: ethPrice.pair,
            stacksPair: stacksPrice.pair,
            ethPrice: ethPrice.price,
            stacksPrice: stacksPrice.price,
            spread,
            direction,
            estimatedProfit,
            confidence: Math.min(ethPrice.confidence, stacksPrice.confidence),
            timestamp: Date.now(),
          })
        }
      }
    }

    // Sort by estimated profit (highest first)
    return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit)
  }

  private arePairsCompatible(ethPair: string, stacksPair: string): boolean {
    // Simplified compatibility check
    // In production, this would map token equivalents
    return true
  }

  private calculateEstimatedProfit(
    ethPrice: PriceData,
    stacksPrice: PriceData,
    direction: "eth_to_stacks" | "stacks_to_eth",
    tradeSize: number,
  ): number {
    // Validate inputs
    if (!Number.isFinite(ethPrice.price) || ethPrice.price <= 0) {
      throw new ValidationError(`Invalid ethPrice: ${ethPrice.price}`, { ethPrice })
    }

    if (!Number.isFinite(stacksPrice.price) || stacksPrice.price <= 0) {
      throw new ValidationError(`Invalid stacksPrice: ${stacksPrice.price}`, { stacksPrice })
    }

    if (!Number.isFinite(tradeSize) || tradeSize <= 0) {
      throw new ValidationError(`Invalid tradeSize: ${tradeSize}`, { tradeSize })
    }

    const priceDiff = Math.abs(ethPrice.price - stacksPrice.price)
    const grossProfit = priceDiff * tradeSize

    // Estimate costs
    const gasCost = 50 // USD
    const bridgeFee = tradeSize * 0.001 // 0.1%
    const dexFees = tradeSize * 0.006 // 0.3% * 2
    const slippageCost = tradeSize * 0.01 // 1%

    const totalCosts = gasCost + bridgeFee + dexFees + slippageCost

    const profit = grossProfit - totalCosts
    
    // Ensure non-negative profit
    return Math.max(0, Number.isFinite(profit) ? profit : 0)
  }

  getStats() {
    const allPrices = this.getAllPrices()
    const ethCount = allPrices.filter((p) => p.chain === "ethereum").length
    const stacksCount = allPrices.filter((p) => p.chain === "stacks").length

    return {
      totalPriceFeeds: allPrices.length,
      ethereumFeeds: ethCount,
      stacksFeeds: stacksCount,
      lastUpdate: Math.max(...allPrices.map((p) => p.timestamp), 0),
      avgConfidence: allPrices.reduce((sum, p) => sum + p.confidence, 0) / allPrices.length || 0,
    }
  }
}
