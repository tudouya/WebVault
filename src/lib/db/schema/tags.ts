/**
 * Drizzle Schema for Tags Table
 * 
 * Defines the tags table structure for storing website tags
 * in Cloudflare D1 (SQLite) database.
 * 
 * @version 1.0.0
 * @created 2025-08-25
 */

import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

/**
 * Tags Table
 * 
 * Stores website tags for detailed categorization and filtering.
 * Tags provide more granular organization than categories.
 */
export const tags = sqliteTable(
  'tags',
  {
    // Primary key - UUID stored as TEXT
    id: text('id').primaryKey().notNull(),
    
    // Tag information
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    
    // Timestamps - ISO 8601 format in TEXT
    created_at: text('created_at').notNull().default("datetime('now')"),
    updated_at: text('updated_at').notNull().default("datetime('now')"),
  },
  // Indexes for performance
  (table) => ({
    // Index for name lookups
    nameIdx: index('tags_name_idx').on(table.name),
    
    // Index for slug lookups (primary access method)
    slugIdx: index('tags_slug_idx').on(table.slug),
    
    // Index for created_at (sorting)
    createdAtIdx: index('tags_created_at_idx').on(table.created_at),
  })
);

/**
 * Type inference for TypeScript
 */
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type UpdateTag = Partial<InsertTag>;