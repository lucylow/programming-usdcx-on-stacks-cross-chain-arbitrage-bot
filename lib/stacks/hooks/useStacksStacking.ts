"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useStacks } from "../StacksProvider"
import { useContractCall } from "./useContractCall"
import {
  fetchCallReadOnlyFunction,
  uintCV,
  tupleCV,
  bufferCV,
  cvToJSON,
  PostConditionMode,
  Pc,
} from "@stacks/transactions"
import { toast } from "sonner"

// PoX-4 Contract details
const POX_CONTRACT = {
  mainnet: {
    address: "SP000000000000000000002Q6VF78",
    name: "pox-4",
  },
  testnet: {
    address: "ST000000000000000000002AMW42H",
    name: "pox-4",
  },
}

// Stacking configuration
export const STACKING_CONFIG = {
  minStackingAmount: 100_000_000, // 100 STX minimum (in microSTX)
  cycleLength: 2100, // blocks per cycle
  rewardCycleLength: 2100,
  currentCycleRewards: 0.000012, // Example BTC per STX per cycle
}

export interface StackingPosition {
  amountMicroStx: number
  amountStx: number
  lockPeriodCycles: number
  firstCycle: number
  unlockHeight: number
  poxAddress: string
  status: "active" | "pending" | "unlocked"
  rewardsClaimed: number
  estimatedRewardsBtc: number
}

export interface StackingInfo {
  isStacking: boolean
  position: StackingPosition | null
  currentCycle: number
  nextCycleStartBlock: number
  minStackingThreshold: number
  rewardCycleLength: number
}

export interface PoolInfo {
  poolAddress: string
  poolName: string
  fee: number
  minDelegation: number
  totalStacked: number
  delegatorCount: number
}

interface UseStacksStackingReturn {
  // State
  stackingInfo: StackingInfo | null
  isLoading: boolean
  error: string | null
  
  // Actions
  stackStx: (amountStx: number, lockPeriodCycles: number, poxAddress: string) => Promise<string | null>
  stackExtend: (extendCycles: number) => Promise<string | null>
  stackIncrease: (increaseAmountStx: number) => Promise<string | null>
  delegateStx: (amountStx: number, delegateTo: string, untilBurnHeight?: number) => Promise<string | null>
  revokeDelegation: () => Promise<string | null>
  refreshStackingInfo: () => Promise<void>
  
  // Helpers
  calculateRewards: (amountStx: number, cycles: number) => number
  getMinimumStacking: () => number
  isAmountValid: (amountStx: number) => boolean
}

export function useStacksStacking(): UseStacksStackingReturn {
  const { isSignedIn, walletInfo, network, networkInfo } = useStacks()
  const { execute: executeContractCall, isLoading: isContractLoading } = useContractCall()
  
  const [stackingInfo, setStackingInfo] = useState<StackingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentAddress = useMemo(() => {
    if (!isSignedIn || !walletInfo) return null
    return network === "mainnet" ? walletInfo.mainnetAddress : walletInfo.testnetAddress
  }, [isSignedIn, walletInfo, network])

  const poxContract = POX_CONTRACT[network]

  // Fetch current stacking information
  const refreshStackingInfo = useCallback(async () => {
    if (!currentAddress) {
      setStackingInfo(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch stacker info
      const stackerInfoResult = await fetchCallReadOnlyFunction({
        contractAddress: poxContract.address,
        contractName: poxContract.name,
        functionName: "get-stacker-info",
        functionArgs: [tupleCV({ stacker: bufferCV(Buffer.from(currentAddress, "utf-8")) })],
        senderAddress: currentAddress,
        network: networkInfo.apiUrl.includes("mainnet") 
          ? "mainnet" as const 
          : "testnet" as const,
      }).catch(() => null)

      // Fetch PoX info for current cycle
      const poxInfoResult = await fetchCallReadOnlyFunction({
        contractAddress: poxContract.address,
        contractName: poxContract.name,
        functionName: "get-pox-info",
        functionArgs: [],
        senderAddress: currentAddress,
        network: networkInfo.apiUrl.includes("mainnet") 
          ? "mainnet" as const 
          : "testnet" as const,
      }).catch(() => null)

      let position: StackingPosition | null = null
      let currentCycle = 0
      let nextCycleStartBlock = 0
      let minStackingThreshold = STACKING_CONFIG.minStackingAmount

      if (poxInfoResult) {
        const poxInfo = cvToJSON(poxInfoResult)
        if (poxInfo?.value) {
          currentCycle = parseInt(poxInfo.value["reward-cycle-id"]?.value || "0", 10)
          nextCycleStartBlock = parseInt(poxInfo.value["next-cycle"]?.value?.["start-block-height"]?.value || "0", 10)
          minStackingThreshold = parseInt(poxInfo.value["min-amount-ustx"]?.value || String(STACKING_CONFIG.minStackingAmount), 10)
        }
      }

      if (stackerInfoResult) {
        const stackerInfo = cvToJSON(stackerInfoResult)
        if (stackerInfo?.value?.value) {
          const info = stackerInfo.value.value
          const amountMicroStx = parseInt(info["amount-ustx"]?.value || "0", 10)
          const firstCycle = parseInt(info["first-reward-cycle"]?.value || "0", 10)
          const lockPeriodCycles = parseInt(info["lock-period"]?.value || "0", 10)
          
          position = {
            amountMicroStx,
            amountStx: amountMicroStx / 1_000_000,
            lockPeriodCycles,
            firstCycle,
            unlockHeight: parseInt(info["unlock-height"]?.value || "0", 10),
            poxAddress: info["pox-addr"]?.value || "",
            status: amountMicroStx > 0 ? "active" : "unlocked",
            rewardsClaimed: 0,
            estimatedRewardsBtc: calculateRewards(amountMicroStx / 1_000_000, lockPeriodCycles),
          }
        }
      }

      setStackingInfo({
        isStacking: position !== null && position.status === "active",
        position,
        currentCycle,
        nextCycleStartBlock,
        minStackingThreshold,
        rewardCycleLength: STACKING_CONFIG.rewardCycleLength,
      })
    } catch (err) {
      console.error("Error fetching stacking info:", err)
      // Set default info on error
      setStackingInfo({
        isStacking: false,
        position: null,
        currentCycle: 0,
        nextCycleStartBlock: 0,
        minStackingThreshold: STACKING_CONFIG.minStackingAmount,
        rewardCycleLength: STACKING_CONFIG.rewardCycleLength,
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentAddress, poxContract, networkInfo.apiUrl])

  // Stack STX directly
  const stackStx = useCallback(
    async (amountStx: number, lockPeriodCycles: number, poxAddress: string): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      const amountMicroStx = Math.floor(amountStx * 1_000_000)
      
      if (amountMicroStx < STACKING_CONFIG.minStackingAmount) {
        setError(`Minimum stacking amount is ${STACKING_CONFIG.minStackingAmount / 1_000_000} STX`)
        return null
      }

      if (lockPeriodCycles < 1 || lockPeriodCycles > 12) {
        setError("Lock period must be between 1 and 12 cycles")
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        // Note: In production, you would need to generate a proper signer signature
        // This is a simplified version for demonstration
        const txId = await executeContractCall({
          contractAddress: poxContract.address,
          contractName: poxContract.name,
          functionName: "stack-stx",
          functionArgs: [
            uintCV(amountMicroStx),
            // pox-addr tuple would go here
            tupleCV({
              version: bufferCV(Buffer.from([0x00])),
              hashbytes: bufferCV(Buffer.from(poxAddress.replace(/^0x/, ""), "hex").slice(0, 20)),
            }),
            uintCV(0), // start-burn-ht
            uintCV(lockPeriodCycles),
            // signer-sig and signer-key would be required in production
          ],
          postConditionMode: PostConditionMode.Deny,
          postConditions: [
            Pc.principal(currentAddress).willSendEq(amountMicroStx).ustx(),
          ],
          onSuccess: () => {
            toast.success("Stacking initiated!", {
              description: `Locked ${amountStx} STX for ${lockPeriodCycles} cycles`,
            })
            refreshStackingInfo()
          },
          onError: (err) => {
            setError(err.message)
          },
        })

        return txId
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to stack STX"
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentAddress, poxContract, executeContractCall, refreshStackingInfo]
  )

  // Extend stacking
  const stackExtend = useCallback(
    async (extendCycles: number): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      if (extendCycles < 1 || extendCycles > 12) {
        setError("Extension must be between 1 and 12 cycles")
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const txId = await executeContractCall({
          contractAddress: poxContract.address,
          contractName: poxContract.name,
          functionName: "stack-extend",
          functionArgs: [
            uintCV(extendCycles),
            // pox-addr tuple
            tupleCV({
              version: bufferCV(Buffer.from([0x00])),
              hashbytes: bufferCV(Buffer.alloc(20)),
            }),
          ],
          postConditionMode: PostConditionMode.Deny,
          onSuccess: () => {
            toast.success("Stacking extended!", {
              description: `Extended by ${extendCycles} cycles`,
            })
            refreshStackingInfo()
          },
          onError: (err) => {
            setError(err.message)
          },
        })

        return txId
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to extend stacking"
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentAddress, poxContract, executeContractCall, refreshStackingInfo]
  )

  // Increase stacking amount
  const stackIncrease = useCallback(
    async (increaseAmountStx: number): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      const increaseMicroStx = Math.floor(increaseAmountStx * 1_000_000)

      setIsLoading(true)
      setError(null)

      try {
        const txId = await executeContractCall({
          contractAddress: poxContract.address,
          contractName: poxContract.name,
          functionName: "stack-increase",
          functionArgs: [uintCV(increaseMicroStx)],
          postConditionMode: PostConditionMode.Deny,
          postConditions: [
            Pc.principal(currentAddress).willSendEq(increaseMicroStx).ustx(),
          ],
          onSuccess: () => {
            toast.success("Stacking increased!", {
              description: `Added ${increaseAmountStx} STX to your position`,
            })
            refreshStackingInfo()
          },
          onError: (err) => {
            setError(err.message)
          },
        })

        return txId
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to increase stacking"
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentAddress, poxContract, executeContractCall, refreshStackingInfo]
  )

  // Delegate STX to a pool
  const delegateStx = useCallback(
    async (amountStx: number, delegateTo: string, untilBurnHeight?: number): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      const amountMicroStx = Math.floor(amountStx * 1_000_000)

      setIsLoading(true)
      setError(null)

      try {
        const txId = await executeContractCall({
          contractAddress: poxContract.address,
          contractName: poxContract.name,
          functionName: "delegate-stx",
          functionArgs: [
            uintCV(amountMicroStx),
            tupleCV({ stacker: bufferCV(Buffer.from(delegateTo, "utf-8")) }),
            untilBurnHeight ? uintCV(untilBurnHeight) : uintCV(0),
            // optional pox-addr
          ],
          postConditionMode: PostConditionMode.Deny,
          onSuccess: () => {
            toast.success("Delegation successful!", {
              description: `Delegated ${amountStx} STX to pool`,
            })
            refreshStackingInfo()
          },
          onError: (err) => {
            setError(err.message)
          },
        })

        return txId
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delegate STX"
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentAddress, poxContract, executeContractCall, refreshStackingInfo]
  )

  // Revoke delegation
  const revokeDelegation = useCallback(async (): Promise<string | null> => {
    if (!currentAddress) {
      setError("Wallet not connected")
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const txId = await executeContractCall({
        contractAddress: poxContract.address,
        contractName: poxContract.name,
        functionName: "revoke-delegate-stx",
        functionArgs: [],
        postConditionMode: PostConditionMode.Deny,
        onSuccess: () => {
          toast.success("Delegation revoked!")
          refreshStackingInfo()
        },
        onError: (err) => {
          setError(err.message)
        },
      })

      return txId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke delegation"
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentAddress, poxContract, executeContractCall, refreshStackingInfo])

  // Calculate estimated rewards
  const calculateRewards = useCallback((amountStx: number, cycles: number): number => {
    // Simplified reward calculation
    // In production, this would use actual PoX reward data
    return amountStx * cycles * STACKING_CONFIG.currentCycleRewards
  }, [])

  // Get minimum stacking amount
  const getMinimumStacking = useCallback((): number => {
    return (stackingInfo?.minStackingThreshold || STACKING_CONFIG.minStackingAmount) / 1_000_000
  }, [stackingInfo])

  // Validate stacking amount
  const isAmountValid = useCallback(
    (amountStx: number): boolean => {
      const minAmount = getMinimumStacking()
      return amountStx >= minAmount
    },
    [getMinimumStacking]
  )

  // Load stacking info on mount and when address changes
  useEffect(() => {
    if (isSignedIn && currentAddress) {
      refreshStackingInfo()
    }
  }, [isSignedIn, currentAddress, refreshStackingInfo])

  return {
    stackingInfo,
    isLoading: isLoading || isContractLoading,
    error,
    stackStx,
    stackExtend,
    stackIncrease,
    delegateStx,
    revokeDelegation,
    refreshStackingInfo,
    calculateRewards,
    getMinimumStacking,
    isAmountValid,
  }
}
