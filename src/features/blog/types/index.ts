/**
 * Blog data type definitions
 * 
 * Defines the blog interfaces for the blog page UI implementation
 * including blog card data and category filtering functionality.
 */

// 导入分类常量和类型
export { 
  BLOG_CATEGORIES, 
  BLOG_CATEGORY_CONFIG,
  BlogCategoryUtils,
  BLOG_CATEGORY_CONSTANTS
} from '../constants/categories';
export type { BlogCategoryType } from '../constants/categories';

/**
 * Author information interface
 */
export interface BlogAuthor {
  /** Author's display name */
  name: string;
  
  /** Author's avatar image URL (optional) */
  avatar?: string;
}

/**
 * Blog card data interface for UI display
 * 
 * Simplified data model optimized for blog card component consumption.
 * Contains all fields required for blog list display, filtering, and navigation.
 */
export interface BlogCardData {
  /** Unique blog post identifier */
  id: string;
  
  /** Blog post title */
  title: string;
  
  /** Blog post excerpt/summary */
  excerpt: string;
  
  /** URL slug for navigation */
  slug: string;
  
  /** Cover image URL */
  coverImage: string;
  
  /** Author information */
  author: BlogAuthor;
  
  /** Blog category (from predefined categories) */
  category: string;
  
  /** Publication timestamp for relative time calculation */
  publishedAt: string;
}