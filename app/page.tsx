"use client"

import { useState, useEffect } from "react"
import {
  Bot,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  DollarSign,
  ChevronRight,
  Award,
  Gavel,
  BarChart3,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Navigation from "@/components/layout/Navigation"
import CommandPalette from "@/components/CommandPalette"
import OpportunityAlert from "@/components/advanced/OpportunityAlert"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PriceChart } from "@/components/dapp/PriceChart"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { StacksWalletButton } from "@/components/stacks/StacksWalletButton"
import { MintBadgeButton } from "@/components/nft/MintBadgeButton"
import { NftGallery } from "@/components/nft/NftGallery"
import { DaoPanel } from "@/components/dao/DaoPanel"
import { BotControlPanel } from "@/components/dapp/BotControlPanel"
import { LiveOpportunities } from "@/components/dapp/LiveOpportunities"
import { RecentTrades } from "@/components/dapp/RecentTrades"
import { WalletStatus } from "@/components/dapp/WalletStatus"
import { useDapp } from "@/lib/dapp/DappProvider"

export default function LandingPage() {
  const { prices, botStatus, performance, wallet, isLoading } = useDapp()
  const [spread, setSpread] = useState(1.5)

  // Calculate spread from real price data
  useEffect(() => {
    if (prices.length >= 2) {
      const ethPrice = prices.find((p) => p.chain === "ethereum")?.price || 1
      const stxPrice = prices.find((p) => p.chain === "stacks")?.price || 1
      const calculatedSpread = Math.abs(((ethPrice - stxPrice) / ethPrice) * 100)
      setSpread(calculatedSpread || 1.5)
    }
  }, [prices])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-darker text-white">
        <Navigation />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <CommandPalette />
        <OpportunityAlert />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand/10 via-transparent to-transparent" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-semibold">
            USDCx on Stacks Hackathon
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            AI-Powered Cross-Chain Arbitrage Bot
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto text-pretty">
            Automatically discover and execute profitable arbitrage opportunities across Ethereum and Stacks using
            AI-powered analysis and real-time price monitoring.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <StacksWalletButton />
            <Button size="lg" className="bg-brand hover:bg-brand-dark text-white">
              Get Started <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 bg-transparent">
              View Documentation
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-card-bg/50 border-white/10 p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-2">
                {isLoading ? "..." : `$${((performance?.totalProfit || 0) / 1000).toFixed(1)}K`}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Total Profit</div>
            </Card>
            <Card className="bg-card-bg/50 border-white/10 p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {isLoading ? "..." : performance?.totalTrades || 0}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Trades Executed</div>
            </Card>
            <Card className="bg-card-bg/50 border-white/10 p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-2">
                {isLoading ? "..." : `${((botStatus?.winRate || 0) * 100).toFixed(1)}%`}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Win Rate</div>
            </Card>
            <Card className="bg-card-bg/50 border-white/10 p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">{isLoading ? "..." : spread.toFixed(2) + "%"}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Avg Spread</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-4 bg-dark">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">The Problem</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-3xl mx-auto">
            Cross-chain arbitrage opportunities exist but are difficult to capture manually
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <TrendingUp className="w-12 h-12 text-error mb-6" />
              <h3 className="text-xl font-semibold mb-4">Manual Monitoring</h3>
              <p className="text-muted-foreground">
                Tracking prices across multiple chains manually is time-consuming and inefficient
              </p>
            </Card>

            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <Clock className="w-12 h-12 text-error mb-6" />
              <h3 className="text-xl font-semibold mb-4">Speed Matters</h3>
              <p className="text-muted-foreground">
                Arbitrage opportunities close quickly - milliseconds can mean the difference between profit and loss
              </p>
            </Card>

            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <DollarSign className="w-12 h-12 text-error mb-6" />
              <h3 className="text-xl font-semibold mb-4">Complex Execution</h3>
              <p className="text-muted-foreground">
                Coordinating trades across different chains requires technical expertise and gas optimization
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Our Solution</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-3xl mx-auto">
            An intelligent bot that monitors, analyzes, and executes arbitrage trades automatically
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-wrap justify-center gap-6">
                <Card className="bg-card-bg border-white/10 p-6 min-w-[200px] text-center border-l-4 border-l-ethereum hover:bg-brand/10">
                  <div className="text-lg font-semibold">Ethereum</div>
                  <div className="text-sm text-muted-foreground mt-2">Price Monitor</div>
                </Card>
                <Card className="bg-card-bg border-white/10 p-6 min-w-[200px] text-center border-l-4 border-l-stacks hover:bg-brand/10">
                  <div className="text-lg font-semibold">Stacks</div>
                  <div className="text-sm text-muted-foreground mt-2">Price Monitor</div>
                </Card>
              </div>

              <div className="w-0.5 h-12 bg-white/10" />

              <Card className="bg-card-bg border-white/10 p-6 min-w-[200px] text-center border-l-4 border-l-accent hover:bg-brand/10">
                <div className="text-lg font-semibold">AI Analysis Engine</div>
                <div className="text-sm text-muted-foreground mt-2">Opportunity Detection</div>
              </Card>

              <div className="w-0.5 h-12 bg-white/10" />

              <Card className="bg-card-bg border-white/10 p-6 min-w-[200px] text-center border-l-4 border-l-accent hover:bg-brand/10">
                <div className="text-lg font-semibold">Smart Execution</div>
                <div className="text-sm text-muted-foreground mt-2">Automated Trading</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="py-20 px-4 bg-darker">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-brand" />
            <h2 className="text-4xl font-bold text-center">Live Dashboard</h2>
          </div>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Connect your wallet to monitor and control the arbitrage bot in real-time
          </p>

          <div className="space-y-6">
            {/* Wallet Status */}
            <WalletStatus />

            {/* Bot Control Panel */}
            <BotControlPanel />

            {/* Price Chart */}
            <PriceChart />

            {/* Two column layout for opportunities and trades */}
            <div className="grid lg:grid-cols-2 gap-6">
              <LiveOpportunities />
              <RecentTrades />
            </div>
          </div>
        </div>
      </section>

      {/* DAO Governance Section */}
      <section id="governance" className="py-20 px-4 bg-dark">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gavel className="w-8 h-8 text-brand" />
            <h2 className="text-4xl font-bold text-center">DAO Governance</h2>
          </div>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Participate in decentralized governance to shape the future of the arbitrage bot. Create proposals, vote on
            parameter changes, and execute approved decisions.
          </p>

          <div className="max-w-2xl mx-auto">
            <DaoPanel />
          </div>
        </div>
      </section>

      {/* NFT Badges Section */}
      <section id="nft-badges" className="py-20 px-4 bg-dark">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="w-8 h-8 text-brand" />
            <h2 className="text-4xl font-bold text-center">NFT Badges</h2>
          </div>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Collect unique SIP-009 NFT badges for participating in arbitrage operations. Each badge commemorates your
            trading achievements on the platform.
          </p>

          <div className="flex justify-center mb-8">
            <MintBadgeButton />
          </div>

          <NftGallery />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Key Features</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-3xl mx-auto">
            Built with cutting-edge technology for optimal performance and reliability
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <Zap className="w-12 h-12 text-brand mb-6" />
              <h3 className="text-xl font-semibold mb-4">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Continuous price tracking across multiple DEXs and chains with sub-second latency
              </p>
            </Card>

            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <Bot className="w-12 h-12 text-brand mb-6" />
              <h3 className="text-xl font-semibold mb-4">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Machine learning algorithms identify profitable opportunities with high accuracy
              </p>
            </Card>

            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <Shield className="w-12 h-12 text-brand mb-6" />
              <h3 className="text-xl font-semibold mb-4">Secure Execution</h3>
              <p className="text-muted-foreground">
                Smart contract-based trading with built-in safety checks and slippage protection
              </p>
            </Card>

            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <Wallet className="w-12 h-12 text-brand mb-6" />
              <h3 className="text-xl font-semibold mb-4">Wallet Integration</h3>
              <p className="text-muted-foreground">
                Seamless Hiro Wallet integration for secure transaction signing and balance management
              </p>
            </Card>

            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <Gavel className="w-12 h-12 text-brand mb-6" />
              <h3 className="text-xl font-semibold mb-4">DAO Governance</h3>
              <p className="text-muted-foreground">
                Community-driven governance allows token holders to vote on protocol changes
              </p>
            </Card>

            <Card className="bg-card-bg border-white/10 p-8 hover:translate-y-[-8px] transition-transform hover:border-brand">
              <Award className="w-12 h-12 text-brand mb-6" />
              <h3 className="text-xl font-semibold mb-4">NFT Rewards</h3>
              <p className="text-muted-foreground">
                Earn unique SIP-009 NFT badges for completing trades and achieving milestones
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-4 bg-dark">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Our Team</h2>
          <p className="text-center text-muted-foreground mb-16">
            Built by blockchain and AI experts passionate about DeFi innovation
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {["Alex Chen", "Sarah Kumar", "Michael Park", "Emma Thompson"].map((name, i) => (
              <Card
                key={i}
                className="bg-card-bg border-white/10 p-8 text-center hover:translate-y-[-8px] transition-transform hover:border-brand"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center text-3xl font-bold">
                  {name[0]}
                </div>
                <h3 className="text-lg font-semibold mb-2">{name}</h3>
                <p className="text-accent font-medium text-sm">
                  {i === 0
                    ? "Lead Developer"
                    : i === 1
                      ? "Blockchain Engineer"
                      : i === 2
                        ? "AI Specialist"
                        : "Product Designer"}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-white/10 bg-darker">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-8 h-8 text-brand" />
                <span className="text-xl font-bold">ArbitrageBot</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                AI-powered cross-chain arbitrage for the next generation of DeFi trading
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-accent transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#dashboard" className="hover:text-accent transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#governance" className="hover:text-accent transition-colors">
                    Governance
                  </a>
                </li>
                <li>
                  <a href="#nft-badges" className="hover:text-accent transition-colors">
                    NFT Badges
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Smart Contracts
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-muted-foreground">
            <p>Built for the USDCx on Stacks Hackathon 2024</p>
          </div>
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  )
}
