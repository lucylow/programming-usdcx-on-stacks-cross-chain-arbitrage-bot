import type { NFTCollection, NFTToken, NFTListing, Bid, Offer } from "../types"

let seed = 98765
function seededRandom(): number {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const collectionNames = [
  "ArbiDAO Genesis",
  "Stacks Punks",
  "Cross-Chain Legends",
  "DeFi Guardians",
  "Bridge Masters",
  "Governance OGs",
]

const traitTypes = {
  background: ["Cosmic", "Ocean", "Forest", "Desert", "Mountain", "City"],
  body: ["Robot", "Human", "Alien", "Cyborg", "Spirit", "Animal"],
  accessory: ["Glasses", "Hat", "Necklace", "Earring", "Mask", "None"],
  rarity: ["Common", "Uncommon", "Rare", "Epic", "Legendary"],
}

export class NFTGenerator {
  generateCollection(creator: string): NFTCollection {
    const name = collectionNames[Math.floor(seededRandom() * collectionNames.length)]
    const symbol = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()

    return {
      id: `col-${Math.floor(seededRandom() * 100000)
        .toString(16)
        .padStart(6, "0")}`,
      name,
      symbol,
      description: `${name} is a unique collection celebrating the ArbiDAO community and cross-chain innovation.`,
      creator,
      totalSupply: Math.floor(seededRandom() * 9000) + 1000,
      mintPrice: Math.floor(seededRandom() * 100) + 10,
      royaltyPercentage: Math.floor(seededRandom() * 8) + 2,
      royaltyRecipient: creator,
      metadata: {
        contractUri: `https://api.arbidao.org/collections/${symbol.toLowerCase()}`,
        baseUri: `https://api.arbidao.org/nfts/${symbol.toLowerCase()}/`,
        externalUrl: `https://arbidao.org/nfts/${symbol.toLowerCase()}`,
      },
      traits: traitTypes,
      floorPrice: Math.floor(seededRandom() * 50) + 5,
      volume24h: Math.floor(seededRandom() * 100000) + 10000,
    }
  }

  generateToken(collectionId: string, tokenId: number, creator: string, owner: string): NFTToken {
    const attributes = Object.entries(traitTypes).map(([traitType, values]) => ({
      trait_type: traitType,
      value: values[Math.floor(seededRandom() * values.length)],
      rarity: Math.floor(seededRandom() * 100),
    }))

    const rarityScore = attributes.reduce((sum, attr) => sum + (100 - (attr.rarity || 50)), 0)
    const mintedAt = new Date(Date.now() - Math.floor(seededRandom() * 180 * 24 * 60 * 60 * 1000))

    return {
      id: tokenId,
      collectionId,
      owner,
      creator,
      tokenUri: `https://api.arbidao.org/nfts/${collectionId}/${tokenId}`,
      metadata: {
        name: `${collectionId.toUpperCase()} #${tokenId}`,
        description: `Token #${tokenId} from the collection`,
        image: `https://api.dicebear.com/9.x/shapes/svg?seed=${collectionId}${tokenId}`,
        attributes,
        external_url: `https://arbidao.org/nfts/${collectionId}/${tokenId}`,
      },
      rarityScore,
      rank: Math.floor(seededRandom() * 1000) + 1,
      mintedAt: mintedAt.toISOString(),
      lastSoldAt:
        seededRandom() > 0.6
          ? new Date(mintedAt.getTime() + seededRandom() * 90 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      lastSalePrice: seededRandom() > 0.6 ? Math.floor(seededRandom() * 200) + 10 : undefined,
    }
  }

  generateListing(token: NFTToken, seller: string): NFTListing {
    const isAuction = seededRandom() > 0.7
    const basePrice = Math.floor(seededRandom() * 200) + 20
    const createdAt = new Date(Date.now() - Math.floor(seededRandom() * 7 * 24 * 60 * 60 * 1000))

    const listing: NFTListing = {
      id: `list-${Math.floor(seededRandom() * 100000)
        .toString(16)
        .padStart(8, "0")}`,
      tokenId: token.id,
      collectionId: token.collectionId,
      seller,
      price: basePrice,
      currency: "STX",
      status: ["active", "sold", "cancelled"][Math.floor(seededRandom() * 3)] as NFTListing["status"],
      listingType: isAuction ? "auction" : "fixed",
      offers: this.generateOffers(3),
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    if (isAuction) {
      const startTime = createdAt
      const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000)
      listing.auction = {
        startPrice: basePrice,
        reservePrice: basePrice * 1.5,
        highestBid: seededRandom() > 0.5 ? Math.floor(basePrice * (1 + seededRandom() * 0.5)) : undefined,
        highestBidder:
          seededRandom() > 0.5
            ? `SP${Array.from({ length: 39 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(seededRandom() * 36)]).join("")}`
            : undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        bidIncrement: Math.floor(basePrice * 0.05),
        bidHistory: this.generateBidHistory(5),
      }
    }

    return listing
  }

  private generateOffers(count: number): Offer[] {
    const offers: Offer[] = []
    for (let i = 0; i < count; i++) {
      const createdAt = new Date(Date.now() - Math.floor(seededRandom() * 3 * 24 * 60 * 60 * 1000))
      offers.push({
        offerer: `SP${Array.from({ length: 39 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(seededRandom() * 36)]).join("")}`,
        amount: Math.floor(seededRandom() * 150) + 10,
        currency: "STX",
        createdAt: createdAt.toISOString(),
        expiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
    return offers
  }

  private generateBidHistory(count: number): Bid[] {
    const bids: Bid[] = []
    let currentBid = Math.floor(seededRandom() * 50) + 20

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(Date.now() - (count - i) * 12 * 60 * 60 * 1000)
      bids.push({
        bidder: `SP${Array.from({ length: 39 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(seededRandom() * 36)]).join("")}`,
        amount: currentBid,
        timestamp: timestamp.toISOString(),
        status: i === count - 1 ? "active" : "outbid",
      })
      currentBid = Math.floor(currentBid * 1.1)
    }

    return bids
  }

  generateCollectionBatch(count: number, creators: string[]): NFTCollection[] {
    const collections: NFTCollection[] = []
    for (let i = 0; i < count; i++) {
      const creator = creators[Math.floor(seededRandom() * creators.length)]
      collections.push(this.generateCollection(creator))
    }
    return collections
  }

  generateTokenBatch(collection: NFTCollection, count: number, owners: string[]): NFTToken[] {
    const tokens: NFTToken[] = []
    for (let i = 0; i < count; i++) {
      const owner = owners[Math.floor(seededRandom() * owners.length)]
      tokens.push(this.generateToken(collection.id, i + 1, collection.creator, owner))
    }
    return tokens
  }
}

export const nftGenerator = new NFTGenerator()
