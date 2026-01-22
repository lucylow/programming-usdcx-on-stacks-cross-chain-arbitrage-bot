// API client for backend integration
// Support both VITE_ (Vite) and NEXT_PUBLIC_ (Next.js) prefixes for compatibility
const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api")

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

  private async fetch<T>(endpoint: string, options?: RequestInit, retries = 3): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
          let errorMessage = `API error: ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // Ignore JSON parse errors
          }

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errorMessage)
          }

          // Retry on server errors (5xx) or network errors
          throw new Error(errorMessage)
        }

        return response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on abort (timeout) or client errors
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new Error("Request timeout")
          }
          if (error.message.includes("API error:") && !error.message.includes("500")) {
            throw error
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))
          console.warn(`API request failed, retrying (${attempt}/${retries}): ${endpoint}`)
        }
      }
    }

    console.error(`API request failed after ${retries} attempts: ${endpoint}`, lastError)
    throw lastError || new Error("Unknown error")
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
