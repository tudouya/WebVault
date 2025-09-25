/**
 * Unified Browsable Page Data Hook
 * 
 * 统一的浏览页面数据获取Hook，连接store和API层
 * 实现配置驱动的数据获取逻辑，支持集合详情页、分类浏览页、标签浏览页
 * 
 * 基于useWebsiteSearch.ts的成熟模式，提供完整的数据管理功能：
 * - 配置驱动的API调用
 * - 统一的错误处理和重试逻辑
 * - 防抖处理和性能优化
 * - 状态管理集成
 * - URL状态同步
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useBrowsablePageStore, useBrowsablePageUrlSync } from '../stores/browsable-page-store';
import type { 
  BrowsablePageData, 
  BrowsablePageConfig,
  PageType,
  FilterParams,
  CollectionMetadata,
  CategoryMetadata,
  TagMetadata 
} from '../types';
import type { WebsiteCardData } from '@/features/websites/types/website';

/**
 * 数据获取配置接口
 */
export interface DataFetchConfig {
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
}

/**
 * 数据获取结果接口
 */
export interface DataFetchResult {
  /** 是否成功 */
  success: boolean;
  /** 返回数据 */
  data?: BrowsablePageData;
  /** 错误信息 */
  error?: string;
  /** 是否来自缓存 */
  fromCache?: boolean;
  /** 请求耗时 */
  duration?: number;
}

/**
 * API调用接口
 */
export interface ApiCallParams {
  /** 页面类型 */
  pageType: PageType;
  /** 实体slug */
  entitySlug: string;
  /** 筛选参数 */
  filters: FilterParams;
  /** 页面配置 */
  config: BrowsablePageConfig;
}

/**
 * 默认数据获取配置
 */
const DEFAULT_FETCH_CONFIG: Required<DataFetchConfig> = {
  debounceDelay: 300,
  maxRetries: 3,
  retryDelay: 1000,
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5分钟
  autoRefresh: false,
  refreshInterval: 30 * 1000, // 30秒
};

/**
 * 简单的内存缓存实现
 */
class SimpleCache<T = unknown> {
  private cache = new Map<string, { data: T; timestamp: number }>();

  get(key: string, timeout: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > timeout) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
}

// 全局缓存实例
const dataCache = new SimpleCache();

/**
 * 根据配置调用相应的API服务
 * 
 * 配置驱动的数据获取核心函数，根据页面类型调用不同的API端点
 */
export async function fetchDataByConfig(params: ApiCallParams): Promise<DataFetchResult> {
  const { pageType, entitySlug, filters, config } = params;
  const startTime = Date.now();
  
  try {
    // 生成缓存键
    const cacheKey = `${pageType}-${entitySlug}-${JSON.stringify(filters)}`;
    
    // 检查缓存
    if (DEFAULT_FETCH_CONFIG.enableCaching) {
      const cachedData = dataCache.get(cacheKey, DEFAULT_FETCH_CONFIG.cacheTimeout);
      if (cachedData) {
        return {
          success: true,
          data: cachedData as BrowsablePageData<unknown>,
          fromCache: true,
          duration: Date.now() - startTime,
        };
      }
    }
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    // 根据页面类型构建模拟数据
    const mockData = await buildMockDataByType(pageType, entitySlug, filters, config);
    
    // 缓存数据
    if (DEFAULT_FETCH_CONFIG.enableCaching) {
      dataCache.set(cacheKey, mockData);
    }
    
    return {
      success: true,
      data: mockData,
      fromCache: false,
      duration: Date.now() - startTime,
    };
    
  } catch (error) {
    console.error(`Failed to fetch ${pageType} data:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to load ${pageType} data`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * 根据页面类型构建模拟数据
 * 
 * 实际实现中，这里会调用真实的API服务
 */
async function buildMockDataByType(
  pageType: PageType,
  entitySlug: string,
  filters: FilterParams,
  _config: BrowsablePageConfig
): Promise<BrowsablePageData> {
  
  // 根据页面类型构建不同的实体数据
  let entityData;
  let entityMetadata;
  let breadcrumbs;
  
  switch (pageType) {
    case 'collection':
      entityData = {
        id: entitySlug,
        name: `${entitySlug.charAt(0).toUpperCase() + entitySlug.slice(1)} Collection`,
        slug: entitySlug,
        description: `A curated collection of high-quality websites about ${entitySlug}`,
        iconUrl: '/assets/icons/collection.svg',
        stats: {
          websiteCount: Math.floor(Math.random() * 100) + 20,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: new Date().toISOString(),
          additional: {
            views: Math.floor(Math.random() * 1000) + 100,
            bookmarks: Math.floor(Math.random() * 50) + 10,
          },
        },
      };
      
      entityMetadata = {
        curator: {
          name: 'WebVault Curator',
          avatar: '/assets/avatars/curator.svg',
        },
        isFeatured: Math.random() > 0.7,
        isPublic: true,
        theme: 'tech',
      } as CollectionMetadata;
      
      breadcrumbs = [
        { label: 'Home', href: '/', current: false },
        { label: 'Collections', href: '/collections', current: false },
        { label: entityData.name, href: `/collection/${entitySlug}`, current: true },
      ];
      break;
      
    case 'category':
      entityData = {
        id: entitySlug,
        name: `${entitySlug.charAt(0).toUpperCase() + entitySlug.slice(1)}`,
        slug: entitySlug,
        description: `Websites in the ${entitySlug} category`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        stats: {
          websiteCount: Math.floor(Math.random() * 200) + 50,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          additional: {
            subcategories: Math.floor(Math.random() * 10) + 3,
          },
        },
      };
      
      entityMetadata = {
        parentId: Math.random() > 0.5 ? 'parent-category' : undefined,
        level: Math.floor(Math.random() * 3) + 1,
        sortOrder: Math.floor(Math.random() * 100),
        isFeatured: Math.random() > 0.8,
      } as CategoryMetadata;
      
      breadcrumbs = [
        { label: 'Home', href: '/', current: false },
        { label: 'Categories', href: '/categories', current: false },
        { label: entityData.name, href: `/category/${entitySlug}`, current: true },
      ];
      break;
      
    case 'tag':
      entityData = {
        id: entitySlug,
        name: entitySlug,
        slug: entitySlug,
        description: `Websites tagged with #${entitySlug}`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        stats: {
          websiteCount: Math.floor(Math.random() * 150) + 30,
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          additional: {
            relatedTags: Math.floor(Math.random() * 20) + 5,
          },
        },
      };
      
      entityMetadata = {
        usageCount: Math.floor(Math.random() * 500) + 100,
        trending: Math.random() > 0.85,
        group: Math.random() > 0.7 ? 'technology' : undefined,
      } as TagMetadata;
      
      breadcrumbs = [
        { label: 'Home', href: '/', current: false },
        { label: 'Tags', href: '/tags', current: false },
        { label: `#${entityData.name}`, href: `/tag/${entitySlug}`, current: true },
      ];
      break;
      
    default:
      throw new Error(`Unsupported page type: ${pageType}`);
  }
  
  // 构建网站数据（实际实现中根据筛选条件从数据库查询）
  const websites: WebsiteCardData[] = Array.from({ length: filters.itemsPerPage || 12 }, (_, index) => ({
    id: `website-${index}`,
    title: `Sample Website ${index + 1}`,
    description: `A great website about ${entitySlug} - example description for website ${index + 1}`,
    url: `https://example${index + 1}.com`,
    image_url: `/assets/screenshots/website-${index % 5 + 1}.jpg`,
    favicon_url: `/assets/favicons/website-${index % 5 + 1}.ico`,
    category: 'sample-category',
    tags: [entitySlug, 'web'],
    rating: Math.random() * 5,
    visit_count: Math.floor(Math.random() * 1000) + 100,
    is_featured: Math.random() > 0.8,
    isAd: Math.random() > 0.7,
    created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
  
  // 计算分页信息
  const totalCount = entityData.stats.websiteCount;
  const itemsPerPage = filters.itemsPerPage || 12;
  const currentPage = filters.currentPage || 1;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  return {
    entity: {
      ...entityData,
      metadata: entityMetadata,
    },
    websites: {
      items: websites,
      totalCount,
      pagination: {
        currentPage,
        itemsPerPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    },
    filterOptions: {
      categories: Array.from({ length: 5 }, (_, index) => ({
        id: `category-${index}`,
        name: `Category ${index + 1}`,
        slug: `category-${index}`,
        websiteCount: Math.floor(Math.random() * 50) + 10,
      })),
      tags: Array.from({ length: 10 }, (_, index) => ({
        id: `tag-${index}`,
        name: `tag${index + 1}`,
        slug: `tag-${index}`,
        websiteCount: Math.floor(Math.random() * 30) + 5,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      })),
    },
    related: {
      similar: Array.from({ length: 3 }, (_, index) => ({
        id: `similar-${index}`,
        name: `Similar ${pageType} ${index + 1}`,
        slug: `similar-${index}`,
        type: pageType,
        websiteCount: Math.floor(Math.random() * 40) + 15,
      })),
    },
    breadcrumbs,
  };
}

/**
 * 统一的浏览页面数据获取Hook
 * 
 * 提供完整的数据获取和管理功能，连接store和API层
 * 支持配置驱动的数据获取、错误处理、重试逻辑、缓存管理
 */
export function useBrowsablePageData(fetchConfig: DataFetchConfig = {}) {
  // 合并配置
  const config = useMemo(() => ({ ...DEFAULT_FETCH_CONFIG, ...fetchConfig }), [fetchConfig]);
  
  // 获取状态管理
  const store = useBrowsablePageStore();
  const { syncUrlFromStore: _syncUrlFromStore } = useBrowsablePageUrlSync();
  
  // 内部状态引用
  const isLoadingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 从store获取相关状态
  const {
    config: pageConfig,
    data,
    filters,
    loading,
    error,
    meta,
    actions: {
      setConfig: _setConfig,
      loadData: _storeLoadData,
      refreshData: _storeRefreshData,
      setLoading,
      setError,
      clearError,
      retryLoad: _storeRetryLoad,
      getCurrentEntitySlug,
    },
  } = store;

  /**
   * 验证API调用参数
   */
  const validateApiParams = useCallback((params: ApiCallParams): boolean => {
    if (!params.pageType || !['collection', 'category', 'tag'].includes(params.pageType)) {
      console.error('Invalid page type:', params.pageType);
      return false;
    }
    
    if (!params.entitySlug || typeof params.entitySlug !== 'string' || params.entitySlug.trim().length === 0) {
      console.error('Invalid entity slug:', params.entitySlug);
      return false;
    }
    
    if (!params.config || typeof params.config !== 'object') {
      console.error('Invalid page config:', params.config);
      return false;
    }
    
    return true;
  }, []);

  /**
   * 执行数据获取的核心函数
   */
  const executeDataFetch = useCallback(async (entitySlug?: string): Promise<void> => {
    // 防止重复请求
    if (isLoadingRef.current) return;
    
    const currentSlug = entitySlug || getCurrentEntitySlug();
    if (!currentSlug) {
      console.error('No entity slug available for data fetch');
      return;
    }
    
    isLoadingRef.current = true;
    
    // 构建API调用参数
    const apiParams: ApiCallParams = {
      pageType: pageConfig.pageType,
      entitySlug: currentSlug,
      filters: filters,
      config: pageConfig,
    };
    
    // 验证参数
    if (!validateApiParams(apiParams)) {
      isLoadingRef.current = false;
      setError('page', 'Invalid parameters for data fetch');
      return;
    }
    
    // 设置加载状态
    setLoading('page', true);
    setLoading('content', true);
    clearError();
    
    try {
      // 调用配置驱动的数据获取函数
      const result = await fetchDataByConfig(apiParams);
      
      if (result.success && result.data) {
        // 使用store的loadData方法更新数据
        // 这里模拟store的loadData行为，实际实现中应该调用store方法
        store.data = result.data;
        store.meta = {
          ...store.meta,
          lastUpdated: new Date().toISOString(),
          dataSource: 'api',
          retryCount: 0,
          isInitialized: true,
        };
        
        // 重置重试计数
        retryCountRef.current = 0;
        
        console.log(`Data fetched successfully for ${pageConfig.pageType}:`, {
          entitySlug: currentSlug,
          duration: result.duration,
          fromCache: result.fromCache,
          itemsCount: result.data.websites.items.length,
        });
        
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
    } catch (error) {
      console.error('Data fetch failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('page', errorMessage);
      
      // 增加重试计数
      retryCountRef.current++;
      
      // 如果重试次数未达到上限，安排重试
      if (retryCountRef.current < config.maxRetries) {
        console.log(`Scheduling retry ${retryCountRef.current}/${config.maxRetries} in ${config.retryDelay}ms`);
        
        setTimeout(() => {
          if (!isLoadingRef.current) {
            executeDataFetch(currentSlug);
          }
        }, config.retryDelay * retryCountRef.current); // 递增延迟
      }
      
    } finally {
      setLoading('page', false);
      setLoading('content', false);
      isLoadingRef.current = false;
    }
  }, [pageConfig, filters, config, getCurrentEntitySlug, validateApiParams, setLoading, setError, clearError, store]);

  /**
   * 防抖的数据获取函数
   */
  const debouncedFetchData = useDebouncedCallback(
    (entitySlug?: string) => {
      executeDataFetch(entitySlug);
    },
    config.debounceDelay
  );

  /**
   * 公开的数据加载方法
   */
  const loadData = useCallback((entitySlug?: string) => {
    debouncedFetchData.cancel();
    return executeDataFetch(entitySlug);
  }, [executeDataFetch, debouncedFetchData]);

  /**
   * 公开的数据刷新方法
   */
  const refreshData = useCallback(() => {
    const currentSlug = getCurrentEntitySlug();
    if (currentSlug) {
      // 清除缓存
      const cacheKey = `${pageConfig.pageType}-${currentSlug}-${JSON.stringify(filters)}`;
      dataCache.delete(cacheKey);
      
      // 重新加载数据
      return loadData(currentSlug);
    }
  }, [pageConfig.pageType, filters, getCurrentEntitySlug, loadData]);

  /**
   * 重试数据加载
   */
  const retryLoad = useCallback(() => {
    if (retryCountRef.current < config.maxRetries) {
      clearError();
      const currentSlug = getCurrentEntitySlug();
      return loadData(currentSlug || undefined);
    } else {
      console.warn('Maximum retry attempts reached');
    }
  }, [config.maxRetries, clearError, getCurrentEntitySlug, loadData]);

  /**
   * 设置自动刷新
   */
  const setupAutoRefresh = useCallback(() => {
    if (config.autoRefresh && config.refreshInterval > 0) {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
      
      autoRefreshTimerRef.current = setInterval(() => {
        if (!loading.page && !loading.content) {
          console.log('Auto-refreshing data...');
          refreshData();
        }
      }, config.refreshInterval);
    }
  }, [config.autoRefresh, config.refreshInterval, loading.page, loading.content, refreshData]);

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
    debouncedFetchData(getCurrentEntitySlug() || undefined);
  }, [debouncedFetchData, getCurrentEntitySlug]);

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
    if (meta.isInitialized) {
      handleFiltersChange();
    }
  }, [filters.search, filters.categoryId, filters.selectedTags, filters.sortBy, filters.sortOrder, handleFiltersChange, meta.isInitialized]);

  // 返回数据状态和操作方法
  return {
    // 数据状态
    data,
    entity: data?.entity,
    websites: data?.websites.items || [],
    totalCount: data?.websites.totalCount || 0,
    pagination: data?.websites.pagination,
    filterOptions: data?.filterOptions,
    breadcrumbs: data?.breadcrumbs || [],
    related: data?.related,
    
    // 加载和错误状态
    loading,
    error,
    isLoading: loading.page || loading.content,
    isInitialized: meta.isInitialized,
    retryCount: retryCountRef.current,
    maxRetries: config.maxRetries,
    canRetry: retryCountRef.current < config.maxRetries,
    lastUpdated: meta.lastUpdated,
    dataSource: meta.dataSource,
    
    // 数据操作方法
    loadData,
    refreshData,
    retryLoad,
    
    // 工具方法
    getCurrentEntitySlug,
    clearCache: () => dataCache.clear(),
    
    // 配置信息
    config,
    pageConfig,
    
    // 调试信息（开发环境）
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        isLoading: isLoadingRef.current,
        retryCount: retryCountRef.current,
        autoRefreshActive: !!autoRefreshTimerRef.current,
        cacheEnabled: config.enableCaching,
        fetchConfig: config,
      },
    }),
  };
}

/**
 * 简化的数据获取Hook
 * 
 * 为简单使用场景提供基础的数据获取功能
 */
export function useSimpleBrowsablePageData() {
  return useBrowsablePageData({
    debounceDelay: 500,
    maxRetries: 1,
    enableCaching: false,
    autoRefresh: false,
  });
}

// 默认导出
export default useBrowsablePageData;