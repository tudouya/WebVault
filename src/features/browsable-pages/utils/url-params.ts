/**
 * URL Parameter Parsing and Validation Utilities
 * 
 * 为浏览页面提供URL参数解析和验证功能，支持集合页面、分类页面和标签页面的URL状态管理。
 * 使用Zod库进行参数验证和类型安全保障，在参数错误时回退到默认状态。
 * 
 * 需求引用: 7.2, 7.7, 8.1
 * - 7.2: 系统正确初始化对应的筛选状态
 * - 7.7: URL参数格式错误时系统回退到默认状态
 * - 8.1: 页面初始加载时显示适当的加载状态指示器
 */

import { z } from 'zod';
import type { SortField, SortOrder } from '../../websites/types/filters';
import type { BrowsablePageURLParams, FilterParams } from '../types';

/**
 * 安全字符串验证
 * 通用的字符串验证，包含XSS防护
 */
const safeStringValidator = (fieldName: string, maxLength: number = 500) => {
  return z
    .string()
    .trim()
    .max(maxLength, `${fieldName}不能超过${maxLength}个字符`)
    .optional();
};

/**
 * 整数验证器
 */
const positiveIntegerValidator = (fieldName: string, min: number = 1, max?: number) => {
  let validator = z
    .string()
    .regex(/^\d+$/, `${fieldName}必须是有效的数字`)
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= min, `${fieldName}必须大于等于${min}`);
  
  if (max !== undefined) {
    validator = validator.refine((val) => val <= max, `${fieldName}必须小于等于${max}`);
  }
  
  return validator.optional();
};

/**
 * 排序字段验证
 */
const sortFieldValidator = z
  .string()
  .refine(
    (value): value is SortField => 
      ['created_at', 'updated_at', 'title', 'rating', 'visit_count', 'featured', 'relevance'].includes(value),
    {
      message: '无效的排序字段',
    }
  )
  .optional();

/**
 * 排序顺序验证
 */
const sortOrderValidator = z
  .string()
  .refine(
    (value): value is SortOrder => 
      ['asc', 'desc'].includes(value),
    {
      message: '排序顺序必须是 asc 或 desc',
    }
  )
  .optional();

/**
 * 视图模式验证
 */
const viewModeValidator = z
  .string()
  .refine(
    (value): value is 'grid' | 'list' => 
      ['grid', 'list'].includes(value),
    {
      message: '视图模式必须是 grid 或 list',
    }
  )
  .optional();

/**
 * 布尔值验证（从字符串解析）
 */
const booleanFromStringValidator = z
  .string()
  .refine(
    (value) => ['true', 'false'].includes(value),
    {
      message: '布尔值必须是 true 或 false',
    }
  )
  .transform((val) => val === 'true')
  .optional();

/**
 * 标签数组验证（逗号分隔的字符串）
 */
const tagsValidator = z
  .string()
  .transform((val) => {
    if (!val || val.trim() === '') return [];
    return val
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // 限制最多10个标签
  })
  .refine(
    (tags) => tags.every(tag => tag.length <= 50),
    {
      message: '标签名称不能超过50个字符',
    }
  )
  .optional();

/**
 * 集合页面URL参数验证Schema
 * 
 * URL格式: /collection/[slug]?page=1
 */
export const collectionParamsSchema = z.object({
  /** 集合标识符 */
  slug: safeStringValidator('集合标识符', 100),
  
  /** 搜索查询 */
  q: safeStringValidator('搜索查询', 200),
  
  /** 页码 */
  page: positiveIntegerValidator('页码', 1, 1000),
  
  /** 每页项目数 */
  limit: positiveIntegerValidator('每页项目数', 1, 100),
  
  /** 排序字段 */
  sort: sortFieldValidator,
  
  /** 排序顺序 */
  order: sortOrderValidator,
  
  /** 视图模式 */
  view: viewModeValidator,
  
  /** 二级分类筛选 */
  category: safeStringValidator('分类筛选', 100),
  
  /** 二级标签筛选 */
  tags: tagsValidator,
  
  /** 仅显示推荐 */
  featured: booleanFromStringValidator,
  
  /** 评分筛选 */
  rating: positiveIntegerValidator('评分筛选', 0, 5),
  
  /** 包含广告 */
  ads: booleanFromStringValidator,
});

/**
 * 分类页面URL参数验证Schema
 * 
 * URL格式: /category?category=business&sort=time_listed&page=1
 */
export const categoryParamsSchema = z.object({
  /** 分类标识符 */
  category: safeStringValidator('分类标识符', 100),
  
  /** 搜索查询 */
  q: safeStringValidator('搜索查询', 200),
  
  /** 页码 */
  page: positiveIntegerValidator('页码', 1, 1000),
  
  /** 每页项目数 */
  limit: positiveIntegerValidator('每页项目数', 1, 100),
  
  /** 排序字段 */
  sort: sortFieldValidator,
  
  /** 排序顺序 */
  order: sortOrderValidator,
  
  /** 视图模式 */
  view: viewModeValidator,
  
  /** 标签筛选 */
  tags: tagsValidator,
  
  /** 仅显示推荐 */
  featured: booleanFromStringValidator,
  
  /** 评分筛选 */
  rating: positiveIntegerValidator('评分筛选', 0, 5),
  
  /** 包含广告 */
  ads: booleanFromStringValidator,
});

/**
 * 标签页面URL参数验证Schema
 * 
 * URL格式: /tag?tags=react,nextjs,typescript&sort=time_listed&page=1
 */
export const tagParamsSchema = z.object({
  /** 标签标识符（多个标签以逗号分隔） */
  tags: tagsValidator,
  
  /** 搜索查询 */
  q: safeStringValidator('搜索查询', 200),
  
  /** 页码 */
  page: positiveIntegerValidator('页码', 1, 1000),
  
  /** 每页项目数 */
  limit: positiveIntegerValidator('每页项目数', 1, 100),
  
  /** 排序字段 */
  sort: sortFieldValidator,
  
  /** 排序顺序 */
  order: sortOrderValidator,
  
  /** 视图模式 */
  view: viewModeValidator,
  
  /** 分类筛选 */
  category: safeStringValidator('分类筛选', 100),
  
  /** 仅显示推荐 */
  featured: booleanFromStringValidator,
  
  /** 评分筛选 */
  rating: positiveIntegerValidator('评分筛选', 0, 5),
  
  /** 包含广告 */
  ads: booleanFromStringValidator,
});

/**
 * 参数解析结果接口
 */
export interface ParsedParams<T = unknown> {
  /** 解析是否成功 */
  success: boolean;
  /** 解析后的参数 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 具体的错误详情 */
  issues?: z.ZodIssue[];
}

/**
 * 默认筛选参数
 */
const DEFAULT_FILTER_PARAMS: FilterParams = {
  entityId: null,
  search: '',
  categoryId: null,
  selectedTags: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
  featuredOnly: false,
  includeAds: true,
  minRating: 0,
  viewMode: 'grid',
  itemsPerPage: 12,
  currentPage: 1,
};

/**
 * 解析集合页面URL参数
 * 
 * @param params URL查询参数对象
 * @returns 解析结果，包含成功状态和筛选参数
 */
export function parseCollectionParams(params: Record<string, string | string[]>): ParsedParams {
  try {
    // 标准化参数格式（URL参数可能是数组）
    const normalizedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      normalizedParams[key] = Array.isArray(value) ? value[0] : value;
    }
    
    // 验证参数
    const validationResult = collectionParamsSchema.safeParse(normalizedParams);
    
    if (!validationResult.success) {
      console.warn('Collection URL params validation failed:', validationResult.error.issues);
      
      return {
        success: false,
        error: '集合页面URL参数格式错误',
        issues: validationResult.error.issues,
      };
    }
    
    const parsed = validationResult.data;
    
    // 转换为内部筛选参数格式
    const filterParams: FilterParams = {
      ...DEFAULT_FILTER_PARAMS,
      entityId: parsed.slug || null,
      search: parsed.q || '',
      categoryId: parsed.category || null,
      selectedTags: parsed.tags || [],
      sortBy: (parsed.sort as SortField) || 'created_at',
      sortOrder: (parsed.order as SortOrder) || 'desc',
      featuredOnly: parsed.featured || false,
      includeAds: parsed.ads !== false, // 默认包含广告
      minRating: parsed.rating || 0,
      viewMode: (parsed.view as 'grid' | 'list') || 'grid',
      itemsPerPage: parsed.limit || 12,
      currentPage: parsed.page || 1,
    };
    
    return {
      success: true,
      data: filterParams,
    };
    
  } catch (error) {
    console.error('Error parsing collection params:', error);
    
    return {
      success: false,
      error: '集合页面URL参数解析失败',
    };
  }
}

/**
 * 解析分类页面URL参数
 * 
 * @param params URL查询参数对象
 * @returns 解析结果，包含成功状态和筛选参数
 */
export function parseCategoryParams(params: Record<string, string | string[]>): ParsedParams {
  try {
    // 标准化参数格式
    const normalizedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      normalizedParams[key] = Array.isArray(value) ? value[0] : value;
    }
    
    // 验证参数
    const validationResult = categoryParamsSchema.safeParse(normalizedParams);
    
    if (!validationResult.success) {
      console.warn('Category URL params validation failed:', validationResult.error.issues);
      
      return {
        success: false,
        error: '分类页面URL参数格式错误',
        issues: validationResult.error.issues,
      };
    }
    
    const parsed = validationResult.data;
    
    // 转换为内部筛选参数格式
    const filterParams: FilterParams = {
      ...DEFAULT_FILTER_PARAMS,
      entityId: parsed.category || null,
      search: parsed.q || '',
      categoryId: parsed.category || null,
      selectedTags: parsed.tags || [],
      sortBy: (parsed.sort as SortField) || 'created_at',
      sortOrder: (parsed.order as SortOrder) || 'desc',
      featuredOnly: parsed.featured || false,
      includeAds: parsed.ads !== false,
      minRating: parsed.rating || 0,
      viewMode: (parsed.view as 'grid' | 'list') || 'grid',
      itemsPerPage: parsed.limit || 12,
      currentPage: parsed.page || 1,
    };
    
    return {
      success: true,
      data: filterParams,
    };
    
  } catch (error) {
    console.error('Error parsing category params:', error);
    
    return {
      success: false,
      error: '分类页面URL参数解析失败',
    };
  }
}

/**
 * 解析标签页面URL参数
 * 
 * @param params URL查询参数对象
 * @returns 解析结果，包含成功状态和筛选参数
 */
export function parseTagParams(params: Record<string, string | string[]>): ParsedParams {
  try {
    // 标准化参数格式
    const normalizedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      normalizedParams[key] = Array.isArray(value) ? value[0] : value;
    }
    
    // 验证参数
    const validationResult = tagParamsSchema.safeParse(normalizedParams);
    
    if (!validationResult.success) {
      console.warn('Tag URL params validation failed:', validationResult.error.issues);
      
      return {
        success: false,
        error: '标签页面URL参数格式错误',
        issues: validationResult.error.issues,
      };
    }
    
    const parsed = validationResult.data;
    
    // 转换为内部筛选参数格式
    const filterParams: FilterParams = {
      ...DEFAULT_FILTER_PARAMS,
      entityId: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags.join(',') : null,
      search: parsed.q || '',
      categoryId: parsed.category || null,
      selectedTags: parsed.tags || [],
      sortBy: (parsed.sort as SortField) || 'created_at',
      sortOrder: (parsed.order as SortOrder) || 'desc',
      featuredOnly: parsed.featured || false,
      includeAds: parsed.ads !== false,
      minRating: parsed.rating || 0,
      viewMode: (parsed.view as 'grid' | 'list') || 'grid',
      itemsPerPage: parsed.limit || 12,
      currentPage: parsed.page || 1,
    };
    
    return {
      success: true,
      data: filterParams,
    };
    
  } catch (error) {
    console.error('Error parsing tag params:', error);
    
    return {
      success: false,
      error: '标签页面URL参数解析失败',
    };
  }
}

/**
 * 通用URL参数解析函数
 * 
 * 根据页面类型自动选择合适的解析器
 * 
 * @param pageType 页面类型
 * @param params URL查询参数对象
 * @returns 解析结果，包含成功状态和筛选参数
 */
export function parseUrlParams(
  pageType: 'collection' | 'category' | 'tag',
  params: Record<string, string | string[]>
): ParsedParams {
  switch (pageType) {
    case 'collection':
      return parseCollectionParams(params);
    case 'category':
      return parseCategoryParams(params);
    case 'tag':
      return parseTagParams(params);
    default:
      return {
        success: false,
        error: `不支持的页面类型: ${pageType}`,
      };
  }
}

/**
 * URL参数格式验证函数
 * 
 * 快速验证URL参数格式是否正确，不进行完整解析
 * 
 * @param pageType 页面类型
 * @param params URL查询参数对象
 * @returns 验证结果
 */
export function validateUrlParams(
  pageType: 'collection' | 'category' | 'tag',
  params: Record<string, string | string[]>
): { isValid: boolean; errors: string[] } {
  const parseResult = parseUrlParams(pageType, params);
  
  if (parseResult.success) {
    return {
      isValid: true,
      errors: [],
    };
  }
  
  const errors = parseResult.issues 
    ? parseResult.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
    : [parseResult.error || '未知错误'];
  
  return {
    isValid: false,
    errors,
  };
}

/**
 * 获取URL参数的默认值
 * 
 * 当URL参数解析失败时，返回对应页面类型的默认筛选参数
 * 
 * @param pageType 页面类型
 * @param entityId 实体ID（可选）
 * @returns 默认筛选参数
 */
export function getDefaultParams(
  pageType: 'collection' | 'category' | 'tag',
  entityId?: string | null
): FilterParams {
  const baseParams = { ...DEFAULT_FILTER_PARAMS };
  
  switch (pageType) {
    case 'collection':
      return {
        ...baseParams,
        entityId: entityId || null,
      };
    case 'category':
      return {
        ...baseParams,
        entityId: entityId || null,
        categoryId: entityId || null,
      };
    case 'tag':
      return {
        ...baseParams,
        entityId: entityId || null,
        selectedTags: entityId ? [entityId] : [],
      };
    default:
      return baseParams;
  }
}

/**
 * 筛选参数转URL参数
 * 
 * 将内部筛选参数格式转换为URL查询参数格式
 * 
 * @param filterParams 筛选参数
 * @param pageType 页面类型
 * @returns URL查询参数对象
 */
export function filterParamsToUrlParams(
  filterParams: FilterParams,
  pageType: 'collection' | 'category' | 'tag'
): BrowsablePageURLParams {
  const urlParams: BrowsablePageURLParams = {};
  
  // 实体标识符
  if (filterParams.entityId && pageType === 'collection') {
    urlParams.slug = filterParams.entityId;
  } else if (filterParams.categoryId && pageType === 'category') {
    urlParams.category = filterParams.categoryId;
  } else if (filterParams.selectedTags && filterParams.selectedTags.length > 0 && pageType === 'tag') {
    urlParams.tags = filterParams.selectedTags.join(',');
  }
  
  // 搜索查询
  if (filterParams.search && filterParams.search.trim()) {
    urlParams.q = filterParams.search.trim();
  }
  
  // 分类筛选（非主要分类页面）
  if (filterParams.categoryId && pageType !== 'category') {
    urlParams.category = filterParams.categoryId;
  }
  
  // 标签筛选（非标签页面）
  if (filterParams.selectedTags && filterParams.selectedTags.length > 0 && pageType !== 'tag') {
    urlParams.tags = filterParams.selectedTags.join(',');
  }
  
  // 排序参数（非默认值）
  if (filterParams.sortBy && filterParams.sortBy !== 'created_at') {
    urlParams.sort = filterParams.sortBy;
  }
  if (filterParams.sortOrder && filterParams.sortOrder !== 'desc') {
    urlParams.order = filterParams.sortOrder;
  }
  
  // 视图模式（非默认值）
  if (filterParams.viewMode && filterParams.viewMode !== 'grid') {
    urlParams.view = filterParams.viewMode;
  }
  
  // 分页参数（非第一页）
  if (filterParams.currentPage && filterParams.currentPage > 1) {
    urlParams.page = filterParams.currentPage.toString();
  }
  
  // 每页项目数（非默认值）
  if (filterParams.itemsPerPage && filterParams.itemsPerPage !== 12) {
    urlParams.limit = filterParams.itemsPerPage.toString();
  }
  
  // 高级筛选（非默认值）
  if (filterParams.featuredOnly) {
    urlParams.featured = 'true';
  }
  
  if (filterParams.minRating && filterParams.minRating > 0) {
    urlParams.rating = filterParams.minRating.toString();
  }
  
  if (filterParams.includeAds === false) {
    urlParams.ads = 'false';
  }
  
  return urlParams;
}

/**
 * 参数错误恢复工具
 * 
 * 当URL参数解析失败时，提供智能恢复机制
 * 
 * @param pageType 页面类型
 * @param rawParams 原始URL参数
 * @param fallbackEntityId 回退实体ID
 * @returns 恢复后的筛选参数
 */
export function recoverFromParsingError(
  pageType: 'collection' | 'category' | 'tag',
  rawParams: Record<string, string | string[]>,
  fallbackEntityId?: string | null
): FilterParams {
  console.warn(`URL参数解析失败，正在尝试恢复...`, { pageType, rawParams });
  
  // 获取默认参数
  const defaultParams = getDefaultParams(pageType, fallbackEntityId);
  
  // 尝试恢复部分有效参数
  const recoveredParams = { ...defaultParams };
  
  try {
    // 尝试恢复页码
    const pageStr = Array.isArray(rawParams.page) ? rawParams.page[0] : rawParams.page;
    if (pageStr && /^\d+$/.test(pageStr)) {
      const page = parseInt(pageStr, 10);
      if (page > 0 && page <= 1000) {
        recoveredParams.currentPage = page;
      }
    }
    
    // 尝试恢复搜索查询
    const queryStr = Array.isArray(rawParams.q) ? rawParams.q[0] : rawParams.q;
    if (queryStr && typeof queryStr === 'string' && queryStr.length <= 200) {
      recoveredParams.search = queryStr.trim();
    }
    
    // 尝试恢复排序
    const sortStr = Array.isArray(rawParams.sort) ? rawParams.sort[0] : rawParams.sort;
    if (sortStr && ['created_at', 'updated_at', 'title', 'rating', 'visit_count', 'featured'].includes(sortStr)) {
      recoveredParams.sortBy = sortStr as FilterParams['sortBy'];
    }
    
    const orderStr = Array.isArray(rawParams.order) ? rawParams.order[0] : rawParams.order;
    if (orderStr && ['asc', 'desc'].includes(orderStr)) {
      recoveredParams.sortOrder = orderStr as FilterParams['sortOrder'];
    }
    
    // 尝试恢复视图模式
    const viewStr = Array.isArray(rawParams.view) ? rawParams.view[0] : rawParams.view;
    if (viewStr && ['grid', 'list'].includes(viewStr)) {
      recoveredParams.viewMode = viewStr as FilterParams['viewMode'];
    }
    
  } catch (error) {
    console.warn('参数恢复过程中出现错误，使用默认值:', error);
  }
  
  return recoveredParams;
}

/**
 * 类型定义导出
 */
export type CollectionParams = z.infer<typeof collectionParamsSchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type TagParams = z.infer<typeof tagParamsSchema>;