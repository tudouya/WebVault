/**
 * Database Type Definitions
 * 
 * TypeScript definitions for D1 database schema using Drizzle ORM.
 * This file provides type definitions and compatibility adapters for the migration
 * from Supabase (PostgreSQL) to Cloudflare D1 (SQLite).
 * 
 * Requirements satisfied:
 * - R2.1: D1 database contains all necessary tables
 * - R2.2: PostgreSQL-specific features have SQLite equivalents
 * - Maintain backward compatibility with existing code
 * 
 * @version 2.0.0 - Updated for D1/Drizzle migration
 * @created 2025-08-25
 */

// ============================================================================
// Drizzle Schema Type Re-exports
// ============================================================================

// ============================================================================
// Primary Database Types (Drizzle Schema Inferred)
// ============================================================================

/**
 * User Profile - Primary interface for admin users
 * Inferred from Drizzle schema: src/lib/db/schema/user-profiles.ts
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: 'admin';
  metadata: string | null; // JSON stored as TEXT in SQLite
  created_at: string;
  updated_at: string;
}

/**
 * Insert User Profile - For creating new users
 */
export interface InsertUserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role?: 'admin';
  metadata?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update User Profile - For updating existing users
 */
export interface UpdateUserProfile {
  id?: string;
  email?: string;
  name?: string | null;
  avatar?: string | null;
  role?: 'admin';
  metadata?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Auth Lockout - Primary interface for authentication lockouts
 * Inferred from Drizzle schema: src/lib/db/schema/auth-lockouts.ts
 */
export interface AuthLockout {
  id: string;
  email: string;
  attempt_count: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert Auth Lockout - For creating new lockout records
 */
export interface InsertAuthLockout {
  id?: string;
  email: string;
  attempt_count?: number;
  locked_until?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update Auth Lockout - For updating existing lockout records
 */
export interface UpdateAuthLockout {
  id?: string;
  email?: string;
  attempt_count?: number;
  locked_until?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Compatibility Types for Legacy Code
// ============================================================================

/**
 * Legacy UserProfile interface for backward compatibility
 * @deprecated Use UserProfile from Drizzle schema instead
 */
export interface LegacyUserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'admin';
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Legacy AuthLockout interface for backward compatibility
 * @deprecated Use AuthLockout from Drizzle schema instead
 */
export interface LegacyAuthLockout {
  email: string;
  attempt_count: number;
  locked_until: string | null;
  updated_at: string;
}

// ============================================================================
// D1/Drizzle Database Types
// ============================================================================

// Conditional import to avoid build errors during development
// TODO: Remove this when D1 types are fully available in build environment
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
  }
  
  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = unknown>(): Promise<T>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }
  
  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    error?: string;
    meta: any;
  }
  
  interface D1ExecResult {
    count: number;
    duration: number;
  }
}

/**
 * D1 Database Type with Drizzle Schema
 * 
 * This replaces the Supabase Database interface with D1-compatible types.
 * Uses Drizzle ORM schema for type inference and validation.
 */
export type D1Database = any; // TODO: Replace with DrizzleD1Database<typeof schema> when D1 types are available

/**
 * Database Client Type
 * 
 * Unified type for database operations that can be either:
 * - Drizzle D1 client (new implementation)
 * - Supabase client (legacy support during migration)
 */
export type DatabaseClient = D1Database;

// ============================================================================
// Legacy Supabase Database Interface (Compatibility)
// ============================================================================

/**
 * Legacy Supabase Database interface for backward compatibility
 * @deprecated Use D1Database and Drizzle schema types instead
 * 
 * This interface maintains the original Supabase structure to avoid
 * breaking existing code during the migration period. New code should
 * use the Drizzle schema types directly.
 */
export interface LegacyDatabase {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar: string | null;
          role: 'admin';
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar?: string | null;
          role?: 'admin';
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar?: string | null;
          role?: 'admin';
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      auth_lockouts: {
        Row: {
          id: string;
          email: string;
          attempt_count: number;
          locked_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          attempt_count?: number;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          attempt_count?: number;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin';
    };
  };
}

/**
 * Database type alias for backward compatibility
 * @deprecated Use D1Database instead
 */
export type Database = LegacyDatabase;

// ============================================================================
// Database Operation Types
// ============================================================================

/**
 * Generic database operation result
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

/**
 * Database transaction callback type
 */
export type TransactionCallback<T> = (tx: DatabaseClient) => Promise<T>;

/**
 * User role enum for type safety
 */
export const UserRole = {
  ADMIN: 'admin' as const
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// ============================================================================
// Migration Helper Types
// ============================================================================

/**
 * Migration status tracking
 */
export interface MigrationStatus {
  source: 'supabase' | 'd1';
  version: string;
  completed_at: string | null;
  rollback_available: boolean;
}

/**
 * Data export/import format
 */
export interface DataExport<T = any> {
  table_name: string;
  records: T[];
  exported_at: string;
  source_system: 'supabase' | 'd1';
  schema_version: string;
}