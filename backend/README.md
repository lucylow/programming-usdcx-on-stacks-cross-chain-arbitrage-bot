# Cross-Chain Arbitrage Bot Backend

Backend API for the Cross-Chain Arbitrage Bot that monitors and executes arbitrage opportunities between Ethereum and Stacks blockchains.

## Features

- 🔄 Real-time price monitoring across multiple DEXs
- 🤖 Automated arbitrage opportunity detection
- 🌉 Circle xReserve bridge integration
- 📊 Performance tracking and analytics
- 🛡️ Risk management and circuit breakers
- 📡 REST API for frontend integration

## Setup

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (for production)
- Redis (for caching)

### Installation

1. Install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

2. Configure environment:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

3. Start development server:
\`\`\`bash
npm run dev
\`\`\`

4. Build for production:
\`\`\`bash
npm run build
npm start
\`\`\`

## API Endpoints

### Bot Management
- `GET /api/health` - Health check
- `GET /api/bot/status` - Bot status and metrics

### Trading
- `GET /api/opportunities` - List arbitrage opportunities
- `GET /api/trades` - List executed trades
- `GET /api/prices` - Get current price data

### Analytics
- `GET /api/performance` - Performance metrics

## Environment Variables

See `.env.example` for all configuration options.

## Architecture

The backend consists of:
- **API Server**: Express.js REST API
- **Arbitrage Engine**: Core trading logic
- **Price Oracle**: Multi-source price aggregation
- **Risk Manager**: Trade validation and limits
- **Bridge Orchestrator**: Cross-chain transfers

## Development

Run in development mode with hot reload:
\`\`\`bash
npm run dev
\`\`\`

## License

MIT
