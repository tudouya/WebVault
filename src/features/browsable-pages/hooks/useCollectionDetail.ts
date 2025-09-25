/**
 * Collection Detail Page Data Hook
 * 
 * 专门为集合详情页面设计的数据管理Hook
 * 集成现有collection-store状态管理，提供集合详情页特有的数据获取和处理逻辑
 * 
 * 核心功能：
 * - 集合详情数据获取和缓存
 * - 集合内网站的分页和筛选
 * - 错误处理和重试逻辑
 * - 服务端渲染数据预加载支持
 * - URL状态同步管理
 */

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { 
  useCollectionStore, 
  useCollectionUrlSync,
  useCollectionData,
  useCollectionFilters,
  useCollectionPagination,
} from '@/features/websites/stores/collection-store';
import {
  getMockCollections
} from '@/features/websites/data/mockCollections';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {
  searchMockCollections as _searchMockCollections,
  filterMockCollectionsByStatus as _filterMockCollectionsByStatus,
  filterMockCollectionsByTags as _filterMockCollectionsByTags
} from '@/features/websites/data/mockCollections';
import type { Collection, CollectionStatus } from '@/features/websites/types/collection';
import type { WebsiteCardData } from '@/features/websites/types/website';

/**
 * 集合详情Hook配置接口
 */
export interface CollectionDetailConfig {
  /** 集合slug或ID */
  collectionId: string;
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 是否启用缓存 */
  enableCaching?: boolean;
  /** 缓存过期时间（毫秒） */
  cacheTimeout?: number;
  /** 是否自动加载数据 */
  autoLoad?: boolean;
  /** 预加载的服务端数据 */
  initialData?: {
    collection: Collection | null;
    websites: WebsiteCardData[];
    totalCount: number;
  };
}

/**
 * 集合详情数据结果接口
 */
export interface CollectionDetailResult {
  /** 集合基本信息 */
  collection: Collection | null;
  /** 集合内的网站列表 */
  websites: WebsiteCardData[];
  /** 网站总数 */
  totalCount: number;
  /** 是否找到集合 */
  found: boolean;
  /** 数据来源标识 */
  source: 'cache' | 'api' | 'initial' | 'mock';
  /** 获取耗时 */
  duration?: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<Omit<CollectionDetailConfig, 'collectionId' | 'initialData'>> = {
  debounceDelay: 300,
  maxRetries: 3,
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5分钟
  autoLoad: true,
};

/**
 * 简单内存缓存实现
 */
class CollectionDetailCache {
  private cache = new Map<string, { data: CollectionDetailResult; timestamp: number }>();
  
  get(key: string, timeout: number): CollectionDetailResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > timeout) {
      this.cache.delete(key);
      return null;
    }
    
    return { ...entry.data, source: 'cache' as const };
  }
  
  set(key: string, data: CollectionDetailResult): void {
    this.cache.set(key, {
      data: { ...data, source: 'cache' as const },
      timestamp: Date.now(),
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// 全局缓存实例
const detailCache = new CollectionDetailCache();

/**
 * 根据集合ID获取集合详情数据
 * 
 * 实际实现中，这里会调用真实的API服务
 */
async function fetchCollectionDetail(
  collectionId: string,
  filters: {
    search?: string;
    status?: CollectionStatus[];
    tags?: string[];
    sortBy?: string;
    sortOrder?: string;
    currentPage?: number;
    itemsPerPage?: number;
  }
): Promise<CollectionDetailResult> {
  const startTime = Date.now();
  
  try {
    // 模拟网络请求延迟
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // 获取集合基本信息（从mock数据中查找）
    const collections = getMockCollections();
    const collection = collections.find(c => c.id === collectionId || c.slug === collectionId);
    
    if (!collection) {
      return {
        collection: null,
        websites: [],
        totalCount: 0,
        found: false,
        source: 'mock',
        duration: Date.now() - startTime,
      };
    }
    
    // 模拟生成该集合内的网站数据
    // 实际实现中，这里会根据collection.id查询关联的网站
    let websites: WebsiteCardData[] = Array.from({ length: collection.websiteCount }, (_, index) => ({
      id: `${collection.id}-website-${index}`,
      title: `${collection.title} - Website ${index + 1}`,
      description: `A curated website from ${collection.title} collection - example description for website ${index + 1}`,
      url: `https://example-${collection.slug}-${index + 1}.com`,
      image_url: `/assets/screenshots/${collection.slug}-${index % 5 + 1}.jpg`,
      favicon_url: `/assets/favicons/${collection.slug}-${index % 5 + 1}.ico`,
      category: 'collection-item',
      tags: collection.tags || ['collection'],
      rating: 4 + Math.random(),
      visit_count: Math.floor(Math.random() * 1000) + 100,
      is_featured: Math.random() > 0.8,
      isAd: false, // 集合内的网站通常不是广告
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    // 应用搜索筛选
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      websites = websites.filter(website => 
        website.title.toLowerCase().includes(searchTerm) ||
        (website.description && website.description.toLowerCase().includes(searchTerm)) ||
        website.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // 应用标签筛选
    if (filters.tags && filters.tags.length > 0) {
      websites = websites.filter(website =>
        filters.tags!.some(filterTag => 
          website.tags.some(websiteTag => 
            websiteTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        )
      );
    }
    
    // 应用排序
    if (filters.sortBy && filters.sortOrder) {
      websites.sort((a, b) => {
        let aValue: string | number = 0;
        let bValue: string | number = 0;

        switch (filters.sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'rating':
            aValue = a.rating || 0;
            bValue = b.rating || 0;
            break;
          case 'visit_count':
            aValue = a.visit_count || 0;
            bValue = b.visit_count || 0;
            break;
          case 'created_at':
          default:
            aValue = new Date(a.created_at || 0).getTime();
            bValue = new Date(b.created_at || 0).getTime();
            break;
        }
        
        if (aValue < bValue) {
          return filters.sortOrder === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return filters.sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // 计算分页
    const totalCount = websites.length;
    const itemsPerPage = filters.itemsPerPage || 12;
    const currentPage = filters.currentPage || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedWebsites = websites.slice(startIndex, endIndex);
    
    return {
      collection,
      websites: paginatedWebsites,
      totalCount,
      found: true,
      source: 'mock',
      duration: Date.now() - startTime,
    };
    
  } catch (error) {
    console.error('Failed to fetch collection detail:', error);
    
    return {
      collection: null,
      websites: [],
      totalCount: 0,
      found: false,
      source: 'mock',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Collection Detail Hook
 * 
 * 为集合详情页面提供专门的数据管理功能
 * 集成现有的collection-store，同时提供页面特有的逻辑处理
 */
export function useCollectionDetail(config: CollectionDetailConfig) {
  // 合并配置
  const mergedConfig = useMemo(() => ({ 
    ...DEFAULT_CONFIG, 
    ...config,
  }), [config]);
  
  // 获取store状态和方法
  const _collectionStore = useCollectionStore();
  const { syncUrlFromStore: _syncUrlFromStore, syncStoreFromUrl: _syncStoreFromUrl } = useCollectionUrlSync();
  const { loadCollections: _loadCollections, refreshCollections: _refreshCollections, clearError: _clearError, setError: _setError } = useCollectionData();
  const { searchQuery, statusFilter, tagsFilter, sorting } = useCollectionFilters();
  const { currentPage, itemsPerPage } = useCollectionPagination();
  
  // 内部状态
  const isLoadingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const initialDataUsedRef = useRef<boolean>(false);
  const lastLoadedCollectionRef = useRef<string | null>(null);
  
  // 集合详情状态
  const [collectionDetail, setCollectionDetail] = useState<CollectionDetailResult>({
    collection: mergedConfig.initialData?.collection || null,
    websites: mergedConfig.initialData?.websites || [],
    totalCount: mergedConfig.initialData?.totalCount || 0,
    found: !!mergedConfig.initialData?.collection,
    source: mergedConfig.initialData ? 'initial' : 'mock',
  });
  
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  
  /**
   * 加载集合详情数据的核心函数
   */
  const loadCollectionDetail = useCallback(async (collectionId?: string): Promise<void> => {
    const targetId = collectionId || mergedConfig.collectionId;
    if (!targetId) return;
    
    // 防止重复加载
    if (isLoadingRef.current && lastLoadedCollectionRef.current === targetId) return;
    
    isLoadingRef.current = true;
    lastLoadedCollectionRef.current = targetId;
    setDetailLoading(true);
    setDetailError(null);
    
    try {
      // 检查缓存
      if (mergedConfig.enableCaching) {
        const cacheKey = `${targetId}-${JSON.stringify({
          search: searchQuery,
          tags: tagsFilter,
          sortBy: sorting?.sortBy,
          sortOrder: sorting?.sortOrder,
          page: currentPage,
          limit: itemsPerPage,
        })}`;
        
        const cachedResult = detailCache.get(cacheKey, mergedConfig.cacheTimeout);
        if (cachedResult) {
          setCollectionDetail(cachedResult);
          setDetailLoading(false);
          isLoadingRef.current = false;
          console.log('Collection detail loaded from cache:', targetId);
          return;
        }
      }
      
      // 构建筛选参数
      const filters = {
        search: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        tags: tagsFilter.length > 0 ? tagsFilter : undefined,
        sortBy: sorting?.sortBy,
        sortOrder: sorting?.sortOrder,
        currentPage,
        itemsPerPage,
      };
      
      // 获取集合详情数据
      const result = await fetchCollectionDetail(targetId, filters);
      
      // 如果未找到集合，设置错误状态
      if (!result.found) {
        setDetailError(`Collection not found: ${targetId}`);
        setCollectionDetail({
          collection: null,
          websites: [],
          totalCount: 0,
          found: false,
          source: result.source,
          duration: result.duration,
        });
      } else {
        setCollectionDetail(result);
        
        // 缓存结果
        if (mergedConfig.enableCaching) {
          const cacheKey = `${targetId}-${JSON.stringify(filters)}`;
          detailCache.set(cacheKey, result);
        }
      }
      
      // 重置重试计数
      retryCountRef.current = 0;
      
      console.log('Collection detail loaded:', {
        collectionId: targetId,
        found: result.found,
        websitesCount: result.websites.length,
        totalCount: result.totalCount,
        duration: result.duration,
        source: result.source,
      });
      
    } catch (error) {
      console.error('Failed to load collection detail:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load collection detail';
      setDetailError(errorMessage);
      
      // 增加重试计数
      retryCountRef.current++;
      
      // 安排重试
      if (retryCountRef.current < mergedConfig.maxRetries) {
        setTimeout(() => {
          loadCollectionDetail(targetId);
        }, 1000 * retryCountRef.current);
      }
      
    } finally {
      setDetailLoading(false);
      isLoadingRef.current = false;
    }
  }, [
    mergedConfig.collectionId,
    mergedConfig.enableCaching,
    mergedConfig.cacheTimeout,
    mergedConfig.maxRetries,
    searchQuery,
    statusFilter,
    tagsFilter,
    sorting,
    currentPage,
    itemsPerPage,
  ]);
  
  /**
   * 防抖的数据加载函数
   */
  const debouncedLoadDetail = useDebouncedCallback(
    loadCollectionDetail,
    mergedConfig.debounceDelay
  );
  
  /**
   * 刷新集合详情数据
   */
  const refreshCollectionDetail = useCallback(async () => {
    // 清除缓存
    if (mergedConfig.enableCaching) {
      detailCache.clear();
    }
    
    // 重新加载
    await loadCollectionDetail(mergedConfig.collectionId);
  }, [loadCollectionDetail, mergedConfig.collectionId, mergedConfig.enableCaching]);
  
  /**
   * 重试加载
   */
  const retryLoadDetail = useCallback(() => {
    if (retryCountRef.current < mergedConfig.maxRetries) {
      setDetailError(null);
      return loadCollectionDetail(mergedConfig.collectionId);
    }
  }, [loadCollectionDetail, mergedConfig.collectionId, mergedConfig.maxRetries]);
  
  /**
   * 清除详情错误状态
   */
  const clearDetailError = useCallback(() => {
    setDetailError(null);
  }, []);
  
  // 初始化加载
  useEffect(() => {
    if (mergedConfig.autoLoad) {
      // 如果有初始数据且尚未使用过，使用初始数据
      if (mergedConfig.initialData && !initialDataUsedRef.current) {
        initialDataUsedRef.current = true;
        setCollectionDetail({
          collection: mergedConfig.initialData.collection,
          websites: mergedConfig.initialData.websites,
          totalCount: mergedConfig.initialData.totalCount,
          found: !!mergedConfig.initialData.collection,
          source: 'initial',
        });
      } else {
        // 否则加载数据
        loadCollectionDetail();
      }
    }
  }, [mergedConfig.autoLoad, mergedConfig.initialData, loadCollectionDetail]);
  
  // 监听筛选参数变化
  useEffect(() => {
    if (mergedConfig.collectionId && (!mergedConfig.initialData || initialDataUsedRef.current)) {
      debouncedLoadDetail();
    }
  }, [
    searchQuery,
    tagsFilter,
    sorting?.sortBy,
    sorting?.sortOrder,
    currentPage,
    itemsPerPage,
    debouncedLoadDetail,
    mergedConfig.collectionId,
    mergedConfig.initialData,
  ]);
  
  // 清理副作用
  useEffect(() => {
    return () => {
      debouncedLoadDetail.cancel();
      isLoadingRef.current = false;
    };
  }, [debouncedLoadDetail]);
  
  // 计算派生状态
  const isLoading = detailLoading;
  const hasError = !!detailError;
  const canRetry = retryCountRef.current < mergedConfig.maxRetries && hasError;
  const isEmpty = !isLoading && !hasError && collectionDetail.websites.length === 0;
  const isNotFound = !isLoading && !collectionDetail.found;
  
  // 分页信息
  const totalPages = Math.ceil(collectionDetail.totalCount / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  return {
    // 核心数据
    collection: collectionDetail.collection,
    websites: collectionDetail.websites,
    totalCount: collectionDetail.totalCount,
    
    // 状态信息
    isLoading,
    hasError,
    error: detailError,
    isEmpty,
    isNotFound,
    found: collectionDetail.found,
    source: collectionDetail.source,
    duration: collectionDetail.duration,
    
    // 重试信息
    retryCount: retryCountRef.current,
    maxRetries: mergedConfig.maxRetries,
    canRetry,
    
    // 分页信息
    currentPage,
    itemsPerPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // 操作方法
    loadDetail: loadCollectionDetail,
    refreshDetail: refreshCollectionDetail,
    retryLoad: retryLoadDetail,
    clearError: clearDetailError,
    
    // 筛选状态（来自collection-store）
    searchQuery,
    tagsFilter,
    statusFilter,
    sorting,
    
    // 工具方法
    clearCache: () => detailCache.clear(),
    
    // 配置信息
    config: mergedConfig,
    collectionId: mergedConfig.collectionId,
    
    // 调试信息（开发环境）
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        isLoadingRef: isLoadingRef.current,
        retryCount: retryCountRef.current,
        lastLoadedCollection: lastLoadedCollectionRef.current,
        initialDataUsed: initialDataUsedRef.current,
        cacheEnabled: mergedConfig.enableCaching,
      },
    }),
  };
}

/**
 * 简化的集合详情Hook
 * 
 * 提供基础的集合详情功能，适用于简单场景
 */
export function useSimpleCollectionDetail(collectionId: string) {
  return useCollectionDetail({
    collectionId,
    debounceDelay: 500,
    maxRetries: 1,
    enableCaching: false,
    autoLoad: true,
  });
}

// 默认导出
export default useCollectionDetail;