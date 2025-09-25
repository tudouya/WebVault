/**
 * Collection data type definitions
 *
 * Defines the complete Collection interface with all business fields
 * including icon configuration, status management, and SEO capabilities.
 */

/**
 * Collection URL parameters for state synchronization
 */
export interface CollectionURLParams {
  /** Search query */
  search?: string | null;
  /** Tag filters (comma-separated) */
  tags?: string | null;
  /** Status filter */
  status?: string | null;
  /** Sort field */
  sort?: string | null;
  sortBy?: string | null; // Compatibility field
  /** Sort order */
  order?: 'asc' | 'desc' | null;
  sortOrder?: 'asc' | 'desc' | null; // Compatibility field
  /** Current page */
  page?: number | null;
  /** Items per page */
  limit?: number | null;
  /** View mode */
  view?: 'grid' | 'list' | null;
  /** Group by field */
  groupBy?: string | null;
  /** Show preview */
  showPreview?: boolean | null;
  /** Date from filter */
  dateFrom?: string | null;
  /** Date to filter */
  dateTo?: string | null;
  /** Created by filter */
  createdBy?: string | null;
}

/**
 * Collection status enumeration
 */
export type CollectionStatus = 'active' | 'inactive' | 'draft';

/**
 * Collection icon configuration interface
 * 
 * Defines the visual representation of a collection with
 * customizable colors and character display.
 */
export interface CollectionIcon {
  /** Icon character (emoji or single letter) */
  character: string;
  
  /** Icon background color (hex, rgb, or theme color) */
  backgroundColor: string;
  
  /** Icon text color (hex, rgb, or theme color) */
  textColor: string;
}

/**
 * Core Collection interface
 * 
 * Contains all fields required for collection display, management,
 * and business operations including organization and SEO.
 */
export interface Collection {
  /** Unique collection identifier */
  id: string;
  
  /** Collection name/title */
  title: string;
  
  /** Collection description */
  description: string;
  
  /** Collection icon configuration */
  icon: CollectionIcon;
  
  /** Number of websites in this collection */
  websiteCount: number;
  
  /** Collection creation timestamp */
  createdAt: string;
  
  /** Collection last update timestamp */
  updatedAt: string;
  
  /** Collection publication status */
  status: CollectionStatus;
  
  /** Associated tags for categorization */
  tags?: string[];
  
  /** Sort order weight (lower numbers appear first) */
  sortOrder?: number;
  
  /** Collection creator user ID */
  createdBy?: string;
  
  /** URL-friendly slug for SEO */
  slug?: string;
  
  /** SEO meta description */
  metaDescription?: string;
}

/**
 * Collection creation input interface
 */
export interface CollectionCreateInput {
  title: string;
  description: string;
  icon: CollectionIcon;
  tags?: string[];
  sortOrder?: number;
  slug?: string;
  metaDescription?: string;
  status?: CollectionStatus;
}

/**
 * Collection update input interface
 */
export interface CollectionUpdateInput extends Partial<CollectionCreateInput> {
  id: string;
  websiteCount?: number;
}

/**
 * Collection display card props interface
 * 
 * Optimized for UI component consumption in collection grids
 */
export interface CollectionCardData {
  id: string;
  title: string;
  description: string;
  icon: CollectionIcon;
  websiteCount: number;
  status?: CollectionStatus;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Collection filters interface for search and filtering
 */
export interface CollectionFilters {
  status?: CollectionStatus;
  tags?: string[];
  search?: string;
  createdBy?: string;
  sortBy?: 'title' | 'websiteCount' | 'createdAt' | 'updatedAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Collection pagination interface
 */
export interface CollectionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Collection list response interface
 */
export interface CollectionListResponse {
  collections: Collection[];
  pagination: CollectionPagination;
  filters: CollectionFilters;
}

/**
 * Collection statistics interface
 * 
 * Provides analytical data about collections
 */
export interface CollectionStats {
  totalCollections: number;
  activeCollections: number;
  totalWebsites: number;
  averageWebsitesPerCollection: number;
  mostPopularTags: Array<{
    tag: string;
    count: number;
  }>;
}

/**
 * Collection navigation interface
 * 
 * Used for breadcrumb and navigation components
 */
export interface CollectionNavigation {
  id: string;
  title: string;
  slug?: string;
}

/**
 * Collection breadcrumb interface
 * 
 * Hierarchical navigation path for collections
 */
export interface CollectionBreadcrumb {
  home: {
    label: string;
    href: string;
  };
  collections: {
    label: string;
    href: string;
  };
  current?: {
    label: string;
    href?: string;
  };
}

/**
 * Collection page state interface
 * 
 * Complete state management for collection index page supporting
 * loading states, error handling, pagination, and filtering.
 * 
 * Designed for use with Zustand store and URL state synchronization.
 */
export interface CollectionState {
  /** Current collection list */
  collections: Collection[];
  
  /** Loading state indicator */
  loading: boolean;
  
  /** Error message for display */
  error: string | null;
  
  /** Pagination information */
  pagination: {
    /** Current page number (1-based) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Total number of items */
    totalItems: number;
    /** Items per page limit */
    itemsPerPage: number;
  };
  
  /** Search query string */
  searchQuery?: string;
  
  /** Filter conditions */
  filters?: {
    /** Collection status filter */
    status?: CollectionStatus[];
    /** Tag-based filtering */
    tags?: string[];
    /** Date range filter */
    dateRange?: {
      from: string;
      to: string;
    };
    /** Creator filter */
    createdBy?: string;
  };
  
  /** Sort configuration */
  sorting?: {
    /** Sort field */
    sortBy: 'title' | 'websiteCount' | 'createdAt' | 'updatedAt' | 'sortOrder';
    /** Sort direction */
    sortOrder: 'asc' | 'desc';
  };
  
  /** View preferences */
  viewSettings?: {
    /** Display mode for collections */
    viewMode: 'grid' | 'list' | 'compact';
    /** Group collections by field */
    groupBy?: 'status' | 'tags' | 'createdBy' | 'none';
    /** Show collection previews */
    showPreview: boolean;
  };
}

/**
 * Collection search parameters interface
 * 
 * URL parameter synchronization for collection index page.
 * Supports nuqs type-safe search params integration.
 * 
 * All optional parameters allow clean URLs with defaults.
 */
export interface CollectionSearchParams {
  /** Search query parameter */
  search?: string;
  
  /** Current page number */
  page?: number;
  
  /** Items per page limit */
  limit?: number;
  
  /** Collection status filter (comma-separated) */
  status?: string;
  
  /** Tag filter (comma-separated tag IDs) */
  tags?: string;
  
  /** Sort field */
  sortBy?: 'title' | 'websiteCount' | 'createdAt' | 'updatedAt' | 'sortOrder';
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  
  /** View mode */
  view?: 'grid' | 'list' | 'compact';
  
  /** Group by field */
  groupBy?: 'status' | 'tags' | 'createdBy' | 'none';
  
  /** Show preview toggle */
  showPreview?: boolean;
  
  /** Date range start */
  dateFrom?: string;
  
  /** Date range end */
  dateTo?: string;
  
  /** Creator filter */
  createdBy?: string;
}

/**
 * Default collection state
 * 
 * Initial state values for collection index page
 */
export const DEFAULT_COLLECTION_STATE: Partial<CollectionState> = {
  collections: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 12,
  },
  searchQuery: '',
  filters: {
    status: undefined,
    tags: undefined,
    dateRange: undefined,
    createdBy: undefined,
  },
  sorting: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  viewSettings: {
    viewMode: 'grid',
    groupBy: 'none',
    showPreview: true,
  },
};

/**
 * Default collection search params
 * 
 * Default URL parameter values for clean URLs
 */
export const DEFAULT_COLLECTION_SEARCH_PARAMS: CollectionSearchParams = {
  search: undefined,
  page: undefined, // defaults to 1
  limit: undefined, // defaults to 12
  status: undefined,
  tags: undefined,
  sortBy: undefined, // defaults to 'createdAt'
  sortOrder: undefined, // defaults to 'desc'
  view: undefined, // defaults to 'grid'
  groupBy: undefined, // defaults to 'none'
  showPreview: undefined, // defaults to true
  dateFrom: undefined,
  dateTo: undefined,
  createdBy: undefined,
};