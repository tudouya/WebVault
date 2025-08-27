/**
 * Cloudflare D1 Database Client Configuration
 * 
 * Provides configured Drizzle D1 client instances for database operations.
 * Supports both development and production environments with proper bindings.
 * 
 * Requirements:
 * - R4.1: Provide data access layer compatible with existing Supabase interface
 * - R2.1: Configure D1 database connection
 * - Purpose: Provide D1 database access through Drizzle ORM
 * 
 * @version 1.0.0
 * @created 2025-08-21
 */

import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/lib/db/schema';

// ============================================================================
// Environment Variables Validation
// ============================================================================

const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
const cloudflareD1DatabaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

if (!cloudflareAccountId) {
  throw new Error('Missing CLOUDFLARE_ACCOUNT_ID environment variable');
}

if (!cloudflareApiToken && process.env.NODE_ENV === 'production') {
  throw new Error('Missing CLOUDFLARE_API_TOKEN environment variable (required for production)');
}

if (!cloudflareD1DatabaseId) {
  throw new Error('Missing CLOUDFLARE_D1_DATABASE_ID environment variable');
}

// ============================================================================
// D1 Database Client
// ============================================================================

/**
 * Type for D1 database binding
 * This will be provided by Cloudflare Workers runtime
 */
declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

/**
 * D1 database client instance
 * 
 * Provides type-safe database operations through Drizzle ORM.
 * Automatically handles connection to Cloudflare D1 database.
 * 
 * Requirements: R4.1, R2.1
 */
let d1Client: DrizzleD1Database<typeof schema> | null = null;

/**
 * Get D1 database client
 * 
 * Creates a new client instance if one doesn't exist.
 * For production use with Cloudflare Workers, the D1 binding
 * will be provided by the runtime environment.
 * 
 * @param d1Binding - D1 database binding from Cloudflare Workers (optional in development)
 * @returns Configured Drizzle D1 database client
 */
export function getD1Client(d1Binding?: D1Database): DrizzleD1Database<typeof schema> {
  if (d1Client && !d1Binding) {
    return d1Client;
  }

  // In production (Cloudflare Workers), use the provided D1 binding
  if (d1Binding) {
    d1Client = drizzle(d1Binding, { 
      schema,
      logger: process.env.NODE_ENV === 'development'
    });
    return d1Client;
  }

  // In development, we'll need to use a local D1 database or mock
  // This will be handled by wrangler dev or similar tooling
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'D1Client: Running in development mode without D1 binding. ' +
      'Ensure you are using wrangler dev or have a local D1 setup.'
    );
  }

  // For now, throw an error if no binding is provided outside of Workers environment
  throw new Error(
    'D1 database binding is required. ' +
    'Make sure you are running in a Cloudflare Workers environment or provide a D1 binding.'
  );
}

// ============================================================================
// Database Operations Interface
// ============================================================================

/**
 * Database operations interface compatible with existing Supabase client
 * 
 * This provides a similar API structure to maintain compatibility
 * with existing code that uses Supabase client patterns.
 * 
 * Requirements: R4.1 (Compatible interface)
 */
export interface DatabaseClient {
  /**
   * Execute a raw SQL query
   * @param query - SQL query string
   * @param params - Query parameters
   */
  query<T = any>(query: string, params?: any[]): Promise<{ data: T[] | null; error: Error | null }>;

  /**
   * Get the underlying Drizzle client
   */
  drizzle(): DrizzleD1Database<typeof schema>;
}

/**
 * Create database client wrapper
 * 
 * Provides a compatibility layer similar to Supabase client interface
 * while using Drizzle ORM underneath for D1 operations.
 * 
 * @param d1Binding - D1 database binding from Cloudflare Workers
 * @returns Database client with compatible interface
 */
export function createDatabaseClient(d1Binding?: D1Database): DatabaseClient {
  const client = getD1Client(d1Binding);

  return {
    async query<T = any>(query: string, params: any[] = []): Promise<{ data: T[] | null; error: Error | null }> {
      try {
        // For raw queries, we can use the D1 binding directly if available
        if (d1Binding) {
          const result = await d1Binding.prepare(query).bind(...params).all();
          return { data: result.results as T[], error: null };
        }

        // Otherwise, throw an error as we can't execute raw queries without binding
        throw new Error('Raw query execution requires D1 binding');
      } catch (error) {
        console.error('D1 query error:', error);
        return { 
          data: null, 
          error: error instanceof Error ? error : new Error('Unknown database error')
        };
      }
    },

    drizzle(): DrizzleD1Database<typeof schema> {
      return client;
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Initialize D1 client for development/testing
 * 
 * This function helps with local development setup.
 * In production, the client should be initialized with proper D1 binding.
 */
export function initializeD1Client(d1Binding?: D1Database): void {
  try {
    d1Client = getD1Client(d1Binding);
    console.log('D1 client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize D1 client:', error);
    throw error;
  }
}

/**
 * Health check for D1 connection
 * 
 * Verifies that the D1 database connection is working properly.
 * Useful for deployment verification and monitoring.
 * 
 * @param d1Binding - D1 database binding
 * @returns Promise resolving to connection status
 */
export async function checkD1Health(d1Binding?: D1Database): Promise<{ 
  healthy: boolean; 
  error?: string 
}> {
  try {
    const client = createDatabaseClient(d1Binding);
    
    // Try to execute a simple query
    const result = await client.query('SELECT 1 as test');
    
    if (result.error) {
      return { healthy: false, error: result.error.message };
    }

    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown health check error'
    };
  }
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * D1 database configuration
 * 
 * Contains settings and metadata for D1 database operations.
 * Similar to the authConfig in supabase.ts for consistency.
 */
export const d1Config = {
  // Connection settings
  connection: {
    databaseId: cloudflareD1DatabaseId,
    accountId: cloudflareAccountId,
    // Don't expose the API token in config
  },
  
  // Query settings
  query: {
    timeout: 30000, // 30 seconds
    retries: 3,
    logQueries: process.env.NODE_ENV === 'development',
  },
  
  // Migration settings
  migrations: {
    directory: './src/lib/database/migrations',
    schemaPath: './src/lib/db/schema',
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export Drizzle types for convenience
 */
export type { DrizzleD1Database } from 'drizzle-orm/d1';
export type D1Client = DrizzleD1Database<typeof schema>;

// Schema re-exports for convenience
export { schema };
export * from '@/lib/db/schema';

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export for convenient imports
 * 
 * Note: This returns a factory function rather than a client instance
 * because D1 requires runtime binding from Cloudflare Workers.
 */
export default {
  getClient: getD1Client,
  createClient: createDatabaseClient,
  initialize: initializeD1Client,
  healthCheck: checkD1Health,
  config: d1Config,
};