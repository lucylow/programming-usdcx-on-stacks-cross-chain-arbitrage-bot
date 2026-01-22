export { userGenerator, UserGenerator } from "./users"
export { proposalGenerator, ProposalGenerator } from "./proposals"
export { nftGenerator, NFTGenerator } from "./nfts"
export { treasuryGenerator, TreasuryGenerator } from "./treasury"

import { userGenerator } from "./users"
import { proposalGenerator } from "./proposals"
import { nftGenerator } from "./nfts"
import { treasuryGenerator } from "./treasury"
import type {
  Principal,
  Proposal,
  Vote,
  NFTCollection,
  NFTToken,
  NFTListing,
  TreasuryTransaction,
  DAOMetrics,
} from "../types"

export interface GeneratedMockData {
  users: Principal[]
  proposals: Proposal[]
  votes: Vote[]
  nftCollections: NFTCollection[]
  nftTokens: NFTToken[]
  nftListings: NFTListing[]
  treasuryTransactions: TreasuryTransaction[]
  daoMetrics: DAOMetrics
  metricsHistory: DAOMetrics[]
}

export function generateFullMockDataset(
  config: {
    userCount?: number
    proposalCount?: number
    nftCollectionCount?: number
    tokensPerCollection?: number
    treasuryTxCount?: number
    metricsHistoryDays?: number
  } = {},
): GeneratedMockData {
  const {
    userCount = 50,
    proposalCount = 20,
    nftCollectionCount = 5,
    tokensPerCollection = 20,
    treasuryTxCount = 50,
    metricsHistoryDays = 30,
  } = config

  // Generate users
  const users = userGenerator.generateUserBatch(userCount)
  const userAddresses = users.map((u) => u.address)

  // Generate proposals and votes
  const proposals = proposalGenerator.generateProposalBatch(proposalCount, userAddresses, userAddresses)
  const votes: Vote[] = []
  for (const proposal of proposals) {
    votes.push(...proposalGenerator.generateVotes(proposal, userAddresses))
  }

  // Generate NFTs
  const nftCollections = nftGenerator.generateCollectionBatch(nftCollectionCount, userAddresses)
  const nftTokens: NFTToken[] = []
  const nftListings: NFTListing[] = []

  for (const collection of nftCollections) {
    const tokens = nftGenerator.generateTokenBatch(collection, tokensPerCollection, userAddresses)
    nftTokens.push(...tokens)

    // Create listings for some tokens
    for (const token of tokens.slice(0, Math.floor(tokensPerCollection * 0.3))) {
      nftListings.push(nftGenerator.generateListing(token, token.owner))
    }
  }

  // Generate treasury data
  const proposalIds = proposals.map((p) => p.id)
  const treasuryTransactions = treasuryGenerator.generateTransactionBatch(treasuryTxCount, userAddresses, proposalIds)

  // Generate metrics
  const daoMetrics = treasuryGenerator.generateMetrics(userCount, proposalCount)
  const metricsHistory = treasuryGenerator.generateMetricsHistory(metricsHistoryDays, userCount, proposalCount)

  return {
    users,
    proposals,
    votes,
    nftCollections,
    nftTokens,
    nftListings,
    treasuryTransactions,
    daoMetrics,
    metricsHistory,
  }
}
