"use client"

import { useState } from "react"
import { useConnect } from "@stacks/connect-react"
import { AnchorMode, PostConditionMode, uintCV, callReadOnlyFunction, cvToJSON } from "@stacks/transactions"
import { Play, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { toast } from "sonner"

export function ContractCallDemo() {
  const { doContractCall } = useConnect()
  const { isSignedIn, walletInfo, network, networkInstance, contracts } = useStacks()
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [mintAmount, setMintAmount] = useState("100")

  const currentAddress = network === "mainnet" ? walletInfo?.mainnetAddress : walletInfo?.testnetAddress

  const readTotalSupply = async () => {
    setLoading(true)
    setResult("")

    try {
      const res = await callReadOnlyFunction({
        contractAddress: contracts.usdcxToken,
        contractName: "usdcx-token",
        functionName: "get-total-supply",
        functionArgs: [],
        network: networkInstance,
        senderAddress: currentAddress || contracts.usdcxToken,
      })

      const jsonResult = cvToJSON(res)
      setResult(JSON.stringify(jsonResult, null, 2))
      toast.success("Read-only call completed")
    } catch (e: any) {
      setResult(`Error: ${e?.message ?? String(e)}`)
      toast.error("Failed to read contract")
    } finally {
      setLoading(false)
    }
  }

  const callProtocolMint = () => {
    if (!isSignedIn || !currentAddress) {
      toast.error("Connect wallet first")
      return
    }

    const amount = Number.parseFloat(mintAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }

    setLoading(true)
    setResult("")

    doContractCall({
      network: networkInstance,
      anchorMode: AnchorMode.Any,
      contractAddress: contracts.usdcxToken,
      contractName: "usdcx-token",
      functionName: "protocol-mint",
      functionArgs: [uintCV(amount * 1_000_000)], // Convert to 6 decimals
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        setResult(
          `Transaction submitted!\n\nTx ID: ${data.txId}\n\nView on explorer: https://explorer.hiro.so/txid/${data.txId}?chain=${network}`,
        )
        toast.success("Transaction submitted!")
        setLoading(false)
      },
      onCancel: () => {
        setResult("Transaction cancelled by user")
        toast.info("Transaction cancelled")
        setLoading(false)
      },
    })
  }

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-brand" />
        Contract Interaction Demo
      </h3>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={readTotalSupply}
            disabled={loading}
            variant="outline"
            className="border-white/20 bg-transparent hover:bg-white/5"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Read Total Supply
          </Button>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Amount"
              className="w-24 bg-black/20 border-white/10"
              disabled={loading || !isSignedIn}
            />
            <Button
              onClick={callProtocolMint}
              disabled={loading || !isSignedIn}
              className="bg-brand hover:bg-brand-dark"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Protocol Mint
            </Button>
          </div>
        </div>

        {!isSignedIn && (
          <p className="text-sm text-muted-foreground">Connect your wallet to execute signed transactions.</p>
        )}

        {result && (
          <div className="mt-4 p-4 bg-black/30 rounded-lg border border-white/10">
            <p className="text-xs text-muted-foreground mb-2">Output:</p>
            <pre className="text-sm whitespace-pre-wrap break-all text-slate-300 font-mono">{result}</pre>
          </div>
        )}
      </div>
    </Card>
  )
}
