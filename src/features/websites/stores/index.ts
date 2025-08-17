// Website Stores - 状态管理统一导出

// 首页状态管理
export {
  useHomepageUrlSync,
  useHomepageFilters,
  useHomepagePagination,
  useHomepageCategories,
  searchParamsParsers,
  type HomepageState,
} from './homepage-store';

// 集合页面状态管理
export {
  useCollectionUrlSync,
  useCollectionPagination,
  useCollectionFilters,
  useCollectionView,
  useCollectionData,
  collectionSearchParamsParsers,
  type CollectionPageState,
} from './collection-store';

// 网站详情页面状态管理
export {
  useWebsiteDetailUrlSync,
  useWebsiteContent,
  useRelatedWebsites,
  useWebsiteVisitStats,
  useWebsiteUserInteractions,
  useWebsiteNavigation,
  useWebsiteUIState,
  websiteDetailSearchParamsParsers,
  type WebsiteDetailStoreState,
  type WebsiteDetailStoreActions,
} from './websiteDetailStore';

// 默认导出store hooks
export { default as useHomepageStore } from './homepage-store';
export { default as useCollectionStore } from './collection-store';
export { default as useWebsiteDetailStore } from './websiteDetailStore';