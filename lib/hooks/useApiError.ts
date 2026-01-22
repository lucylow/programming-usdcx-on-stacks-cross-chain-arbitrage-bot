import { useState, useCallback } from "react"

export interface ApiErrorState {
  error: Error | null
  code?: string
  retryable?: boolean
  clearError: () => void
}

/**
 * Hook for handling API errors with retry capability
 */
export function useApiError(): ApiErrorState & {
  setError: (error: Error) => void
  handleError: (error: unknown) => void
} {
  const [error, setErrorState] = useState<Error | null>(null)
  const [code, setCode] = useState<string | undefined>()
  const [retryable, setRetryable] = useState<boolean | undefined>()

  const setError = useCallback((err: Error) => {
    setErrorState(err)
    setCode((err as Error & { code?: string }).code)
    setRetryable((err as Error & { retryable?: boolean }).retryable)
  }, [])

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err)
    } else {
      setError(new Error(String(err)))
    }
  }, [setError])

  const clearError = useCallback(() => {
    setErrorState(null)
    setCode(undefined)
    setRetryable(undefined)
  }, [])

  return {
    error,
    code,
    retryable,
    setError,
    handleError,
    clearError,
  }
}


