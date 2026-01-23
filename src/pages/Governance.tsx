import { GovernanceDashboard } from "../../components/dao/GovernanceDashboard"
import Navigation from "@/components/layout/Navigation"
import { Gavel } from "lucide-react"

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <Gavel className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  DAO Governance
                </h1>
                <p className="text-muted-foreground mt-1">
                  Participate in decentralized decision-making for the arbitrage bot
                </p>
              </div>
            </div>
          </div>
          <GovernanceDashboard />
        </div>
      </div>
    </div>
  )
}
