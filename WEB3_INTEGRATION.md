# Web3 Integration Guide

## Overview

This document describes the Web3 integration for the Cross-Chain Arbitrage Bot, including Stacks blockchain connectivity, USDCx token interactions, and cross-chain bridge operations.

## Architecture

### Smart Contracts (Clarity)

#### 1. USDCx Token Contract (`usdcx-token.clar`)

SIP-010 compliant fungible token with role-based access control.

**Key Features:**
- Standard token operations (transfer, balance, supply)
- Role-based permissions (governance, mint, pause)
- Protocol-level mint/burn functions
- Pause mechanism for emergency stops

**Roles:**
- `GOVERNANCE-ROLE`: Full admin access
- `MINT-ROLE`: Can mint and burn tokens
- `PAUSE-ROLE`: Can pause/unpause protocol

#### 2. USDCx Bridge Contract (`usdcx-bridge.clar`)

Handles cross-chain operations between Ethereum and Stacks.

**Key Features:**
- Attestation-based minting after Ethereum deposits
- Withdrawal request tracking
- Replay attack prevention
- Event emission for off-chain attestation services

### Frontend Integration (TypeScript)

#### Stacks Wallet Service

Located in `lib/web3/stacks-wallet.ts`

**Key Methods:**
- `connectWallet()`: Initiates wallet connection via Hiro Wallet
- `transferUSDCx()`: Send USDCx tokens
- `getUSDCxBalance()`: Check wallet balance
- `initiateWithdrawal()`: Start cross-chain withdrawal
- `getTransactionStatus()`: Monitor transaction confirmation

#### React Components

**StacksWalletConnect** (`components/wallet/StacksWalletConnect.tsx`)
- Wallet connection UI
- Balance display
- Address management
- Transaction monitoring

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install @stacks/connect @stacks/transactions @stacks/network @stacks/encryption
npm install @noble/hashes buffer
\`\`\`

### 2. Configure Environment Variables

\`\`\`env
# Frontend (.env.local)
NEXT_PUBLIC_USDCX_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_BRIDGE_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_STACKS_NETWORK=testnet
\`\`\`

### 3. Deploy Clarity Contracts

\`\`\`bash
# Install Clarinet
brew install clarinet

# Initialize project
clarinet new usdcx-contracts
cd usdcx-contracts

# Copy contracts
cp backend/contracts/stacks/*.clar contracts/

# Test contracts
clarinet test

# Deploy to testnet
clarinet deployments apply -p deployments/testnet
\`\`\`

## Usage Examples

### Connect Wallet

\`\`\`typescript
import { getStacksWalletService } from '@/lib/web3/stacks-wallet'

const walletService = getStacksWalletService()

// Connect
const state = await walletService.connectWallet()
console.log('Connected:', state.address)
\`\`\`

### Check Balance

\`\`\`typescript
const balance = await walletService.getUSDCxBalance(
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
)
console.log('Balance:', balance, 'USDCx')
\`\`\`

### Transfer Tokens

\`\`\`typescript
const txId = await walletService.transferUSDCx(
  100, // amount
  'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // recipient
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' // contract address
)
console.log('Transaction:', txId)
\`\`\`

### Initiate Withdrawal

\`\`\`typescript
const txId = await walletService.initiateWithdrawal(
  50, // amount
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Ethereum address
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' // contract address
)
console.log('Withdrawal initiated:', txId)
\`\`\`

## Security Considerations

1. **Private Keys**: Never expose private keys in frontend code
2. **Attestation Verification**: Bridge operations require valid Circle attestations
3. **Replay Protection**: Bridge contract prevents double-spending via attestation tracking
4. **Role Management**: Only authorized addresses can mint/burn tokens
5. **Pause Mechanism**: Emergency stop for security incidents

## Testing

### Local Development

\`\`\`bash
# Start Clarinet console
clarinet console

# Test token transfer
(contract-call? .usdcx-token transfer u1000000 tx-sender 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG none)

# Check balance
(contract-call? .usdcx-token get-balance tx-sender)
\`\`\`

### Integration Tests

\`\`\`typescript
// tests/web3/wallet.test.ts
describe('Stacks Wallet Integration', () => {
  it('should connect wallet', async () => {
    const state = await walletService.connectWallet()
    expect(state.isConnected).toBe(true)
  })

  it('should fetch balance', async () => {
    const balance = await walletService.getUSDCxBalance(CONTRACT_ADDRESS)
    expect(balance).toBeGreaterThanOrEqual(0)
  })
})
\`\`\`

## Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language Reference](https://docs.stacks.co/clarity/)
- [Hiro Wallet](https://wallet.hiro.so/)
- [Circle xReserve](https://www.circle.com/xreserve)
