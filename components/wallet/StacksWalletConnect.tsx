"use client"

import { useState, useEffect } from "react"
import { Wallet, LogOut, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getStacksWalletService, type StacksWalletState } from "@/lib/web3/stacks-wallet"
import { toast } from "sonner"

export default function StacksWalletConnect() {
  const [walletState, setWalletState] = useState<StacksWalletState>({
    address: null,
    isConnected: false,
    network: "testnet",
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [balance, setBalance] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const walletService = getStacksWalletService()

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      fetchBalance()
    }
  }, [walletState.isConnected])

  const checkConnection = () => {
    if (walletService.isConnected()) {
      const address = walletService.getAddress()
      setWalletState({
        address,
        isConnected: true,
        network: "testnet",
      })
    }
  }

  const fetchBalance = async () => {
    try {
      const contractAddress =
        process.env.NEXT_PUBLIC_USDCX_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const balance = await walletService.getUSDCxBalance(contractAddress)
      setBalance(balance)
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const state = await walletService.connectWallet()
      setWalletState(state)
      setIsModalOpen(false)
      toast.success("Wallet connected successfully!")
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast.error("Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    walletService.disconnectWallet()
    setWalletState({
      address: null,
      isConnected: false,
      network: "testnet",
    })
    setBalance(0)
    toast.success("Wallet disconnected")
  }

  const copyAddress = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Address copied to clipboard")
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!walletState.isConnected) {
    return (
      <>
        <Button onClick={() => setIsModalOpen(true)} className="bg-brand hover:bg-brand-dark">
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-dark border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl">Connect Your Stacks Wallet</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Connect your wallet to start trading USDCx
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <Card
                className="bg-card-bg border-white/10 p-6 cursor-pointer hover:border-brand transition-colors"
                onClick={handleConnect}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Hiro Wallet</h3>
                      <p className="text-sm text-muted-foreground">Connect with Hiro Wallet</p>
                    </div>
                  </div>
                  {isLoading && (
                    <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </Card>

              <p className="text-xs text-center text-muted-foreground">
                By connecting your wallet, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Card className="bg-card-bg border-white/10 px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{formatAddress(walletState.address!)}</span>
              <button onClick={copyAddress} className="hover:text-brand transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={`https://explorer.hiro.so/address/${walletState.address}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-xs text-muted-foreground">{balance.toFixed(2)} USDCx</div>
          </div>
        </div>

        <Button onClick={handleDisconnect} size="sm" variant="ghost" className="hover:bg-white/5">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
