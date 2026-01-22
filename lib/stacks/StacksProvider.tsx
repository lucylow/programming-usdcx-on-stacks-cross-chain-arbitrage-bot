"use client"
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { Connect } from "@stacks/connect-react"
import { userSession, APP_DETAILS, CONTRACTS } from "./config"
import { StacksTestnet, StacksMainnet } from "@stacks/network"

export interface WalletInfo {
  mainnetAddress: string
  testnetAddress: string
  username?: string
  stxBalance?: number
  usdcxBalance?: number
}

interface StacksContextType {
  isSignedIn: boolean
  walletInfo: WalletInfo | null
  network: "testnet" | "mainnet"
  networkInstance: StacksTestnet | StacksMainnet
  contracts: typeof CONTRACTS.testnet
  connect: () => void
  disconnect: () => void
  refreshBalances: () => Promise<void>
  isLoading: boolean
}

const StacksContext = createContext<StacksContextType | null>(null)

export function useStacks() {
  const context = useContext(StacksContext)
  if (!context) {
    throw new Error("useStacks must be used within a StacksProvider")
  }
  return context
}

interface StacksProviderProps {
  children: ReactNode
  network?: "testnet" | "mainnet"
}

export function StacksProvider({ children, network = "testnet" }: StacksProviderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const networkInstance = network === "mainnet" ? new StacksMainnet() : new StacksTestnet()
  const contracts = CONTRACTS[network]

  const loadUserData = useCallback(() => {
    if (!userSession.isUserSignedIn()) {
      setWalletInfo(null)
      setIsSignedIn(false)
      return
    }

    const data = userSession.loadUserData()
    const profile = data?.profile || {}

    setWalletInfo({
      mainnetAddress: profile?.stxAddress?.mainnet || "",
      testnetAddress: profile?.stxAddress?.testnet || "",
      username: profile?.name,
    })
    setIsSignedIn(true)
  }, [])

  const refreshBalances = useCallback(async () => {
    if (!walletInfo) return

    const address = network === "mainnet" ? walletInfo.mainnetAddress : walletInfo.testnetAddress
    if (!address) return

    try {
      // Fetch STX balance
      const stxResponse = await fetch(`${networkInstance.coreApiUrl}/extended/v1/address/${address}/stx`)
      const stxData = await stxResponse.json()
      const stxBalance = Number.parseInt(stxData.balance || "0") / 1_000_000

      // Fetch USDCx balance (read-only call)
      let usdcxBalance = 0
      try {
        const usdcxResponse = await fetch(
          `${networkInstance.coreApiUrl}/v2/contracts/call-read/${contracts.usdcxToken}/usdcx-token/get-balance`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: address,
              arguments: [`0x${Buffer.from(address).toString("hex")}`],
            }),
          },
        )
        const usdcxData = await usdcxResponse.json()
        if (usdcxData.okay && usdcxData.result) {
          usdcxBalance = Number.parseInt(usdcxData.result.value || "0", 16) / 1_000_000
        }
      } catch {
        // USDCx contract may not be deployed
      }

      setWalletInfo((prev) =>
        prev
          ? {
              ...prev,
              stxBalance,
              usdcxBalance,
            }
          : null,
      )
    } catch (error) {
      console.error("Error fetching balances:", error)
    }
  }, [walletInfo, network, networkInstance.coreApiUrl, contracts.usdcxToken])

  useEffect(() => {
    // Handle pending sign-in redirect from wallet
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => {
        loadUserData()
        setIsLoading(false)
      })
    } else {
      loadUserData()
      setIsLoading(false)
    }
  }, [loadUserData])

  useEffect(() => {
    if (isSignedIn && walletInfo) {
      refreshBalances()
    }
  }, [isSignedIn, walletInfo, refreshBalances])

  const disconnect = useCallback(() => {
    userSession.signUserOut(typeof window !== "undefined" ? window.location.origin : "/")
    setWalletInfo(null)
    setIsSignedIn(false)
  }, [])

  const authOptions = {
    appDetails: APP_DETAILS,
    userSession,
    onFinish: () => {
      loadUserData()
    },
    onCancel: () => {
      // User closed wallet modal
    },
  }

  const contextValue: StacksContextType = {
    isSignedIn,
    walletInfo,
    network,
    networkInstance,
    contracts,
    connect: () => {}, // Will be provided by Connect component
    disconnect,
    refreshBalances,
    isLoading,
  }

  return (
    <StacksContext.Provider value={contextValue}>
      <Connect authOptions={authOptions}>{children}</Connect>
    </StacksContext.Provider>
  )
}
