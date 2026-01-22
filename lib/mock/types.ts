export type TxStatus = "pending" | "completed" | "failed"

export interface MockUser {
  id: string
  name: string
  avatarUrl: string
  country: string
  joinedAt: string
  isPremium: boolean
}

export interface MockTransaction {
  id: string
  userId: string
  amount: number
  status: TxStatus
  createdAt: string
  hash: string
  direction: "deposit" | "withdraw" | "internal"
  privacyScore: number
}

export interface MockArbitrageOpportunity {
  id: string
  sourceChain: "ethereum" | "stacks"
  targetChain: "ethereum" | "stacks"
  sourceDex: string
  targetDex: string
  tokenPair: string
  spread: number
  expectedProfit: number
  confidence: number
  status: "active" | "executing" | "completed" | "expired"
  detectedAt: string
  expiresAt: string
}

export interface MockPriceData {
  id: string
  chain: "ethereum" | "stacks"
  dex: string
  pair: string
  price: number
  volume24h: number
  liquidity: number
  change24h: number
  updatedAt: string
}

export interface MockBotStats {
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  totalProfit: number
  totalVolume: number
  avgProfitPerTrade: number
  winRate: number
  uptime: number
  lastTradeAt: string
}

export interface Principal {
  address: string
  username: string
  stxBalance: number
  role: "member" | "delegate" | "admin" | "voter" | "creator"
  joinedAt: string
  votingPower: number
  delegator?: string
  metadata: {
    bio?: string
    avatar?: string
    socials?: {
      twitter?: string
      github?: string
      discord?: string
    }
  }
}

export interface GovernanceToken {
  id: string
  name: string
  symbol: string
  totalSupply: number
  decimals: number
  holders: Record<string, number>
  distribution: {
    team: number
    treasury: number
    community: number
    investors: number
    airdrop: number
  }
}

export interface ProposalAction {
  type: "transfer" | "contract-call" | "parameter-change" | "role-change"
  target: string
  value?: number
  calldata?: Record<string, unknown>
  description: string
}

export interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  status: "pending" | "active" | "passed" | "failed" | "executed" | "cancelled"
  proposalType: "treasury" | "parameter" | "membership" | "emergency" | "informational"
  createdAt: string
  votingStarts: string
  votingEnds: string
  executionDelay: number
  forVotes: number
  againstVotes: number
  abstainVotes: number
  quorum: number
  threshold: number
  executedAt?: string
  executor?: string
  executionHash?: string
  actions: ProposalAction[]
  tags: string[]
  discussionUrl?: string
  ipfsHash?: string
  voterCount: number
  totalVotingPower: number
  participationRate: number
}

export interface Vote {
  proposalId: string
  voter: string
  votingPower: number
  support: "for" | "against" | "abstain"
  reason?: string
  votedAt: string
  delegatedFrom?: string
  weight: number
}

export interface NFTCollection {
  id: string
  name: string
  symbol: string
  description: string
  creator: string
  totalSupply: number
  mintPrice: number
  royaltyPercentage: number
  royaltyRecipient: string
  metadata: {
    contractUri: string
    baseUri: string
    externalUrl?: string
  }
  traits: Record<string, string[]>
  floorPrice: number
  volume24h: number
}

export interface NFTToken {
  id: number
  collectionId: string
  owner: string
  creator: string
  tokenUri: string
  metadata: {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string
      rarity?: number
    }>
    animation_url?: string
    external_url?: string
  }
  rarityScore: number
  rank: number
  mintedAt: string
  lastSoldAt?: string
  lastSalePrice?: number
}

export interface NFTListing {
  id: string
  tokenId: number
  collectionId: string
  seller: string
  price: number
  currency: "STX" | "token" | "USD"
  status: "active" | "sold" | "cancelled"
  listingType: "fixed" | "auction"
  auction?: {
    startPrice: number
    reservePrice: number
    highestBid?: number
    highestBidder?: string
    startTime: string
    endTime: string
    bidIncrement: number
    bidHistory: Bid[]
  }
  offers: Offer[]
  createdAt: string
  expiresAt?: string
}

export interface Bid {
  bidder: string
  amount: number
  timestamp: string
  status: "active" | "outbid" | "won" | "cancelled"
}

export interface Offer {
  offerer: string
  amount: number
  currency: string
  expiresAt: string
  createdAt: string
}

export interface TreasuryTransaction {
  id: string
  type: "deposit" | "withdrawal" | "transfer" | "income" | "expense"
  amount: number
  currency: string
  from: string
  to: string
  description: string
  proposalId?: string
  status: "pending" | "completed" | "failed" | "cancelled"
  timestamp: string
  transactionHash?: string
  category: "grants" | "operations" | "marketing" | "development" | "other"
}

export interface DAOMetrics {
  timestamp: string
  totalMembers: number
  activeVoters: number
  totalProposals: number
  proposalSuccessRate: number
  treasuryBalance: number
  nftVolume: number
  avgVotingParticipation: number
  tokenDistribution: {
    whales: number
    dolphins: number
    fish: number
  }
}

export interface Delegation {
  delegator: string
  delegatee: string
  amount: number
  startedAt: string
  expiresAt?: string
  votingPower: number
}
