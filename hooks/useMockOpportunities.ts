"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchOpportunities, type OpportunityFilter, type ListResponse, subscribeToOpportunities } from "@/lib/mock/api"
import type { MockArbitrageOpportunity } from "@/lib/mock/types"

export function useMockOpportunities(initialFilter: OpportunityFilter = {}) {
  const [data, setData] = useState<MockArbitrageOpportunity[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<OpportunityFilter>(initialFilter)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)

  const load = useCallback(
    async (p = page, f: OpportunityFilter = filter) => {
      try {
        setLoading(true)
        setError(null)
        const res: ListResponse<MockArbitrageOpportunity> = await fetchOpportunities(p, pageSize, f)
        setData(res.data)
        setTotal(res.total)
        setPage(res.page)
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load opportunities"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize, filter],
  )

  useEffect(() => {
    void load(1, filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Real-time subscription
  useEffect(() => {
    if (!realTimeEnabled) return

    const unsubscribe = subscribeToOpportunities((newOpp) => {
      setData((prev) => [newOpp, ...prev].slice(0, pageSize))
      setTotal((prev) => prev + 1)
    }, 8000)

    return () => unsubscribe()
  }, [realTimeEnabled, pageSize])

  const updateFilter = (next: Partial<OpportunityFilter>) => {
    const merged = { ...filter, ...next }
    setFilter(merged)
    void load(1, merged)
  }

  const goToPage = (p: number) => {
    void load(p, filter)
  }

  return {
    data,
    page,
    pageSize,
    total,
    loading,
    error,
    filter,
    setFilter: updateFilter,
    goToPage,
    reload: () => load(page, filter),
    realTimeEnabled,
    setRealTimeEnabled,
  }
}
