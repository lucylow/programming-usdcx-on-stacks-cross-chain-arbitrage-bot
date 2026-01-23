import dotenv from "dotenv"
import type { BotConfig } from "./types"
import {
  ConfigurationError,
  InputValidationError,
  safeParseInt,
  safeParseNumber,
  safeParseString,
} from "../utils/errors"
import { logger } from "../utils/logger"

dotenv.config()

// Helper function to safely parse environment variables
function getEnvString(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key]
  if (required && !value) {
    throw new ConfigurationError(`Required environment variable ${key} is missing`)
  }
  return value || defaultValue || ""
}

function getEnvInt(key: string, defaultValue: number, min?: number, max?: number): number {
  const value = process.env[key]
  if (!value) {
    return defaultValue
  }
  try {
    return safeParseInt(value, key, { min, max })
  } catch (error) {
    logger.warn(`Invalid integer value for ${key}: ${value}, using default: ${defaultValue}`)
    return defaultValue
  }
}

function getEnvFloat(key: string, defaultValue: number, min?: number, max?: number): number {
  const value = process.env[key]
  if (!value) {
    return defaultValue
  }
  try {
    return safeParseNumber(value, key, { min, max })
  } catch (error) {
    logger.warn(`Invalid float value for ${key}: ${value}, using default: ${defaultValue}`)
    return defaultValue
  }
}

function getEnvMode(): "development" | "production" | "demo" {
  const mode = process.env.NODE_ENV
  if (mode === "development" || mode === "production" || mode === "demo") {
    return mode
  }
  return "development"
}

function getStacksNetwork(): "mainnet" | "testnet" {
  const network = process.env.STACKS_NETWORK
  if (network === "mainnet" || network === "testnet") {
    return network
  }
  return "testnet" // Default to testnet for safety
}

// Get default Stacks RPC URL based on network
function getDefaultStacksRpcUrl(network: "mainnet" | "testnet"): string {
  return network === "mainnet"
    ? "https://api.mainnet.hiro.so"
    : "https://api.testnet.hiro.so"
}

export const config: BotConfig = {
  mode: getEnvMode(),

  ethereum: {
    rpcUrl: getEnvString("ETH_RPC_URL", "https://eth-mainnet.g.alchemy.com/v2/demo"),
    privateKey: getEnvString("ETH_PRIVATE_KEY", ""),
    networkId: getEnvInt("ETH_NETWORK_ID", 1, 1),
    walletAddress: getEnvString("ETH_WALLET_ADDRESS", ""),
    gasStationUrl: getEnvString("ETH_GAS_STATION_URL"),
    maxGasPriceGwei: getEnvInt("MAX_GAS_PRICE_GWEI", 100, 1, 10000),
  },

  stacks: {
    network: getStacksNetwork(),
    rpcUrl: getEnvString("STACKS_NODE_URL", getDefaultStacksRpcUrl(getStacksNetwork())),
    privateKey: getEnvString("STACKS_PRIVATE_KEY", ""),
    walletAddress: getEnvString("STACKS_WALLET_ADDRESS", ""),
    apiKey: getEnvString("STACKS_API_KEY"),
  },

  bridge: {
    circleApiKey: getEnvString("CIRCLE_API_KEY", ""),
    xReserveContract: getEnvString("XRESERVE_CONTRACT", ""),
    attestationServiceUrl: getEnvString("ATTESTATION_SERVICE_URL", ""),
    maxBridgeQueueTime: getEnvInt("MAX_BRIDGE_QUEUE_TIME", 1800000, 0),
    bridgeFeePercentage: getEnvFloat("BRIDGE_FEE_PERCENTAGE", 0.001, 0, 1),
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
    maxPositionSize: getEnvFloat("MAX_POSITION_SIZE", 10000, 0),
    minProfitThreshold: getEnvFloat("MIN_PROFIT_THRESHOLD", 0.005, 0, 1),
    maxSlippage: getEnvFloat("MAX_SLIPPAGE", 0.01, 0, 1),
    dailyLossLimit: getEnvFloat("DAILY_LOSS_LIMIT", -5000),
    maxConcurrentTrades: getEnvInt("MAX_CONCURRENT_TRADES", 3, 1, 100),
    circuitBreakerThreshold: getEnvFloat("CIRCUIT_BREAKER_THRESHOLD", 0.05, 0, 1),
    stopLossPercentage: getEnvFloat("STOP_LOSS_PERCENTAGE", 0.02, 0, 1),
    maxDrawdown: getEnvFloat("MAX_DRAWDOWN", 0.05, 0, 1),
  },

  database: {
    host: getEnvString("DB_HOST", "localhost"),
    port: getEnvInt("DB_PORT", 5432, 1, 65535),
    name: getEnvString("DB_NAME", "arbitrage_bot"),
    user: getEnvString("DB_USER", "postgres"),
    password: getEnvString("DB_PASSWORD", ""),
    poolSize: getEnvInt("DB_POOL_SIZE", 10, 1, 100),
  },

  redis: {
    host: getEnvString("REDIS_HOST", "localhost"),
    port: getEnvInt("REDIS_PORT", 6379, 1, 65535),
    password: getEnvString("REDIS_PASSWORD"),
    db: getEnvInt("REDIS_DB", 0, 0, 15),
  },

  monitoring: {
    port: getEnvInt("MONITORING_PORT", 9090, 1, 65535),
    healthCheckPort: getEnvInt("HEALTH_CHECK_PORT", 8080, 1, 65535),
    sentryDsn: getEnvString("SENTRY_DSN"),
    logLevel: getEnvString("LOG_LEVEL", "info"),
  },

  api: {
    port: getEnvInt("API_PORT", 3001, 1, 65535),
    jwtSecret: getEnvString("JWT_SECRET", "dev-secret-change-in-production"),
    corsOrigin: getEnvString("CORS_ORIGIN", "*"),
    rateLimitWindowMs: getEnvInt("RATE_LIMIT_WINDOW_MS", 900000, 1000),
    rateLimitMaxRequests: getEnvInt("RATE_LIMIT_MAX_REQUESTS", 100, 1, 10000),
  },
}

export function validateConfig(): void {
  const errors: string[] = []

  // Validate required fields based on mode
  if (config.mode !== "demo") {
    if (!config.ethereum.rpcUrl || config.ethereum.rpcUrl.includes("demo")) {
      errors.push("ETH_RPC_URL is required and must not be a demo URL in non-demo mode")
    }

    if (!config.stacks.rpcUrl) {
      errors.push("STACKS_NODE_URL is required")
    }
  }

  // Validate Ethereum configuration
  const networkId = config.ethereum.networkId
  if (networkId !== undefined && networkId < 1) {
    errors.push("ETH_NETWORK_ID must be >= 1")
  }

  const maxGasPriceGwei = config.ethereum.maxGasPriceGwei
  if (maxGasPriceGwei !== undefined) {
    if (maxGasPriceGwei < 1 || maxGasPriceGwei > 10000) {
      errors.push("MAX_GAS_PRICE_GWEI must be between 1 and 10000")
    }
  }

  // Validate risk parameters
  if (config.risk.maxPositionSize <= 0) {
    errors.push("MAX_POSITION_SIZE must be > 0")
  }

  if (config.risk.minProfitThreshold < 0 || config.risk.minProfitThreshold > 1) {
    errors.push("MIN_PROFIT_THRESHOLD must be between 0 and 1")
  }

  if (config.risk.maxSlippage < 0 || config.risk.maxSlippage > 1) {
    errors.push("MAX_SLIPPAGE must be between 0 and 1")
  }

  if (config.risk.maxConcurrentTrades < 1) {
    errors.push("MAX_CONCURRENT_TRADES must be >= 1")
  }

  if (config.risk.circuitBreakerThreshold < 0 || config.risk.circuitBreakerThreshold > 1) {
    errors.push("CIRCUIT_BREAKER_THRESHOLD must be between 0 and 1")
  }

  // Validate database configuration
  if (config.database.port < 1 || config.database.port > 65535) {
    errors.push("DB_PORT must be between 1 and 65535")
  }

  if (!config.database.name) {
    errors.push("DB_NAME is required")
  }

  // Validate API configuration
  if (config.api.port < 1 || config.api.port > 65535) {
    errors.push("API_PORT must be between 1 and 65535")
  }

  if (config.api.port === config.monitoring.port || config.api.port === config.monitoring.healthCheckPort) {
    errors.push("API_PORT must be different from monitoring ports")
  }

  if (config.api.rateLimitMaxRequests < 1) {
    errors.push("RATE_LIMIT_MAX_REQUESTS must be >= 1")
  }

  // Validate bridge configuration
  if (config.bridge.bridgeFeePercentage < 0 || config.bridge.bridgeFeePercentage > 1) {
    errors.push("BRIDGE_FEE_PERCENTAGE must be between 0 and 1")
  }

  if (config.bridge.maxBridgeQueueTime < 0) {
    errors.push("MAX_BRIDGE_QUEUE_TIME must be >= 0")
  }

  // Throw if there are validation errors
  if (errors.length > 0) {
    throw new ConfigurationError(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      { errors, mode: config.mode },
    )
  }

  // Log warnings for missing optional but recommended fields
  const warnings: string[] = []

  if (config.mode === "production") {
    if (!config.ethereum.privateKey) {
      warnings.push("ETH_PRIVATE_KEY is not set (required for production)")
    }

    if (!config.stacks.privateKey) {
      warnings.push("STACKS_PRIVATE_KEY is not set (required for production)")
    }

    if (config.api.jwtSecret === "dev-secret-change-in-production") {
      warnings.push("JWT_SECRET is using default value (should be changed in production)")
    }
  }

  if (warnings.length > 0) {
    logger.warn("Configuration warnings:", { warnings })
  }
}

export default config
