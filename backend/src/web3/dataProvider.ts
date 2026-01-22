/**
 * Web3 Data Provider Service
 * Provides real-time blockchain data using open source libraries
 */

import { ethers } from "ethers"
import axios, { AxiosInstance } from "axios"
import { logger } from "../utils/logger"
import { NetworkError, TimeoutError } from "../utils/errors"

export interface BlockchainData {
  chainId: number
  blockNumber: number
  blockTimestamp: number
  gasPrice: bigint
  baseFeePerGas?: bigint
  networkHashrate?: string
  pendingTransactions: number
}

export interface TokenBalance {
  address: string
  symbol: string
  balance: string
  decimals: number
  valueUSD?: number
}

export interface TransactionData {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: bigint
  gasLimit: bigint
  nonce: number
  blockNumber?: number
  status?: number
  timestamp?: number
}

export interface ContractData {
  address: string
  abi: any[]
  bytecode?: string
  verified: boolean
}

export class Web3DataProvider {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map()
  private httpClient: AxiosInstance
  private wsProviders: Map<number, ethers.WebSocketProvider> = new Map()
  private reconnectTimers: Map<number, NodeJS.Timeout> = new Map()

  constructor(
    private rpcUrls: Map<number, string>,
    private wsUrls?: Map<number, string>,
  ) {
    // Initialize HTTP providers
    for (const [chainId, rpcUrl] of rpcUrls.entries()) {
      this.providers.set(chainId, new ethers.JsonRpcProvider(rpcUrl))
    }

    // Initialize HTTP client for external APIs
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chainId: number): ethers.JsonRpcProvider {
    const provider = this.providers.get(chainId)
    if (!provider) {
      throw new Error(`No provider configured for chain ID ${chainId}`)
    }
    return provider
  }

  /**
   * Get WebSocket provider for real-time data
   */
  async getWebSocketProvider(chainId: number): Promise<ethers.WebSocketProvider> {
    if (!this.wsUrls) {
      throw new Error("WebSocket URLs not configured")
    }

    const wsUrl = this.wsUrls.get(chainId)
    if (!wsUrl) {
      throw new Error(`No WebSocket URL configured for chain ID ${chainId}`)
    }

    let wsProvider = this.wsProviders.get(chainId)
    if (!wsProvider || wsProvider.websocket.readyState === WebSocket.CLOSED) {
      wsProvider = new ethers.WebSocketProvider(wsUrl)
      this.wsProviders.set(chainId, wsProvider)

      // Setup reconnection logic
      this.setupWebSocketReconnect(chainId, wsUrl)
    }

    return wsProvider
  }

  /**
   * Setup WebSocket reconnection
   */
  private setupWebSocketReconnect(chainId: number, wsUrl: string): void {
    const provider = this.wsProviders.get(chainId)
    if (!provider) return

    provider.websocket.onclose = () => {
      logger.warn(`WebSocket closed for chain ${chainId}, reconnecting...`)
      
      const timer = setTimeout(async () => {
        try {
          const newProvider = new ethers.WebSocketProvider(wsUrl)
          this.wsProviders.set(chainId, newProvider)
          this.setupWebSocketReconnect(chainId, wsUrl)
          logger.info(`WebSocket reconnected for chain ${chainId}`)
        } catch (error) {
          logger.error(`Failed to reconnect WebSocket for chain ${chainId}:`, error)
        }
      }, 5000)

      this.reconnectTimers.set(chainId, timer)
    }
  }

  /**
   * Get current block data
   */
  async getBlockData(chainId: number): Promise<BlockchainData> {
    try {
      const provider = this.getProvider(chainId)
      const [block, feeData] = await Promise.all([
        provider.getBlock("latest"),
        provider.getFeeData(),
      ])

      if (!block) {
        throw new Error("Failed to fetch block")
      }

      // Get pending transaction count
      const pendingTxCount = await provider.getTransactionCount("pending")

      return {
        chainId,
        blockNumber: block.number,
        blockTimestamp: block.timestamp,
        gasPrice: feeData.gasPrice || BigInt(0),
        baseFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas / BigInt(2) : undefined,
        pendingTransactions: pendingTxCount,
      }
    } catch (error: any) {
      logger.error(`Error fetching block data for chain ${chainId}:`, error)
      throw new NetworkError(`Failed to fetch block data: ${error.message}`, { chainId, error: error.message })
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(
    chainId: number,
    tokenAddress: string,
    walletAddress: string,
  ): Promise<TokenBalance> {
    try {
      const provider = this.getProvider(chainId)

      // ERC20 ABI for balanceOf
      const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
      ]

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)
      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
        contract.symbol(),
      ])

      return {
        address: tokenAddress,
        symbol,
        balance: balance.toString(),
        decimals: Number(decimals),
      }
    } catch (error: any) {
      logger.error(`Error fetching token balance:`, error)
      throw new NetworkError(`Failed to fetch token balance: ${error.message}`, {
        chainId,
        tokenAddress,
        walletAddress,
        error: error.message,
      })
    }
  }

  /**
   * Get native token balance (ETH, STX, etc.)
   */
  async getNativeBalance(chainId: number, address: string): Promise<string> {
    try {
      const provider = this.getProvider(chainId)
      const balance = await provider.getBalance(address)
      return balance.toString()
    } catch (error: any) {
      logger.error(`Error fetching native balance:`, error)
      throw new NetworkError(`Failed to fetch native balance: ${error.message}`, {
        chainId,
        address,
        error: error.message,
      })
    }
  }

  /**
   * Get transaction data
   */
  async getTransaction(chainId: number, txHash: string): Promise<TransactionData> {
    try {
      const provider = this.getProvider(chainId)
      const [tx, receipt] = await Promise.all([
        provider.getTransaction(txHash),
        provider.getTransactionReceipt(txHash).catch(() => null),
      ])

      if (!tx) {
        throw new Error("Transaction not found")
      }

      const block = tx.blockNumber ? await provider.getBlock(tx.blockNumber) : null

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || "",
        value: tx.value.toString(),
        gasPrice: tx.gasPrice || BigInt(0),
        gasLimit: tx.gasLimit,
        nonce: tx.nonce,
        blockNumber: tx.blockNumber || undefined,
        status: receipt?.status,
        timestamp: block?.timestamp,
      }
    } catch (error: any) {
      logger.error(`Error fetching transaction:`, error)
      throw new NetworkError(`Failed to fetch transaction: ${error.message}`, {
        chainId,
        txHash,
        error: error.message,
      })
    }
  }

  /**
   * Get contract data and ABI
   */
  async getContractData(chainId: number, address: string): Promise<ContractData> {
    try {
      const provider = this.getProvider(chainId)
      const code = await provider.getCode(address)

      return {
        address,
        abi: [], // Would need to fetch from block explorer API
        bytecode: code,
        verified: code !== "0x",
      }
    } catch (error: any) {
      logger.error(`Error fetching contract data:`, error)
      throw new NetworkError(`Failed to fetch contract data: ${error.message}`, {
        chainId,
        address,
        error: error.message,
      })
    }
  }

  /**
   * Listen to new blocks
   */
  async onNewBlock(chainId: number, callback: (block: BlockchainData) => void): Promise<void> {
    try {
      const provider = await this.getWebSocketProvider(chainId)
      
      provider.on("block", async (blockNumber) => {
        try {
          const blockData = await this.getBlockData(chainId)
          callback(blockData)
        } catch (error) {
          logger.error(`Error in block callback:`, error)
        }
      })

      logger.info(`Started listening to blocks on chain ${chainId}`)
    } catch (error: any) {
      logger.error(`Error setting up block listener:`, error)
      throw new NetworkError(`Failed to setup block listener: ${error.message}`, {
        chainId,
        error: error.message,
      })
    }
  }

  /**
   * Listen to pending transactions
   */
  async onPendingTransaction(
    chainId: number,
    callback: (tx: TransactionData) => void,
  ): Promise<void> {
    try {
      const provider = await this.getWebSocketProvider(chainId)
      
      provider.on("pending", async (txHash) => {
        try {
          const tx = await this.getTransaction(chainId, txHash)
          callback(tx)
        } catch (error) {
          // Transaction might not be available yet
          logger.debug(`Pending transaction not yet available: ${txHash}`)
        }
      })

      logger.info(`Started listening to pending transactions on chain ${chainId}`)
    } catch (error: any) {
      logger.error(`Error setting up pending transaction listener:`, error)
      throw new NetworkError(`Failed to setup pending transaction listener: ${error.message}`, {
        chainId,
        error: error.message,
      })
    }
  }

  /**
   * Get gas price estimate
   */
  async getGasPrice(chainId: number): Promise<{
    gasPrice: bigint
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
  }> {
    try {
      const provider = this.getProvider(chainId)
      const feeData = await provider.getFeeData()

      return {
        gasPrice: feeData.gasPrice || BigInt(0),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      }
    } catch (error: any) {
      logger.error(`Error fetching gas price:`, error)
      throw new NetworkError(`Failed to fetch gas price: ${error.message}`, {
        chainId,
        error: error.message,
      })
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close WebSocket connections
    for (const [chainId, provider] of this.wsProviders.entries()) {
      try {
        provider.destroy()
      } catch (error) {
        logger.error(`Error closing WebSocket for chain ${chainId}:`, error)
      }
    }

    // Clear reconnection timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer)
    }

    this.wsProviders.clear()
    this.reconnectTimers.clear()
  }
}

