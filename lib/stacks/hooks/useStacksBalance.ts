import { useEffect, useState, useCallback } from "react"
import { useStacks } from "../StacksProvider"

export function useStacksBalance() {
  const { walletInfo, network, refreshBalances, isRefreshing } = useStacks()
  const [isLoading, setIsLoading] = useState(false)

  const currentAddress = network === "mainnet" ? walletInfo?.mainnetAddress : walletInfo?.testnetAddress
  const stxBalance = walletInfo?.stxBalance || 0
  const usdcxBalance = walletInfo?.usdcxBalance || 0

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await refreshBalances()
    } finally {
      setIsLoading(false)
    }
  }, [refreshBalances])

  return {
    address: currentAddress || null,
    stxBalance,
    usdcxBalance,
    isLoading: isLoading || isRefreshing,
    refresh,
    hasBalance: stxBalance > 0 || usdcxBalance > 0,
  }
}


