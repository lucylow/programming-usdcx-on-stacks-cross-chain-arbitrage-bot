# Web3 Components Documentation

This document describes the open source web3 components added to the backend for dynamic blockchain data access.

## Overview

The web3 components provide real-time blockchain data, price feeds, event monitoring, token metadata, and multi-chain support. All components use open source libraries and free/public APIs where possible.

## Components

### 1. Web3DataProvider (`src/web3/dataProvider.ts`)

Provides real-time blockchain data using ethers.js.

**Features:**
- Block data (number, timestamp, gas prices)
- Token balances (ERC20 and native)
- Transaction data
- Contract information
- Gas price estimates
- WebSocket support for real-time updates
- Automatic reconnection handling

**Usage:**
```typescript
const provider = new Web3DataProvider(rpcUrls, wsUrls)
const blockData = await provider.getBlockData(chainId)
const balance = await provider.getTokenBalance(chainId, tokenAddress, walletAddress)
```

**API Endpoints:**
- `GET /api/web3/block/:chainId` - Get current block data
- `GET /api/web3/balance/:chainId/:address?token=:tokenAddress` - Get token or native balance
- `GET /api/web3/transaction/:chainId/:txHash` - Get transaction data
- `GET /api/web3/gas/:chainId` - Get gas price estimates

### 2. PriceFeedAggregator (`src/web3/priceFeedAggregator.ts`)

Aggregates price data from multiple open source sources.

**Data Sources:**
- CoinGecko (free tier, no API key required)
- CoinMarketCap (requires API key)
- Binance API (free, no API key required)
- 1inch DEX aggregator (free)

**Features:**
- Multi-source price aggregation
- Weighted average by confidence
- Caching (30 second TTL)
- Volume and market cap data
- 24h price change

**Usage:**
```typescript
const aggregator = new PriceFeedAggregator(coinGeckoApiKey, coinMarketCapApiKey)
const price = await aggregator.getAggregatedPrice("USDC")
```

**API Endpoints:**
- `GET /api/web3/price/:symbol?address=:address&chainId=:chainId` - Get aggregated price
- `POST /api/web3/prices` - Get multiple prices at once

### 3. BlockchainEventListener (`src/web3/eventListener.ts`)

Listens to on-chain events in real-time using WebSocket or HTTP polling.

**Features:**
- Real-time event monitoring
- WebSocket support with fallback to HTTP polling
- Historical event queries
- Multiple callback support per event
- Automatic reconnection

**Usage:**
```typescript
const listener = new BlockchainEventListener(dataProvider)
await listener.subscribe({
  chainId: 1,
  contractAddress: "0x...",
  abi: contractABI,
  eventName: "Transfer"
}, (event) => {
  console.log("Event received:", event)
})
```

**API Endpoints:**
- Event listening is handled programmatically (no direct HTTP endpoints)
- Use WebSocket connections for real-time updates

### 4. TokenMetadataService (`src/web3/tokenMetadata.ts`)

Fetches comprehensive token metadata from multiple sources.

**Data Sources:**
- On-chain data (ERC20 contract calls)
- CoinGecko API
- Token lists (Uniswap, 1inch, CoinGecko)

**Features:**
- Token name, symbol, decimals
- Logo URIs
- Total supply
- Price and market data
- Token search
- Caching (1 hour TTL)

**Usage:**
```typescript
const service = new TokenMetadataService(providers)
const metadata = await service.getTokenMetadata(chainId, tokenAddress)
const searchResults = await service.searchTokens("USDC")
```

**API Endpoints:**
- `GET /api/web3/token/:chainId/:address` - Get token metadata
- `POST /api/web3/tokens/:chainId` - Get multiple token metadata
- `GET /api/web3/tokens/search?q=:query&chainId=:chainId` - Search tokens

### 5. MultiChainService (`src/web3/multiChainService.ts`)

Provides unified interface for accessing data across multiple blockchains.

**Supported Chains:**
- Ethereum Mainnet (1)
- Polygon (137)
- BNB Smart Chain (56)
- Avalanche (43114)
- Arbitrum One (42161)
- Optimism (10)

**Features:**
- Cross-chain price comparison
- Multi-chain balance queries
- Chain metrics (block number, gas prices, etc.)
- Arbitrage opportunity detection
- Native token balance tracking

**Usage:**
```typescript
const service = new MultiChainService(dataProvider, priceAggregator, tokenMetadata)
const comparison = await service.compareCrossChainPrices("USDC", 1, 137)
const opportunities = await service.monitorArbitrageOpportunities("USDC", chainPairs)
```

**API Endpoints:**
- `GET /api/web3/chains` - Get all supported chains
- `GET /api/web3/chain/:chainId` - Get chain information
- `GET /api/web3/chain/:chainId/metrics` - Get chain metrics
- `GET /api/web3/chains/metrics` - Get all chain metrics
- `GET /api/web3/cross-chain/compare` - Compare prices across chains
- `POST /api/web3/cross-chain/arbitrage` - Monitor arbitrage opportunities
- `GET /api/web3/multi-chain/balance` - Get balance across multiple chains

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Ethereum RPC (required)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Ethereum WebSocket (optional, for real-time events)
ETH_WS_URL=wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Price Feed APIs (optional)
COINGECKO_API_KEY=your_coingecko_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### Initialization

The services are automatically initialized in `src/index.ts`:

```typescript
const web3DataProvider = new Web3DataProvider(rpcUrls, wsUrls)
const priceFeedAggregator = new PriceFeedAggregator(coinGeckoKey, coinMarketCapKey)
const tokenMetadataService = new TokenMetadataService(providers)
const multiChainService = new MultiChainService(
  web3DataProvider,
  priceFeedAggregator,
  tokenMetadataService
)
```

## Examples

### Get USDC Price
```bash
curl http://localhost:3001/api/web3/price/USDC
```

### Compare USDC Price Across Chains
```bash
curl "http://localhost:3001/api/web3/cross-chain/compare?symbol=USDC&sourceChainId=1&targetChainId=137"
```

### Get Token Metadata
```bash
curl http://localhost:3001/api/web3/token/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

### Get Multi-Chain Balance
```bash
curl "http://localhost:3001/api/web3/multi-chain/balance?address=0x...&chainIds=1,137,56"
```

### Monitor Arbitrage Opportunities
```bash
curl -X POST http://localhost:3001/api/web3/cross-chain/arbitrage \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "USDC",
    "chainPairs": [
      {"source": 1, "target": 137},
      {"source": 1, "target": 56}
    ],
    "threshold": 0.5
  }'
```

## Dependencies

All components use existing dependencies:
- `ethers` (v6.8.0) - Blockchain interaction
- `axios` (v1.6.0) - HTTP requests

No additional dependencies required!

## Error Handling

All components use the existing error handling system:
- `NetworkError` - Network-related errors
- `TimeoutError` - Request timeouts
- `PriceOracleError` - Price feed errors

Errors are automatically logged and returned with appropriate HTTP status codes.

## Performance

- **Caching**: Price feeds and token metadata are cached to reduce API calls
- **Parallel Requests**: Multiple data sources are queried in parallel
- **WebSocket**: Real-time updates use WebSocket when available
- **Fallback**: HTTP polling used when WebSocket unavailable

## Future Enhancements

Potential additions:
- More blockchain networks (Solana, Cosmos, etc.)
- Additional price sources (DEX aggregators)
- Historical price data
- Transaction simulation
- Gas optimization suggestions
- MEV protection features


