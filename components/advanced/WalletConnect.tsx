"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, Copy, ExternalLink, CheckCircle, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface WalletConnectProps {
  onConnect?: (address: string) => void
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const wallets = [
    { id: "metamask", name: "MetaMask", icon: "🦊" },
    { id: "walletconnect", name: "WalletConnect", icon: "🔗" },
    { id: "coinbase", name: "Coinbase Wallet", icon: "💙" },
  ]

  const handleConnect = (walletId: string) => {
    // Simulate wallet connection
    const mockAddress = "0x1234...5678"
    setAddress(mockAddress)
    setIsConnected(true)
    setShowModal(false)
    onConnect?.(mockAddress)
  }

  const handleDisconnect = () => {
    setAddress("")
    setIsConnected(false)
    setShowMenu(false)
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <>
        <Button onClick={() => setShowModal(true)} className="bg-brand hover:bg-brand-dark text-white">
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>

        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <Card className="bg-dark border-white/10 p-6">
                  <h3 className="text-2xl font-bold mb-6">Connect Wallet</h3>
                  <div className="space-y-3">
                    {wallets.map((wallet) => (
                      <motion.button
                        key={wallet.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleConnect(wallet.id)}
                        className="w-full flex items-center gap-4 p-4 bg-card-bg hover:bg-card border border-white/10 rounded-xl transition-colors"
                      >
                        <span className="text-3xl">{wallet.icon}</span>
                        <span className="font-semibold text-lg">{wallet.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <div className="relative">
      <Button onClick={() => setShowMenu(!showMenu)} className="bg-brand/20 hover:bg-brand/30 border border-brand/30">
        <Wallet className="w-4 h-4 mr-2" />
        {shortAddress(address)}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-64 z-50"
          >
            <Card className="bg-dark border-white/10 p-4">
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="text-sm text-muted-foreground mb-1">Connected Address</div>
                <div className="font-mono text-sm">{address}</div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center gap-3 p-2 hover:bg-card-bg rounded-lg transition-colors text-left"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{copied ? "Copied!" : "Copy Address"}</span>
                </button>

                <a
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-2 hover:bg-card-bg rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">View on Explorer</span>
                </a>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-3 p-2 hover:bg-error/20 rounded-lg transition-colors text-left text-error"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Disconnect</span>
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
