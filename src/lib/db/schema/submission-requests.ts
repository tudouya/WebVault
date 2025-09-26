import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { websites } from './websites';

export const submissionRequests = sqliteTable('submission_requests', {
  id: text('id').primaryKey(),
  websiteId: text('website_id').references(() => websites.id),
  payload: text('payload').notNull(),
  submittedBy: text('submitted_by'),
  status: text('status').notNull().default('pending'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: text('reviewed_at'),
  createdAt: text('created_at').notNull(),
});

