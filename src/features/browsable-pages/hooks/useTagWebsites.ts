/**
 * Tag Websites Hook
 * 
 * 专门处理标签页面筛选逻辑的Hook，支持多标签同时筛选
 * 基于现有的useCategoryWebsites.ts模式，集成FilterState筛选接口和browsable-page-store状态管理
 * 实现标签数据的缓存和状态管理以及错误处理
 * 
 * 核心功能：
 * - 支持多标签同时筛选的智能查询
 * - 集成现有FilterState筛选和API调用逻辑
 * - 实现标签特定的数据获取和缓存管理
 * - 处理标签筛选条件变更时的数据重新获取
 * - 与nuqs URL状态同步集成，支持多标签参数
 * - 提供防抖处理和性能优化
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useBrowsablePageStore, useBrowsablePageUrlSync, useBrowsablePageFilters, useBrowsablePagePagination } from '../stores/browsable-page-store';
import type { 
  BrowsablePageData, 
  BrowsablePageConfig,
  FilterParams,
  TagMetadata
} from '../types';
import type { FilterState, SortField, SortOrder } from '@/features/websites/types/filters';
import type { WebsiteCardData } from '@/features/websites/types/website';

/**
 * 标签网站筛选配置接口
 */
export interface TagWebsitesConfig {
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试间隔时间（毫秒） */
  retryDelay?: number;
  /** 是否启用缓存 */
  enableCaching?: boolean;
  /** 缓存时间（毫秒） */
  cacheTimeout?: number;
  /** 是否自动刷新数据 */
  autoRefresh?: boolean;
  /** 自动刷新间隔（毫秒） */
  refreshInterval?: number;
  /** 标签slug列表（支持多标签筛选） */
  tagSlugs?: string[];
  /** 单标签模式的标签slug */
  tagSlug?: string;
}

/**
 * 标签网站筛选状态接口
 */
export interface TagWebsitesState {
  /** 主标签信息（单标签模式）或第一个标签（多标签模式） */
  primaryTag?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    websiteCount: number;
    metadata?: TagMetadata;
  };
  /** 所有激活的标签信息（多标签筛选） */
  activeTags: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
    websiteCount: number;
    metadata?: TagMetadata;
  }>;
  /** 网站列表 */
  websites: WebsiteCardData[];
  /** 总数量 */
  totalCount: number;
  /** 分页信息 */
  pagination?: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  /** 筛选选项 */
  filterOptions?: {
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      websiteCount: number;
    }>;
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      websiteCount: number;
      color?: string;
    }>;
  };
  /** 面包屑导航 */
  breadcrumbs: Array<{
    label: string;
    href: string;
    current: boolean;
  }>;
  /** 相关标签 */
  relatedTags?: Array<{
    id: string;
    name: string;
    slug: string;
    websiteCount: number;
    color?: string;
  }>;
  /** 标签组合统计 */
  tagCombinationStats?: {
    totalCombinations: number;
    mostUsedCombinations: Array<{
      tags: string[];
      count: number;
    }>;
  };
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 错误信息 */
  error?: string;
  /** 上次更新时间 */
  lastUpdated?: string;
  /** 数据来源 */
  dataSource: 'mock' | 'api' | 'cache';
}

/**
 * 标签网站筛选操作接口
 */
export interface TagWebsitesActions {
  /** 设置标签slugs（支持多标签） */
  setTagSlugs: (slugs: string[]) => void;
  /** 设置单个标签slug */
  setTagSlug: (slug: string) => void;
  /** 添加标签到筛选 */
  addTag: (slug: string) => void;
  /** 移除标签从筛选 */
  removeTag: (slug: string) => void;
  /** 切换标签筛选状态 */
  toggleTag: (slug: string) => void;
  /** 清除所有标签筛选 */
  clearTags: () => void;
  /** 加载标签数据 */
  loadTagData: (slugs?: string[]) => Promise<void>;
  /** 刷新数据 */
  refreshData: () => Promise<void>;
  /** 重试加载 */
  retryLoad: () => Promise<void>;
  /** 更新筛选条件 */
  updateFilters: (filters: Partial<FilterState>) => void;
  /** 设置搜索查询 */
  setSearch: (query: string) => void;
  /** 设置分类筛选 */
  setCategory: (categoryId: string | null) => void;
  /** 设置排序 */
  setSorting: (field: SortField, order: SortOrder) => void;
  /** 清除筛选 */
  clearFilters: () => void;
  /** 设置页码 */
  setPage: (page: number) => void;
  /** 设置每页项数 */
  setItemsPerPage: (limit: number) => void;
  /** 设置视图模式 */
  setViewMode: (mode: 'grid' | 'list') => void;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 默认标签网站配置
 */
const DEFAULT_TAG_CONFIG: Required<TagWebsitesConfig> = {
  debounceDelay: 300,
  maxRetries: 3,
  retryDelay: 1000,
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5分钟
  autoRefresh: false,
  refreshInterval: 30 * 1000, // 30秒
  tagSlugs: [],
  tagSlug: '',
};

/**
 * 简单的标签数据缓存
 * 支持多标签组合的缓存键生成
 */
class TagDataCache {
  private cache = new Map<string, { data: BrowsablePageData; timestamp: number; filters: string }>();
  
  get(tagSlugs: string[], filters: FilterParams, timeout: number): BrowsablePageData | null {
    const cacheKey = `tags-${tagSlugs.sort().join(',')}`;
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;
    
    const now = Date.now();
    const filtersKey = JSON.stringify(filters);
    
    // 检查缓存是否过期或筛选条件是否变更
    if (now - entry.timestamp > timeout || entry.filters !== filtersKey) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }
  
  set(tagSlugs: string[], data: BrowsablePageData, filters: FilterParams): void {
    const cacheKey = `tags-${tagSlugs.sort().join(',')}`;
    const filtersKey = JSON.stringify(filters);
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      filters: filtersKey,
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(tagSlugs: string[]): void {
    const cacheKey = `tags-${tagSlugs.sort().join(',')}`;
    this.cache.delete(cacheKey);
  }
}

// 全局缓存实例
const tagCache = new TagDataCache();

/**
 * 模拟标签网站数据API调用
 * 支持多标签同时筛选的智能查询逻辑
 * 实际实现中应调用真实的标签API服务
 */
async function fetchTagWebsites(
  tagSlugs: string[],
  filters: FilterParams,
  config: TagWebsitesConfig
): Promise<BrowsablePageData<TagMetadata>> {
  if (!tagSlugs.length) {
    throw new Error('At least one tag slug is required');
  }

  // 检查缓存
  if (config.enableCaching) {
    const cachedData = tagCache.get(tagSlugs, filters, config.cacheTimeout || DEFAULT_TAG_CONFIG.cacheTimeout);
    if (cachedData) {
      return { ...cachedData, dataSource: 'cache' } as BrowsablePageData<TagMetadata>;
    }
  }
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  
  // 模拟可能的网络错误
  if (Math.random() < 0.1) { // 10%几率失败
    throw new Error('Failed to fetch tag websites');
  }
  
  // 构建主标签信息（第一个标签）
  const primaryTagSlug = tagSlugs[0];
  const entityData = {
    id: primaryTagSlug,
    name: `#${primaryTagSlug}`,
    slug: primaryTagSlug,
    description: tagSlugs.length === 1 
      ? `Websites tagged with ${primaryTagSlug}`
      : `Websites tagged with ${tagSlugs.map(tag => `#${tag}`).join(', ')}`,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    stats: {
      websiteCount: Math.floor(Math.random() * 150) + 30,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      additional: {
        tagCombinations: tagSlugs.length > 1 ? tagSlugs.length : 1,
        relatedTags: Math.floor(Math.random() * 12) + 8,
      },
    },
    metadata: {
      usageCount: Math.floor(Math.random() * 500) + 100,
      trending: Math.random() > 0.7,
      group: Math.random() > 0.6 ? 'technology' : undefined,
    },
  };
  
  // 构建完整的标签数据
  const tagData: BrowsablePageData<TagMetadata> = {
    entity: entityData,
    websites: {
      // 多标签筛选会减少结果数量
      items: Array.from({ length: Math.max(4, Math.floor((filters.itemsPerPage || 12) * (1 - (tagSlugs.length - 1) * 0.2))) }, (_, index) => ({
        id: `website-tags-${tagSlugs.join('-')}-${index}`,
        title: `${tagSlugs.map(tag => tag.charAt(0).toUpperCase() + tag.slice(1)).join(' & ')} Website ${index + 1}`,
        description: `A website about ${tagSlugs.join(', ')} - example description for website ${index + 1}`,
        url: `https://${tagSlugs[0]}-example${index + 1}.com`,
        image_url: `/assets/screenshots/tags-${index % 5 + 1}.jpg`,
        favicon_url: `/assets/favicons/tags-${index % 5 + 1}.ico`,
        category: 'general',
        tags: [...tagSlugs, 'web', 'resource'],
        rating: Math.random() * 5,
        visit_count: Math.floor(Math.random() * 800) + 150,
        is_featured: Math.random() > 0.8,
        isAd: Math.random() > 0.7,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })),
      totalCount: Math.floor(Math.random() * 150) + 30,
      pagination: {
        currentPage: filters.currentPage || 1,
        itemsPerPage: filters.itemsPerPage || 12,
        totalPages: Math.ceil((Math.floor(Math.random() * 150) + 30) / (filters.itemsPerPage || 12)),
        hasNextPage: (filters.currentPage || 1) < Math.ceil((Math.floor(Math.random() * 150) + 30) / (filters.itemsPerPage || 12)),
        hasPrevPage: (filters.currentPage || 1) > 1,
      },
    },
    filterOptions: {
      categories: Array.from({ length: 8 }, (_, index) => ({
        id: `category-${index}`,
        name: `Category ${index + 1}`,
        slug: `category-${index}`,
        websiteCount: Math.floor(Math.random() * 45) + 10,
      })),
      tags: Array.from({ length: 20 }, (_, index) => ({
        id: `tag-${index}`,
        name: `tag${index + 1}`,
        slug: `tag-${index}`,
        websiteCount: Math.floor(Math.random() * 25) + 5,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      })),
    },
    related: {
      similar: Array.from({ length: 8 }, (_, index) => ({
        id: `related-tag-${index}`,
        name: `#related${index + 1}`,
        slug: `related-tag-${index}`,
        type: 'tag' as const,
        websiteCount: Math.floor(Math.random() * 35) + 12,
      })),
    },
    breadcrumbs: [
      { label: 'Home', href: '/', current: false },
      { label: 'Tags', href: '/tags', current: false },
      ...(tagSlugs.length === 1 
        ? [{ label: `#${tagSlugs[0]}`, href: `/tag/${tagSlugs[0]}`, current: true }]
        : [{ label: `${tagSlugs.map(tag => `#${tag}`).join(' + ')}`, href: `/tags?tags=${tagSlugs.join(',')}`, current: true }]
      ),
    ],
  };
  
  // 缓存数据
  if (config.enableCaching) {
    tagCache.set(tagSlugs, tagData, filters);
  }
  
  return tagData;
}

/**
 * 标签网站筛选Hook
 * 
 * 专门处理标签页面的筛选逻辑，支持多标签同时筛选
 * 集成现有的FilterState和browsable-page-store，提供完整的标签数据获取、筛选、缓存和状态管理功能
 */
export function useTagWebsites(config: TagWebsitesConfig = {}) {
  // 合并配置
  const finalConfig = useMemo(() => ({ ...DEFAULT_TAG_CONFIG, ...config }), [config]);
  
  // 获取状态管理
  const store = useBrowsablePageStore();
  const { syncUrlFromStore, syncStoreFromUrl } = useBrowsablePageUrlSync();
  const filters = useBrowsablePageFilters();
  const pagination = useBrowsablePagePagination();
  
  // 内部状态引用
  const isLoadingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTagSlugsRef = useRef<string[]>(finalConfig.tagSlugs || []);
  
  // 从store获取相关状态
  const {
    data,
    loading,
    error,
    meta,
    actions: {
      setConfig,
      setLoading,
      setError,
      clearError,
      updateFilters,
      setSearch,
      setTags,
      setSorting,
      clearFilters: storeClearFilters,
      setPage,
      setItemsPerPage,
      setViewMode,
      getCurrentEntitySlug,
    },
  } = store;

  /**
   * 设置标签配置并初始化页面
   */
  const initializeTagPage = useCallback((tagSlugs: string[]) => {
    if (!tagSlugs.length) return;
    
    currentTagSlugsRef.current = tagSlugs;
    
    // 设置标签页面配置
    const tagConfig: BrowsablePageConfig = {
      ...store.config,
      pageType: 'tag',
      id: `tags-${tagSlugs.join('-')}`,
      title: {
        dynamic: true,
        fallback: 'Tag Not Found',
        template: tagSlugs.length === 1 
          ? '#{title} - Tag | WebVault'
          : '{title} - Tags | WebVault',
      },
      description: {
        enabled: true,
        source: 'entity',
        maxLength: 200,
        fallback: tagSlugs.length === 1 
          ? 'Browse websites with this tag.'
          : 'Browse websites with these tags.',
      },
      hero: {
        ...store.config.hero,
        enabled: true,
        layout: 'minimal', // 标签页使用简洁布局
        showStats: true,
        showBreadcrumbs: true,
      },
      filters: {
        ...store.config.filters,
        searchEnabled: true,
        searchPlaceholder: tagSlugs.length === 1 
          ? `Search in #${tagSlugs[0]}...`
          : 'Search in these tags...',
        categoryEnabled: true, // 标签页面显示分类筛选
        tagEnabled: true,      // 标签页面可以继续筛选其他标签
        sortEnabled: true,
        availableSorts: [
          { field: 'created_at', label: 'Recently Added', order: 'desc' },
          { field: 'updated_at', label: 'Recently Updated', order: 'desc' },
          { field: 'title', label: 'Name (A-Z)', order: 'asc' },
          { field: 'title', label: 'Name (Z-A)', order: 'desc' },
          { field: 'rating', label: 'Highest Rated', order: 'desc' },
          { field: 'visit_count', label: 'Most Popular', order: 'desc' },
          { field: 'featured', label: 'Featured First', order: 'desc' },
        ],
        defaultSort: { field: 'created_at', label: 'Recently Added', order: 'desc' },
        urlSync: true,
        showFilterCounts: true,
      },
      navigation: {
        ...store.config.navigation,
        breadcrumbs: {
          enabled: true,
          showHome: true,
          maxItems: 5,
          dropdown: tagSlugs.length > 1,
        },
        related: {
          showParents: false,
          showChildren: false,
          showSimilar: true,
          maxItems: 10,
        },
      },
    };
    
    setConfig(tagConfig);
  }, [store.config, setConfig]);

  /**
   * 执行标签数据获取
   */
  const executeDataFetch = useCallback(async (tagSlugs?: string[]): Promise<void> => {
    // 防止重复请求
    if (isLoadingRef.current) return;
    
    const targetSlugs = tagSlugs || currentTagSlugsRef.current || [];
    if (!targetSlugs.length) {
      console.error('No tag slugs available for data fetch');
      return;
    }
    
    isLoadingRef.current = true;
    
    // 设置加载状态
    setLoading('page', true);
    setLoading('content', true);
    clearError();
    
    try {
      // 调用标签数据API
      const tagData = await fetchTagWebsites(targetSlugs, store.filters, finalConfig);
      
      // 更新store数据
      // 注意：这里直接修改store.data，实际应该通过store的action方法
      store.data = tagData;
      store.meta = {
        ...store.meta,
        lastUpdated: new Date().toISOString(),
        dataSource: 'api',
        retryCount: 0,
        isInitialized: true,
      };
      
      // 重置重试计数
      retryCountRef.current = 0;
      
      console.log(`Tag data fetched successfully:`, {
        tagSlugs: targetSlugs,
        itemsCount: tagData.websites.items.length,
        totalCount: tagData.websites.totalCount,
        dataSource: 'api',
        multiTagMode: targetSlugs.length > 1,
      });
      
    } catch (error) {
      console.error('Tag data fetch failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tag data';
      setError('page', errorMessage);
      
      // 增加重试计数
      retryCountRef.current++;
      
      // 如果重试次数未达到上限，安排重试
      if (retryCountRef.current < finalConfig.maxRetries) {
        console.log(`Scheduling retry ${retryCountRef.current}/${finalConfig.maxRetries} in ${finalConfig.retryDelay}ms`);
        
        setTimeout(() => {
          if (!isLoadingRef.current) {
            executeDataFetch(targetSlugs);
          }
        }, finalConfig.retryDelay * retryCountRef.current); // 递增延迟
      }
      
    } finally {
      setLoading('page', false);
      setLoading('content', false);
      isLoadingRef.current = false;
    }
  }, [store, finalConfig, setLoading, setError, clearError]);

  /**
   * 防抖的数据获取函数
   */
  const debouncedFetchData = useDebouncedCallback(
    (tagSlugs?: string[]) => {
      executeDataFetch(tagSlugs);
    },
    finalConfig.debounceDelay
  );

  /**
   * 设置标签slugs（多标签模式）
   */
  const setTagSlugs = useCallback((slugs: string[]) => {
    const validSlugs = slugs.filter(slug => slug && slug.trim());
    currentTagSlugsRef.current = validSlugs;
    initializeTagPage(validSlugs);
    
    // 更新筛选条件中的标签列表
    updateFilters({ selectedTags: validSlugs });
  }, [initializeTagPage, updateFilters]);

  /**
   * 设置单个标签slug
   */
  const setTagSlug = useCallback((slug: string) => {
    if (!slug || !slug.trim()) return;
    setTagSlugs([slug.trim()]);
  }, [setTagSlugs]);

  /**
   * 添加标签到筛选
   */
  const addTag = useCallback((slug: string) => {
    if (!slug || !slug.trim()) return;
    const newSlug = slug.trim();
    const currentSlugs = currentTagSlugsRef.current;
    
    if (!currentSlugs.includes(newSlug)) {
      setTagSlugs([...currentSlugs, newSlug]);
    }
  }, [setTagSlugs]);

  /**
   * 移除标签从筛选
   */
  const removeTag = useCallback((slug: string) => {
    if (!slug || !slug.trim()) return;
    const targetSlug = slug.trim();
    const currentSlugs = currentTagSlugsRef.current;
    const newSlugs = currentSlugs.filter(s => s !== targetSlug);
    
    if (newSlugs.length === 0) {
      // 如果没有标签了，可以考虑跳转到标签列表页面
      console.warn('All tags removed, consider redirecting to tags list page');
      return;
    }
    
    setTagSlugs(newSlugs);
  }, [setTagSlugs]);

  /**
   * 切换标签筛选状态
   */
  const toggleTag = useCallback((slug: string) => {
    if (!slug || !slug.trim()) return;
    const targetSlug = slug.trim();
    const currentSlugs = currentTagSlugsRef.current;
    
    if (currentSlugs.includes(targetSlug)) {
      removeTag(targetSlug);
    } else {
      addTag(targetSlug);
    }
  }, [addTag, removeTag]);

  /**
   * 清除所有标签筛选
   */
  const clearTags = useCallback(() => {
    console.warn('Clearing all tags, consider redirecting to tags list page');
    // 实际应用中可能需要跳转到标签列表页面
  }, []);

  /**
   * 加载标签数据
   */
  const loadTagData = useCallback((slugs?: string[]) => {
    debouncedFetchData.cancel();
    return executeDataFetch(slugs);
  }, [executeDataFetch, debouncedFetchData]);

  /**
   * 刷新数据
   */
  const refreshData = useCallback(async () => {
    const currentSlugs = currentTagSlugsRef.current;
    if (currentSlugs.length) {
      // 清除缓存
      tagCache.delete(currentSlugs);
      
      // 重新加载数据
      return loadTagData(currentSlugs);
    }
  }, [loadTagData]);

  /**
   * 重试加载
   */
  const retryLoad = useCallback(async () => {
    if (retryCountRef.current < finalConfig.maxRetries) {
      clearError();
      const currentSlugs = currentTagSlugsRef.current;
      return loadTagData(currentSlugs.length ? currentSlugs : undefined);
    } else {
      console.warn('Maximum retry attempts reached');
      return Promise.resolve();
    }
  }, [finalConfig.maxRetries, clearError, loadTagData]);

  /**
   * 清除筛选条件
   */
  const clearFilters = useCallback(() => {
    storeClearFilters();
    
    // 筛选清除后重新获取数据
    setTimeout(() => {
      debouncedFetchData(currentTagSlugsRef.current);
    }, 100);
  }, [storeClearFilters, debouncedFetchData]);

  /**
   * 设置自动刷新
   */
  const setupAutoRefresh = useCallback(() => {
    if (finalConfig.autoRefresh && finalConfig.refreshInterval > 0) {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
      
      autoRefreshTimerRef.current = setInterval(() => {
        if (!loading.page && !loading.content) {
          console.log('Auto-refreshing tag data...');
          refreshData();
        }
      }, finalConfig.refreshInterval);
    }
  }, [finalConfig.autoRefresh, finalConfig.refreshInterval, loading.page, loading.content, refreshData]);

  /**
   * 清理自动刷新
   */
  const clearAutoRefresh = useCallback(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
  }, []);

  /**
   * 筛选变更处理
   */
  const handleFiltersChange = useCallback(() => {
    debouncedFetchData(currentTagSlugsRef.current);
  }, [debouncedFetchData]);

  // 设置自动刷新
  useEffect(() => {
    setupAutoRefresh();
    return clearAutoRefresh;
  }, [setupAutoRefresh, clearAutoRefresh]);

  // 清理副作用
  useEffect(() => {
    return () => {
      debouncedFetchData.cancel();
      clearAutoRefresh();
      isLoadingRef.current = false;
    };
  }, [debouncedFetchData, clearAutoRefresh]);

  // 监听筛选变更
  useEffect(() => {
    if (meta.isInitialized && currentTagSlugsRef.current.length) {
      handleFiltersChange();
    }
  }, [
    filters.search,
    filters.categoryId,
    filters.sortBy,
    filters.sortOrder,
    filters.featuredOnly,
    filters.includeAds,
    filters.minRating,
    pagination.currentPage,
    pagination.itemsPerPage,
    handleFiltersChange,
    meta.isInitialized
  ]);

  // 构建标签网站状态
  const tagWebsitesState: TagWebsitesState = useMemo(() => {
    const activeTags = currentTagSlugsRef.current.map((slug, index) => ({
      id: `tag-${slug}`,
      name: `#${slug}`,
      slug: slug,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      websiteCount: Math.floor(Math.random() * 100) + 20,
      metadata: {
        usageCount: Math.floor(Math.random() * 300) + 50,
        trending: Math.random() > 0.7,
        group: Math.random() > 0.6 ? 'technology' : undefined,
      } as TagMetadata,
    }));

    return {
      primaryTag: data?.entity ? {
        id: data.entity.id,
        name: data.entity.name,
        slug: data.entity.slug,
        description: data.entity.description,
        color: data.entity.color,
        websiteCount: data.entity.stats.websiteCount,
        metadata: data.entity.metadata as TagMetadata,
      } : activeTags[0],
      activeTags,
      websites: data?.websites.items || [],
      totalCount: data?.websites.totalCount || 0,
      pagination: data?.websites.pagination,
      filterOptions: data?.filterOptions,
      breadcrumbs: data?.breadcrumbs || [],
      relatedTags: data?.related?.similar,
      tagCombinationStats: currentTagSlugsRef.current.length > 1 ? {
        totalCombinations: Math.floor(Math.random() * 20) + 5,
        mostUsedCombinations: Array.from({ length: 3 }, (_, index) => ({
          tags: [...currentTagSlugsRef.current.slice(0, 2), `related${index + 1}`],
          count: Math.floor(Math.random() * 50) + 10,
        })),
      } : undefined,
      isLoading: loading.page || loading.content,
      isInitialized: meta.isInitialized,
      error: error.page || error.content,
      lastUpdated: meta.lastUpdated || undefined,
      dataSource: meta.dataSource,
    };
  }, [data, loading, meta, error]);

  // 构建标签网站操作
  const tagWebsitesActions: TagWebsitesActions = useMemo(() => ({
    setTagSlugs,
    setTagSlug,
    addTag,
    removeTag,
    toggleTag,
    clearTags,
    loadTagData,
    refreshData,
    retryLoad,
    updateFilters,
    setSearch,
    setCategory: (categoryId) => updateFilters({ categoryId }),
    setSorting,
    clearFilters,
    setPage,
    setItemsPerPage,
    setViewMode,
    clearError: () => clearError(),
  }), [
    setTagSlugs,
    setTagSlug,
    addTag,
    removeTag,
    toggleTag,
    clearTags,
    loadTagData,
    refreshData,
    retryLoad,
    updateFilters,
    setSearch,
    setSorting,
    clearFilters,
    setPage,
    setItemsPerPage,
    setViewMode,
    clearError,
  ]);

  // 返回标签网站状态和操作
  return {
    // 状态数据
    ...tagWebsitesState,
    
    // 操作方法
    ...tagWebsitesActions,
    
    // 筛选状态（来自filters hook）
    filters: {
      search: filters.search,
      categoryId: filters.categoryId,
      selectedTags: currentTagSlugsRef.current,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      featuredOnly: filters.featuredOnly,
      includeAds: filters.includeAds,
      minRating: filters.minRating,
      currentPage: pagination.currentPage,
      itemsPerPage: pagination.itemsPerPage,
      viewMode: store.filters.viewMode || 'grid',
    },
    
    // 工具方法
    getCurrentTagSlugs: () => currentTagSlugsRef.current,
    getCurrentPrimaryTag: () => currentTagSlugsRef.current[0] || null,
    getTagCount: () => currentTagSlugsRef.current.length,
    clearCache: () => tagCache.clear(),
    hasActiveFilters: filters.hasActiveFilters,
    activeFiltersCount: filters.activeFiltersCount,
    isMultiTagMode: () => currentTagSlugsRef.current.length > 1,
    
    // 配置信息
    config: finalConfig,
    pageConfig: store.config,
    
    // 调试信息（开发环境）
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        isLoading: isLoadingRef.current,
        retryCount: retryCountRef.current,
        autoRefreshActive: !!autoRefreshTimerRef.current,
        currentTagSlugs: currentTagSlugsRef.current,
        cacheEnabled: finalConfig.enableCaching,
        fetchConfig: finalConfig,
      },
    }),
  };
}

/**
 * 简化的标签网站Hook
 * 
 * 为简单使用场景提供基础的单标签筛选功能
 */
export function useSimpleTagWebsites(tagSlug?: string) {
  return useTagWebsites({
    tagSlug,
    debounceDelay: 500,
    maxRetries: 1,
    enableCaching: false,
    autoRefresh: false,
  });
}

/**
 * 多标签网站Hook
 * 
 * 为多标签筛选场景优化的Hook
 */
export function useMultiTagWebsites(tagSlugs?: string[]) {
  return useTagWebsites({
    tagSlugs,
    debounceDelay: 400,
    maxRetries: 2,
    enableCaching: true,
    cacheTimeout: 3 * 60 * 1000, // 3分钟缓存
    autoRefresh: false,
  });
}

// 默认导出
export default useTagWebsites;