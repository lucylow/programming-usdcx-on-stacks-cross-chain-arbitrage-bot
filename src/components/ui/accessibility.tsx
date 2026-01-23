/**
 * Accessibility utilities and components
 */

import { useEffect, useRef } from "react"

/**
 * Hook to manage focus trap for modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleTab)
    firstElement?.focus()

    return () => {
      document.removeEventListener("keydown", handleTab)
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook to announce messages to screen readers
 */
export function useAriaLive() {
  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    const region = document.getElementById("aria-live-region") || createAriaLiveRegion()
    region.setAttribute("aria-live", priority)
    region.textContent = message

    // Clear after announcement
    setTimeout(() => {
      region.textContent = ""
    }, 1000)
  }

  return { announce }
}

function createAriaLiveRegion() {
  const region = document.createElement("div")
  region.id = "aria-live-region"
  region.setAttribute("aria-live", "polite")
  region.setAttribute("aria-atomic", "true")
  region.className = "sr-only"
  document.body.appendChild(region)
  return region
}

/**
 * Hook to skip to main content (for keyboard navigation)
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  )
}

/**
 * Screen reader only text
 */
export function SrOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}
