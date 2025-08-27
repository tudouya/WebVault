/**
 * Drizzle Schema for User Profiles Table
 * 
 * Defines the user_profiles table structure for storing admin user information
 * in Cloudflare D1 (SQLite) database. This schema replaces the PostgreSQL
 * user_profiles table with SQLite equivalents.
 * 
 * Requirements satisfied:
 * - R2.1: D1 database contains all necessary tables  
 * - R2.2: PostgreSQL-specific features have SQLite equivalents
 * - Purpose: Create user profile data model
 * 
 * @see src/lib/types/database.ts (UserProfile interface)
 */

import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

/**
 * User Profiles Table
 * 
 * Stores admin user profile information including authentication details
 * and metadata. This table supports the admin-only authentication system.
 * 
 * Schema Changes from PostgreSQL:
 * - UUID fields use TEXT instead of UUID type (SQLite limitation)
 * - JSONB fields use TEXT with JSON constraint (SQLite limitation) 
 * - Timestamps use TEXT in ISO 8601 format (SQLite best practice)
 * - Added explicit index for email lookup performance
 */
export const userProfiles = sqliteTable(
  'user_profiles',
  {
    // Primary key - UUID stored as TEXT
    id: text('id').primaryKey().notNull(),
    
    // Authentication fields
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar: text('avatar'),
    
    // Role field - only 'admin' role supported
    role: text('role').notNull().default('admin'),
    
    // Metadata - JSON stored as TEXT
    metadata: text('metadata'),
    
    // Timestamps - ISO 8601 format in TEXT
    created_at: text('created_at').notNull().default("datetime('now')"),
    updated_at: text('updated_at').notNull().default("datetime('now')"),
  },
  // Indexes for performance
  (table) => ({
    // Index for email lookups (authentication and user management)
    emailIdx: index('user_profiles_email_idx').on(table.email),
    
    // Index for role-based queries (admin filtering)
    roleIdx: index('user_profiles_role_idx').on(table.role),
    
    // Composite index for email + role lookups
    emailRoleIdx: index('user_profiles_email_role_idx').on(table.email, table.role),
  })
);

/**
 * Type inference for TypeScript
 * 
 * These types are automatically inferred from the schema and provide
 * type safety for database operations.
 */
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type UpdateUserProfile = Partial<InsertUserProfile>;