// Website Hooks

// 搜索相关Hooks
export { 
  useWebsiteSearch, 
  useSimpleSearch,
  type SearchConfig,
  type SearchState,
  type SearchActions,
  type SearchValidation,
} from './useWebsiteSearch';

// 搜索页面专用Hooks
export {
  useSearchFilters,
  useSearchResults,
  useSearchPage,
  type SearchFiltersConfig,
  type SearchFiltersState,
  type SearchFiltersActions,
  type SearchResultsConfig,
  type SearchResultsState,
  type SearchResultsActions,
} from './useSearchPage';

// 集合导航Hooks
export {
  useCollectionNavigation,
  CollectionNavigationUtils,
  type CollectionNavigationConfig,
  type CollectionNavigationReturn,
} from './useCollectionNavigation';

// 管理后台表单选项
export {
  useWebsiteFormOptions,
  type WebsiteFormCategoryOption,
  type WebsiteFormTagOption,
  type WebsiteFormCollectionOption,
} from './useWebsiteFormOptions';

// 首页分类数据
export {
  useHomepageCategoryTree,
} from './useHomepageCategoryTree';

// 首页网站列表
export {
  useHomepageWebsites,
} from './useHomepageWebsites';
