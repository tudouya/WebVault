/**
 * Browsable Pages Stores - Index File
 * 
 * 统一导出浏览页面相关的状态管理stores和hooks
 */

// Store和主要hooks
export {
  useBrowsablePageStore,
  useBrowsablePageUrlSync,
  useBrowsablePageFilters,
  useBrowsablePagePagination,
  useBrowsablePageUI,
  useBrowsablePageData,
  useBrowsablePageConfig,
} from './browsable-page-store';

// 类型定义
export type {
  BrowsablePageStoreState,
} from './browsable-page-store';

// URL参数解析器
export {
  browsablePageParamsParsers,
} from './browsable-page-store';

// 默认导出主要store hook
export { default } from './browsable-page-store';