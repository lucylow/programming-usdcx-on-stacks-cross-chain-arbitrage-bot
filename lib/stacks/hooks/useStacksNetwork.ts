import { useCallback } from "react"
import { useStacks } from "../StacksProvider"

export function useStacksNetwork() {
  const { network, networkInfo, switchNetwork, networkInstance } = useStacks()

  const switchToMainnet = useCallback(() => {
    switchNetwork("mainnet")
  }, [switchNetwork])

  const switchToTestnet = useCallback(() => {
    switchNetwork("testnet")
  }, [switchNetwork])

  const isMainnet = network === "mainnet"
  const isTestnet = network === "testnet"

  return {
    network,
    networkInfo,
    networkInstance,
    isMainnet,
    isTestnet,
    switchNetwork,
    switchToMainnet,
    switchToTestnet,
  }
}

