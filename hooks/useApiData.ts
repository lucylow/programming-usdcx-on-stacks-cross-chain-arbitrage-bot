"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/constants"

interface UseApiDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useApiData<T>(endpoint: string, options: UseApiDataOptions = {}) {
  const { autoRefresh = false, refreshInterval = 5000 } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [endpoint, autoRefresh, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

export function useBotStatus() {
  return useApiData<{
    running: boolean
    activeTrades: number
    queueLength: number
    totalProfit: number
  }>("/api/status", { autoRefresh: true })
}

export function usePrices() {
  return useApiData<
    Array<{
      chain: string
      dex: string
      price: number
      liquidity: number
      timestamp: number
    }>
  >("/api/prices", { autoRefresh: true, refreshInterval: 2000 })
}

export function useOpportunities() {
  return useApiData<
    Array<{
      id: string
      direction: string
      spread: number
      expectedProfit: number
      timestamp: number
    }>
  >("/api/opportunities", { autoRefresh: true, refreshInterval: 3000 })
}

export function useTrades() {
  return useApiData<
    Array<{
      id: string
      profit: number
      status: string
      timestamp: number
    }>
  >("/api/trades")
}
