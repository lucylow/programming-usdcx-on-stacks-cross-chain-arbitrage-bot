import type { Proposal, ProposalAction, Vote } from "../types"

let seed = 54321
function seededRandom(): number {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const proposalTitles = {
  treasury: [
    "Community Grant: DeFi Analytics Dashboard",
    "Treasury Allocation: Q1 2026 Marketing Budget",
    "Grant Proposal: Cross-Chain Bridge Audit",
    "Budget Request: Developer Bounty Program",
    "Funding: Educational Content Series",
    "Treasury Diversification Strategy",
  ],
  parameter: [
    "Increase Voting Period to 10 Days",
    "Reduce Quorum Requirement to 5%",
    "Update Fee Structure for Bridge Operations",
    "Adjust Minimum Stake for Proposals",
    "Modify Execution Delay Parameters",
    "Update Slippage Tolerance Settings",
  ],
  membership: [
    "Add Core Contributor: Security Lead",
    "Delegate Election: Q1 2026",
    "Update Membership Requirements",
    "Community Moderator Appointment",
    "Remove Inactive Delegate",
    "Delegation Policy Amendment",
  ],
  emergency: [
    "Emergency: Pause Bridge Operations",
    "Critical Security Patch Deployment",
    "Emergency Fund Allocation",
    "Protocol Pause Request",
  ],
  informational: [
    "RFC: Future Roadmap Discussion",
    "Temperature Check: New Feature",
    "Community Survey Results",
    "Partnership Announcement",
  ],
}

const tags = [
  "treasury",
  "governance",
  "security",
  "development",
  "marketing",
  "community",
  "partnerships",
  "technical",
  "emergency",
  "grants",
]

export class ProposalGenerator {
  generateProposal(proposer: string, voters: string[], status?: Proposal["status"]): Proposal {
    const types: Proposal["proposalType"][] = ["treasury", "parameter", "membership", "emergency", "informational"]
    const typeWeights = [0.35, 0.25, 0.2, 0.1, 0.1]

    let proposalType: Proposal["proposalType"] = "treasury"
    const rand = seededRandom()
    let cumulative = 0
    for (let i = 0; i < types.length; i++) {
      cumulative += typeWeights[i]
      if (rand <= cumulative) {
        proposalType = types[i]
        break
      }
    }

    const titles = proposalTitles[proposalType]
    const title = titles[Math.floor(seededRandom() * titles.length)]

    const now = Date.now()
    const createdAt = new Date(now - Math.floor(seededRandom() * 30 * 24 * 60 * 60 * 1000))
    const votingStarts = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
    const votingEnds = new Date(votingStarts.getTime() + 7 * 24 * 60 * 60 * 1000)

    const quorum = Math.floor(seededRandom() * 4000000) + 1000000
    const totalVotingPower = Math.floor(seededRandom() * quorum * 8) + quorum * 2

    const forVotes = Math.floor(seededRandom() * quorum * 1.5) + quorum * 0.3
    const againstVotes = Math.floor(seededRandom() * forVotes * 0.8)
    const abstainVotes = Math.floor(seededRandom() * forVotes * 0.2)

    const totalVotes = forVotes + againstVotes + abstainVotes
    const passed = forVotes > againstVotes && totalVotes >= quorum

    const finalStatus = status || this.determineStatus(votingStarts, votingEnds, passed)

    const id = `prop-${Math.floor(seededRandom() * 100000)
      .toString(16)
      .padStart(8, "0")}`

    return {
      id,
      title,
      description: this.generateDescription(proposalType, title),
      proposer,
      status: finalStatus,
      proposalType,
      createdAt: createdAt.toISOString(),
      votingStarts: votingStarts.toISOString(),
      votingEnds: votingEnds.toISOString(),
      executionDelay: Math.floor(seededRandom() * 144) + 24,
      forVotes,
      againstVotes,
      abstainVotes,
      quorum,
      threshold: 51,
      executedAt:
        finalStatus === "executed" ? new Date(votingEnds.getTime() + 48 * 60 * 60 * 1000).toISOString() : undefined,
      executor: finalStatus === "executed" ? voters[Math.floor(seededRandom() * voters.length)] : undefined,
      executionHash:
        finalStatus === "executed"
          ? `0x${Array.from({ length: 64 }, () => Math.floor(seededRandom() * 16).toString(16)).join("")}`
          : undefined,
      actions: this.generateActions(proposalType),
      tags: this.generateTags(proposalType),
      discussionUrl: `https://forum.arbidao.org/t/${id}`,
      ipfsHash: `Qm${Array.from({ length: 44 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(seededRandom() * 62)]).join("")}`,
      voterCount: Math.floor(seededRandom() * voters.length * 0.6) + 10,
      totalVotingPower,
      participationRate: totalVotes / totalVotingPower,
    }
  }

  generateProposalBatch(count: number, proposers: string[], voters: string[]): Proposal[] {
    const proposals: Proposal[] = []
    const statusDistribution: Array<{ status: Proposal["status"]; ratio: number }> = [
      { status: "pending", ratio: 0.1 },
      { status: "active", ratio: 0.25 },
      { status: "passed", ratio: 0.25 },
      { status: "failed", ratio: 0.15 },
      { status: "executed", ratio: 0.2 },
      { status: "cancelled", ratio: 0.05 },
    ]

    for (const { status, ratio } of statusDistribution) {
      const statusCount = Math.floor(count * ratio)
      for (let i = 0; i < statusCount && proposals.length < count; i++) {
        const proposer = proposers[Math.floor(seededRandom() * proposers.length)]
        proposals.push(this.generateProposal(proposer, voters, status))
      }
    }

    while (proposals.length < count) {
      const proposer = proposers[Math.floor(seededRandom() * proposers.length)]
      proposals.push(this.generateProposal(proposer, voters))
    }

    return proposals
  }

  generateVotes(proposal: Proposal, voters: string[]): Vote[] {
    const votes: Vote[] = []
    const voterCount = Math.min(proposal.voterCount, voters.length)
    const selectedVoters = voters.slice(0, voterCount)

    const reasons = [
      "Strong alignment with our roadmap",
      "Good use of treasury funds",
      "Concerned about timeline",
      "Need more details on implementation",
      "Full support for this initiative",
      "Abstaining pending further discussion",
      undefined,
    ]

    for (const voter of selectedVoters) {
      const rand = seededRandom()
      let support: Vote["support"]
      if (rand < 0.6) support = "for"
      else if (rand < 0.85) support = "against"
      else support = "abstain"

      const votedAt = new Date(
        new Date(proposal.votingStarts).getTime() +
          seededRandom() * (new Date(proposal.votingEnds).getTime() - new Date(proposal.votingStarts).getTime()),
      )

      votes.push({
        proposalId: proposal.id,
        voter,
        votingPower: Math.floor(seededRandom() * 100000) + 1000,
        support,
        reason: seededRandom() > 0.5 ? reasons[Math.floor(seededRandom() * reasons.length)] : undefined,
        votedAt: votedAt.toISOString(),
        delegatedFrom: seededRandom() > 0.8 ? voters[Math.floor(seededRandom() * voters.length)] : undefined,
        weight: 1,
      })
    }

    return votes
  }

  private determineStatus(votingStarts: Date, votingEnds: Date, passed: boolean): Proposal["status"] {
    const now = Date.now()
    if (now < votingStarts.getTime()) return "pending"
    if (now < votingEnds.getTime()) return "active"
    return passed ? "passed" : "failed"
  }

  private generateDescription(type: Proposal["proposalType"], title: string): string {
    let desc = `# ${title}\n\n`
    desc += `## Summary\n\nThis proposal aims to improve the ArbiDAO ecosystem through targeted initiatives.\n\n`
    desc += `## Motivation\n\nAs our community grows, we need to adapt our governance and treasury management to meet new challenges.\n\n`

    if (type === "treasury") {
      const amount = Math.floor(seededRandom() * 50000) + 5000
      desc += `## Budget\n\n| Category | Amount (STX) |\n|----------|-------------|\n`
      desc += `| Development | ${Math.floor(amount * 0.6)} |\n`
      desc += `| Marketing | ${Math.floor(amount * 0.25)} |\n`
      desc += `| Operations | ${Math.floor(amount * 0.15)} |\n`
      desc += `| **Total** | **${amount}** |\n\n`
    }

    desc += `## Implementation\n\nThe implementation will follow standard DAO procedures with milestone-based releases.\n\n`
    desc += `## Timeline\n\n- Week 1-2: Planning and setup\n- Week 3-6: Development\n- Week 7-8: Testing and deployment\n`

    return desc
  }

  private generateActions(type: Proposal["proposalType"]): ProposalAction[] {
    const actions: ProposalAction[] = []

    switch (type) {
      case "treasury":
        actions.push({
          type: "transfer",
          target: `SP${Array.from({ length: 39 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(seededRandom() * 36)]).join("")}`,
          value: Math.floor(seededRandom() * 50000) + 5000,
          description: "Grant payment to recipient",
        })
        break
      case "parameter":
        actions.push({
          type: "parameter-change",
          target: "governance-config",
          calldata: {
            parameter: ["voting_period", "quorum", "threshold"][Math.floor(seededRandom() * 3)],
            newValue: Math.floor(seededRandom() * 100) + 1,
          },
          description: "Update governance parameter",
        })
        break
      case "membership":
        actions.push({
          type: "role-change",
          target: `SP${Array.from({ length: 39 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(seededRandom() * 36)]).join("")}`,
          calldata: {
            role: ["admin", "delegate", "moderator"][Math.floor(seededRandom() * 3)],
            action: ["add", "remove"][Math.floor(seededRandom() * 2)],
          },
          description: "Update member role",
        })
        break
      case "emergency":
        actions.push({
          type: "contract-call",
          target: "emergency-multisig",
          calldata: {
            function: "pause_protocol",
            duration: Math.floor(seededRandom() * 168) + 24,
          },
          description: "Emergency protocol action",
        })
        break
    }

    return actions
  }

  private generateTags(type: Proposal["proposalType"]): string[] {
    const baseTags = [type]
    const additionalTags = tags.filter((t) => t !== type)
    const numExtra = Math.floor(seededRandom() * 3) + 1

    for (let i = 0; i < numExtra; i++) {
      const tag = additionalTags[Math.floor(seededRandom() * additionalTags.length)]
      if (!baseTags.includes(tag)) baseTags.push(tag)
    }

    return baseTags
  }
}

export const proposalGenerator = new ProposalGenerator()
