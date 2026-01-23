import { StacksMainnet, StacksTestnet } from "@stacks/network"
import { CONTRACTS, NFT_CONTRACT_NAME } from "./config"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export interface NFTMetadata {
  tokenId: number
  owner?: string
  uri?: string
  metadata?: {
    mintedAt: number
    badgeType: string
    tradesCompleted: number
    profitEarned: number
  }
}

export interface NFTListing {
  listingId: number
  nftId: number
  seller: string
  price: number
  status: "active" | "sold" | "cancelled"
  listedAt: number
}

export interface NFTAuction {
  auctionId: number
  nftId: number
  seller: string
  startPrice: number
  reservePrice: number
  highestBid?: number
  highestBidder?: string
  startBlock: number
  endBlock: number
  status: "active" | "ended" | "settled"
}

export class StacksNFTService {
  private apiBaseUrl: string

  constructor(apiBaseUrl: string = API_BASE_URL) {
    this.apiBaseUrl = apiBaseUrl
  }

  /**
   * Get total supply of NFTs
   */
  async getTotalSupply(): Promise<number> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/supply`)
    if (!response.ok) throw new Error("Failed to fetch total supply")
    const data = await response.json()
    return data.totalSupply || 0
  }

  /**
   * Get last token ID
   */
  async getLastTokenId(): Promise<number> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/last-token-id`)
    if (!response.ok) throw new Error("Failed to fetch last token ID")
    const data = await response.json()
    return data.lastTokenId || 0
  }

  /**
   * Get NFT token details
   */
  async getToken(tokenId: number): Promise<NFTMetadata | null> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/token/${tokenId}`)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error("Failed to fetch token")
    }
    return await response.json()
  }

  /**
   * Get all NFTs owned by an address
   */
  async getOwnedNFTs(address: string): Promise<NFTMetadata[]> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/owner/${address}`)
    if (!response.ok) throw new Error("Failed to fetch owned NFTs")
    const data = await response.json()
    return data.nfts || []
  }

  /**
   * Check if user has claimed a badge
   */
  async hasUserClaimed(address: string): Promise<boolean> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/claimed/${address}`)
    if (!response.ok) throw new Error("Failed to check claim status")
    const data = await response.json()
    return data.hasClaimed || false
  }

  /**
   * Get marketplace listing
   */
  async getListing(listingId: number): Promise<NFTListing | null> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/marketplace/listings/${listingId}`)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error("Failed to fetch listing")
    }
    return await response.json()
  }

  /**
   * Get marketplace auction
   */
  async getAuction(auctionId: number): Promise<NFTAuction | null> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/marketplace/auctions/${auctionId}`)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error("Failed to fetch auction")
    }
    return await response.json()
  }

  /**
   * Get total listings count
   */
  async getTotalListings(): Promise<number> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/marketplace/listings`)
    if (!response.ok) throw new Error("Failed to fetch listings")
    const data = await response.json()
    return data.totalListings || 0
  }

  /**
   * Get total auctions count
   */
  async getTotalAuctions(): Promise<number> {
    const response = await fetch(`${this.apiBaseUrl}/api/nft/marketplace/auctions`)
    if (!response.ok) throw new Error("Failed to fetch auctions")
    const data = await response.json()
    return data.totalAuctions || 0
  }

  /**
   * Fetch token metadata from URI
   */
  async fetchTokenMetadata(uri: string): Promise<any> {
    try {
      const response = await fetch(uri)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error("Error fetching token metadata:", error)
      return null
    }
  }
}

export const nftService = new StacksNFTService()
