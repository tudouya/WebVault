/**
 * Drizzle Schema for Categories Table
 * 
 * Defines the categories table structure for storing website categories
 * in Cloudflare D1 (SQLite) database.
 * 
 * @version 1.0.0
 * @created 2025-08-25
 */

import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

/**
 * Categories Table
 * 
 * Stores website categories for organizing and filtering websites.
 * Each category has a unique slug for URL-friendly navigation.
 */
export const categories = sqliteTable(
  'categories',
  {
    // Primary key - UUID stored as TEXT
    id: text('id').primaryKey().notNull(),
    
    // Category information
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    
    // Visual styling
    color: text('color'), // Hex color code
    icon: text('icon'),   // Icon name or SVG
    
    // Timestamps - ISO 8601 format in TEXT
    created_at: text('created_at').notNull().default("datetime('now')"),
    updated_at: text('updated_at').notNull().default("datetime('now')"),
  },
  // Indexes for performance
  (table) => ({
    // Index for name lookups
    nameIdx: index('categories_name_idx').on(table.name),
    
    // Index for slug lookups (primary access method)
    slugIdx: index('categories_slug_idx').on(table.slug),
    
    // Index for created_at (sorting)
    createdAtIdx: index('categories_created_at_idx').on(table.created_at),
  })
);

/**
 * Type inference for TypeScript
 */
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type UpdateCategory = Partial<InsertCategory>;