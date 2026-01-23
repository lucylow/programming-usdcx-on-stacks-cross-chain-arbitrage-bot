/**
 * Lovable platform integration utilities
 * Provides environment detection and configuration for Lovable.dev
 */

/**
 * Detect if running on Lovable platform
 */
export function isLovableEnvironment(): boolean {
  // Check for Lovable-specific environment variables
  if (import.meta.env.VITE_LOVABLE || import.meta.env.NEXT_PUBLIC_LOVABLE) {
    return true
  }

  // Check for Lovable domain patterns
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (
      hostname.includes("lovable.dev") ||
      hostname.includes("lovable.app") ||
      hostname.includes("lovable.tech")
    ) {
      return true
    }
  }

  // Check for development mode with Lovable tagger
  if (import.meta.env.DEV && import.meta.env.VITE_LOVABLE_TAGGER !== "false") {
    return true
  }

  return false
}

/**
 * Check if mock data should be used
 * Always enabled on Lovable, can be overridden via env var
 */
export function shouldUseMockData(): boolean {
  // Explicit override
  if (import.meta.env.VITE_USE_MOCK_DATA === "false" || import.meta.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    return false
  }

  // Always use mock data on Lovable
  if (isLovableEnvironment()) {
    return true
  }

  // Check explicit enable flag
  return (
    import.meta.env.VITE_USE_MOCK_DATA === "true" ||
    import.meta.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
  )
}

/**
 * Get API base URL with Lovable fallback
 */
export function getApiBaseUrl(): string {
  // Check for explicit API URL
  const explicitUrl = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL
  if (explicitUrl) {
    return explicitUrl
  }

  // On Lovable, use mock data (no backend required)
  if (isLovableEnvironment()) {
    return "" // Empty string will trigger mock data fallback
  }

  // Default local development
  return "http://localhost:3001/api"
}

/**
 * Get environment mode
 */
export function getEnvironmentMode(): "lovable" | "development" | "production" {
  if (isLovableEnvironment()) {
    return "lovable"
  }
  if (import.meta.env.DEV) {
    return "development"
  }
  return "production"
}

/**
 * Log Lovable-specific information (only in development)
 */
export function logLovableInfo(): void {
  if (import.meta.env.DEV && isLovableEnvironment()) {
    console.log(
      "%c🚀 Lovable Mode Active",
      "color: #6366f1; font-weight: bold; font-size: 14px;"
    )
    console.log("Using mock data fallback for seamless development experience")
    console.log("Set VITE_USE_MOCK_DATA=false to disable mock data")
  }
}

/**
 * Lovable configuration
 */
export const LOVABLE_CONFIG = {
  // Component tagging
  enableComponentTagging: import.meta.env.VITE_LOVABLE_TAGGER !== "false",
  
  // Mock data
  useMockData: shouldUseMockData(),
  
  // API settings
  apiTimeout: 30000,
  apiRetries: 3,
  
  // Development helpers
  enableDevLogs: import.meta.env.DEV,
} as const
