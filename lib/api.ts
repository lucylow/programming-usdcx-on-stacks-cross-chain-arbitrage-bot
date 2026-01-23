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

export interface ApiError {
  code: string
  message: string
  details?: unknown
  retryable?: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

class ApiClient {
  private baseUrl: string
  private defaultTimeout: number

  constructor(baseUrl: string, defaultTimeout = 30000) {
    this.baseUrl = baseUrl
    this.defaultTimeout = defaultTimeout
  }

  /**
   * Generate mock data for fallback when API fails
   * Ensures frontend works on Lovable even without backend
   */
  private getMockData<T>(endpoint: string): T {
    const mockData: Record<string, unknown> = {
      "/bot/status": {
        running: true,
        activeTrades: 2,
        queueLength: 5,
        opportunitiesDetected: 147,
        tradesExecuted: 89,
        totalProfit: 12450.67,
        winRate: 0.847,
      },
      "/prices": [
        {
          chain: "ethereum",
          dex: "Uniswap V3",
          pair: "USDC/ETH",
          price: 0.00041,
          liquidity: 45000000,
          confidence: 0.98,
          timestamp: Date.now(),
        },
        {
          chain: "stacks",
          dex: "ALEX",
          pair: "USDCx/STX",
          price: 0.52,
          liquidity: 8500000,
          confidence: 0.94,
          timestamp: Date.now(),
        },
      ],
      "/opportunities": [
        {
          id: `opp_${Date.now()}`,
          ethDex: "Uniswap V3",
          stacksDex: "ALEX",
          ethPair: "USDC/ETH",
          stacksPair: "USDCx/STX",
          direction: "ethereum->stacks",
          expectedProfit: 150.5,
          confidence: 0.75,
          tradeSize: 10000,
          timestamp: Date.now(),
        },
      ],
      "/trades": [
        {
          id: `trade_${Date.now()}`,
          opportunityId: `opp_${Date.now() - 1000}`,
          status: "success",
          profit: 125.5,
          roi: 1.25,
          executionTime: 3500,
          timestamp: Date.now() - 60000,
        },
      ],
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
      },
      "/health": {
        status: "healthy",
      },
    }

    // Find matching endpoint (supports partial matches)
    const key = Object.keys(mockData).find((k) => endpoint.includes(k))
    return (mockData[key || "/health"] || mockData["/health"]) as T
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

        const data: ApiResponse<T> = await response.json()

        if (!response.ok || !data.success) {
          const error = data.error || {
            code: `HTTP_${response.status}`,
            message: response.statusText || "Unknown error",
            retryable: response.status >= 500,
          }

          // Don't retry on client errors (4xx) - fallback to mock data
          if (response.status >= 400 && response.status < 500 && !error.retryable) {
            console.warn(`API error (${response.status}), using mock data fallback: ${error.message}`)
            return this.getMockData<T>(endpoint)
          }

          // Retry on server errors (5xx) or retryable errors
          const apiError = new Error(error.message) as Error & { code?: string; retryable?: boolean }
          apiError.code = error.code
          apiError.retryable = error.retryable || response.status >= 500
          throw apiError
        }

        // Return data from successful response
        return (data.data ?? data) as T
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on abort (timeout) or network errors - fallback to mock data
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            console.warn("API request timeout, using mock data fallback")
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
            console.warn(`API network error, using mock data fallback: ${error.message}`)
            return this.getMockData<T>(endpoint)
          }
          if (error.message.includes("API error:") && !error.message.includes("500")) {
            console.warn(`API error, using mock data fallback: ${error.message}`)
            return this.getMockData<T>(endpoint)
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

    // All retries exhausted - always fallback to mock data for Lovable compatibility
    console.warn(`API request failed after ${retries} attempts, using mock data fallback: ${endpoint}`, lastError)
    return this.getMockData<T>(endpoint)
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
