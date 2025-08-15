// Website type definitions - centralized exports

// Export all types from the main website types file
export * from './website'
export * from './category'
export * from './filters'
export * from './search'

// For backward compatibility, re-export common interfaces
export type {
  Website,
  WebsiteCreateInput,
  WebsiteUpdateInput,
  WebsiteFilters,
  WebsitePagination,
  WebsiteStatus,
  AdType,
  WebsiteCardData,
  WebsiteListResponse,
  // Search page specific types
  SearchPageFilters,
  SearchPageState,
  SearchURLParams,
  PaginationState
} from './website'

export type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryStatus,
  CategoryTreeNode,
  CategoryNavigation,
  CategoryBreadcrumb,
  CategoryStats
} from './category'

export type {
  FilterState,
  FilterOptions,
  FilterPreset,
  ActiveFilter,
  FilterValidation,
  SearchSuggestion,
  FilterAnalytics,
  SortField,
  SortOrder,
  FilterOperation,
  DEFAULT_FILTER_STATE,
  DEFAULT_SORT_OPTIONS
} from './filters'

export type {
  SearchPageStatus,
  SearchHeaderProps,
  SearchFiltersProps,
  SearchResultsProps,
  SearchResultItem,
  SearchAnalytics,
  SearchSuggestions
} from './search'

// Export constants as values, not types
export {
  DEFAULT_SEARCH_HEADER_PROPS,
  DEFAULT_SEARCH_GRID_CONFIG
} from './search'