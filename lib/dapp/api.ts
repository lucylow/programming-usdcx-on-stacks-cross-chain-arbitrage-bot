// Unified API client for backend and blockchain interactions
import type {
  BotStatus,
  PriceData,
  ArbitrageOpportunity,
  TradeResult,
  PerformanceMetrics,
  DaoProposal,
  NftBadge,
  Transaction,
} from "./types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001/api"
const STACKS_API = process.env.NEXT_PUBLIC_STACKS_API || "https://api.testnet.hiro.so"

class DappApi {
  private backendUrl: string
  private stacksApi: string
  private useMockData: boolean

  constructor() {
    this.backendUrl = BACKEND_URL
    this.stacksApi = STACKS_API
    // Use mock data if backend is not available
    this.useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
  }

  private async fetchBackend<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.backendUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error(`Backend request failed: ${endpoint}`, error)
      // Fall back to mock data if backend fails
      if (this.useMockData) {
        return this.getMockData<T>(endpoint)
      }
      throw error
    }
  }

  private async fetchStacks<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.stacksApi}${endpoint}`)
    if (!response.ok) {
      throw new Error(`Stacks API error: ${response.statusText}`)
    }
    return response.json()
  }

  // Generate mock data for demo mode
  private getMockData<T>(endpoint: string): T {
    const mockData: Record<string, unknown> = {
      "/health": { status: "healthy", timestamp: new Date().toISOString() },
      "/bot/status": {
        running: true,
        activeTrades: 2,
        queueLength: 5,
        opportunitiesDetected: 147,
        tradesExecuted: 89,
        totalProfit: 12450.67,
        winRate: 0.847,
        avgProfit: 139.89,
        uptime: 86400,
      },
      "/prices": this.generateMockPrices(),
      "/opportunities": this.generateMockOpportunities(),
      "/trades": this.generateMockTrades(),
      "/performance": {
        period: "daily",
        totalTrades: 89,
        profitableTrades: 75,
        totalVolume: 1250000,
        totalProfit: 12450.67,
        avgProfitPerTrade: 139.89,
        maxProfit: 523.45,
        maxLoss: -89.12,
        sharpeRatio: 2.34,
        winRate: 0.847,
      },
    }

    const key = Object.keys(mockData).find((k) => endpoint.startsWith(k))
    return (mockData[key || "/health"] as T) || ({} as T)
  }

  private generateMockPrices(): PriceData[] {
    return [
      {
        chain: "ethereum",
        dex: "Uniswap V3",
        pair: "USDC/ETH",
        price: 0.00041 + Math.random() * 0.00002,
        liquidity: 45000000,
        confidence: 0.98,
        change24h: 1.23,
        timestamp: Date.now(),
      },
      {
        chain: "ethereum",
        dex: "Curve",
        pair: "USDC/USDT",
        price: 0.9998 + Math.random() * 0.0004,
        liquidity: 120000000,
        confidence: 0.99,
        change24h: 0.01,
        timestamp: Date.now(),
      },
      {
        chain: "stacks",
        dex: "ALEX",
        pair: "USDCx/STX",
        price: 0.52 + Math.random() * 0.02,
        liquidity: 8500000,
        confidence: 0.94,
        change24h: 2.45,
        timestamp: Date.now(),
      },
      {
        chain: "stacks",
        dex: "Arkadiko",
        pair: "USDCx/USDA",
        price: 1.001 + Math.random() * 0.002,
        liquidity: 3200000,
        confidence: 0.92,
        change24h: -0.12,
        timestamp: Date.now(),
      },
    ]
  }

  private generateMockOpportunities(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = []
    const pairs = ["USDC/ETH", "USDCx/STX", "USDC/USDT"]

    for (let i = 0; i < 5; i++) {
      const spread = 0.5 + Math.random() * 2.5
      opportunities.push({
        id: `opp_${Date.now()}_${i}`,
        sourceChain: i % 2 === 0 ? "ethereum" : "stacks",
        targetChain: i % 2 === 0 ? "stacks" : "ethereum",
        sourceDex: i % 2 === 0 ? "Uniswap V3" : "ALEX",
        targetDex: i % 2 === 0 ? "ALEX" : "Curve",
        tokenPair: pairs[i % pairs.length],
        sourcePrice: 1.0,
        targetPrice: 1.0 + spread / 100,
        spread,
        expectedProfit: spread * 100,
        confidence: 0.7 + Math.random() * 0.25,
        status: i === 0 ? "active" : i === 1 ? "executing" : "completed",
        tradeSize: 5000 + Math.random() * 15000,
        detectedAt: new Date(Date.now() - i * 60000).toISOString(),
        expiresAt: new Date(Date.now() + (5 - i) * 60000).toISOString(),
      })
    }

    return opportunities
  }

  private generateMockTrades(): TradeResult[] {
    const trades: TradeResult[] = []

    for (let i = 0; i < 10; i++) {
      const success = Math.random() > 0.15
      trades.push({
        id: `trade_${Date.now()}_${i}`,
        opportunityId: `opp_${Date.now() - i * 120000}_0`,
        status: success ? "success" : "failed",
        profit: success ? 50 + Math.random() * 400 : -20 - Math.random() * 50,
        roi: success ? 0.5 + Math.random() * 3 : -0.2 - Math.random() * 0.5,
        executionTime: 2000 + Math.random() * 8000,
        gasCost: 5 + Math.random() * 25,
        bridgeFee: 10 + Math.random() * 20,
        slippage: 0.1 + Math.random() * 0.5,
        txHashes: {
          source: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          bridge: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          target: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        },
        timestamp: Date.now() - i * 120000,
        error: success ? undefined : "Slippage exceeded maximum threshold",
      })
    }

    return trades
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetchBackend("/health")
  }

  // Bot status
  async getBotStatus(): Promise<BotStatus> {
    return this.fetchBackend("/bot/status")
  }

  async startBot(): Promise<{ success: boolean; message: string }> {
    return this.fetchBackend("/bot/start", { method: "POST" })
  }

  async stopBot(): Promise<{ success: boolean; message: string }> {
    return this.fetchBackend("/bot/stop", { method: "POST" })
  }

  // Prices
  async getPrices(): Promise<PriceData[]> {
    return this.fetchBackend("/prices")
  }

  // Opportunities
  async getOpportunities(): Promise<ArbitrageOpportunity[]> {
    return this.fetchBackend("/opportunities")
  }

  async executeOpportunity(opportunityId: string): Promise<{ success: boolean; tradeId: string }> {
    return this.fetchBackend("/trades/execute", {
      method: "POST",
      body: JSON.stringify({ opportunityId }),
    })
  }

  // Trades
  async getTrades(): Promise<TradeResult[]> {
    return this.fetchBackend("/trades")
  }

  async getTradeById(id: string): Promise<TradeResult> {
    return this.fetchBackend(`/trades/${id}`)
  }

  // Performance
  async getPerformance(period = "daily"): Promise<PerformanceMetrics> {
    return this.fetchBackend(`/performance?period=${period}`)
  }

  // Stacks blockchain interactions
  async getStxBalance(address: string): Promise<number> {
    const data = await this.fetchStacks<{ balance: string }>(`/extended/v1/address/${address}/stx`)
    return Number.parseInt(data.balance || "0") / 1_000_000
  }

  async getAccountTransactions(address: string, limit = 20): Promise<Transaction[]> {
    const data = await this.fetchStacks<{ results: any[] }>(
      `/extended/v1/address/${address}/transactions?limit=${limit}`,
    )

    return data.results.map((tx: any) => ({
      id: tx.tx_id,
      type: tx.tx_type === "contract_call" ? "swap" : "approve",
      status: tx.tx_status === "success" ? "confirmed" : "pending",
      chain: "stacks" as const,
      hash: tx.tx_id,
      from: tx.sender_address,
      to: tx.contract_call?.contract_id || "",
      amount: 0,
      token: "STX",
      timestamp: new Date(tx.burn_block_time_iso).getTime(),
      blockNumber: tx.block_height,
    }))
  }

  // Contract read calls
  async readContract<T>(
    contractAddress: string,
    contractName: string,
    functionName: string,
    args: string[] = [],
    senderAddress?: string,
  ): Promise<T> {
    const response = await fetch(
      `${this.stacksApi}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: senderAddress || contractAddress,
          arguments: args,
        }),
      },
    )

    const data = await response.json()
    if (!data.okay) {
      throw new Error(data.cause || "Contract call failed")
    }

    return data.result as T
  }

  // DAO operations
  async getProposals(): Promise<DaoProposal[]> {
    // In production, this would fetch from the DAO contract
    // For demo, return mock data
    return [
      {
        id: 1,
        title: "Increase minimum profit threshold to 0.7%",
        description:
          "This proposal aims to increase the minimum profit threshold from 0.5% to 0.7% to reduce failed trades due to slippage.",
        proposer: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        status: "active",
        forVotes: 125000,
        againstVotes: 45000,
        startBlock: 100000,
        endBlock: 102000,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        title: "Add Velar DEX integration",
        description:
          "Integrate Velar DEX as an additional liquidity source on Stacks for improved arbitrage opportunities.",
        proposer: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
        status: "passed",
        forVotes: 280000,
        againstVotes: 12000,
        startBlock: 98000,
        endBlock: 100000,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        executedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]
  }

  // NFT operations
  async getUserBadges(address: string): Promise<NftBadge[]> {
    // In production, this would fetch from the NFT contract
    // For demo, return mock data
    return [
      {
        tokenId: 1,
        owner: address,
        badgeType: "early-adopter",
        tradesCompleted: 10,
        profitEarned: 1250,
        mintedAt: new Date(Date.now() - 604800000).toISOString(),
        metadata: {
          name: "Early Adopter Badge",
          description: "Awarded to early participants of the arbitrage bot",
          image: "/early-adopter-nft-badge.jpg",
        },
      },
    ]
  }

  // Real-time subscriptions (using polling for simplicity)
  subscribeToOpportunities(callback: (opportunity: ArbitrageOpportunity) => void, interval = 5000): () => void {
    const timer = setInterval(async () => {
      try {
        const opportunities = await this.getOpportunities()
        if (opportunities.length > 0) {
          callback(opportunities[0])
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error)
      }
    }, interval)

    return () => clearInterval(timer)
  }

  subscribeToPrices(callback: (prices: PriceData[]) => void, interval = 3000): () => void {
    const timer = setInterval(async () => {
      try {
        const prices = await this.getPrices()
        callback(prices)
      } catch (error) {
        console.error("Error fetching prices:", error)
      }
    }, interval)

    return () => clearInterval(timer)
  }

  subscribeToBotStatus(callback: (status: BotStatus) => void, interval = 5000): () => void {
    const timer = setInterval(async () => {
      try {
        const status = await this.getBotStatus()
        callback(status)
      } catch (error) {
        console.error("Error fetching bot status:", error)
      }
    }, interval)

    return () => clearInterval(timer)
  }
}

export const dappApi = new DappApi()
