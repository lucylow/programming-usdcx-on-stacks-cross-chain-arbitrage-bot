"use client"

import { useState, useEffect } from "react"
import { apiClient, type BotStatus, type PriceData, type PerformanceMetrics } from "@/lib/api"

export function useApiData() {
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [prices, setPrices] = useState<PriceData[]>([])
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [statusData, pricesData, performanceData] = await Promise.all([
          apiClient.getBotStatus(),
          apiClient.getPrices(),
          apiClient.getPerformance(),
        ])

        setStatus(statusData)
        setPrices(pricesData)
        setPerformance(performanceData)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch API data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Refresh data every 5 seconds
    const interval = setInterval(fetchData, 5000)

    return () => clearInterval(interval)
  }, [])

  return { status, prices, performance, isLoading, error }
}
