/**
 * Browsable Pages Type Definitions
 * 
 * Defines types for the unified browsable page system supporting
 * collection detail, category browse, and tag browse pages.
 * 
 * Uses configuration-driven architecture to maximize component reuse
 * across different page types while maintaining type safety.
 */

import type { FilterState } from '@/features/websites/types/filters';
import type { WebsiteCardData } from '@/features/websites/types/website';
import type { PageType, BrowsablePageConfig } from './page-config';

// Re-export page configuration types
export type {
  BrowsablePageConfig,
  SortOption,
  FilterOption,
  AdvancedFilterConfig,
  ContentDisplayConfig,
  HeroConfig,
  NavigationConfig,
  SEOConfig,
  PerformanceConfig,
  AnalyticsConfig,
  PageType,
} from './page-config';

export {
  DEFAULT_PAGE_CONFIG,
  isValidPageConfig,
  mergeWithDefaults,
} from './page-config';

// PageType is now exported from './page-config'

/**
 * Extended filter parameters for browsable pages
 * 
 * Extends FilterState with page-type specific parameters
 */
export interface FilterParams extends Omit<FilterState, 'categoryId' | 'selectedTags'> {
  /** Page-specific entity ID (collection/category/tag ID) */
  entityId?: string | null;
  
  /** Secondary category filter (for tag pages) */
  categoryId?: string | null;
  
  /** Secondary tag filters (for category/collection pages) */
  selectedTags?: string[];
  
  /** View mode selection */
  viewMode?: 'grid' | 'list';
  
  /** Items per page for pagination */
  itemsPerPage?: number;
  
  /** Current page number */
  currentPage?: number;
}

// BrowsablePageConfig is now exported from './page-config'

/**
 * Unified data structure for browsable page content
 * 
 * Provides consistent data format across all page types
 * while allowing type-specific extensions through generics.
 */
export interface BrowsablePageData<T = unknown> {
  /** Entity information */
  entity: {
    /** Entity ID */
    id: string;
    /** Entity name/title */
    name: string;
    /** Entity slug for URLs */
    slug: string;
    /** Entity description */
    description?: string;
    /** Entity icon/image URL */
    iconUrl?: string;
    /** Entity color (for tags/categories) */
    color?: string;
    /** Entity statistics */
    stats: {
      /** Total websites in this entity */
      websiteCount: number;
      /** Entity creation date */
      createdAt: string;
      /** Last update date */
      updatedAt: string;
      /** Additional type-specific stats */
      additional?: Record<string, number>;
    };
    /** Type-specific entity data */
    metadata?: T;
  };
  
  /** Website content */
  websites: {
    /** Website list */
    items: WebsiteCardData[];
    /** Total count before filtering */
    totalCount: number;
    /** Current pagination info */
    pagination: {
      currentPage: number;
      itemsPerPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  
  /** Available filter options */
  filterOptions: {
    /** Available categories for filtering */
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      websiteCount: number;
    }>;
    /** Available tags for filtering */
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      websiteCount: number;
      color?: string;
    }>;
  };
  
  /** Related entities for navigation */
  related?: {
    /** Parent entities (for hierarchical structures) */
    parents?: Array<{
      id: string;
      name: string;
      slug: string;
      type: PageType;
    }>;
    /** Child entities */
    children?: Array<{
      id: string;
      name: string;
      slug: string;
      type: PageType;
      websiteCount: number;
    }>;
    /** Sibling/similar entities */
    similar?: Array<{
      id: string;
      name: string;
      slug: string;
      type: PageType;
      websiteCount: number;
    }>;
  };
  
  /** Breadcrumb navigation data */
  breadcrumbs: Array<{
    label: string;
    href: string;
    current: boolean;
  }>;
}

/**
 * Type-specific metadata interfaces
 */

/** Collection-specific metadata */
export interface CollectionMetadata {
  /** Collection curator information */
  curator?: {
    name: string;
    avatar?: string;
  };
  /** Collection featured status */
  isFeatured: boolean;
  /** Collection privacy setting */
  isPublic: boolean;
  /** Collection theme/topic */
  theme?: string;
}

/** Category-specific metadata */
export interface CategoryMetadata {
  /** Parent category ID */
  parentId?: string;
  /** Category hierarchy level */
  level: number;
  /** Category order within parent */
  sortOrder: number;
  /** Category featured status */
  isFeatured: boolean;
}

/** Tag-specific metadata */
export interface TagMetadata {
  /** Tag usage frequency */
  usageCount: number;
  /** Tag trend indicator */
  trending: boolean;
  /** Tag group/namespace */
  group?: string;
}

/**
 * URL parameter interface for browsable pages
 * 
 * Defines the structure for URL state synchronization
 * across all browsable page types.
 */
export interface BrowsablePageURLParams {
  /** Entity slug (collection/category/tag) */
  slug?: string | null;
  /** Search query */
  q?: string | null;
  /** Category filter */
  category?: string | null;
  /** Tag filters (comma-separated) */
  tags?: string | null;
  /** Sort field */
  sort?: string | null;
  /** Sort order */
  order?: 'asc' | 'desc' | null;
  /** View mode */
  view?: 'grid' | 'list' | null;
  /** Current page */
  page?: number | string | null;
  /** Items per page */
  limit?: number | string | null;
  /** Featured filter */
  featured?: boolean | string | null;
  /** Rating filter */
  rating?: number | string | null;
  /** Include ads filter */
  ads?: boolean | string | null;
}

/**
 * Page state interface for browsable pages
 * 
 * Manages the complete state for any browsable page type
 * including loading, error, and interaction states.
 */
export interface BrowsablePageState {
  /** Page configuration */
  config: BrowsablePageConfig;
  /** Page data */
  data?: BrowsablePageData;
  /** Current filter state */
  filters: FilterParams;
  /** Loading states */
  loading: {
    /** Initial page load */
    page: boolean;
    /** Content filtering/searching */
    content: boolean;
    /** Filter options loading */
    filters: boolean;
  };
  /** Error states */
  error: {
    /** Page-level error */
    page?: string;
    /** Content loading error */
    content?: string;
    /** Filter loading error */
    filters?: string;
  };
  /** UI interaction state */
  ui: {
    /** Sidebar open/closed */
    sidebarOpen: boolean;
    /** Mobile filters panel open */
    mobileFiltersOpen: boolean;
    /** View mode preference */
    viewMode: 'grid' | 'list';
  };
}

// Default page configurations are now exported from './page-config' as DEFAULT_PAGE_CONFIG