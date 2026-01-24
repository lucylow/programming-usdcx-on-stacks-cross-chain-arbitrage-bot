import { Suspense } from "react"
import { Layout } from "@/components/layout/Layout"
import { StackingPanel, StackingPanelSkeleton } from "@/components/stacks/StackingPanel"
import { TransactionHistoryPanel } from "@/components/stacks/TransactionHistoryPanel"

export default function StackingPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">STX Stacking</h1>
          <p className="text-muted-foreground">
            Stack your STX tokens to earn Bitcoin rewards through Stacks' Proof of Transfer consensus mechanism.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<StackingPanelSkeleton />}>
              <StackingPanel />
            </Suspense>
          </div>
          
          <div className="lg:col-span-1">
            <TransactionHistoryPanel maxItems={5} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
