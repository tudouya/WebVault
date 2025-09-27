/**
 * 博客后台管理相关类型定义
 */

export const BLOG_POST_STATUSES = ["draft", "published", "archived"] as const;

export type BlogPostStatus = typeof BLOG_POST_STATUSES[number];

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  summary?: string;
  coverImage?: string | null;
  authorId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface BlogPostDetail extends BlogPostListItem {
  content: string;
}

export interface BlogPostListFilters {
  search?: string;
  status?: BlogPostStatus | "all";
  tag?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "recent" | "oldest" | "title";
}

export interface BlogPostListResult {
  items: BlogPostListItem[];
  page: number;
  pageSize: number;
  total: number;
}

