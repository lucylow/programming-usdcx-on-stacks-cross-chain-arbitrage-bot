# Smart Contracts Documentation

## Overview

This project includes a comprehensive suite of Clarity smart contracts for the Stacks blockchain:

1. **DAO Governance** - Complete governance system with proposals, voting, and treasury management
2. **Governance Token** - Fungible token with voting power delegation
3. **NFT Marketplace** - Full-featured marketplace with listings, auctions, offers, and royalties
4. **USDCx Token** - Wrapped USDC token for cross-chain arbitrage
5. **USDCx Bridge** - Circle xReserve bridge integration
6. **Arbitrage Vault** - Automated arbitrage execution

## Contract Locations

\`\`\`
backend/contracts/stacks/
├── dao-governance.clar      # DAO proposal and voting system
├── governance-token.clar    # Voting token with delegation
├── nft-marketplace.clar     # NFT trading platform
├── usdcx-token.clar         # Wrapped USDC implementation
├── usdcx-bridge.clar        # Cross-chain bridge contract
└── arbitrage-vault.clar     # Arbitrage execution vault
\`\`\`

## Setup Instructions

### 1. Install Clarinet

\`\`\`bash
# macOS
brew install clarinet

# Linux/Windows
curl -L https://github.com/hirosystems/clarinet/releases/download/v2.0.0/clarinet-linux-x64.tar.gz | tar xz
\`\`\`

### 2. Initialize Project

\`\`\`bash
cd backend/contracts
clarinet new stacks-contracts
cd stacks-contracts
\`\`\`

### 3. Add Contracts

Copy all `.clar` files to the `contracts/` directory.

### 4. Configure Clarinet.toml

\`\`\`toml
[project]
name = "cross-chain-arbitrage"
requirements = []

[[contracts]]
name = "governance-token"
path = "contracts/governance-token.clar"

[[contracts]]
name = "dao-governance"
path = "contracts/dao-governance.clar"
depends_on = ["governance-token"]

[[contracts]]
name = "nft-marketplace"
path = "contracts/nft-marketplace.clar"

[[contracts]]
name = "usdcx-token"
path = "contracts/usdcx-token.clar"

[[contracts]]
name = "usdcx-bridge"
path = "contracts/usdcx-bridge.clar"
depends_on = ["usdcx-token"]

[[contracts]]
name = "arbitrage-vault"
path = "contracts/arbitrage-vault.clar"
depends_on = ["usdcx-token"]
\`\`\`

### 5. Test Contracts

\`\`\`bash
# Run all tests
clarinet test

# Interactive console
clarinet console

# Local devnet
clarinet integrate
\`\`\`

## Contract Features

### DAO Governance
- **Proposal Creation**: Requires minimum token threshold
- **Voting**: For/Against/Abstain with voting power
- **Execution Delay**: Time-locked proposal execution
- **Quorum Requirements**: Minimum participation required
- **Treasury Management**: Community-controlled funds

### Governance Token
- **ERC-20 Compatible**: Standard transfer functions
- **Vote Delegation**: Delegate voting power to others
- **Token Locking**: Lock tokens for proposal participation
- **Allowance System**: Approve third-party spending

### NFT Marketplace
- **Fixed Price Listings**: List NFTs at set prices
- **English Auctions**: Time-limited bidding auctions
- **Offer System**: Make and accept offers on NFTs
- **Royalties**: Creator royalties on secondary sales
- **Platform Fees**: 2.5% marketplace fee

## Security Considerations

1. **Access Control**: All admin functions check `CONTRACT_OWNER`
2. **Input Validation**: Amounts and parameters are validated
3. **Reentrancy Protection**: Single transaction execution
4. **Overflow Protection**: Clarity prevents integer overflow
5. **Post Conditions**: STX transfers use post conditions

## Deployment

### Testnet Deployment

\`\`\`bash
clarinet deployments generate --testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
\`\`\`

### Mainnet Deployment

\`\`\`bash
clarinet deployments generate --mainnet
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
\`\`\`

## Frontend Integration

Use the `lib/web3/stacks-contracts.ts` service to interact with contracts:

\`\`\`typescript
import { stacksContracts } from '@/lib/web3/stacks-contracts';

// Create a proposal
await stacksContracts.createProposal(
  senderKey,
  'Proposal Title',
  'Description',
  targetContract,
  'function-name',
  []
);

// Vote on proposal
await stacksContracts.voteOnProposal(senderKey, 1, 'for', 1000000);

// Mint NFT
await stacksContracts.mintNFT(senderKey, 'My NFT', 'ipfs://...', 500);
\`\`\`

## Stacks Contract Improvements (USDCx / Bridge / Vault)

### Arbitrage Vault
- **Pull-based deposit**: `deposit(amount)` — vault transfers USDCx from caller in one tx; no prior approval.
- **Real token ops**: Deposit pulls from user via `usdcx-token.transfer`; withdraw sends tokens to bot operator.
- **Bridge integration**: `bridge-to-ethereum(amount, ethereum-recipient)` calls `burn-and-withdraw-from` on the bridge; burns vault balance, records withdrawal with requester = bot operator. `ethereum-recipient` is `(buff 20)` (20-byte address).
- **Init guard**: One-time `initialize(bridge, bot-operator)`; owner stored in `contract-owner`.
- **Read-only**: `get-bridge-contract`, `get-bot-operator`, `get-owner`, `get-min-profit`.

### USDCx Bridge
- **Relayer auth**: `deposit-and-mint` restricted to admin or `set-relayer`-authorized accounts (no longer token contract).
- **`burn-and-withdraw-from`**: For vault bridging. Callable only when `contract-caller == owner`; burns `owner`’s USDCx, records `tx-sender` as requester.
- **Init**: One-time `initialize()` by admin. Grant bridge **MINT_ROLE** on `usdcx-token` after deploy.

### USDCx Token
- **Transfer**: Allows `sender == tx-sender` or `sender == contract-caller` so contracts (e.g. vault) can transfer their own balance (e.g. on withdraw).
- **Mint/burn**: `protocol-mint` / `protocol-burn` accept either `tx-sender` or `contract-caller` as having MINT_ROLE (bridge can mint/burn).

### Backend
- **`depositToVault`**: Single call to `vault.deposit(amount)`; vault pulls USDCx. USDCx contract params optional.

## Error Codes

### DAO Governance
- `u1000`: Contract is paused
- `u1001`: Insufficient tokens for proposal
- `u1002-u1004`: Invalid proposal state or vote
- `u1005-u1008`: Execution validation errors

### Governance Token
- `u2000`: Not contract owner
- `u2001`: Already initialized
- `u2002-u2008`: Transfer/balance errors
- `u2010-u2015`: Voting/lock errors

### NFT Marketplace
- `u3000-u3005`: Listing errors
- `u3006-u3011`: Purchase errors
- `u3012-u3024`: Auction errors
- `u3028-u3039`: Offer/admin errors
