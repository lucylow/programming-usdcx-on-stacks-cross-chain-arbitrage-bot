/**
 * Token Metadata Service
 * Fetches comprehensive token metadata from multiple sources
 */

import axios, { AxiosInstance } from "axios"
import { ethers } from "ethers"
import { logger } from "../utils/logger"
import { NetworkError } from "../utils/errors"

export interface TokenMetadata {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  logoURI?: string
  tags?: string[]
  verified: boolean
  totalSupply?: string
  holders?: number
  priceUSD?: number
  marketCap?: number
  volume24h?: number
}

export interface TokenList {
  name: string
  timestamp: string
  version: {
    major: number
    minor: number
    patch: number
  }
  tokens: TokenMetadata[]
}

export class TokenMetadataService {
  private httpClient: AxiosInstance
  private cache: Map<string, TokenMetadata> = new Map()
  private readonly CACHE_TTL = 3600000 // 1 hour

  // Popular token list URLs
  private readonly TOKEN_LIST_URLS = [
    "https://tokens.coingecko.com/ethereum/all.json",
    "https://raw.githubusercontent.com/uniswap/default-token-list/main/src/tokens/ethereum.json",
    "https://tokens.1inch.io/v1.0/all",
  ]

  constructor(private providers: Map<number, ethers.JsonRpcProvider>) {
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  /**
   * Get token metadata from on-chain
   */
  async getOnChainMetadata(
    chainId: number,
    tokenAddress: string,
  ): Promise<Partial<TokenMetadata>> {
    try {
      const provider = this.providers.get(chainId)
      if (!provider) {
        throw new Error(`No provider for chain ${chainId}`)
      }

      // Standard ERC20 ABI
      const erc20Abi = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
      ]

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => null),
        contract.symbol().catch(() => null),
        contract.decimals().catch(() => null),
        contract.totalSupply().catch(() => null),
      ])

      return {
        address: tokenAddress,
        symbol: symbol || "UNKNOWN",
        name: name || "Unknown Token",
        decimals: decimals ? Number(decimals) : 18,
        chainId,
        totalSupply: totalSupply ? totalSupply.toString() : undefined,
        verified: true,
      }
    } catch (error: any) {
      logger.error(`Error fetching on-chain metadata:`, error)
      throw new NetworkError(`Failed to fetch on-chain metadata: ${error.message}`, {
        chainId,
        tokenAddress,
        error: error.message,
      })
    }
  }

  /**
   * Get token metadata from CoinGecko
   */
  async getCoinGeckoMetadata(tokenAddress: string, chainId: number): Promise<Partial<TokenMetadata>> {
    try {
      // Map chainId to CoinGecko platform ID
      const platformMap: Record<number, string> = {
        1: "ethereum",
        137: "polygon-pos",
        56: "binance-smart-chain",
        43114: "avalanche",
        250: "fantom",
      }

      const platform = platformMap[chainId]
      if (!platform) {
        return {}
      }

      const response = await this.httpClient.get(
        `https://api.coingecko.com/api/v3/coins/${platform}/contract/${tokenAddress}`,
      )

      const data = response.data
      if (!data) {
        return {}
      }

      return {
        address: tokenAddress,
        symbol: data.symbol?.toUpperCase() || "",
        name: data.name || "",
        decimals: 18, // CoinGecko doesn't provide decimals
        chainId,
        logoURI: data.image?.small || data.image?.large,
        priceUSD: data.market_data?.current_price?.usd,
        marketCap: data.market_data?.market_cap?.usd,
        volume24h: data.market_data?.total_volume?.usd,
        verified: true,
      }
    } catch (error: any) {
      logger.debug(`CoinGecko metadata not available: ${error.message}`)
      return {}
    }
  }

  /**
   * Get token from token lists
   */
  async getTokenFromLists(tokenAddress: string, chainId: number): Promise<TokenMetadata | null> {
    const normalizedAddress = tokenAddress.toLowerCase()

    for (const listUrl of this.TOKEN_LIST_URLS) {
      try {
        const response = await this.httpClient.get<TokenList>(listUrl)
        const token = response.data.tokens.find(
          (t) => t.address.toLowerCase() === normalizedAddress && t.chainId === chainId,
        )

        if (token) {
          return {
            ...token,
            verified: true,
          }
        }
      } catch (error) {
        logger.debug(`Failed to fetch token list from ${listUrl}`)
      }
    }

    return null
  }

  /**
   * Get comprehensive token metadata
   */
  async getTokenMetadata(chainId: number, tokenAddress: string): Promise<TokenMetadata> {
    const cacheKey = `${chainId}_${tokenAddress.toLowerCase()}`
    const cached = this.cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    // Fetch from multiple sources in parallel
    const [onChainData, coinGeckoData, listData] = await Promise.all([
      this.getOnChainMetadata(chainId, tokenAddress).catch(() => ({})),
      this.getCoinGeckoMetadata(tokenAddress, chainId).catch(() => ({})),
      this.getTokenFromLists(tokenAddress, chainId).catch(() => null),
    ])

    // Merge data (on-chain takes priority, then CoinGecko, then lists)
    const metadata: TokenMetadata = {
      address: tokenAddress,
      symbol: onChainData.symbol || coinGeckoData.symbol || listData?.symbol || "UNKNOWN",
      name: onChainData.name || coinGeckoData.name || listData?.name || "Unknown Token",
      decimals: onChainData.decimals || listData?.decimals || 18,
      chainId,
      logoURI: coinGeckoData.logoURI || listData?.logoURI,
      tags: listData?.tags,
      verified: onChainData.verified || coinGeckoData.verified || listData?.verified || false,
      totalSupply: onChainData.totalSupply,
      priceUSD: coinGeckoData.priceUSD,
      marketCap: coinGeckoData.marketCap,
      volume24h: coinGeckoData.volume24h,
    }

    // Cache result
    this.cache.set(cacheKey, metadata)

    return metadata
  }

  /**
   * Get multiple token metadata
   */
  async getMultipleTokenMetadata(
    chainId: number,
    tokenAddresses: string[],
  ): Promise<Map<string, TokenMetadata>> {
    const promises = tokenAddresses.map((address) =>
      this.getTokenMetadata(chainId, address).catch((error) => {
        logger.error(`Failed to get metadata for ${address}:`, error)
        return null
      }),
    )

    const results = await Promise.all(promises)
    const metadataMap = new Map<string, TokenMetadata>()

    for (let i = 0; i < tokenAddresses.length; i++) {
      const metadata = results[i]
      if (metadata) {
        metadataMap.set(tokenAddresses[i].toLowerCase(), metadata)
      }
    }

    return metadataMap
  }

  /**
   * Search tokens by symbol or name
   */
  async searchTokens(query: string, chainId?: number): Promise<TokenMetadata[]> {
    const results: TokenMetadata[] = []
    const normalizedQuery = query.toLowerCase()

    for (const listUrl of this.TOKEN_LIST_URLS) {
      try {
        const response = await this.httpClient.get<TokenList>(listUrl)
        const matching = response.data.tokens.filter(
          (token) =>
            (!chainId || token.chainId === chainId) &&
            (token.symbol.toLowerCase().includes(normalizedQuery) ||
              token.name.toLowerCase().includes(normalizedQuery)),
        )

        results.push(...matching)
      } catch (error) {
        logger.debug(`Failed to search token list from ${listUrl}`)
      }
    }

    // Remove duplicates
    const unique = new Map<string, TokenMetadata>()
    for (const token of results) {
      const key = `${token.chainId}_${token.address.toLowerCase()}`
      if (!unique.has(key)) {
        unique.set(key, token)
      }
    }

    return Array.from(unique.values())
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

