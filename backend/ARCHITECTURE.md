# Backend Architecture

## Overview

The Cross-Chain Arbitrage Bot backend is designed as a modular, event-driven system that monitors prices, detects opportunities, and executes trades across Ethereum and Stacks blockchains.

## System Components

### 1. API Server (`src/index.ts`)
- Express.js REST API
- CORS enabled for frontend integration
- Health check and status endpoints
- Real-time data streaming

### 2. Configuration (`src/config/`)
- Centralized configuration management
- Environment variable handling
- Type-safe configuration interfaces
- Validation utilities

### 3. Core Engine (`src/core/`)
- **Arbitrage Engine**: Main trading logic coordinator
- **Price Oracle**: Multi-source price aggregation
- **Opportunity Detector**: Identifies profitable trades
- **Execution Manager**: Handles trade execution

### 4. Blockchain Integrations (`src/blockchain/`)
- **Ethereum Provider**: ethers.js integration
- **Stacks Client**: Stacks.js integration
- Contract interaction utilities
- Gas optimization

### 5. Bridge Integration (`src/bridge/`)
- **Circle Bridge**: xReserve integration
- **Bridge Orchestrator**: Cross-chain coordination
- **Attestation Service**: Message verification

### 6. Risk Management (`src/risk/`)
- Position sizing calculations
- Circuit breaker system
- Slippage protection
- Loss limits enforcement

### 7. Data Layer (`src/data/`)
- PostgreSQL for persistent storage
- Redis for caching and real-time data
- Sequelize ORM models
- Repository pattern

## Data Flow

\`\`\`
Price Sources → Price Oracle → Opportunity Detector
                                      ↓
                              Risk Manager Validation
                                      ↓
                              Execution Manager
                                      ↓
                        Blockchain/Bridge Execution
                                      ↓
                              Results Storage
\`\`\`

## API Endpoints

### Bot Management
- `GET /api/health` - Service health check
- `GET /api/bot/status` - Bot status and metrics

### Trading Data
- `GET /api/opportunities` - List opportunities
- `GET /api/trades` - List executed trades
- `GET /api/prices` - Current price data

### Analytics
- `GET /api/performance` - Performance metrics

## Configuration

All configuration is managed through environment variables. See `.env.example` for the complete list of required and optional variables.

### Critical Variables
- `ETH_RPC_URL` - Ethereum node endpoint
- `STACKS_NODE_URL` - Stacks node endpoint
- `CIRCLE_API_KEY` - Circle xReserve API key
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - API authentication secret

## Deployment

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm run build
npm start
\`\`\`

### Docker
\`\`\`bash
docker build -t arbitrage-bot .
docker run -p 3001:3001 arbitrage-bot
\`\`\`

## Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **API Keys**: Store in environment variables or secrets manager
3. **Rate Limiting**: Implemented on all public endpoints
4. **Input Validation**: All user inputs are validated
5. **CORS**: Configured to allow only trusted origins in production

## Monitoring

- Structured logging with Winston
- Prometheus metrics exposed on `/metrics`
- Sentry error tracking (optional)
- Health checks for all critical services

## Testing

\`\`\`bash
npm test              # Run all tests
npm run test:coverage # Coverage report
\`\`\`

## Performance Optimization

1. **Price Caching**: Redis caching with 10s TTL
2. **Connection Pooling**: Database connection pool
3. **Parallel Execution**: Concurrent price fetching
4. **Gas Optimization**: Smart gas price estimation

## Future Enhancements

- WebSocket support for real-time updates
- Multi-DEX routing optimization
- MEV protection strategies
- Advanced ML-based opportunity prediction
- Automated rebalancing
