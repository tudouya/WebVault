/**
 * Browsable Pages Components
 * 
 * Centralized exports for all browsable pages feature components
 * Supports collection detail, category browse, and tag browse pages
 */

export { PageHeader, type PageHeaderProps } from './PageHeader';
export { FilterTabs, type FilterTabsProps, type FilterTabItem } from './FilterTabs';
export { 
  SortDropdown, 
  type SortDropdownProps, 
  type SortOption, 
  DEFAULT_SORT_OPTIONS 
} from './SortDropdown';
export { 
  AdBanner, 
  type AdBannerProps, 
  type AdData, 
  type AdDisplayType 
} from './AdBanner';
export { 
  BrowsablePageLayout, 
  type BrowsablePageLayoutProps 
} from './BrowsablePageLayout';
export { 
  CollectionDetailPage, 
  type CollectionDetailPageProps,
  generateCollectionMetadata 
} from './CollectionDetailPage';
export { 
  CategoryBrowsePage, 
  type CategoryBrowsePageProps,
  SimpleCategoryBrowsePage 
} from './CategoryBrowsePage';
export { 
  TagBrowsePage, 
  type TagBrowsePageProps,
  SimpleTagBrowsePage,
  MultiTagBrowsePage 
} from './TagBrowsePage';
export { Pagination } from './Pagination';
export { 
  BrowsablePageErrorBoundary,
  type BrowsablePageErrorBoundaryProps,
  type BrowsablePageErrorFallbackProps,
  type BrowsablePageErrorInfo,
  BrowsablePageErrorType,
  BrowsablePageErrorFallback,
  withBrowsablePageErrorBoundary,
  useBrowsablePageErrorHandler,
  detectBrowsablePageErrorType
} from './BrowsablePageErrorBoundary';
export {
  BrowsablePageSkeleton,
  BrowsablePageHeaderSkeleton,
  BrowsableFilterLoadingIndicator,
  BrowsableDataRefreshIndicator,
  BrowsablePageLoadingOverlay,
  BrowsablePageEmptyStateWithLoading,
  BrowsablePageLoadingState,
  type BrowsablePageType,
  type BrowsablePageSkeletonProps,
  type BrowsableFilterLoadingIndicatorProps,
  type BrowsableDataRefreshIndicatorProps,
  type BrowsablePageLoadingOverlayProps,
  type BrowsablePageHeaderSkeletonProps
} from './BrowsablePageLoadingStates';