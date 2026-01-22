import type { Principal, GovernanceToken } from "../types"

// Seeded random for deterministic generation
let seed = 12345
function seededRandom(): number {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

function resetSeed(newSeed = 12345): void {
  seed = newSeed
}

const firstNames = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Eve",
  "Frank",
  "Grace",
  "Henry",
  "Iris",
  "Jack",
  "Kate",
  "Liam",
  "Maya",
  "Noah",
  "Olivia",
  "Peter",
  "Quinn",
  "Ruby",
  "Sam",
  "Tara",
  "Uma",
  "Victor",
  "Wendy",
  "Xavier",
  "Yuki",
  "Zara",
  "Ada",
  "Satoshi",
  "Vitalik",
  "Gavin",
]

const lastNames = [
  "Nakamoto",
  "Buterin",
  "Wood",
  "Hoskinson",
  "Armstrong",
  "Zhao",
  "Lee",
  "Yang",
  "Chen",
  "Kim",
  "Patel",
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Miller",
  "Davis",
  "Garcia",
  "Rodriguez",
  "Wilson",
  "Martinez",
  "Anderson",
  "Taylor",
  "Thomas",
]

const bios = [
  "DeFi enthusiast and smart contract developer",
  "Building the future of decentralized governance",
  "Crypto native since 2017",
  "Full-stack blockchain developer",
  "DAO contributor and NFT collector",
  "Stacks ecosystem advocate",
  "Web3 researcher and educator",
  "Privacy maximalist and Bitcoin believer",
  "Cross-chain arbitrage specialist",
  "Community moderator and governance delegate",
]

export class UserGenerator {
  private usedAddresses: Set<string> = new Set()

  constructor(seedValue?: number) {
    if (seedValue) resetSeed(seedValue)
  }

  generateStacksAddress(): string {
    const prefixes = ["SP", "ST"]
    const prefix = prefixes[Math.floor(seededRandom() * prefixes.length)]
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let address: string

    do {
      let suffix = ""
      for (let i = 0; i < 39; i++) {
        suffix += chars[Math.floor(seededRandom() * chars.length)]
      }
      address = `${prefix}${suffix}`
    } while (this.usedAddresses.has(address))

    this.usedAddresses.add(address)
    return address
  }

  generatePrincipal(): Principal {
    const address = this.generateStacksAddress()
    const firstName = firstNames[Math.floor(seededRandom() * firstNames.length)]
    const lastName = lastNames[Math.floor(seededRandom() * lastNames.length)]
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(seededRandom() * 1000)}`

    const roles: Principal["role"][] = ["member", "delegate", "admin", "voter", "creator"]
    const roleWeights = [0.6, 0.15, 0.05, 0.15, 0.05]
    let role: Principal["role"] = "member"
    const rand = seededRandom()
    let cumulative = 0
    for (let i = 0; i < roles.length; i++) {
      cumulative += roleWeights[i]
      if (rand <= cumulative) {
        role = roles[i]
        break
      }
    }

    const joinedDate = new Date(2024, Math.floor(seededRandom() * 12), Math.floor(seededRandom() * 28) + 1)

    return {
      address,
      username: `@${username}`,
      stxBalance: Math.floor(seededRandom() * 1000000) + 1000,
      role,
      joinedAt: joinedDate.toISOString(),
      votingPower: Math.floor(seededRandom() * 1000000) + 1000,
      delegator: seededRandom() > 0.7 ? this.generateStacksAddress() : undefined,
      metadata: {
        bio: bios[Math.floor(seededRandom() * bios.length)],
        avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${username}`,
        socials: {
          twitter: seededRandom() > 0.3 ? `@${username}` : undefined,
          github: seededRandom() > 0.5 ? username : undefined,
          discord: seededRandom() > 0.6 ? `${username}#${Math.floor(seededRandom() * 9000) + 1000}` : undefined,
        },
      },
    }
  }

  generateUserBatch(count: number): Principal[] {
    const users: Principal[] = []

    // Generate core team members first
    const coreTeam = Math.min(5, count)
    for (let i = 0; i < coreTeam; i++) {
      const user = this.generatePrincipal()
      user.role = i === 0 ? "admin" : "delegate"
      user.votingPower = Math.floor(seededRandom() * 4000000) + 1000000
      users.push(user)
    }

    // Generate remaining users
    for (let i = coreTeam; i < count; i++) {
      users.push(this.generatePrincipal())
    }

    return users
  }

  generateGovernanceToken(users: Principal[]): GovernanceToken {
    const totalSupply = 100000000
    const holders: Record<string, number> = {}

    let remaining = totalSupply * 0.6 // 60% for community

    for (const user of users) {
      const allocation = Math.floor(seededRandom() * seededRandom() * remaining * 0.1)
      holders[user.address] = allocation
      remaining -= allocation
    }

    return {
      id: "gov-token-001",
      name: "ArbiDAO Governance Token",
      symbol: "ARBI",
      totalSupply,
      decimals: 6,
      holders,
      distribution: {
        team: totalSupply * 0.15,
        treasury: totalSupply * 0.2,
        community: totalSupply * 0.4,
        investors: totalSupply * 0.15,
        airdrop: totalSupply * 0.1,
      },
    }
  }
}

export const userGenerator = new UserGenerator()
