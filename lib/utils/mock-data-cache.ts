/**
 * Mock data cache for Lovable integration
 * Provides caching with TTL to improve performance and reduce memory usage
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MockDataCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private maxSize: number = 100
  private defaultTtl: number = 5000 // 5 seconds

  constructor(maxSize = 100, defaultTtl = 5000) {
    this.maxSize = maxSize
    this.defaultTtl = defaultTtl
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    entries: Array<{ key: string; age: number; ttl: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }))

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
      entries,
    }
  }
}

// Singleton instance
let cacheInstance: MockDataCache | null = null

/**
 * Get or create cache instance
 */
export function getMockDataCache(maxSize = 100, defaultTtl = 5000): MockDataCache {
  if (!cacheInstance) {
    cacheInstance = new MockDataCache(maxSize, defaultTtl)
    
    // Auto-clean expired entries every 10 seconds
    if (typeof window !== "undefined") {
      setInterval(() => {
        cacheInstance?.cleanExpired()
      }, 10000)
    }
  }

  return cacheInstance
}

/**
 * Generate cache key from endpoint and optional params
 */
export function generateCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join("&")

  return `${endpoint}?${sortedParams}`
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T> | T,
  ttl?: number,
  useCache = true,
): Promise<T> {
  if (!useCache) {
    return typeof fn === "function" ? await fn() : fn
  }

  const cache = getMockDataCache()
  const cached = cache.get<T>(key)

  if (cached !== null) {
    return cached
  }

  const result = typeof fn === "function" ? await fn() : fn
  cache.set(key, result, ttl)

  return result
}
