/**
 * Multi-Chain Data Service
 * Provides unified interface for accessing data across multiple blockchains
 */

import { ethers } from "ethers"
import { logger } from "../utils/logger"
import { NetworkError } from "../utils/errors"
import { Web3DataProvider } from "./dataProvider"
import { PriceFeedAggregator } from "./priceFeedAggregator"
import { TokenMetadataService } from "./tokenMetadata"

export interface ChainInfo {
  chainId: number
  name: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
  isTestnet: boolean
}

export interface CrossChainData {
  sourceChain: ChainInfo
  targetChain: ChainInfo
  token: {
    address: string
    symbol: string
    name: string
  }
  sourcePrice: number
  targetPrice: number
  priceDifference: number
  priceDifferencePercent: number
  arbitrageOpportunity: boolean
  timestamp: number
}

export interface ChainMetrics {
  chainId: number
  blockNumber: number
  blockTime: number
  gasPrice: bigint
  pendingTransactions: number
  totalValueLocked?: number
  dailyVolume?: number
  activeAddresses?: number
}

export class MultiChainService {
  private chainInfo: Map<number, ChainInfo> = new Map()

  constructor(
    private dataProvider: Web3DataProvider,
    private priceFeedAggregator: PriceFeedAggregator,
    private tokenMetadataService: TokenMetadataService,
  ) {
    this.initializeChainInfo()
  }

  /**
   * Initialize chain information
   */
  private initializeChainInfo(): void {
    // Ethereum Mainnet
    this.chainInfo.set(1, {
      chainId: 1,
      name: "Ethereum Mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://eth-mainnet.g.alchemy.com/v2/demo"],
      blockExplorerUrls: ["https://etherscan.io"],
      isTestnet: false,
    })

    // Polygon
    this.chainInfo.set(137, {
      chainId: 137,
      name: "Polygon",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
      rpcUrls: ["https://polygon-rpc.com"],
      blockExplorerUrls: ["https://polygonscan.com"],
      isTestnet: false,
    })

    // BSC
    this.chainInfo.set(56, {
      chainId: 56,
      name: "BNB Smart Chain",
      nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
      },
      rpcUrls: ["https://bsc-dataseed.binance.org"],
      blockExplorerUrls: ["https://bscscan.com"],
      isTestnet: false,
    })

    // Avalanche
    this.chainInfo.set(43114, {
      chainId: 43114,
      name: "Avalanche",
      nativeCurrency: {
        name: "AVAX",
        symbol: "AVAX",
        decimals: 18,
      },
      rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
      blockExplorerUrls: ["https://snowtrace.io"],
      isTestnet: false,
    })

    // Arbitrum
    this.chainInfo.set(42161, {
      chainId: 42161,
      name: "Arbitrum One",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://arb1.arbitrum.io/rpc"],
      blockExplorerUrls: ["https://arbiscan.io"],
      isTestnet: false,
    })

    // Optimism
    this.chainInfo.set(10, {
      chainId: 10,
      name: "Optimism",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://mainnet.optimism.io"],
      blockExplorerUrls: ["https://optimistic.etherscan.io"],
      isTestnet: false,
    })
  }

  /**
   * Get chain information
   */
  getChainInfo(chainId: number): ChainInfo | undefined {
    return this.chainInfo.get(chainId)
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainInfo[] {
    return Array.from(this.chainInfo.values())
  }

  /**
   * Get metrics for a specific chain
   */
  async getChainMetrics(chainId: number): Promise<ChainMetrics> {
    try {
      const blockData = await this.dataProvider.getBlockData(chainId)
      const gasPrice = await this.dataProvider.getGasPrice(chainId)

      // Calculate average block time (simplified)
      const blockTime = 12 // Default for Ethereum, would need historical data for accurate calculation

      return {
        chainId,
        blockNumber: blockData.blockNumber,
        blockTime,
        gasPrice: gasPrice.gasPrice,
        pendingTransactions: blockData.pendingTransactions,
      }
    } catch (error: any) {
      logger.error(`Error fetching chain metrics:`, error)
      throw new NetworkError(`Failed to fetch chain metrics: ${error.message}`, {
        chainId,
        error: error.message,
      })
    }
  }

  /**
   * Get metrics for all supported chains
   */
  async getAllChainMetrics(): Promise<Map<number, ChainMetrics>> {
    const metrics = new Map<number, ChainMetrics>()
    const chainIds = Array.from(this.chainInfo.keys())

    const promises = chainIds.map(async (chainId) => {
      try {
        const metric = await this.getChainMetrics(chainId)
        metrics.set(chainId, metric)
      } catch (error) {
        logger.error(`Failed to get metrics for chain ${chainId}:`, error)
      }
    })

    await Promise.all(promises)
    return metrics
  }

  /**
   * Compare token prices across chains
   */
  async compareCrossChainPrices(
    tokenSymbol: string,
    sourceChainId: number,
    targetChainId: number,
    tokenAddresses?: { source?: string; target?: string },
  ): Promise<CrossChainData> {
    try {
      const sourceChain = this.chainInfo.get(sourceChainId)
      const targetChain = this.chainInfo.get(targetChainId)

      if (!sourceChain || !targetChain) {
        throw new Error("Invalid chain IDs")
      }

      // Get prices from both chains
      const [sourcePrice, targetPrice] = await Promise.all([
        this.priceFeedAggregator.getAggregatedPrice(
          tokenSymbol,
          tokenAddresses?.source,
          sourceChainId,
        ),
        this.priceFeedAggregator.getAggregatedPrice(
          tokenSymbol,
          tokenAddresses?.target,
          targetChainId,
        ),
      ])

      const priceDifference = targetPrice.aggregatedPrice - sourcePrice.aggregatedPrice
      const priceDifferencePercent =
        (priceDifference / sourcePrice.aggregatedPrice) * 100

      // Get token metadata
      const tokenMetadata = tokenAddresses?.source
        ? await this.tokenMetadataService.getTokenMetadata(sourceChainId, tokenAddresses.source)
        : null

      return {
        sourceChain,
        targetChain,
        token: {
          address: tokenAddresses?.source || "",
          symbol: tokenSymbol,
          name: tokenMetadata?.name || tokenSymbol,
        },
        sourcePrice: sourcePrice.aggregatedPrice,
        targetPrice: targetPrice.aggregatedPrice,
        priceDifference,
        priceDifferencePercent,
        arbitrageOpportunity: Math.abs(priceDifferencePercent) > 0.5, // 0.5% threshold
        timestamp: Date.now(),
      }
    } catch (error: any) {
      logger.error(`Error comparing cross-chain prices:`, error)
      throw new NetworkError(`Failed to compare cross-chain prices: ${error.message}`, {
        tokenSymbol,
        sourceChainId,
        targetChainId,
        error: error.message,
      })
    }
  }

  /**
   * Get token balance across multiple chains
   */
  async getMultiChainBalance(
    walletAddress: string,
    tokenAddress: string,
    chainIds: number[],
  ): Promise<Map<number, { balance: string; valueUSD?: number }>> {
    const balances = new Map<number, { balance: string; valueUSD?: number }>()

    const promises = chainIds.map(async (chainId) => {
      try {
        const tokenBalance = await this.dataProvider.getTokenBalance(
          chainId,
          tokenAddress,
          walletAddress,
        )

        // Get price for USD value
        const price = await this.priceFeedAggregator
          .getAggregatedPrice(tokenBalance.symbol, tokenAddress, chainId)
          .catch(() => null)

        const balanceValue = parseFloat(tokenBalance.balance) / Math.pow(10, tokenBalance.decimals)
        const valueUSD = price ? balanceValue * price.aggregatedPrice : undefined

        balances.set(chainId, {
          balance: tokenBalance.balance,
          valueUSD,
        })
      } catch (error) {
        logger.error(`Failed to get balance on chain ${chainId}:`, error)
      }
    })

    await Promise.all(promises)
    return balances
  }

  /**
   * Monitor cross-chain arbitrage opportunities
   */
  async monitorArbitrageOpportunities(
    tokenSymbol: string,
    chainPairs: Array<{ source: number; target: number }>,
    threshold: number = 0.5,
  ): Promise<CrossChainData[]> {
    const opportunities: CrossChainData[] = []

    const promises = chainPairs.map(async (pair) => {
      try {
        const comparison = await this.compareCrossChainPrices(
          tokenSymbol,
          pair.source,
          pair.target,
        )

        if (comparison.arbitrageOpportunity) {
          opportunities.push(comparison)
        }
      } catch (error) {
        logger.error(`Error monitoring arbitrage for pair ${pair.source}-${pair.target}:`, error)
      }
    })

    await Promise.all(promises)

    // Sort by price difference
    return opportunities.sort((a, b) => Math.abs(b.priceDifferencePercent) - Math.abs(a.priceDifferencePercent))
  }

  /**
   * Get native token balance across chains
   */
  async getMultiChainNativeBalance(
    walletAddress: string,
    chainIds: number[],
  ): Promise<Map<number, { balance: string; symbol: string; valueUSD?: number }>> {
    const balances = new Map<number, { balance: string; symbol: string; valueUSD?: number }>()

    const promises = chainIds.map(async (chainId) => {
      try {
        const chainInfo = this.chainInfo.get(chainId)
        if (!chainInfo) {
          return
        }

        const balance = await this.dataProvider.getNativeBalance(chainId, walletAddress)
        const price = await this.priceFeedAggregator
          .getAggregatedPrice(chainInfo.nativeCurrency.symbol, undefined, chainId)
          .catch(() => null)

        const balanceValue = parseFloat(balance) / Math.pow(10, chainInfo.nativeCurrency.decimals)
        const valueUSD = price ? balanceValue * price.aggregatedPrice : undefined

        balances.set(chainId, {
          balance,
          symbol: chainInfo.nativeCurrency.symbol,
          valueUSD,
        })
      } catch (error) {
        logger.error(`Failed to get native balance on chain ${chainId}:`, error)
      }
    })

    await Promise.all(promises)
    return balances
  }
}

