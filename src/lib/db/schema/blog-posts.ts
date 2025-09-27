import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const blogPosts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  summary: text('summary'),
  content: text('content').notNull(),
  status: text('status').notNull().default('draft'),
  publishedAt: text('published_at'),
  coverImage: text('cover_image'),
  authorId: text('author_id'),
  tags: text('tags'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
