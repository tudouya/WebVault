/**
 * 博客字体和排版规范系统
 * Blog Typography Configuration System
 * 
 * 为博客页面提供统一的字体排版规范，遵循 Requirements 14.1-14.6
 * 与项目的 shadcn/ui 设计系统和 Tailwind CSS 保持一致
 * 
 * 特性：
 * - 完整的字体排版层次系统，提供清晰的信息结构
 * - 支持响应式字体大小和行高
 * - 类型安全的排版常量定义
 * - 符合 WebVault 设计语言的排版标准
 * - 确保中英文混排的良好显示效果
 * - 基于 Tailwind CSS 和 CVA 的组件变体支持
 * 
 * 需求引用：
 * - Requirements 14.1: 页面主标题字体规范 (48px/700/1.2)
 * - Requirements 14.2: 文章卡片标题字体规范 (20px/600/1.4)
 * - Requirements 14.3: 作者名称字体规范 (14px/500，颜色 #374151)
 * - Requirements 14.4: 发布时间字体规范 (14px/400，颜色 #6B7281)
 * - Requirements 14.5: 分类标签文字规范 (14px/500)
 * - Requirements 14.6: 中英文混排优化和字间距
 */

import { cva, type VariantProps } from 'class-variance-authority';

/**
 * 字体排版配置类型定义
 */
export interface TypographyConfig {
  /** 字体大小 (px) */
  fontSize: string;
  /** 字体粗细 */
  fontWeight: string;
  /** 行高比例 */
  lineHeight: string;
  /** 字体颜色 (可选) */
  color?: string;
  /** 字母间距 (可选) */
  letterSpacing?: string;
  /** 字体族 (可选) */
  fontFamily?: string;
}

/**
 * 博客排版规范配置映射表
 * 
 * 基于 Requirements 14.1-14.5 定义的精确排版规范
 */
export interface BlogTypographyScale {
  /** 页面主标题 - Requirements 14.1 */
  pageTitle: TypographyConfig;
  /** 文章卡片标题 - Requirements 14.2 */
  articleTitle: TypographyConfig;
  /** 作者名称 - Requirements 14.3 */
  authorName: TypographyConfig;
  /** 发布时间 - Requirements 14.4 */
  publishTime: TypographyConfig;
  /** 分类标签文字 - Requirements 14.5 */
  categoryTag: TypographyConfig;
  /** 正文内容 */
  bodyText: TypographyConfig;
  /** 副标题 */
  subtitle: TypographyConfig;
  /** 描述文本 */
  description: TypographyConfig;
  /** 小号标签 */
  smallTag: TypographyConfig;
}

/**
 * 博客排版规范定义
 * 
 * 遵循 Requirements 14.1-14.6 的精确规格，提供清晰的信息层次
 * 确保在各种设备和分辨率下的良好可读性
 */
export const blogTypographyScale: BlogTypographyScale = {
  // Requirements 14.1: 页面主标题 - 48px/700/1.2
  pageTitle: {
    fontSize: '48px',
    fontWeight: '700',
    lineHeight: '1.2',
    color: '#111827', // 基于 theme.ts 中的 text.title
    letterSpacing: '-0.02em', // 大标题紧凑字间距，提升视觉效果
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },

  // Requirements 14.2: 文章卡片标题 - 20px/600/1.4
  articleTitle: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.4',
    color: '#1F2937', // 基于 theme.ts 中的 text.heading
    letterSpacing: '-0.01em', // 轻微紧凑，保持可读性
  },

  // Requirements 14.3: 作者名称 - 14px/500，颜色 #374151
  authorName: {
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.5',
    color: '#374151', // Requirements 要求的精确颜色
    letterSpacing: '0em', // 正常字间距
  },

  // Requirements 14.4: 发布时间 - 14px/400，颜色 #6B7281
  publishTime: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.5',
    color: '#6B7281', // Requirements 要求的精确颜色
    letterSpacing: '0em', // 正常字间距
  },

  // Requirements 14.5: 分类标签文字 - 14px/500
  categoryTag: {
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.4',
    color: '#4B5563', // 基于 theme.ts 中的 text.label
    letterSpacing: '0em', // 正常字间距，确保标签可读性
  },

  // 扩展排版规范，用于其他博客元素
  bodyText: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.6',
    color: '#374151',
    letterSpacing: '0em',
  },

  subtitle: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
    color: '#1F2937',
    letterSpacing: '-0.01em',
  },

  description: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.5',
    color: '#6B7281',
    letterSpacing: '0em',
  },

  smallTag: {
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.4',
    color: '#6B7281',
    letterSpacing: '0.01em', // 小号文字稍微增加字间距提升可读性
  },
};

/**
 * 响应式字体大小映射表
 * 
 * 为不同屏幕尺寸提供适配的字体大小，确保在移动设备和桌面设备上的良好阅读体验
 * Requirements 14.6: 确保在不同设备上的良好显示效果
 */
export interface ResponsiveTypographyConfig {
  /** 移动设备 (< 640px) */
  mobile: TypographyConfig;
  /** 平板设备 (640px - 1024px) */
  tablet: TypographyConfig;
  /** 桌面设备 (> 1024px) */
  desktop: TypographyConfig;
}

/**
 * 响应式博客排版配置
 * 
 * 基于移动优先的响应式设计原则，确保在各种设备上的最佳阅读体验
 */
export const blogResponsiveTypography: Record<keyof BlogTypographyScale, ResponsiveTypographyConfig> = {
  // 页面主标题的响应式配置
  pageTitle: {
    mobile: {
      fontSize: '32px', // 移动设备缩小到 32px
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
    },
    tablet: {
      fontSize: '40px', // 平板设备中等尺寸
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
    },
    desktop: {
      fontSize: '48px', // 桌面设备完整尺寸 - Requirements 14.1
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
    },
  },

  // 文章标题的响应式配置
  articleTitle: {
    mobile: {
      fontSize: '18px', // 移动设备稍小
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '-0.01em',
    },
    tablet: {
      fontSize: '19px', // 平板设备中等
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '-0.01em',
    },
    desktop: {
      fontSize: '20px', // 桌面设备完整尺寸 - Requirements 14.2
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '-0.01em',
    },
  },

  // 其他元素在所有设备上保持一致的字体大小
  authorName: {
    mobile: blogTypographyScale.authorName,
    tablet: blogTypographyScale.authorName,
    desktop: blogTypographyScale.authorName,
  },

  publishTime: {
    mobile: blogTypographyScale.publishTime,
    tablet: blogTypographyScale.publishTime,
    desktop: blogTypographyScale.publishTime,
  },

  categoryTag: {
    mobile: blogTypographyScale.categoryTag,
    tablet: blogTypographyScale.categoryTag,
    desktop: blogTypographyScale.categoryTag,
  },

  bodyText: {
    mobile: blogTypographyScale.bodyText,
    tablet: blogTypographyScale.bodyText,
    desktop: blogTypographyScale.bodyText,
  },

  subtitle: {
    mobile: {
      fontSize: '20px',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
    },
    tablet: {
      fontSize: '22px',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
    },
    desktop: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
    },
  },

  description: {
    mobile: blogTypographyScale.description,
    tablet: blogTypographyScale.description,
    desktop: blogTypographyScale.description,
  },

  smallTag: {
    mobile: blogTypographyScale.smallTag,
    tablet: blogTypographyScale.smallTag,
    desktop: blogTypographyScale.smallTag,
  },
};

/**
 * Tailwind CSS 类名映射表
 * 
 * 将排版配置转换为对应的 Tailwind CSS 类名，便于在 JSX 组件中直接使用
 * 基于项目现有的 Tailwind 配置和 CVA 模式
 */
export const blogTypographyClasses = {
  // Requirements 14.1: 页面主标题类名
  pageTitle: 'text-5xl md:text-5xl lg:text-5xl font-bold leading-tight tracking-tight text-[#111827]',
  
  // Requirements 14.2: 文章卡片标题类名  
  articleTitle: 'text-lg md:text-lg lg:text-xl font-semibold leading-normal tracking-tight text-[#1F2937]',
  
  // Requirements 14.3: 作者名称类名
  authorName: 'text-sm font-medium leading-normal text-[#374151]',
  
  // Requirements 14.4: 发布时间类名
  publishTime: 'text-sm font-normal leading-normal text-[#6B7281]',
  
  // Requirements 14.5: 分类标签文字类名
  categoryTag: 'text-sm font-medium leading-snug text-[#4B5563]',

  // 扩展类名
  bodyText: 'text-base font-normal leading-relaxed text-[#374151]',
  subtitle: 'text-xl md:text-xl lg:text-2xl font-semibold leading-snug tracking-tight text-[#1F2937]',
  description: 'text-base font-normal leading-normal text-[#6B7281]',
  smallTag: 'text-xs font-medium leading-snug tracking-wide text-[#6B7281]',
} as const;

/**
 * 响应式 Tailwind CSS 类名映射表
 * 
 * 提供完整的响应式字体类名，确保在不同屏幕尺寸下的最佳显示效果
 */
export const blogResponsiveTypographyClasses = {
  // 页面主标题响应式类名 - Requirements 14.1
  pageTitle: 'text-4xl sm:text-5xl lg:text-5xl font-bold leading-tight tracking-tight text-[#111827]',
  
  // 文章标题响应式类名 - Requirements 14.2
  articleTitle: 'text-lg sm:text-lg lg:text-xl font-semibold leading-normal tracking-tight text-[#1F2937]',
  
  // 副标题响应式类名
  subtitle: 'text-xl sm:text-xl lg:text-2xl font-semibold leading-snug tracking-tight text-[#1F2937]',
} as const;

/**
 * Class Variance Authority (CVA) 排版变体定义
 * 
 * 基于项目现有的 CVA 模式，为博客排版提供类型安全的变体管理
 * 与 shadcn/ui 组件库的设计模式保持一致
 */
export const blogTypographyVariants = cva('', {
  variants: {
    variant: {
      // Requirements 14.1: 页面主标题
      pageTitle: blogTypographyClasses.pageTitle,
      // Requirements 14.2: 文章标题
      articleTitle: blogTypographyClasses.articleTitle,
      // Requirements 14.3: 作者名称
      authorName: blogTypographyClasses.authorName,
      // Requirements 14.4: 发布时间
      publishTime: blogTypographyClasses.publishTime,
      // Requirements 14.5: 分类标签
      categoryTag: blogTypographyClasses.categoryTag,
      // 扩展变体
      bodyText: blogTypographyClasses.bodyText,
      subtitle: blogTypographyClasses.subtitle,
      description: blogTypographyClasses.description,
      smallTag: blogTypographyClasses.smallTag,
    },
    responsive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    // 响应式页面标题
    {
      variant: 'pageTitle',
      responsive: true,
      className: blogResponsiveTypographyClasses.pageTitle,
    },
    // 响应式文章标题
    {
      variant: 'articleTitle',
      responsive: true,
      className: blogResponsiveTypographyClasses.articleTitle,
    },
    // 响应式副标题
    {
      variant: 'subtitle',
      responsive: true,
      className: blogResponsiveTypographyClasses.subtitle,
    },
  ],
  defaultVariants: {
    variant: 'bodyText',
    responsive: false,
  },
});

/**
 * 排版变体 Props 类型定义
 */
export type BlogTypographyVariants = VariantProps<typeof blogTypographyVariants>;

/**
 * CSS 自定义属性映射配置
 * 
 * 将排版配置映射到 CSS 变量，便于动态主题切换和组件中使用
 * 与项目现有的 CSS 变量系统保持一致
 */
export interface BlogTypographyCSSVariables {
  // 页面主标题 CSS 变量 - Requirements 14.1
  '--blog-typography-page-title-size': string;
  '--blog-typography-page-title-weight': string;
  '--blog-typography-page-title-height': string;
  '--blog-typography-page-title-spacing': string;

  // 文章标题 CSS 变量 - Requirements 14.2
  '--blog-typography-article-title-size': string;
  '--blog-typography-article-title-weight': string;
  '--blog-typography-article-title-height': string;

  // 作者名称 CSS 变量 - Requirements 14.3
  '--blog-typography-author-size': string;
  '--blog-typography-author-weight': string;
  '--blog-typography-author-color': string;

  // 发布时间 CSS 变量 - Requirements 14.4
  '--blog-typography-time-size': string;
  '--blog-typography-time-weight': string;
  '--blog-typography-time-color': string;

  // 分类标签 CSS 变量 - Requirements 14.5
  '--blog-typography-tag-size': string;
  '--blog-typography-tag-weight': string;
}

/**
 * 生成博客排版 CSS 变量对象
 * 
 * 将排版配置转换为 CSS 自定义属性，便于在组件中动态使用
 * 
 * @param scale - 博客排版规范对象 (可选，默认使用 blogTypographyScale)
 * @returns CSS 变量映射对象
 * 
 * @example
 * ```typescript
 * // 生成排版 CSS 变量
 * const typographyCSSVars = generateBlogTypographyCSSVariables();
 * 
 * // 应用到 DOM 元素
 * Object.entries(typographyCSSVars).forEach(([key, value]) => {
 *   document.documentElement.style.setProperty(key, value);
 * });
 * ```
 */
export function generateBlogTypographyCSSVariables(
  scale: BlogTypographyScale = blogTypographyScale
): BlogTypographyCSSVariables {
  return {
    // Requirements 14.1: 页面主标题
    '--blog-typography-page-title-size': scale.pageTitle.fontSize,
    '--blog-typography-page-title-weight': scale.pageTitle.fontWeight,
    '--blog-typography-page-title-height': scale.pageTitle.lineHeight,
    '--blog-typography-page-title-spacing': scale.pageTitle.letterSpacing || '0em',

    // Requirements 14.2: 文章标题
    '--blog-typography-article-title-size': scale.articleTitle.fontSize,
    '--blog-typography-article-title-weight': scale.articleTitle.fontWeight,
    '--blog-typography-article-title-height': scale.articleTitle.lineHeight,

    // Requirements 14.3: 作者名称
    '--blog-typography-author-size': scale.authorName.fontSize,
    '--blog-typography-author-weight': scale.authorName.fontWeight,
    '--blog-typography-author-color': scale.authorName.color || '#374151',

    // Requirements 14.4: 发布时间
    '--blog-typography-time-size': scale.publishTime.fontSize,
    '--blog-typography-time-weight': scale.publishTime.fontWeight,
    '--blog-typography-time-color': scale.publishTime.color || '#6B7281',

    // Requirements 14.5: 分类标签
    '--blog-typography-tag-size': scale.categoryTag.fontSize,
    '--blog-typography-tag-weight': scale.categoryTag.fontWeight,
  };
}

/**
 * 中英文混排优化工具函数
 * 
 * Requirements 14.6: 确保中英文混排的良好显示效果和合适的字间距
 * 提供文本处理函数，优化中英文混合内容的显示效果
 */
export const textOptimization = {
  /**
   * 为中英文混排文本添加适当的间距
   * 
   * @param text - 原始文本
   * @returns 优化后的文本，在中英文之间添加适当间距
   */
  optimizeMixedText: (text: string): string => {
    // 在中文字符和英文字符之间添加细微间距
    return text.replace(/([一-龯])\s*([A-Za-z0-9])/g, '$1 $2')
               .replace(/([A-Za-z0-9])\s*([一-龯])/g, '$1 $2');
  },

  /**
   * 检测文本是否包含中文字符
   * 
   * @param text - 要检测的文本
   * @returns 是否包含中文字符
   */
  hasChinese: (text: string): boolean => {
    return /[一-龯]/.test(text);
  },

  /**
   * 获取适合中英文混排的字体栈
   * 
   * @returns 优化的字体族定义
   */
  getMixedTextFontFamily: (): string => {
    return [
      // 系统默认字体
      'ui-sans-serif',
      'system-ui',
      // macOS 系统字体
      '-apple-system',
      'BlinkMacSystemFont',
      // Windows 系统字体
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      // 中文字体
      '"Noto Sans SC"',
      '"PingFang SC"',
      '"Hiragino Sans GB"',
      '"Microsoft YaHei"',
      // 通用后备字体
      'sans-serif',
    ].join(', ');
  },
} as const;

/**
 * 博客排版常量定义
 * 
 * 提供便于在组件中直接引用的常量，避免重复定义
 * 基于 Requirements 14.1-14.5 的精确规格
 */
export const BLOG_TYPOGRAPHY_CONSTANTS = {
  /** Requirements 14.1: 页面主标题规格 */
  PAGE_TITLE: {
    FONT_SIZE: '48px',
    FONT_WEIGHT: '700',
    LINE_HEIGHT: '1.2',
    COLOR: '#111827',
  },

  /** Requirements 14.2: 文章卡片标题规格 */
  ARTICLE_TITLE: {
    FONT_SIZE: '20px',
    FONT_WEIGHT: '600',
    LINE_HEIGHT: '1.4',
    COLOR: '#1F2937',
  },

  /** Requirements 14.3: 作者名称规格 */
  AUTHOR_NAME: {
    FONT_SIZE: '14px',
    FONT_WEIGHT: '500',
    LINE_HEIGHT: '1.5',
    COLOR: '#374151',
  },

  /** Requirements 14.4: 发布时间规格 */
  PUBLISH_TIME: {
    FONT_SIZE: '14px',
    FONT_WEIGHT: '400',
    LINE_HEIGHT: '1.5',
    COLOR: '#6B7281',
  },

  /** Requirements 14.5: 分类标签规格 */
  CATEGORY_TAG: {
    FONT_SIZE: '14px',
    FONT_WEIGHT: '500',
    LINE_HEIGHT: '1.4',
    COLOR: '#4B5563',
  },

  /** 字体族定义 */
  FONT_FAMILY: {
    MIXED_TEXT: textOptimization.getMixedTextFontFamily(),
    SYSTEM: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
} as const;

/**
 * 排版工具函数集合
 * 
 * 提供便于在组件中使用的排版相关工具函数
 */
export const typographyUtils = {
  /**
   * 获取指定排版变体的类名
   * 
   * @param variant - 排版变体名称
   * @param responsive - 是否启用响应式
   * @returns 对应的 CSS 类名
   */
  getTypographyClass: (
    variant: keyof typeof blogTypographyClasses,
    responsive: boolean = false
  ): string => {
    return blogTypographyVariants({ variant, responsive });
  },

  /**
   * 生成内联样式对象
   * 
   * @param config - 排版配置对象
   * @returns React 内联样式对象
   */
  generateInlineStyle: (config: TypographyConfig): React.CSSProperties => {
    return {
      fontSize: config.fontSize,
      fontWeight: config.fontWeight,
      lineHeight: config.lineHeight,
      color: config.color,
      letterSpacing: config.letterSpacing,
      fontFamily: config.fontFamily,
    };
  },

  /**
   * 组合多个排版类名
   * 
   * @param classes - 类名数组
   * @returns 合并后的类名字符串
   */
  combineClasses: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  },
} as const;

// 导出类型定义，便于在其他模块中使用
// 注意：这些类型已经通过 interface 和 type 声明在各自位置导出