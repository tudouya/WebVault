/**
 * Browsable Pages Feature Module - Index File
 * 
 * 统一导出浏览页面功能模块的所有对外接口，包括组件、类型定义、stores和工具函数
 * 参考websites模块的导出模式，提供简洁的外部接口结构
 */

// 核心组件导出
export {
  // 布局和通用组件
  BrowsablePageLayout,
  PageHeader,
  FilterTabs,
  SortDropdown,
  AdBanner,
  Pagination,
  
  // 页面组件
  CollectionDetailPage,
  CategoryBrowsePage,
  SimpleCategoryBrowsePage,
  TagBrowsePage,
  SimpleTagBrowsePage,
  MultiTagBrowsePage,
  
  // 元数据生成器
  generateCollectionMetadata,
} from './components';

// 组件类型导出
export type {
  BrowsablePageLayoutProps,
  PageHeaderProps,
  FilterTabsProps,
  FilterTabItem,
  SortDropdownProps,
  AdBannerProps,
  AdData,
  AdDisplayType,
  CollectionDetailPageProps,
  CategoryBrowsePageProps,
  TagBrowsePageProps,
} from './components';

// 组件层的SortOption类型（来自SortDropdown组件）
export type { SortOption as ComponentSortOption } from './components';

// 默认配置常量导出
export {
  DEFAULT_SORT_OPTIONS,
} from './components';

// 类型定义导出
export type {
  BrowsablePageConfig,
  BrowsablePageData,
  BrowsablePageState,
  BrowsablePageURLParams,
  FilterParams,
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
  CollectionMetadata,
  CategoryMetadata,
  TagMetadata,
} from './types';

// 默认配置和工具函数导出
export {
  DEFAULT_PAGE_CONFIG,
  isValidPageConfig,
  mergeWithDefaults,
} from './types';

// Store和hooks导出
export {
  useBrowsablePageStore,
  useBrowsablePageUrlSync,
  useBrowsablePageFilters,
  useBrowsablePagePagination,
  useBrowsablePageUI,
  useBrowsablePageData as useBrowsablePageDataStore,
  useBrowsablePageConfig,
  browsablePageParamsParsers,
} from './stores';

// 数据获取hooks导出
export {
  // 通用数据hooks
  useBrowsablePageData,
  useSimpleBrowsablePageData,
  fetchDataByConfig,
  
  // 专用数据hooks
  useCollectionDetail,
  useSimpleCollectionDetail,
  useCategoryWebsites,
  useSimpleCategoryWebsites,
  useTagWebsites,
  useSimpleTagWebsites,
} from './hooks';

export type {
  DataFetchConfig,
  DataFetchResult,
  ApiCallParams,
  CollectionDetailConfig,
  CollectionDetailResult,
  CategoryWebsitesConfig,
  CategoryWebsitesState,
  CategoryWebsitesActions,
  TagWebsitesConfig,
  TagWebsitesState,
  TagWebsitesActions,
} from './hooks';

// 工具函数导出
export {
  parseCollectionParams,
  parseCategoryParams,
  parseTagParams,
  parseUrlParams,
  validateUrlParams,
  getDefaultParams,
  filterParamsToUrlParams,
  recoverFromParsingError,
} from './utils';

export type {
  ParsedParams,
  CollectionParams,
  CategoryParams,
  TagParams,
} from './utils';

export type {
  BrowsablePageStoreState,
} from './stores';

// 默认导出主要store hook
export { default } from './stores';