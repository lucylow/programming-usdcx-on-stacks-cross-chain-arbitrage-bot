"use client"
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { Connect } from "@stacks/connect-react"
import { userSession, APP_DETAILS, CONTRACTS } from "./config"
import { StacksTestnet, StacksMainnet } from "@stacks/network"
import { principalCV } from "@stacks/transactions"

export interface WalletInfo {
  mainnetAddress: string
  testnetAddress: string
  username?: string
  stxBalance?: number
  usdcxBalance?: number
}

export interface Transaction {
  txId: string
  status: "pending" | "success" | "failed" | "abort_by_response" | "abort_by_post_condition"
  type?: string
  timestamp: number
  blockHeight?: number
  error?: string
}

export interface NetworkInfo {
  name: "testnet" | "mainnet"
  chainId: number
  apiUrl: string
  explorerUrl: string
}

interface StacksContextType {
  isSignedIn: boolean
  walletInfo: WalletInfo | null
  network: "testnet" | "mainnet"
  networkInstance: StacksTestnet | StacksMainnet
  networkInfo: NetworkInfo
  contracts: typeof CONTRACTS.testnet
  transactions: Transaction[]
  error: Error | null
  connect: () => void
  disconnect: () => void
  switchNetwork: (network: "testnet" | "mainnet") => void
  refreshBalances: () => Promise<void>
  addTransaction: (tx: Omit<Transaction, "timestamp">) => void
  updateTransaction: (txId: string, updates: Partial<Transaction>) => void
  getTransaction: (txId: string) => Transaction | undefined
  clearError: () => void
  isLoading: boolean
  isRefreshing: boolean
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

export function StacksProvider({ children, network: initialNetwork = "testnet" }: StacksProviderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [network, setNetwork] = useState<"testnet" | "mainnet">(initialNetwork)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<Error | null>(null)

  const networkInstance = network === "mainnet" ? new StacksMainnet() : new StacksTestnet()
  const contracts = CONTRACTS[network]

  const networkInfo: NetworkInfo = {
    name: network,
    chainId: network === "mainnet" ? 1 : 2147483648,
    apiUrl: networkInstance.coreApiUrl,
    explorerUrl: network === "mainnet" ? "https://explorer.stacks.co" : "https://explorer.hiro.so",
  }

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

    setIsRefreshing(true)
    setError(null)

    try {
      // Fetch STX balance
      const stxResponse = await fetch(`${networkInstance.coreApiUrl}/extended/v1/address/${address}/stx`)
      if (!stxResponse.ok) {
        throw new Error(`Failed to fetch STX balance: ${stxResponse.statusText}`)
      }
      const stxData = await stxResponse.json()
      const stxBalance = Number.parseInt(stxData.balance || "0") / 1_000_000

      // Fetch USDCx balance (read-only call)
      let usdcxBalance = 0
      try {
        const principalArg = principalCV(address)
        const serializedArg = principalArg.serialize().toString("hex")
        const usdcxResponse = await fetch(
          `${networkInstance.coreApiUrl}/v2/contracts/call-read/${contracts.usdcxToken}/usdcx-token/get-balance`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: address,
              arguments: [`0x${serializedArg}`],
            }),
          },
        )
        if (usdcxResponse.ok) {
          const usdcxData = await usdcxResponse.json()
          if (usdcxData.okay && usdcxData.result) {
            usdcxBalance = Number.parseInt(usdcxData.result.value || "0", 16) / 1_000_000
          }
        }
      } catch (err) {
        // USDCx contract may not be deployed or address format issue
        console.warn("USDCx balance fetch failed:", err)
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
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("Error fetching balances:", err)
      setError(err)
    } finally {
      setIsRefreshing(false)
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
    setTransactions([])
    setError(null)
  }, [])

  const switchNetwork = useCallback((newNetwork: "testnet" | "mainnet") => {
    setNetwork(newNetwork)
    setError(null)
    // Refresh balances after network switch
    if (walletInfo) {
      setTimeout(() => refreshBalances(), 100)
    }
  }, [walletInfo, refreshBalances])

  const addTransaction = useCallback((tx: Omit<Transaction, "timestamp">) => {
    const newTx: Transaction = {
      ...tx,
      timestamp: Date.now(),
    }
    setTransactions((prev) => [newTx, ...prev].slice(0, 100)) // Keep last 100 transactions
  }, [])

  const updateTransaction = useCallback((txId: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.txId === txId ? { ...tx, ...updates } : tx)),
    )
  }, [])

  const getTransaction = useCallback(
    (txId: string) => {
      return transactions.find((tx) => tx.txId === txId)
    },
    [transactions],
  )

  const clearError = useCallback(() => {
    setError(null)
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

  // Auto-refresh transaction statuses
  useEffect(() => {
    if (transactions.length === 0) return

    const pendingTxs = transactions.filter((tx) => tx.status === "pending")
    if (pendingTxs.length === 0) return

    const interval = setInterval(async () => {
      for (const tx of pendingTxs) {
        try {
          const response = await fetch(`${networkInstance.coreApiUrl}/extended/v1/tx/${tx.txId}`)
          if (response.ok) {
            const data = await response.json()
            const status = data.tx_status as Transaction["status"]
            if (status !== "pending") {
              updateTransaction(tx.txId, {
                status: status === "abort_by_response" || status === "abort_by_post_condition" ? "failed" : status,
                blockHeight: data.block_height,
                blockHash: data.block_hash,
                error: status === "failed" ? data.tx_result?.repr : undefined,
              })
            }
          }
        } catch (err) {
          console.error(`Error checking transaction ${tx.txId}:`, err)
        }
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [transactions, networkInstance.coreApiUrl, updateTransaction])

  const contextValue: StacksContextType = {
    isSignedIn,
    walletInfo,
    network,
    networkInstance,
    networkInfo,
    contracts,
    transactions,
    error,
    connect: () => {}, // Will be provided by Connect component
    disconnect,
    switchNetwork,
    refreshBalances,
    addTransaction,
    updateTransaction,
    getTransaction,
    clearError,
    isLoading,
    isRefreshing,
  }

  return (
    <StacksContext.Provider value={contextValue}>
      <Connect authOptions={authOptions}>{children}</Connect>
    </StacksContext.Provider>
  )
}
