"use client"

import { useState } from "react"
import { useConnect } from "@stacks/connect-react"
import { Wallet, LogOut, Copy, Check, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { toast } from "sonner"

export function StacksWalletButton() {
  const { doOpenAuth } = useConnect()
  const { isSignedIn, walletInfo, network, disconnect, refreshBalances, isLoading } = useStacks()
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleConnect = () => {
    doOpenAuth()
  }

  const handleDisconnect = () => {
    disconnect()
    toast.success("Wallet disconnected")
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setIsRefreshing(false)
    toast.success("Balances refreshed")
  }

  const copyAddress = () => {
    const address = network === "mainnet" ? walletInfo?.mainnetAddress : walletInfo?.testnetAddress
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Address copied to clipboard")
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const currentAddress = network === "mainnet" ? walletInfo?.mainnetAddress : walletInfo?.testnetAddress

  if (isLoading) {
    return (
      <Button disabled className="bg-brand/50">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  if (!isSignedIn || !walletInfo) {
    return (
      <Button onClick={handleConnect} className="bg-brand hover:bg-brand-dark">
        <Wallet className="w-4 h-4 mr-2" />
        Connect Stacks Wallet
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Card className="bg-card-bg border-white/10 px-4 py-2 cursor-pointer hover:border-brand transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatAddress(currentAddress!)}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent capitalize">{network}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {walletInfo.stxBalance?.toFixed(2) || "0.00"} STX
                {walletInfo.usdcxBalance !== undefined && ` • ${walletInfo.usdcxBalance.toFixed(2)} USDCx`}
              </div>
            </div>
          </div>
        </Card>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 bg-dark border-white/10">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">Connected Address</p>
          <p className="text-sm font-mono truncate">{currentAddress}</p>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          Copy Address
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={`https://explorer.hiro.so/address/${currentAddress}?chain=${network}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing} className="cursor-pointer">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Balances
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-error focus:text-error">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
