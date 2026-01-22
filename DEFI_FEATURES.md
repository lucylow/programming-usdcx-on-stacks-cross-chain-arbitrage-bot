# USDCx DeFi Features Documentation

## Overview

This document describes the enhanced DeFi features added to the USDCx ecosystem, including staking, lending, and borrowing capabilities.

## New Smart Contracts

### 1. USDCx Staking Contract (`usdcx-staking.clar`)

A comprehensive staking contract that allows users to lock USDCx tokens for various periods and earn rewards.

#### Features:
- **Flexible Staking Periods**: 30, 90, 180, and 365 days
- **Tiered APY Rates**: 
  - 30 days: 5% APY
  - 90 days: 8% APY
  - 180 days: 12% APY
  - 365 days: 15% APY
- **Reward Calculation**: Block-based interest calculation with proportional rewards
- **Claim Anytime**: Users can claim rewards without unstaking
- **Lock Period Protection**: Tokens are locked until the staking period completes

#### Key Functions:
- `stake(amount, period-blocks)`: Stake USDCx for a specific period
- `unstake(stake-id)`: Unstake after lock period expires
- `claim-rewards(stake-id)`: Claim accumulated rewards
- `get-stake(staker, stake-id)`: Get stake position details
- `calculate-pending-rewards(staker, stake-id)`: Calculate pending rewards

#### Security:
- Role-based access control (governance, pause roles)
- Protocol pause mechanism for emergencies
- Maximum supply limits
- Reentrancy protection

### 2. USDCx Lending Pool Contract (`usdcx-lending.clar`)

A decentralized lending protocol that enables users to supply liquidity and earn interest, or borrow USDCx with collateral.

#### Features:
- **Dynamic Interest Rates**: Rates adjust based on pool utilization
  - Base lending rate: 0.5% per block (~5% APY)
  - Base borrowing rate: 1% per block (~10% APY)
  - Rates increase as utilization approaches 80%
- **Collateralized Borrowing**: 150% collateralization ratio required
- **Real-time Interest Accrual**: Interest calculated per block
- **Utilization-based Pricing**: Higher utilization = higher rates

#### Key Functions:
- `supply(amount)`: Supply USDCx to the lending pool
- `withdraw(amount)`: Withdraw supplied USDCx and interest
- `borrow(amount, collateral-amount)`: Borrow USDCx with collateral
- `repay(amount)`: Repay borrowed amount and interest
- `get-pool-stats()`: Get pool statistics and rates

#### Interest Rate Model:
- Low utilization (<80%): Base rates apply
- High utilization (≥80%): Rates increase dynamically
- Maximum utilization: 95% (prevents over-borrowing)

#### Security:
- Collateral ratio enforcement (150% minimum)
- Utilization limits to prevent pool depletion
- Role-based governance
- Emergency pause functionality

## Backend Services

### USDCxDefiService (`backend/src/blockchain/usdcxDefi.ts`)

A comprehensive TypeScript service for interacting with DeFi contracts.

#### Staking Operations:
```typescript
// Stake USDCx
await defiService.stake(1000, 90) // Stake 1000 USDCx for 90 days

// Get stake position
const position = await defiService.getStakePosition(stakeId)

// Claim rewards
await defiService.claimStakingRewards(stakeId)

// Unstake
await defiService.unstake(stakeId)
```

#### Lending Operations:
```typescript
// Supply to pool
await defiService.supply(5000) // Supply 5000 USDCx

// Withdraw from pool
await defiService.withdraw(2000) // Withdraw 2000 USDCx

// Borrow with collateral
await defiService.borrow(1000, 1500) // Borrow 1000 USDCx with 1500 collateral

// Repay loan
await defiService.repay(1100) // Repay 1100 USDCx (principal + interest)

// Get pool stats
const stats = await defiService.getPoolStats()
```

## Frontend Components

### 1. StakingPanel Component

A React component for managing USDCx staking positions.

**Features:**
- Stake USDCx with period selection
- View active staking positions
- Claim rewards
- Unstake after lock period
- Real-time reward calculations

**Props:**
- `usdcxBalance`: Current USDCx balance
- `onStake`: Callback for staking
- `onUnstake`: Callback for unstaking
- `onClaimRewards`: Callback for claiming rewards
- `positions`: Array of staking positions

### 2. LendingPanel Component

A React component for lending and borrowing operations.

**Features:**
- Supply USDCx to lending pool
- Withdraw supplied funds
- Borrow USDCx with collateral
- Repay loans
- View lending/borrowing positions
- Pool statistics display

**Props:**
- `usdcxBalance`: Current USDCx balance
- `onSupply`, `onWithdraw`, `onBorrow`, `onRepay`: Operation callbacks
- `lendingPosition`: Current lending position
- `borrowingPosition`: Current borrowing position
- `poolStats`: Pool statistics

### 3. DefiDashboard Component

A comprehensive dashboard that combines staking and lending features.

**Features:**
- Overview statistics
- Tabbed interface for staking and lending
- Real-time balance tracking
- Total rewards display

## Error Handling

New error types added:
- `StakingError`: Errors specific to staking operations
- `LendingError`: Errors specific to lending operations

Both extend `BotError` with appropriate error codes and context.

## Usage Example

```typescript
import { USDCxDefiService } from './blockchain/usdcxDefi'
import { StacksClient } from './blockchain/stacksClient'

// Initialize services
const stacksClient = new StacksClient(networkConfig)
const defiService = new USDCxDefiService(stacksClient, {
  stakingContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  lendingContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  usdcxContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
})

// Stake 1000 USDCx for 90 days
const stakeId = await defiService.stake(1000, 90)

// Check position
const position = await defiService.getStakePosition(stakeId)
console.log(`Staked: ${position.amount} USDCx`)
console.log(`Pending rewards: ${position.pendingRewards} USDCx`)

// Supply to lending pool
await defiService.supply(5000)

// Get pool stats
const stats = await defiService.getPoolStats()
console.log(`Pool utilization: ${stats.utilization}%`)
console.log(`Lending APY: ${stats.lendingRate}%`)
```

## Security Considerations

1. **Smart Contract Security**:
   - All contracts use role-based access control
   - Pause mechanisms for emergency stops
   - Reentrancy protection
   - Input validation

2. **Interest Rate Security**:
   - Utilization limits prevent over-borrowing
   - Collateral ratios enforced
   - Dynamic rate adjustments prevent manipulation

3. **User Protection**:
   - Lock periods prevent premature unstaking
   - Minimum collateral ratios protect lenders
   - Clear error messages for failed operations

## Future Enhancements

Potential improvements:
1. **Yield Aggregator**: Auto-compound rewards across multiple strategies
2. **Liquidity Mining**: Additional rewards for early adopters
3. **Governance Token**: DAO governance for protocol parameters
4. **Flash Loans**: Enable flash loan functionality
5. **Multi-Collateral**: Support for additional collateral types
6. **Insurance Pool**: Risk mitigation through insurance funds

## Testing

Contracts should be tested with:
- Clarinet test framework
- Edge cases (zero amounts, max values, etc.)
- Interest calculation accuracy
- Collateral ratio enforcement
- Emergency pause scenarios

## Deployment

1. Deploy USDCx token contract (if not already deployed)
2. Deploy staking contract
3. Deploy lending contract
4. Grant MINT_ROLE to staking contract
5. Grant MINT_ROLE to lending contract
6. Initialize contracts with governance roles
7. Fund reward pools (for staking)

## API Integration

The backend service can be integrated with REST APIs:

```
POST /api/defi/stake
POST /api/defi/unstake
POST /api/defi/claim-rewards
GET /api/defi/staking-positions
POST /api/defi/supply
POST /api/defi/withdraw
POST /api/defi/borrow
POST /api/defi/repay
GET /api/defi/pool-stats
```

## Conclusion

These DeFi features significantly enhance the USDCx ecosystem by providing:
- **Yield Generation**: Multiple ways to earn on USDCx holdings
- **Capital Efficiency**: Borrowing against collateral
- **Flexibility**: Various staking periods and lending options
- **Security**: Robust smart contracts with multiple safety mechanisms

The implementation follows best practices for DeFi protocols and provides a solid foundation for future enhancements.

