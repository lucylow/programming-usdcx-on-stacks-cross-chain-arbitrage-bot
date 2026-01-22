import { Card } from "@/components/ui/card"
import { Shield, AlertTriangle, TrendingDown, Activity } from "lucide-react"
import Navigation from "@/components/layout/Navigation"

export default function AnalyticsRisk() {
  return (
    <div className="min-h-screen bg-darker text-white">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-brand" />
            <h1 className="text-4xl font-bold">Risk Analysis</h1>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Comprehensive risk management metrics and analysis for your arbitrage operations.
          </p>

          {/* Risk Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Risk Score</span>
              </div>
              <div className="text-3xl font-bold text-white">Low</div>
              <div className="text-sm text-muted-foreground mt-2">Current assessment</div>
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-5 h-5 text-error" />
                <span className="text-sm text-muted-foreground">Max Drawdown</span>
              </div>
              <div className="text-3xl font-bold text-white">2.3%</div>
              <div className="text-sm text-muted-foreground mt-2">Peak to trough</div>
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingDown className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Volatility</span>
              </div>
              <div className="text-3xl font-bold text-white">12.5%</div>
              <div className="text-sm text-muted-foreground mt-2">30-day average</div>
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-5 h-5 text-brand" />
                <span className="text-sm text-muted-foreground">Safety Margin</span>
              </div>
              <div className="text-3xl font-bold text-white">85%</div>
              <div className="text-sm text-muted-foreground mt-2">Available buffer</div>
            </Card>
          </div>

          {/* Risk Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card-bg/50 border-white/10 p-6">
              <h3 className="text-xl font-semibold mb-4">Risk Factors</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Gas price volatility on Ethereum</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Bridge transaction delays</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Market slippage during execution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Smart contract risks</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-card-bg/50 border-white/10 p-6">
              <h3 className="text-xl font-semibold mb-4">Mitigation Strategies</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">✓</span>
                  <span>Real-time gas price monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">✓</span>
                  <span>Slippage protection mechanisms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">✓</span>
                  <span>Automated risk limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">✓</span>
                  <span>Multi-signature wallet support</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


