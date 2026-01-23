"use client"

import { useState } from "react"
import { useConnect } from "@stacks/connect-react"
import { AnchorMode, PostConditionMode } from "@stacks/transactions"
import { StacksTestnet, StacksMainnet } from "@stacks/network"
import { List, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { CONTRACTS } from "@/lib/stacks/config"

type ListStatus = "idle" | "pending" | "success" | "error"

interface NftListButtonProps {
  tokenId: number
  onListed?: () => void
}

export function NftListButton({ tokenId, onListed }: NftListButtonProps) {
  const { doContractCall } = useConnect()
  const { isSignedIn, network, walletInfo } = useStacks()
  const [status, setStatus] = useState<ListStatus>("idle")
  const [price, setPrice] = useState("")
  const [txId, setTxId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const networkInstance = network === "mainnet" ? new StacksMainnet() : new StacksTestnet()
  const marketplaceAddress = CONTRACTS[network].privacyBadgeNft

  const handleList = () => {
    if (!isSignedIn) {
      setErrorMessage("Please connect your wallet first")
      return
    }

    const priceInMicroStx = Math.floor(parseFloat(price) * 1_000_000)
    if (isNaN(priceInMicroStx) || priceInMicroStx <= 0) {
      setErrorMessage("Please enter a valid price")
      return
    }

    setStatus("pending")
    setErrorMessage(null)
    setTxId(null)

    doContractCall({
      network: networkInstance,
      anchorMode: AnchorMode.Any,
      contractAddress: marketplaceAddress,
      contractName: "nft-marketplace",
      functionName: "list-nft",
      functionArgs: [],
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data) => {
        setStatus("success")
        setTxId(data.txId)
        if (onListed) onListed()
      },
      onCancel: () => {
        setStatus("idle")
        setErrorMessage("Transaction cancelled by user")
      },
    } as any)
  }

  const getExplorerUrl = () => {
    if (!txId) return ""
    const baseUrl = network === "mainnet" ? "https://explorer.stacks.co" : "https://explorer.hiro.so"
    return `${baseUrl}/txid/${txId}?chain=${network}`
  }

  const resetStatus = () => {
    setStatus("idle")
    setTxId(null)
    setErrorMessage(null)
    setShowForm(false)
    setPrice("")
  }

  if (!showForm && status === "idle") {
    return (
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        size="sm"
        className="border-white/20 bg-transparent"
      >
        <List className="w-4 h-4 mr-2" />
        List for Sale
      </Button>
    )
  }

  return (
    <Card className="bg-card-bg border-white/10 p-4 space-y-4">
      {status === "idle" && (
        <>
          <div>
            <Label htmlFor="price">Price (STX)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price in STX"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleList} disabled={!isSignedIn || !price} className="flex-1">
              List NFT
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-white/20">
              Cancel
            </Button>
          </div>
          {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
        </>
      )}

      {status === "pending" && (
        <div className="text-center py-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
          <p className="text-sm text-muted-foreground">Listing NFT...</p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-accent">NFT Listed Successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">Your NFT is now available for sale.</p>
          </div>
          {txId && (
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand hover:underline"
            >
              View on Explorer
            </a>
          )}
          <Button onClick={resetStatus} variant="outline" className="w-full border-white/20 bg-transparent">
            Done
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6 text-error" />
          </div>
          <div>
            <p className="font-semibold text-error">Listing Failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              {errorMessage || "An error occurred while listing your NFT."}
            </p>
          </div>
          <Button onClick={resetStatus} variant="outline" className="w-full border-white/20 bg-transparent">
            Try Again
          </Button>
        </div>
      )}
    </Card>
  )
}
