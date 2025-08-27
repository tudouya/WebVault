/**
 * D1 Data Service Class
 * 
 * Provides abstract database operations for Cloudflare D1 using Drizzle ORM.
 * Offers a compatible interface with existing Supabase client patterns while
 * providing type-safe database operations and transaction support.
 * 
 * Requirements satisfied:
 * - R4.1: Data access layer compatible with existing Supabase interface
 * - R4.2: Type-safe queries using Drizzle ORM
 * - R4.4: Transaction support for atomic operations
 * - R4.6: Automatic retry on connection failure with exponential backoff
 * - R4.7: Fallback to read-only cache mode on repeated failures with admin notification
 * 
 * @version 1.0.0
 * @created 2025-08-21
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, or, sql, SQL, inArray, isNull, isNotNull, desc, asc } from 'drizzle-orm';
import { getD1Client, createDatabaseClient } from '@/lib/d1';
import * as schema from '@/lib/db/schema';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Database operation result interface
 * Compatible with Supabase response pattern
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

/**
 * Query filter interface for flexible filtering
 */
export interface QueryFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
  value?: any;
  values?: any[]; // for 'in' and 'notIn' operators
}

/**
 * Query options for pagination, sorting, and filtering
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    direction: 'asc' | 'desc';
  }[];
  filters?: QueryFilter[];
  select?: string[];
}

/**
 * Insert operation options
 */
export interface InsertOptions {
  onConflict?: 'ignore' | 'replace';
  returning?: string[];
}

/**
 * Update operation options
 */
export interface UpdateOptions {
  returning?: string[];
}

/**
 * Transaction callback function
 */
export type TransactionCallback<T> = (tx: DrizzleD1Database<typeof schema>) => Promise<T>;

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay?: number; // in milliseconds
  exponentialBackoff: boolean;
}

/**
 * Cache entry interface for fallback mode
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tableName: string;
  key: string;
}

/**
 * Cache configuration options
 */
interface CacheOptions {
  enabled: boolean;
  defaultTTL: number; // in milliseconds
  maxSize: number;
  fallbackDuration: number; // how long to remain in fallback mode
}

/**
 * Default retry configuration (R4.6)
 * - 3 retry attempts
 * - 1 second base delay
 * - Exponential backoff enabled
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true
};

/**
 * Default cache configuration
 * - 5 minute TTL for cached data
 * - 1000 entries max size
 * - 30 minute fallback duration
 */
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  fallbackDuration: 30 * 60 * 1000 // 30 minutes
};

/**
 * Admin notification interface
 */
interface AdminNotification {
  type: 'database_fallback' | 'database_recovery';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Simple admin notification service
 */
class AdminNotificationService {
  private notifications: AdminNotification[] = [];
  private maxNotifications = 100;

  notify(type: AdminNotification['type'], message: string, metadata?: Record<string, any>): void {
    const notification: AdminNotification = {
      type,
      message,
      timestamp: Date.now(),
      metadata
    };

    this.notifications.unshift(notification);
    
    // Keep only recent notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Log to console for immediate visibility
    console.warn(`[AdminNotification] ${type.toUpperCase()}: ${message}`, metadata);
    
    // In production, this could integrate with:
    // - Email service
    // - Slack/Discord webhook
    // - Database logging
    // - Monitoring service (Sentry, etc.)
  }

  getNotifications(type?: AdminNotification['type']): AdminNotification[] {
    if (type) {
      return this.notifications.filter(n => n.type === type);
    }
    return [...this.notifications];
  }

  clearNotifications(): void {
    this.notifications = [];
  }
}

/**
 * Simple in-memory cache manager
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private options: CacheOptions;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
  }

  set<T>(key: string, data: T, tableName: string, ttl?: number): void {
    if (!this.options.enabled) return;

    // Enforce cache size limit
    if (this.cache.size >= this.options.maxSize) {
      // Remove oldest entries (simple LRU)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTTL,
      tableName,
      key
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    if (!this.options.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(tableName?: string): void {
    if (tableName) {
      // Clear only entries for specific table
      const entries = Array.from(this.cache.entries());
      for (const [key, entry] of entries) {
        if (entry.tableName === tableName) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      enabled: this.options.enabled
    };
  }
}

// ============================================================================
// D1DataService Class
// ============================================================================

/**
 * D1 Data Service
 * 
 * Provides comprehensive database operations with a Supabase-compatible interface.
 * Uses Drizzle ORM for type safety and supports transactions for atomic operations.
 * 
 * Features:
 * - Type-safe CRUD operations
 * - Flexible querying with filters and pagination
 * - Transaction support for atomic operations
 * - Error handling with structured responses
 * - Raw SQL query execution capability
 * - Automatic retry with exponential backoff
 * - In-memory cache for fallback mode
 * - Admin notification system for service degradation
 * - Read-only cache fallback on connection failures
 */
export class D1DataService {
  private client: DrizzleD1Database<typeof schema>;
  private d1Binding?: D1Database;
  private retryOptions: RetryOptions;
  private cache: MemoryCache;
  private adminNotificationService: AdminNotificationService;
  private isInFallbackMode: boolean = false;
  private fallbackModeStartTime: number = 0;
  private consecutiveFailures: number = 0;

  constructor(
    d1Binding?: D1Database, 
    retryOptions?: Partial<RetryOptions>,
    cacheOptions?: Partial<CacheOptions>
  ) {
    this.d1Binding = d1Binding;
    this.client = getD1Client(d1Binding);
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
    this.cache = new MemoryCache(cacheOptions);
    this.adminNotificationService = new AdminNotificationService();
  }

  // ========================================================================
  // Retry Logic (R4.6: Automatic retry on connection failure)
  // ========================================================================

  /**
   * Check if an error is retryable (connection timeout or transient error)
   * 
   * @private
   * @param error - The error to check
   * @returns Boolean indicating if the error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';
    
    // Check for connection timeout errors
    const timeoutErrors = [
      'timeout',
      'connection timeout',
      'request timeout',
      'socket timeout',
      'network timeout'
    ];
    
    // Check for transient connection errors
    const connectionErrors = [
      'connection failed',
      'connection refused',
      'connection reset',
      'network error',
      'socket error',
      'econnrefused',
      'enotfound',
      'etimedout',
      'econnreset'
    ];

    // Check for D1 specific errors
    const d1Errors = [
      'd1_error',
      'database unavailable',
      'service unavailable',
      'temporarily unavailable'
    ];

    const allRetryableErrors = [...timeoutErrors, ...connectionErrors, ...d1Errors];
    
    return allRetryableErrors.some(errorType => 
      errorMessage.includes(errorType) || errorName.includes(errorType)
    );
  }

  /**
   * Calculate delay for retry attempt with exponential backoff
   * 
   * @private
   * @param attempt - Current attempt number (0-based)
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attempt: number): number {
    const { baseDelay, maxDelay = 10000, exponentialBackoff } = this.retryOptions;
    
    if (!exponentialBackoff) {
      return baseDelay;
    }

    // Exponential backoff: baseDelay * (2 ^ attempt)
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    
    // Cap the delay at maxDelay
    return Math.min(exponentialDelay, maxDelay);
  }

  /**
   * Sleep for the specified number of milliseconds
   * 
   * @private
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if we should exit fallback mode
   * 
   * @private
   * @returns Boolean indicating if fallback mode should be exited
   */
  private shouldExitFallbackMode(): boolean {
    if (!this.isInFallbackMode) return false;
    
    const fallbackDuration = this.cache.getStats().enabled ? DEFAULT_CACHE_OPTIONS.fallbackDuration : 0;
    const timeSinceFallback = Date.now() - this.fallbackModeStartTime;
    
    return timeSinceFallback > fallbackDuration;
  }

  /**
   * Enter fallback mode (R4.7: Fallback to cache on repeated failures)
   * 
   * @private
   * @param operationName - Name of the operation that triggered fallback
   * @param error - The error that caused the fallback
   */
  private enterFallbackMode(operationName: string, error: Error): void {
    if (this.isInFallbackMode) return;

    this.isInFallbackMode = true;
    this.fallbackModeStartTime = Date.now();
    
    const message = `Database connection failed after ${this.retryOptions.maxAttempts} attempts. Entering read-only cache fallback mode for operation: ${operationName}`;
    
    this.adminNotificationService.notify('database_fallback', message, {
      operationName,
      error: error.message,
      consecutiveFailures: this.consecutiveFailures,
      fallbackDuration: DEFAULT_CACHE_OPTIONS.fallbackDuration,
      cacheSize: this.cache.size()
    });

    console.warn(`[FALLBACK MODE] ${message}`);
  }

  /**
   * Exit fallback mode and notify admin of recovery
   * 
   * @private
   * @param operationName - Name of the operation that succeeded
   */
  private exitFallbackMode(operationName: string): void {
    if (!this.isInFallbackMode) return;

    const fallbackDuration = Date.now() - this.fallbackModeStartTime;
    this.isInFallbackMode = false;
    this.consecutiveFailures = 0;
    
    const message = `Database connection recovered. Exiting fallback mode after ${Math.round(fallbackDuration / 1000)}s. Operation: ${operationName}`;
    
    this.adminNotificationService.notify('database_recovery', message, {
      operationName,
      fallbackDuration,
      cacheSize: this.cache.size()
    });

    console.log(`[RECOVERY] ${message}`);
  }

  /**
   * Execute a database operation with automatic retry logic and cache fallback
   * 
   * @template T - Expected result type
   * @param operation - The database operation to execute
   * @param operationName - Name of the operation for logging
   * @param cacheKey - Optional cache key for read operations
   * @param tableName - Table name for cache organization
   * @returns Promise with operation result including retry metadata
   * 
   * Requirements: R4.6, R4.7
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'database operation',
    cacheKey?: string,
    tableName?: string
  ): Promise<T> {
    // Check if we should exit fallback mode
    if (this.shouldExitFallbackMode()) {
      // Try a simple health check first
      try {
        if (this.d1Binding) {
          await this.d1Binding.prepare('SELECT 1').first();
          this.exitFallbackMode(operationName);
        }
      } catch {
        // Still in fallback mode
      }
    }

    // If in fallback mode, try to serve from cache first
    if (this.isInFallbackMode && cacheKey) {
      const cachedResult = this.cache.get<T>(cacheKey);
      if (cachedResult !== null) {
        console.log(`[FALLBACK] Serving ${operationName} from cache (key: ${cacheKey})`);
        return cachedResult;
      } else {
        console.warn(`[FALLBACK] Cache miss for ${operationName} (key: ${cacheKey})`);
        throw new Error(`Service temporarily unavailable: ${operationName} not available in cache`);
      }
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.retryOptions.maxAttempts) {
      try {
        const result = await operation();
        
        // Operation succeeded
        if (attempt > 0) {
          console.log(`D1DataService: ${operationName} succeeded after ${attempt + 1} attempts`);
        }
        
        // Reset consecutive failures on success
        this.consecutiveFailures = 0;
        
        // Cache the result for read operations
        if (cacheKey && tableName) {
          this.cache.set(cacheKey, result, tableName);
        }
        
        // Exit fallback mode if we were in it
        if (this.isInFallbackMode) {
          this.exitFallbackMode(operationName);
        }
        
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(`Unknown error: ${error}`);
        
        // Check if we should retry
        if (!this.isRetryableError(error)) {
          console.warn(`D1DataService: ${operationName} failed with non-retryable error:`, error);
          throw lastError;
        }
        
        // Check if we have more attempts
        if (attempt + 1 >= this.retryOptions.maxAttempts) {
          console.error(`D1DataService: ${operationName} failed after ${this.retryOptions.maxAttempts} attempts:`, lastError);
          break;
        }

        // Calculate and apply delay
        const delay = this.calculateRetryDelay(attempt);
        console.warn(`D1DataService: ${operationName} failed (attempt ${attempt + 1}/${this.retryOptions.maxAttempts}), retrying in ${delay}ms:`, error);
        
        await this.sleep(delay);
        attempt++;
      }
    }

    // All retry attempts exhausted
    this.consecutiveFailures++;
    
    // Enter fallback mode if not already in it
    if (!this.isInFallbackMode) {
      this.enterFallbackMode(operationName, lastError!);
      
      // Try to serve from cache as last resort
      if (cacheKey) {
        const cachedResult = this.cache.get<T>(cacheKey);
        if (cachedResult !== null) {
          console.log(`[FALLBACK] Serving ${operationName} from cache after all retries failed (key: ${cacheKey})`);
          return cachedResult;
        }
      }
    }

    throw lastError || new Error(`${operationName} failed after ${this.retryOptions.maxAttempts} attempts`);
  }

  // ========================================================================
  // Query Operations (R4.2: Type-safe queries)
  // ========================================================================

  /**
   * Generate cache key for query operations
   * 
   * @private
   * @param tableName - Name of the table
   * @param options - Query options
   * @returns Cache key string
   */
  private generateCacheKey(tableName: string, options: QueryOptions = {}): string {
    const key = {
      table: tableName,
      filters: options.filters || [],
      orderBy: options.orderBy || [],
      limit: options.limit,
      offset: options.offset
    };
    return `query_${tableName}_${Buffer.from(JSON.stringify(key)).toString('base64')}`;
  }

  /**
   * Execute a select query with flexible options
   * 
   * @template T - Expected result type
   * @param tableName - Name of the table to query
   * @param options - Query options including filters, pagination, sorting
   * @returns Promise with query results
   * 
   * Requirements: R4.1, R4.2, R4.7
   */
  async query<T = any>(
    tableName: keyof typeof schema,
    options: QueryOptions = {}
  ): Promise<DatabaseResult<T[]>> {
    try {
      const cacheKey = this.generateCacheKey(String(tableName), options);
      
      const results = await this.executeWithRetry(async () => {
        const table = schema[tableName] as any;
        if (!table) {
          throw new Error(`Table ${String(tableName)} not found in schema`);
        }

        let query = this.client.select().from(table);

        // Apply filters
        if (options.filters && options.filters.length > 0) {
          const whereConditions = this.buildWhereConditions(table, options.filters);
          if (whereConditions.length > 0) {
            query = query.where(and(...whereConditions));
          }
        }

        // Apply sorting
        if (options.orderBy && options.orderBy.length > 0) {
          const orderExpressions = options.orderBy.map(order => {
            const column = table[order.column];
            return order.direction === 'desc' ? desc(column) : asc(column);
          });
          query = query.orderBy(...orderExpressions);
        }

        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit);
        }
        if (options.offset) {
          query = query.offset(options.offset);
        }

        return await query.execute();
      }, `query ${String(tableName)}`, cacheKey, String(tableName));

      return {
        data: results as T[],
        error: null,
        count: results.length
      };

    } catch (error) {
      console.error(`D1DataService query error for table ${String(tableName)}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown query error')
      };
    }
  }

  /**
   * Find a single record by filters
   * 
   * @template T - Expected result type
   * @param tableName - Name of the table to query
   * @param filters - Filter conditions
   * @returns Promise with single result or null
   */
  async findOne<T = any>(
    tableName: keyof typeof schema,
    filters: QueryFilter[]
  ): Promise<DatabaseResult<T>> {
    const result = await this.query<T>(tableName, { filters, limit: 1 });
    
    if (result.error) {
      return result as DatabaseResult<T>;
    }

    return {
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: null
    };
  }

  /**
   * Find record by primary key
   * 
   * @template T - Expected result type
   * @param tableName - Name of the table to query
   * @param id - Primary key value
   * @returns Promise with single result or null
   */
  async findById<T = any>(
    tableName: keyof typeof schema,
    id: string | number
  ): Promise<DatabaseResult<T>> {
    const cacheKey = `findById_${String(tableName)}_${id}`;
    
    try {
      const result = await this.executeWithRetry(async () => {
        const table = schema[tableName] as any;
        if (!table) {
          throw new Error(`Table ${String(tableName)} not found in schema`);
        }

        return await this.client.select().from(table).where(eq(table.id, id)).limit(1).execute();
      }, `findById ${String(tableName)}`, cacheKey, String(tableName));

      const data = result && result.length > 0 ? result[0] : null;
      return {
        data: data as T,
        error: null
      };

    } catch (error) {
      console.error(`D1DataService findById error for table ${String(tableName)}, id ${id}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown findById error')
      };
    }
  }

  // ========================================================================
  // Insert Operations (R4.2: Type-safe queries)
  // ========================================================================

  /**
   * Insert a single record
   * 
   * @template T - Expected result type
   * @param tableName - Name of the table to insert into
   * @param data - Data to insert
   * @param options - Insert options
   * @returns Promise with inserted record
   * 
   * Requirements: R4.1, R4.2
   */
  async insert<T = any>(
    tableName: keyof typeof schema,
    data: Record<string, any>,
    options: InsertOptions = {}
  ): Promise<DatabaseResult<T>> {
    try {
      const result = await this.executeWithRetry(async () => {
        const table = schema[tableName] as any;
        if (!table) {
          throw new Error(`Table ${String(tableName)} not found in schema`);
        }

        // Prepare insert query
        let insertQuery = this.client.insert(table).values(data);

        // Handle conflict resolution
        if (options.onConflict === 'ignore') {
          insertQuery = insertQuery.onConflictDoNothing();
        } else if (options.onConflict === 'replace') {
          insertQuery = insertQuery.onConflictDoUpdate({
            target: table.id,
            set: data
          });
        }

        return await insertQuery.returning().execute();
      }, `insert ${String(tableName)}`);

      return {
        data: result[0] as T,
        error: null
      };

    } catch (error) {
      console.error(`D1DataService insert error for table ${String(tableName)}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown insert error')
      };
    }
  }

  /**
   * Insert multiple records in batch
   * 
   * @template T - Expected result type
   * @param tableName - Name of the table to insert into
   * @param dataArray - Array of data to insert
   * @param options - Insert options
   * @returns Promise with inserted records
   */
  async insertBatch<T = any>(
    tableName: keyof typeof schema,
    dataArray: Record<string, any>[],
    options: InsertOptions = {}
  ): Promise<DatabaseResult<T[]>> {
    try {
      if (!dataArray || dataArray.length === 0) {
        return { data: [], error: null };
      }

      const result = await this.executeWithRetry(async () => {
        const table = schema[tableName] as any;
        if (!table) {
          throw new Error(`Table ${String(tableName)} not found in schema`);
        }

        let insertQuery = this.client.insert(table).values(dataArray);

        // Handle conflict resolution
        if (options.onConflict === 'ignore') {
          insertQuery = insertQuery.onConflictDoNothing();
        }

        return await insertQuery.returning().execute();
      }, `insertBatch ${String(tableName)}`);

      return {
        data: result as T[],
        error: null,
        count: result.length
      };

    } catch (error) {
      console.error(`D1DataService insertBatch error for table ${String(tableName)}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown batch insert error')
      };
    }
  }

  // ========================================================================
  // Update Operations (R4.2: Type-safe queries)
  // ========================================================================

  /**
   * Update records by filters
   * 
   * @template T - Expected result type
   * @param tableName - Name of the table to update
   * @param data - Data to update
   * @param filters - Filter conditions for update
   * @param options - Update options
   * @returns Promise with updated records
   * 
   * Requirements: R4.1, R4.2
   */
  async update<T = any>(
    tableName: keyof typeof schema,
    data: Record<string, any>,
    filters: QueryFilter[],
    options: UpdateOptions = {}
  ): Promise<DatabaseResult<T[]>> {
    try {
      const result = await this.executeWithRetry(async () => {
        const table = schema[tableName] as any;
        if (!table) {
          throw new Error(`Table ${String(tableName)} not found in schema`);
        }

        // Add updated_at timestamp if the column exists
        if ('updated_at' in table) {
          data.updated_at = sql`datetime('now')`;
        }

        const whereConditions = this.buildWhereConditions(table, filters);
        if (whereConditions.length === 0) {
          throw new Error('Update operation requires at least one filter condition');
        }

        let updateQuery = this.client
          .update(table)
          .set(data)
          .where(and(...whereConditions));

        return await updateQuery.returning().execute();
      }, `update ${String(tableName)}`);

      return {
        data: result as T[],
        error: null,
        count: result.length
      };

    } catch (error) {
      console.error(`D1DataService update error for table ${String(tableName)}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown update error')
      };
    }
  }

  /**
   * Update a single record by ID
   * 
   * @template T - Expected result type
   * @param tableName - Name of the table to update
   * @param id - Primary key value
   * @param data - Data to update
   * @param options - Update options
   * @returns Promise with updated record
   */
  async updateById<T = any>(
    tableName: keyof typeof schema,
    id: string | number,
    data: Record<string, any>,
    options: UpdateOptions = {}
  ): Promise<DatabaseResult<T>> {
    const result = await this.update<T>(
      tableName,
      data,
      [{ column: 'id', operator: 'eq', value: id }],
      options
    );

    if (result.error) {
      return result as DatabaseResult<T>;
    }

    return {
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: null
    };
  }

  // ========================================================================
  // Delete Operations (R4.2: Type-safe queries)
  // ========================================================================

  /**
   * Delete records by filters
   * 
   * @param tableName - Name of the table to delete from
   * @param filters - Filter conditions for deletion
   * @returns Promise with deletion result
   * 
   * Requirements: R4.1, R4.2
   */
  async delete(
    tableName: keyof typeof schema,
    filters: QueryFilter[]
  ): Promise<DatabaseResult<{ deletedCount: number }>> {
    try {
      const result = await this.executeWithRetry(async () => {
        const table = schema[tableName] as any;
        if (!table) {
          throw new Error(`Table ${String(tableName)} not found in schema`);
        }

        const whereConditions = this.buildWhereConditions(table, filters);
        if (whereConditions.length === 0) {
          throw new Error('Delete operation requires at least one filter condition');
        }

        return await this.client
          .delete(table)
          .where(and(...whereConditions))
          .returning()
          .execute();
      }, `delete ${String(tableName)}`);

      return {
        data: { deletedCount: result.length },
        error: null
      };

    } catch (error) {
      console.error(`D1DataService delete error for table ${String(tableName)}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown delete error')
      };
    }
  }

  /**
   * Delete a single record by ID
   * 
   * @param tableName - Name of the table to delete from
   * @param id - Primary key value
   * @returns Promise with deletion result
   */
  async deleteById(
    tableName: keyof typeof schema,
    id: string | number
  ): Promise<DatabaseResult<{ deletedCount: number }>> {
    return this.delete(tableName, [{ column: 'id', operator: 'eq', value: id }]);
  }

  // ========================================================================
  // Raw Query Operations (R4.1: Compatible interface)
  // ========================================================================

  /**
   * Execute raw SQL query
   * 
   * @template T - Expected result type
   * @param queryString - SQL query string
   * @param params - Query parameters
   * @returns Promise with query results
   * 
   * Requirements: R4.1
   */
  async rawQuery<T = any>(
    queryString: string,
    params: any[] = []
  ): Promise<DatabaseResult<T[]>> {
    try {
      const result = await this.executeWithRetry(async () => {
        if (!this.d1Binding) {
          throw new Error('Raw query execution requires D1 binding');
        }

        return await this.d1Binding.prepare(queryString).bind(...params).all();
      }, `rawQuery`);

      return {
        data: result.results as T[],
        error: null,
        count: result.results.length
      };

    } catch (error) {
      console.error('D1DataService raw query error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown raw query error')
      };
    }
  }

  /**
   * Execute raw SQL statement (for non-SELECT queries)
   * 
   * @param queryString - SQL statement string
   * @param params - Query parameters
   * @returns Promise with execution result
   */
  async rawExecute(
    queryString: string,
    params: any[] = []
  ): Promise<DatabaseResult<{ changes: number; lastRowId?: number }>> {
    try {
      const result = await this.executeWithRetry(async () => {
        if (!this.d1Binding) {
          throw new Error('Raw execute requires D1 binding');
        }

        return await this.d1Binding.prepare(queryString).bind(...params).run();
      }, `rawExecute`);

      return {
        data: {
          changes: result.changes,
          lastRowId: result.meta.last_row_id
        },
        error: null
      };

    } catch (error) {
      console.error('D1DataService raw execute error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown raw execute error')
      };
    }
  }

  // ========================================================================
  // Transaction Operations (R4.4: Transaction support)
  // ========================================================================

  /**
   * Execute operations within a transaction
   * 
   * @template T - Expected result type
   * @param callback - Transaction callback function
   * @returns Promise with transaction result
   * 
   * Requirements: R4.4
   */
  async transaction<T>(callback: TransactionCallback<T>): Promise<DatabaseResult<T>> {
    try {
      const result = await this.executeWithRetry(async () => {
        return await this.client.transaction(async (tx) => {
          return await callback(tx);
        });
      }, `transaction`);

      return {
        data: result,
        error: null
      };

    } catch (error) {
      console.error('D1DataService transaction error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Transaction failed')
      };
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Build WHERE conditions from QueryFilter array
   * 
   * @private
   * @param table - Table schema
   * @param filters - Array of filter conditions
   * @returns Array of SQL conditions
   */
  private buildWhereConditions(table: any, filters: QueryFilter[]): SQL[] {
    const conditions: SQL[] = [];

    for (const filter of filters) {
      const column = table[filter.column];
      if (!column) {
        console.warn(`Column ${filter.column} not found in table schema`);
        continue;
      }

      switch (filter.operator) {
        case 'eq':
          conditions.push(eq(column, filter.value));
          break;
        case 'neq':
          conditions.push(sql`${column} != ${filter.value}`);
          break;
        case 'gt':
          conditions.push(sql`${column} > ${filter.value}`);
          break;
        case 'gte':
          conditions.push(sql`${column} >= ${filter.value}`);
          break;
        case 'lt':
          conditions.push(sql`${column} < ${filter.value}`);
          break;
        case 'lte':
          conditions.push(sql`${column} <= ${filter.value}`);
          break;
        case 'like':
          conditions.push(sql`${column} LIKE ${filter.value}`);
          break;
        case 'ilike':
          conditions.push(sql`LOWER(${column}) LIKE LOWER(${filter.value})`);
          break;
        case 'in':
          if (filter.values && filter.values.length > 0) {
            conditions.push(inArray(column, filter.values));
          }
          break;
        case 'notIn':
          if (filter.values && filter.values.length > 0) {
            conditions.push(sql`${column} NOT IN ${filter.values}`);
          }
          break;
        case 'isNull':
          conditions.push(isNull(column));
          break;
        case 'isNotNull':
          conditions.push(isNotNull(column));
          break;
        default:
          console.warn(`Unsupported operator: ${filter.operator}`);
      }
    }

    return conditions;
  }

  /**
   * Get the underlying Drizzle client for advanced operations
   * 
   * @returns Drizzle D1 database client
   */
  getDrizzleClient(): DrizzleD1Database<typeof schema> {
    return this.client;
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics and fallback mode status
   */
  getCacheStats(): {
    cache: { size: number; maxSize: number; enabled: boolean };
    fallbackMode: { active: boolean; startTime: number; duration: number };
    consecutiveFailures: number;
  } {
    return {
      cache: this.cache.getStats(),
      fallbackMode: {
        active: this.isInFallbackMode,
        startTime: this.fallbackModeStartTime,
        duration: this.isInFallbackMode ? Date.now() - this.fallbackModeStartTime : 0
      },
      consecutiveFailures: this.consecutiveFailures
    };
  }

  /**
   * Get admin notifications
   * 
   * @param type - Optional filter by notification type
   * @returns Array of admin notifications
   */
  getAdminNotifications(type?: 'database_fallback' | 'database_recovery'): AdminNotification[] {
    return this.adminNotificationService.getNotifications(type);
  }

  /**
   * Clear admin notifications
   */
  clearAdminNotifications(): void {
    this.adminNotificationService.clearNotifications();
  }

  /**
   * Manually clear cache
   * 
   * @param tableName - Optional table name to clear specific table cache
   */
  clearCache(tableName?: string): void {
    this.cache.clear(tableName);
    console.log(`Cache cleared${tableName ? ` for table: ${tableName}` : ''}`);
  }

  /**
   * Manually exit fallback mode (admin override)
   */
  exitFallbackModeManually(): void {
    if (this.isInFallbackMode) {
      this.exitFallbackMode('manual override');
    }
  }

  /**
   * Health check for database connection
   * 
   * @returns Promise with health status
   */
  async healthCheck(): Promise<{ 
    healthy: boolean; 
    error?: string; 
    attempts?: number;
    fallbackMode: boolean;
    cacheSize: number;
  }> {
    try {
      let attempts = 0;
      const result = await this.executeWithRetry(async () => {
        attempts++;
        if (!this.d1Binding) {
          throw new Error('Health check requires D1 binding');
        }
        return await this.d1Binding.prepare('SELECT 1 as test').all();
      }, 'healthCheck');

      return { 
        healthy: true, 
        attempts, 
        fallbackMode: this.isInFallbackMode,
        cacheSize: this.cache.size()
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown health check error',
        attempts: this.retryOptions.maxAttempts,
        fallbackMode: this.isInFallbackMode,
        cacheSize: this.cache.size()
      };
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new D1DataService instance
 * 
 * @param d1Binding - Optional D1 database binding
 * @param retryOptions - Optional retry configuration
 * @param cacheOptions - Optional cache configuration
 * @returns New D1DataService instance
 */
export function createD1DataService(
  d1Binding?: D1Database, 
  retryOptions?: Partial<RetryOptions>,
  cacheOptions?: Partial<CacheOptions>
): D1DataService {
  return new D1DataService(d1Binding, retryOptions, cacheOptions);
}

/**
 * Get singleton D1DataService instance
 * 
 * @param d1Binding - Optional D1 database binding
 * @param retryOptions - Optional retry configuration
 * @param cacheOptions - Optional cache configuration
 * @returns Singleton D1DataService instance
 */
let d1DataServiceInstance: D1DataService | null = null;

export function getD1DataService(
  d1Binding?: D1Database, 
  retryOptions?: Partial<RetryOptions>,
  cacheOptions?: Partial<CacheOptions>
): D1DataService {
  if (!d1DataServiceInstance || d1Binding || retryOptions || cacheOptions) {
    d1DataServiceInstance = new D1DataService(d1Binding, retryOptions, cacheOptions);
  }
  return d1DataServiceInstance;
}

// ============================================================================
// Default Export
// ============================================================================

export default D1DataService;