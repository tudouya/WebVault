/**
 * Search page specific type definitions
 * 
 * Defines interfaces and types specifically for the dedicated search page components
 * including SearchHeader, SearchFilters, and SearchResults components.
 */

import type { WebsiteCardData, WebsiteFilters, SearchPageFilters } from './website';

/**
 * Search page state enumeration
 * 
 * Represents different states of the search page for UI feedback
 */
export type SearchPageStatus = 
  | 'idle'          // Initial state, no search performed
  | 'loading'       // Search request in progress
  | 'success'       // Search completed successfully
  | 'error'         // Search failed with error
  | 'empty';        // Search completed but no results found

/**
 * SearchHeader component props interface
 * 
 * Props for the search page title area displaying main heading and description
 */
export interface SearchHeaderProps {
  /** Additional CSS class name for styling customization */
  className?: string;
  
  /** Main title text (defaults to "搜索你想要的一切") */
  title?: string;
  
  /** Description text below the title */
  description?: string;
}

/**
 * SearchFilters component props interface
 * 
 * Props for the search and filter control area integrating search box and various filters
 */
export interface SearchFiltersProps {
  /** Additional CSS class name for styling customization */
  className?: string;
  
  /** Current search query value */
  searchQuery?: string;
  
  /** Current filter state */
  filters?: SearchPageFilters;
  
  /** Callback when search query changes */
  onSearch?: (query: string) => void;
  
  /** Callback when filters change */
  onFiltersChange?: (filters: SearchPageFilters) => void;
  
  /** Callback when reset button is clicked */
  onReset?: () => void;
  
  /** Loading state for search suggestions */
  isLoading?: boolean;
  
  /** Available filter options for dropdowns */
  filterOptions?: {
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      website_count: number;
    }>;
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      website_count: number;
      color?: string;
    }>;
    sortOptions: Array<{
      field: string;
      label: string;
      order: 'asc' | 'desc';
    }>;
  };
}

/**
 * SearchResults component props interface
 * 
 * Props for the search results display container managing grid layout and various states
 */
export interface SearchResultsProps {
  /** Array of website data to display as search results */
  websites: WebsiteCardData[];
  
  /** Loading state indicator */
  isLoading?: boolean;
  
  /** Error state indicator */
  isError?: boolean;
  
  /** Error message to display */
  error?: string;
  
  /** Current search page status */
  status?: SearchPageStatus;
  
  /** Total number of search results found */
  totalResults?: number;
  
  /** Current search query for display */
  searchQuery?: string;
  
  /** Callback when a website card is clicked/visited */
  onWebsiteVisit?: (website: WebsiteCardData) => void;
  
  /** Callback when a tag in a website card is clicked */
  onTagClick?: (tag: string) => void;
  
  /** Additional CSS class name for styling customization */
  className?: string;
  
  /** Grid layout configuration */
  gridConfig?: {
    /** Columns for desktop (default: 3) */
    desktop: number;
    /** Columns for tablet (default: 2) */
    tablet: number;
    /** Columns for mobile (default: 1) */
    mobile: number;
  };
}

/**
 * Search result item state interface
 * 
 * Extended website card data with search-specific metadata
 */
export interface SearchResultItem extends WebsiteCardData {
  /** Search relevance score (0-1) */
  relevanceScore?: number;
  
  /** Highlighted text matches for search query */
  highlights?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
  
  /** Position in search results */
  position?: number;
}

/**
 * Search analytics tracking interface
 * 
 * Data structure for tracking search behavior and performance
 */
export interface SearchAnalytics {
  /** Search query executed */
  query: string;
  
  /** Filters applied during search */
  filters: SearchPageFilters;
  
  /** Number of results returned */
  resultCount: number;
  
  /** Search execution time in milliseconds */
  searchTime: number;
  
  /** Timestamp of search */
  timestamp: string;
  
  /** User clicked on a result */
  resultClicked?: {
    websiteId: string;
    position: number;
  };
}

/**
 * Search suggestions interface
 * 
 * For implementing real-time search suggestions (future enhancement)
 */
export interface SearchSuggestions {
  /** Query suggestions based on user input */
  queries: Array<{
    text: string;
    type: 'popular' | 'recent' | 'suggestion';
    count?: number;
  }>;
  
  /** Website suggestions matching partial query */
  websites: Array<{
    id: string;
    title: string;
    url: string;
    favicon_url?: string;
  }>;
  
  /** Category suggestions */
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    website_count: number;
  }>;
  
  /** Tag suggestions */
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    website_count: number;
  }>;
}

/**
 * Default search header props
 */
export const DEFAULT_SEARCH_HEADER_PROPS: Required<Pick<SearchHeaderProps, 'title' | 'description'>> = {
  title: '搜索你想要的一切',
  description: '从我们精选的优质网站中发现精彩内容'
};

/**
 * Default grid configuration for search results
 */
export const DEFAULT_SEARCH_GRID_CONFIG: Required<SearchResultsProps['gridConfig']> = {
  desktop: 3,
  tablet: 2,
  mobile: 1
};