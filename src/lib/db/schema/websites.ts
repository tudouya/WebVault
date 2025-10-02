import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { categories } from './categories';

export const websites = sqliteTable('websites', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  slug: text('slug'),
  faviconUrl: text('favicon_url'),
  screenshotUrl: text('screenshot_url'),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  isAd: integer('is_ad', { mode: 'boolean' }).notNull().default(false),
  adType: text('ad_type'),
  visitCount: integer('visit_count').notNull().default(0),
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  submittedBy: text('submitted_by'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
