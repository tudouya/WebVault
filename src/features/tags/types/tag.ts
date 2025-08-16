/**
 * Tag data type definitions
 * 
 * Defines the complete Tag interface for flexible tagging system
 * with color management and usage statistics.
 */

/**
 * Tag status enumeration
 */
export type TagStatus = 'active' | 'inactive' | 'hidden';

/**
 * Core Tag interface
 * 
 * Represents a tag entity with color, usage statistics,
 * and metadata for the WebVault tagging system.
 */
export interface Tag {
  /** Unique tag identifier */
  id: string;
  
  /** Tag display name */
  name: string;
  
  /** Tag description */
  description?: string;
  
  /** Tag slug for URL routing */
  slug: string;
  
  /** Tag display color */
  color?: string;
  
  /** Tag status */
  status: TagStatus;
  
  /** Website count using this tag */
  website_count: number;
  
  /** Tag usage frequency */
  usage_count: number;
  
  /** Tag trending indicator */
  trending: boolean;
  
  /** Tag group/namespace */
  group?: string;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Tag creation input interface
 */
export interface TagCreateInput {
  name: string;
  description?: string;
  slug: string;
  color?: string;
  group?: string;
}

/**
 * Tag update input interface
 */
export interface TagUpdateInput extends Partial<TagCreateInput> {
  id: string;
  status?: TagStatus;
}

/**
 * Tag navigation interface
 * 
 * For tag selection and navigation components
 */
export interface TagNavigation {
  id: string;
  name: string;
  slug: string;
  color?: string;
  website_count: number;
  trending: boolean;
}

/**
 * Tag statistics interface
 */
export interface TagStats {
  total_tags: number;
  active_tags: number;
  trending_tags: number;
  most_popular_groups: Array<{
    group: string;
    count: number;
  }>;
}