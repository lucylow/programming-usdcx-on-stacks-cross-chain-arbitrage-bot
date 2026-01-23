# DAO Governance Integration

This document describes the comprehensive DAO governance integration for the cross-chain arbitrage bot.

## Overview

The DAO governance system enables decentralized decision-making for the arbitrage bot, allowing token holders to:
- Create and vote on proposals
- Manage treasury funds
- Control bot parameters through governance
- Delegate voting power

## Architecture

### Backend Components

#### 1. `DaoGovernanceService` (`backend/src/blockchain/daoGovernance.ts`)
A comprehensive service class that handles all interactions with DAO governance contracts on Stacks:

**Key Features:**
- Proposal creation and management
- Voting system with support for For/Against/Abstain
- Treasury management
- Governance token operations
- Vote delegation

**Main Methods:**
- `createProposal()` - Create a new governance proposal
- `activateProposal()` - Activate a pending proposal
- `voteOnProposal()` - Cast a vote on an active proposal
- `executeProposal()` - Execute a passed proposal
- `getProposal()` - Fetch proposal details
- `getAllProposals()` - List all proposals
- `getTreasuryBalance()` - Get DAO treasury balance
- `getGovernanceTokenInfo()` - Get token balance and voting power
- `delegateVotes()` - Delegate voting power to another address

#### 2. API Endpoints (`backend/src/index.ts`)

RESTful API endpoints for DAO governance:

**Proposals:**
- `GET /api/dao/proposals` - List all proposals
- `GET /api/dao/proposals/:id` - Get proposal details
- `POST /api/dao/proposals` - Create a new proposal
- `POST /api/dao/proposals/:id/activate` - Activate a proposal
- `POST /api/dao/proposals/:id/vote` - Vote on a proposal
- `POST /api/dao/proposals/:id/execute` - Execute a proposal

**Voting:**
- `GET /api/dao/proposals/:id/vote/:voter` - Get vote details
- `GET /api/dao/proposals/:id/has-voted/:voter` - Check if user voted

**Treasury & Token:**
- `GET /api/dao/treasury` - Get treasury balance
- `GET /api/dao/token/:address` - Get governance token info
- `POST /api/dao/delegate` - Delegate voting power

### Frontend Components

#### 1. `useDaoGovernance` Hook (`hooks/useDaoGovernance.ts`)
A React hook that provides a clean interface for DAO operations:

**State:**
- `proposals` - List of all proposals
- `tokenInfo` - User's governance token balance and voting power
- `treasuryBalance` - DAO treasury balance
- `isLoading` - Loading state
- `error` - Error messages

**Actions:**
- `createProposal()` - Create a proposal
- `voteOnProposal()` - Vote on a proposal
- `executeProposal()` - Execute a proposal
- `activateProposal()` - Activate a proposal
- `refreshProposals()` - Refresh proposal list
- `delegateVotes()` - Delegate voting power

#### 2. `GovernanceDashboard` Component (`components/dao/GovernanceDashboard.tsx`)
A comprehensive UI component for DAO governance:

**Features:**
- Dashboard with treasury balance, voting power, and active proposals
- Proposal list with status badges and voting progress
- Create proposal dialog
- Vote dialog with support selection
- Proposal details view
- Real-time updates

#### 3. Type Definitions (`src/types/governance.ts`)
Shared TypeScript types for governance:

- `Proposal` - Proposal data structure
- `Vote` - Vote data structure
- `GovernanceTokenInfo` - Token balance and voting power
- `ProposalState` - Enum for proposal states
- `VoteSupport` - Enum for vote types
- Helper functions for formatting and status calculation

## Smart Contracts

The integration uses two main Stacks contracts:

### 1. `dao-governance.clar`
Main governance contract with:
- Proposal creation and management
- Voting system
- Treasury management
- Proposal execution

### 2. `governance-token.clar`
Governance token contract with:
- Token transfers
- Voting power calculation
- Vote delegation
- Token locking for proposals

## Usage Examples

### Creating a Proposal

```typescript
const { createProposal } = useDaoGovernance()

await createProposal(
  "Increase Minimum Profit Threshold",
  "Proposal to increase the minimum profit threshold from 0.5% to 1%",
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arbitrage-vault",
  "set-min-profit-threshold",
  ["0x0000000000000000000000000000000000000000000000000000000000000064"] // 100 in hex
)
```

### Voting on a Proposal

```typescript
const { voteOnProposal, tokenInfo } = useDaoGovernance()

await voteOnProposal(
  1, // proposal ID
  VoteSupport.For, // vote type
  tokenInfo.votingPower // voting power to use
)
```

### Delegating Votes

```typescript
const { delegateVotes } = useDaoGovernance()

await delegateVotes("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
```

## Integration with Arbitrage Bot

The DAO can control various bot parameters through proposals:

1. **Minimum Profit Threshold** - Control the minimum profit required for trades
2. **Risk Parameters** - Adjust risk management settings
3. **Treasury Management** - Allocate funds for operations
4. **Contract Upgrades** - Propose and execute contract upgrades
5. **Fee Structure** - Adjust trading fees and rewards

## Configuration

Set the following environment variables:

```env
# DAO Contract Address
DAO_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Governance Token Address (optional, defaults to DAO address)
GOVERNANCE_TOKEN_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Stacks Network
STACKS_NETWORK=testnet
STACKS_NODE_URL=https://api.testnet.hiro.so
STACKS_PRIVATE_KEY=your_private_key_here
```

## Security Considerations

1. **Proposal Threshold** - Minimum voting power required to create proposals
2. **Quorum** - Minimum votes required for proposal execution
3. **Voting Period** - Time window for voting (blocks)
4. **Execution Delay** - Time delay before execution after voting ends
5. **Emergency Pause** - Contract owner can pause during vulnerabilities

## Future Enhancements

1. **Quadratic Voting** - Implement quadratic voting to prevent whale domination
2. **Time-weighted Voting** - Voting power based on token lock duration
3. **Proposal Templates** - Pre-defined templates for common proposals
4. **Notification System** - Alert users about new proposals and voting deadlines
5. **Analytics Dashboard** - Detailed analytics on voting patterns and participation
6. **Multi-sig Support** - Enhanced treasury management with multi-sig wallets

## Testing

To test the DAO governance integration:

1. Deploy contracts to Stacks testnet
2. Initialize governance token
3. Create test proposals
4. Vote on proposals
5. Execute successful proposals

## API Documentation

See the API endpoints section above for detailed endpoint documentation. All endpoints return JSON responses with the following structure:

```typescript
{
  success: boolean
  data: T // Response data
  message?: string // Optional message
}
```

## Support

For issues or questions about the DAO governance integration, please refer to:
- Contract documentation: `CONTRACTS_README.md`
- Frontend integration: `FRONTEND_INTEGRATION.md`
- Web3 integration: `WEB3_INTEGRATION.md`
