"use client"

import { Wallet, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDapp } from "@/lib/dapp/DappProvider"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { toast } from "sonner"

export function WalletStatus() {
  const { wallet } = useDapp()
  const { connect, disconnect, refreshBalances, isLoading } = useStacks()

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
      toast.success("Address copied to clipboard")
    }
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!wallet.connected) {
    return (
      <Card className="bg-card-bg border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">Wallet not connected</span>
          </div>
          <Button onClick={connect} className="bg-brand hover:bg-brand-dark">
            Connect Wallet
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-brand" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{truncateAddress(wallet.address!)}</span>
              <button onClick={copyAddress} className="text-muted-foreground hover:text-white transition-colors">
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={`https://explorer.hiro.so/address/${wallet.address}?chain=${wallet.network}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{wallet.network} Network</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalances}
            disabled={isLoading}
            className="border-white/20 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="border-white/20 bg-transparent text-error hover:text-error"
          >
            Disconnect
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">STX Balance</div>
          <div className="text-xl font-bold text-white">
            {wallet.stxBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}{" "}
            <span className="text-sm text-muted-foreground">STX</span>
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">USDCx Balance</div>
          <div className="text-xl font-bold text-accent">
            {wallet.usdcxBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-sm text-muted-foreground">USDCx</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
