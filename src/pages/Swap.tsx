import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { ArrowDownUp, Settings, RefreshCw, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

// @ts-ignore
import { useStacks } from "@lib/stacks/StacksProvider"

interface Token {
  symbol: string
  name: string
  balance: number
  chain: "ethereum" | "stacks"
  icon?: string
}

const tokens: Token[] = [
  { symbol: "STX", name: "Stacks", balance: 1250.5, chain: "stacks" },
  { symbol: "USDCx", name: "USD Coin (xReserve)", balance: 5000.0, chain: "stacks" },
  { symbol: "ETH", name: "Ethereum", balance: 2.5, chain: "ethereum" },
  { symbol: "USDC", name: "USD Coin", balance: 10000.0, chain: "ethereum" },
]

export default function Swap() {
  let stacksData: any = null
  
  try {
    stacksData = useStacks?.()
  } catch {}

  const [fromToken, setFromToken] = useState<Token>(tokens[0])
  const [toToken, setToToken] = useState<Token>(tokens[1])
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [showSettings, setShowSettings] = useState(false)

  // Mock exchange rate
  const exchangeRate = 1.05 // 1 STX = 1.05 USDCx
  const estimatedGas = 0.001

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error("Please enter an amount")
      return
    }

    if (parseFloat(fromAmount) > fromToken.balance) {
      toast.error("Insufficient balance")
      return
    }

    if (!stacksData?.isSignedIn) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsSwapping(true)
    // Simulate swap
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSwapping(false)
    toast.success(`Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`)
    setFromAmount("")
    setToAmount("")
  }

  const handleAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && !isNaN(parseFloat(value))) {
      const calculated = (parseFloat(value) * exchangeRate).toFixed(6)
      setToAmount(calculated)
    } else {
      setToAmount("")
    }
  }

  const handleReverse = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount("")
    setToAmount("")
  }

  const setMaxAmount = () => {
    setFromAmount(fromToken.balance.toString())
    const calculated = (fromToken.balance * exchangeRate).toFixed(6)
    setToAmount(calculated)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-darker via-dark to-darker">
      <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent mb-2">
              Swap Tokens
            </h1>
            <p className="text-muted-foreground">
              Exchange tokens across chains instantly
            </p>
          </div>

          {/* Swap Card */}
          <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Swap</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Settings Panel */}
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-darker/60 rounded-lg border border-white/5"
                >
                  <label className="text-sm font-medium mb-2 block">Slippage Tolerance</label>
                  <div className="flex gap-2">
                    <Input
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="flex-1"
                      placeholder="0.5"
                    />
                    <span className="text-sm text-muted-foreground self-center">%</span>
                  </div>
                </motion.div>
              )}

              {/* From Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">From</label>
                  <span className="text-xs text-muted-foreground">
                    Balance: {fromToken.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {fromToken.symbol}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="text-2xl font-semibold pr-20"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={setMaxAmount}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
                    >
                      MAX
                    </Button>
                  </div>
                  <Select
                    value={fromToken.symbol}
                    onValueChange={(value) => {
                      const token = tokens.find(t => t.symbol === value)
                      if (token) setFromToken(token)
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {token.chain}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReverse}
                  className="rounded-full w-10 h-10 border-2"
                >
                  <ArrowDownUp className="w-5 h-5" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">To</label>
                  <span className="text-xs text-muted-foreground">
                    Balance: {toToken.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toToken.symbol}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => setToAmount(e.target.value)}
                      placeholder="0.0"
                      className="text-2xl font-semibold"
                      readOnly
                    />
                  </div>
                  <Select
                    value={toToken.symbol}
                    onValueChange={(value) => {
                      const token = tokens.find(t => t.symbol === value)
                      if (token) setToToken(token)
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {token.chain}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exchange Rate Info */}
              {fromAmount && toAmount && (
                <div className="p-4 bg-darker/60 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">
                      1 {fromToken.symbol} = {exchangeRate.toFixed(4)} {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Gas</span>
                    <span className="font-medium">{estimatedGas} {fromToken.chain === "stacks" ? "STX" : "ETH"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className="font-medium">{slippage}%</span>
                  </div>
                </div>
              )}

              {/* Swap Button */}
              <Button
                onClick={handleSwap}
                disabled={isSwapping || !fromAmount || !toAmount}
                className="w-full h-12 text-lg font-semibold gap-2"
              >
                {isSwapping ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Swap
                  </>
                )}
              </Button>

              {!stacksData?.isSignedIn && (
                <p className="text-xs text-center text-muted-foreground">
                  Connect your wallet to swap tokens
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-brand">0.1%</p>
                <p className="text-xs text-muted-foreground mt-1">Trading Fee</p>
              </CardContent>
            </Card>
            <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-accent">Instant</p>
                <p className="text-xs text-muted-foreground mt-1">Settlement</p>
              </CardContent>
            </Card>
            <Card className="bg-dark/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-brand">Cross-Chain</p>
                <p className="text-xs text-muted-foreground mt-1">Supported</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
