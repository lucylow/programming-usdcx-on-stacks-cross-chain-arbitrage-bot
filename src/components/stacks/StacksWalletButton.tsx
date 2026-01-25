"use client"

import { useState } from "react"
import { connect, disconnect as stacksDisconnect } from "@stacks/connect"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStacks } from "@lib/stacks/StacksProvider"
import { useStacksNetwork } from "@lib/stacks/hooks"
import { NetworkSwitcher } from "./NetworkSwitcher"
import { toast } from "sonner"

const WALLET_OPTIONS = [
  { id: 'LeatherProvider', name: 'Leather', icon: '🧥', description: 'by Trust Machines' },
  { id: 'XverseProviders.BitcoinProvider', name: 'Xverse', icon: '✖️', description: 'Bitcoin & Stacks' },
  { id: 'OkxWallet', name: 'OKX Wallet', icon: '🔵', description: 'Multi-chain wallet' },
  { id: undefined, name: 'Other Wallets', icon: '👛', description: 'Any Stacks wallet' },
]

export function StacksWalletButton() {
  const { isSignedIn, walletInfo, network, disconnect, refreshBalances, isLoading, isRefreshing, onConnect } = useStacks()
  const { networkInfo } = useStacksNetwork()
  const [copied, setCopied] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const handleConnect = async (providerId?: string) => {
    setIsConnecting(true)
    setShowWalletModal(false)
    try {
      const response = await connect({
        approvedProviderIds: providerId ? [providerId] : undefined,
      })
      
      if (response && response.addresses) {
        toast.success("Wallet connected successfully!")
        onConnect?.()
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast.error("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    stacksDisconnect()
    disconnect()
    toast.success("Wallet disconnected")
  }

  const handleRefresh = async () => {
    await refreshBalances()
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

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

  const currentAddress = network === "mainnet" ? walletInfo?.mainnetAddress : walletInfo?.testnetAddress

  if (isLoading) {
    return (
      <Button disabled className="bg-primary/50">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  if (!isSignedIn || !walletInfo) {
    return (
      <>
        <Button 
          onClick={() => setShowWalletModal(true)} 
          disabled={isConnecting}
          className="bg-gradient-to-r from-[#5546FF] to-[#9747FF] hover:from-[#4436EE] hover:to-[#8636EE] text-white font-medium"
        >
          {isConnecting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Wallet className="w-4 h-4 mr-2" />
          )}
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>

        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-center">Connect a Wallet</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {WALLET_OPTIONS.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.id)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary transition-all text-left"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">{wallet.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Card className="bg-card border-border px-4 py-2 cursor-pointer hover:border-primary transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatAddress(currentAddress!)}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary capitalize">{network}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {walletInfo.stxBalance?.toFixed(2) || "0.00"} STX
                {walletInfo.usdcxBalance !== undefined && ` • ${walletInfo.usdcxBalance.toFixed(2)} USDCx`}
              </div>
            </div>
          </div>
        </Card>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 bg-card border-border">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">Connected Address</p>
          <p className="text-sm font-mono truncate">{currentAddress}</p>
        </div>

        <DropdownMenuSeparator />

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

        <DropdownMenuSeparator />

        <div className="px-3 py-2">
          <NetworkSwitcher />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}