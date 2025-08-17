/**
 * Blog data module exports
 * 
 * 统一导出博客数据相关的模拟数据、工具函数和类型定义
 */

// 导出所有模拟博客数据和工具函数
export {
  // 核心数据
  mockBlogs,
  
  // 数据获取函数
  getBlogCardData,
  getMockBlogs,
  getMockBlogCards,
  getMockBlogsPaginated,
  
  // 筛选和搜索函数
  filterMockBlogsByCategory,
  searchMockBlogs,
  
  // 分类相关函数
  getAllMockBlogCategories,
  getBlogCategoryUsageStats,
  
  // 统计函数
  getMockBlogStats,
  
  // 时间格式化函数
  formatRelativeTime,
  addRelativeTimeToBlogs,
  
  // 验证函数
  isValidBlogData,
  validateBlogDataArray
} from './mockBlogs';