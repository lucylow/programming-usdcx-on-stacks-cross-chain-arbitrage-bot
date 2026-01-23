import React from "react"
import { AlertCircle, RefreshCw, WifiOff, Clock, AlertTriangle, HelpCircle } from "lucide-react"
import { Button } from "./button"
import { Card } from "./card"
import { cn } from "../../src/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "../../src/components/ui/alert"

export interface ErrorDisplayProps {
  error: Error | string
  code?: string
  retryable?: boolean
  onRetry?: () => void
  className?: string
  title?: string
  variant?: "card" | "alert" | "inline"
  showDetails?: boolean
}

// Map error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, { title: string; description: string; icon: typeof AlertCircle }> = {
  NETWORK_ERROR: {
    title: "Connection Problem",
    description: "Unable to connect to the server. Please check your internet connection and try again.",
    icon: WifiOff,
  },
  TIMEOUT_ERROR: {
    title: "Request Timed Out",
    description: "The request took too long to complete. This might be due to network issues or server load.",
    icon: Clock,
  },
  VALIDATION_ERROR: {
    title: "Invalid Input",
    description: "Please check your input and try again with valid values.",
    icon: AlertTriangle,
  },
  BRIDGE_ERROR: {
    title: "Bridge Service Unavailable",
    description: "The cross-chain bridge is currently unavailable. Please try again later.",
    icon: AlertCircle,
  },
  RATE_LIMIT_ERROR: {
    title: "Too Many Requests",
    description: "You've made too many requests. Please wait a moment before trying again.",
    icon: Clock,
  },
}

export function ErrorDisplay({
  error,
  code,
  retryable,
  onRetry,
  className,
  title,
  variant = "card",
  showDetails = false,
}: ErrorDisplayProps) {
  const message = error instanceof Error ? error.message : error
  const errorCode = code || (error instanceof Error && (error as any).code) || "UNKNOWN_ERROR"
  
  const errorInfo = ERROR_MESSAGES[errorCode] || {
    title: title || "Something went wrong",
    description: message,
    icon: AlertCircle,
  }
  
  const Icon = errorInfo.icon

  if (variant === "alert") {
    return (
      <Alert variant="destructive" className={cn("mb-4", className)}>
        <Icon className="h-4 w-4" />
        <AlertTitle>{errorInfo.title}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{errorInfo.description}</p>
          {showDetails && code && (
            <p className="text-xs opacity-75">Error Code: {code}</p>
          )}
          {retryable && onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-start gap-2 text-sm text-destructive", className)}>
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{errorInfo.title}</p>
          <p className="text-muted-foreground">{errorInfo.description}</p>
        </div>
        {retryable && onRetry && (
          <Button onClick={onRetry} variant="ghost" size="sm" className="flex-shrink-0">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <Icon className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{errorInfo.title}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{errorInfo.description}</p>
          {showDetails && code && (
            <p className="text-xs text-muted-foreground font-mono">Error Code: {code}</p>
          )}
        </div>
        {retryable && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {!retryable && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HelpCircle className="h-3 w-3" />
            <span>If this problem persists, please contact support</span>
          </div>
        )}
      </div>
    </Card>
  )
}


