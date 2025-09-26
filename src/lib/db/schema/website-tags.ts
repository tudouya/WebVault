import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

import { tags } from './tags';
import { websites } from './websites';

export const websiteTags = sqliteTable('website_tags', {
  websiteId: text('website_id').notNull().references(() => websites.id),
  tagId: text('tag_id').notNull().references(() => tags.id),
  assignedAt: text('assigned_at').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.websiteId, table.tagId] }),
}));
