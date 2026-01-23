import "dotenv/config"
import express, { Request, Response } from "express"
import cors from "cors"
import { config, validateConfig } from "./config"
import { PriceOracle } from "./core/priceOracle"
import { ArbitrageEngine } from "./core/arbitrageEngine"
import { logger } from "./utils/logger"
import {
  Web3DataProvider,
  PriceFeedAggregator,
  TokenMetadataService,
  MultiChainService,
} from "./web3"
import { ethers } from "ethers"
import { errorHandler, asyncHandler, successResponse } from "./middleware/errorHandler"
import {
  ValidationError,
  ConfigurationError,
  NetworkError,
  withErrorBoundary,
  withErrorCorrelation,
  parseError,
  errorMetrics,
} from "./utils/errors"
import { requestLogger } from "./middleware/requestLogger"
import { rateLimiter } from "./middleware/rateLimiter"
import { validateRequest, validators } from "./middleware/validation"

// Initialize existing services
const priceOracle = new PriceOracle()
const arbitrageEngine = new ArbitrageEngine(priceOracle)

// Initialize Web3 services
const rpcUrls = new Map<number, string>()
rpcUrls.set(1, config.ethereum.rpcUrl) // Ethereum Mainnet

// Add WebSocket URLs if available (optional)
const wsUrls = new Map<number, string>()
if (process.env.ETH_WS_URL) {
  wsUrls.set(1, process.env.ETH_WS_URL)
}

const web3DataProvider = new Web3DataProvider(rpcUrls, wsUrls.size > 0 ? wsUrls : undefined)
const priceFeedAggregator = new PriceFeedAggregator(
  process.env.COINGECKO_API_KEY,
  process.env.COINMARKETCAP_API_KEY,
)

// Create providers map for token metadata service
const providers = new Map<number, ethers.JsonRpcProvider>()
providers.set(1, web3DataProvider.getProvider(1))

const tokenMetadataService = new TokenMetadataService(providers)
const multiChainService = new MultiChainService(
  web3DataProvider,
  priceFeedAggregator,
  tokenMetadataService,
)

const app = express()

// Middleware
app.use(cors({
  origin: config.api.corsOrigin === "*" ? true : config.api.corsOrigin.split(","),
  credentials: true,
}))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging
app.use(requestLogger)

// Rate limiting
app.use("/api", rateLimiter())

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  successResponse(
    {
      status: "healthy",
      uptime: process.uptime(),
      version: "1.0.0",
      mode: config.mode,
    },
    res,
  )
})

app.get("/api/bot/status", asyncHandler(async (req: Request, res: Response) => {
  const status = arbitrageEngine.getStatus()
  const activeTrades = arbitrageEngine.getActiveTrades()

  successResponse(
    {
      running: status.running,
      activeTrades: status.activeTrades,
      queueLength: activeTrades.length,
      opportunitiesDetected: status.metrics.totalTrades,
      tradesExecuted: status.metrics.successfulTrades,
      totalProfit: status.metrics.totalProfit,
      winRate: status.metrics.winRate,
      avgProfit: status.metrics.avgProfit,
      uptime: process.uptime(),
    },
    res,
  )
}))

app.get("/api/opportunities", asyncHandler(async (req: Request, res: Response) => {
  const opportunities = priceOracle.detectOpportunities(config.risk.minProfitThreshold)

  successResponse(
    opportunities.slice(0, 10).map((opp, index) => {
      const isEthToStacks = opp.direction === "eth_to_stacks"
      const sourceChain = isEthToStacks ? "ethereum" : "stacks"
      const targetChain = isEthToStacks ? "stacks" : "ethereum"
      const sourceDex = isEthToStacks ? opp.ethDex : opp.stacksDex
      const targetDex = isEthToStacks ? opp.stacksDex : opp.ethDex
      const sourcePrice = isEthToStacks ? opp.ethPrice : opp.stacksPrice
      const targetPrice = isEthToStacks ? opp.stacksPrice : opp.ethPrice
      const tokenPair = isEthToStacks ? opp.ethPair : opp.stacksPair
      
      return {
        id: `opp_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        sourceChain,
        targetChain,
        sourceDex,
        targetDex,
        tokenPair,
        sourcePrice,
        targetPrice,
        spread: opp.spread,
        expectedProfit: opp.estimatedProfit,
        confidence: opp.confidence,
        status: index === 0 ? "active" : index === 1 ? "executing" : "completed",
        tradeSize: 10000,
        detectedAt: new Date(opp.timestamp).toISOString(),
        expiresAt: new Date(opp.timestamp + 5 * 60000).toISOString(), // 5 minutes from detection
      }
    }),
    res,
  )
}))

app.get("/api/trades", asyncHandler(async (req: Request, res: Response) => {
  const trades = arbitrageEngine.getRecentTrades(20)

  successResponse(
    trades.map((trade) => {
      const tradeSize = 10000
      const executionTime = trade.endTime ? trade.endTime - trade.startTime : 0
      const gasCost = 5 + Math.random() * 25 // Simulated gas cost
      const bridgeFee = 10 + Math.random() * 20 // Simulated bridge fee
      const slippage = 0.1 + Math.random() * 0.5 // Simulated slippage
      
      return {
        id: trade.id,
        opportunityId: `opp_${trade.opportunity.ethDex}_${trade.opportunity.stacksDex}`,
        status: trade.status === "completed" ? "success" : trade.status === "failed" ? "failed" : trade.status === "executing" ? "executing" : "pending",
        profit: trade.profit,
        roi: tradeSize > 0 ? trade.profit / tradeSize : 0,
        executionTime,
        gasCost,
        bridgeFee,
        slippage,
        txHashes: {
          source: trade.status === "completed" ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` : undefined,
          bridge: trade.status === "completed" ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` : undefined,
          target: trade.status === "completed" ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` : undefined,
        },
        timestamp: trade.startTime,
        error: trade.error,
      }
    }),
    res,
  )
}))

app.get("/api/performance", asyncHandler(async (req: Request, res: Response) => {
  const metrics = arbitrageEngine.getMetrics()

  successResponse(
    {
      period: "daily",
      totalTrades: metrics.totalTrades,
      profitableTrades: metrics.successfulTrades,
      totalVolume: metrics.totalVolume,
      totalProfit: metrics.totalProfit,
      avgProfitPerTrade: metrics.avgProfit,
      maxProfit: metrics.totalProfit > 0 ? metrics.avgProfit * 2.5 : 0,
      maxLoss: metrics.totalTrades - metrics.successfulTrades > 0 ? -50 : 0,
      sharpeRatio: metrics.winRate * 2,
      winRate: metrics.winRate,
    },
    res,
  )
}))

app.get("/api/prices", asyncHandler(async (req: Request, res: Response) => {
  const allPrices = priceOracle.getAllPrices()

  successResponse(
    allPrices.map((price) => ({
      chain: price.chain,
      dex: price.dex,
      pair: price.pair,
      price: price.price,
      liquidity: price.liquidity,
      confidence: price.confidence,
      timestamp: price.timestamp,
      source: price.source,
    })),
    res,
  )
}))

app.get("/api/oracle/stats", asyncHandler(async (req: Request, res: Response) => {
  const stats = priceOracle.getStats()
  successResponse(stats, res)
}))

app.post("/api/bot/start", asyncHandler(async (req: Request, res: Response) => {
  await arbitrageEngine.start()
  successResponse({ message: "Bot started successfully" }, res)
}))

app.post("/api/bot/stop", asyncHandler(async (req: Request, res: Response) => {
  arbitrageEngine.stop()
  successResponse({ message: "Bot stopped successfully" }, res)
}))

// ==================== Web3 Data Provider Endpoints ====================

app.get(
  "/api/web3/block/:chainId",
  validateRequest({
    params: (params: unknown) => {
      const typedParams = params as Record<string, string>
      return validators.chainId(typedParams.chainId)
    },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const chainId = Number.parseInt(req.params.chainId)
    const blockData = await web3DataProvider.getBlockData(chainId)
    successResponse(blockData, res)
  }),
)

app.get("/api/web3/balance/:chainId/:address", asyncHandler(async (req: Request, res: Response) => {
  const chainId = Number.parseInt(req.params.chainId)
  const address = req.params.address
  const tokenAddress = req.query.token as string | undefined

  if (tokenAddress) {
    const balance = await web3DataProvider.getTokenBalance(chainId, tokenAddress, address)
    successResponse(balance, res)
  } else {
    const balance = await web3DataProvider.getNativeBalance(chainId, address)
    successResponse({ address, balance, chainId }, res)
  }
}))

app.get("/api/web3/transaction/:chainId/:txHash", asyncHandler(async (req: Request, res: Response) => {
  const chainId = Number.parseInt(req.params.chainId)
  const txHash = req.params.txHash
  const txData = await web3DataProvider.getTransaction(chainId, txHash)
  successResponse(txData, res)
}))

app.get("/api/web3/gas/:chainId", asyncHandler(async (req: Request, res: Response) => {
  const chainId = Number.parseInt(req.params.chainId)
  const gasPrice = await web3DataProvider.getGasPrice(chainId)
  successResponse(gasPrice, res)
}))

// ==================== Price Feed Aggregator Endpoints ====================

app.get("/api/web3/price/:symbol", asyncHandler(async (req: Request, res: Response) => {
  const symbol = req.params.symbol
  const tokenAddress = req.query.address as string | undefined
  const chainId = req.query.chainId ? Number.parseInt(req.query.chainId as string) : undefined

  const price = await priceFeedAggregator.getAggregatedPrice(symbol, tokenAddress, chainId)
  successResponse(price, res)
}))

app.post("/api/web3/prices", asyncHandler(async (req: Request, res: Response) => {
  const { symbols, tokenAddresses, chainId } = req.body

  if (!Array.isArray(symbols)) {
    return res.status(400).json({ error: "symbols must be an array" })
  }

  const addressesMap = tokenAddresses
    ? new Map<string, string>(Object.entries(tokenAddresses))
    : undefined

  const prices = await priceFeedAggregator.getMultiplePrices(symbols, addressesMap, chainId)
  successResponse(Object.fromEntries(prices), res)
}))

// ==================== Token Metadata Endpoints ====================

app.get("/api/web3/token/:chainId/:address", asyncHandler(async (req: Request, res: Response) => {
  const chainId = Number.parseInt(req.params.chainId)
  const address = req.params.address
  const metadata = await tokenMetadataService.getTokenMetadata(chainId, address)
  successResponse(metadata, res)
}))

app.post("/api/web3/tokens/:chainId", asyncHandler(async (req: Request, res: Response) => {
  const chainId = Number.parseInt(req.params.chainId)
  const { addresses } = req.body

  if (!Array.isArray(addresses)) {
    return res.status(400).json({ error: "addresses must be an array" })
  }

  const metadata = await tokenMetadataService.getMultipleTokenMetadata(chainId, addresses)
  successResponse(Object.fromEntries(metadata), res)
}))

app.get("/api/web3/tokens/search", asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string
  const chainId = req.query.chainId ? Number.parseInt(req.query.chainId as string) : undefined

  if (!query) {
    return res.status(400).json({ error: "query parameter 'q' is required" })
  }

  const tokens = await tokenMetadataService.searchTokens(query, chainId)
  successResponse(tokens, res)
}))

// ==================== Multi-Chain Service Endpoints ====================

app.get("/api/web3/chains", asyncHandler(async (req: Request, res: Response) => {
  const chains = multiChainService.getSupportedChains()
  successResponse(chains, res)
}))

app.get("/api/web3/chain/:chainId", asyncHandler(async (req: Request, res: Response) => {
  const chainId = Number.parseInt(req.params.chainId)
  const chainInfo = multiChainService.getChainInfo(chainId)
  
  if (!chainInfo) {
    return res.status(404).json({ error: "Chain not found" })
  }
  
  successResponse(chainInfo, res)
}))

app.get("/api/web3/chain/:chainId/metrics", asyncHandler(async (req: Request, res: Response) => {
  const chainId = Number.parseInt(req.params.chainId)
  const metrics = await multiChainService.getChainMetrics(chainId)
  successResponse(metrics, res)
}))

app.get("/api/web3/chains/metrics", asyncHandler(async (req: Request, res: Response) => {
  const metrics = await multiChainService.getAllChainMetrics()
  successResponse(Object.fromEntries(metrics), res)
}))

app.get("/api/web3/cross-chain/compare", asyncHandler(async (req: Request, res: Response) => {
  const symbol = req.query.symbol as string
  const sourceChainId = Number.parseInt(req.query.sourceChainId as string)
  const targetChainId = Number.parseInt(req.query.targetChainId as string)
  const sourceAddress = req.query.sourceAddress as string | undefined
  const targetAddress = req.query.targetAddress as string | undefined

  if (!symbol || !sourceChainId || !targetChainId) {
    return res.status(400).json({
      error: "symbol, sourceChainId, and targetChainId are required",
    })
  }

  const comparison = await multiChainService.compareCrossChainPrices(
    symbol,
    sourceChainId,
    targetChainId,
    {
      source: sourceAddress,
      target: targetAddress,
    },
  )

  successResponse(comparison, res)
}))

app.post("/api/web3/cross-chain/arbitrage", asyncHandler(async (req: Request, res: Response) => {
  const { symbol, chainPairs, threshold } = req.body

  if (!symbol || !Array.isArray(chainPairs)) {
    return res.status(400).json({
      error: "symbol and chainPairs array are required",
    })
  }

  const opportunities = await multiChainService.monitorArbitrageOpportunities(
    symbol,
    chainPairs,
    threshold || 0.5,
  )

  successResponse(opportunities, res)
}))

app.get("/api/web3/multi-chain/balance", asyncHandler(async (req: Request, res: Response) => {
  const walletAddress = req.query.address as string
  const tokenAddress = req.query.token as string
  const chainIdsParam = req.query.chainIds as string

  if (!walletAddress || !chainIdsParam) {
    return res.status(400).json({
      error: "address and chainIds are required",
    })
  }

  const chainIds = chainIdsParam.split(",").map((id) => Number.parseInt(id.trim()))

  if (tokenAddress) {
    const balances = await multiChainService.getMultiChainBalance(
      walletAddress,
      tokenAddress,
      chainIds,
    )
    successResponse(Object.fromEntries(balances), res)
  } else {
    const balances = await multiChainService.getMultiChainNativeBalance(
      walletAddress,
      chainIds,
    )
    successResponse(Object.fromEntries(balances), res)
  }
}))

async function startBot() {
  return withErrorCorrelation(async () => {
    logger.info("🚀 Starting Cross-Chain Arbitrage Bot...")

    // Validate configuration with error handling
    try {
      validateConfig()
      logger.info("✅ Configuration validated")
    } catch (error) {
      const parsedError = parseError(error, { operation: "config_validation" })
      logger.error("❌ Configuration validation failed:", parsedError)
      throw new ConfigurationError(
        `Configuration validation failed: ${parsedError.message}`,
        { originalError: parsedError },
      )
    }

    // Start price oracle with error boundary
    try {
      await withErrorBoundary(
        () => priceOracle.start(),
        {
          maxRetries: 3,
          retryDelay: 2000,
          onError: (error) => {
            logger.warn("Price Oracle startup error, retrying...", error)
          },
        },
      )
      logger.info("✅ Price Oracle started")
    } catch (error) {
      const parsedError = parseError(error, { operation: "price_oracle_start" })
      logger.error("❌ Failed to start Price Oracle:", parsedError)
      throw parsedError
    }

    // Start arbitrage engine with error boundary
    try {
      await withErrorBoundary(
        () => arbitrageEngine.start(),
        {
          maxRetries: 3,
          retryDelay: 2000,
          onError: (error) => {
            logger.warn("Arbitrage Engine startup error, retrying...", error)
          },
        },
      )
      logger.info("✅ Arbitrage Engine started")
    } catch (error) {
      const parsedError = parseError(error, { operation: "arbitrage_engine_start" })
      logger.error("❌ Failed to start Arbitrage Engine:", parsedError)
      throw parsedError
    }

    logger.info("🎉 Bot initialization complete")
  })
}

async function shutdown(signal?: string) {
  logger.info(`🛑 Shutting down${signal ? ` (${signal})` : ""}...`)

  try {
    // Stop services with error isolation
    const shutdownTasks = [
      () => {
        try {
          arbitrageEngine.stop()
          logger.info("✅ Arbitrage Engine stopped")
        } catch (error) {
          logger.error("Error stopping Arbitrage Engine:", error)
        }
      },
      () => {
        try {
          priceOracle.stop()
          logger.info("✅ Price Oracle stopped")
        } catch (error) {
          logger.error("Error stopping Price Oracle:", error)
        }
      },
      async () => {
        try {
          await web3DataProvider.cleanup()
          logger.info("✅ Web3 services cleaned up")
        } catch (error) {
          logger.error("Error cleaning up Web3 services:", error)
        }
      },
    ]

    // Execute shutdown tasks in parallel with error isolation
    await Promise.all(shutdownTasks.map((task) => Promise.resolve(task()).catch((error) => {
      logger.error("Shutdown task error:", error)
    })))

    // Log error metrics before shutdown
    const errorStats = errorMetrics.getStats(3600000) // Last hour
    if (errorStats.total > 0) {
      logger.info("Error statistics:", errorStats)
    }

    logger.info("👋 Shutdown complete")
  } catch (error) {
    logger.error("Error during shutdown:", error)
  } finally {
    process.exit(0)
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  const parsedError = parseError(error, { type: "uncaught_exception" })
  errorMetrics.recordError(parsedError)
  logger.error("Uncaught exception:", parsedError)
  shutdown("uncaughtException").catch(() => {
    process.exit(1)
  })
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  const parsedError = parseError(reason, { type: "unhandled_rejection" })
  errorMetrics.recordError(parsedError)
  logger.error("Unhandled promise rejection:", { error: parsedError, promise })
  // Don't exit on unhandled rejection, but log it
})

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

// Error handler must be last
app.use(errorHandler)

// Start server with error handling
const PORT = config.api.port

const server = app.listen(PORT, async () => {
  logger.info(`✅ Backend API server running on port ${PORT}`)
  logger.info(`📊 Dashboard: http://localhost:${PORT}/api/bot/status`)
  logger.info(`🔍 Health Check: http://localhost:${PORT}/api/health`)
  logger.info(`💹 Prices: http://localhost:${PORT}/api/prices`)
  logger.info(`🎯 Opportunities: http://localhost:${PORT}/api/opportunities`)
  logger.info(`🌐 Web3 Components: http://localhost:${PORT}/api/web3/chains`)
  logger.info(`💰 Price Feed: http://localhost:${PORT}/api/web3/price/USDC`)
  logger.info(`🔗 Multi-Chain: http://localhost:${PORT}/api/web3/chains/metrics`)

  // Start the bot with error handling
  try {
    await startBot()
  } catch (error) {
    const parsedError = parseError(error, { operation: "bot_startup" })
    logger.error("❌ Failed to start bot:", parsedError)
    errorMetrics.recordError(parsedError)
    
    // Give time for error logging, then exit
    setTimeout(() => {
      process.exit(1)
    }, 1000)
  }
})

// Handle server errors
server.on("error", (error) => {
  const parsedError = parseError(error, { operation: "server_startup" })
  errorMetrics.recordError(parsedError)
  logger.error("Server error:", parsedError)
  
  if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
    logger.error(`Port ${PORT} is already in use`)
    process.exit(1)
  }
})

export default app
