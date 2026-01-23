import { Card } from "../components/ui/card"
import { Zap, AlertCircle, TrendingUp } from "lucide-react"
import Navigation from "../components/layout/Navigation"

export default function BotOpportunities() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Arbitrage Opportunities</h1>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Real-time arbitrage opportunities detected across Ethereum and Stacks networks. Click on any opportunity to
            view detailed analysis and execute trades.
          </p>

          {/* Info Card */}
          <Card className="bg-card/50 border-border p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">How Opportunities Work</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI engine continuously monitors price differences between Ethereum and Stacks DEXs. When a
                  profitable arbitrage opportunity is detected (accounting for gas fees and slippage), it appears here.
                  Each opportunity shows the potential profit, risk level, and execution time estimate.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-card/50 border-border p-6">
            <p className="text-muted-foreground">Live opportunities will appear here.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
