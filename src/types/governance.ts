/**
 * Governance Type Definitions
 * Shared types for DAO governance across frontend and backend
 */

export enum ProposalState {
  Pending = 0x00,
  Active = 0x01,
  Executed = 0x02,
  Cancelled = 0x03,
}

export enum VoteSupport {
  Against = 0x00,
  For = 0x01,
  Abstain = 0x02,
}

export interface Proposal {
  id: number
  creator: string
  title: string
  description: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
  createdAt: number
  executedAt?: number
  state: ProposalState
  targetContract: string
  functionName: string
  calldata: string[]
  // Computed fields
  totalVotes?: number
  supportPercentage?: number
  timeRemaining?: number
  canExecute?: boolean
  canVote?: boolean
}

export interface Vote {
  proposalId: number
  voter: string
  amount: number
  support: VoteSupport
  votedAt: number
}

export interface GovernanceTokenInfo {
  balance: number
  votingPower: number
  delegatedTo?: string
  lockedAmount?: number
  lockedUntil?: number
}

export interface TreasuryStats {
  balance: number
  totalDeposits: number
  totalWithdrawals: number
}

export interface ProposalFormData {
  title: string
  description: string
  targetContract: string
  functionName: string
  calldata: string[]
}

export interface VoteFormData {
  proposalId: number
  support: VoteSupport
  votingPower: number
}

export interface DelegationFormData {
  delegatee: string
}

/**
 * Proposal type categories
 */
export enum ProposalType {
  ParameterChange = "parameter-change",
  Treasury = "treasury",
  Membership = "membership",
  Emergency = "emergency",
  Upgrade = "upgrade",
}

/**
 * Proposal status for UI display
 */
export type ProposalStatus = "draft" | "active" | "passed" | "rejected" | "executed" | "expired"

export function getProposalStatus(proposal: Proposal, currentBlock?: number): ProposalStatus {
  if (proposal.state === ProposalState.Executed) {
    return "executed"
  }
  if (proposal.state === ProposalState.Cancelled) {
    return "rejected"
  }
  if (proposal.state === ProposalState.Pending) {
    return "draft"
  }
  if (proposal.state === ProposalState.Active) {
    // Check if voting period has ended
    const votingPeriod = 10080 // blocks (approximately 7 days)
    const voteEnd = proposal.createdAt + votingPeriod
    if (currentBlock && currentBlock > voteEnd) {
      // Check if it passed
      const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
      const quorum = 30000000 // Minimum quorum
      if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
        return "passed"
      }
      return "rejected"
    }
    return "active"
  }
  return "expired"
}

export function formatVoteSupport(support: VoteSupport): string {
  switch (support) {
    case VoteSupport.For:
      return "For"
    case VoteSupport.Against:
      return "Against"
    case VoteSupport.Abstain:
      return "Abstain"
    default:
      return "Unknown"
  }
}

export function formatProposalState(state: ProposalState): string {
  switch (state) {
    case ProposalState.Pending:
      return "Pending"
    case ProposalState.Active:
      return "Active"
    case ProposalState.Executed:
      return "Executed"
    case ProposalState.Cancelled:
      return "Cancelled"
    default:
      return "Unknown"
  }
}
