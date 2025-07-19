/**
 * IndexedDB Cache Wrapper untuk penyimpanan cache persisten
 * Mendukung versioning dan garbage collection
 */

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  version: string;
  expiresAt?: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  dbName: string;
  version: number;
  storeName: string;
  defaultTTL?: number; // Time to live in milliseconds
  maxEntries?: number;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private config: CacheConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: CacheConfig) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxEntries: 1000,
      ...config
    };
  }

  /**
   * Initialize IndexedDB connection
   */
  private async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'key' });
          
          // Create indexes for efficient querying
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('version', 'version', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.init();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error(`Failed to get cache entry: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if entry has expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          // Remove expired entry
          store.delete(key);
          resolve(null);
          return;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        store.put(entry);

        resolve(entry.data);
      };
    });
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, version: string, ttl?: number): Promise<void> {
    await this.init();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = Date.now();
    const expiresAt = ttl ? now + ttl : (this.config.defaultTTL ? now + this.config.defaultTTL : undefined);

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      version,
      expiresAt,
      accessCount: 0,
      lastAccessed: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(entry);

      request.onerror = () => {
        reject(new Error(`Failed to set cache entry: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    await this.init();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new Error(`Failed to delete cache entry: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.init();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onerror = () => {
        reject(new Error(`Failed to clear cache: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Clear cache entries by version (for schema changes)
   */
  async clearByVersion(version: string): Promise<void> {
    await this.init();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index('version');
      const request = index.openCursor(IDBKeyRange.only(version));

      request.onerror = () => {
        reject(new Error(`Failed to clear cache by version: ${request.error?.message}`));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Garbage collection - remove expired and least accessed entries
   */
  async garbageCollect(): Promise<{ removed: number; total: number }> {
    await this.init();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error(`Failed to get all cache entries: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const entries: CacheEntry[] = request.result;
        const now = Date.now();
        let removedCount = 0;

        // Remove expired entries
        const validEntries = entries.filter(entry => {
          if (entry.expiresAt && now > entry.expiresAt) {
            store.delete(entry.key);
            removedCount++;
            return false;
          }
          return true;
        });

        // If still over limit, remove least accessed entries
        if (this.config.maxEntries && validEntries.length > this.config.maxEntries) {
          // Sort by access count (ascending) and last accessed (ascending)
          validEntries.sort((a, b) => {
            if (a.accessCount !== b.accessCount) {
              return a.accessCount - b.accessCount;
            }
            return a.lastAccessed - b.lastAccessed;
          });

          const entriesToRemove = validEntries.length - this.config.maxEntries;
          for (let i = 0; i < entriesToRemove; i++) {
            store.delete(validEntries[i].key);
            removedCount++;
          }
        }

        resolve({ removed: removedCount, total: entries.length });
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
    expiredEntries: number;
  }> {
    await this.init();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error(`Failed to get cache stats: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const entries: CacheEntry[] = request.result;
        const now = Date.now();
        
        let totalSize = 0;
        let oldestEntry: number | null = null;
        let newestEntry: number | null = null;
        let expiredEntries = 0;

        entries.forEach(entry => {
          // Estimate size (rough calculation)
          totalSize += JSON.stringify(entry).length;
          
          // Track oldest and newest
          if (oldestEntry === null || entry.timestamp < oldestEntry) {
            oldestEntry = entry.timestamp;
          }
          if (newestEntry === null || entry.timestamp > newestEntry) {
            newestEntry = entry.timestamp;
          }
          
          // Count expired entries
          if (entry.expiresAt && now > entry.expiresAt) {
            expiredEntries++;
          }
        });

        resolve({
          totalEntries: entries.length,
          totalSize,
          oldestEntry,
          newestEntry,
          expiredEntries
        });
      };
    });
  }

  /**
   * Check if cache entry exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Get multiple cache entries
   */
  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    await Promise.all(
      keys.map(async (key) => {
        const data = await this.get<T>(key);
        results.set(key, data);
      })
    );
    
    return results;
  }

  /**
   * Set multiple cache entries
   */
  async setMultiple<T>(entries: Array<{ key: string; data: T; version: string; ttl?: number }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, data, version, ttl }) => 
        this.set(key, data, version, ttl)
      )
    );
  }
}

export { IndexedDBCache, type CacheEntry, type CacheConfig };