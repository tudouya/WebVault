/**
 * Category Websites Hook
 * 
 * 专门处理分类页面筛选逻辑的Hook，基于现有的useWebsiteSearch.ts和useBrowsablePageData.ts模式
 * 集成FilterState筛选接口和browsable-page-store状态管理，实现分类数据的缓存和状态管理
 * 
 * 核心功能：
 * - 集成现有FilterState筛选和API调用逻辑
 * - 实现分类特定的数据获取和缓存管理
 * - 处理筛选条件变更时的数据重新获取
 * - 与nuqs URL状态同步集成
 * - 提供防抖处理和性能优化
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useBrowsablePageStore, useBrowsablePageUrlSync, useBrowsablePageFilters, useBrowsablePagePagination } from '../stores/browsable-page-store';
import type { 
  BrowsablePageData, 
  BrowsablePageConfig,
  FilterParams,
  CategoryMetadata
} from '../types';
import type { FilterState, SortField, SortOrder } from '@/features/websites/types/filters';
import type { WebsiteCardData } from '@/features/websites/types/website';

/**
 * 分类网站筛选配置接口
 */
export interface CategoryWebsitesConfig {
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
  /** 分类slug */
  categorySlug?: string;
}

/**
 * 分类网站筛选状态接口
 */
export interface CategoryWebsitesState {
  /** 分类信息 */
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    websiteCount: number;
    metadata?: CategoryMetadata;
  };
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
  /** 相关分类 */
  relatedCategories?: Array<{
    id: string;
    name: string;
    slug: string;
    websiteCount: number;
  }>;
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
 * 分类网站筛选操作接口
 */
export interface CategoryWebsitesActions {
  /** 设置分类slug */
  setCategorySlug: (slug: string) => void;
  /** 加载分类数据 */
  loadCategoryData: (slug?: string) => Promise<void>;
  /** 刷新数据 */
  refreshData: () => Promise<void>;
  /** 重试加载 */
  retryLoad: () => Promise<void>;
  /** 更新筛选条件 */
  updateFilters: (filters: Partial<FilterState>) => void;
  /** 设置搜索查询 */
  setSearch: (query: string) => void;
  /** 设置标签筛选 */
  setTags: (tags: string[]) => void;
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
 * 默认分类网站配置
 */
const DEFAULT_CATEGORY_CONFIG: Required<CategoryWebsitesConfig> = {
  debounceDelay: 300,
  maxRetries: 3,
  retryDelay: 1000,
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5分钟
  autoRefresh: false,
  refreshInterval: 30 * 1000, // 30秒
  categorySlug: '',
};

/**
 * 简单的分类数据缓存
 */
class CategoryDataCache {
  private cache = new Map<string, { data: BrowsablePageData; timestamp: number; filters: string }>();
  
  get(categorySlug: string, filters: FilterParams, timeout: number): BrowsablePageData | null {
    const cacheKey = `category-${categorySlug}`;
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
  
  set(categorySlug: string, data: BrowsablePageData, filters: FilterParams): void {
    const cacheKey = `category-${categorySlug}`;
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
  
  delete(categorySlug: string): void {
    const cacheKey = `category-${categorySlug}`;
    this.cache.delete(cacheKey);
  }
}

// 全局缓存实例
const categoryCache = new CategoryDataCache();

/**
 * 模拟分类网站数据API调用
 * 实际实现中应调用真实的分类API服务
 */
async function fetchCategoryWebsites(
  categorySlug: string,
  filters: FilterParams,
  config: CategoryWebsitesConfig
): Promise<BrowsablePageData<CategoryMetadata>> {
  // 检查缓存
  if (config.enableCaching) {
    const cachedData = categoryCache.get(categorySlug, filters, config.cacheTimeout || DEFAULT_CATEGORY_CONFIG.cacheTimeout);
    if (cachedData) {
      return { ...cachedData, dataSource: 'cache' } as BrowsablePageData<CategoryMetadata>;
    }
  }
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  
  // 模拟可能的网络错误
  if (Math.random() < 0.1) { // 10%几率失败
    throw new Error('Failed to fetch category websites');
  }
  
  // 先构建实体信息
  const entityData = {
    id: categorySlug,
    name: `${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}`,
    slug: categorySlug,
    description: `Websites in the ${categorySlug} category`,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    stats: {
      websiteCount: Math.floor(Math.random() * 200) + 50,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      additional: {
        subcategories: Math.floor(Math.random() * 10) + 3,
      },
    },
    metadata: {
      parentId: Math.random() > 0.5 ? 'parent-category' : undefined,
      level: Math.floor(Math.random() * 3) + 1,
      sortOrder: Math.floor(Math.random() * 100),
      isFeatured: Math.random() > 0.8,
    },
  };
  
  // 构建完整的分类数据
  const categoryData: BrowsablePageData<CategoryMetadata> = {
    entity: entityData,
    websites: {
      items: Array.from({ length: filters.itemsPerPage || 12 }, (_, index) => ({
        id: `website-${categorySlug}-${index}`,
        title: `${categorySlug} Website ${index + 1}`,
        description: `A great website about ${categorySlug} - example description for website ${index + 1}`,
        url: `https://${categorySlug}-example${index + 1}.com`,
        image_url: `/assets/screenshots/${categorySlug}-${index % 5 + 1}.jpg`,
        favicon_url: `/assets/favicons/${categorySlug}-${index % 5 + 1}.ico`,
        category: categorySlug,
        tags: [categorySlug, 'web'],
        rating: Math.random() * 5,
        visit_count: Math.floor(Math.random() * 1000) + 100,
        is_featured: Math.random() > 0.8,
        isAd: Math.random() > 0.7,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })),
      totalCount: Math.floor(Math.random() * 200) + 50,
      pagination: {
        currentPage: filters.currentPage || 1,
        itemsPerPage: filters.itemsPerPage || 12,
        totalPages: Math.ceil((Math.floor(Math.random() * 200) + 50) / (filters.itemsPerPage || 12)),
        hasNextPage: (filters.currentPage || 1) < Math.ceil((Math.floor(Math.random() * 200) + 50) / (filters.itemsPerPage || 12)),
        hasPrevPage: (filters.currentPage || 1) > 1,
      },
    },
    filterOptions: {
      categories: Array.from({ length: 8 }, (_, index) => ({
        id: `category-${index}`,
        name: `Category ${index + 1}`,
        slug: `category-${index}`,
        websiteCount: Math.floor(Math.random() * 50) + 10,
      })),
      tags: Array.from({ length: 15 }, (_, index) => ({
        id: `tag-${index}`,
        name: `tag${index + 1}`,
        slug: `tag-${index}`,
        websiteCount: Math.floor(Math.random() * 30) + 5,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      })),
    },
    related: {
      similar: Array.from({ length: 5 }, (_, index) => ({
        id: `related-category-${index}`,
        name: `Related Category ${index + 1}`,
        slug: `related-category-${index}`,
        type: 'category' as const,
        websiteCount: Math.floor(Math.random() * 40) + 15,
      })),
    },
    breadcrumbs: [
      { label: 'Home', href: '/', current: false },
      { label: 'Categories', href: '/categories', current: false },
      { label: entityData.name, href: `/category/${categorySlug}`, current: true },
    ],
  };
  
  // 缓存数据
  if (config.enableCaching) {
    categoryCache.set(categorySlug, categoryData, filters);
  }
  
  return categoryData;
}

/**
 * 分类网站筛选Hook
 * 
 * 专门处理分类页面的筛选逻辑，集成现有的FilterState和browsable-page-store
 * 提供完整的分类数据获取、筛选、缓存和状态管理功能
 */
export function useCategoryWebsites(config: CategoryWebsitesConfig = {}) {
  // 合并配置
  const finalConfig = useMemo(() => ({ ...DEFAULT_CATEGORY_CONFIG, ...config }), [config]);
  
  // 获取状态管理
  const store = useBrowsablePageStore();
  const { syncUrlFromStore, syncStoreFromUrl } = useBrowsablePageUrlSync();
  const filters = useBrowsablePageFilters();
  const pagination = useBrowsablePagePagination();
  
  // 内部状态引用
  const isLoadingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentCategorySlugRef = useRef<string>(finalConfig.categorySlug || '');
  
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
   * 设置分类配置并初始化页面
   */
  const initializeCategoryPage = useCallback((categorySlug: string) => {
    if (!categorySlug) return;
    
    currentCategorySlugRef.current = categorySlug;
    
    // 设置分类页面配置
    const categoryConfig: BrowsablePageConfig = {
      ...store.config,
      pageType: 'category',
      id: `category-${categorySlug}`,
      title: {
        dynamic: true,
        fallback: 'Category Not Found',
        template: '{title} - Category | WebVault',
      },
      description: {
        enabled: true,
        source: 'entity',
        maxLength: 200,
        fallback: 'Browse websites in this category.',
      },
      hero: {
        ...store.config.hero,
        enabled: true,
        layout: 'standard',
        showStats: true,
        showBreadcrumbs: true,
      },
      filters: {
        ...store.config.filters,
        searchEnabled: true,
        searchPlaceholder: 'Search in this category...',
        categoryEnabled: false, // 当前页面就是分类页面，不显示分类筛选
        tagEnabled: true,
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
          dropdown: false,
        },
        related: {
          showParents: false,
          showChildren: false,
          showSimilar: true,
          maxItems: 8,
        },
      },
    };
    
    setConfig(categoryConfig);
  }, [store.config, setConfig]);

  /**
   * 执行分类数据获取
   */
  const executeDataFetch = useCallback(async (categorySlug?: string): Promise<void> => {
    // 防止重复请求
    if (isLoadingRef.current) return;
    
    const targetSlug = categorySlug || currentCategorySlugRef.current || getCurrentEntitySlug();
    if (!targetSlug) {
      console.error('No category slug available for data fetch');
      return;
    }
    
    isLoadingRef.current = true;
    
    // 设置加载状态
    setLoading('page', true);
    setLoading('content', true);
    clearError();
    
    try {
      // 调用分类数据API
      const categoryData = await fetchCategoryWebsites(targetSlug, store.filters, finalConfig);
      
      // 更新store数据
      // 注意：这里直接修改store.data，实际应该通过store的action方法
      store.data = categoryData;
      store.meta = {
        ...store.meta,
        lastUpdated: new Date().toISOString(),
        dataSource: 'api',
        retryCount: 0,
        isInitialized: true,
      };
      
      // 重置重试计数
      retryCountRef.current = 0;
      
      console.log(`Category data fetched successfully:`, {
        categorySlug: targetSlug,
        itemsCount: categoryData.websites.items.length,
        totalCount: categoryData.websites.totalCount,
        dataSource: 'api',
      });
      
    } catch (error) {
      console.error('Category data fetch failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load category data';
      setError('page', errorMessage);
      
      // 增加重试计数
      retryCountRef.current++;
      
      // 如果重试次数未达到上限，安排重试
      if (retryCountRef.current < finalConfig.maxRetries) {
        console.log(`Scheduling retry ${retryCountRef.current}/${finalConfig.maxRetries} in ${finalConfig.retryDelay}ms`);
        
        setTimeout(() => {
          if (!isLoadingRef.current) {
            executeDataFetch(targetSlug);
          }
        }, finalConfig.retryDelay * retryCountRef.current); // 递增延迟
      }
      
    } finally {
      setLoading('page', false);
      setLoading('content', false);
      isLoadingRef.current = false;
    }
  }, [store, finalConfig, getCurrentEntitySlug, setLoading, setError, clearError]);

  /**
   * 防抖的数据获取函数
   */
  const debouncedFetchData = useDebouncedCallback(
    (categorySlug?: string) => {
      executeDataFetch(categorySlug);
    },
    finalConfig.debounceDelay
  );

  /**
   * 设置分类slug
   */
  const setCategorySlug = useCallback((slug: string) => {
    currentCategorySlugRef.current = slug;
    initializeCategoryPage(slug);
    
    // 更新筛选条件中的entityId
    updateFilters({ entityId: slug });
  }, [initializeCategoryPage, updateFilters]);

  /**
   * 加载分类数据
   */
  const loadCategoryData = useCallback((slug?: string) => {
    debouncedFetchData.cancel();
    return executeDataFetch(slug);
  }, [executeDataFetch, debouncedFetchData]);

  /**
   * 刷新数据
   */
  const refreshData = useCallback(async () => {
    const currentSlug = currentCategorySlugRef.current || getCurrentEntitySlug();
    if (currentSlug) {
      // 清除缓存
      categoryCache.delete(currentSlug);
      
      // 重新加载数据
      return loadCategoryData(currentSlug);
    }
  }, [getCurrentEntitySlug, loadCategoryData]);

  /**
   * 重试加载
   */
  const retryLoad = useCallback(async () => {
    if (retryCountRef.current < finalConfig.maxRetries) {
      clearError();
      const currentSlug = currentCategorySlugRef.current || getCurrentEntitySlug();
      return loadCategoryData(currentSlug || undefined);
    } else {
      console.warn('Maximum retry attempts reached');
      return Promise.resolve();
    }
  }, [finalConfig.maxRetries, clearError, getCurrentEntitySlug, loadCategoryData]);

  /**
   * 清除筛选条件
   */
  const clearFilters = useCallback(() => {
    storeClearFilters();
    
    // 筛选清除后重新获取数据
    setTimeout(() => {
      debouncedFetchData(currentCategorySlugRef.current);
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
          console.log('Auto-refreshing category data...');
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
    debouncedFetchData(currentCategorySlugRef.current);
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
    if (meta.isInitialized && currentCategorySlugRef.current) {
      handleFiltersChange();
    }
  }, [
    filters.search,
    filters.selectedTags,
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

  // 构建分类网站状态
  const categoryWebsitesState: CategoryWebsitesState = useMemo(() => ({
    category: data?.entity ? {
      id: data.entity.id,
      name: data.entity.name,
      slug: data.entity.slug,
      description: data.entity.description,
      color: data.entity.color,
      websiteCount: data.entity.stats.websiteCount,
      metadata: data.entity.metadata as CategoryMetadata,
    } : undefined,
    websites: data?.websites.items || [],
    totalCount: data?.websites.totalCount || 0,
    pagination: data?.websites.pagination,
    filterOptions: data?.filterOptions,
    breadcrumbs: data?.breadcrumbs || [],
    relatedCategories: data?.related?.similar,
    isLoading: loading.page || loading.content,
    isInitialized: meta.isInitialized,
    error: error.page || error.content,
    lastUpdated: meta.lastUpdated || undefined,
    dataSource: meta.dataSource,
  }), [data, loading, meta, error]);

  // 构建分类网站操作
  const categoryWebsitesActions: CategoryWebsitesActions = useMemo(() => ({
    setCategorySlug,
    loadCategoryData,
    refreshData,
    retryLoad,
    updateFilters,
    setSearch,
    setTags,
    setSorting,
    clearFilters,
    setPage,
    setItemsPerPage,
    setViewMode,
    clearError: () => clearError(),
  }), [
    setCategorySlug,
    loadCategoryData,
    refreshData,
    retryLoad,
    updateFilters,
    setSearch,
    setTags,
    setSorting,
    clearFilters,
    setPage,
    setItemsPerPage,
    setViewMode,
    clearError,
  ]);

  // 返回分类网站状态和操作
  return {
    // 状态数据
    ...categoryWebsitesState,
    
    // 操作方法
    ...categoryWebsitesActions,
    
    // 筛选状态（来自filters hook）
    filters: {
      search: filters.search,
      selectedTags: filters.selectedTags,
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
    getCurrentCategorySlug: () => currentCategorySlugRef.current || getCurrentEntitySlug(),
    clearCache: () => categoryCache.clear(),
    hasActiveFilters: filters.hasActiveFilters,
    activeFiltersCount: filters.activeFiltersCount,
    
    // 配置信息
    config: finalConfig,
    pageConfig: store.config,
    
    // 调试信息（开发环境）
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        isLoading: isLoadingRef.current,
        retryCount: retryCountRef.current,
        autoRefreshActive: !!autoRefreshTimerRef.current,
        currentCategorySlug: currentCategorySlugRef.current,
        cacheEnabled: finalConfig.enableCaching,
        fetchConfig: finalConfig,
      },
    }),
  };
}

/**
 * 简化的分类网站Hook
 * 
 * 为简单使用场景提供基础的分类筛选功能
 */
export function useSimpleCategoryWebsites(categorySlug?: string) {
  return useCategoryWebsites({
    categorySlug,
    debounceDelay: 500,
    maxRetries: 1,
    enableCaching: false,
    autoRefresh: false,
  });
}

// 类型已在接口定义处导出

// 默认导出
export default useCategoryWebsites;