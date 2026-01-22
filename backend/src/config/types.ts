export interface NetworkConfig {
  rpcUrl: string
  privateKey: string
  networkId?: number
  network?: "mainnet" | "testnet"
  walletAddress: string
  gasStationUrl?: string
  maxGasPriceGwei?: number
  apiKey?: string
}

export interface DexEntry {
  name: string
  routerAddress: string
  factoryAddress?: string
  feeTiers?: number[]
  enabled: boolean
}

export interface DexConfig {
  ethereum: DexEntry[]
  stacks: DexEntry[]
}

export interface BridgeConfig {
  circleApiKey: string
  xReserveContract: string
  attestationServiceUrl: string
  maxBridgeQueueTime: number
  bridgeFeePercentage: number
}

export interface RiskConfig {
  maxPositionSize: number
  minProfitThreshold: number
  maxSlippage: number
  dailyLossLimit: number
  maxConcurrentTrades: number
  circuitBreakerThreshold: number
  stopLossPercentage: number
  maxDrawdown: number
}

export interface DatabaseConfig {
  host: string
  port: number
  name: string
  user: string
  password: string
  poolSize: number
}

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db?: number
}

export interface MonitoringConfig {
  port: number
  healthCheckPort: number
  sentryDsn?: string
  logLevel: string
}

export interface ApiConfig {
  port: number
  jwtSecret: string
  corsOrigin: string
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
}

export interface BotConfig {
  mode: "development" | "production" | "demo"
  ethereum: NetworkConfig
  stacks: NetworkConfig
  bridge: BridgeConfig
  dex: DexConfig
  risk: RiskConfig
  database: DatabaseConfig
  redis: RedisConfig
  monitoring: MonitoringConfig
  api: ApiConfig
}

export interface PriceData {
  chain: "ethereum" | "stacks"
  dex: string
  pair: string
  price: number
  liquidity: number
  timestamp: number
  confidence: number
  source: string
}

export interface ArbitrageOpportunity {
  id: string
  ethDex: string
  stacksDex: string
  ethPair: string
  stacksPair: string
  direction: "eth_to_stacks" | "stacks_to_eth"
  expectedProfit: number
  confidence: number
  tradeSize: number
  requiredSteps: TradeStep[]
  timestamp: number
  status: "pending" | "validated" | "executing" | "completed" | "failed"
}

export interface TradeStep {
  chain: "ethereum" | "stacks"
  dex: string
  action: "swap" | "bridge" | "approve"
  tokenIn: string
  tokenOut: string
  amount: number
  expectedOutput: number
  gasEstimate: number
  contractAddress?: string
  transactionHash?: string
}

export interface BridgeOperation {
  id: string
  type: "deposit" | "withdrawal"
  status: "pending" | "processing" | "completed" | "failed"
  amount: number
  sourceChain: string
  destinationChain: string
  sourceAddress: string
  destinationAddress: string
  transactionHash?: string
  bridgeTxId?: string
  estimatedCompletion?: number
  actualCompletion?: number
  createdAt: number
  updatedAt: number
}

export interface TradeResult {
  id: string
  opportunityId: string
  status: "success" | "partial" | "failed"
  profit: number
  roi: number
  executionTime: number
  gasCostEth: number
  gasCostStacks: number
  bridgeFee: number
  slippage: number
  steps: TradeStepResult[]
  timestamp: number
}

export interface TradeStepResult {
  step: number
  action: string
  status: "success" | "failed"
  transactionHash?: string
  gasUsed?: number
  error?: string
}

export interface RiskAssessment {
  approved: boolean
  reason?: string
  maxAmount?: number
  suggestedSlippage?: number
  confidenceScore: number
  warnings: string[]
}
