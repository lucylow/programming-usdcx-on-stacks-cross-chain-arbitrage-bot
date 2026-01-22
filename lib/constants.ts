/**
 * Application constants and configuration
 */

export const APP_NAME = "ArbitrageBot"
export const APP_DESCRIPTION = "AI-Powered Cross-Chain Arbitrage Bot"

// API Configuration
// Support both VITE_ (Vite) and NEXT_PUBLIC_ (Next.js) prefixes for compatibility
export const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

// Network Configuration
export const NETWORKS = {
  ethereum: {
    id: 1,
    name: "Ethereum",
    rpcUrl: (import.meta.env.VITE_ETH_RPC_URL || import.meta.env.NEXT_PUBLIC_ETH_RPC_URL || "https://eth.llamarpc.com"),
    explorerUrl: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  stacks: {
    id: "mainnet",
    name: "Stacks",
    rpcUrl: (import.meta.env.VITE_STACKS_RPC_URL || import.meta.env.NEXT_PUBLIC_STACKS_RPC_URL || "https://stacks-node-api.mainnet.stacks.co"),
    explorerUrl: "https://explorer.stacks.co",
    nativeCurrency: {
      name: "Stacks",
      symbol: "STX",
      decimals: 6,
    },
  },
} as const

// DEX Configuration
export const DEX_LIST = {
  ethereum: [
    { id: "uniswap_v3", name: "Uniswap V3", icon: "🦄" },
    { id: "curve", name: "Curve", icon: "🌊" },
    { id: "balancer", name: "Balancer", icon: "⚖️" },
  ],
  stacks: [
    { id: "alex", name: "ALEX", icon: "🅰️" },
    { id: "arkadiko", name: "Arkadiko", icon: "🏛️" },
    { id: "lydian", name: "Lydian", icon: "🎵" },
  ],
} as const

// Trading Configuration
export const TRADING_CONSTANTS = {
  minSpread: 0.005, // 0.5%
  maxSlippage: 0.01, // 1%
  maxGasPriceGwei: 100,
  bridgeFeePercentage: 0.001, // 0.1%
} as const

// UI Configuration
export const UI_CONSTANTS = {
  updateInterval: 2000, // 2 seconds
  chartDataPoints: 50,
  maxLogEntries: 100,
  toastDuration: 3000,
} as const

// Status Colors
export const STATUS_COLORS = {
  success: "text-success",
  error: "text-error",
  warning: "text-warning",
  info: "text-accent",
  pending: "text-muted-foreground",
} as const

// Feature Flags
export const FEATURES = {
  walletConnect: true,
  liveTrading: false, // Disable for demo
  notifications: true,
  advancedAnalytics: true,
  multiChain: true,
} as const
