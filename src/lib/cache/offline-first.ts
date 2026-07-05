import { useState, useEffect } from 'react';
import { cacheService, CACHE_TTL } from './cache-service';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Offline-first cache service
 * Ensures app functionality even without network connectivity
 */
export class OfflineFirstService {
  private isOnline = navigator.onLine;
  private operationQueue: QueuedOperation[] = [];
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.syncQueuedOperations();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  /**
   * Check if currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Queue an operation for when back online
   */
  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.operationQueue.push(queuedOp);
    await this.persistQueue();
  }

  /**
   * Sync queued operations when back online
   */
  private async syncQueuedOperations(): Promise<void> {
    if (!this.isOnline || this.operationQueue.length === 0) return;

    const { supabase } = await import('@/integrations/supabase/client');

    for (const operation of this.operationQueue) {
      try {
        await this.executeOperation(operation, supabase);
        // Remove successful operation
        this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        operation.retryCount++;

        if (operation.retryCount >= this.maxRetries) {
          // Remove failed operation after max retries
          this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    await this.persistQueue();
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation, supabase: any): Promise<void> {
    switch (operation.type) {
      case 'create':
        await supabase.from(operation.endpoint).insert(operation.data);
        break;
      case 'update':
        const { id, ...updateData } = operation.data;
        await supabase.from(operation.endpoint).update(updateData).eq('id', id);
        break;
      case 'delete':
        await supabase.from(operation.endpoint).delete().eq('id', operation.data.id);
        break;
    }
  }

  /**
   * Get offline data with fallback
   */
  async getOfflineData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Try cache first
    const cached = await cacheService.get<T>(key);
    if (cached) return cached;

    // If online, fetch from network
    if (this.isOnline) {
      try {
        const data = await fetcher();
        await cacheService.set(key, data, { ttl: CACHE_TTL.PERSISTENT });
        return data;
      } catch (error) {
        console.error('Network fetch failed, using cached data if available:', error);
      }
    }

    // Return cached data even if expired (better than nothing)
    return cached as T;
  }

  /**
   * Prefetch critical data for offline use
   */
  async prefetchOfflineData(keys: Array<{ key: string; fetcher: () => Promise<any> }>): Promise<void> {
    if (!this.isOnline) return;

    await Promise.all(
      keys.map(async ({ key, fetcher }) => {
        try {
          const data = await fetcher();
          await cacheService.set(key, data, { ttl: CACHE_TTL.PERSISTENT });
        } catch (error) {
          console.error(`Failed to prefetch ${key}:`, error);
        }
      })
    );
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      pending: this.operationQueue.length,
      operations: this.operationQueue,
      isOnline: this.isOnline
    };
  }

  /**
   * Clear operation queue
   */
  async clearQueue(): Promise<void> {
    this.operationQueue = [];
    await this.persistQueue();
  }

  /**
   * Persist queue to localStorage
   */
  private async persistQueue(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offline_operation_queue', JSON.stringify(this.operationQueue));
    }
  }

  /**
   * Load queue from localStorage
   */
  private async loadQueue(): Promise<void> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('offline_operation_queue');
      if (stored) {
        this.operationQueue = JSON.parse(stored);
      }
    }
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    await this.loadQueue();
    if (this.isOnline) {
      await this.syncQueuedOperations();
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }
}

// Singleton instance
export const offlineFirstService = new OfflineFirstService();

/**
 * React hook for offline-first functionality
 */
export function useOfflineFirst() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueStatus, setQueueStatus] = useState(offlineFirstService.getQueueStatus());

  useEffect(() => {
    // Initialize service
    offlineFirstService.initialize();

    const handleOnline = () => {
      setIsOnline(true);
      setQueueStatus(offlineFirstService.getQueueStatus());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setQueueStatus(offlineFirstService.getQueueStatus());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update queue status periodically
    const interval = setInterval(() => {
      setQueueStatus(offlineFirstService.getQueueStatus());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      offlineFirstService.destroy();
    };
  }, []);

  return {
    isOnline,
    queueStatus,
    getOfflineData: offlineFirstService.getOfflineData.bind(offlineFirstService),
    prefetchOfflineData: offlineFirstService.prefetchOfflineData.bind(offlineFirstService),
    queueOperation: offlineFirstService.queueOperation.bind(offlineFirstService),
    clearQueue: offlineFirstService.clearQueue.bind(offlineFirstService)
  };
}

/**
 * Higher-order component for offline-aware data fetching
 */
export function withOfflineData<T>(
  Component: React.ComponentType<any>,
  key: string,
  fetcher: () => Promise<T>
) {
  return function OfflineAwareComponent(props: any) {
    const { getOfflineData, isOnline } = useOfflineFirst();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      loadData();
    }, [key]);

    const loadData = async () => {
      try {
        setLoading(true);
        const result = await getOfflineData(key, fetcher);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Component
        {...props}
        data={data}
        loading={loading}
        error={error}
        isOnline={isOnline}
        refetch={loadData}
      />
    );
  };
}
