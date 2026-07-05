import { db, CACHE_TTL, CACHE_TAGS } from './db';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  priority?: 'high' | 'medium' | 'low';
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  byTag: Record<string, number>;
}

class CacheService {
  private memoryCache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private maxMemorySize = 100; // Max entries in memory cache
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  /**
   * Get value from cache (multi-level: memory → IndexedDB → network)
   */
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache (fastest)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.stats.hits++;
      return memoryEntry.value;
    }

    // Level 2: IndexedDB (persistent)
    try {
      const dbEntry = await db.cache.get(key);
      if (dbEntry && !this.isExpired(dbEntry)) {
        this.stats.hits++;
        // Promote to memory cache
        this.setMemory(key, dbEntry.value, dbEntry.ttl);
        return dbEntry.value;
      }
    } catch (error) {
      console.error('IndexedDB cache error:', error);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache (all levels)
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const {
      ttl = CACHE_TTL.MEDIUM,
      tags = [],
      metadata = {}
    } = options;

    const timestamp = Date.now();

    // Level 1: Memory cache
    this.setMemory(key, value, ttl);

    // Level 2: IndexedDB
    try {
      await db.cache.put({
        key,
        value,
        timestamp,
        ttl,
        tags,
        metadata
      });
    } catch (error) {
      console.error('IndexedDB cache write error:', error);
    }
  }

  /**
   * Delete from cache (all levels)
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await db.cache.delete(key);
    } catch (error) {
      console.error('IndexedDB cache delete error:', error);
    }
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const entries = await db.cache.where('tags').equals(tag).toArray();
      
      // Remove from memory cache
      entries.forEach(entry => {
        this.memoryCache.delete(entry.key);
      });

      // Remove from IndexedDB
      await db.cache.where('tags').equals(tag).delete();
      
      this.stats.evictions += entries.length;
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => this.invalidateByTag(tag)));
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await db.cache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // Cleanup IndexedDB
    try {
      const expiredEntries = await db.cache
        .where('timestamp')
        .below(now - CACHE_TTL.VERY_LONG)
        .toArray();

      for (const entry of expiredEntries) {
        if (this.isExpired(entry)) {
          await db.cache.delete(entry.key);
          cleaned++;
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }

    this.stats.evictions += cleaned;
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const dbSize = await db.cache.count();
    const byTag: Record<string, number> = {};

    try {
      const allEntries = await db.cache.toArray();
      allEntries.forEach(entry => {
        entry.tags.forEach(tag => {
          byTag[tag] = (byTag[tag] || 0) + 1;
        });
      });
    } catch (error) {
      console.error('Stats collection error:', error);
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.memoryCache.size + dbSize,
      byTag
    };
  }

  /**
   * Warm cache with critical data
   */
  async warmup(keys: Array<{ key: string; fetcher: () => Promise<any>; options?: CacheOptions }>): Promise<void> {
    await Promise.all(
      keys.map(async ({ key, fetcher, options }) => {
        try {
          const value = await fetcher();
          await this.set(key, value, options);
        } catch (error) {
          console.error(`Cache warmup error for ${key}:`, error);
        }
      })
    );
  }

  /**
   * Prefetch data for upcoming operations
   */
  async prefetch(key: string, fetcher: () => Promise<any>, options?: CacheOptions): Promise<void> {
    // Check if already cached
    const cached = await this.get(key);
    if (cached) return;

    // Prefetch in background
    fetcher()
      .then(value => this.set(key, value, options || {}))
      .catch(error => console.error(`Prefetch error for ${key}:`, error));
  }

  // Private helper methods

  private setMemory<T>(key: string, value: T, ttl: number): void {
    // Evict oldest if at capacity
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
      this.stats.evictions++;
    }

    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  private isExpired(entry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheService.cleanup();
  }, 5 * 60 * 1000);
}
