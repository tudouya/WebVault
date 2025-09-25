/**
 * Website Detail Data Service
 * 
 * 提供网站详情页面的数据获取和处理服务
 * 包含网站详情获取、相关网站推荐、访问统计等功能
 * 
 * @version 1.0.0
 * @author WebVault Team
 */

import type { Category } from '../types/category';
import { WebsiteDetailData } from '../types/detail';
import { Website, WebsiteCardData } from '../types/website';
import { mockWebsites } from '../data/mockWebsites';

/**
 * 相关网站推荐策略类型
 */
export type RelatedWebsitesStrategy = 'category' | 'tags' | 'content' | 'mixed';

/**
 * 相关网站推荐选项
 */
export interface RelatedWebsitesOptions {
  /** 推荐策略 */
  strategy?: RelatedWebsitesStrategy;
  /** 推荐数量限制 */
  limit?: number;
  /** 排除当前网站 */
  excludeCurrentWebsite?: boolean;
  /** 最小相似度阈值 */
  minSimilarityScore?: number;
  /** 是否包含广告网站 */
  includeAds?: boolean;
}

/**
 * 网站详情服务错误类型
 */
export class WebsiteDetailServiceError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'ACCESS_DENIED' | 'VALIDATION_ERROR' | 'FETCH_ERROR' | 'VISIT_TRACKING_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'WebsiteDetailServiceError';
  }
}

/**
 * 访问统计结果接口
 */
export interface VisitTrackingResult {
  /** 是否成功 */
  success: boolean;
  /** 更新后的访问次数 */
  newVisitCount: number;
  /** 错误信息（如果有） */
  error?: string;
}

type WebsiteDetailSource = Website | WebsiteCardData | WebsiteDetailData;

function isWebsiteDetailData(source: WebsiteDetailSource): source is WebsiteDetailData {
  return 'is_accessible' in source;
}

function toSlug(value: string): string {
  const trimmed = value.trim();
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || trimmed;
}

function buildFallbackCategory(
  name: string,
  timestamps: { createdAt: string; updatedAt: string },
  id?: string
): Category {
  return {
    id: id ?? toSlug(name),
    name,
    slug: toSlug(name),
    parentId: null,
    children: [],
    description: undefined,
    icon_url: undefined,
    color: undefined,
    status: 'active',
    sort_order: 0,
    website_count: 0,
    is_expanded: false,
    is_visible: true,
    created_at: timestamps.createdAt,
    updated_at: timestamps.updatedAt,
  };
}

function getCreatedAt(source: WebsiteDetailSource): string {
  if ('created_at' in source && source.created_at) {
    return source.created_at;
  }
  return new Date().toISOString();
}

function getUpdatedAt(source: WebsiteDetailSource, fallback: string): string {
  if ('updated_at' in source && source.updated_at) {
    return source.updated_at;
  }
  return fallback;
}

function getVisitCount(source: WebsiteDetailSource): number {
  if ('visitCount' in source && typeof source.visitCount === 'number') {
    return source.visitCount;
  }
  if ('visit_count' in source && typeof source.visit_count === 'number') {
    return source.visit_count;
  }
  return 0;
}

function getScreenshotUrl(source: WebsiteDetailSource): string | undefined {
  if ('screenshot_url' in source && source.screenshot_url) {
    return source.screenshot_url;
  }
  if ('image_url' in source && source.image_url) {
    return source.image_url;
  }
  return undefined;
}

function getCategoryId(source: WebsiteDetailSource): string | undefined {
  if ('category_id' in source && source.category_id) {
    return source.category_id;
  }
  if ('category' in source && source.category && typeof source.category === 'object' && 'id' in source.category && typeof source.category.id === 'string') {
    return source.category.id;
  }
  return undefined;
}

function getCategoryName(source: WebsiteDetailSource): string | undefined {
  if ('category' in source) {
    const categoryValue = source.category;
    if (typeof categoryValue === 'string') {
      return categoryValue;
    }
    if (categoryValue && typeof categoryValue === 'object' && 'name' in categoryValue && typeof categoryValue.name === 'string') {
      return categoryValue.name;
    }
  }
  return undefined;
}

/**
 * 网站详情数据服务类
 * 
 * 提供网站详情获取、相关网站推荐、访问统计等核心功能
 * 包含完整的错误处理和数据验证逻辑
 */
export class WebsiteDetailService {
  private static instance: WebsiteDetailService;
  private cache = new Map<string, WebsiteDetailData>();
  private relatedWebsitesCache = new Map<string, WebsiteCardData[]>();
  
  /**
   * 获取服务单例实例
   */
  public static getInstance(): WebsiteDetailService {
    if (!WebsiteDetailService.instance) {
      WebsiteDetailService.instance = new WebsiteDetailService();
    }
    return WebsiteDetailService.instance;
  }

  /**
   * 根据ID获取网站详情数据
   * 
   * @param websiteId - 网站的唯一标识符
   * @returns Promise<WebsiteDetailData> - 网站详情数据
   * @throws WebsiteDetailServiceError - 当网站不存在、无权限访问或数据验证失败时
   */
  async getWebsiteById(websiteId: string): Promise<WebsiteDetailData> {
    try {
      // 输入验证
      if (!websiteId || typeof websiteId !== 'string') {
        throw new WebsiteDetailServiceError(
          'Invalid website ID parameter',
          'VALIDATION_ERROR',
          { providedId: websiteId }
        );
      }

      const normalizedId = websiteId.trim();

      // 检查缓存
      if (this.cache.has(normalizedId)) {
        const cachedData = this.cache.get(normalizedId)!;
        return this.validateAndCloneWebsiteData(cachedData);
      }

      // 模拟数据获取延迟（实际项目中这里会是API调用）
      await this.simulateNetworkDelay();

      // 从Mock数据中查找基础网站信息
      const baseWebsite = mockWebsites.find(
        website => website.id === normalizedId
      );

      if (!baseWebsite) {
        throw new WebsiteDetailServiceError(
          `Website with ID "${websiteId}" not found`,
          'NOT_FOUND',
          { requestedId: websiteId, normalizedId }
        );
      }

      // 验证网站访问权限 (NFR-3.5.1: 只显示活跃且公开的网站)
      if (!this.isWebsiteAccessible(baseWebsite)) {
        throw new WebsiteDetailServiceError(
          `Website with ID "${websiteId}" is not accessible or not public`,
          'ACCESS_DENIED',
          { 
            websiteId: websiteId,
            status: 'inactive', // mockWebsites 中的数据结构可能不同
            isPublic: false
          }
        );
      }

      // 转换为详情数据格式
      const websiteDetail = this.transformToWebsiteDetailData(baseWebsite);

      // 验证数据完整性
      const validationResult = this.validateWebsiteDetailData(websiteDetail);
      if (!validationResult.isValid) {
        throw new WebsiteDetailServiceError(
          'Website data validation failed',
          'VALIDATION_ERROR',
          { 
            websiteId: websiteId,
            errors: validationResult.errors,
            websiteData: websiteDetail
          }
        );
      }

      // 深拷贝防止意外修改
      const clonedWebsiteDetail = this.deepCloneWebsiteData(websiteDetail);

      // 缓存数据（实际项目中可以加入TTL）
      this.cache.set(normalizedId, clonedWebsiteDetail);

      return clonedWebsiteDetail;

    } catch (error) {
      if (error instanceof WebsiteDetailServiceError) {
        throw error;
      }

      // 包装未预期的错误
      throw new WebsiteDetailServiceError(
        `Failed to fetch website detail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FETCH_ERROR',
        { originalError: error, websiteId }
      );
    }
  }

  /**
   * 获取相关网站推荐
   * 
   * @param currentWebsiteId - 当前网站ID
   * @param options - 推荐选项配置
   * @returns Promise<WebsiteCardData[]> - 相关网站列表
   */
  async getRelatedWebsites(
    currentWebsiteId: string,
    options: RelatedWebsitesOptions = {}
  ): Promise<WebsiteCardData[]> {
    try {
      const {
        strategy = 'mixed',
        limit = 3,
        excludeCurrentWebsite = true,
        minSimilarityScore = 0.1,
        includeAds = false
      } = options;

      // 输入验证
      if (!currentWebsiteId || typeof currentWebsiteId !== 'string') {
        throw new WebsiteDetailServiceError(
          'Invalid currentWebsiteId parameter',
          'VALIDATION_ERROR',
          { providedId: currentWebsiteId }
        );
      }

      if (limit <= 0 || limit > 20) {
        throw new WebsiteDetailServiceError(
          'Limit must be between 1 and 20',
          'VALIDATION_ERROR',
          { providedLimit: limit }
        );
      }

      // 生成缓存键
      const cacheKey = `${currentWebsiteId}-${strategy}-${limit}-${excludeCurrentWebsite}-${includeAds}`;
      
      // 检查缓存
      if (this.relatedWebsitesCache.has(cacheKey)) {
        return this.relatedWebsitesCache.get(cacheKey)!.slice(0, limit);
      }

      // 模拟网络延迟
      await this.simulateNetworkDelay(100);

      // 获取当前网站详情
      const currentWebsite = mockWebsites.find(website => website.id === currentWebsiteId);
      if (!currentWebsite) {
        throw new WebsiteDetailServiceError(
          `Current website with ID "${currentWebsiteId}" not found`,
          'NOT_FOUND',
          { requestedId: currentWebsiteId }
        );
      }

      // 获取候选网站列表，过滤掉不可访问的网站
      const candidateWebsites = mockWebsites.filter(website => {
        // 排除当前网站
        if (excludeCurrentWebsite && website.id === currentWebsiteId) {
          return false;
        }
        
        // 验证访问权限
        if (!this.isWebsiteAccessible(website)) {
          return false;
        }
        
        // 广告过滤
        if (!includeAds && website.isAd) {
          return false;
        }
        
        return true;
      });

      const currentWebsiteDetail = this.transformToWebsiteDetailData(currentWebsite);
      const candidateDetails = candidateWebsites.map((website) =>
        this.transformToWebsiteDetailData(website)
      );

      // 根据策略计算相关性分数
      const scoredWebsites = candidateDetails.map((websiteDetail) => ({
        website: websiteDetail,
        score: this.calculateRelatednessScore(currentWebsiteDetail, websiteDetail, strategy),
      }));

      // 过滤低分网站并排序
      const filteredAndSorted = scoredWebsites
        .filter(item => item.score >= minSimilarityScore)
        .sort((a, b) => b.score - a.score);

      // 转换为卡片数据
      const relatedWebsites = filteredAndSorted
        .slice(0, limit)
        .map(item => this.extractCardData(item.website));

      // 缓存结果
      this.relatedWebsitesCache.set(cacheKey, relatedWebsites);

      return relatedWebsites;

    } catch (error) {
      if (error instanceof WebsiteDetailServiceError) {
        throw error;
      }

      throw new WebsiteDetailServiceError(
        `Failed to get related websites: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FETCH_ERROR',
        { originalError: error, currentWebsiteId, options }
      );
    }
  }

  /**
   * 跟踪网站访问次数（AC-2.4.3 - 访问统计功能）
   * 
   * @param websiteId - 网站ID
   * @returns Promise<VisitTrackingResult> - 访问统计结果
   */
  async trackWebsiteVisit(websiteId: string): Promise<VisitTrackingResult> {
    try {
      // 输入验证
      if (!websiteId || typeof websiteId !== 'string') {
        return {
          success: false,
          newVisitCount: 0,
          error: 'Invalid website ID parameter'
        };
      }

      // 模拟API调用延迟
      await this.simulateNetworkDelay(50);

      // 查找网站
      const websiteIndex = mockWebsites.findIndex(website => website.id === websiteId);
      if (websiteIndex === -1) {
        return {
          success: false,
          newVisitCount: 0,
          error: `Website with ID "${websiteId}" not found`
        };
      }

      const website = mockWebsites[websiteIndex];

      // 验证网站访问权限
      if (!this.isWebsiteAccessible(website)) {
        return {
          success: false,
          newVisitCount: website.visit_count || 0,
          error: 'Website is not accessible or not public'
        };
      }

      // 增加访问次数
      const newVisitCount = (website.visit_count || 0) + 1;
      mockWebsites[websiteIndex] = {
        ...website,
        visit_count: newVisitCount,
        updated_at: new Date().toISOString()
      };

      // 清除相关缓存
      this.clearWebsiteCache(websiteId);

      return {
        success: true,
        newVisitCount: newVisitCount
      };

    } catch (error) {
      return {
        success: false,
        newVisitCount: 0,
        error: `Failed to track visit: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 预加载网站详情数据
   * 
   * @param websiteIds - 要预加载的网站ID数组
   * @returns Promise<void>
   */
  async preloadWebsiteDetails(websiteIds: string[]): Promise<void> {
    const preloadPromises = websiteIds.map(websiteId => 
      this.getWebsiteById(websiteId).catch(error => {
        console.warn(`Failed to preload website with ID "${websiteId}":`, error);
        return null;
      })
    );

    await Promise.all(preloadPromises);
  }

  /**
   * 清除缓存
   * 
   * @param type - 缓存类型，'all' | 'websites' | 'related'
   */
  clearCache(type: 'all' | 'websites' | 'related' = 'all'): void {
    if (type === 'all' || type === 'websites') {
      this.cache.clear();
    }
    if (type === 'all' || type === 'related') {
      this.relatedWebsitesCache.clear();
    }
  }

  /**
   * 清除特定网站的缓存
   */
  private clearWebsiteCache(websiteId: string): void {
    this.cache.delete(websiteId);
    
    // 清除相关网站缓存（包含该网站ID的缓存）
    const keysToDelete = Array.from(this.relatedWebsitesCache.keys()).filter(key => 
      key.startsWith(websiteId + '-')
    );
    keysToDelete.forEach(key => this.relatedWebsitesCache.delete(key));
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      websitesCached: this.cache.size,
      relatedWebsitesCached: this.relatedWebsitesCache.size,
      totalCacheEntries: this.cache.size + this.relatedWebsitesCache.size
    };
  }

  /**
   * 验证网站是否可访问 (NFR-3.5.1: 只显示活跃且公开的网站)
   */
  private isWebsiteAccessible(website: WebsiteCardData): boolean {
    // Mock数据中的网站默认都是可访问的，实际项目中会检查 status 和 is_public 字段
    // 这里我们简单地检查是否有必要的字段
    return !!(website.id && website.title && website.url);
  }

  /**
   * 转换基础网站数据为详情数据格式
   */
  private transformToWebsiteDetailData(baseWebsite: WebsiteDetailSource): WebsiteDetailData {
    if (isWebsiteDetailData(baseWebsite)) {
      return this.deepCloneWebsiteData(baseWebsite);
    }

    const createdAt = getCreatedAt(baseWebsite);
    const updatedAt = getUpdatedAt(baseWebsite, createdAt);
    const visitCount = getVisitCount(baseWebsite);
    const tags = Array.isArray(baseWebsite.tags) ? baseWebsite.tags : [];
    const categoryId = getCategoryId(baseWebsite);
    const categoryName = getCategoryName(baseWebsite);
    const status = this.normalizeStatus(
      'status' in baseWebsite ? (baseWebsite as { status?: unknown }).status : undefined
    );

    const detail: WebsiteDetailData = {
      id: String(baseWebsite.id),
      title: baseWebsite.title,
      description: baseWebsite.description,
      url: baseWebsite.url,
      tags,
      favicon_url: baseWebsite.favicon_url,
      screenshot_url: getScreenshotUrl(baseWebsite),
      category_id: categoryId,
      status,
      isAd: 'isAd' in baseWebsite ? Boolean(baseWebsite.isAd) : false,
      adType: 'adType' in baseWebsite ? baseWebsite.adType : undefined,
      rating: typeof baseWebsite.rating === 'number' ? baseWebsite.rating : undefined,
      visitCount,
      is_featured: 'is_featured' in baseWebsite ? Boolean(baseWebsite.is_featured) : false,
      is_public: 'is_public' in baseWebsite ? Boolean(baseWebsite.is_public) : true,
      created_at: createdAt,
      updated_at: updatedAt,

      // 详情页面专有字段
      content: baseWebsite.description || '',
      language: 'zh-CN',
      popularity_score: 0,
      last_checked_at: new Date().toISOString(),
      is_accessible: true,

      // SEO 元数据
      meta_title: baseWebsite.title,
      meta_description: baseWebsite.description || '',

      // 模拟统计数据
      stats: {
        total_visits: visitCount,
        monthly_visits: Math.floor(visitCount * 0.3),
        weekly_visits: Math.floor(visitCount * 0.1),
        daily_visits: Math.floor(visitCount * 0.02),
        bounce_rate: 0.4 + Math.random() * 0.4,
        avg_session_duration: 120 + Math.random() * 300,
      },

      // 功能特性（基于标签推断）
      features: this.extractFeaturesFromTags(tags),

      // 定价信息（基于类型推断）
      pricing: this.inferPricingInfo(baseWebsite),
    };

    if (categoryName) {
      detail.category = buildFallbackCategory(
        categoryName,
        { createdAt, updatedAt },
        detail.category_id
      );
    }

    detail.popularity_score = this.calculatePopularityScore(detail);

    return detail;
  }

  /**
   * 计算网站流行度分数
   */
  private calculatePopularityScore(website: Partial<WebsiteDetailData>): number {
    const visitCount = website.visitCount || 0;
    const rating = website.rating || 0;
    const isFeatured = website.is_featured ? 1 : 0;
    
    // 简化的流行度计算公式
    return Math.min(
      (visitCount / 1000) * 0.4 + 
      (rating / 5) * 0.4 + 
      isFeatured * 0.2,
      1
    );
  }

  /**
   * 从标签中提取功能特性
   */
  private extractFeaturesFromTags(tags: string[]): string[] {
    const featureKeywords = ['协作', '免费', '开源', '云端', '实时', '移动', 'API'];
    return tags.filter(tag => 
      featureKeywords.some(keyword => tag.includes(keyword))
    );
  }

  /**
   * 推断定价信息
   */
  private inferPricingInfo(website: WebsiteDetailSource): {
    is_free: boolean;
    has_paid_plans: boolean;
    starting_price?: string;
    currency?: string;
  } {
    const tags = Array.isArray(website.tags) ? website.tags : [];
    const isFree = tags.some((tag) => tag.includes('免费'));

    return {
      is_free: isFree,
      has_paid_plans: !isFree,
      starting_price: isFree ? '免费' : undefined,
      currency: 'CNY',
    };
  }

  private normalizeStatus(value: unknown): WebsiteDetailData['status'] {
    const allowedStatuses: WebsiteDetailData['status'][] = ['active', 'inactive', 'pending', 'rejected'];
    if (typeof value === 'string' && (allowedStatuses as string[]).includes(value)) {
      return value as WebsiteDetailData['status'];
    }
    return 'active';
  }

  /**
   * 计算两个网站的相关性分数
   */
  private calculateRelatednessScore(
    currentWebsite: Partial<WebsiteDetailData>,
    candidateWebsite: Partial<WebsiteDetailData>,
    strategy: RelatedWebsitesStrategy
  ): number {
    switch (strategy) {
      case 'category':
        return this.calculateCategoryScore(currentWebsite, candidateWebsite);
      
      case 'tags':
        return this.calculateTagsScore(currentWebsite, candidateWebsite);
      
      case 'content':
        return this.calculateContentScore(currentWebsite, candidateWebsite);
      
      case 'mixed':
      default:
        return this.calculateMixedScore(currentWebsite, candidateWebsite);
    }
  }

  /**
   * 基于分类的相关性分数
   */
  private calculateCategoryScore(currentWebsite: Partial<WebsiteDetailData>, candidateWebsite: Partial<WebsiteDetailData>): number {
    if (currentWebsite.category?.id === candidateWebsite.category?.id) {
      return 1.0;
    }

    // 相关分类映射（可以根据业务需求扩展）
    const relatedCategories: Record<string, string[]> = {
      '开发工具': ['开发社区', '生产力工具'],
      '设计工具': ['设计社区', '资源库'],
      '生产力工具': ['开发工具', '项目管理'],
      '设计社区': ['设计工具', '创意'],
    };

    const currentCategory = currentWebsite.category?.name || '';
    const candidateCategory = candidateWebsite.category?.name || '';
    
    if (currentCategory && candidateCategory && relatedCategories[currentCategory]?.includes(candidateCategory)) {
      return 0.6;
    }

    return 0.1;
  }

  /**
   * 基于标签的相关性分数
   */
  private calculateTagsScore(currentWebsite: Partial<WebsiteDetailData>, candidateWebsite: Partial<WebsiteDetailData>): number {
    const currentTags = new Set((currentWebsite.tags || []).map((tag: string) => tag.toLowerCase()));
    const candidateTags = new Set((candidateWebsite.tags || []).map((tag: string) => tag.toLowerCase()));

    if (currentTags.size === 0 && candidateTags.size === 0) {
      return 0.1;
    }

    // 计算Jaccard相似度
    const intersection = new Set(Array.from(currentTags).filter(tag => candidateTags.has(tag)));
    const union = new Set([...Array.from(currentTags), ...Array.from(candidateTags)]);

    return intersection.size / union.size;
  }

  /**
   * 基于内容的相关性分数
   */
  private calculateContentScore(currentWebsite: Partial<WebsiteDetailData>, candidateWebsite: Partial<WebsiteDetailData>): number {
    const currentContent = `${currentWebsite.title} ${currentWebsite.description || ''}`.toLowerCase();
    const candidateContent = `${candidateWebsite.title} ${candidateWebsite.description || ''}`.toLowerCase();

    // 计算关键词重叠
    const currentWords = new Set(currentContent.split(/\s+/).filter(word => word.length > 2));
    const candidateWords = new Set(candidateContent.split(/\s+/).filter(word => word.length > 2));

    if (currentWords.size === 0 && candidateWords.size === 0) {
      return 0.1;
    }

    const intersection = new Set(Array.from(currentWords).filter(word => candidateWords.has(word)));
    const union = new Set([...Array.from(currentWords), ...Array.from(candidateWords)]);

    return intersection.size / union.size;
  }

  /**
   * 混合策略的相关性分数
   */
  private calculateMixedScore(currentWebsite: Partial<WebsiteDetailData>, candidateWebsite: Partial<WebsiteDetailData>): number {
    const categoryScore = this.calculateCategoryScore(currentWebsite, candidateWebsite);
    const tagsScore = this.calculateTagsScore(currentWebsite, candidateWebsite);
    const contentScore = this.calculateContentScore(currentWebsite, candidateWebsite);

    // 加权平均
    return (categoryScore * 0.5) + (tagsScore * 0.3) + (contentScore * 0.2);
  }

  /**
   * 验证网站详情数据
   */
  private validateWebsiteDetailData(data: WebsiteDetailData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基础字段验证
    if (!data.id || typeof data.id !== 'string') {
      errors.push('Invalid or missing website ID');
    }
    
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Invalid or missing website title');
    }
    
    if (!data.url || typeof data.url !== 'string') {
      errors.push('Invalid or missing website URL');
    }

    // URL格式验证
    try {
      new URL(data.url);
    } catch {
      errors.push('Invalid URL format');
    }

    // 状态验证
    const validStatuses = ['active', 'inactive', 'pending', 'rejected'];
    if (!validStatuses.includes(data.status)) {
      errors.push('Invalid website status');
    }

    // 访问权限验证
    if (typeof data.is_accessible !== 'boolean') {
      errors.push('Invalid is_accessible field');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 提取网站卡片数据
   */
  private extractCardData(website: Partial<WebsiteDetailData>): WebsiteCardData {
    return {
      id: website.id!,
      title: website.title!,
      description: website.description,
      url: website.url!,
      favicon_url: website.favicon_url,
      image_url: website.screenshot_url,
      tags: website.tags || [],
      category: website.category?.name,
      isAd: website.isAd,
      adType: website.adType,
      rating: website.rating,
      visit_count: website.visitCount,
      is_featured: website.is_featured,
      created_at: website.created_at,
      updated_at: website.updated_at
    };
  }

  /**
   * 验证并克隆网站数据
   */
  private validateAndCloneWebsiteData(data: WebsiteDetailData): WebsiteDetailData {
    const validationResult = this.validateWebsiteDetailData(data);
    if (!validationResult.isValid) {
      throw new WebsiteDetailServiceError(
        'Cached website data validation failed',
        'VALIDATION_ERROR',
        { errors: validationResult.errors }
      );
    }

    return this.deepCloneWebsiteData(data);
  }

  /**
   * 深拷贝网站数据
   */
  private deepCloneWebsiteData(data: WebsiteDetailData): WebsiteDetailData {
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * 模拟网络延迟
   */
  private async simulateNetworkDelay(ms: number = 200): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }
}

/**
 * 便捷的服务实例获取函数
 */
export const websiteDetailService = WebsiteDetailService.getInstance();

/**
 * 根据ID获取网站详情数据的便捷函数
 * 
 * @param websiteId - 网站的唯一标识符
 * @returns Promise<WebsiteDetailData> - 网站详情数据
 */
export async function getWebsiteById(websiteId: string): Promise<WebsiteDetailData> {
  return websiteDetailService.getWebsiteById(websiteId);
}

/**
 * 获取相关网站推荐的便捷函数
 * 
 * @param currentWebsiteId - 当前网站ID
 * @param options - 推荐选项配置
 * @returns Promise<WebsiteCardData[]> - 相关网站列表
 */
export async function getRelatedWebsites(
  currentWebsiteId: string,
  options?: RelatedWebsitesOptions
): Promise<WebsiteCardData[]> {
  return websiteDetailService.getRelatedWebsites(currentWebsiteId, options);
}

/**
 * 跟踪网站访问次数的便捷函数
 * 
 * @param websiteId - 网站ID
 * @returns Promise<VisitTrackingResult> - 访问统计结果
 */
export async function trackWebsiteVisit(websiteId: string): Promise<VisitTrackingResult> {
  return websiteDetailService.trackWebsiteVisit(websiteId);
}

/**
 * 批量获取网站详情的工具函数
 * 
 * @param websiteIds - 网站ID数组
 * @returns Promise<WebsiteDetailData[]> - 网站详情数组（不包含获取失败的）
 */
export async function getWebsitesByIdsBatch(websiteIds: string[]): Promise<WebsiteDetailData[]> {
  const results = await Promise.allSettled(
    websiteIds.map(websiteId => getWebsiteById(websiteId))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<WebsiteDetailData> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

/**
 * 获取网站智能推荐函数
 * 
 * 基于用户浏览历史和网站特征提供个性化推荐
 * 
 * @param currentWebsiteId - 当前网站ID
 * @param userBrowsingHistory - 用户浏览历史（可选）
 * @param limit - 推荐数量限制
 * @returns Promise<WebsiteCardData[]> - 智能推荐网站列表
 */
export async function getSmartRecommendations(
  currentWebsiteId: string,
  userBrowsingHistory?: string[],
  limit: number = 4
): Promise<WebsiteCardData[]> {
  try {
    // 如果没有用户历史，使用混合策略
    if (!userBrowsingHistory || userBrowsingHistory.length === 0) {
      return getRelatedWebsites(currentWebsiteId, { 
        strategy: 'mixed', 
        limit,
        minSimilarityScore: 0.2 
      });
    }

    // 基于用户历史的个性化推荐
    const currentWebsite = mockWebsites.find(website => website.id === currentWebsiteId);
    if (!currentWebsite) {
      throw new WebsiteDetailServiceError(
        `Website with ID "${currentWebsiteId}" not found`,
        'NOT_FOUND'
      );
    }

    // 获取候选网站（排除当前网站和已浏览的网站）
    const candidates = mockWebsites.filter(website => 
      website.id !== currentWebsiteId && 
      !userBrowsingHistory.includes(website.id)
      // Mock数据中暂时不检查 status 和 is_public，实际项目中会添加这些条件
    );

    // 基于浏览历史计算个性化分数
    const scoredWebsites = candidates.map((website) => ({
      website,
      score: calculatePersonalizedScore(currentWebsite, website, userBrowsingHistory),
    }));

    // 返回得分最高的网站
    const recommendations = scoredWebsites
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => extractCardDataHelper(item.website));

    return recommendations;

  } catch (error) {
    console.warn('Smart recommendations failed, falling back to standard related websites:', error);
    return getRelatedWebsites(currentWebsiteId, { limit });
  }
}

/**
 * 提取网站卡片数据的辅助函数
 */
function extractCardDataHelper(website: WebsiteCardData | WebsiteDetailData): WebsiteCardData {
  const visitCount = 'visit_count' in website && typeof website.visit_count === 'number'
    ? website.visit_count
    : 'visitCount' in website && typeof website.visitCount === 'number'
      ? website.visitCount
      : undefined;

  const imageUrl = 'image_url' in website
    ? website.image_url
    : 'screenshot_url' in website
      ? website.screenshot_url
      : undefined;

  const categoryName = 'category' in website
    ? (typeof website.category === 'string'
        ? website.category
        : website.category?.name)
    : undefined;

  return {
    id: website.id,
    title: website.title,
    description: website.description,
    url: website.url,
    favicon_url: website.favicon_url,
    image_url: imageUrl,
    tags: website.tags || [],
    category: categoryName,
    isAd: website.isAd,
    adType: website.adType,
    rating: website.rating,
    visit_count: visitCount,
    is_featured: website.is_featured,
    created_at: website.created_at,
    updated_at: website.updated_at,
  };
}

/**
 * 计算个性化推荐分数
 */
function calculatePersonalizedScore(
  _currentWebsite: WebsiteCardData,
  candidateWebsite: WebsiteCardData,
  browsingHistory: string[]
): number {
  let score = 0;

  // 分析用户偏好
  const historyWebsites = mockWebsites.filter(website => browsingHistory.includes(website.id));
  
  // 分类偏好 (40%权重)
  const categoryPreference = historyWebsites.filter(website => 
    website.category === candidateWebsite.category
  ).length / Math.max(historyWebsites.length, 1);
  score += categoryPreference * 0.4;

  // 标签偏好 (40%权重)
  const userTags = new Set(historyWebsites.flatMap(website => website.tags || []));
  const candidateTags = candidateWebsite.tags || [];
  const tagMatchCount = candidateTags.filter((tag: string) => userTags.has(tag)).length;
  const tagScore = candidateTags.length > 0 ? tagMatchCount / candidateTags.length : 0;
  score += tagScore * 0.4;

  // 质量指标 (20%权重)
  const qualityScore = (candidateWebsite.rating || 0) / 5;
  score += qualityScore * 0.2;

  return score;
}
