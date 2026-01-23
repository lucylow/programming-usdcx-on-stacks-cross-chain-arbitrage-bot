# NFT Integration Documentation

## Overview

This document describes the comprehensive NFT integration for the Cross-Chain Arbitrage Bot, including badge minting, marketplace functionality, and automatic badge rewards based on trading activity.

## Architecture

### Backend Components

#### 1. NFT Service (`backend/src/nft/nftService.ts`)

Provides blockchain interaction layer for NFT operations:

- **Functions:**
  - `getTotalSupply()` - Get total number of minted NFTs
  - `getLastTokenId()` - Get the highest token ID
  - `getOwner(tokenId)` - Get owner of a specific NFT
  - `getTokenUri(tokenId)` - Get metadata URI for a token
  - `getTokenMetadata(tokenId)` - Get full token metadata
  - `hasUserClaimed(address)` - Check if user has claimed a badge
  - `getOwnedNFTs(address)` - Get all NFTs owned by an address
  - `getListing(listingId)` - Get marketplace listing details
  - `getAuction(auctionId)` - Get auction details

#### 2. NFT Minter (`backend/src/nft/nftMinter.ts`)

Handles automatic badge minting based on trading activity:

- **Badge Types:**
  - `early-adopter`: 1+ trades, any profit
  - `trader`: 10+ trades, $100+ profit
  - `whale`: 50+ trades, $1,000+ profit
  - `legend`: 100+ trades, $5,000+ profit

- **Functions:**
  - `determineBadgeType(stats)` - Determines which badge user qualifies for
  - `mintBadgeForTrader()` - Mints badge with metadata
  - `checkAndMintBadge()` - Checks criteria and mints if qualified
  - `processTradeCompletion()` - Called after each successful trade

#### 3. API Endpoints

**NFT Information:**
- `GET /api/nft/supply` - Get total supply
- `GET /api/nft/last-token-id` - Get last token ID
- `GET /api/nft/token/:tokenId` - Get token details
- `GET /api/nft/owner/:address` - Get owned NFTs
- `GET /api/nft/claimed/:address` - Check claim status

**Marketplace:**
- `GET /api/nft/marketplace/listings` - Get total listings count
- `GET /api/nft/marketplace/listings/:listingId` - Get listing details
- `GET /api/nft/marketplace/auctions` - Get total auctions count
- `GET /api/nft/marketplace/auctions/:auctionId` - Get auction details

### Frontend Components

#### 1. NFT Service (`lib/stacks/nftService.ts`)

Frontend service layer for NFT operations:

- Wraps backend API calls
- Provides TypeScript interfaces
- Handles error cases gracefully

#### 2. NFT Gallery (`components/nft/NftGallery.tsx`)

Displays user's owned NFT badges:

- Fetches real blockchain data via API
- Shows badge type, trades completed, profit earned
- Displays mint date and explorer links
- Auto-refreshes on wallet connection

#### 3. NFT Marketplace (`components/nft/NftMarketplace.tsx`)

Full marketplace interface:

- Browse active listings and auctions
- View marketplace statistics
- Buy NFTs from listings
- Place bids on auctions
- Switch between listings and auctions views

#### 4. NFT List Button (`components/nft/NftListButton.tsx`)

Component for listing NFTs for sale:

- Set price in STX
- List NFT on marketplace
- Transaction status tracking
- Explorer link on success

#### 5. Mint Badge Button (`components/nft/MintBadgeButton.tsx`)

Allows users to claim their first badge:

- One-time claim per address
- Calls `claim()` function on contract
- Shows transaction status
- Links to explorer

## Smart Contracts

### Privacy Badge NFT (`backend/contracts/stacks/privacy-badge-nft.clar`)

SIP-009 compliant NFT contract:

- **Functions:**
  - `claim()` - Public claim function (one per user)
  - `mint-badge()` - Authorized minter function
  - `mint-to()` - Admin mint function
  - `transfer()` - Standard NFT transfer
  - `burn()` - Burn NFT
  - `get-token-metadata()` - Get badge metadata

- **Metadata:**
  - `minted-at`: Block height when minted
  - `badge-type`: Type of badge (early-adopter, trader, whale, legend)
  - `trades-completed`: Number of trades completed
  - `profit-earned`: Total profit in micro-STX

### NFT Marketplace (`backend/contracts/stacks/nft-marketplace.clar`)

Full-featured marketplace:

- **Fixed Price Listings:**
  - `list-nft()` - List NFT for sale
  - `buy-nft()` - Purchase listed NFT
  - `cancel-listing()` - Cancel active listing

- **Auctions:**
  - `create-auction()` - Create auction
  - `place-bid()` - Place bid on auction
  - `settle-auction()` - Settle completed auction
  - `cancel-auction()` - Cancel auction (no bids)

- **Offers:**
  - `make-offer()` - Make offer on NFT
  - `accept-offer()` - Accept offer
  - `cancel-offer()` - Cancel own offer

- **Features:**
  - Royalty support (up to 10%)
  - Platform fees (2.5%)
  - Automatic payment distribution

## Integration with Arbitrage Bot

The NFT system is integrated with the arbitrage engine:

1. **Trade Completion Hook:**
   - When a trade completes successfully, `handleTradeCompletionForNFT()` is called
   - Updates trader statistics (total trades, total profit)
   - Checks if user qualifies for a badge
   - Automatically mints badge if criteria met

2. **Badge Criteria:**
   - Badges are awarded based on cumulative trading activity
   - Higher tier badges replace lower tier badges
   - Each badge type has minimum trade count and profit thresholds

3. **Configuration:**
   - Set `STACKS_PRIVATE_KEY` in environment for auto-minting
   - Set `NFT_CONTRACT_ADDRESS` to your deployed contract
   - NFT minter is optional - bot works without it

## Usage Examples

### Backend: Check NFT Supply

```typescript
import { NFTService } from "./nft/nftService"

const nftService = new NFTService("testnet", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
const supply = await nftService.getTotalSupply()
console.log(`Total NFTs minted: ${supply}`)
```

### Frontend: Fetch Owned NFTs

```typescript
import { nftService } from "@/lib/stacks/nftService"

const nfts = await nftService.getOwnedNFTs("SP1ABC...")
console.log(`You own ${nfts.length} badges`)
```

### Frontend: List NFT for Sale

```tsx
import { NftListButton } from "@/components/nft/NftListButton"

<NftListButton 
  tokenId={1} 
  onListed={() => console.log("NFT listed!")} 
/>
```

## Environment Variables

```env
# NFT Contract Address
NFT_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# NFT Marketplace Address (optional)
NFT_MARKETPLACE_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Stacks Private Key (for auto-minting)
STACKS_PRIVATE_KEY=your-private-key-here

# API URL (frontend)
VITE_API_URL=http://localhost:3001
```

## Future Enhancements

1. **Indexer Integration:**
   - Use Stacks indexer for efficient NFT queries
   - Real-time event monitoring
   - Historical data tracking

2. **Advanced Marketplace:**
   - Collection browsing
   - Advanced filtering and sorting
   - Price history charts
   - Floor price tracking

3. **Badge Evolution:**
   - Upgradeable badges
   - Badge fusion mechanics
   - Special edition badges

4. **Gamification:**
   - Leaderboards
   - Badge rarity system
   - Achievement unlocks
   - Trading competitions

## Testing

### Test NFT Minting

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test API
curl http://localhost:3001/api/nft/supply
```

### Test Frontend Components

```bash
# Start frontend
npm run dev

# Navigate to NFT gallery
# Connect wallet
# View your badges
```

## Troubleshooting

### NFTs Not Showing

1. Check contract address is correct
2. Verify network (testnet vs mainnet)
3. Check API is running and accessible
4. Verify wallet is connected

### Auto-Minting Not Working

1. Verify `STACKS_PRIVATE_KEY` is set
2. Check contract has authorized minter
3. Review logs for minting errors
4. Ensure bot is executing trades

### Marketplace Issues

1. Verify marketplace contract is deployed
2. Check contract addresses match
3. Ensure sufficient STX for fees
4. Verify NFT ownership before listing

## Security Considerations

1. **Private Keys:**
   - Never commit private keys to version control
   - Use environment variables or secrets manager
   - Rotate keys regularly

2. **Contract Verification:**
   - Verify all contract addresses
   - Test on testnet before mainnet
   - Review contract code before deployment

3. **Access Control:**
   - Marketplace uses proper authorization checks
   - Only owners can list their NFTs
   - Platform fees are enforced

4. **Rate Limiting:**
   - API endpoints are rate limited
   - Prevent abuse of minting functions
   - Monitor for suspicious activity
