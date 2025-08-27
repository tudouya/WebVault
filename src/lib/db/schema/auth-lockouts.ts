/**
 * Drizzle Schema for Auth Lockouts Table
 * 
 * Defines the auth_lockouts table structure for tracking authentication
 * failures and account lockout status in Cloudflare D1 (SQLite) database.
 * This schema supports the security requirement of locking accounts after
 * repeated failed login attempts.
 * 
 * Requirements satisfied:
 * - R1.5: Login failures exceed 5 times lock account for 15 minutes
 * - R2.1: D1 database contains all necessary tables
 * - R2.2: PostgreSQL-specific features have SQLite equivalents
 * - Purpose: Track authentication failures
 * 
 * @see src/lib/types/database.ts (AuthLockout interface)
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Auth Lockouts Table
 * 
 * Stores authentication failure tracking and lockout information.
 * Used to implement account lockout security measures for failed login attempts.
 * 
 * Business Logic:
 * - Track failed login attempts per email address
 * - Lock account for 15 minutes after 5 failed attempts
 * - Reset attempt count after successful login or lockout expiry
 * - Support for indefinite lockouts by admin action
 * 
 * Schema Changes from PostgreSQL:
 * - UUID fields use TEXT instead of UUID type (SQLite limitation)
 * - Timestamps use TEXT in ISO 8601 format (SQLite best practice)
 * - INTEGER type for attempt_count (SQLite native type)
 * - Added explicit indexes for email and lockout status queries
 */
export const authLockouts = sqliteTable(
  'auth_lockouts',
  {
    // Primary key - UUID stored as TEXT
    id: text('id').primaryKey().notNull(),
    
    // Email address being tracked (not necessarily a registered user)
    email: text('email').notNull().unique(),
    
    // Number of consecutive failed attempts
    attempt_count: integer('attempt_count').notNull().default(0),
    
    // Lockout expiry time - NULL means not locked, ISO 8601 format
    locked_until: text('locked_until'),
    
    // Record creation and update timestamps
    created_at: text('created_at').notNull().default("datetime('now')"),
    updated_at: text('updated_at').notNull().default("datetime('now')"),
  },
  // Indexes for performance
  (table) => ({
    // Primary index for email lookups (most frequent operation)
    emailIdx: index('auth_lockouts_email_idx').on(table.email),
    
    // Index for finding active lockouts (cleanup operations)
    lockedUntilIdx: index('auth_lockouts_locked_until_idx').on(table.locked_until),
    
    // Composite index for email + lockout status queries
    emailLockoutIdx: index('auth_lockouts_email_lockout_idx').on(table.email, table.locked_until),
    
    // Index for attempt count queries (analytics and monitoring)
    attemptCountIdx: index('auth_lockouts_attempt_count_idx').on(table.attempt_count),
  })
);

/**
 * Type inference for TypeScript
 * 
 * These types are automatically inferred from the schema and provide
 * type safety for database operations. The types align with the
 * AuthLockout interface defined in src/lib/types/database.ts.
 */
export type AuthLockout = typeof authLockouts.$inferSelect;
export type InsertAuthLockout = typeof authLockouts.$inferInsert;
export type UpdateAuthLockout = Partial<InsertAuthLockout>;