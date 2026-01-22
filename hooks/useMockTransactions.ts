"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchTransactions, type TxFilter, type ListResponse } from "@/lib/mock/api"
import type { MockTransaction } from "@/lib/mock/types"

export function useMockTransactions(initialFilter: TxFilter = {}) {
  const [data, setData] = useState<MockTransaction[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<TxFilter>(initialFilter)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (p = page, f: TxFilter = filter) => {
      try {
        setLoading(true)
        setError(null)
        const res: ListResponse<MockTransaction> = await fetchTransactions(p, pageSize, f)
        setData(res.data)
        setTotal(res.total)
        setPage(res.page)
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load transactions"
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

  const updateFilter = (next: Partial<TxFilter>) => {
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
  }
}
