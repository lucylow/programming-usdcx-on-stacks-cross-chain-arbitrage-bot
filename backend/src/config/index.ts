import dotenv from "dotenv"
import type { BotConfig } from "./types"

dotenv.config()

export const config: BotConfig = {
  mode: (process.env.NODE_ENV as "development" | "production" | "demo") || "development",

  ethereum: {
    rpcUrl: process.env.ETH_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
    privateKey: process.env.ETH_PRIVATE_KEY || "",
    networkId: Number.parseInt(process.env.ETH_NETWORK_ID || "1"),
    walletAddress: process.env.ETH_WALLET_ADDRESS || "",
    gasStationUrl: process.env.ETH_GAS_STATION_URL,
    maxGasPriceGwei: Number.parseInt(process.env.MAX_GAS_PRICE_GWEI || "100"),
  },

  stacks: {
    rpcUrl: process.env.STACKS_NODE_URL || "https://api.mainnet.hiro.so",
    privateKey: process.env.STACKS_PRIVATE_KEY || "",
    network: (process.env.STACKS_NETWORK as "mainnet" | "testnet") || "mainnet",
    walletAddress: process.env.STACKS_WALLET_ADDRESS || "",
    apiKey: process.env.STACKS_API_KEY,
  },

  bridge: {
    circleApiKey: process.env.CIRCLE_API_KEY || "",
    xReserveContract: process.env.XRESERVE_CONTRACT || "",
    attestationServiceUrl: process.env.ATTESTATION_SERVICE_URL || "",
    maxBridgeQueueTime: Number.parseInt(process.env.MAX_BRIDGE_QUEUE_TIME || "1800000"),
    bridgeFeePercentage: Number.parseFloat(process.env.BRIDGE_FEE_PERCENTAGE || "0.001"),
  },

  dex: {
    ethereum: [
      {
        name: "uniswap_v3",
        routerAddress: process.env.UNISWAP_V3_ROUTER || "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        factoryAddress: process.env.UNISWAP_V3_FACTORY || "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        feeTiers: [500, 3000, 10000],
        enabled: process.env.UNISWAP_ENABLED !== "false",
      },
      {
        name: "curve",
        routerAddress: process.env.CURVE_ROUTER || "0x99a58482BD75cbab83b27EC03CA68fF489b5788f",
        factoryAddress: process.env.CURVE_FACTORY || "0x8F942C20D02bEfc377D41445793068908E2250D0",
        enabled: process.env.CURVE_ENABLED !== "false",
      },
    ],
    stacks: [
      {
        name: "alex",
        routerAddress: process.env.ALEX_ROUTER || "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
        enabled: process.env.ALEX_ENABLED !== "false",
      },
      {
        name: "arkadiko",
        routerAddress: process.env.ARKADIKO_ROUTER || "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR",
        enabled: process.env.ARKADIKO_ENABLED !== "false",
      },
    ],
  },

  risk: {
    maxPositionSize: Number.parseFloat(process.env.MAX_POSITION_SIZE || "10000"),
    minProfitThreshold: Number.parseFloat(process.env.MIN_PROFIT_THRESHOLD || "0.005"),
    maxSlippage: Number.parseFloat(process.env.MAX_SLIPPAGE || "0.01"),
    dailyLossLimit: Number.parseFloat(process.env.DAILY_LOSS_LIMIT || "-5000"),
    maxConcurrentTrades: Number.parseInt(process.env.MAX_CONCURRENT_TRADES || "3"),
    circuitBreakerThreshold: Number.parseFloat(process.env.CIRCUIT_BREAKER_THRESHOLD || "0.05"),
    stopLossPercentage: Number.parseFloat(process.env.STOP_LOSS_PERCENTAGE || "0.02"),
    maxDrawdown: Number.parseFloat(process.env.MAX_DRAWDOWN || "0.05"),
  },

  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    name: process.env.DB_NAME || "arbitrage_bot",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    poolSize: Number.parseInt(process.env.DB_POOL_SIZE || "10"),
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    db: Number.parseInt(process.env.REDIS_DB || "0"),
  },

  monitoring: {
    port: Number.parseInt(process.env.MONITORING_PORT || "9090"),
    healthCheckPort: Number.parseInt(process.env.HEALTH_CHECK_PORT || "8080"),
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL || "info",
  },

  api: {
    port: Number.parseInt(process.env.API_PORT || "3001"),
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    corsOrigin: process.env.CORS_ORIGIN || "*",
    rateLimitWindowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    rateLimitMaxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  },
}

export function validateConfig(): void {
  const required = ["ETH_RPC_URL", "STACKS_NODE_URL"]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0 && config.mode !== "demo") {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
  }
}

export default config
