/**
 * Website data type definitions
 * 
 * Defines the complete Website interface with all business fields
 * including advertisement, rating, and visit tracking capabilities.
 */

/**
 * Advertisement type enumeration
 */
export type AdType = 'banner' | 'sponsored' | 'featured' | 'premium';

/**
 * Website status enumeration
 */
export type WebsiteStatus = 'active' | 'inactive' | 'pending' | 'rejected';

/**
 * Core Website interface
 * 
 * Contains all fields required for website display, management,
 * and business operations including ads and analytics.
 */
export interface Website {
  /** Unique website identifier */
  id: string;
  
  /** Website display title */
  title: string;
  
  /** Website description text */
  description?: string;
  
  /** Website URL */
  url: string;
  
  /** Associated tags for categorization */
  tags: string[];
  
  /** Website favicon/icon URL */
  favicon_url?: string;
  
  /** Website screenshot URL */
  screenshot_url?: string;
  
  /** Category identifier */
  category_id?: string;
  
  /** Publication status */
  status: WebsiteStatus;
  
  /** Advertisement flag */
  isAd: boolean;
  
  /** Advertisement type (when isAd is true) */
  adType?: AdType;
  
  /** Website rating (0-5 scale) */
  rating?: number;
  
  /** Visit count tracking */
  visitCount: number;
  
  /** Featured website flag */
  is_featured: boolean;
  
  /** Public visibility flag */
  is_public: boolean;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Website creation input interface
 */
export interface WebsiteCreateInput {
  title: string;
  url: string;
  description?: string;
  category_id?: string;
  tags?: string[];
  isAd?: boolean;
  adType?: AdType;
  rating?: number;
  is_featured?: boolean;
  is_public?: boolean;
}

/**
 * Website update input interface
 */
export interface WebsiteUpdateInput extends Partial<WebsiteCreateInput> {
  id: string;
  status?: WebsiteStatus;
  visitCount?: number;
}

/**
 * Website display card props interface
 * 
 * Optimized for UI component consumption
 */
export interface WebsiteCardData {
  id: string;
  title: string;
  description?: string;
  url: string;
  favicon_url?: string;
  image_url?: string;
  tags: string[];
  category?: string;
  isAd?: boolean;
  adType?: AdType;
  rating?: number;
  visit_count?: number;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Website filters interface for search and filtering
 */
export interface WebsiteFilters {
  category?: string;
  tags?: string[];
  status?: WebsiteStatus;
  search?: string;
  featured?: boolean;
  isAd?: boolean;
  adType?: AdType;
  minRating?: number;
}

/**
 * Website pagination interface
 */
export interface WebsitePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Website list response interface
 */
export interface WebsiteListResponse {
  websites: Website[];
  pagination: WebsitePagination;
  filters: WebsiteFilters;
}

// ==================== Search Page Type Extensions ====================

/**
 * Extended Website Filter Model for Search Page
 * 
 * Extends the base WebsiteFilters interface with search-specific functionality
 * including search scope and sorting options for the dedicated search page.
 */
export interface SearchPageFilters extends WebsiteFilters {
  // Basic query
  query?: string;
  
  // Search scope specification
  searchScope?: 'title' | 'description' | 'url' | 'content' | 'tags' | 'all';
  
  // Enhanced sorting options for search relevance
  sortBy?: 'relevance' | 'created_at' | 'visit_count' | 'rating' | 'updated_at' | 'title' | 'featured';
  sortOrder?: 'asc' | 'desc';
  
  // Basic filters
  featured?: boolean;
  includeAds?: boolean;
  minRating?: number;
  
  // Advanced search options
  searchType?: 'websites' | 'categories' | 'tags' | 'all';
  searchMode?: 'simple' | 'advanced' | 'fuzzy';
  exactMatch?: boolean;
  excludeTerms?: string[];
  requiredTerms?: string[];
  
  // Date range filter
  dateRange?: {
    from: string | null;
    to: string | null;
  };
  
  // Additional filters
  language?: string | null;
}

/**
 * Pagination State Interface
 * 
 * Defines pagination structure used throughout the application.
 * Reuses the pattern from existing stores for consistency.
 */
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Search Page State Model
 * 
 * Complete state interface for the search page including query state,
 * filters, results, pagination, and UI state management.
 */
export interface SearchPageState {
  // Search state
  query: string;
  filters: SearchPageFilters;
  
  // Result state
  results: WebsiteCardData[];
  totalResults: number;
  isLoading: boolean;
  error?: string;
  
  // Pagination state (reuse existing PaginationState pattern)
  pagination: PaginationState;
  
  // UI state
  ui: {
    resultsViewMode: 'grid' | 'list';
    filtersCollapsed: boolean;
  };
}

/**
 * URL Parameters Model for Search Page
 * 
 * Defines the structure of URL parameters used for search page
 * state synchronization and bookmarking support.
 */
export interface SearchURLParams {
  /** Search keywords */
  q?: string;
  
  /** Category filter */
  category?: string;
  
  /** Tag filter (comma-separated for URL) */
  tags?: string;
  
  /** Featured filter */
  featured?: string;
  
  /** Search scope */
  scope?: string;
  
  /** Sort method */
  sort?: string;
  
  /** Sort order */
  order?: string;
  
  /** Current page */
  page?: string;
  
  /** Items per page */
  limit?: string;
  
  /** Minimum rating filter */
  rating?: string;
  
  /** Advertisement inclusion */
  ads?: string;
}