import { RecentTrades } from "@/components/dapp/RecentTrades"
import { Card } from "@/components/ui/card"
import { FileText, Filter, Download } from "lucide-react"
import Navigation from "@/components/layout/Navigation"
import { Button } from "@/components/ui/button"

export default function BotHistory() {
  return (
    <div className="min-h-screen bg-darker text-white">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Trading History</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-white/20">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="border-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Complete history of all arbitrage trades executed by the bot. Review past performance, analyze patterns,
            and optimize your trading strategy.
          </p>

          <RecentTrades />
        </div>
      </div>
    </div>
  )
}

