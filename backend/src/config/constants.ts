// Network IDs
export const ETHEREUM_MAINNET_ID = 1
export const ETHEREUM_SEPOLIA_ID = 11155111
export const STACKS_MAINNET = "mainnet"
export const STACKS_TESTNET = "testnet"

// Token addresses (Ethereum Mainnet)
export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
export const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
export const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

// DEX Router addresses (Ethereum Mainnet)
export const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
export const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
export const CURVE_ROUTER = "0x99a58482BD75cbab83b27EC03CA68fF489b5788f"

// Stacks DEX addresses (Mainnet)
export const ALEX_ROUTER = "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9"
export const ARKADIKO_ROUTER = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"

// Trading parameters
export const MIN_TRADE_SIZE = 1000 // $1,000
export const MAX_TRADE_SIZE = 100000 // $100,000
export const DEFAULT_TRADE_SIZE = 10000 // $10,000

// Time constants
export const PRICE_UPDATE_INTERVAL = 2000 // 2 seconds
export const OPPORTUNITY_SCAN_INTERVAL = 1000 // 1 second
export const BRIDGE_TIMEOUT = 1800000 // 30 minutes
export const TRADE_TIMEOUT = 300000 // 5 minutes

// Fee estimates
export const ETHEREUM_GAS_ESTIMATE = 200000
export const STACKS_GAS_ESTIMATE = 50000
export const BRIDGE_FEE_PERCENTAGE = 0.001 // 0.1%
export const DEX_FEE_PERCENTAGE = 0.003 // 0.3%

// Risk limits
export const MAX_SLIPPAGE = 0.01 // 1%
export const MIN_PROFIT_THRESHOLD = 0.005 // 0.5%
export const MAX_DAILY_LOSS = -5000 // -$5,000
export const CIRCUIT_BREAKER_THRESHOLD = 0.8 // 80% of daily loss limit

// API rate limits
export const API_RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
export const API_RATE_LIMIT_MAX = 100 // 100 requests per window

// Database settings
export const DB_POOL_SIZE = 10
export const DB_CONNECTION_TIMEOUT = 30000
export const PRICE_HISTORY_RETENTION_DAYS = 30

// Monitoring
export const METRICS_PORT = 9090
export const HEALTH_CHECK_PORT = 8080
export const LOG_LEVEL = process.env.LOG_LEVEL || "info"
