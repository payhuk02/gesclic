import Dexie, { Table } from 'dexie';

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  lastCleanup: number;
}

export class GesclicCacheDB extends Dexie {
  cache!: Table<CacheEntry, string>;
  metrics!: Table<CacheMetrics, string>;

  constructor() {
    super('GesclicCacheDB');
    
    this.version(1).stores({
      cache: 'key, timestamp, ttl, tags',
      metrics: 'key'
    });
  }
}

export const db = new GesclicCacheDB();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 15 * 60 * 1000,      // 15 minutes
  LONG: 60 * 60 * 1000,        // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  PERSISTENT: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Cache tags for invalidation
export const CACHE_TAGS = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  MEDICAL_RECORDS: 'medical_records',
  PRESCRIPTIONS: 'prescriptions',
  PAYMENTS: 'payments',
  STAFF: 'staff',
  CLINIC_SETTINGS: 'clinic_settings',
  USER_PROFILE: 'user_profile',
  TELEmedicine: 'telemedicine',
  API_KEYS: 'api_keys',
  WEBHOOKS: 'webhooks',
  WORKFLOWS: 'workflows',
  ANALYTICS: 'analytics'
};
