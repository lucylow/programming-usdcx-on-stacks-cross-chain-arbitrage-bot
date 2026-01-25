/**
 * Stacks Blockchain Connection Health Monitor
 * Monitors RPC health, latency, and handles failover between nodes
 */

import { logger } from "../utils/logger"
import { NetworkError, getErrorMessage } from "../utils/errors"

export interface NodeEndpoint {
  url: string
  network: "mainnet" | "testnet"
  priority: number
  isHealthy: boolean
  lastCheck: number
  latencyMs: number
  consecutiveFailures: number
}

export interface HealthCheckResult {
  healthy: boolean
  latencyMs: number
  blockHeight?: number
  error?: string
}

export interface HealthMonitorConfig {
  checkIntervalMs?: number
  unhealthyThreshold?: number
  latencyThresholdMs?: number
  timeoutMs?: number
}

const DEFAULT_CONFIG: Required<HealthMonitorConfig> = {
  checkIntervalMs: 30000, // 30 seconds
  unhealthyThreshold: 3, // 3 consecutive failures
  latencyThresholdMs: 5000, // 5 seconds max latency
  timeoutMs: 10000, // 10 second timeout
}

// Default Stacks node endpoints
const DEFAULT_MAINNET_NODES: string[] = [
  "https://stacks-node-api.mainnet.stacks.co",
  "https://api.hiro.so",
]

const DEFAULT_TESTNET_NODES: string[] = [
  "https://stacks-node-api.testnet.stacks.co",
  "https://api.testnet.hiro.so",
]

export class ConnectionHealthMonitor {
  private endpoints: Map<string, NodeEndpoint> = new Map()
  private config: Required<HealthMonitorConfig>
  private checkInterval: NodeJS.Timeout | null = null
  private currentEndpoint: NodeEndpoint | null = null

  constructor(config: HealthMonitorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize with default or custom endpoints
   */
  initialize(network: "mainnet" | "testnet", customUrls?: string[]): void {
    const urls = customUrls || (network === "mainnet" ? DEFAULT_MAINNET_NODES : DEFAULT_TESTNET_NODES)

    urls.forEach((url, index) => {
      this.addEndpoint(url, network, index + 1)
    })

    this.startHealthChecks()
    logger.info(`Health monitor initialized for ${network} with ${urls.length} endpoints`)
  }

  /**
   * Add a node endpoint to monitor
   */
  addEndpoint(url: string, network: "mainnet" | "testnet", priority: number = 10): void {
    const endpoint: NodeEndpoint = {
      url,
      network,
      priority,
      isHealthy: true, // Assume healthy until proven otherwise
      lastCheck: 0,
      latencyMs: 0,
      consecutiveFailures: 0,
    }

    this.endpoints.set(url, endpoint)
  }

  /**
   * Get the best available endpoint
   */
  getBestEndpoint(): NodeEndpoint | null {
    const healthy = Array.from(this.endpoints.values())
      .filter(ep => ep.isHealthy)
      .sort((a, b) => {
        // Sort by priority first, then by latency
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        return a.latencyMs - b.latencyMs
      })

    return healthy[0] || null
  }

  /**
   * Get the current active endpoint URL
   */
  getCurrentUrl(): string | null {
    if (!this.currentEndpoint || !this.currentEndpoint.isHealthy) {
      this.currentEndpoint = this.getBestEndpoint()
    }
    return this.currentEndpoint?.url || null
  }

  /**
   * Check health of a specific endpoint
   */
  async checkEndpointHealth(url: string): Promise<HealthCheckResult> {
    const start = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)

      const response = await fetch(`${url}/v2/info`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      })

      clearTimeout(timeoutId)

      const latencyMs = Date.now() - start

      if (!response.ok) {
        return {
          healthy: false,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()

      // Check if latency is acceptable
      if (latencyMs > this.config.latencyThresholdMs) {
        return {
          healthy: false,
          latencyMs,
          blockHeight: data.stacks_tip_height,
          error: `High latency: ${latencyMs}ms`,
        }
      }

      return {
        healthy: true,
        latencyMs,
        blockHeight: data.stacks_tip_height,
      }
    } catch (error) {
      const latencyMs = Date.now() - start
      return {
        healthy: false,
        latencyMs,
        error: getErrorMessage(error),
      }
    }
  }

  /**
   * Check health of all endpoints
   */
  async checkAllEndpoints(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>()

    const checks = Array.from(this.endpoints.keys()).map(async (url) => {
      const result = await this.checkEndpointHealth(url)
      results.set(url, result)
      this.updateEndpointStatus(url, result)
    })

    await Promise.allSettled(checks)
    return results
  }

  /**
   * Update endpoint status based on health check result
   */
  private updateEndpointStatus(url: string, result: HealthCheckResult): void {
    const endpoint = this.endpoints.get(url)
    if (!endpoint) return

    endpoint.lastCheck = Date.now()
    endpoint.latencyMs = result.latencyMs

    if (result.healthy) {
      endpoint.isHealthy = true
      endpoint.consecutiveFailures = 0
    } else {
      endpoint.consecutiveFailures++
      
      if (endpoint.consecutiveFailures >= this.config.unhealthyThreshold) {
        endpoint.isHealthy = false
        logger.warn(`Endpoint ${url} marked unhealthy after ${endpoint.consecutiveFailures} failures`)
        
        // If this was our current endpoint, switch to another
        if (this.currentEndpoint?.url === url) {
          this.currentEndpoint = this.getBestEndpoint()
          if (this.currentEndpoint) {
            logger.info(`Switched to fallback endpoint: ${this.currentEndpoint.url}`)
          }
        }
      }
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    if (this.checkInterval) {
      return
    }

    // Run initial check
    this.checkAllEndpoints().catch(err => {
      logger.error("Initial health check failed:", err)
    })

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllEndpoints().catch(err => {
        logger.error("Periodic health check failed:", err)
      })
    }, this.config.checkIntervalMs)
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Get health status report
   */
  getStatus(): {
    currentEndpoint: string | null
    endpoints: Array<{
      url: string
      healthy: boolean
      latencyMs: number
      lastCheck: number
    }>
    healthyCount: number
    totalCount: number
  } {
    const endpointList = Array.from(this.endpoints.values()).map(ep => ({
      url: ep.url,
      healthy: ep.isHealthy,
      latencyMs: ep.latencyMs,
      lastCheck: ep.lastCheck,
    }))

    return {
      currentEndpoint: this.getCurrentUrl(),
      endpoints: endpointList,
      healthyCount: endpointList.filter(ep => ep.healthy).length,
      totalCount: endpointList.length,
    }
  }

  /**
   * Force a health check and endpoint refresh
   */
  async refresh(): Promise<void> {
    await this.checkAllEndpoints()
    this.currentEndpoint = this.getBestEndpoint()
    logger.info("Connection health monitor refreshed")
  }

  /**
   * Shutdown the monitor
   */
  shutdown(): void {
    this.stopHealthChecks()
    this.endpoints.clear()
    this.currentEndpoint = null
    logger.info("Connection health monitor shutdown")
  }
}

// Singleton instance
let monitorInstance: ConnectionHealthMonitor | null = null

export function getConnectionHealthMonitor(config?: HealthMonitorConfig): ConnectionHealthMonitor {
  if (!monitorInstance) {
    monitorInstance = new ConnectionHealthMonitor(config)
  }
  return monitorInstance
}
