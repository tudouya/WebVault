/**
 * Browsable Pages Hooks
 * 
 * 统一导出浏览页面相关的所有自定义Hook
 */

export {
  useBrowsablePageData,
  useSimpleBrowsablePageData,
  fetchDataByConfig,
  type DataFetchConfig,
  type DataFetchResult,
  type ApiCallParams,
} from './useBrowsablePageData';

export {
  useCollectionDetail,
  useSimpleCollectionDetail,
  type CollectionDetailConfig,
  type CollectionDetailResult,
} from './useCollectionDetail';

export {
  useCategoryWebsites,
  useSimpleCategoryWebsites,
  type CategoryWebsitesConfig,
  type CategoryWebsitesState,
  type CategoryWebsitesActions,
} from './useCategoryWebsites';

export {
  useTagWebsites,
  useSimpleTagWebsites,
  type TagWebsitesConfig,
  type TagWebsitesState,
  type TagWebsitesActions,
} from './useTagWebsites';

// 默认导出主要的数据管理Hook
export { default } from './useBrowsablePageData';