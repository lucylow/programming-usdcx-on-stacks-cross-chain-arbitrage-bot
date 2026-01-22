import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "./button"
import { Card } from "./card"
import { cn } from "@/lib/utils"

export interface ErrorDisplayProps {
  error: Error | string
  code?: string
  retryable?: boolean
  onRetry?: () => void
  className?: string
  title?: string
}

export function ErrorDisplay({
  error,
  code,
  retryable,
  onRetry,
  className,
  title = "An error occurred",
}: ErrorDisplayProps) {
  const message = error instanceof Error ? error.message : error

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
          {code && (
            <p className="text-xs text-muted-foreground">Error Code: {code}</p>
          )}
        </div>
        {retryable && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </Card>
  )
}


