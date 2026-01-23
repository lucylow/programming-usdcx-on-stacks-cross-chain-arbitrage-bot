import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Zap, AlertCircle, TrendingUp, Sparkles } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"

export default function BotOpportunities() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Arbitrage Opportunities
                </h1>
                <p className="text-muted-foreground mt-1">
                  Real-time market analysis
                </p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-3xl text-lg">
              Real-time arbitrage opportunities detected across Ethereum and Stacks networks. Click on any opportunity to
              view detailed analysis and execute trades.
            </p>
          </motion.div>

          {/* Enhanced Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="group relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:border-primary/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="relative p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <AlertCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg flex items-center gap-2">
                      How Opportunities Work
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Powered
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Our AI engine continuously monitors price differences between Ethereum and Stacks DEXs. When a
                      profitable arbitrage opportunity is detected (accounting for gas fees and slippage), it appears here.
                      Each opportunity shows the potential profit, risk level, and execution time estimate.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Opportunities Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Live Opportunities</CardTitle>
                  </div>
                  <Badge variant="outline" className="border-secondary/30 text-secondary">
                    <Zap className="w-3 h-3 mr-1 animate-pulse" />
                    Scanning...
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                      <Zap className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Opportunities Detected</h3>
                  <p className="text-muted-foreground mb-1 max-w-md">
                    The bot is actively scanning for arbitrage opportunities across both networks.
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Opportunities will appear here automatically when detected
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/60">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span>Monitoring Ethereum ↔ Stacks</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
