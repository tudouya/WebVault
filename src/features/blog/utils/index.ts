/**
 * Blog Utils Index
 * 
 * 博客功能模块的工具函数统一导出
 * 包含SEO元数据生成、内容处理等核心工具
 */

// SEO工具导出
export {
  generateBlogMetadata,
  generateOpenGraphData,
  generateTwitterCardData,
  generateStructuredData,
  truncateDescription,
  generateKeywords,
  cleanHtmlForMeta,
  calculateWordCount,
  generateArticleUrl,
  generateAuthorUrl,
  validateSeoData,
  SeoUtils,
} from './seoUtils';

// Slug 工具
export { generateBlogSlug } from './slug';

// 类型导出
export type {
  OpenGraphData,
  TwitterCardData,
  BlogPostingStructuredData,
  BlogMetadata,
} from './seoUtils';

// 默认导出主要的元数据生成函数
export { default as generateMetadata } from './seoUtils';
