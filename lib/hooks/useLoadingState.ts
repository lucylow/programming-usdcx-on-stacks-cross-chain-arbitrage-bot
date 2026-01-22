import { useState, useCallback } from "react"

export interface LoadingState {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

/**
 * Hook for managing loading states
 */
export function useLoadingState(): LoadingState {
  const [isLoading, setIsLoading] = useState(false)

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true)
      try {
        return await fn()
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return {
    isLoading,
    setLoading,
    withLoading,
  }
}

