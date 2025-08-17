/**
 * Blog Categories Constants and Utilities
 * 
 * 定义博客分类系统的常量和相关工具函数
 * 支持文章分类筛选、验证和URL参数处理功能
 */

/**
 * 预定义的博客分类常量
 * 
 * 基于设计规格定义的6个分类选项，用于博客文章的分类筛选功能
 * 严格按照UI设计要求：'All', 'Lifestyle', 'Technologies', 'Design', 'Travel', 'Growth'
 */
export const BLOG_CATEGORIES = [
  'All',
  'Lifestyle', 
  'Technologies',
  'Design',
  'Travel',
  'Growth'
] as const;

/**
 * 博客分类类型定义
 * 基于BLOG_CATEGORIES常量的联合类型
 */
export type BlogCategoryType = typeof BLOG_CATEGORIES[number];

/**
 * 分类显示配置映射
 * 提供每个分类的显示名称和描述信息
 */
export const BLOG_CATEGORY_CONFIG: Record<BlogCategoryType, {
  label: string;
  description: string;
  color?: string;
}> = {
  'All': {
    label: 'All',
    description: '所有文章',
    color: 'gray',
  },
  'Lifestyle': {
    label: 'Lifestyle',
    description: '生活方式相关文章',
    color: 'purple',
  },
  'Technologies': {
    label: 'Technologies', 
    description: '技术相关文章',
    color: 'blue',
  },
  'Design': {
    label: 'Design',
    description: '设计相关文章',
    color: 'pink',
  },
  'Travel': {
    label: 'Travel',
    description: '旅行相关文章',
    color: 'green',
  },
  'Growth': {
    label: 'Growth',
    description: '成长相关文章',
    color: 'orange',
  },
} as const;

/**
 * 博客分类工具函数集合
 */
export const BlogCategoryUtils = {
  /**
   * 验证分类是否有效
   * @param category - 待验证的分类字符串
   * @returns 是否为有效的博客分类
   */
  isValidCategory: (category: string): category is BlogCategoryType => {
    return BLOG_CATEGORIES.includes(category as BlogCategoryType);
  },

  /**
   * 获取有效的分类值，无效时返回默认分类
   * @param category - 分类字符串
   * @param defaultCategory - 默认分类，默认为'All'
   * @returns 有效的分类值
   */
  getValidCategory: (
    category: string | null | undefined, 
    defaultCategory: BlogCategoryType = 'All'
  ): BlogCategoryType => {
    if (!category || !BlogCategoryUtils.isValidCategory(category)) {
      return defaultCategory;
    }
    return category;
  },

  /**
   * 获取分类的显示标签
   * @param category - 分类
   * @returns 分类的显示标签
   */
  getCategoryLabel: (category: BlogCategoryType): string => {
    return BLOG_CATEGORY_CONFIG[category].label;
  },

  /**
   * 获取分类的描述信息
   * @param category - 分类
   * @returns 分类的描述信息
   */
  getCategoryDescription: (category: BlogCategoryType): string => {
    return BLOG_CATEGORY_CONFIG[category].description;
  },

  /**
   * 获取分类的颜色主题
   * @param category - 分类
   * @returns 分类的颜色主题
   */
  getCategoryColor: (category: BlogCategoryType): string | undefined => {
    return BLOG_CATEGORY_CONFIG[category].color;
  },

  /**
   * 将分类转换为URL参数值
   * @param category - 分类
   * @returns URL参数值，'All'分类返回undefined（移除参数）
   */
  categoryToUrlParam: (category: BlogCategoryType): string | undefined => {
    return category === 'All' ? undefined : category;
  },

  /**
   * 从URL参数解析分类
   * @param param - URL参数值
   * @returns 解析出的有效分类
   */
  categoryFromUrlParam: (param: string | null | undefined): BlogCategoryType => {
    return BlogCategoryUtils.getValidCategory(param);
  },

  /**
   * 筛选指定分类的数据
   * @param items - 包含category字段的数据数组
   * @param category - 筛选的分类
   * @returns 筛选后的数据数组
   */
  filterByCategory: <T extends { category: string }>(
    items: T[], 
    category: BlogCategoryType
  ): T[] => {
    if (category === 'All') {
      return items;
    }
    return items.filter(item => item.category === category);
  },

  /**
   * 获取所有可用分类列表（不包含All）
   * @returns 不包含'All'的分类数组
   */
  getSelectableCategories: (): Exclude<BlogCategoryType, 'All'>[] => {
    return BLOG_CATEGORIES.filter(cat => cat !== 'All') as Exclude<BlogCategoryType, 'All'>[];
  },

  /**
   * 获取分类的统计信息格式化
   * @param category - 分类
   * @param count - 该分类的文章数量
   * @returns 格式化的统计信息字符串
   */
  formatCategoryStats: (category: BlogCategoryType, count: number): string => {
    const label = BlogCategoryUtils.getCategoryLabel(category);
    return `${label} (${count})`;
  },

  /**
   * 检查两个分类是否相同
   * @param category1 - 分类1
   * @param category2 - 分类2
   * @returns 是否相同
   */
  isSameCategory: (
    category1: BlogCategoryType, 
    category2: BlogCategoryType
  ): boolean => {
    return category1 === category2;
  },

  /**
   * 获取相关分类列表
   * 用于相关文章推荐时的分类关联度计算
   * @param category - 当前分类
   * @returns 相关分类数组
   */
  getRelatedCategories: (category: BlogCategoryType): BlogCategoryType[] => {
    // 定义分类之间的关联关系
    const categoryRelations: Record<BlogCategoryType, BlogCategoryType[]> = {
      'All': [],
      'Lifestyle': ['Growth', 'Design'], // 生活方式与成长、设计相关
      'Technologies': ['Design', 'Growth'], // 技术与设计、成长相关
      'Design': ['Technologies', 'Lifestyle'], // 设计与技术、生活方式相关
      'Travel': ['Lifestyle', 'Growth'], // 旅行与生活方式、成长相关
      'Growth': ['Lifestyle', 'Technologies'], // 成长与生活方式、技术相关
    };

    return categoryRelations[category] || [];
  },

  /**
   * 计算分类相似度分数
   * @param category1 - 分类1
   * @param category2 - 分类2
   * @returns 相似度分数 (0-1)
   */
  calculateCategorySimilarity: (
    category1: BlogCategoryType,
    category2: BlogCategoryType
  ): number => {
    if (category1 === category2) {
      return 1.0; // 完全相同
    }

    const relatedCategories = BlogCategoryUtils.getRelatedCategories(category1);
    if (relatedCategories.includes(category2)) {
      return 0.6; // 相关分类
    }

    return 0.1; // 无关分类
  },
} as const;

/**
 * 分类相关的常量导出
 */
export const BLOG_CATEGORY_CONSTANTS = {
  /** 默认分类 */
  DEFAULT_CATEGORY: 'All' as BlogCategoryType,
  
  /** 分类总数 */
  TOTAL_CATEGORIES: BLOG_CATEGORIES.length,
  
  /** 可选择的分类数（不包含All） */
  SELECTABLE_CATEGORIES_COUNT: BLOG_CATEGORIES.length - 1,
} as const;

// 类型和常量已在上面定义和导出，此处不需要重复导出