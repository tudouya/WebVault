// Website Management Module
// 网站管理模块统一导出

// Types exports
export type * from './types'
export type { CollectionIcon as CollectionIconData } from './types'

// Components exports - excluding CollectionIcon to avoid naming conflict
export { 
  HomePage, HomePageDefault,
  SearchPage, SearchPageDefault,
  HeaderNavigation, HeaderNavigationDefault,
  HeroSection, HeroSectionDefault,
  SearchHeader, SearchHeaderDefault,
  SidebarFilters, SidebarFiltersDefault,
  CategoryTree, CategoryTreeDefault,
  WebsiteCard, WebsiteCardDefault,
  WebsiteGrid, WebsiteGridDefault,
  SearchResults, SearchResultsDefault,
  TagPill, TagPillDefault,
  CollectionCard, CollectionCardDefault,
  FilterSelects, FilterSelectsDefault,
  SearchFilters, SearchFiltersDefault,
  Pagination, PaginationDefault,
  NewsletterSection, NewsletterSectionDefault,
  Footer, FooterDefault,
  ResponsiveLayout, ResponsiveLayoutDefault,
  ErrorBoundary, ErrorBoundaryDefault, withErrorBoundary, useErrorHandler,
  LoadingSpinner,
  WebsiteCardSkeleton,
  SearchLoadingIndicator,
  FilterLoadingIndicator,
  WebsiteGridLoadingOverlay,
  EmptyStateWithLoading,
  LoadingStatesDefault
} from './components'

// Explicit CollectionIcon component export with renamed alias
export { CollectionIcon as CollectionIconComponent } from './components'

// TODO: 后续添加时取消注释
// export * from './hooks'
// export * from './services'
// export * from './stores'