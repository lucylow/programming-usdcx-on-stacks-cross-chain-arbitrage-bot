"use client"

import { AlertCircle, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStacks } from "@/lib/stacks/StacksProvider"

export function StacksErrorBoundary() {
  const { error, clearError } = useStacks()

  if (!error) return null

  return (
    <Card className="bg-red-500/10 border-red-500/20 p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-red-500 mb-1">Error</h4>
            <p className="text-sm text-muted-foreground break-words">{error.message}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearError}
          className="flex-shrink-0 hover:bg-red-500/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}


