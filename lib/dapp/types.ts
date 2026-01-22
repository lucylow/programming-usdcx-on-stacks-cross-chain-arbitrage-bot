// Unified types for the DApp

export type NetworkType = "mainnet" | "testnet"
export type ChainType = "ethereum" | "stacks"

// Wallet state
export interface WalletState {
  connected: boolean
  address: string | null
  network: NetworkType
  chain: ChainType
  stxBalance: number
  usdcxBalance: number
  ethBalance?: number
  usdcBalance?: number
}

// Bot status
export interface BotStatus {
  running: boolean
  activeTrades: number
  queueLength: number
  opportunitiesDetected: number
  tradesExecuted: number
  totalProfit: number
  winRate: number
  avgProfit: number
  uptime: number
}

// Price data
export interface PriceData {
  chain: ChainType
  dex: string
  pair: string
  price: number
  liquidity: number
  confidence: number
  change24h: number
  timestamp: number
}

// Arbitrage opportunity
export interface ArbitrageOpportunity {
  id: string
  sourceChain: ChainType
  targetChain: ChainType
  sourceDex: string
  targetDex: string
  tokenPair: string
  sourcePrice: number
  targetPrice: number
  spread: number
  expectedProfit: number
  confidence: number
  status: "active" | "executing" | "completed" | "expired" | "failed"
  tradeSize: number
  detectedAt: string
  expiresAt: string
}

// Trade execution result
export interface TradeResult {
  id: string
  opportunityId: string
  status: "pending" | "executing" | "success" | "failed"
  profit: number
  roi: number
  executionTime: number
  gasCost: number
  bridgeFee: number
  slippage: number
  txHashes: {
    source?: string
    bridge?: string
    target?: string
  }
  timestamp: number
  error?: string
}

// DAO proposal
export interface DaoProposal {
  id: number
  title: string
  description: string
  proposer: string
  status: "pending" | "active" | "passed" | "failed" | "executed"
  forVotes: number
  againstVotes: number
  startBlock: number
  endBlock: number
  createdAt: string
  executedAt?: string
}

// NFT badge
export interface NftBadge {
  tokenId: number
  owner: string
  badgeType: "early-adopter" | "whale" | "trader" | "governance"
  tradesCompleted: number
  profitEarned: number
  mintedAt: string
  metadata: {
    name: string
    description: string
    image: string
  }
}

// Performance metrics
export interface PerformanceMetrics {
  period: "hourly" | "daily" | "weekly" | "monthly"
  totalTrades: number
  profitableTrades: number
  totalVolume: number
  totalProfit: number
  avgProfitPerTrade: number
  maxProfit: number
  maxLoss: number
  sharpeRatio: number
  winRate: number
}

// Transaction
export interface Transaction {
  id: string
  type: "swap" | "bridge" | "approve" | "mint" | "vote"
  status: "pending" | "confirmed" | "failed"
  chain: ChainType
  hash: string
  from: string
  to: string
  amount: number
  token: string
  timestamp: number
  blockNumber?: number
  gasUsed?: number
}

// App state
export interface DappState {
  wallet: WalletState
  botStatus: BotStatus | null
  opportunities: ArbitrageOpportunity[]
  recentTrades: TradeResult[]
  prices: PriceData[]
  proposals: DaoProposal[]
  badges: NftBadge[]
  performance: PerformanceMetrics | null
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
}
