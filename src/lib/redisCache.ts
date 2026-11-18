/**
 * Universal In-Memory & Edge-Persistent Redis Engine with TTL
 * 
 * Provides an in-browser/serverless implementation of standard Redis commands:
 * - String Operations: GET, SET, SETEX, DEL, EXISTS, INCR, INCRBY, DECR
 * - Hash Operations: HSET, HGET, HGETALL, HDEL, HEXISTS
 * - List Operations: LPUSH, RPUSH, LRANGE, LLEN, LPOP
 * - Key/TTL Management: EXPIRE, TTL, PERSIST, KEYS, FLUSHALL, DBSIZE
 * - Features: Active & Passive TTL Expiry, LRU Memory Capping, LocalStorage Persistence Sync, Event Pub/Sub
 */

export interface RedisEntry<T = any> {
  value: T;
  createdAt: number;
  accessedAt: number;
  expiresAt: number | null; // Timestamp in ms, or null for persistent
  hits: number;
}

export interface RedisSetOptions {
  ex?: number; // Expire in seconds
  px?: number; // Expire in milliseconds
  nx?: boolean; // Only set if key does NOT exist
  xx?: boolean; // Only set if key DOES exist
}

export interface RedisStats {
  totalKeys: number;
  hits: number;
  misses: number;
  evictions: number;
  uptimeSeconds: number;
  memoryEstimateBytes: number;
}

type EventListener = (payload: any) => void;

class RedisEngine {
  private store: Map<string, RedisEntry> = new Map();
  private persistentPrefix = 'ueams_redis:';
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private startTime = Date.now();
  private listeners: Map<string, Set<EventListener>> = new Map();
  private sweepInterval: any = null;
  private maxKeys = 2000; // LRU cap

  constructor() {
    this.restoreFromStorage();
    this.startActiveSweep();
  }

  // ─── Persistence Layer ────────────────────────────────────────────────────────
  private restoreFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.persistentPrefix)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry: RedisEntry = JSON.parse(raw);
            const actualKey = key.slice(this.persistentPrefix.length);
            // Ignore if expired
            if (entry.expiresAt && entry.expiresAt <= now) {
              localStorage.removeItem(key);
            } else {
              this.store.set(actualKey, entry);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[REDIS] Error restoring from localStorage:', e);
    }
  }

  private persistKey(key: string, entry: RedisEntry): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.persistentPrefix + key, JSON.stringify(entry));
    } catch (e) {
      // LocalStorage might be full; gracefully continue in-memory
    }
  }

  private removePersistentKey(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem(this.persistentPrefix + key);
    } catch {}
  }

  // ─── Active Expiration Sweep ──────────────────────────────────────────────────
  private startActiveSweep(): void {
    if (typeof window === 'undefined') return;
    this.sweepInterval = setInterval(() => {
      this.sweepExpiredKeys();
    }, 10000); // Check every 10s
  }

  public sweepExpiredKeys(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.store.delete(key);
        this.removePersistentKey(key);
        this.evictions++;
        purged++;
        this.emit('expired', { key });
      }
    }
    return purged;
  }

  private checkPassiveExpiry(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return true;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.removePersistentKey(key);
      this.evictions++;
      this.emit('expired', { key });
      return true;
    }
    return false;
  }

  private evictLRUIfNeeded(): void {
    if (this.store.size <= this.maxKeys) return;
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.accessedAt < oldestAccess) {
        oldestAccess = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this.removePersistentKey(oldestKey);
      this.evictions++;
      this.emit('evicted', { key: oldestKey, reason: 'LRU' });
    }
  }

  // ─── String Commands ──────────────────────────────────────────────────────────

  /**
   * SET key value [EX seconds] [PX milliseconds] [NX|XX]
   */
  public set<T = any>(key: string, value: T, options?: RedisSetOptions): boolean {
    const exists = this.store.has(key) && !this.checkPassiveExpiry(key);

    if (options?.nx && exists) return false;
    if (options?.xx && !exists) return false;

    let expiresAt: number | null = null;
    const now = Date.now();

    if (options?.ex !== undefined) {
      expiresAt = now + options.ex * 1000;
    } else if (options?.px !== undefined) {
      expiresAt = now + options.px;
    }

    const entry: RedisEntry<T> = {
      value,
      createdAt: now,
      accessedAt: now,
      expiresAt,
      hits: 0,
    };

    this.evictLRUIfNeeded();
    this.store.set(key, entry);
    this.persistKey(key, entry);
    this.emit('set', { key, value, expiresAt });
    return true;
  }

  /**
   * SETEX key seconds value
   */
  public setex<T = any>(key: string, seconds: number, value: T): boolean {
    return this.set(key, value, { ex: seconds });
  }

  /**
   * GET key
   */
  public get<T = any>(key: string): T | null {
    if (this.checkPassiveExpiry(key)) {
      this.misses++;
      return null;
    }

    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    entry.accessedAt = Date.now();
    entry.hits++;
    this.hits++;
    return entry.value as T;
  }

  /**
   * DEL key [key ...]
   */
  public del(...keys: string[]): number {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        this.store.delete(key);
        this.removePersistentKey(key);
        deletedCount++;
        this.emit('del', { key });
      }
    }
    return deletedCount;
  }

  /**
   * EXISTS key [key ...]
   */
  public exists(...keys: string[]): number {
    let count = 0;
    for (const key of keys) {
      if (this.store.has(key) && !this.checkPassiveExpiry(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * INCR key
   */
  public incr(key: string): number {
    return this.incrby(key, 1);
  }

  /**
   * INCRBY key increment
   */
  public incrby(key: string, increment: number): number {
    const current = this.get<number>(key);
    const num = current !== null ? Number(current) : 0;
    if (isNaN(num)) throw new Error('Value is not an integer');
    const newVal = num + increment;
    const entry = this.store.get(key);
    if (entry) {
      entry.value = newVal;
      entry.accessedAt = Date.now();
      this.persistKey(key, entry);
    } else {
      this.set(key, newVal);
    }
    return newVal;
  }

  /**
   * DECR key
   */
  public decr(key: string): number {
    return this.incrby(key, -1);
  }

  // ─── Key & TTL Commands ───────────────────────────────────────────────────────

  /**
   * EXPIRE key seconds
   */
  public expire(key: string, seconds: number): boolean {
    if (this.checkPassiveExpiry(key) || !this.store.has(key)) return false;
    const entry = this.store.get(key)!;
    entry.expiresAt = Date.now() + seconds * 1000;
    this.persistKey(key, entry);
    return true;
  }

  /**
   * TTL key
   * Returns:
   * - Remaining seconds if key has expiry
   * - -1 if key exists but has no expiry
   * - -2 if key does not exist or has expired
   */
  public ttl(key: string): number {
    if (this.checkPassiveExpiry(key) || !this.store.has(key)) return -2;
    const entry = this.store.get(key)!;
    if (entry.expiresAt === null) return -1;
    const diff = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return diff > 0 ? diff : -2;
  }

  /**
   * PERSIST key (removes timeout)
   */
  public persist(key: string): boolean {
    if (this.checkPassiveExpiry(key) || !this.store.has(key)) return false;
    const entry = this.store.get(key)!;
    if (entry.expiresAt === null) return false;
    entry.expiresAt = null;
    this.persistKey(key, entry);
    return true;
  }

  /**
   * KEYS pattern (supports glob * or exact)
   */
  public keys(pattern: string = '*'): string[] {
    const out: string[] = [];
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (!this.checkPassiveExpiry(key)) {
        if (pattern === '*' || regex.test(key)) {
          out.push(key);
        }
      }
    }
    return out;
  }

  /**
   * DBSIZE
   */
  public dbsize(): number {
    let size = 0;
    for (const key of this.store.keys()) {
      if (!this.checkPassiveExpiry(key)) size++;
    }
    return size;
  }

  /**
   * FLUSHALL
   */
  public flushall(): void {
    for (const key of this.store.keys()) {
      this.removePersistentKey(key);
    }
    this.store.clear();
    this.emit('flush', {});
  }

  // ─── Hash Commands ────────────────────────────────────────────────────────────

  /**
   * HSET key field value
   */
  public hset<T = any>(key: string, field: string, value: T): number {
    let hash = this.get<Record<string, T>>(key);
    let isNew = 0;
    if (!hash || typeof hash !== 'object' || Array.isArray(hash)) {
      hash = {};
      isNew = 1;
    }
    if (!(field in hash)) isNew = 1;
    hash[field] = value;
    this.set(key, hash);
    return isNew;
  }

  /**
   * HGET key field
   */
  public hget<T = any>(key: string, field: string): T | null {
    const hash = this.get<Record<string, T>>(key);
    if (!hash || typeof hash !== 'object') return null;
    return hash[field] ?? null;
  }

  /**
   * HGETALL key
   */
  public hgetall<T = any>(key: string): Record<string, T> {
    const hash = this.get<Record<string, T>>(key);
    if (!hash || typeof hash !== 'object') return {};
    return { ...hash };
  }

  /**
   * HDEL key field [field ...]
   */
  public hdel(key: string, ...fields: string[]): number {
    const hash = this.get<Record<string, any>>(key);
    if (!hash || typeof hash !== 'object') return 0;
    let count = 0;
    for (const f of fields) {
      if (f in hash) {
        delete hash[f];
        count++;
      }
    }
    if (count > 0) this.set(key, hash);
    return count;
  }

  // ─── List Commands ────────────────────────────────────────────────────────────

  /**
   * LPUSH key element [element ...]
   */
  public lpush<T = any>(key: string, ...elements: T[]): number {
    let list = this.get<T[]>(key);
    if (!Array.isArray(list)) list = [];
    list.unshift(...elements.reverse());
    this.set(key, list);
    return list.length;
  }

  /**
   * RPUSH key element [element ...]
   */
  public rpush<T = any>(key: string, ...elements: T[]): number {
    let list = this.get<T[]>(key);
    if (!Array.isArray(list)) list = [];
    list.push(...elements);
    this.set(key, list);
    return list.length;
  }

  /**
   * LRANGE key start stop
   */
  public lrange<T = any>(key: string, start: number, stop: number): T[] {
    const list = this.get<T[]>(key);
    if (!Array.isArray(list)) return [];
    const len = list.length;
    let s = start < 0 ? Math.max(0, len + start) : start;
    let e = stop < 0 ? len + stop : stop;
    if (s > e || s >= len) return [];
    return list.slice(s, e + 1);
  }

  /**
   * LLEN key
   */
  public llen(key: string): number {
    const list = this.get<any[]>(key);
    return Array.isArray(list) ? list.length : 0;
  }

  /**
   * LPOP key
   */
  public lpop<T = any>(key: string): T | null {
    const list = this.get<T[]>(key);
    if (!Array.isArray(list) || list.length === 0) return null;
    const item = list.shift()!;
    this.set(key, list);
    return item;
  }

  // ─── Pub/Sub & Event Emitter ──────────────────────────────────────────────────

  public on(event: string, callback: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  public emit(event: string, payload: any): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[REDIS] Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  // ─── Diagnostics & Monitoring ─────────────────────────────────────────────────

  public getStats(): RedisStats {
    let totalChars = 0;
    for (const [key, entry] of this.store.entries()) {
      totalChars += key.length + JSON.stringify(entry.value).length;
    }

    return {
      totalKeys: this.dbsize(),
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      memoryEstimateBytes: totalChars * 2, // Approximate UTF-16
    };
  }
}

// Global Singleton Instance
export const redis = new RedisEngine();
