/**
 * Filter data type definitions
 * 
 * Defines interfaces for search, filtering, and sorting functionality
 * supporting the main content area filtering requirements.
 */

/**
 * Sort order enumeration
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Available sort fields for websites
 */
export type SortField = 
  | 'created_at'        // Time listed (default)
  | 'updated_at'        // Last updated
  | 'title'             // Alphabetical
  | 'rating'            // Rating
  | 'visit_count'       // Popularity
  | 'featured'          // Featured first
  | 'relevance';        // Search relevance (for search pages)

/**
 * Filter operation types
 */
export type FilterOperation = 
  | 'equals'            // Exact match
  | 'contains'          // Partial match
  | 'starts_with'       // Prefix match
  | 'in'                // Array contains
  | 'greater_than'      // Numeric comparison
  | 'less_than'         // Numeric comparison
  | 'between';          // Range comparison

/**
 * Core FilterState interface
 * 
 * Manages all filtering state for search, categories, tags, and sorting
 * Used by main content area filtering components.
 */
export interface FilterState {
  /** Search query string */
  search: string;
  
  /** Selected category ID */
  categoryId: string | null;
  
  /** Selected tag IDs array */
  selectedTags: string[];
  
  /** Sort field selection */
  sortBy: SortField;
  
  /** Sort order */
  sortOrder: SortOrder;
  
  /** Website status filter */
  status?: string[];

  /** Show ads filter */
  includeAds: boolean;
  
  /** Date range filter */
  dateRange?: {
    from: string;
    to: string;
  };
}

/**
 * Filter options interface
 * 
 * Available filter options for dropdown components
 */
export interface FilterOptions {
  /** Available categories for selection */
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    website_count: number;
  }>;
  
  /** Available tags for selection */
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    website_count: number;
    color?: string;
  }>;
  
  /** Available sort options */
  sortOptions: Array<{
    field: SortField;
    label: string;
    order: SortOrder;
  }>;
  
  /** Available rating options */
  ratingOptions: number[];
}

/**
 * Filter preset interface
 * 
 * Predefined filter combinations for quick access
 */
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Partial<FilterState>;
  is_default: boolean;
}

/**
 * Active filter interface
 * 
 * Represents an applied filter for display in filter chips
 */
export interface ActiveFilter {
  id: string;
  type: 'search' | 'category' | 'tag' | 'rating' | 'status' | 'date';
  label: string;
  value: string | number | boolean;
  removable: boolean;
}

/**
 * Filter validation interface
 */
export interface FilterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Search suggestion interface
 * 
 * For real-time search suggestions (future enhancement)
 */
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'website' | 'category' | 'tag' | 'query';
  count?: number;
  icon?: string;
}

/**
 * Filter analytics interface
 * 
 * Track filter usage for optimization
 */
export interface FilterAnalytics {
  most_used_filters: Array<{
    type: string;
    value: string;
    usage_count: number;
  }>;
  search_queries: Array<{
    query: string;
    result_count: number;
    timestamp: string;
  }>;
  filter_combinations: Array<{
    filters: Partial<FilterState>;
    usage_count: number;
  }>;
}

/**
 * Default filter state
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  categoryId: null,
  selectedTags: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
  includeAds: true,
};

/**
 * Default sort options
 */
export const DEFAULT_SORT_OPTIONS: FilterOptions['sortOptions'] = [
  { field: 'created_at', label: 'Time listed', order: 'desc' },
  { field: 'updated_at', label: 'Recently updated', order: 'desc' },
  { field: 'title', label: 'Name (A-Z)', order: 'asc' },
  { field: 'title', label: 'Name (Z-A)', order: 'desc' },
  { field: 'rating', label: 'Highest rated', order: 'desc' },
  { field: 'visit_count', label: 'Most popular', order: 'desc' },
  { field: 'featured', label: 'Featured first', order: 'desc' },
];