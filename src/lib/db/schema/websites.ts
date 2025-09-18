import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const websites = sqliteTable('websites', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  faviconUrl: text('favicon_url'),
  screenshotUrl: text('screenshot_url'),
  tags: text('tags'), // JSON string array
  category: text('category'),
  isAd: integer('is_ad', { mode: 'boolean' }).notNull().default(false),
  adType: text('ad_type'),
  rating: integer('rating'),
  visitCount: integer('visit_count').notNull().default(0),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

