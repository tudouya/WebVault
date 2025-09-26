import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { collections } from './collections';
import { websites } from './websites';

export const collectionItems = sqliteTable('collection_items', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id').notNull().references(() => collections.id),
  websiteId: text('website_id').notNull().references(() => websites.id),
  note: text('note'),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

