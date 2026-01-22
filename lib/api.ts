// API client for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export interface BotStatus {
  running: boolean
  activeTrades: number
  queueLength: number
  opportunitiesDetected: number
  tradesExecuted: number
  totalProfit: number
  winRate: number
}

export interface Opportunity {
  id: string
  ethDex: string
  stacksDex: string
  ethPair: string
  stacksPair: string
  direction: string
  expectedProfit: number
  confidence: number
  tradeSize: number
  timestamp: number
}

export interface Trade {
  id: string
  opportunityId: string
  status: string
  profit: number
  roi: number
  executionTime: number
  timestamp: number
}

export interface PriceData {
  chain: string
  dex: string
  pair: string
  price: number
  liquidity: number
  confidence: number
  timestamp: number
}

export interface PerformanceMetrics {
  period: string
  totalTrades: number
  profitableTrades: number
  totalVolume: number
  totalProfit: number
  avgProfitPerTrade: number
  maxProfit: number
  maxLoss: number
  sharpeRatio: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  async getBotStatus(): Promise<BotStatus> {
    return this.fetch<BotStatus>("/bot/status")
  }

  async getOpportunities(): Promise<Opportunity[]> {
    return this.fetch<Opportunity[]>("/opportunities")
  }

  async getTrades(): Promise<Trade[]> {
    return this.fetch<Trade[]>("/trades")
  }

  async getPrices(): Promise<PriceData[]> {
    return this.fetch<PriceData[]>("/prices")
  }

  async getPerformance(period = "daily"): Promise<PerformanceMetrics> {
    return this.fetch<PerformanceMetrics>(`/performance?period=${period}`)
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.fetch<{ status: string }>("/health")
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
