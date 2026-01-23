import { useEffect, useState, useCallback } from "react"
import { useStacks } from "../StacksProvider"
import type { Transaction } from "../StacksProvider"

export function useStacksTransactions() {
  const { transactions, addTransaction, updateTransaction, getTransaction, networkInfo } = useStacks()
  const [isPolling, setIsPolling] = useState(false)

  const pollTransactionStatus = useCallback(
    async (txId: string) => {
      try {
        const response = await fetch(`${networkInfo.apiUrl}/extended/v1/tx/${txId}`)
        if (!response.ok) return

        const data = await response.json()
        const status = data.tx_status as Transaction["status"]

        if (status !== "pending") {
          updateTransaction(txId, {
            status: status === "abort_by_response" || status === "abort_by_post_condition" ? "failed" : status,
            blockHeight: data.block_height,
            error: status === "failed" ? data.tx_result?.repr : undefined,
          })
          return true // Transaction finalized
        }
        return false // Still pending
      } catch (error) {
        console.error(`Error polling transaction ${txId}:`, error)
        return false
      }
    },
    [networkInfo.apiUrl, updateTransaction],
  )

  const startPolling = useCallback(
    (txId: string, intervalMs = 5000) => {
      setIsPolling(true)
      const interval = setInterval(async () => {
        const finalized = await pollTransactionStatus(txId)
        if (finalized) {
          clearInterval(interval)
          setIsPolling(false)
        }
      }, intervalMs)

      return () => {
        clearInterval(interval)
        setIsPolling(false)
      }
    },
    [pollTransactionStatus],
  )

  const pendingTransactions = transactions.filter((tx) => tx.status === "pending")
  const successfulTransactions = transactions.filter((tx) => tx.status === "success")
  const failedTransactions = transactions.filter((tx) => tx.status === "failed")

  return {
    transactions,
    pendingTransactions,
    successfulTransactions,
    failedTransactions,
    addTransaction,
    updateTransaction,
    getTransaction,
    pollTransactionStatus,
    startPolling,
    isPolling,
  }
}


