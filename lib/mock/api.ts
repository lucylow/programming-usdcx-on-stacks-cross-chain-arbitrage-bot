import {
  mockUsers,
  mockTransactions,
  mockOpportunities,
  mockPrices,
  mockBotStats,
  daoUsers,
  daoProposals,
  daoVotes,
  nftCollections,
  nftTokens,
  nftListings,
  treasuryTransactions,
  daoMetrics,
  metricsHistory,
} from "./data"
import type {
  MockUser,
  MockTransaction,
  MockArbitrageOpportunity,
  MockPriceData,
  MockBotStats,
  TxStatus,
  Principal,
  Proposal,
  Vote,
  NFTCollection,
  NFTToken,
  NFTListing,
  TreasuryTransaction,
  DAOMetrics,
} from "./types"

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface TxFilter {
  search?: string
  status?: TxStatus | "all"
  userId?: string
  direction?: "deposit" | "withdraw" | "internal" | "all"
}

export interface OpportunityFilter {
  status?: "active" | "executing" | "completed" | "expired" | "all"
  sourceChain?: "ethereum" | "stacks" | "all"
  minSpread?: number
}

// Users API
export async function fetchUsers(): Promise<MockUser[]> {
  await delay(400)
  return [...mockUsers]
}

export async function fetchUserById(id: string): Promise<MockUser | null> {
  await delay(300)
  return mockUsers.find((u) => u.id === id) ?? null
}

// Transactions API
export async function fetchTransactions(
  page: number,
  pageSize: number,
  filter: TxFilter = {},
): Promise<ListResponse<MockTransaction>> {
  await delay(500)

  let items = [...mockTransactions]

  if (filter.status && filter.status !== "all") {
    items = items.filter((tx) => tx.status === filter.status)
  }

  if (filter.direction && filter.direction !== "all") {
    items = items.filter((tx) => tx.direction === filter.direction)
  }

  if (filter.userId) {
    items = items.filter((tx) => tx.userId === filter.userId)
  }

  if (filter.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase()
    items = items.filter(
      (tx) =>
        tx.hash.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        mockUsers
          .find((u) => u.id === tx.userId)
          ?.name.toLowerCase()
          .includes(q),
    )
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    data: items.slice(start, end),
    total,
    page,
    pageSize,
  }
}

export async function fetchTransactionById(id: string): Promise<MockTransaction | null> {
  await delay(300)
  return mockTransactions.find((tx) => tx.id === id) ?? null
}

// Opportunities API
export async function fetchOpportunities(
  page: number,
  pageSize: number,
  filter: OpportunityFilter = {},
): Promise<ListResponse<MockArbitrageOpportunity>> {
  await delay(400)

  let items = [...mockOpportunities]

  if (filter.status && filter.status !== "all") {
    items = items.filter((opp) => opp.status === filter.status)
  }

  if (filter.sourceChain && filter.sourceChain !== "all") {
    items = items.filter((opp) => opp.sourceChain === filter.sourceChain)
  }

  if (filter.minSpread !== undefined) {
    items = items.filter((opp) => opp.spread >= filter.minSpread!)
  }

  // Sort by detected time descending
  items.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())

  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    data: items.slice(start, end),
    total,
    page,
    pageSize,
  }
}

export async function fetchOpportunityById(id: string): Promise<MockArbitrageOpportunity | null> {
  await delay(300)
  return mockOpportunities.find((opp) => opp.id === id) ?? null
}

// Prices API
export async function fetchPrices(chain?: "ethereum" | "stacks"): Promise<MockPriceData[]> {
  await delay(350)

  let items = [...mockPrices]

  if (chain) {
    items = items.filter((p) => p.chain === chain)
  }

  return items
}

export async function fetchPriceByPair(chain: string, pair: string): Promise<MockPriceData | null> {
  await delay(250)
  return mockPrices.find((p) => p.chain === chain && p.pair === pair) ?? null
}

// Bot Stats API
export async function fetchBotStats(): Promise<MockBotStats> {
  await delay(300)
  return { ...mockBotStats }
}

// Simulate real-time price updates
export function subscribeToRealTimePrices(callback: (prices: MockPriceData[]) => void, intervalMs = 2000): () => void {
  const interval = setInterval(() => {
    const updatedPrices = mockPrices.map((price) => ({
      ...price,
      price: price.price * (1 + (Math.random() * 0.02 - 0.01)),
      change24h: price.change24h + (Math.random() * 0.5 - 0.25),
      updatedAt: new Date().toISOString(),
    }))
    callback(updatedPrices)
  }, intervalMs)

  return () => clearInterval(interval)
}

// Simulate real-time opportunity detection
export function subscribeToOpportunities(
  callback: (opportunity: MockArbitrageOpportunity) => void,
  intervalMs = 5000,
): () => void {
  const chains = ["ethereum", "stacks"] as const
  const dexes = { ethereum: ["Uniswap V3", "Curve", "Balancer"], stacks: ["ALEX", "Arkadiko"] }
  const pairs = ["USDC/ETH", "USDCx/STX", "USDC/USDT", "STX/USDC"]

  const interval = setInterval(() => {
    const sourceChain = chains[Math.floor(Math.random() * chains.length)]
    const targetChain = sourceChain === "ethereum" ? "stacks" : "ethereum"
    const sourceDex = dexes[sourceChain][Math.floor(Math.random() * dexes[sourceChain].length)]
    const targetDex = dexes[targetChain][Math.floor(Math.random() * dexes[targetChain].length)]
    const spread = 0.5 + Math.random() * 2.5

    const newOpportunity: MockArbitrageOpportunity = {
      id: `opp_${Date.now()}`,
      sourceChain,
      targetChain,
      sourceDex,
      targetDex,
      tokenPair: pairs[Math.floor(Math.random() * pairs.length)],
      spread,
      expectedProfit: spread * 100,
      confidence: 0.7 + Math.random() * 0.25,
      status: "active",
      detectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }

    callback(newOpportunity)
  }, intervalMs)

  return () => clearInterval(interval)
}

export async function fetchDAOUsers(
  page = 1,
  pageSize = 20,
  role?: Principal["role"],
): Promise<ListResponse<Principal>> {
  await delay(400)

  let items = [...daoUsers]

  if (role) {
    items = items.filter((u) => u.role === role)
  }

  items.sort((a, b) => b.votingPower - a.votingPower)

  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return { data: items.slice(start, end), total, page, pageSize }
}

export async function fetchDAOUserByAddress(address: string): Promise<Principal | null> {
  await delay(300)
  return daoUsers.find((u) => u.address === address) ?? null
}

export interface ProposalFilter {
  status?: Proposal["status"] | "all"
  proposalType?: Proposal["proposalType"] | "all"
  proposer?: string
  search?: string
}

export async function fetchProposals(
  page = 1,
  pageSize = 10,
  filter: ProposalFilter = {},
): Promise<ListResponse<Proposal>> {
  await delay(500)

  let items = [...daoProposals]

  if (filter.status && filter.status !== "all") {
    items = items.filter((p) => p.status === filter.status)
  }

  if (filter.proposalType && filter.proposalType !== "all") {
    items = items.filter((p) => p.proposalType === filter.proposalType)
  }

  if (filter.proposer) {
    items = items.filter((p) => p.proposer === filter.proposer)
  }

  if (filter.search) {
    const q = filter.search.toLowerCase()
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return { data: items.slice(start, end), total, page, pageSize }
}

export async function fetchProposalById(id: string): Promise<Proposal | null> {
  await delay(300)
  return daoProposals.find((p) => p.id === id) ?? null
}

export async function fetchVotesForProposal(proposalId: string): Promise<Vote[]> {
  await delay(400)
  return daoVotes.filter((v) => v.proposalId === proposalId)
}

export async function fetchNFTCollections(page = 1, pageSize = 10): Promise<ListResponse<NFTCollection>> {
  await delay(400)

  const items = [...nftCollections].sort((a, b) => b.volume24h - a.volume24h)
  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return { data: items.slice(start, end), total, page, pageSize }
}

export async function fetchNFTCollectionById(id: string): Promise<NFTCollection | null> {
  await delay(300)
  return nftCollections.find((c) => c.id === id) ?? null
}

export async function fetchNFTTokens(
  collectionId?: string,
  owner?: string,
  page = 1,
  pageSize = 20,
): Promise<ListResponse<NFTToken>> {
  await delay(450)

  let items = [...nftTokens]

  if (collectionId) {
    items = items.filter((t) => t.collectionId === collectionId)
  }

  if (owner) {
    items = items.filter((t) => t.owner === owner)
  }

  items.sort((a, b) => a.rank - b.rank)

  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return { data: items.slice(start, end), total, page, pageSize }
}

export async function fetchNFTListings(
  status?: NFTListing["status"],
  listingType?: NFTListing["listingType"],
  page = 1,
  pageSize = 20,
): Promise<ListResponse<NFTListing>> {
  await delay(400)

  let items = [...nftListings]

  if (status) {
    items = items.filter((l) => l.status === status)
  }

  if (listingType) {
    items = items.filter((l) => l.listingType === listingType)
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return { data: items.slice(start, end), total, page, pageSize }
}

export interface TreasuryFilter {
  type?: TreasuryTransaction["type"] | "all"
  status?: TreasuryTransaction["status"] | "all"
  category?: TreasuryTransaction["category"] | "all"
  minAmount?: number
  maxAmount?: number
}

export async function fetchTreasuryTransactions(
  page = 1,
  pageSize = 20,
  filter: TreasuryFilter = {},
): Promise<ListResponse<TreasuryTransaction>> {
  await delay(450)

  let items = [...treasuryTransactions]

  if (filter.type && filter.type !== "all") {
    items = items.filter((t) => t.type === filter.type)
  }

  if (filter.status && filter.status !== "all") {
    items = items.filter((t) => t.status === filter.status)
  }

  if (filter.category && filter.category !== "all") {
    items = items.filter((t) => t.category === filter.category)
  }

  if (filter.minAmount !== undefined) {
    items = items.filter((t) => t.amount >= filter.minAmount!)
  }

  if (filter.maxAmount !== undefined) {
    items = items.filter((t) => t.amount <= filter.maxAmount!)
  }

  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return { data: items.slice(start, end), total, page, pageSize }
}

export async function fetchTreasuryMetrics(): Promise<DAOMetrics> {
  await delay(300)
  return { ...daoMetrics }
}

export async function fetchMetricsHistory(days = 30): Promise<DAOMetrics[]> {
  await delay(400)
  return metricsHistory.slice(-days)
}

export function subscribeToProposals(callback: (proposal: Proposal) => void, intervalMs = 30000): () => void {
  const statuses: Proposal["status"][] = ["pending", "active", "passed", "failed"]

  const interval = setInterval(() => {
    // Simulate proposal status changes
    const randomProposal = daoProposals[Math.floor(Math.random() * daoProposals.length)]
    const updatedProposal = {
      ...randomProposal,
      forVotes: randomProposal.forVotes + Math.floor(Math.random() * 10000),
      againstVotes: randomProposal.againstVotes + Math.floor(Math.random() * 5000),
      voterCount: randomProposal.voterCount + Math.floor(Math.random() * 5),
    }
    callback(updatedProposal)
  }, intervalMs)

  return () => clearInterval(interval)
}

export function subscribeToTreasury(
  callback: (transaction: TreasuryTransaction) => void,
  intervalMs = 20000,
): () => void {
  const types: TreasuryTransaction["type"][] = ["deposit", "withdrawal", "income", "expense"]

  const interval = setInterval(() => {
    const newTx: TreasuryTransaction = {
      id: `tx-${Date.now().toString(16)}`,
      type: types[Math.floor(Math.random() * types.length)],
      amount: Math.floor(Math.random() * 10000) + 100,
      currency: "STX",
      from: daoUsers[Math.floor(Math.random() * daoUsers.length)].address,
      to: "treasury",
      description: "New transaction",
      status: "completed",
      timestamp: new Date().toISOString(),
      transactionHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      category: ["grants", "operations", "development"][
        Math.floor(Math.random() * 3)
      ] as TreasuryTransaction["category"],
    }
    callback(newTx)
  }, intervalMs)

  return () => clearInterval(interval)
}
