import { StacksMainnet, StacksTestnet } from "@stacks/network"
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from "@stacks/transactions"
import { logger } from "../utils/logger"

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

export interface NFTOffer {
  nftId: number
  offerer: string
  amount: number
  expiresAt: number
}

export class NFTService {
  private network: "mainnet" | "testnet"
  private networkInstance: StacksMainnet | StacksTestnet
  private contractAddress: string
  private contractName: string
  private marketplaceAddress?: string
  private marketplaceName?: string

  constructor(
    network: "mainnet" | "testnet",
    contractAddress: string,
    contractName: string = "privacy-badge-nft",
    marketplaceAddress?: string,
    marketplaceName: string = "nft-marketplace",
  ) {
    this.network = network
    this.networkInstance = network === "mainnet" ? new StacksMainnet() : new StacksTestnet()
    this.contractAddress = contractAddress
    this.contractName = contractName
    this.marketplaceAddress = marketplaceAddress
    this.marketplaceName = marketplaceName
  }

  /**
   * Get total supply of NFTs
   */
  async getTotalSupply(): Promise<number> {
    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: "get-total-supply",
        functionArgs: [],
        senderAddress: this.contractAddress,
      })

      const json = cvToJSON(response)
      return Number.parseInt(json.value || "0", 10)
    } catch (error) {
      logger.error("Error fetching total supply:", error)
      throw error
    }
  }

  /**
   * Get last token ID
   */
  async getLastTokenId(): Promise<number> {
    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: "get-last-token-id",
        functionArgs: [],
        senderAddress: this.contractAddress,
      })

      const json = cvToJSON(response)
      return Number.parseInt(json.value || "0", 10)
    } catch (error) {
      logger.error("Error fetching last token ID:", error)
      throw error
    }
  }

  /**
   * Get owner of a specific NFT
   */
  async getOwner(tokenId: number): Promise<string | null> {
    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: "get-owner",
        functionArgs: [uintCV(tokenId)],
        senderAddress: this.contractAddress,
      })

      const json = cvToJSON(response)
      return json.value?.value || null
    } catch (error) {
      logger.error(`Error fetching owner for token ${tokenId}:`, error)
      return null
    }
  }

  /**
   * Get token URI
   */
  async getTokenUri(tokenId: number): Promise<string | null> {
    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: "get-token-uri",
        functionArgs: [uintCV(tokenId)],
        senderAddress: this.contractAddress,
      })

      const json = cvToJSON(response)
      return json.value?.value?.value || null
    } catch (error) {
      logger.error(`Error fetching URI for token ${tokenId}:`, error)
      return null
    }
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenId: number): Promise<NFTMetadata | null> {
    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: "get-token-metadata",
        functionArgs: [uintCV(tokenId)],
        senderAddress: this.contractAddress,
      })

      const json = cvToJSON(response)
      if (!json.value || !json.value.value) return null

      const metadata = json.value.value
      return {
        tokenId,
        metadata: {
          mintedAt: Number.parseInt(metadata["minted-at"]?.value || "0", 10),
          badgeType: metadata["badge-type"]?.value || "",
          tradesCompleted: Number.parseInt(metadata["trades-completed"]?.value || "0", 10),
          profitEarned: Number.parseInt(metadata["profit-earned"]?.value || "0", 10),
        },
      }
    } catch (error) {
      logger.error(`Error fetching metadata for token ${tokenId}:`, error)
      return null
    }
  }

  /**
   * Check if user has claimed a badge
   */
  async hasUserClaimed(userAddress: string): Promise<boolean> {
    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: "has-user-claimed",
        functionArgs: [standardPrincipalCV(userAddress)],
        senderAddress: userAddress,
      })

      const json = cvToJSON(response)
      return json.value === true
    } catch (error) {
      logger.error(`Error checking claim status for ${userAddress}:`, error)
      return false
    }
  }

  /**
   * Get all NFTs owned by an address
   */
  async getOwnedNFTs(ownerAddress: string): Promise<NFTMetadata[]> {
    try {
      const totalSupply = await this.getTotalSupply()
      const ownedNFTs: NFTMetadata[] = []

      // Iterate through all token IDs to find owned ones
      // Note: This is inefficient for large collections. In production, use an indexer
      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        const owner = await this.getOwner(tokenId)
        if (owner === ownerAddress) {
          const metadata = await this.getTokenMetadata(tokenId)
          if (metadata) {
            ownedNFTs.push({
              ...metadata,
              owner: ownerAddress,
            })
          }
        }
      }

      return ownedNFTs
    } catch (error) {
      logger.error(`Error fetching owned NFTs for ${ownerAddress}:`, error)
      return []
    }
  }

  /**
   * Get marketplace listing
   */
  async getListing(listingId: number): Promise<NFTListing | null> {
    if (!this.marketplaceAddress) return null

    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.marketplaceAddress,
        contractName: this.marketplaceName!,
        functionName: "get-listing",
        functionArgs: [uintCV(listingId)],
        senderAddress: this.marketplaceAddress,
      })

      const json = cvToJSON(response)
      if (!json.value || !json.value.value) return null

      const listing = json.value.value
      return {
        listingId,
        nftId: Number.parseInt(listing["nft-id"]?.value || "0", 10),
        seller: listing.seller?.value || "",
        price: Number.parseInt(listing.price?.value || "0", 10),
        status: listing.status?.value === "0x00" ? "active" : listing.status?.value === "0x01" ? "sold" : "cancelled",
        listedAt: Number.parseInt(listing["listed-at"]?.value || "0", 10),
      }
    } catch (error) {
      logger.error(`Error fetching listing ${listingId}:`, error)
      return null
    }
  }

  /**
   * Get marketplace auction
   */
  async getAuction(auctionId: number): Promise<NFTAuction | null> {
    if (!this.marketplaceAddress) return null

    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.marketplaceAddress,
        contractName: this.marketplaceName!,
        functionName: "get-auction",
        functionArgs: [uintCV(auctionId)],
        senderAddress: this.marketplaceAddress,
      })

      const json = cvToJSON(response)
      if (!json.value || !json.value.value) return null

      const auction = json.value.value
      return {
        auctionId,
        nftId: Number.parseInt(auction["nft-id"]?.value || "0", 10),
        seller: auction.seller?.value || "",
        startPrice: Number.parseInt(auction["start-price"]?.value || "0", 10),
        reservePrice: Number.parseInt(auction["reserve-price"]?.value || "0", 10),
        highestBid: auction["highest-bid"]?.value
          ? Number.parseInt(auction["highest-bid"].value || "0", 10)
          : undefined,
        highestBidder: auction["highest-bidder"]?.value?.value || undefined,
        startBlock: Number.parseInt(auction["start-block"]?.value || "0", 10),
        endBlock: Number.parseInt(auction["end-block"]?.value || "0", 10),
        status: "active", // Determine based on endBlock and current block
      }
    } catch (error) {
      logger.error(`Error fetching auction ${auctionId}:`, error)
      return null
    }
  }

  /**
   * Get total listings count
   */
  async getTotalListings(): Promise<number> {
    if (!this.marketplaceAddress) return 0

    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.marketplaceAddress,
        contractName: this.marketplaceName!,
        functionName: "get-total-listings",
        functionArgs: [],
        senderAddress: this.marketplaceAddress,
      })

      const json = cvToJSON(response)
      return Number.parseInt(json.value || "0", 10)
    } catch (error) {
      logger.error("Error fetching total listings:", error)
      return 0
    }
  }

  /**
   * Get total auctions count
   */
  async getTotalAuctions(): Promise<number> {
    if (!this.marketplaceAddress) return 0

    try {
      const response = await callReadOnlyFunction({
        network: this.networkInstance,
        contractAddress: this.marketplaceAddress,
        contractName: this.marketplaceName!,
        functionName: "get-total-auctions",
        functionArgs: [],
        senderAddress: this.marketplaceAddress,
      })

      const json = cvToJSON(response)
      return Number.parseInt(json.value || "0", 10)
    } catch (error) {
      logger.error("Error fetching total auctions:", error)
      return 0
    }
  }
}
