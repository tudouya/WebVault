/**
 * 博客主题配色系统
 * Blog Theme Configuration System
 * 
 * 为博客页面提供统一的现代化配色方案，遵循 Requirements 8.1-8.5
 * 与项目的 shadcn/ui 设计系统和 CSS 变量系统保持一致
 * 
 * 特性：
 * - 完整的精确配色系统，提供专业愉悦的浏览体验
 * - 支持亮暗模式主题切换
 * - 类型安全的配色常量定义
 * - 符合 WebVault 设计语言的配色层次
 * - 基于 CSS 变量的动态主题支持
 * 
 * 需求引用：
 * - Requirements 8.1: 页面主背景色和内容区背景色
 * - Requirements 8.2: 主要交互按钮强调色
 * - Requirements 8.3: 文章卡片背景和阴影
 * - Requirements 8.4: 分层文本颜色系统
 * - Requirements 8.5: 分类标签配色方案
 */

/**
 * 博客主题色彩变量类型定义
 */
export interface BlogThemeColors {
  /** 背景色系 */
  background: {
    /** 页面主背景色 - Requirements 8.1 */
    page: string;
    /** 内容区背景色 - Requirements 8.1 */
    content: string;
    /** 卡片背景色 - Requirements 8.3 */
    card: string;
  };
  
  /** 主要交互色系 */
  primary: {
    /** 主要强调色 - Requirements 8.2 */
    main: string;
    /** 主要按钮文字颜色 */
    foreground: string;
    /** 悬停状态 */
    hover: string;
  };
  
  /** 文本色系 - Requirements 8.4 */
  text: {
    /** 页面主标题 */
    title: string;
    /** 文章标题 */
    heading: string;
    /** 正文文本 */
    body: string;
    /** 辅助文本（作者、时间） */
    muted: string;
    /** 分类标签文字 */
    label: string;
  };
  
  /** 分类标签配色 - Requirements 8.5 */
  tag: {
    /** 默认标签背景 */
    background: string;
    /** 默认标签文字 */
    foreground: string;
    /** 激活标签背景 */
    activeBackground: string;
    /** 激活标签文字 */
    activeForeground: string;
    /** 悬停状态背景 */
    hoverBackground: string;
    /** 悬停状态文字 */
    hoverForeground: string;
  };
  
  /** 阴影和边框 */
  effects: {
    /** 卡片阴影 - Requirements 8.3 */
    cardShadow: string;
    /** 卡片悬停阴影 */
    cardShadowHover: string;
    /** 边框颜色 */
    border: string;
  };
}

/**
 * 博客亮色主题配色定义
 * 
 * 基于 Requirements 8.1-8.5 和现有的 globals.css 配色系统
 * 与 shadcn/ui 设计系统保持一致
 */
export const blogLightTheme: BlogThemeColors = {
  background: {
    // Requirements 8.1: 页面主背景色 #F9FAFB
    page: '#F9FAFB',
    // Requirements 8.1: 内容区背景色 #FFFFFF
    content: '#FFFFFF',
    // Requirements 8.3: 卡片背景色 #FFFFFF
    card: '#FFFFFF',
  },
  
  primary: {
    // Requirements 8.2: 主要强调色 #8B5CF6 (分类标签激活态、订阅按钮)
    main: '#8B5CF6',
    foreground: '#FFFFFF',
    // 悬停状态：主色调的 90% 透明度
    hover: 'rgba(139, 92, 246, 0.9)',
  },
  
  text: {
    // Requirements 8.4: 页面主标题 #111827
    title: '#111827',
    // Requirements 8.4: 文章标题 #1F2937
    heading: '#1F2937',
    // Requirements 8.4: 正文文本 #374151
    body: '#374151',
    // Requirements 8.4: 辅助文本（作者、时间） #6B7281
    muted: '#6B7281',
    // Requirements 8.4: 分类标签文字 #4B5563
    label: '#4B5563',
  },
  
  tag: {
    // Requirements 8.5: 默认标签背景 #F3F4F6
    background: '#F3F4F6',
    // Requirements 8.5: 默认标签文字 #4B5563
    foreground: '#4B5563',
    // Requirements 8.5: 激活标签背景 #8B5CF6
    activeBackground: '#8B5CF6',
    // Requirements 8.5: 激活标签文字 #FFFFFF
    activeForeground: '#FFFFFF',
    // Requirements 8.5: 悬停状态背景 #E5E7EB
    hoverBackground: '#E5E7EB',
    // Requirements 8.5: 悬停状态文字 #374151
    hoverForeground: '#374151',
  },
  
  effects: {
    // Requirements 8.3: 卡片阴影 box-shadow: 0 1px 3px rgba(0,0,0,0.1)
    cardShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    // 卡片悬停时的增强阴影，与 animations.css 中的博客卡片悬停效果一致
    cardShadowHover: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
    // 边框颜色，基于现有设计系统
    border: '#E5E7EB',
  },
};

/**
 * 博客暗色主题配色定义
 * 
 * 适配暗色模式，保持与亮色主题的视觉层次关系
 * 基于 globals.css 中的暗色主题变量
 */
export const blogDarkTheme: BlogThemeColors = {
  background: {
    // 暗色模式页面背景：与 globals.css 中的 --background 一致
    page: 'hsl(222.2, 84%, 4.9%)',
    // 暗色模式内容区背景：与卡片背景保持一致
    content: 'hsl(222.2, 84%, 4.9%)',
    // 暗色模式卡片背景：与 globals.css 中的 --card 一致
    card: 'hsl(222.2, 84%, 4.9%)',
  },
  
  primary: {
    // 暗色模式主要强调色：保持与亮色模式一致的紫色
    main: '#8B5CF6',
    foreground: '#FFFFFF',
    // 暗色模式悬停状态：稍微提高亮度
    hover: 'rgba(139, 92, 246, 0.8)',
  },
  
  text: {
    // 暗色模式文本色彩：基于 globals.css 暗色主题
    title: 'hsl(210, 40%, 98%)',
    heading: 'hsl(210, 40%, 95%)',
    body: 'hsl(210, 40%, 85%)',
    muted: 'hsl(215, 20.2%, 65.1%)',
    label: 'hsl(215, 20.2%, 75%)',
  },
  
  tag: {
    // 暗色模式标签配色：基于暗色主题的中性色
    background: 'hsl(217.2, 32.6%, 17.5%)',
    foreground: 'hsl(215, 20.2%, 75%)',
    activeBackground: '#8B5CF6',
    activeForeground: '#FFFFFF',
    hoverBackground: 'hsl(217.2, 32.6%, 22%)',
    hoverForeground: 'hsl(210, 40%, 90%)',
  },
  
  effects: {
    // 暗色模式阴影：使用更深的阴影
    cardShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    cardShadowHover: '0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.2)',
    border: 'hsl(217.2, 32.6%, 17.5%)',
  },
};

/**
 * 主题变体类型定义
 */
export type BlogThemeVariant = 'light' | 'dark';

/**
 * 博客主题配置映射表
 */
export const blogThemes: Record<BlogThemeVariant, BlogThemeColors> = {
  light: blogLightTheme,
  dark: blogDarkTheme,
};

/**
 * 获取指定主题的配色方案
 * 
 * @param variant - 主题变体 ('light' | 'dark')
 * @returns 对应主题的配色对象
 * 
 * @example
 * ```typescript
 * // 获取亮色主题配色
 * const lightColors = getBlogTheme('light');
 * console.log(lightColors.primary.main); // '#8B5CF6'
 * 
 * // 获取暗色主题配色
 * const darkColors = getBlogTheme('dark');
 * console.log(darkColors.background.page); // 'hsl(222.2, 84%, 4.9%)'
 * ```
 */
export function getBlogTheme(variant: BlogThemeVariant): BlogThemeColors {
  return blogThemes[variant];
}

/**
 * CSS 变量映射配置
 * 
 * 将博客主题色彩映射到 CSS 自定义属性，便于在组件中使用
 * 支持与 Tailwind CSS 和 shadcn/ui 的无缝集成
 */
export interface BlogThemeCSSVariables {
  /** 背景色相关 CSS 变量 */
  '--blog-bg-page': string;
  '--blog-bg-content': string;
  '--blog-bg-card': string;
  
  /** 主要交互色相关 CSS 变量 */
  '--blog-primary': string;
  '--blog-primary-foreground': string;
  '--blog-primary-hover': string;
  
  /** 文本色相关 CSS 变量 */
  '--blog-text-title': string;
  '--blog-text-heading': string;
  '--blog-text-body': string;
  '--blog-text-muted': string;
  '--blog-text-label': string;
  
  /** 标签色相关 CSS 变量 */
  '--blog-tag-bg': string;
  '--blog-tag-fg': string;
  '--blog-tag-active-bg': string;
  '--blog-tag-active-fg': string;
  '--blog-tag-hover-bg': string;
  '--blog-tag-hover-fg': string;
  
  /** 效果相关 CSS 变量 */
  '--blog-shadow-card': string;
  '--blog-shadow-card-hover': string;
  '--blog-border': string;
}

/**
 * 生成博客主题 CSS 变量对象
 * 
 * 将主题配色转换为 CSS 自定义属性，便于在组件中动态使用
 * 
 * @param theme - 博客主题配色对象
 * @returns CSS 变量映射对象
 * 
 * @example
 * ```typescript
 * // 生成亮色主题 CSS 变量
 * const lightCSSVars = generateBlogThemeCSSVariables(blogLightTheme);
 * 
 * // 应用到 DOM 元素
 * Object.entries(lightCSSVars).forEach(([key, value]) => {
 *   document.documentElement.style.setProperty(key, value);
 * });
 * ```
 */
export function generateBlogThemeCSSVariables(theme: BlogThemeColors): BlogThemeCSSVariables {
  return {
    '--blog-bg-page': theme.background.page,
    '--blog-bg-content': theme.background.content,
    '--blog-bg-card': theme.background.card,
    
    '--blog-primary': theme.primary.main,
    '--blog-primary-foreground': theme.primary.foreground,
    '--blog-primary-hover': theme.primary.hover,
    
    '--blog-text-title': theme.text.title,
    '--blog-text-heading': theme.text.heading,
    '--blog-text-body': theme.text.body,
    '--blog-text-muted': theme.text.muted,
    '--blog-text-label': theme.text.label,
    
    '--blog-tag-bg': theme.tag.background,
    '--blog-tag-fg': theme.tag.foreground,
    '--blog-tag-active-bg': theme.tag.activeBackground,
    '--blog-tag-active-fg': theme.tag.activeForeground,
    '--blog-tag-hover-bg': theme.tag.hoverBackground,
    '--blog-tag-hover-fg': theme.tag.hoverForeground,
    
    '--blog-shadow-card': theme.effects.cardShadow,
    '--blog-shadow-card-hover': theme.effects.cardShadowHover,
    '--blog-border': theme.effects.border,
  };
}

/**
 * Tailwind CSS 类名生成器
 * 
 * 基于博客主题色彩生成对应的 Tailwind CSS 类名
 * 便于在 JSX 组件中直接使用
 */
export const blogThemeClasses = {
  /** 背景类名 */
  background: {
    page: 'bg-[var(--blog-bg-page)]',
    content: 'bg-[var(--blog-bg-content)]',
    card: 'bg-[var(--blog-bg-card)]',
  },
  
  /** 文本类名 */
  text: {
    title: 'text-[var(--blog-text-title)]',
    heading: 'text-[var(--blog-text-heading)]',
    body: 'text-[var(--blog-text-body)]',
    muted: 'text-[var(--blog-text-muted)]',
    label: 'text-[var(--blog-text-label)]',
  },
  
  /** 主要交互元素类名 */
  primary: {
    background: 'bg-[var(--blog-primary)]',
    text: 'text-[var(--blog-primary-foreground)]',
    hover: 'hover:bg-[var(--blog-primary-hover)]',
  },
  
  /** 标签样式类名 */
  tag: {
    default: 'bg-[var(--blog-tag-bg)] text-[var(--blog-tag-fg)]',
    active: 'bg-[var(--blog-tag-active-bg)] text-[var(--blog-tag-active-fg)]',
    hover: 'hover:bg-[var(--blog-tag-hover-bg)] hover:text-[var(--blog-tag-hover-fg)]',
  },
  
  /** 效果类名 */
  effects: {
    cardShadow: 'shadow-[var(--blog-shadow-card)]',
    cardShadowHover: 'hover:shadow-[var(--blog-shadow-card-hover)]',
    border: 'border-[var(--blog-border)]',
  },
} as const;

/**
 * 博客主题 Hook 类型定义
 * 
 * 为 React Hook 使用提供类型支持
 */
export interface UseBlogThemeReturn {
  /** 当前主题变体 */
  variant: BlogThemeVariant;
  /** 当前主题配色 */
  colors: BlogThemeColors;
  /** CSS 变量映射 */
  cssVariables: BlogThemeCSSVariables;
  /** Tailwind 类名映射 */
  classes: typeof blogThemeClasses;
}

/**
 * 预定义的主题配色常量
 * 
 * 便于在组件中直接引用，避免重复定义
 */
export const BLOG_THEME_CONSTANTS = {
  /** 主要强调色 - Requirements 8.2 */
  PRIMARY_COLOR: '#8B5CF6',
  
  /** 页面背景色 - Requirements 8.1 */
  PAGE_BACKGROUND: '#F9FAFB',
  
  /** 内容区背景色 - Requirements 8.1 */
  CONTENT_BACKGROUND: '#FFFFFF',
  
  /** 卡片阴影 - Requirements 8.3 */
  CARD_SHADOW: '0 1px 3px rgba(0, 0, 0, 0.1)',
  
  /** 标签配色 - Requirements 8.5 */
  TAG_COLORS: {
    DEFAULT_BG: '#F3F4F6',
    DEFAULT_FG: '#4B5563',
    ACTIVE_BG: '#8B5CF6',
    ACTIVE_FG: '#FFFFFF',
    HOVER_BG: '#E5E7EB',
    HOVER_FG: '#374151',
  },
  
  /** 文本颜色 - Requirements 8.4 */
  TEXT_COLORS: {
    TITLE: '#111827',
    HEADING: '#1F2937',
    BODY: '#374151',
    MUTED: '#6B7281',
    LABEL: '#4B5563',
  },
} as const;

// 导出类型定义，便于在其他模块中使用
// 注意：这些类型已经通过 interface 和 type 声明在各自位置导出