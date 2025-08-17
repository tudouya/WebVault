/**
 * Blog feature module exports
 * 
 * 统一导出博客功能模块的所有公共API，包括组件、hooks、stores、types、数据、工具函数和样式系统
 * 提供完整的博客功能模块导出，确保所有新实现的功能都可以通过模块根目录导入
 */

// 导出组件 - 包含所有博客UI组件和错误处理组件
export * from './components';

// 导出类型定义 - 包含博客详情页面类型和基础类型
export * from './types';

// 导出常量 - 包含分类配置和其他常量定义
export * from './constants';

// 导出数据模拟和服务 - 包含模拟数据和数据服务函数
export * from './data';

// 导出状态管理 - 包含博客基础store和博客详情store
export * from './stores';

// 导出工具函数 - 包含SEO工具函数和其他实用工具
export * from './utils';

// 导出样式系统 - 主题配色系统
export {
  // 主题配色系统
  blogLightTheme,
  blogDarkTheme,
  blogThemes,
  getBlogTheme,
  generateBlogThemeCSSVariables,
  blogThemeClasses,
  BLOG_THEME_CONSTANTS,
} from './styles/theme';

// 导出样式系统 - 排版规范系统
export {
  blogTypographyScale,
  blogResponsiveTypography,
  blogTypographyClasses,
  blogResponsiveTypographyClasses,
  blogTypographyVariants,
  generateBlogTypographyCSSVariables,
  textOptimization,
  typographyUtils,
  BLOG_TYPOGRAPHY_CONSTANTS,
} from './styles/typography';

// 导出类型定义 - 主题配色相关类型
export type {
  BlogThemeColors,
  BlogThemeVariant,
  BlogThemeCSSVariables,
  UseBlogThemeReturn,
} from './styles/theme';

// 导出类型定义 - 排版规范相关类型
export type {
  BlogTypographyScale,
  TypographyConfig,
  ResponsiveTypographyConfig,
  BlogTypographyVariants,
  BlogTypographyCSSVariables,
} from './styles/typography';

// 导出hooks（当创建时）
// export * from './hooks';

// 导出服务（当创建时）
// export * from './services';