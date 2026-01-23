"use client"

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react"
import { useStacks } from "@lib/stacks/StacksProvider"
import { dappApi } from "./api"
import type {
  DappState,
  BotStatus,
  PriceData,
  ArbitrageOpportunity,
  TradeResult,
  PerformanceMetrics,
  DaoProposal,
  NftBadge,
  Transaction,
} from "./types"

// Actions
type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_BOT_STATUS"; payload: BotStatus }
  | { type: "SET_PRICES"; payload: PriceData[] }
  | { type: "SET_OPPORTUNITIES"; payload: ArbitrageOpportunity[] }
  | { type: "ADD_OPPORTUNITY"; payload: ArbitrageOpportunity }
  | { type: "SET_TRADES"; payload: TradeResult[] }
  | { type: "ADD_TRADE"; payload: TradeResult }
  | { type: "SET_PERFORMANCE"; payload: PerformanceMetrics }
  | { type: "SET_PROPOSALS"; payload: DaoProposal[] }
  | { type: "SET_BADGES"; payload: NftBadge[] }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "UPDATE_WALLET"; payload: Partial<DappState["wallet"]> }

// Initial state
const initialState: DappState = {
  wallet: {
    connected: false,
    address: null,
    network: "testnet",
    chain: "stacks",
    stxBalance: 0,
    usdcxBalance: 0,
  },
  botStatus: null,
  opportunities: [],
  recentTrades: [],
  prices: [],
  proposals: [],
  badges: [],
  performance: null,
  transactions: [],
  isLoading: true,
  error: null,
}

// Reducer
function dappReducer(state: DappState, action: Action): DappState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_BOT_STATUS":
      return { ...state, botStatus: action.payload }
    case "SET_PRICES":
      return { ...state, prices: action.payload }
    case "SET_OPPORTUNITIES":
      return { ...state, opportunities: action.payload }
    case "ADD_OPPORTUNITY":
      return {
        ...state,
        opportunities: [action.payload, ...state.opportunities.filter((o) => o.id !== action.payload.id)].slice(0, 20),
      }
    case "SET_TRADES":
      return { ...state, recentTrades: action.payload }
    case "ADD_TRADE":
      return {
        ...state,
        recentTrades: [action.payload, ...state.recentTrades].slice(0, 50),
      }
    case "SET_PERFORMANCE":
      return { ...state, performance: action.payload }
    case "SET_PROPOSALS":
      return { ...state, proposals: action.payload }
    case "SET_BADGES":
      return { ...state, badges: action.payload }
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload }
    case "UPDATE_WALLET":
      return { ...state, wallet: { ...state.wallet, ...action.payload } }
    default:
      return state
  }
}

// Context
interface DappContextType extends DappState {
  // Actions
  refreshBotStatus: () => Promise<void>
  refreshPrices: () => Promise<void>
  refreshOpportunities: () => Promise<void>
  refreshTrades: () => Promise<void>
  refreshPerformance: () => Promise<void>
  refreshAll: () => Promise<void>
  startBot: () => Promise<boolean>
  stopBot: () => Promise<boolean>
  executeOpportunity: (id: string) => Promise<boolean>
}

const DappContext = createContext<DappContextType | null>(null)

export function useDapp() {
  const context = useContext(DappContext)
  if (!context) {
    throw new Error("useDapp must be used within a DappProvider")
  }
  return context
}

interface DappProviderProps {
  children: ReactNode
}

export function DappProvider({ children }: DappProviderProps) {
  const [state, dispatch] = useReducer(dappReducer, initialState)
  const { isSignedIn, walletInfo, network } = useStacks()

  // Update wallet state from Stacks provider
  useEffect(() => {
    dispatch({
      type: "UPDATE_WALLET",
      payload: {
        connected: isSignedIn,
        address: network === "mainnet" ? walletInfo?.mainnetAddress || null : walletInfo?.testnetAddress || null,
        network,
        stxBalance: walletInfo?.stxBalance || 0,
        usdcxBalance: walletInfo?.usdcxBalance || 0,
      },
    })
  }, [isSignedIn, walletInfo, network])

  // Refresh functions
  const refreshBotStatus = useCallback(async () => {
    try {
      const status = await dappApi.getBotStatus()
      dispatch({ type: "SET_BOT_STATUS", payload: status })
    } catch (error) {
      console.error("Error fetching bot status:", error)
    }
  }, [])

  const refreshPrices = useCallback(async () => {
    try {
      const prices = await dappApi.getPrices()
      dispatch({ type: "SET_PRICES", payload: prices })
    } catch (error) {
      console.error("Error fetching prices:", error)
    }
  }, [])

  const refreshOpportunities = useCallback(async () => {
    try {
      const opportunities = await dappApi.getOpportunities()
      dispatch({ type: "SET_OPPORTUNITIES", payload: opportunities })
    } catch (error) {
      console.error("Error fetching opportunities:", error)
    }
  }, [])

  const refreshTrades = useCallback(async () => {
    try {
      const trades = await dappApi.getTrades()
      dispatch({ type: "SET_TRADES", payload: trades })
    } catch (error) {
      console.error("Error fetching trades:", error)
    }
  }, [])

  const refreshPerformance = useCallback(async () => {
    try {
      const performance = await dappApi.getPerformance()
      dispatch({ type: "SET_PERFORMANCE", payload: performance })
    } catch (error) {
      console.error("Error fetching performance:", error)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      await Promise.all([
        refreshBotStatus(),
        refreshPrices(),
        refreshOpportunities(),
        refreshTrades(),
        refreshPerformance(),
      ])

      // Fetch user-specific data if connected
      if (state.wallet.connected && state.wallet.address) {
        const [proposals, badges] = await Promise.all([
          dappApi.getProposals(),
          dappApi.getUserBadges(state.wallet.address),
        ])
        dispatch({ type: "SET_PROPOSALS", payload: proposals })
        dispatch({ type: "SET_BADGES", payload: badges })
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load data" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [
    refreshBotStatus,
    refreshPrices,
    refreshOpportunities,
    refreshTrades,
    refreshPerformance,
    state.wallet.connected,
    state.wallet.address,
  ])

  // Bot control
  const startBot = useCallback(async (): Promise<boolean> => {
    try {
      const result = await dappApi.startBot()
      if (result.success) {
        await refreshBotStatus()
      }
      return result.success
    } catch (error) {
      console.error("Error starting bot:", error)
      return false
    }
  }, [refreshBotStatus])

  const stopBot = useCallback(async (): Promise<boolean> => {
    try {
      const result = await dappApi.stopBot()
      if (result.success) {
        await refreshBotStatus()
      }
      return result.success
    } catch (error) {
      console.error("Error stopping bot:", error)
      return false
    }
  }, [refreshBotStatus])

  const executeOpportunity = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await dappApi.executeOpportunity(id)
        if (result.success) {
          await refreshTrades()
          await refreshOpportunities()
        }
        return result.success
      } catch (error) {
        console.error("Error executing opportunity:", error)
        return false
      }
    },
    [refreshTrades, refreshOpportunities],
  )

  // Initial data load
  useEffect(() => {
    refreshAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubPrices = dappApi.subscribeToPrices((prices) => {
      dispatch({ type: "SET_PRICES", payload: prices })
    }, 3000)

    const unsubOpportunities = dappApi.subscribeToOpportunities((opp) => {
      dispatch({ type: "ADD_OPPORTUNITY", payload: opp })
    }, 5000)

    const unsubStatus = dappApi.subscribeToBotStatus((status) => {
      dispatch({ type: "SET_BOT_STATUS", payload: status })
    }, 5000)

    return () => {
      unsubPrices()
      unsubOpportunities()
      unsubStatus()
    }
  }, [])

  const contextValue: DappContextType = {
    ...state,
    refreshBotStatus,
    refreshPrices,
    refreshOpportunities,
    refreshTrades,
    refreshPerformance,
    refreshAll,
    startBot,
    stopBot,
    executeOpportunity,
  }

  return <DappContext.Provider value={contextValue}>{children}</DappContext.Provider>
}
