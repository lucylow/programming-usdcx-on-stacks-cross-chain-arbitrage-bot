"use client"

import { useState, useCallback } from "react"
import { openContractCall, ContractCallOptions } from "@stacks/connect"
import { AnchorMode, PostConditionMode, ClarityValue } from "@stacks/transactions"
import { useStacks } from "../StacksProvider"
import { toast } from "sonner"

export interface ContractCallParams {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
  postConditions?: any[]
  postConditionMode?: PostConditionMode
  onSuccess?: (txId: string) => void
  onError?: (error: Error) => void
}

export interface ContractCallResult {
  txId: string | null
  status: "idle" | "pending" | "success" | "failed"
  error: Error | null
}

export function useContractCall() {
  const { networkInstance, network, addTransaction, isSignedIn } = useStacks()
  const [result, setResult] = useState<ContractCallResult>({
    txId: null,
    status: "idle",
    error: null,
  })
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(
    async (params: ContractCallParams): Promise<string | null> => {
      if (!isSignedIn) {
        const error = new Error("Wallet not connected")
        setResult({ txId: null, status: "failed", error })
        toast.error("Please connect your wallet first")
        params.onError?.(error)
        return null
      }

      setIsLoading(true)
      setResult({ txId: null, status: "pending", error: null })

      try {
        const options: ContractCallOptions = {
          network: networkInstance,
          anchorMode: AnchorMode.Any,
          contractAddress: params.contractAddress,
          contractName: params.contractName,
          functionName: params.functionName,
          functionArgs: params.functionArgs,
          postConditionMode: params.postConditionMode ?? PostConditionMode.Deny,
          postConditions: params.postConditions ?? [],
          onFinish: (data) => {
            const txId = data.txId
            setResult({ txId, status: "success", error: null })
            setIsLoading(false)

            // Add to transaction tracking
            addTransaction({
              txId,
              status: "pending",
              type: `${params.contractName}::${params.functionName}`,
            })

            toast.success("Transaction submitted!", {
              description: `TX: ${txId.slice(0, 8)}...${txId.slice(-8)}`,
              action: {
                label: "View",
                onClick: () => {
                  window.open(
                    `https://explorer.hiro.so/txid/${txId}?chain=${network}`,
                    "_blank"
                  )
                },
              },
            })

            params.onSuccess?.(txId)
          },
          onCancel: () => {
            setResult({ txId: null, status: "idle", error: null })
            setIsLoading(false)
            toast.info("Transaction cancelled")
          },
        }

        await openContractCall(options)
        return result.txId
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setResult({ txId: null, status: "failed", error })
        setIsLoading(false)
        toast.error("Transaction failed", { description: error.message })
        params.onError?.(error)
        return null
      }
    },
    [networkInstance, network, addTransaction, isSignedIn, result.txId]
  )

  const reset = useCallback(() => {
    setResult({ txId: null, status: "idle", error: null })
    setIsLoading(false)
  }, [])

  return {
    execute,
    reset,
    isLoading,
    ...result,
  }
}
