"use client"

import { useState } from "react"
import { useConnect } from "@stacks/connect-react"
import { AnchorMode, PostConditionMode } from "@stacks/transactions"
import { StacksTestnet, StacksMainnet } from "@stacks/network"
import { Award, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { CONTRACTS, NFT_CONTRACT_NAME } from "@/lib/stacks/config"

type MintStatus = "idle" | "pending" | "success" | "error"

export function MintBadgeButton() {
  const { doContractCall } = useConnect()
  const { isSignedIn, network, walletInfo } = useStacks()
  const [status, setStatus] = useState<MintStatus>("idle")
  const [txId, setTxId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const networkInstance = network === "mainnet" ? new StacksMainnet() : new StacksTestnet()
  const contractAddress = CONTRACTS[network].privacyBadgeNft

  const handleMint = () => {
    if (!isSignedIn) {
      setErrorMessage("Please connect your wallet first")
      return
    }

    setStatus("pending")
    setErrorMessage(null)
    setTxId(null)

    doContractCall({
      network: networkInstance,
      anchorMode: AnchorMode.Any,
      contractAddress,
      contractName: NFT_CONTRACT_NAME,
      functionName: "claim",
      functionArgs: [],
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data) => {
        setStatus("success")
        setTxId(data.txId)
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
  }

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
          <Award className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="font-semibold">Arbitrage Badge NFT</h3>
          <p className="text-sm text-muted-foreground">Claim your participation badge</p>
        </div>
      </div>

      {status === "idle" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Mint a unique SIP-009 NFT badge to commemorate your participation in the Cross-Chain Arbitrage Bot hackathon
            project.
          </p>
          <Button
            onClick={handleMint}
            disabled={!isSignedIn}
            className="w-full bg-gradient-to-r from-brand to-accent hover:opacity-90"
          >
            <Award className="w-4 h-4 mr-2" />
            {isSignedIn ? "Mint Privacy Badge" : "Connect Wallet to Mint"}
          </Button>
          {errorMessage && <p className="text-sm text-error text-center">{errorMessage}</p>}
        </div>
      )}

      {status === "pending" && (
        <div className="text-center py-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
          <p className="text-sm text-muted-foreground">Opening wallet for signature...</p>
          <p className="text-xs text-muted-foreground mt-2">Please confirm the transaction in your Hiro Wallet</p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-accent">Badge Minted Successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">Your transaction has been submitted to the network.</p>
          </div>
          {txId && (
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand hover:underline"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button onClick={resetStatus} variant="outline" className="w-full mt-4 border-white/20 bg-transparent">
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
            <p className="font-semibold text-error">Minting Failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              {errorMessage || "An error occurred while minting your badge."}
            </p>
          </div>
          <Button onClick={resetStatus} variant="outline" className="w-full border-white/20 bg-transparent">
            Try Again
          </Button>
        </div>
      )}

      {isSignedIn && walletInfo && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-muted-foreground">
            Minting to:{" "}
            <span className="font-mono">
              {walletInfo.testnetAddress?.slice(0, 8)}...{walletInfo.testnetAddress?.slice(-6)}
            </span>
          </p>
        </div>
      )}
    </Card>
  )
}
