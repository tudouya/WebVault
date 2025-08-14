/**
 * Category data type definitions
 * 
 * Defines the complete Category interface with hierarchical structure
 * for navigation and filtering functionality.
 */

/**
 * Category status enumeration
 */
export type CategoryStatus = 'active' | 'inactive' | 'hidden';

/**
 * Core Category interface
 * 
 * Supports hierarchical structure with parent-child relationships
 * for multi-level category navigation (Group1-5 with subcategories).
 */
export interface Category {
  /** Unique category identifier */
  id: string;
  
  /** Category display name */
  name: string;
  
  /** Category description */
  description?: string;
  
  /** Category slug for URL routing */
  slug: string;
  
  /** Parent category ID (null for root categories) */
  parentId: string | null;
  
  /** Child categories (for hierarchical display) */
  children?: Category[];
  
  /** Category icon/image URL */
  icon_url?: string;
  
  /** Category display color/theme */
  color?: string;
  
  /** Category status */
  status: CategoryStatus;
  
  /** Display order for sorting */
  sort_order: number;
  
  /** Website count in this category */
  website_count: number;
  
  /** Whether category is expanded in navigation */
  is_expanded: boolean;
  
  /** Category visibility flag */
  is_visible: boolean;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Category creation input interface
 */
export interface CategoryCreateInput {
  name: string;
  description?: string;
  slug: string;
  parentId?: string | null;
  icon_url?: string;
  color?: string;
  sort_order?: number;
  is_visible?: boolean;
}

/**
 * Category update input interface
 */
export interface CategoryUpdateInput extends Partial<CategoryCreateInput> {
  id: string;
  status?: CategoryStatus;
  is_expanded?: boolean;
}

/**
 * Category tree node interface
 * 
 * Optimized for hierarchical navigation rendering
 */
export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryTreeNode[];
  website_count: number;
  is_expanded: boolean;
  sort_order: number;
}

/**
 * Category navigation interface
 * 
 * For category selection and navigation components
 */
export interface CategoryNavigation {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
  color?: string;
  website_count: number;
  children: CategoryNavigation[];
}

/**
 * Category breadcrumb interface
 */
export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

/**
 * Category statistics interface
 */
export interface CategoryStats {
  total_categories: number;
  active_categories: number;
  categories_with_websites: number;
  max_depth: number;
}