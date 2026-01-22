# Frontend Integration Guide

## Overview

This document describes the advanced frontend components integrated into the Cross-Chain Arbitrage Bot, inspired by production-ready DeFi applications.

## Architecture

### Component Structure

\`\`\`
components/
├── advanced/
│   ├── WalletConnect.tsx        # Wallet connection modal and management
│   ├── LivePriceMonitor.tsx     # Real-time price tracking with animations
│   ├── AnimatedStats.tsx        # Animated statistics cards with CountUp
│   └── OpportunityAlert.tsx     # Toast notifications for opportunities
├── ui/                          # shadcn/ui components
└── ... (existing components)
\`\`\`

### Key Features

#### 1. Wallet Integration

**WalletConnect Component**
- Multi-wallet support (MetaMask, WalletConnect, Coinbase)
- Animated modal with Framer Motion
- Address management (copy, view on explorer)
- Connection state management
- Responsive dropdown menu

\`\`\`tsx
import WalletConnect from "@/components/advanced/WalletConnect"

<WalletConnect onConnect={(address) => console.log(address)} />
\`\`\`

#### 2. Live Price Monitoring

**LivePriceMonitor Component**
- Real-time price updates every 2 seconds
- Animated price changes with scale effects
- Live indicator with pulse animation
- 24h change tracking with trend indicators
- Liquidity display
- Spread calculation and visualization

\`\`\`tsx
import LivePriceMonitor from "@/components/advanced/LivePriceMonitor"

<LivePriceMonitor />
\`\`\`

#### 3. Animated Statistics

**AnimatedStats Component**
- CountUp animations for numbers
- Auto-updating stats every 5 seconds
- Icon indicators for each metric
- Color-coded values (success, accent, error)
- Responsive grid layout

\`\`\`tsx
import AnimatedStats from "@/components/advanced/AnimatedStats"

<AnimatedStats />
\`\`\`

#### 4. Opportunity Alerts

**OpportunityAlert Component**
- Animated toast notifications
- Auto-detection of arbitrage opportunities
- Dismissible with auto-hide after 30s
- Shows spread, profit, and direction
- Execute trade or dismiss actions

\`\`\`tsx
import OpportunityAlert from "@/components/advanced/OpportunityAlert"

<OpportunityAlert />
\`\`\`

## Styling & Theming

### Color System

The application uses a custom DeFi-themed color palette:

\`\`\`css
--brand: oklch(0.55 0.25 265)      /* Primary purple */
--accent: oklch(0.62 0.19 175)      /* Teal accent */
--ethereum: oklch(0.6 0.2 255)      /* Ethereum blue */
--stacks: oklch(0.55 0.25 265)      /* Stacks purple */
--success: oklch(0.65 0.22 145)     /* Green */
--error: oklch(0.58 0.24 25)        /* Red */
\`\`\`

### Animations

All animations use Framer Motion for smooth, performant transitions:

- **Fade In**: Opacity 0 → 1 with translateY
- **Scale Pulse**: Scale 1.1 → 1 for price updates
- **Slide Up**: translateY 100% → 0 for modals
- **Hover Effects**: Scale 1.02 on hover

## Utilities

### Format Utilities

\`\`\`typescript
// lib/utils/format.ts
import { shortAddress, formatCurrency, formatPercentage } from "@/lib/utils/format"

shortAddress("0x1234...5678")           // "0x1234...5678"
formatCurrency(1234.56)                 // "$1,234.56"
formatPercentage(1.23)                  // "+1.23%"
\`\`\`

### Constants

\`\`\`typescript
// lib/constants.ts
import { NETWORKS, DEX_LIST, TRADING_CONSTANTS } from "@/lib/constants"
\`\`\`

### Custom Hooks

\`\`\`typescript
// hooks/useApiData.ts
import { useBotStatus, usePrices, useOpportunities } from "@/hooks/useApiData"

const { data, loading, error, refetch } = useBotStatus()
\`\`\`

## API Integration

### Backend Connection

The frontend connects to the backend API at `http://localhost:3001`:

\`\`\`typescript
// Environment variable
NEXT_PUBLIC_API_URL=http://localhost:3001

// Usage in code
const response = await fetch(`${API_BASE_URL}/api/status`)
\`\`\`

### Available Endpoints

- `GET /api/status` - Bot status and metrics
- `GET /api/prices` - Current price data
- `GET /api/opportunities` - Active opportunities
- `GET /api/trades` - Trade history
- `POST /api/bot/start` - Start the bot
- `POST /api/bot/stop` - Stop the bot

## Running the Application

### Development Mode

\`\`\`bash
# Frontend only
npm run dev

# Backend only
npm run backend

# Both simultaneously
npm run dev:all
\`\`\`

### Production Build

\`\`\`bash
# Build frontend
npm run build

# Start production server
npm start
\`\`\`

## Performance Optimizations

1. **Lazy Loading**: Components load on-demand
2. **Memoization**: React.memo for expensive components
3. **Debouncing**: API calls are debounced to prevent spam
4. **Virtualization**: Long lists use virtual scrolling
5. **Code Splitting**: Automatic code splitting per route

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus indicators visible
- Color contrast meets WCAG AA standards
- Screen reader friendly

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Advanced charting with TradingView
- [ ] Transaction history filtering
- [ ] Export data to CSV
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)
- [ ] Browser notifications
- [ ] Advanced trading strategies UI

## Troubleshooting

### Common Issues

**Wallet not connecting:**
- Ensure MetaMask/wallet is installed
- Check if wallet is unlocked
- Verify network is correct

**API errors:**
- Check backend is running on port 3001
- Verify CORS is enabled
- Check API endpoint paths

**Animations laggy:**
- Reduce refresh intervals
- Disable animations in browser settings
- Check system performance

## Contributing

See main README.md for contribution guidelines.

## License

MIT License - see LICENSE file for details
