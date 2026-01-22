import type { TreasuryTransaction, DAOMetrics } from "../types"

let seed = 11111
function seededRandom(): number {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const descriptions = {
  deposit: [
    "Protocol fee collection",
    "NFT marketplace royalties",
    "Bridge fee revenue",
    "Staking rewards distribution",
    "Community donation",
  ],
  withdrawal: [
    "Grant disbursement",
    "Operational expenses",
    "Marketing campaign",
    "Security audit payment",
    "Infrastructure costs",
  ],
  transfer: [
    "Multi-sig rebalancing",
    "Emergency fund allocation",
    "Investment transfer",
    "Partner payment",
    "Liquidity provision",
  ],
  income: [
    "Trading fee revenue",
    "Premium subscription",
    "Partnership deal",
    "Token sale proceeds",
    "Yield farming returns",
  ],
  expense: ["Developer salaries", "Cloud hosting", "Legal consultation", "Marketing services", "Community rewards"],
}

const categories: TreasuryTransaction["category"][] = ["grants", "operations", "marketing", "development", "other"]

export class TreasuryGenerator {
  generateTransaction(fromAddress: string, toAddress: string, proposalId?: string): TreasuryTransaction {
    const types: TreasuryTransaction["type"][] = ["deposit", "withdrawal", "transfer", "income", "expense"]
    const type = types[Math.floor(seededRandom() * types.length)]
    const desc = descriptions[type]

    const timestamp = new Date(Date.now() - Math.floor(seededRandom() * 90 * 24 * 60 * 60 * 1000))

    return {
      id: `tx-${Math.floor(seededRandom() * 1000000)
        .toString(16)
        .padStart(8, "0")}`,
      type,
      amount: Math.floor(seededRandom() * 100000) + 100,
      currency: "STX",
      from: type === "deposit" || type === "income" ? fromAddress : "treasury",
      to: type === "withdrawal" || type === "expense" ? toAddress : "treasury",
      description: desc[Math.floor(seededRandom() * desc.length)],
      proposalId: seededRandom() > 0.6 ? proposalId : undefined,
      status: ["pending", "completed", "failed", "cancelled"][
        Math.floor(seededRandom() * 4)
      ] as TreasuryTransaction["status"],
      timestamp: timestamp.toISOString(),
      transactionHash: `0x${Array.from({ length: 64 }, () => Math.floor(seededRandom() * 16).toString(16)).join("")}`,
      category: categories[Math.floor(seededRandom() * categories.length)],
    }
  }

  generateTransactionBatch(count: number, addresses: string[], proposalIds: string[]): TreasuryTransaction[] {
    const transactions: TreasuryTransaction[] = []

    for (let i = 0; i < count; i++) {
      const from = addresses[Math.floor(seededRandom() * addresses.length)]
      const to = addresses[Math.floor(seededRandom() * addresses.length)]
      const proposalId = seededRandom() > 0.7 ? proposalIds[Math.floor(seededRandom() * proposalIds.length)] : undefined

      transactions.push(this.generateTransaction(from, to, proposalId))
    }

    // Sort by timestamp descending
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return transactions
  }

  generateMetrics(memberCount: number, proposalCount: number): DAOMetrics {
    const totalBalance = Math.floor(seededRandom() * 5000000) + 500000

    return {
      timestamp: new Date().toISOString(),
      totalMembers: memberCount,
      activeVoters: Math.floor(memberCount * (0.3 + seededRandom() * 0.4)),
      totalProposals: proposalCount,
      proposalSuccessRate: 0.6 + seededRandom() * 0.3,
      treasuryBalance: totalBalance,
      nftVolume: Math.floor(seededRandom() * 500000) + 50000,
      avgVotingParticipation: 0.2 + seededRandom() * 0.5,
      tokenDistribution: {
        whales: Math.floor(memberCount * 0.05),
        dolphins: Math.floor(memberCount * 0.15),
        fish: Math.floor(memberCount * 0.8),
      },
    }
  }

  generateMetricsHistory(days: number, memberCount: number, proposalCount: number): DAOMetrics[] {
    const history: DAOMetrics[] = []

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const metrics = this.generateMetrics(memberCount, proposalCount)
      metrics.timestamp = date.toISOString()

      // Add some variance
      metrics.treasuryBalance = Math.floor(metrics.treasuryBalance * (0.95 + seededRandom() * 0.1))
      metrics.activeVoters = Math.floor(metrics.activeVoters * (0.9 + seededRandom() * 0.2))

      history.push(metrics)
    }

    return history
  }
}

export const treasuryGenerator = new TreasuryGenerator()
