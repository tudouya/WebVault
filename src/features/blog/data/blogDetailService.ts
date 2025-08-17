/**
 * Blog Detail Data Service
 * 
 * 提供博客详情页面的数据获取和处理服务
 * 包含博客详情获取、相关文章推荐、错误处理和数据验证功能
 */

import { BlogDetailData, BlogCardData, BlogDetailDataUtils, BlogCategoryUtils } from '../types';
import { mockBlogDetails } from './mockBlogs';

/**
 * 相关文章推荐策略类型
 */
export type RelatedPostsStrategy = 'category' | 'tags' | 'content' | 'mixed';

/**
 * 相关文章推荐选项
 */
export interface RelatedPostsOptions {
  /** 推荐策略 */
  strategy?: RelatedPostsStrategy;
  /** 推荐数量限制 */
  limit?: number;
  /** 排除当前文章 */
  excludeCurrentPost?: boolean;
  /** 最小相似度阈值 */
  minSimilarityScore?: number;
}

/**
 * 博客详情服务错误类型
 */
export class BlogDetailServiceError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'FETCH_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'BlogDetailServiceError';
  }
}

/**
 * 博客详情数据服务类
 * 
 * 提供博客详情获取、相关文章推荐等核心功能
 * 包含完整的错误处理和数据验证逻辑
 */
export class BlogDetailService {
  private static instance: BlogDetailService;
  private cache = new Map<string, BlogDetailData>();
  private relatedPostsCache = new Map<string, BlogCardData[]>();
  
  /**
   * 获取服务单例实例
   */
  public static getInstance(): BlogDetailService {
    if (!BlogDetailService.instance) {
      BlogDetailService.instance = new BlogDetailService();
    }
    return BlogDetailService.instance;
  }

  /**
   * 根据slug获取博客详情数据
   * 
   * @param slug - 博客文章的URL slug
   * @returns Promise<BlogDetailData> - 博客详情数据
   * @throws BlogDetailServiceError - 当文章不存在或数据验证失败时
   */
  async getBlogBySlug(slug: string): Promise<BlogDetailData> {
    try {
      // 输入验证
      if (!slug || typeof slug !== 'string') {
        throw new BlogDetailServiceError(
          'Invalid slug parameter',
          'VALIDATION_ERROR',
          { providedSlug: slug }
        );
      }

      const normalizedSlug = slug.trim().toLowerCase();

      // 检查缓存
      if (this.cache.has(normalizedSlug)) {
        const cachedData = this.cache.get(normalizedSlug)!;
        return this.validateAndCloneBlogData(cachedData);
      }

      // 模拟数据获取延迟（实际项目中这里会是API调用）
      await this.simulateNetworkDelay();

      // 从Mock数据中查找
      const blogDetail = mockBlogDetails.find(
        blog => blog.slug.toLowerCase() === normalizedSlug
      );

      if (!blogDetail) {
        throw new BlogDetailServiceError(
          `Blog post with slug "${slug}" not found`,
          'NOT_FOUND',
          { requestedSlug: slug, normalizedSlug }
        );
      }

      // 验证数据完整性
      const validationResult = BlogDetailDataUtils.validateBlogDetailData(blogDetail);
      if (!validationResult.isValid) {
        throw new BlogDetailServiceError(
          'Blog data validation failed',
          'VALIDATION_ERROR',
          { 
            slug: slug,
            errors: validationResult.errors,
            blogData: blogDetail
          }
        );
      }

      // 深拷贝防止意外修改
      const clonedBlogDetail = this.deepCloneBlogData(blogDetail);

      // 缓存数据（实际项目中可以加入TTL）
      this.cache.set(normalizedSlug, clonedBlogDetail);

      return clonedBlogDetail;

    } catch (error) {
      if (error instanceof BlogDetailServiceError) {
        throw error;
      }

      // 包装未预期的错误
      throw new BlogDetailServiceError(
        `Failed to fetch blog detail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FETCH_ERROR',
        { originalError: error, slug }
      );
    }
  }

  /**
   * 获取相关文章推荐
   * 
   * @param currentBlogId - 当前博客文章ID
   * @param options - 推荐选项配置
   * @returns Promise<BlogCardData[]> - 相关文章列表
   */
  async getRelatedPosts(
    currentBlogId: string,
    options: RelatedPostsOptions = {}
  ): Promise<BlogCardData[]> {
    try {
      const {
        strategy = 'mixed',
        limit = 2,
        excludeCurrentPost = true,
        minSimilarityScore = 0.1
      } = options;

      // 输入验证
      if (!currentBlogId || typeof currentBlogId !== 'string') {
        throw new BlogDetailServiceError(
          'Invalid currentBlogId parameter',
          'VALIDATION_ERROR',
          { providedId: currentBlogId }
        );
      }

      if (limit <= 0 || limit > 10) {
        throw new BlogDetailServiceError(
          'Limit must be between 1 and 10',
          'VALIDATION_ERROR',
          { providedLimit: limit }
        );
      }

      // 生成缓存键
      const cacheKey = `${currentBlogId}-${strategy}-${limit}-${excludeCurrentPost}`;
      
      // 检查缓存
      if (this.relatedPostsCache.has(cacheKey)) {
        return this.relatedPostsCache.get(cacheKey)!.slice(0, limit);
      }

      // 模拟网络延迟
      await this.simulateNetworkDelay(100);

      // 获取当前文章详情
      const currentBlog = mockBlogDetails.find(blog => blog.id === currentBlogId);
      if (!currentBlog) {
        throw new BlogDetailServiceError(
          `Current blog with ID "${currentBlogId}" not found`,
          'NOT_FOUND',
          { requestedId: currentBlogId }
        );
      }

      // 获取候选文章列表
      let candidateBlogs = excludeCurrentPost 
        ? mockBlogDetails.filter(blog => blog.id !== currentBlogId)
        : mockBlogDetails;

      // 根据策略计算相关性分数
      const scoredPosts = candidateBlogs.map(blog => ({
        blog,
        score: this.calculateRelatednessScore(currentBlog, blog, strategy)
      }));

      // 过滤低分文章并排序
      const filteredAndSorted = scoredPosts
        .filter(item => item.score >= minSimilarityScore)
        .sort((a, b) => b.score - a.score);

      // 转换为卡片数据
      const relatedPosts = filteredAndSorted
        .slice(0, limit)
        .map(item => BlogDetailDataUtils.extractCardData(item.blog));

      // 缓存结果
      this.relatedPostsCache.set(cacheKey, relatedPosts);

      return relatedPosts;

    } catch (error) {
      if (error instanceof BlogDetailServiceError) {
        throw error;
      }

      throw new BlogDetailServiceError(
        `Failed to get related posts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FETCH_ERROR',
        { originalError: error, currentBlogId, options }
      );
    }
  }

  /**
   * 预加载博客详情数据
   * 
   * @param slugs - 要预加载的slug数组
   * @returns Promise<void>
   */
  async preloadBlogDetails(slugs: string[]): Promise<void> {
    const preloadPromises = slugs.map(slug => 
      this.getBlogBySlug(slug).catch(error => {
        console.warn(`Failed to preload blog with slug "${slug}":`, error);
        return null;
      })
    );

    await Promise.all(preloadPromises);
  }

  /**
   * 清除缓存
   * 
   * @param type - 缓存类型，'all' | 'blogs' | 'related'
   */
  clearCache(type: 'all' | 'blogs' | 'related' = 'all'): void {
    if (type === 'all' || type === 'blogs') {
      this.cache.clear();
    }
    if (type === 'all' || type === 'related') {
      this.relatedPostsCache.clear();
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      blogsCached: this.cache.size,
      relatedPostsCached: this.relatedPostsCache.size,
      totalCacheEntries: this.cache.size + this.relatedPostsCache.size
    };
  }

  /**
   * 计算两篇文章的相关性分数
   */
  private calculateRelatednessScore(
    currentBlog: BlogDetailData,
    candidateBlog: BlogDetailData,
    strategy: RelatedPostsStrategy
  ): number {
    switch (strategy) {
      case 'category':
        return this.calculateCategoryScore(currentBlog, candidateBlog);
      
      case 'tags':
        return this.calculateTagsScore(currentBlog, candidateBlog);
      
      case 'content':
        return this.calculateContentScore(currentBlog, candidateBlog);
      
      case 'mixed':
      default:
        return this.calculateMixedScore(currentBlog, candidateBlog);
    }
  }

  /**
   * 基于分类的相关性分数
   */
  private calculateCategoryScore(
    currentBlog: BlogDetailData,
    candidateBlog: BlogDetailData
  ): number {
    if (currentBlog.category === candidateBlog.category) {
      return 1.0;
    }

    // 检查是否为相关分类
    // 确保分类是有效的 BlogCategoryType
    if (BlogCategoryUtils.isValidCategory(currentBlog.category) && 
        BlogCategoryUtils.isValidCategory(candidateBlog.category)) {
      const categoryRelations = BlogCategoryUtils.getRelatedCategories(currentBlog.category as any);
      if (categoryRelations.includes(candidateBlog.category as any)) {
        return 0.6;
      }
    }

    return 0.1;
  }

  /**
   * 基于标签的相关性分数
   */
  private calculateTagsScore(
    currentBlog: BlogDetailData,
    candidateBlog: BlogDetailData
  ): number {
    const currentTags = new Set(currentBlog.tags?.map(tag => tag.toLowerCase()) || []);
    const candidateTags = new Set(candidateBlog.tags?.map(tag => tag.toLowerCase()) || []);

    if (currentTags.size === 0 && candidateTags.size === 0) {
      return 0.1;
    }

    // 计算Jaccard相似度
    const intersection = new Set([...currentTags].filter(tag => candidateTags.has(tag)));
    const union = new Set([...currentTags, ...candidateTags]);

    return intersection.size / union.size;
  }

  /**
   * 基于内容的相关性分数
   */
  private calculateContentScore(
    currentBlog: BlogDetailData,
    candidateBlog: BlogDetailData
  ): number {
    // 简化的内容相似度计算（实际项目中可使用更高级的NLP技术）
    const currentContent = `${currentBlog.title} ${currentBlog.excerpt}`.toLowerCase();
    const candidateContent = `${candidateBlog.title} ${candidateBlog.excerpt}`.toLowerCase();

    // 计算关键词重叠
    const currentWords = new Set(currentContent.split(/\s+/).filter(word => word.length > 3));
    const candidateWords = new Set(candidateContent.split(/\s+/).filter(word => word.length > 3));

    if (currentWords.size === 0 && candidateWords.size === 0) {
      return 0.1;
    }

    const intersection = new Set([...currentWords].filter(word => candidateWords.has(word)));
    const union = new Set([...currentWords, ...candidateWords]);

    return intersection.size / union.size;
  }

  /**
   * 混合策略的相关性分数
   */
  private calculateMixedScore(
    currentBlog: BlogDetailData,
    candidateBlog: BlogDetailData
  ): number {
    const categoryScore = this.calculateCategoryScore(currentBlog, candidateBlog);
    const tagsScore = this.calculateTagsScore(currentBlog, candidateBlog);
    const contentScore = this.calculateContentScore(currentBlog, candidateBlog);

    // 加权平均
    return (categoryScore * 0.4) + (tagsScore * 0.4) + (contentScore * 0.2);
  }

  /**
   * 验证并克隆博客数据
   */
  private validateAndCloneBlogData(data: BlogDetailData): BlogDetailData {
    const validationResult = BlogDetailDataUtils.validateBlogDetailData(data);
    if (!validationResult.isValid) {
      throw new BlogDetailServiceError(
        'Cached blog data validation failed',
        'VALIDATION_ERROR',
        { errors: validationResult.errors }
      );
    }

    return this.deepCloneBlogData(data);
  }

  /**
   * 深拷贝博客数据
   */
  private deepCloneBlogData(data: BlogDetailData): BlogDetailData {
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
export const blogDetailService = BlogDetailService.getInstance();

/**
 * 根据slug获取博客详情数据的便捷函数
 * 
 * @param slug - 博客文章的URL slug
 * @returns Promise<BlogDetailData> - 博客详情数据
 */
export async function getBlogBySlug(slug: string): Promise<BlogDetailData> {
  return blogDetailService.getBlogBySlug(slug);
}

/**
 * 获取相关文章推荐的便捷函数
 * 
 * @param currentBlogId - 当前博客文章ID
 * @param options - 推荐选项配置
 * @returns Promise<BlogCardData[]> - 相关文章列表
 */
export async function getRelatedPosts(
  currentBlogId: string,
  options?: RelatedPostsOptions
): Promise<BlogCardData[]> {
  return blogDetailService.getRelatedPosts(currentBlogId, options);
}

/**
 * 批量获取博客详情的工具函数
 * 
 * @param slugs - slug数组
 * @returns Promise<BlogDetailData[]> - 博客详情数组（不包含获取失败的）
 */
export async function getBlogsBySlugsBatch(slugs: string[]): Promise<BlogDetailData[]> {
  const results = await Promise.allSettled(
    slugs.map(slug => getBlogBySlug(slug))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<BlogDetailData> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

/**
   * 获取博客推荐的智能推荐函数
   * 
   * 基于用户阅读历史和文章特征提供个性化推荐
   * 
   * @param currentBlogId - 当前博客ID
   * @param userReadHistory - 用户阅读历史（可选）
   * @param limit - 推荐数量限制
   * @returns Promise<BlogCardData[]> - 智能推荐文章列表
   */
export async function getSmartRecommendations(
  currentBlogId: string,
  userReadHistory?: string[],
  limit: number = 3
): Promise<BlogCardData[]> {
  try {
    // 如果没有用户历史，使用混合策略
    if (!userReadHistory || userReadHistory.length === 0) {
      return getRelatedPosts(currentBlogId, { 
        strategy: 'mixed', 
        limit,
        minSimilarityScore: 0.2 
      });
    }

    // 基于用户历史的个性化推荐
    const currentBlog = mockBlogDetails.find(blog => blog.id === currentBlogId);
    if (!currentBlog) {
      throw new BlogDetailServiceError(
        `Blog with ID "${currentBlogId}" not found`,
        'NOT_FOUND'
      );
    }

    // 分析用户阅读偏好
    const userPreferences = (blogDetailService as any)['analyzeUserPreferences'](userReadHistory);
    
    // 获取候选文章
    const candidates = mockBlogDetails.filter(blog => 
      blog.id !== currentBlogId && !userReadHistory.includes(blog.id)
    );

    // 计算个性化相关性分数
    const scoredPosts = candidates.map(blog => ({
      blog,
      score: (blogDetailService as any)['calculatePersonalizedScore'](currentBlog, blog, userPreferences)
    }));

    // 返回得分最高的文章
    const recommendations = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => BlogDetailDataUtils.extractCardData(item.blog));

    return recommendations;

  } catch (error) {
    console.warn('Smart recommendations failed, falling back to standard related posts:', error);
    return getRelatedPosts(currentBlogId, { limit });
  }
}

// 为BlogDetailService类添加私有方法（通过原型扩展）
declare module './blogDetailService' {
  namespace BlogDetailService {
    interface BlogDetailService {
      analyzeUserPreferences(readHistory: string[]): UserPreferences;
      calculatePersonalizedScore(
        currentBlog: BlogDetailData, 
        candidateBlog: BlogDetailData, 
        preferences: UserPreferences
      ): number;
    }
  }
}

interface UserPreferences {
  favoriteCategories: Map<string, number>;
  favoriteTags: Map<string, number>;
  averageReadingTime: number;
  contentComplexityPreference: number;
}

// 扩展BlogDetailService原型
Object.assign(BlogDetailService.prototype, {
  /**
   * 分析用户阅读偏好
   */
  analyzeUserPreferences(readHistory: string[]): UserPreferences {
    const historyBlogs = mockBlogDetails.filter(blog => readHistory.includes(blog.id));
    
    const categoryCount = new Map<string, number>();
    const tagCount = new Map<string, number>();
    let totalReadingTime = 0;
    let totalComplexity = 0;

    historyBlogs.forEach(blog => {
      // 统计分类偏好
      categoryCount.set(blog.category, (categoryCount.get(blog.category) || 0) + 1);
      
      // 统计标签偏好
      blog.tags?.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
      
      // 累计阅读时间
      totalReadingTime += blog.readingTime;
      
      // 计算内容复杂度（基于阅读时间和内容长度）
      totalComplexity += blog.readingTime / 10; // 简化的复杂度计算
    });

    return {
      favoriteCategories: categoryCount,
      favoriteTags: tagCount,
      averageReadingTime: historyBlogs.length > 0 ? totalReadingTime / historyBlogs.length : 8,
      contentComplexityPreference: historyBlogs.length > 0 ? totalComplexity / historyBlogs.length : 0.8
    };
  },

  /**
   * 计算个性化相关性分数
   */
  calculatePersonalizedScore(
    currentBlog: BlogDetailData,
    candidateBlog: BlogDetailData,
    preferences: UserPreferences
  ): number {
    let score = 0;

    // 基于分类偏好（40%权重）
    const categoryPreference = preferences.favoriteCategories.get(candidateBlog.category) || 0;
    const categoryScore = Math.min(categoryPreference / 5, 1); // 归一化到0-1
    score += categoryScore * 0.4;

    // 基于标签偏好（30%权重）
    const tagScore = candidateBlog.tags?.reduce((sum, tag) => {
      const tagPreference = preferences.favoriteTags.get(tag) || 0;
      return sum + Math.min(tagPreference / 3, 1);
    }, 0) || 0;
    const normalizedTagScore = Math.min(tagScore / (candidateBlog.tags?.length || 1), 1);
    score += normalizedTagScore * 0.3;

    // 基于阅读时间偏好（20%权重）
    const readingTimeDiff = Math.abs(candidateBlog.readingTime - preferences.averageReadingTime);
    const readingTimeScore = Math.max(0, 1 - readingTimeDiff / 20); // 差异越小分数越高
    score += readingTimeScore * 0.2;

    // 基于内容复杂度偏好（10%权重）
    const contentComplexity = candidateBlog.readingTime / 10;
    const complexityDiff = Math.abs(contentComplexity - preferences.contentComplexityPreference);
    const complexityScore = Math.max(0, 1 - complexityDiff);
    score += complexityScore * 0.1;

    return score;
  }
});

/**
 * 服务类和错误类已在上方直接导出
 * BlogDetailService (line 50), BlogDetailServiceError (line 33)
 */

/**
 * 类型定义已在上方直接导出
 * RelatedPostsOptions (line 19), RelatedPostsStrategy (line 14)
 */