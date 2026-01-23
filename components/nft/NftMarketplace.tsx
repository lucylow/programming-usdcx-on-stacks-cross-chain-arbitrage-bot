"use client"

import { useState, useEffect } from "react"
import { ShoppingBag, Gavel, Clock, TrendingUp, Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { nftService, type NFTListing, type NFTAuction } from "@/lib/stacks/nftService"
import { useConnect } from "@stacks/connect-react"
import { AnchorMode, PostConditionMode } from "@stacks/transactions"
import { StacksTestnet, StacksMainnet } from "@stacks/network"
import { CONTRACTS } from "@/lib/stacks/config"

type ViewMode = "listings" | "auctions"

export function NftMarketplace() {
  const { isSignedIn, walletInfo, network } = useStacks()
  const { doContractCall } = useConnect()
  const [viewMode, setViewMode] = useState<ViewMode>("listings")
  const [listings, setListings] = useState<NFTListing[]>([])
  const [auctions, setAuctions] = useState<NFTAuction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalListings, setTotalListings] = useState(0)
  const [totalAuctions, setTotalAuctions] = useState(0)

  const networkInstance = network === "mainnet" ? new StacksMainnet() : new StacksTestnet()
  const marketplaceAddress = CONTRACTS[network].privacyBadgeNft // Using same address for now

  useEffect(() => {
    fetchMarketplaceData()
  }, [viewMode])

  const fetchMarketplaceData = async () => {
    setIsLoading(true)
    try {
      if (viewMode === "listings") {
        const total = await nftService.getTotalListings()
        setTotalListings(total)
        // Fetch listings (in production, implement pagination)
        const fetchedListings: NFTListing[] = []
        for (let i = 1; i <= Math.min(total, 20); i++) {
          const listing = await nftService.getListing(i)
          if (listing && listing.status === "active") {
            fetchedListings.push(listing)
          }
        }
        setListings(fetchedListings)
      } else {
        const total = await nftService.getTotalAuctions()
        setTotalAuctions(total)
        // Fetch auctions (in production, implement pagination)
        const fetchedAuctions: NFTAuction[] = []
        for (let i = 1; i <= Math.min(total, 20); i++) {
          const auction = await nftService.getAuction(i)
          if (auction && auction.status === "active") {
            fetchedAuctions.push(auction)
          }
        }
        setAuctions(fetchedAuctions)
      }
    } catch (error) {
      console.error("Error fetching marketplace data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyListing = async (listingId: number) => {
    if (!isSignedIn || !walletInfo) {
      alert("Please connect your wallet first")
      return
    }

    try {
      await doContractCall({
        network: networkInstance,
        anchorMode: AnchorMode.Any,
        contractAddress: marketplaceAddress,
        contractName: "nft-marketplace",
        functionName: "buy-nft",
        functionArgs: [],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          alert(`Purchase successful! TX: ${data.txId}`)
          fetchMarketplaceData()
        },
        onCancel: () => {
          alert("Transaction cancelled")
        },
      } as any)
    } catch (error) {
      console.error("Error buying NFT:", error)
      alert("Failed to purchase NFT")
    }
  }

  const handlePlaceBid = async (auctionId: number, bidAmount: number) => {
    if (!isSignedIn || !walletInfo) {
      alert("Please connect your wallet first")
      return
    }

    try {
      await doContractCall({
        network: networkInstance,
        anchorMode: AnchorMode.Any,
        contractAddress: marketplaceAddress,
        contractName: "nft-marketplace",
        functionName: "place-bid",
        functionArgs: [],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          alert(`Bid placed! TX: ${data.txId}`)
          fetchMarketplaceData()
        },
        onCancel: () => {
          alert("Transaction cancelled")
        },
      } as any)
    } catch (error) {
      console.error("Error placing bid:", error)
      alert("Failed to place bid")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NFT Marketplace</h2>
          <p className="text-sm text-muted-foreground">Buy, sell, and trade arbitrage badges</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "listings" ? "default" : "outline"}
            onClick={() => setViewMode("listings")}
            className="border-white/20"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Listings ({totalListings})
          </Button>
          <Button
            variant={viewMode === "auctions" ? "default" : "outline"}
            onClick={() => setViewMode("auctions")}
            className="border-white/20"
          >
            <Gavel className="w-4 h-4 mr-2" />
            Auctions ({totalAuctions})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card-bg border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-2xl font-bold">{totalListings}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-brand" />
          </div>
        </Card>
        <Card className="bg-card-bg border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Auctions</p>
              <p className="text-2xl font-bold">{totalAuctions}</p>
            </div>
            <Gavel className="w-8 h-8 text-accent" />
          </div>
        </Card>
        <Card className="bg-card-bg border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Volume 24h</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Listings View */}
      {viewMode === "listings" && (
        <div>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <Card className="bg-card-bg border-white/10 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active listings found</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Card key={listing.listingId} className="bg-card-bg border-white/10 overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-brand to-accent flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Token #{listing.nftId}</p>
                      <p className="text-lg font-semibold">{listing.price / 1_000_000} STX</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Seller: {listing.seller.slice(0, 8)}...</span>
                      <span>Listed {new Date(listing.listedAt * 1000).toLocaleDateString()}</span>
                    </div>
                    <Button
                      onClick={() => handleBuyListing(listing.listingId)}
                      className="w-full bg-gradient-to-r from-brand to-accent"
                      disabled={!isSignedIn}
                    >
                      Buy Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auctions View */}
      {viewMode === "auctions" && (
        <div>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading auctions...</p>
            </div>
          ) : auctions.length === 0 ? (
            <Card className="bg-card-bg border-white/10 p-12 text-center">
              <Gavel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active auctions found</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <Card key={auction.auctionId} className="bg-card-bg border-white/10 overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Gavel className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Token #{auction.nftId}</p>
                      <p className="text-lg font-semibold">
                        {auction.highestBid
                          ? `${auction.highestBid / 1_000_000} STX`
                          : `Starting: ${auction.startPrice / 1_000_000} STX`}
                      </p>
                      {auction.highestBid && (
                        <p className="text-xs text-muted-foreground">
                          Reserve: {auction.reservePrice / 1_000_000} STX
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Ends at block {auction.endBlock}</span>
                    </div>
                    {auction.highestBidder && (
                      <p className="text-xs text-muted-foreground">
                        Highest bidder: {auction.highestBidder.slice(0, 8)}...
                      </p>
                    )}
                    <Button
                      onClick={() => handlePlaceBid(auction.auctionId, auction.startPrice)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                      disabled={!isSignedIn}
                    >
                      Place Bid
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
