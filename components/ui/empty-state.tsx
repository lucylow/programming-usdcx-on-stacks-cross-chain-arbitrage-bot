import { LucideIcon } from "lucide-react"
import { Button } from "./button"
import { Card } from "./card"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: "sm" | "md" | "lg"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      icon: "h-8 w-8",
      title: "text-base",
      description: "text-sm",
      padding: "p-4",
    },
    md: {
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-sm",
      padding: "p-6",
    },
    lg: {
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-base",
      padding: "p-8",
    },
  }

  const sizes = sizeClasses[size]

  return (
    <Card className={cn("bg-card/50 border-border", sizes.padding, className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <Icon className={cn("text-muted-foreground", sizes.icon)} />
        <div className="space-y-2">
          <h3 className={cn("font-semibold", sizes.title)}>{title}</h3>
          <p className={cn("text-muted-foreground max-w-md", sizes.description)}>
            {description}
          </p>
        </div>
        {(action || secondaryAction) && (
          <div className="flex items-center gap-3 mt-2">
            {action && (
              <Button onClick={action.onClick} size={size === "sm" ? "sm" : "default"}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" size={size === "sm" ? "sm" : "default"}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
