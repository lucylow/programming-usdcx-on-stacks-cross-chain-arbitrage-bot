"use client"

import { useState, useEffect } from "react"
import { Award, ExternalLink, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { CONTRACTS, NFT_CONTRACT_NAME } from "@/lib/stacks/config"
import { nftService, type NFTMetadata } from "@/lib/stacks/nftService"

export function NftGallery() {
  const { isSignedIn, walletInfo, network, networkInstance } = useStacks()
  const [nfts, setNfts] = useState<NftMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalSupply, setTotalSupply] = useState(0)

  const contractAddress = CONTRACTS[network].privacyBadgeNft

  const fetchNfts = async () => {
    if (!isSignedIn || !walletInfo) return

    setIsLoading(true)
    try {
      // Fetch total supply from API
      const supply = await nftService.getTotalSupply()
      setTotalSupply(supply)

      // Fetch owned NFTs
      if (walletInfo.testnetAddress) {
        const ownedNFTs = await nftService.getOwnedNFTs(walletInfo.testnetAddress)
        setNfts(
          ownedNFTs.map((nft) => ({
            tokenId: nft.tokenId,
            mintedAt: nft.metadata?.mintedAt || Date.now(),
            badgeType: nft.metadata?.badgeType || "participant",
            tradesCompleted: nft.metadata?.tradesCompleted || 0,
            profitEarned: nft.metadata?.profitEarned || 0,
            uri: nft.uri,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error)
      // Fallback to empty array on error
      setNfts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      fetchNfts()
    }
  }, [isSignedIn, walletInfo])

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case "early-adopter":
        return "from-purple-500 to-pink-500"
      case "whale":
        return "from-blue-500 to-cyan-500"
      case "trader":
        return "from-green-500 to-emerald-500"
      default:
        return "from-brand to-accent"
    }
  }

  const getBadgeLabel = (badgeType: string) => {
    switch (badgeType) {
      case "early-adopter":
        return "Early Adopter"
      case "whale":
        return "Whale Trader"
      case "trader":
        return "Active Trader"
      default:
        return "Participant"
    }
  }

  if (!isSignedIn) {
    return (
      <Card className="bg-card-bg border-white/10 p-8 text-center">
        <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connect your wallet to view your NFT badges</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Your NFT Badges</h3>
          <p className="text-sm text-muted-foreground">{totalSupply} total badges minted</p>
        </div>
        <Button
          onClick={fetchNfts}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="border-white/20 bg-transparent"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {nfts.length === 0 ? (
        <Card className="bg-card-bg border-white/10 p-8 text-center">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No badges found. Mint your first badge!</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <Card
              key={nft.tokenId}
              className="bg-card-bg border-white/10 overflow-hidden hover:border-brand/50 transition-colors"
            >
              {/* Badge Visual */}
              <div
                className={`h-40 bg-gradient-to-br ${getBadgeColor(nft.badgeType)} flex items-center justify-center`}
              >
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Award className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Badge Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{getBadgeLabel(nft.badgeType)}</span>
                  <span className="text-xs text-muted-foreground">#{nft.tokenId}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-black/20 rounded-lg p-2">
                    <p className="text-muted-foreground text-xs">Trades</p>
                    <p className="font-semibold">{nft.tradesCompleted}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <p className="text-muted-foreground text-xs">Profit</p>
                    <p className="font-semibold text-accent">${nft.profitEarned}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs text-muted-foreground">
                    Minted {new Date(nft.mintedAt).toLocaleDateString()}
                  </span>
                  <a
                    href={`https://explorer.hiro.so/txid/0x...?chain=${network}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
