/**
 * Blog stores unified export
 * 
 * 统一导出博客功能模块的状态管理相关内容
 */

// 导出主要的blog store和相关hooks
export * from './blog-store';

// 导出博客详情页面store和相关hooks (避免与组件命名冲突)
export {
  type BlogDetailStoreState,
  type BlogDetailStoreActions,
  type ReadingProgress as BlogReadingProgressState,
  type ShareState,
  type RelatedPostsConfig,
  useBlogDetailStore,
  useBlogDetailUrlSync,
  useBlogPostContent,
  useBlogReadingProgress,
  useBlogRelatedPosts,
  useBlogUserInteractions,
  useBlogTableOfContents,
  useBlogUIState,
  blogDetailSearchParamsParsers,
} from './blogDetailStore';