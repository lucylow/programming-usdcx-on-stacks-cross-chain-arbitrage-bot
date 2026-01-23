/**
 * Type definitions for Lovable platform integration
 */

export interface LovableConfig {
  name: string
  description?: string
  version: string
  framework: "react" | "next" | "vue" | "svelte"
  buildTool: "vite" | "webpack" | "turbopack"
  features: {
    componentTagging: boolean
    mockDataFallback: boolean
    autoEnvironmentDetection: boolean
  }
  environment: {
    development: EnvironmentConfig
    production: EnvironmentConfig
  }
  api?: {
    baseUrl?: string
    retries?: number
    timeout?: number
    mockDataEnabled?: boolean
  }
  build?: {
    sourcemaps?: boolean
    optimizeChunks?: boolean
  }
}

export interface EnvironmentConfig {
  useMockData: boolean
  enableComponentTagging: boolean
  apiTimeout: number
}

export interface LovableDebugInfo {
  isLovableEnvironment: boolean
  shouldUseMockData: boolean
  environmentMode: "lovable" | "development" | "production"
  apiBaseUrl: string
  apiTimeout: number
  apiRetries: number
  componentTaggingEnabled: boolean
  config: LovableConfig
}
