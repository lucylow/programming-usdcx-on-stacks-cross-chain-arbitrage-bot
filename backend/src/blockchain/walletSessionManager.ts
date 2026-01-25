/**
 * Wallet Session Manager
 * Handles wallet connection state, session persistence, and multi-address support
 */

import { logger } from "../utils/logger"
import { NetworkError, getErrorMessage } from "../utils/errors"

export interface WalletSession {
  stxAddress: string
  btcAddress?: string
  publicKey: string
  network: "mainnet" | "testnet"
  connectedAt: number
  lastActiveAt: number
  provider: "leather" | "xverse" | "hiro" | "unknown"
}

export interface SessionConfig {
  sessionTimeoutMs?: number
  maxInactivePeriodMs?: number
  enableAutoReconnect?: boolean
}

const DEFAULT_CONFIG: Required<SessionConfig> = {
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  maxInactivePeriodMs: 24 * 60 * 60 * 1000, // 24 hours
  enableAutoReconnect: true,
}

export class WalletSessionManager {
  private sessions: Map<string, WalletSession> = new Map()
  private config: Required<SessionConfig>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: SessionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startCleanupInterval()
  }

  /**
   * Register a new wallet session
   */
  createSession(params: {
    stxAddress: string
    btcAddress?: string
    publicKey: string
    network: "mainnet" | "testnet"
    provider?: WalletSession["provider"]
  }): WalletSession {
    const now = Date.now()
    
    const session: WalletSession = {
      stxAddress: params.stxAddress,
      btcAddress: params.btcAddress,
      publicKey: params.publicKey,
      network: params.network,
      connectedAt: now,
      lastActiveAt: now,
      provider: params.provider || "unknown",
    }

    this.sessions.set(params.stxAddress, session)
    logger.info(`Wallet session created for ${params.stxAddress} via ${session.provider}`)
    
    return session
  }

  /**
   * Get an active session by address
   */
  getSession(stxAddress: string): WalletSession | null {
    const session = this.sessions.get(stxAddress)
    
    if (!session) {
      return null
    }

    // Check if session has expired
    if (this.isSessionExpired(session)) {
      this.endSession(stxAddress)
      return null
    }

    // Update last active timestamp
    session.lastActiveAt = Date.now()
    return session
  }

  /**
   * Check if a session is still valid
   */
  isSessionValid(stxAddress: string): boolean {
    const session = this.sessions.get(stxAddress)
    return session !== null && session !== undefined && !this.isSessionExpired(session)
  }

  /**
   * End a wallet session
   */
  endSession(stxAddress: string): boolean {
    const existed = this.sessions.has(stxAddress)
    this.sessions.delete(stxAddress)
    
    if (existed) {
      logger.info(`Wallet session ended for ${stxAddress}`)
    }
    
    return existed
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): WalletSession[] {
    const active: WalletSession[] = []
    
    for (const [address, session] of this.sessions) {
      if (!this.isSessionExpired(session)) {
        active.push(session)
      } else {
        this.sessions.delete(address)
      }
    }
    
    return active
  }

  /**
   * Touch session to keep it alive
   */
  touchSession(stxAddress: string): boolean {
    const session = this.sessions.get(stxAddress)
    
    if (session && !this.isSessionExpired(session)) {
      session.lastActiveAt = Date.now()
      return true
    }
    
    return false
  }

  /**
   * Get session metrics
   */
  getMetrics(): {
    totalSessions: number
    activeSessions: number
    sessionsByNetwork: Record<string, number>
    sessionsByProvider: Record<string, number>
  } {
    const activeSessions = this.getActiveSessions()
    
    const sessionsByNetwork: Record<string, number> = {}
    const sessionsByProvider: Record<string, number> = {}
    
    for (const session of activeSessions) {
      sessionsByNetwork[session.network] = (sessionsByNetwork[session.network] || 0) + 1
      sessionsByProvider[session.provider] = (sessionsByProvider[session.provider] || 0) + 1
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      sessionsByNetwork,
      sessionsByProvider,
    }
  }

  /**
   * Check if session has expired
   */
  private isSessionExpired(session: WalletSession): boolean {
    const now = Date.now()
    const inactiveDuration = now - session.lastActiveAt
    const totalDuration = now - session.connectedAt
    
    return (
      inactiveDuration > this.config.maxInactivePeriodMs ||
      totalDuration > this.config.sessionTimeoutMs
    )
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, 5 * 60 * 1000)
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    let cleaned = 0
    
    for (const [address, session] of this.sessions) {
      if (this.isSessionExpired(session)) {
        this.sessions.delete(address)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired wallet sessions`)
    }
  }

  /**
   * Shutdown the session manager
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.sessions.clear()
    logger.info("Wallet session manager shutdown")
  }
}

// Singleton instance
let sessionManagerInstance: WalletSessionManager | null = null

export function getWalletSessionManager(config?: SessionConfig): WalletSessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new WalletSessionManager(config)
  }
  return sessionManagerInstance
}
