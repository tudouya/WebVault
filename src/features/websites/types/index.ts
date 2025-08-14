// Website type definitions - centralized exports

// Export all types from the main website types file
export * from './website'
export * from './category'
export * from './filters'

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
  WebsiteListResponse
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