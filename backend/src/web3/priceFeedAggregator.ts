/**
 * Price Feed Aggregator
 * Aggregates price data from multiple open source sources
 */

import axios, { AxiosInstance } from "axios"
import { logger } from "../utils/logger"
import { PriceOracleError, NetworkError, getErrorMessage } from "../utils/errors"

export interface PriceData {
  symbol: string
  price: number
  source: string
  timestamp: number
  volume24h?: number
  marketCap?: number
  change24h?: number
  liquidity?: number
  confidence: number
}

export interface TokenPrice {
  address?: string
  symbol: string
  price: number
  sources: PriceData[]
  aggregatedPrice: number
  confidence: number
  timestamp: number
}

export class PriceFeedAggregator {
  private httpClient: AxiosInstance
  private cache: Map<string, { data: TokenPrice; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 30000 // 30 seconds

  constructor(
    private coinGeckoApiKey?: string,
    private coinMarketCapApiKey?: string,
  ) {
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        ...(coinGeckoApiKey && { "X-CG-Demo-API-Key": coinGeckoApiKey }),
        ...(coinMarketCapApiKey && { "X-CMC_PRO_API_KEY": coinMarketCapApiKey }),
      },
    })
  }

  /**
   * Get price from CoinGecko (free tier available)
   */
  private async getCoinGeckoPrice(symbol: string): Promise<PriceData | null> {
    try {
      const normalizedSymbol = symbol.toLowerCase()
      const url = this.coinGeckoApiKey
        ? `https://api.coingecko.com/api/v3/simple/price?ids=${normalizedSymbol}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`
        : `https://api.coingecko.com/api/v3/simple/price?ids=${normalizedSymbol}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`

      const response = await this.httpClient.get(url)
      const data = response.data[normalizedSymbol]

      if (!data || !data.usd) {
        return null
      }

      return {
        symbol,
        price: data.usd,
        source: "coingecko",
        timestamp: Date.now(),
        volume24h: data.usd_24h_vol,
        marketCap: data.usd_market_cap,
        change24h: data.usd_24h_change,
        confidence: 0.9,
      }
    } catch (error: unknown) {
      logger.warn(`CoinGecko price fetch failed for ${symbol}:`, getErrorMessage(error))
      return null
    }
  }

  /**
   * Get price from CoinMarketCap (requires API key)
   */
  private async getCoinMarketCapPrice(symbol: string): Promise<PriceData | null> {
    if (!this.coinMarketCapApiKey) {
      return null
    }

    try {
      const response = await this.httpClient.get(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
        {
          params: {
            symbol: symbol.toUpperCase(),
            convert: "USD",
          },
        },
      )

      const data = response.data.data[symbol.toUpperCase()]
      if (!data || !data.quote?.USD) {
        return null
      }

      const quote = data.quote.USD

      return {
        symbol,
        price: quote.price,
        source: "coinmarketcap",
        timestamp: Date.now(),
        volume24h: quote.volume_24h,
        marketCap: quote.market_cap,
        change24h: quote.percent_change_24h,
        confidence: 0.95,
      }
    } catch (error: unknown) {
      logger.warn(`CoinMarketCap price fetch failed for ${symbol}:`, getErrorMessage(error))
      return null
    }
  }

  /**
   * Get price from Binance API (free, no API key required)
   */
  private async getBinancePrice(symbol: string): Promise<PriceData | null> {
    try {
      // Map common symbols to Binance trading pairs
      const binanceSymbol = symbol === "USDC" ? "USDCUSDT" : `${symbol}USDT`
      
      const response = await this.httpClient.get(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      )

      if (!response.data || !response.data.lastPrice) {
        return null
      }

      return {
        symbol,
        price: parseFloat(response.data.lastPrice),
        source: "binance",
        timestamp: Date.now(),
        volume24h: parseFloat(response.data.volume),
        change24h: parseFloat(response.data.priceChangePercent),
        confidence: 0.85,
      }
    } catch (error: unknown) {
      logger.warn(`Binance price fetch failed for ${symbol}:`, getErrorMessage(error))
      return null
    }
  }

  /**
   * Get price from 1inch API (DEX aggregator prices)
   */
  private async get1InchPrice(
    symbol: string,
    chainId: number = 1,
    tokenAddress?: string,
  ): Promise<PriceData | null> {
    if (!tokenAddress) {
      return null
    }

    try {
      const response = await this.httpClient.get(
        `https://api.1inch.io/v5.0/${chainId}/quote`,
        {
          params: {
            fromTokenAddress: tokenAddress,
            toTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
            amount: "1000000", // 1 token (assuming 6 decimals)
          },
        },
      )

      if (!response.data || !response.data.toTokenAmount) {
        return null
      }

      // Convert to USD price (simplified, would need proper USDT price)
      const price = parseFloat(response.data.toTokenAmount) / 1000000

      return {
        symbol,
        price,
        source: "1inch",
        timestamp: Date.now(),
        confidence: 0.8,
      }
    } catch (error: unknown) {
      logger.warn(`1inch price fetch failed for ${symbol}:`, getErrorMessage(error))
      return null
    }
  }

  /**
   * Aggregate prices from multiple sources
   */
  async getAggregatedPrice(
    symbol: string,
    tokenAddress?: string,
    chainId?: number,
  ): Promise<TokenPrice> {
    // Check cache
    const cacheKey = `${symbol}_${tokenAddress || ""}_${chainId || ""}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    // Fetch from all sources in parallel
    const pricePromises = [
      this.getCoinGeckoPrice(symbol),
      this.getCoinMarketCapPrice(symbol),
      this.getBinancePrice(symbol),
      tokenAddress && chainId ? this.get1InchPrice(symbol, chainId, tokenAddress) : null,
    ]

    const prices = (await Promise.all(pricePromises)).filter(
      (p): p is PriceData => p !== null,
    )

    if (prices.length === 0) {
      throw new PriceOracleError(`No price data available for ${symbol}`, symbol, {
        symbol,
        tokenAddress,
        chainId,
      })
    }

    // Calculate aggregated price (weighted average by confidence)
    const totalWeight = prices.reduce((sum, p) => sum + p.confidence, 0)
    const aggregatedPrice =
      prices.reduce((sum, p) => sum + p.price * p.confidence, 0) / totalWeight

    // Overall confidence is average of source confidences
    const confidence = prices.reduce((sum, p) => sum + p.confidence, 0) / prices.length

    const result: TokenPrice = {
      symbol,
      address: tokenAddress,
      price: aggregatedPrice,
      sources: prices,
      aggregatedPrice,
      confidence,
      timestamp: Date.now(),
    }

    // Cache result
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return result
  }

  /**
   * Get multiple token prices
   */
  async getMultiplePrices(
    symbols: string[],
    tokenAddresses?: Map<string, string>,
    chainId?: number,
  ): Promise<Map<string, TokenPrice>> {
    const pricePromises = symbols.map((symbol) =>
      this.getAggregatedPrice(symbol, tokenAddresses?.get(symbol), chainId).catch((error) => {
        logger.error(`Failed to get price for ${symbol}:`, error)
        return null
      }),
    )

    const prices = await Promise.all(pricePromises)
    const result = new Map<string, TokenPrice>()

    for (let i = 0; i < symbols.length; i++) {
      const price = prices[i]
      if (price) {
        result.set(symbols[i], price)
      }
    }

    return result
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

