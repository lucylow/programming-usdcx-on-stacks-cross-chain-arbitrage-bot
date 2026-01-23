/**
 * Lovable platform integration utilities
 * Provides environment detection and configuration for Lovable.dev
 */

import type { LovableConfig } from "./lovable.types"

// Load configuration from .lovable.config.json if available
let configCache: LovableConfig | null = null

/**
 * Load and cache Lovable configuration
 */
function loadLovableConfig(): LovableConfig {
  if (configCache) return configCache

  const defaultConfig: LovableConfig = {
    name: "Cross-Chain Arbitrage Bot",
    description: "AI-powered cross-chain arbitrage bot",
    version: "1.0.0",
    framework: "react",
    buildTool: "vite",
    features: {
      componentTagging: true,
      mockDataFallback: true,
      autoEnvironmentDetection: true,
    },
    environment: {
      development: {
        useMockData: true,
        enableComponentTagging: true,
        apiTimeout: 30000,
      },
      production: {
        useMockData: false,
        enableComponentTagging: false,
        apiTimeout: 30000,
      },
    },
    api: {
      baseUrl: "http://localhost:3001/api",
      retries: 3,
      timeout: 30000,
      mockDataEnabled: true,
    },
    build: {
      sourcemaps: true,
      optimizeChunks: true,
    },
  }

  // Try to load from config file (in production, this would be bundled)
  try {
    // In development, we can't easily load JSON files, so we use defaults
    // The actual config is in .lovable.config.json
    configCache = defaultConfig
  } catch {
    configCache = defaultConfig
  }

  return configCache
}

/**
 * Get Lovable configuration
 */
export function getLovableConfig(): LovableConfig {
  return loadLovableConfig()
}

/**
 * Detect if running on Lovable platform
 * Enhanced detection with multiple strategies
 */
export function isLovableEnvironment(): boolean {
  // Check for Lovable-specific environment variables
  if (import.meta.env.VITE_LOVABLE || import.meta.env.NEXT_PUBLIC_LOVABLE) {
    return true
  }

  // Check for Lovable domain patterns
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    const lovableDomains = [
      "lovable.dev",
      "lovable.app",
      "lovable.tech",
      "lovable.io",
      "lovable.com",
    ]
    if (lovableDomains.some((domain) => hostname.includes(domain))) {
      return true
    }

    // Check for subdomain patterns
    if (hostname.endsWith(".lovable.dev") || hostname.endsWith(".lovable.app")) {
      return true
    }
  }

  // Check for development mode with Lovable tagger enabled
  if (import.meta.env.DEV && import.meta.env.VITE_LOVABLE_TAGGER !== "false") {
    return true
  }

  // Check for Lovable user agent (if available)
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    if (navigator.userAgent.includes("Lovable")) {
      return true
    }
  }

  return false
}

/**
 * Check if mock data should be used
 * Always enabled on Lovable, can be overridden via env var
 */
export function shouldUseMockData(): boolean {
  const config = getLovableConfig()
  const env = getEnvironmentMode()

  // Explicit override (highest priority)
  if (import.meta.env.VITE_USE_MOCK_DATA === "false" || import.meta.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    return false
  }

  // Always use mock data on Lovable (unless explicitly disabled)
  if (isLovableEnvironment()) {
    return config.environment[env === "lovable" ? "development" : env]?.useMockData ?? true
  }

  // Check explicit enable flag
  if (import.meta.env.VITE_USE_MOCK_DATA === "true" || import.meta.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return true
  }

  // Use config default
  return config.environment[env]?.useMockData ?? false
}

/**
 * Get API base URL with Lovable fallback
 */
export function getApiBaseUrl(): string {
  const config = getLovableConfig()

  // Check for explicit API URL (highest priority)
  const explicitUrl = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL
  if (explicitUrl) {
    return explicitUrl
  }

  // On Lovable, use mock data (no backend required)
  if (isLovableEnvironment()) {
    return "" // Empty string will trigger mock data fallback
  }

  // Use config default or fallback
  return config.api?.baseUrl || "http://localhost:3001/api"
}

/**
 * Get API timeout from config
 */
export function getApiTimeout(): number {
  const config = getLovableConfig()
  const env = getEnvironmentMode()
  return config.environment[env === "lovable" ? "development" : env]?.apiTimeout ?? config.api?.timeout ?? 30000
}

/**
 * Get API retry count from config
 */
export function getApiRetries(): number {
  const config = getLovableConfig()
  return config.api?.retries ?? 3
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
 * Check if component tagging is enabled
 */
export function isComponentTaggingEnabled(): boolean {
  const config = getLovableConfig()
  const env = getEnvironmentMode()

  // Explicit override
  if (import.meta.env.VITE_LOVABLE_TAGGER === "false") {
    return false
  }

  // Use config
  return config.environment[env === "lovable" ? "development" : env]?.enableComponentTagging ?? config.features.componentTagging
}

/**
 * Log Lovable-specific information (only in development)
 */
export function logLovableInfo(): void {
  if (!import.meta.env.DEV) return

  const isLovable = isLovableEnvironment()
  const useMock = shouldUseMockData()
  const mode = getEnvironmentMode()

  if (isLovable || useMock) {
    console.group(
      "%c🚀 Lovable Integration",
      "color: #6366f1; font-weight: bold; font-size: 14px;"
    )
    console.log(`Environment: ${mode}`)
    console.log(`Mock Data: ${useMock ? "✅ Enabled" : "❌ Disabled"}`)
    console.log(`Component Tagging: ${isComponentTaggingEnabled() ? "✅ Enabled" : "❌ Disabled"}`)
    console.log(`API Base URL: ${getApiBaseUrl() || "(using mock data)"}`)
    console.log(`API Timeout: ${getApiTimeout()}ms`)
    console.log(`API Retries: ${getApiRetries()}`)
    if (useMock) {
      console.log("%c💡 Tip: Set VITE_USE_MOCK_DATA=false to disable mock data", "color: #888; font-style: italic;")
    }
    console.groupEnd()
  }
}

/**
 * Enhanced Lovable configuration with runtime values
 */
export const LOVABLE_CONFIG = {
  // Component tagging
  enableComponentTagging: isComponentTaggingEnabled(),

  // Mock data
  useMockData: shouldUseMockData(),

  // API settings
  apiTimeout: getApiTimeout(),
  apiRetries: getApiRetries(),
  apiBaseUrl: getApiBaseUrl(),

  // Environment
  environment: getEnvironmentMode(),
  isLovable: isLovableEnvironment(),

  // Development helpers
  enableDevLogs: import.meta.env.DEV,

  // Feature flags
  features: getLovableConfig().features,
} as const

/**
 * Debug helper: Get all Lovable configuration values
 */
export function getLovableDebugInfo(): Record<string, unknown> {
  return {
    isLovableEnvironment: isLovableEnvironment(),
    shouldUseMockData: shouldUseMockData(),
    environmentMode: getEnvironmentMode(),
    apiBaseUrl: getApiBaseUrl(),
    apiTimeout: getApiTimeout(),
    apiRetries: getApiRetries(),
    componentTaggingEnabled: isComponentTaggingEnabled(),
    config: getLovableConfig(),
  }
}
