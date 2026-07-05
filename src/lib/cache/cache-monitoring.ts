import { useState, useEffect } from 'react';
import { cacheService } from './cache-service';

/**
 * Cache monitoring and metrics service
 * Tracks cache performance and provides insights
 */
export class CacheMonitoringService {
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    errors: 0,
    avgResponseTime: 0,
    responseTimes: [] as number[],
    byEndpoint: new Map<string, { hits: number; misses: number; avgTime: number }>(),
    byTag: new Map<string, { hits: number; misses: number; size: number }>()
  };

  private startTime = Date.now();

  /**
   * Record a cache request
   */
  recordRequest(key: string, hit: boolean, responseTime: number, tags: string[] = []): void {
    this.metrics.totalRequests++;
    
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
      this.metrics.networkRequests++;
    }

    // Track response time
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
    this.metrics.avgResponseTime = 
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;

    // Track by endpoint
    const endpoint = this.extractEndpoint(key);
    const endpointMetrics = this.metrics.byEndpoint.get(endpoint) || { hits: 0, misses: 0, avgTime: 0 };
    if (hit) {
      endpointMetrics.hits++;
    } else {
      endpointMetrics.misses++;
    }
    endpointMetrics.avgTime = this.updateAverage(endpointMetrics.avgTime, responseTime, hit ? endpointMetrics.hits : endpointMetrics.misses);
    this.metrics.byEndpoint.set(endpoint, endpointMetrics);

    // Track by tag
    tags.forEach(tag => {
      const tagMetrics = this.metrics.byTag.get(tag) || { hits: 0, misses: 0, size: 0 };
      if (hit) {
        tagMetrics.hits++;
      } else {
        tagMetrics.misses++;
      }
      this.metrics.byTag.set(tag, tagMetrics);
    });
  }

  /**
   * Record an error
   */
  recordError(key: string, error: Error): void {
    this.metrics.errors++;
    console.error(`Cache error for ${key}:`, error);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    const missRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheMisses / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      hitRate,
      missRate,
      uptime: Date.now() - this.startTime,
      byEndpoint: Object.fromEntries(this.metrics.byEndpoint),
      byTag: Object.fromEntries(this.metrics.byTag)
    };
  }

  /**
   * Get cache health status
   */
  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    if (hitRate >= 70 && this.metrics.errors < 10) {
      return 'healthy';
    } else if (hitRate >= 50 && this.metrics.errors < 50) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const metrics = this.getMetrics();
    const health = this.getHealthStatus();

    return {
      status: health,
      summary: {
        totalRequests: metrics.totalRequests,
        hitRate: metrics.hitRate.toFixed(2) + '%',
        avgResponseTime: metrics.avgResponseTime.toFixed(2) + 'ms',
        errorRate: ((metrics.errors / metrics.totalRequests) * 100).toFixed(2) + '%'
      },
      topEndpoints: this.getTopEndpoints(5),
      topTags: this.getTopTags(5),
      recommendations: this.getRecommendations(metrics)
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: [],
      byEndpoint: new Map(),
      byTag: new Map()
    };
    this.startTime = Date.now();
  }

  /**
   * Export metrics for monitoring systems
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify(metrics, null, 2);
  }

  // Private helper methods

  private extractEndpoint(key: string): string {
    const parts = key.split(':');
    return parts[0] || 'unknown';
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  private getTopEndpoints(limit: number) {
    return Array.from(this.metrics.byEndpoint.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        ...metrics,
        hitRate: (metrics.hits / (metrics.hits + metrics.misses)) * 100
      }))
      .sort((a, b) => b.hitRate - a.hitRate)
      .slice(0, limit);
  }

  private getTopTags(limit: number) {
    return Array.from(this.metrics.byTag.entries())
      .map(([tag, metrics]) => ({
        tag,
        ...metrics,
        hitRate: (metrics.hits / (metrics.hits + metrics.misses)) * 100
      }))
      .sort((a, b) => b.hitRate - a.hitRate)
      .slice(0, limit);
  }

  private getRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    const hitRate = metrics.hitRate;

    if (hitRate < 50) {
      recommendations.push('Cache hit rate is low. Consider increasing TTL for frequently accessed data.');
    }

    if (metrics.avgResponseTime > 500) {
      recommendations.push('Average response time is high. Consider optimizing cache warming strategies.');
    }

    if (metrics.errors > 100) {
      recommendations.push('High error rate detected. Review cache service logs for issues.');
    }

    const lowHitTags = Object.entries(metrics.byTag)
      .filter(([_, metrics]: any) => (metrics.hits / (metrics.hits + metrics.misses)) < 30)
      .map(([tag]) => tag);

    if (lowHitTags.length > 0) {
      recommendations.push(`Low hit rate for tags: ${lowHitTags.join(', ')}. Consider adjusting cache strategies.`);
    }

    return recommendations;
  }
}

// Singleton instance
export const cacheMonitoringService = new CacheMonitoringService();

/**
 * React hook for cache monitoring
 */
export function useCacheMonitoring() {
  const [metrics, setMetrics] = useState(cacheMonitoringService.getMetrics());
  const [health, setHealth] = useState(cacheMonitoringService.getHealthStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(cacheMonitoringService.getMetrics());
      setHealth(cacheMonitoringService.getHealthStatus());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    health,
    performanceReport: cacheMonitoringService.getPerformanceReport(),
    resetMetrics: cacheMonitoringService.resetMetrics.bind(cacheMonitoringService),
    exportMetrics: cacheMonitoringService.exportMetrics.bind(cacheMonitoringService)
  };
}
