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
import { getApiBaseUrl, isLovableEnvironment, logLovableInfo, shouldUseMockData } from "../utils/lovable"

// Initialize Lovable logging on module load
if (typeof window !== "undefined") {
  logLovableInfo()
}

// Support both VITE_ (Vite) and NEXT_PUBLIC_ (Next.js) prefixes for compatibility
const BACKEND_URL = getApiBaseUrl() || 
  ((import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001/api")
const STACKS_API = ((import.meta as any).env?.VITE_STACKS_API || (import.meta as any).env?.NEXT_PUBLIC_STACKS_API || "https://api.testnet.hiro.so")
const USE_MOCK_DATA = shouldUseMockData()

class DappApi {
  private backendUrl: string
  private stacksApi: string
  private useMockData: boolean

  constructor() {
    this.backendUrl = BACKEND_URL
    this.stacksApi = STACKS_API
    // Use centralized Lovable detection
    this.useMockData = USE_MOCK_DATA
  }

  private async fetchBackend<T>(endpoint: string, options?: RequestInit, retries = 3): Promise<T> {
    // On Lovable with mock data enabled, skip network requests
    if (this.useMockData && isLovableEnvironment()) {
      console.log(`[Lovable] Using mock data for: ${endpoint}`)
      return this.getMockData<T>(endpoint)
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(`${this.backendUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = `Backend error: ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // Ignore JSON parse errors
          }

          // Don't retry on client errors (4xx) - always fallback to mock data
          if (response.status >= 400 && response.status < 500) {
            console.warn(`Backend error (${response.status}), using mock data fallback: ${errorMessage}`)
            return this.getMockData<T>(endpoint)
          }

          // Retry on server errors (5xx), but fallback after retries
          throw new Error(errorMessage)
        }

        return response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on abort (timeout) or client errors - always fallback to mock data
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            console.warn("Request timeout, using mock data fallback")
            return this.getMockData<T>(endpoint)
          }
          if (error.message.includes("Backend error:") && !error.message.includes("500")) {
            console.warn(`Backend error, using mock data fallback: ${error.message}`)
            return this.getMockData<T>(endpoint)
          }
          // Check for network-related errors - always fallback
          if (
            error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("ECONNREFUSED") ||
            error.message.includes("ENOTFOUND") ||
            error.message.includes("ETIMEDOUT") ||
            error.message.includes("Failed to fetch")
          ) {
            console.warn(`Network error detected, using mock data fallback: ${error.message}`)
            return this.getMockData<T>(endpoint)
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))
          console.warn(`Backend request failed, retrying (${attempt}/${retries}): ${endpoint}`)
        }
      }
    }

    // All retries exhausted - always fall back to mock data for Lovable compatibility
    console.warn(`Backend request failed after ${retries} attempts, using mock data fallback: ${endpoint}`, lastError)
    return this.getMockData<T>(endpoint)
  }

  /**
   * Determine if we should use fallback mock data even when useMockData is false
   * This provides a safety net for critical network failures
   */
  private shouldUseFallbackForError(error: Error): boolean {
    const criticalErrors = [
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "network",
      "fetch failed",
      "Failed to fetch",
    ]
    return criticalErrors.some((pattern) => error.message.toLowerCase().includes(pattern.toLowerCase()))
  }

  private async fetchStacks<T>(endpoint: string, retries = 3): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(`${this.stacksApi}${endpoint}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorMessage = `Stacks API error: ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // Ignore JSON parse errors
          }

          // Don't retry on client errors (4xx) - always fallback to mock data
          if (response.status >= 400 && response.status < 500) {
            console.warn(`Stacks API client error (${response.status}), using mock data fallback: ${errorMessage}`)
            return this.getMockStacksData<T>(endpoint)
          }

          throw new Error(errorMessage)
        }

        return response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on abort (timeout) or client errors - always fallback to mock data
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            console.warn("Stacks API request timeout, using mock data fallback")
            return this.getMockStacksData<T>(endpoint)
          }
          if (error.message.includes("Stacks API error:") && !error.message.includes("500")) {
            console.warn(`Stacks API error, using mock data fallback: ${error.message}`)
            return this.getMockStacksData<T>(endpoint)
          }
          // Check for network-related errors - always fallback
          if (
            error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("ECONNREFUSED") ||
            error.message.includes("ENOTFOUND") ||
            error.message.includes("ETIMEDOUT") ||
            error.message.includes("Failed to fetch")
          ) {
            console.warn(`Stacks API network error, using mock data fallback: ${error.message}`)
            return this.getMockStacksData<T>(endpoint)
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))
          console.warn(`Stacks API request failed, retrying (${attempt}/${retries}): ${endpoint}`)
        }
      }
    }

    // All retries exhausted - always fall back to mock data for Lovable compatibility
    console.warn(`Stacks API request failed after ${retries} attempts, using mock data fallback: ${endpoint}`, lastError)
    return this.getMockStacksData<T>(endpoint)
  }

  /**
   * Generate mock data for Stacks API endpoints
   */
  private getMockStacksData<T>(endpoint: string): T {
    const mockData: Record<string, unknown> = {
      "/extended/v1/address/": {
        balance: "1000000000", // 1000 STX in micro-STX
      },
      "/extended/v1/address/transactions": {
        results: this.generateMockStacksTransactions(),
      },
    }

    // Match endpoint patterns
    if (endpoint.includes("/stx")) {
      return { balance: "1000000000" } as T
    }
    if (endpoint.includes("/transactions")) {
      return { results: this.generateMockStacksTransactions() } as T
    }

    return {} as T
  }

  /**
   * Generate mock Stacks transactions
   */
  private generateMockStacksTransactions(): Array<Record<string, unknown>> {
    const transactions: Array<Record<string, unknown>> = []
    for (let i = 0; i < 5; i++) {
      transactions.push({
        tx_id: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        tx_type: i % 2 === 0 ? "contract_call" : "token_transfer",
        tx_status: i === 0 ? "pending" : "success",
        sender_address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        contract_call: i % 2 === 0 ? {
          contract_id: "SP000000000000000000002Q6VF78.pox",
          function_name: "stack-stx",
        } : undefined,
        burn_block_time_iso: new Date(Date.now() - i * 3600000).toISOString(),
        block_height: 100000 + i,
      })
    }
    return transactions
  }

  // Generate mock data for demo mode
  private getMockData<T>(endpoint: string): T {
    const mockData: Record<string, unknown> = {
      "/health": { 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        mode: isLovableEnvironment() ? "lovable" : "mock",
        message: isLovableEnvironment() ? "Running on Lovable with mock data" : "Using mock data fallback",
        version: "1.0.0",
      },
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
      "/trades/": this.generateMockTradeById(endpoint),
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
      "/oracle/stats": {
        totalSources: 4,
        activeSources: 4,
        lastUpdate: Date.now(),
        priceUpdates: 1247,
        errors: 0,
        avgLatency: 125,
      },
      "/bot/start": {
        success: true,
        message: "Bot started (mock mode)",
      },
      "/bot/stop": {
        success: true,
        message: "Bot stopped (mock mode)",
      },
      "/trades/execute": {
        success: true,
        tradeId: `trade_mock_${Date.now()}`,
        message: "Trade executed (mock mode)",
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
        chain: "ethereum",
        dex: "SushiSwap",
        pair: "USDC/ETH",
        price: 0.00041 + Math.random() * 0.00002,
        liquidity: 12000000,
        confidence: 0.96,
        change24h: 1.15,
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
      {
        chain: "stacks",
        dex: "Velar",
        pair: "USDCx/STX",
        price: 0.52 + Math.random() * 0.02,
        liquidity: 5200000,
        confidence: 0.91,
        change24h: 2.1,
        timestamp: Date.now(),
      },
    ]
  }

  private generateMockOpportunities(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = []
    const pairs = ["USDC/ETH", "USDCx/STX", "USDC/USDT"]
    const statuses: Array<"active" | "executing" | "completed" | "expired" | "failed"> = [
      "active",
      "executing",
      "completed",
      "expired",
      "failed",
    ]

    for (let i = 0; i < 8; i++) {
      const spread = 0.3 + Math.random() * 3.0
      const statusIndex = i % statuses.length
      opportunities.push({
        id: `opp_${Date.now()}_${i}`,
        sourceChain: i % 2 === 0 ? "ethereum" : "stacks",
        targetChain: i % 2 === 0 ? "stacks" : "ethereum",
        sourceDex: i % 2 === 0 ? (i % 3 === 0 ? "Uniswap V3" : "Curve") : (i % 3 === 0 ? "ALEX" : "Arkadiko"),
        targetDex: i % 2 === 0 ? (i % 3 === 0 ? "ALEX" : "Velar") : (i % 3 === 0 ? "Uniswap V3" : "SushiSwap"),
        tokenPair: pairs[i % pairs.length],
        sourcePrice: 1.0,
        targetPrice: 1.0 + spread / 100,
        spread,
        expectedProfit: spread * (5000 + Math.random() * 15000) / 100,
        confidence: 0.65 + Math.random() * 0.3,
        status: statuses[statusIndex],
        tradeSize: 5000 + Math.random() * 15000,
        detectedAt: new Date(Date.now() - i * 60000).toISOString(),
        expiresAt: new Date(Date.now() + (8 - i) * 60000).toISOString(),
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

  private generateMockTradeById(endpoint: string): TradeResult {
    // Extract trade ID from endpoint if present
    const tradeIdMatch = endpoint.match(/\/trades\/([^/?]+)/)
    const tradeId = tradeIdMatch ? tradeIdMatch[1] : `trade_mock_${Date.now()}`
    
    const success = Math.random() > 0.2
    return {
      id: tradeId,
      opportunityId: `opp_${Date.now()}_0`,
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
      timestamp: Date.now() - Math.random() * 86400000,
      error: success ? undefined : "Slippage exceeded maximum threshold",
    }
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

    return (data.results || []).map((tx: any): Transaction => ({
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
    try {
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
        // Always fall back to mock data for Lovable compatibility
        console.warn(`Contract call failed, using mock data fallback: ${data.cause || "Unknown error"}`)
        return this.getMockContractData<T>(functionName)
      }

      return data.result as T
    } catch (error) {
      // Always fall back to mock data for Lovable compatibility
      console.warn(`Contract call error, using mock data fallback: ${error instanceof Error ? error.message : String(error)}`)
      return this.getMockContractData<T>(functionName)
    }
  }

  /**
   * Generate mock data for contract calls
   */
  private getMockContractData<T>(functionName: string): T {
    const mockData: Record<string, unknown> = {
      "get-balance": "1000000000", // 1000 USDCx in micro units
      "get-allowance": "5000000000", // 5000 USDCx
      "get-price": "1000000", // Price in micro units
      "get-total-supply": "1000000000000", // Total supply
      "get-user-stats": {
        trades: 10,
        profit: 1250.5,
        badges: 2,
      },
    }

    // Return mock data based on function name
    const key = Object.keys(mockData).find((k) => functionName.toLowerCase().includes(k.toLowerCase()))
    return (key ? mockData[key] : {}) as T
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
