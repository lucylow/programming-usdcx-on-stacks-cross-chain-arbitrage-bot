"use client"
import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { isConnected, getLocalStorage, disconnect as stacksDisconnect } from "@stacks/connect"
import { STACKS_TESTNET, STACKS_MAINNET, StacksNetwork } from "@stacks/network"
import { principalCV } from "@stacks/transactions"
import { CONTRACTS, APP_DETAILS } from "./config"

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
  networkInstance: StacksNetwork
  networkInfo: NetworkInfo
  contracts: typeof CONTRACTS.testnet
  transactions: Transaction[]
  error: Error | null
  disconnect: () => void
  switchNetwork: (network: "testnet" | "mainnet") => void
  refreshBalances: () => Promise<void>
  addTransaction: (tx: Omit<Transaction, "timestamp">) => void
  updateTransaction: (txId: string, updates: Partial<Transaction>) => void
  getTransaction: (txId: string) => Transaction | undefined
  clearError: () => void
  isLoading: boolean
  isRefreshing: boolean
  onConnect: () => void
}

export const StacksContext = createContext<StacksContextType | null>(null)

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

  const networkInstance = network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET
  const contracts = CONTRACTS[network]
  const apiUrl = network === "mainnet" ? "https://api.stacks.co" : "https://api.testnet.hiro.so"

  const networkInfo: NetworkInfo = {
    name: network,
    chainId: network === "mainnet" ? 1 : 2147483648,
    apiUrl,
    explorerUrl: network === "mainnet" ? "https://explorer.stacks.co" : "https://explorer.hiro.so",
  }

  const loadUserData = useCallback(() => {
    try {
      // Use the new isConnected() and getLocalStorage() APIs
      const connected = isConnected()
      
      if (!connected) {
        setWalletInfo(null)
        setIsSignedIn(false)
        return
      }

      // Get addresses from localStorage (set by connect())
      const storage = getLocalStorage()
      
      // Handle both array format and object format for addresses
      let stxAddresses: Array<{ address: string; symbol?: string }> = []
      
      if (storage?.addresses) {
        if (Array.isArray(storage.addresses)) {
          stxAddresses = storage.addresses
        } else if (storage.addresses.stx && Array.isArray(storage.addresses.stx)) {
          stxAddresses = storage.addresses.stx
        }
      }
      
      // Find STX addresses
      const mainnetAddr = stxAddresses.find((a) => a.address && !a.address.startsWith('ST'))
      const testnetAddr = stxAddresses.find((a) => a.address && a.address.startsWith('ST'))
      
      // Fallback: try first available address
      const anyAddr = stxAddresses[0]
      
      setWalletInfo({
        mainnetAddress: mainnetAddr?.address || anyAddr?.address || "",
        testnetAddress: testnetAddr?.address || anyAddr?.address || "",
        username: undefined,
      })
      setIsSignedIn(true)
    } catch (err) {
      console.error("Error loading user data:", err)
      setWalletInfo(null)
      setIsSignedIn(false)
    }
  }, [])

  // Balance cache to prevent excessive API calls
  const balanceCacheRef = useRef<{
    stxBalance: number
    usdcxBalance: number
    timestamp: number
  } | null>(null)
  const BALANCE_CACHE_TTL = 10000 // 10 seconds

  const refreshBalances = useCallback(async () => {
    if (!walletInfo) return

    const address = network === "mainnet" ? walletInfo.mainnetAddress : walletInfo.testnetAddress
    if (!address) return

    // Use cached balance if still valid
    const now = Date.now()
    if (balanceCacheRef.current && (now - balanceCacheRef.current.timestamp) < BALANCE_CACHE_TTL) {
      setWalletInfo((prev) =>
        prev
          ? {
              ...prev,
              stxBalance: balanceCacheRef.current!.stxBalance,
              usdcxBalance: balanceCacheRef.current!.usdcxBalance,
            }
          : null,
      )
      return
    }

    setIsRefreshing(true)
    setError(null)

    try {
      // Fetch STX balance with timeout
      const stxController = new AbortController()
      const stxTimeout = setTimeout(() => stxController.abort(), 5000)
      
      const stxResponse = await fetch(`${apiUrl}/extended/v1/address/${address}/stx`, {
        signal: stxController.signal,
      })
      clearTimeout(stxTimeout)
      
      if (!stxResponse.ok) {
        throw new Error(`Failed to fetch STX balance: ${stxResponse.statusText}`)
      }
      const stxData = await stxResponse.json()
      const stxBalance = Number.parseInt(stxData.balance || "0") / 1_000_000

      // Fetch USDCx balance (read-only call) with timeout
      let usdcxBalance = 0
      try {
        const principalArg = principalCV(address)
        // Serialize using cvToJSON
        const { cvToJSON } = await import("@stacks/transactions")
        const json = cvToJSON(principalArg)
        const serializedArg = Buffer.from(JSON.stringify(json)).toString("hex")
        
        const usdcxController = new AbortController()
        const usdcxTimeout = setTimeout(() => usdcxController.abort(), 5000)
        
        const usdcxResponse = await fetch(
          `${apiUrl}/v2/contracts/call-read/${contracts.usdcxToken}/usdcx-token/get-balance`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: address,
              arguments: [`0x${serializedArg}`],
            }),
            signal: usdcxController.signal,
          },
        )
        clearTimeout(usdcxTimeout)
        
        if (usdcxResponse.ok) {
          const usdcxData = await usdcxResponse.json()
          if (usdcxData.okay && usdcxData.result) {
            usdcxBalance = Number.parseInt(usdcxData.result.value || "0", 16) / 1_000_000
          }
        }
      } catch (err) {
        // USDCx contract may not be deployed or address format issue
        console.warn("USDCx balance fetch failed:", err)
        // Use cached value if available
        if (balanceCacheRef.current) {
          usdcxBalance = balanceCacheRef.current.usdcxBalance
        }
      }

      // Update cache
      balanceCacheRef.current = {
        stxBalance,
        usdcxBalance,
        timestamp: now,
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
      
      // Use cached values on error if available
      if (balanceCacheRef.current) {
        setWalletInfo((prev) =>
          prev
            ? {
                ...prev,
                stxBalance: balanceCacheRef.current!.stxBalance,
                usdcxBalance: balanceCacheRef.current!.usdcxBalance,
              }
            : null,
        )
      } else {
        setError(err)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [walletInfo, network, apiUrl, contracts.usdcxToken])

  useEffect(() => {
    // Check if already connected on mount
    loadUserData()
    setIsLoading(false)
  }, [loadUserData])

  // Track if initial balance fetch has happened
  const hasInitialBalanceRef = useRef(false)

  useEffect(() => {
    // Only fetch balances once when first signed in, not on every walletInfo change
    if (isSignedIn && walletInfo && !hasInitialBalanceRef.current) {
      hasInitialBalanceRef.current = true
      refreshBalances()
    }
    // Reset when signed out
    if (!isSignedIn) {
      hasInitialBalanceRef.current = false
    }
  }, [isSignedIn, walletInfo, refreshBalances])

  const disconnect = useCallback(() => {
    stacksDisconnect()
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
    setTransactions((prev) => {
      // Avoid duplicates
      if (prev.some((t) => t.txId === newTx.txId)) {
        return prev
      }
      return [newTx, ...prev].slice(0, 100) // Keep last 100 transactions
    })
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

  // Callback for when wallet connects
  const onConnect = useCallback(() => {
    loadUserData()
  }, [loadUserData])

  // Auto-refresh transaction statuses with improved error handling
  useEffect(() => {
    if (transactions.length === 0) return

    const pendingTxs = transactions.filter((tx) => tx.status === "pending")
    if (pendingTxs.length === 0) return

    let isMounted = true
    const checkInterval = 5000 // 5 seconds
    let consecutiveErrors = 0
    const MAX_CONSECUTIVE_ERRORS = 5

    const checkTransactions = async () => {
      if (!isMounted) return

      for (const tx of pendingTxs) {
        if (!isMounted) break
        
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          const response = await fetch(`${apiUrl}/extended/v1/tx/${tx.txId}`, {
            signal: controller.signal,
          })
          clearTimeout(timeout)
          
          if (response.ok) {
            consecutiveErrors = 0 // Reset error counter on success
            const data = await response.json()
            const status = data.tx_status as Transaction["status"]
            if (status !== "pending") {
              updateTransaction(tx.txId, {
                status: status === "abort_by_response" || status === "abort_by_post_condition" ? "failed" : status,
                blockHeight: data.block_height,
                error: status === "failed" ? data.tx_result?.repr : undefined,
              })
              
              // Refresh balances after successful transaction
              if (status === "success" && walletInfo) {
                setTimeout(() => refreshBalances(), 2000) // Wait 2s for block confirmation
              }
            }
          } else {
            consecutiveErrors++
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              console.warn("Too many consecutive errors checking transactions, backing off")
              // Back off: increase interval
              return
            }
          }
        } catch (err) {
          consecutiveErrors++
          if (consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
            console.error(`Error checking transaction ${tx.txId}:`, err)
          }
        }
      }
    }

    // Initial check
    checkTransactions()

    // Set up interval
    const interval = setInterval(() => {
      if (isMounted && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
        checkTransactions()
      }
    }, checkInterval)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [transactions, apiUrl, updateTransaction, walletInfo, refreshBalances])

  const contextValue: StacksContextType = {
    isSignedIn,
    walletInfo,
    network,
    networkInstance,
    networkInfo,
    contracts,
    transactions,
    error,
    disconnect,
    switchNetwork,
    refreshBalances,
    addTransaction,
    updateTransaction,
    getTransaction,
    clearError,
    isLoading,
    isRefreshing,
    onConnect,
  }

  return (
    <StacksContext.Provider value={contextValue}>
      {children}
    </StacksContext.Provider>
  )
}