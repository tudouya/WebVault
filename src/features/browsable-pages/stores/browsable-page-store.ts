/**
 * Browsable Page State Management Store
 * 
 * 基于Zustand创建统一的浏览页面状态管理，支持集合详情页、分类浏览页和标签浏览页
 * 实现配置驱动架构，支持分页、筛选、搜索、数据加载和错误处理
 * 集成nuqs实现URL状态同步，保证浏览器前进后退和链接分享功能
 * 
 * 复用homepage-store.ts和collection-store.ts的成熟模式，确保一致性和可靠性
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  parseAsString, 
  parseAsInteger, 
  parseAsBoolean,
  useQueryStates
} from 'nuqs';
import { useCallback, useRef } from 'react';
import {
  BrowsablePageState,
  BrowsablePageConfig,
  BrowsablePageData,
  BrowsablePageURLParams,
  FilterParams,
  DEFAULT_PAGE_CONFIG
} from '../types';
import { SortField, SortOrder } from '@/features/websites/types/filters';
import type { WebsiteCardData } from '@/features/websites/types';
// TODO: 迁移到使用真实 API 调用
// import { mockWebsites } from '@/features/websites/data/mockWebsites';

/**
 * URL搜索参数解析器配置
 * 支持所有浏览页面类型的完整URL状态管理
 */
export const browsablePageParamsParsers = {
  // 实体标识
  slug: parseAsString,
  
  // 搜索查询
  q: parseAsString,
  
  // 筛选参数
  category: parseAsString,
  tags: parseAsString,         // 逗号分隔的标签
  
  // 排序参数
  sort: parseAsString,
  order: parseAsString,
  
  // 分页参数
  page: parseAsInteger,
  limit: parseAsInteger,
  
  // 视图设置
  view: parseAsString,         // 'grid' | 'list'
  
  // 高级筛选
  featured: parseAsBoolean,
  rating: parseAsInteger,
  ads: parseAsBoolean,
} as const;
/**
 * Helper function to extract categories from category tree
 * Recursively traverses the category tree and flattens it into an array
 */
function extractCategoriesFromTree(tree: any[]): Array<{
  id: string;
  name: string;
  slug: string;
  websiteCount: number;
}> {
  const categories: Array<{
    id: string;
    name: string;
    slug: string;
    websiteCount: number;
  }> = [];
  
  function traverse(nodes: any[]) {
    for (const node of nodes) {
      categories.push({
        id: node.id?.toString() || node.slug,
        name: node.name,
        slug: node.slug,
        websiteCount: node.websiteCount || 0,
      });
      
      // Recursively process children if they exist
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return categories;
}

/**
 * 扩展的浏览页面状态接口
 * 继承BrowsablePageState基础结构，扩展操作方法和元数据
 */
export interface BrowsablePageStoreState extends BrowsablePageState {
  // 元数据
  meta: {
    /** 上次数据更新时间 */
    lastUpdated: string | null;
    /** 数据来源标识 */
    dataSource: 'mock' | 'api';
    /** 重试计数 */
    retryCount: number;
    /** 是否已初始化 */
    isInitialized: boolean;
    /** URL状态同步标记 */
    urlSyncEnabled: boolean;
    /** 上次URL状态更新时间 */
    lastUrlSync: string | null;
    /** 是否正在同步URL状态 */
    isSyncingUrl: boolean;
  };
  
  // 操作方法
  actions: {
    // 配置管理
    setConfig: (config: BrowsablePageConfig) => void;
    updateConfig: (updates: Partial<BrowsablePageConfig>) => void;
    
    // 数据加载方法
    loadData: (entitySlug?: string) => Promise<void>;
    refreshData: () => Promise<void>;
    
    // 筛选方法
    updateFilters: (updates: Partial<FilterParams>) => void;
    setSearch: (query: string) => void;
    setCategory: (categoryId: string | null) => void;
    setTags: (tags: string[]) => void;
    setSorting: (field: SortField, order: SortOrder) => void;
    clearFilters: () => void;
    
    // 分页方法
    setPage: (page: number) => void;
    setItemsPerPage: (limit: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    resetPagination: () => void;
    
    // UI状态方法
    setSidebarOpen: (open: boolean) => void;
    setMobileFiltersOpen: (open: boolean) => void;
    setViewMode: (mode: 'grid' | 'list') => void;
    
    // 错误处理方法
    setError: (type: 'page' | 'content' | 'filters', error: string | null) => void;
    clearError: (type?: 'page' | 'content' | 'filters') => void;
    retryLoad: () => Promise<void>;
    
    // 加载状态方法
    setLoading: (type: 'page' | 'content' | 'filters', loading: boolean) => void;
    
    // 重置方法
    resetFilters: () => void;
    resetUI: () => void;
    resetAll: () => void;
    
    // URL状态同步方法
    syncFromURL: (params: BrowsablePageURLParams) => void;
    syncToURL: () => BrowsablePageURLParams;
    enableUrlSync: () => void;
    disableUrlSync: () => void;
    handleUrlChange: (newParams: BrowsablePageURLParams) => Promise<void>;
    handleBrowserNavigation: (direction: 'back' | 'forward') => void;
    
    // 工具方法
    getCurrentEntitySlug: () => string | null;
    getActiveFiltersCount: () => number;
    hasActiveFilters: () => boolean;
  };
}

/**
 * 默认筛选参数
 */
const DEFAULT_FILTERS: FilterParams = {
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
 * 默认加载状态
 */
const DEFAULT_LOADING = {
  page: false,
  content: false,
  filters: false,
};

/**
 * 默认错误状态
 */
const DEFAULT_ERROR = {
  page: undefined,
  content: undefined,
  filters: undefined,
};

/**
 * 默认UI状态
 */
const DEFAULT_UI = {
  sidebarOpen: false,
  mobileFiltersOpen: false,
  viewMode: 'grid' as const,
};

/**
 * 创建浏览页面状态管理Store
 * 使用与其他store相同的中间件配置，确保一致的开发体验
 */
export const useBrowsablePageStore = create<BrowsablePageStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // 基础状态初始化
        config: DEFAULT_PAGE_CONFIG,
        data: undefined,
        filters: DEFAULT_FILTERS,
        loading: DEFAULT_LOADING,
        error: DEFAULT_ERROR,
        ui: DEFAULT_UI,
        
        // 元数据初始化
        meta: {
          lastUpdated: null,
          dataSource: 'mock',
          retryCount: 0,
          isInitialized: false,
          urlSyncEnabled: true,
          lastUrlSync: null,
          isSyncingUrl: false,
        },
        
        // 操作方法实现
        actions: {
          // 配置管理
          setConfig: (config: BrowsablePageConfig) => {
            set(
              (state) => ({
                config,
                // 根据配置重置筛选参数的默认值
                filters: {
                  ...state.filters,
                  viewMode: config.content.defaultViewMode,
                  itemsPerPage: config.content.grid.defaultItemsPerPage,
                  sortBy: config.filters.defaultSort.field,
                  sortOrder: config.filters.defaultSort.order,
                },
                // 根据配置重置UI状态
                ui: {
                  ...state.ui,
                  viewMode: config.content.defaultViewMode,
                  sidebarOpen: config.navigation.sidebar.enabled && !config.navigation.sidebar.defaultCollapsed,
                },
              }),
              false,
              'setConfig'
            );
          },
          
          updateConfig: (updates: Partial<BrowsablePageConfig>) => {
            set(
              (state) => ({
                config: { ...state.config, ...updates },
              }),
              false,
              'updateConfig'
            );
          },
          
          // 数据加载方法
          loadData: async (entitySlug?: string) => {
            const state = get();
            
            // 防止重复加载
            if (state.loading.page || state.loading.content) return;
            
            set(
              (current) => ({
                loading: { ...current.loading, page: true, content: true },
                error: { ...current.error, page: undefined, content: undefined },
              }),
              false,
              'loadData:start'
            );
            
            try {
              const pageType = state.config.pageType;
              const currentPage = state.filters.currentPage || 1;
              const itemsPerPage = state.filters.itemsPerPage || 12;
              
              // 构建 API 查询参数
              const apiParams = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: itemsPerPage.toString(),
              });

              // 添加筛选参数
              if (state.filters.search) {
                apiParams.set('q', state.filters.search);
              }
              if (state.filters.categoryId) {
                apiParams.set('category', state.filters.categoryId);
              }
              if (state.filters.sortBy) {
                apiParams.set('sort', state.filters.sortBy);
              }
              if (state.filters.sortOrder) {
                apiParams.set('order', state.filters.sortOrder);
              }
              
              // 调用真实 API
              const response = await fetch(`/api/websites?${apiParams.toString()}`);
              
              if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
              }
              
              const result = await response.json();
              
              if (result.code !== 0) {
                throw new Error(result.message || 'API 返回错误');
              }

              // 转换 API 响应为 WebsiteCardData 格式
              const websites: WebsiteCardData[] = (result.data || []).map((item: any) => ({
                id: item.id.toString(),
                title: item.title,
                description: item.description,
                url: item.url,
                favicon: item.favicon,
                category: item.category,
                tags: item.tags || [],
                rating: item.rating,
                visitCount: item.visitCount,
                isAd: item.isAd || false,
                isFeatured: item.isFeatured || false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }));

              // 获取分类列表用于筛选选项
              const categoriesResponse = await fetch('/api/categories');
              const categoriesResult = await categoriesResponse.json();
              const allCategories = categoriesResult.code === 0 && categoriesResult.data?.tree 
                ? extractCategoriesFromTree(categoriesResult.data.tree) 
                : [];

              // 从网站数据中提取所有标签
              const allTagsSet = new Set<string>();
              websites.forEach(website => {
                website.tags?.forEach(tag => allTagsSet.add(tag));
              });
              const allTags = Array.from(allTagsSet);

              // 生成页面特定的实体数据
              let entityData: BrowsablePageData['entity'] = {
                id: 'default',
                name: 'Default Entity',
                slug: 'default',
                description: 'Default description',
                stats: {
                  websiteCount: result.meta?.total || 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              };

              if (pageType === 'collection') {
                entityData = {
                  id: entitySlug || 'developer-essential-tools',
                  name: '开发者必备工具',
                  slug: entitySlug || 'developer-essential-tools',
                  description: '精选的开发工具和资源，包括代码编辑器、版本控制、调试工具等，提升开发效率的必备工具集合。',
                  stats: {
                    websiteCount: result.meta?.total || 0,
                    createdAt: '2024-01-15T10:00:00Z',
                    updatedAt: new Date().toISOString(),
                  },
                };
              } else if (pageType === 'category') {
                const categoryName = state.filters.categoryId || 'All Categories';
                entityData = {
                  id: state.filters.categoryId || 'all-categories',
                  name: categoryName === 'all-categories' ? 'Explore by categories' : categoryName,
                  slug: state.filters.categoryId || 'all-categories',
                  description: state.filters.categoryId 
                    ? `浏览${categoryName}分类下的优质网站资源，发现该领域专业的工具和服务。`
                    : 'Browse and discover websites organized by categories. WebVault为您提供按分类整理的优质网站资源。',
                  stats: {
                    websiteCount: result.meta?.total || 0,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: new Date().toISOString(),
                  },
                };
              } else if (pageType === 'tag') {
                entityData = {
                  id: 'all-tags',
                  name: 'Explore by tags',
                  slug: 'all-tags',
                  description: 'Browse and discover websites organized by tags. WebVault为您提供按标签整理的优质网站资源。',
                  stats: {
                    websiteCount: result.meta?.total || 0,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: new Date().toISOString(),
                  },
                };
              }

              const totalCount = result.meta?.total || 0;
              const totalPages = result.meta?.total_pages || Math.ceil(totalCount / itemsPerPage);
              
              const apiData: BrowsablePageData = {
                entity: entityData,
                websites: {
                  items: websites,
                  totalCount,
                  pagination: {
                    currentPage,
                    itemsPerPage,
                    totalPages,
                    hasNextPage: result.meta?.has_more || false,
                    hasPrevPage: currentPage > 1,
                  },
                },
                filterOptions: {
                  categories: allCategories,
                  tags: allTags.map(tag => ({
                    id: tag,
                    name: tag,
                    slug: tag.toLowerCase().replace(/\s+/g, '-'),
                    websiteCount: 0,
                  })),
                },
                breadcrumbs: [
                  { label: 'Home', href: '/', current: false },
                  { label: state.config.pageType, href: `/${state.config.pageType}`, current: false },
                  { label: entitySlug || 'Default', href: `/${state.config.pageType}/${entitySlug}`, current: true },
                ],
              };
              
              set(
                (current) => ({
                  data: apiData,
                  loading: { ...current.loading, page: false, content: false },
                  meta: {
                    ...current.meta,
                    lastUpdated: new Date().toISOString(),
                    retryCount: 0,
                    isInitialized: true,
                    dataSource: 'api',
                  },
                }),
                false,
                'loadData:success'
              );
              
            } catch (error) {
              console.error('Failed to load browsable page data:', error);
              
              set(
                (current) => ({
                  loading: { ...current.loading, page: false, content: false },
                  error: {
                    ...current.error,
                    page: error instanceof Error ? error.message : '加载页面数据失败，请稍后重试',
                  },
                  meta: {
                    ...current.meta,
                    retryCount: current.meta.retryCount + 1,
                  },
                }),
                false,
                'loadData:error'
              );
            }
          },

          refreshData: async () => {
            const state = get();
            const entitySlug = state.data?.entity.slug;
            await get().actions.loadData(entitySlug);
          },
          
          // 筛选方法
          updateFilters: (updates: Partial<FilterParams>) => {
            get();

            set(
              (current) => ({
                filters: { ...current.filters, ...updates },
                // 筛选变更时重置页码
                ...('search' in updates || 'categoryId' in updates || 'selectedTags' in updates ? 
                  { filters: { ...current.filters, ...updates, currentPage: 1 } } : {}),
              }),
              false,
              'updateFilters'
            );
            
            // 筛选变更后自动重新加载内容和同步URL
            if ('search' in updates || 'categoryId' in updates || 'selectedTags' in updates || 'sortBy' in updates) {
              setTimeout(() => {
                const { actions } = get();
                actions.setLoading('content', true);
                actions.refreshData();
                
                // 如果启用了URL同步，则触发URL更新
                if (get().meta.urlSyncEnabled && !get().meta.isSyncingUrl) {
                  // 此处将由外部Hook处理URL同步
                }
              }, 100);
            }
          },
          
          setSearch: (query: string) => {
            get().actions.updateFilters({ search: query, currentPage: 1 });
          },
          
          setCategory: (categoryId: string | null) => {
            get().actions.updateFilters({ categoryId, currentPage: 1 });
          },
          
          setTags: (tags: string[]) => {
            get().actions.updateFilters({ selectedTags: tags, currentPage: 1 });
          },
          
          setSorting: (field: SortField, order: SortOrder) => {
            get().actions.updateFilters({ sortBy: field, sortOrder: order, currentPage: 1 });
          },
          
          clearFilters: () => {
            const state = get();
            get().actions.updateFilters({
              search: '',
              categoryId: null,
              selectedTags: [],
              featuredOnly: false,
              includeAds: true,
              minRating: 0,
              currentPage: 1,
              // 保持排序和视图设置
              sortBy: state.config.filters.defaultSort.field,
              sortOrder: state.config.filters.defaultSort.order,
              viewMode: state.config.content.defaultViewMode,
              itemsPerPage: state.config.content.grid.defaultItemsPerPage,
            });
          },
          
          // 分页方法
          setPage: (page: number) => {
            const state = get();
            if (!state.data) return;
            
            const totalPages = state.data.websites.pagination.totalPages;
            if (page < 1 || page > totalPages) return;
            
            get().actions.updateFilters({ currentPage: page });
            
            // 分页变更后重新加载内容
            setTimeout(() => {
              const { actions } = get();
              actions.setLoading('content', true);
              actions.refreshData();
            }, 100);
          },
          
          setItemsPerPage: (limit: number) => {
            if (limit < 1 || limit > 100) return;
            
            get().actions.updateFilters({ itemsPerPage: limit, currentPage: 1 });
            
            // 每页项目数变更后重新加载内容
            setTimeout(() => {
              const { actions } = get();
              actions.setLoading('content', true);
              actions.refreshData();
            }, 100);
          },
          
          goToNextPage: () => {
            const state = get();
            if (!state.data) return;
            
            const { currentPage } = state.data.websites.pagination;
            const { totalPages } = state.data.websites.pagination;
            
            if (currentPage < totalPages) {
              get().actions.setPage(currentPage + 1);
            }
          },
          
          goToPreviousPage: () => {
            const state = get();
            if (!state.data) return;
            
            const { currentPage } = state.data.websites.pagination;
            
            if (currentPage > 1) {
              get().actions.setPage(currentPage - 1);
            }
          },
          
          resetPagination: () => {
            get().actions.updateFilters({ currentPage: 1 });
          },
          
          // UI状态方法
          setSidebarOpen: (open: boolean) => {
            set(
              (state) => ({
                ui: { ...state.ui, sidebarOpen: open },
              }),
              false,
              'setSidebarOpen'
            );
          },
          
          setMobileFiltersOpen: (open: boolean) => {
            set(
              (state) => ({
                ui: { ...state.ui, mobileFiltersOpen: open },
              }),
              false,
              'setMobileFiltersOpen'
            );
          },
          
          setViewMode: (mode: 'grid' | 'list') => {
            set(
              (state) => ({
                ui: { ...state.ui, viewMode: mode },
                filters: { ...state.filters, viewMode: mode },
              }),
              false,
              'setViewMode'
            );
          },
          
          // 错误处理方法
          setError: (type: 'page' | 'content' | 'filters', error: string | null) => {
            set(
              (state) => ({
                error: { ...state.error, [type]: error },
              }),
              false,
              'setError'
            );
          },
          
          clearError: (type?: 'page' | 'content' | 'filters') => {
            if (type) {
              set(
                (state) => ({
                  error: { ...state.error, [type]: undefined },
                }),
                false,
                'clearError'
              );
            } else {
              set(
                { error: DEFAULT_ERROR },
                false,
                'clearAllErrors'
              );
            }
          },
          
          retryLoad: async () => {
            const state = get();
            if (state.meta.retryCount < 3) {  // 最多重试3次
              await get().actions.refreshData();
            }
          },
          
          // 加载状态方法
          setLoading: (type: 'page' | 'content' | 'filters', loading: boolean) => {
            set(
              (state) => ({
                loading: { ...state.loading, [type]: loading },
              }),
              false,
              'setLoading'
            );
          },
          
          // 重置方法
          resetFilters: () => {
            const state = get();
            set(
              {
                filters: {
                  ...DEFAULT_FILTERS,
                  // 保持配置相关的默认值
                  viewMode: state.config.content.defaultViewMode,
                  itemsPerPage: state.config.content.grid.defaultItemsPerPage,
                  sortBy: state.config.filters.defaultSort.field,
                  sortOrder: state.config.filters.defaultSort.order,
                },
              },
              false,
              'resetFilters'
            );
          },
          
          resetUI: () => {
            const state = get();
            set(
              {
                ui: {
                  ...DEFAULT_UI,
                  viewMode: state.config.content.defaultViewMode,
                  sidebarOpen: state.config.navigation.sidebar.enabled && !state.config.navigation.sidebar.defaultCollapsed,
                },
              },
              false,
              'resetUI'
            );
          },
          
          resetAll: () => {
            const state = get();
            set(
              {
                config: DEFAULT_PAGE_CONFIG,
                data: undefined,
                filters: DEFAULT_FILTERS,
                loading: DEFAULT_LOADING,
                error: DEFAULT_ERROR,
                ui: DEFAULT_UI,
                meta: {
                  lastUpdated: null,
                  dataSource: 'mock',
                  retryCount: 0,
                  isInitialized: false,
                  urlSyncEnabled: true,
                  lastUrlSync: null,
                  isSyncingUrl: false,
                },
                // 保留操作方法
                actions: state.actions,
              },
              false,
              'resetAll'
            );
          },
          
          // URL状态同步方法
          syncFromURL: (params: BrowsablePageURLParams) => {
            const {
              slug = null,
              q = '',
              category = null,
              tags = '',
              sort = null,
              order = 'desc',
              page = 1,
              limit = 12,
              view = 'grid',
              featured = false,
              rating = 0,
              ads = true,
            } = params;
            
            const state = get();
            
            // 防止在URL同步过程中重复处理
            if (state.meta.isSyncingUrl) {
              return;
            }
            
            set(
              (current) => ({
                meta: {
                  ...current.meta,
                  isSyncingUrl: true,
                },
              }),
              false,
              'syncFromURL:start'
            );
            
            try {
              // 处理标签：逗号分隔的字符串转换为数组
              const tagsArray = typeof tags === 'string' && tags.trim() 
                ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
                : [];
              
              // 验证和清理参数
              const cleanedParams = {
                entityId: slug || null,
                search: typeof q === 'string' ? q : '',
                categoryId: category || null,
                selectedTags: tagsArray,
                sortBy: (sort && Object.values(['created_at', 'updated_at', 'name', 'rating', 'visits']).includes(sort) 
                  ? sort : state.config.filters.defaultSort.field) as SortField,
                sortOrder: (order === 'asc' || order === 'desc' ? order : state.config.filters.defaultSort.order) as SortOrder,
                currentPage: Math.max(1, parseInt(String(page)) || 1),
                itemsPerPage: Math.max(1, Math.min(100, parseInt(String(limit)) || state.config.content.grid.defaultItemsPerPage)),
                viewMode: (view === 'grid' || view === 'list' ? view : state.config.content.defaultViewMode) as 'grid' | 'list',
                featuredOnly: Boolean(featured),
                minRating: Math.max(0, Math.min(5, parseInt(String(rating)) || 0)),
                includeAds: ads !== 'false' ? true : false, // 默认包含广告
              };
              
              set(
                (current) => ({
                  filters: {
                    ...current.filters,
                    ...cleanedParams,
                  },
                  ui: {
                    ...current.ui,
                    viewMode: cleanedParams.viewMode,
                  },
                  meta: {
                    ...current.meta,
                    isInitialized: true,
                    lastUrlSync: new Date().toISOString(),
                    isSyncingUrl: false,
                  },
                }),
                false,
                'syncFromURL:success'
              );
              
              // 如果有entityId且数据未加载，则加载数据
              if (cleanedParams.entityId && !state.data) {
                setTimeout(() => {
                  get().actions.loadData(cleanedParams.entityId!);
                }, 100);
              } else if (cleanedParams.entityId !== state.filters.entityId || 
                        cleanedParams.search !== state.filters.search ||
                        cleanedParams.categoryId !== state.filters.categoryId ||
                        JSON.stringify(cleanedParams.selectedTags) !== JSON.stringify(state.filters.selectedTags)) {
                // 如果关键筛选参数发生变化，重新加载数据
                setTimeout(() => {
                  get().actions.refreshData();
                }, 100);
              }
              
            } catch (error) {
              console.error('Error syncing from URL:', error);
              
              set(
                (current) => ({
                  meta: {
                    ...current.meta,
                    isSyncingUrl: false,
                  },
                  error: {
                    ...current.error,
                    page: 'URL参数格式错误，已回退到默认状态',
                  },
                }),
                false,
                'syncFromURL:error'
              );
            }
          },
          
          syncToURL: () => {
            const state = get();
            const { filters, config } = state;
            
            // 构建URL参数对象，只包含非默认值
            const urlParams: BrowsablePageURLParams = {};
            
            // Entity slug
            if (filters.entityId) {
              urlParams.slug = filters.entityId;
            }
            
            // Search query
            if (filters.search && filters.search.trim()) {
              urlParams.q = filters.search.trim();
            }
            
            // Category filter
            if (filters.categoryId) {
              urlParams.category = filters.categoryId;
            }
            
            // Tags filter (逗号分隔)
            if (filters.selectedTags && filters.selectedTags.length > 0) {
              urlParams.tags = filters.selectedTags.join(',');
            }
            
            // Sort parameters (只有非默认值时才添加)
            if (filters.sortBy !== config.filters.defaultSort.field) {
              urlParams.sort = filters.sortBy;
            }
            if (filters.sortOrder !== config.filters.defaultSort.order) {
              urlParams.order = filters.sortOrder;
            }
            
            // View mode (只有非默认值时才添加)
            if (filters.viewMode !== config.content.defaultViewMode) {
              urlParams.view = filters.viewMode;
            }
            
            // Pagination (只有非第一页时才添加页码)
            if (filters.currentPage && filters.currentPage > 1) {
              urlParams.page = filters.currentPage.toString();
            }
            
            // Items per page (只有非默认值时才添加)
            if (filters.itemsPerPage && filters.itemsPerPage !== config.content.grid.defaultItemsPerPage) {
              urlParams.limit = filters.itemsPerPage.toString();
            }
            
            // Advanced filters (只有非默认值时才添加)
            if (filters.featuredOnly) {
              urlParams.featured = 'true';
            }
            
            if (filters.minRating && filters.minRating > 0) {
              urlParams.rating = filters.minRating.toString();
            }
            
            if (!filters.includeAds) {
              urlParams.ads = 'false';
            }
            
            return urlParams;
          },
          
          enableUrlSync: () => {
            set(
              (state) => ({
                meta: {
                  ...state.meta,
                  urlSyncEnabled: true,
                },
              }),
              false,
              'enableUrlSync'
            );
          },
          
          disableUrlSync: () => {
            set(
              (state) => ({
                meta: {
                  ...state.meta,
                  urlSyncEnabled: false,
                },
              }),
              false,
              'disableUrlSync'
            );
          },
          
          handleUrlChange: async (newParams: BrowsablePageURLParams) => {
            const state = get();
            
            // 如果URL同步被禁用，跳过处理
            if (!state.meta.urlSyncEnabled) {
              return;
            }
            
            try {
              // 将URL参数格式转换为内部格式
              const internalParams = {
                slug: newParams.slug,
                q: newParams.q,
                category: newParams.category,
                tags: newParams.tags,
                sort: newParams.sort,
                order: newParams.order,
                page: newParams.page ? parseInt(String(newParams.page)) : 1,
                limit: newParams.limit ? parseInt(String(newParams.limit)) : state.config.content.grid.defaultItemsPerPage,
                view: newParams.view,
                featured: newParams.featured === 'true',
                rating: newParams.rating ? parseInt(String(newParams.rating)) : 0,
                ads: newParams.ads !== 'false',
              };
              
              // 同步到store状态
              get().actions.syncFromURL(internalParams);
              
            } catch (error) {
              console.error('Error handling URL change:', error);
              
              set(
                (current) => ({
                  error: {
                    ...current.error,
                    page: 'URL参数处理失败，请检查URL格式',
                  },
                }),
                false,
                'handleUrlChange:error'
              );
            }
          },
          
          handleBrowserNavigation: (direction: 'back' | 'forward') => {
            const state = get();
            
            console.log(`Browser navigation: ${direction}`);
            
            // 浏览器导航时清除错误状态
            if (state.error.page || state.error.content) {
              get().actions.clearError();
            }
            
            // 可以在这里添加导航特定的逻辑
            // 例如：预取数据、更新分析统计等
          },
          
          // 工具方法
          getCurrentEntitySlug: () => {
            const state = get();
            return state.data?.entity.slug || state.filters.entityId || null;
          },
          
          getActiveFiltersCount: () => {
            const { filters } = get();
            return [
              filters.search && filters.search.length > 0,
              filters.categoryId !== null,
              filters.selectedTags && filters.selectedTags.length > 0,
              filters.featuredOnly,
              !filters.includeAds,
              filters.minRating && filters.minRating > 0,
            ].filter(Boolean).length;
          },
          
          hasActiveFilters: () => {
            return get().actions.getActiveFiltersCount() > 0;
          },
        },
      }),
      {
        name: 'browsable-page-store',
        storage: createJSONStorage(() => sessionStorage),
        // 只持久化用户偏好设置，URL参数通过nuqs管理
        partialize: (state) => ({
          ui: {
            viewMode: state.ui.viewMode,
            sidebarOpen: state.ui.sidebarOpen,
          },
          filters: {
            viewMode: state.filters.viewMode,
            itemsPerPage: state.filters.itemsPerPage,
          },
        }),
      }
    ),
    {
      name: 'browsable-page-store',
    }
  )
);

/**
 * 浏览页面URL状态同步Hook
 * 
 * 使用nuqs管理URL参数，与Zustand store双向同步
 * 专门针对浏览页面的URL状态管理需求
 */
export function useBrowsablePageUrlSync() {
  const store = useBrowsablePageStore();
  const { actions } = store;
  
  // 使用nuqs管理所有浏览页面URL参数
  const [urlState, setUrlState] = useQueryStates(browsablePageParamsParsers);
  
  // 从URL更新store状态 (组件首次加载时调用)
  const syncStoreFromUrl = () => {
    // 转换 urlState 以匹配 BrowsablePageURLParams 类型
    const params: BrowsablePageURLParams = {
      ...urlState,
      order: urlState.order === 'asc' || urlState.order === 'desc' ? urlState.order : undefined,
      view: urlState.view === 'grid' || urlState.view === 'list' ? urlState.view : undefined,
    };
    actions.syncFromURL(params);
  };
  
  // 从store更新URL状态 (状态变更时调用)
  const syncUrlFromStore = () => {
    const browsablePageUrlState: BrowsablePageURLParams = {
      slug: store.actions.getCurrentEntitySlug() || undefined,
      q: store.filters.search || undefined,
      category: store.filters.categoryId || undefined,
      tags: store.filters.selectedTags && store.filters.selectedTags.length > 0 
        ? store.filters.selectedTags.join(',') : undefined,
      sort: store.filters.sortBy !== store.config.filters.defaultSort.field ? store.filters.sortBy : undefined,
      order: store.filters.sortOrder !== store.config.filters.defaultSort.order ? store.filters.sortOrder : undefined,
      page: store.filters.currentPage && store.filters.currentPage > 1 ? store.filters.currentPage : undefined,
      limit: store.filters.itemsPerPage !== store.config.content.grid.defaultItemsPerPage ? store.filters.itemsPerPage : undefined,
      view: store.filters.viewMode !== store.config.content.defaultViewMode ? store.filters.viewMode : undefined,
      featured: store.filters.featuredOnly || undefined,
      rating: store.filters.minRating && store.filters.minRating > 0 ? store.filters.minRating : undefined,
      ads: !store.filters.includeAds ? store.filters.includeAds : undefined,
    };
    
    // 转换类型以匹配 nuqs 的期望格式
    setUrlState({
      slug: browsablePageUrlState.slug || null,
      q: browsablePageUrlState.q || null,
      category: browsablePageUrlState.category || null,
      tags: browsablePageUrlState.tags || null,
      sort: browsablePageUrlState.sort || null,
      order: browsablePageUrlState.order || null,
      page: typeof browsablePageUrlState.page === 'number' ? browsablePageUrlState.page : null,
      limit: typeof browsablePageUrlState.limit === 'number' ? browsablePageUrlState.limit : null,
      view: browsablePageUrlState.view || null,
      featured: typeof browsablePageUrlState.featured === 'boolean' ? browsablePageUrlState.featured : null,
      rating: typeof browsablePageUrlState.rating === 'number' ? browsablePageUrlState.rating : null,
      ads: typeof browsablePageUrlState.ads === 'boolean' ? browsablePageUrlState.ads : null,
    });
  };
  
  return {
    urlState,
    setUrlState,
    syncStoreFromUrl,
    syncUrlFromStore,
  };
}

/**
 * 浏览页面筛选状态Hook
 * 
 * 提供筛选相关的状态和操作方法
 */
export function useBrowsablePageFilters() {
  const { filters, config, actions } = useBrowsablePageStore();
  
  return {
    // 当前筛选状态
    search: filters.search,
    categoryId: filters.categoryId,
    selectedTags: filters.selectedTags || [],
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    featuredOnly: filters.featuredOnly,
    includeAds: filters.includeAds,
    minRating: filters.minRating,
    
    // 计算属性
    activeFiltersCount: actions.getActiveFiltersCount(),
    hasActiveFilters: actions.hasActiveFilters(),
    
    // 配置信息
    searchEnabled: config.filters.searchEnabled,
    categoryEnabled: config.filters.categoryEnabled,
    tagEnabled: config.filters.tagEnabled,
    sortEnabled: config.filters.sortEnabled,
    availableSorts: config.filters.availableSorts,
    
    // 筛选操作方法
    updateFilters: actions.updateFilters,
    setSearch: actions.setSearch,
    setCategory: actions.setCategory,
    setTags: actions.setTags,
    setSorting: actions.setSorting,
    clearFilters: actions.clearFilters,
    resetFilters: actions.resetFilters,
  };
}

/**
 * 浏览页面分页状态Hook
 * 
 * 提供分页相关的状态和操作方法
 */
export function useBrowsablePagePagination() {
  const { filters, data, loading, actions } = useBrowsablePageStore();
  
  const pagination = data?.websites.pagination || {
    currentPage: filters.currentPage || 1,
    itemsPerPage: filters.itemsPerPage || 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  
  return {
    // 分页状态
    currentPage: pagination.currentPage,
    itemsPerPage: pagination.itemsPerPage,
    totalPages: pagination.totalPages,
    totalItems: data?.websites.totalCount || 0,
    
    // 分页状态计算
    hasNextPage: pagination.hasNextPage,
    hasPreviousPage: pagination.hasPrevPage,
    isFirstPage: pagination.currentPage === 1,
    isLastPage: pagination.currentPage === pagination.totalPages,
    
    // 分页操作方法
    setPage: actions.setPage,
    setItemsPerPage: actions.setItemsPerPage,
    goToNext: actions.goToNextPage,
    goToPrevious: actions.goToPreviousPage,
    resetPagination: actions.resetPagination,
    
    // UI状态
    isLoading: loading.content,
  };
}

/**
 * 浏览页面UI状态Hook
 * 
 * 提供UI相关的状态和操作方法
 */
export function useBrowsablePageUI() {
  const { ui, config, actions } = useBrowsablePageStore();
  
  return {
    // UI状态
    sidebarOpen: ui.sidebarOpen,
    mobileFiltersOpen: ui.mobileFiltersOpen,
    viewMode: ui.viewMode,
    
    // 配置信息
    sidebarEnabled: config.navigation.sidebar.enabled,
    sidebarCollapsible: config.navigation.sidebar.collapsible,
    viewModeToggleEnabled: config.content.viewModeToggle,
    
    // UI操作方法
    setSidebarOpen: actions.setSidebarOpen,
    setMobileFiltersOpen: actions.setMobileFiltersOpen,
    setViewMode: actions.setViewMode,
    resetUI: actions.resetUI,
    
    // 便捷方法
    toggleSidebar: () => actions.setSidebarOpen(!ui.sidebarOpen),
    toggleMobileFilters: () => actions.setMobileFiltersOpen(!ui.mobileFiltersOpen),
    toggleViewMode: () => actions.setViewMode(ui.viewMode === 'grid' ? 'list' : 'grid'),
  };
}

/**
 * 浏览页面数据管理Hook
 * 
 * 提供数据加载和错误处理相关功能
 */
export function useBrowsablePageData() {
  const { data, loading, error, meta, actions } = useBrowsablePageStore();
  
  return {
    // 数据状态
    data,
    entity: data?.entity,
    websites: data?.websites.items || [],
    filterOptions: data?.filterOptions,
    breadcrumbs: data?.breadcrumbs || [],
    
    // 加载和错误状态
    loading,
    error,
    isLoading: loading.page || loading.content,
    isInitialized: meta.isInitialized,
    retryCount: meta.retryCount,
    lastUpdated: meta.lastUpdated,
    dataSource: meta.dataSource,
    
    // 数据操作方法
    loadData: actions.loadData,
    refreshData: actions.refreshData,
    retryLoad: actions.retryLoad,
    setError: actions.setError,
    clearError: actions.clearError,
    setLoading: actions.setLoading,
    
    // 工具方法
    getCurrentEntitySlug: actions.getCurrentEntitySlug,
  };
}

/**
 * 浏览页面配置管理Hook
 * 
 * 提供配置相关的状态和操作方法
 */
export function useBrowsablePageConfig() {
  const { config, actions } = useBrowsablePageStore();
  
  return {
    // 配置状态
    config,
    pageType: config.pageType,
    
    // 配置操作方法
    setConfig: actions.setConfig,
    updateConfig: actions.updateConfig,
    
    // 便捷访问方法
    isCollectionPage: () => config.pageType === 'collection',
    isCategoryPage: () => config.pageType === 'category',
    isTagPage: () => config.pageType === 'tag',
  };
}

// 默认导出store hook
/**
 * Advanced URL synchronization hook with automatic error recovery
 * 
 * 提供高级URL状态管理功能，包括自动错误恢复、状态验证和性能优化
 */
export function useBrowsablePageUrlSyncWithRecovery() {
  const basicSync = useBrowsablePageUrlSync();
  const store = useBrowsablePageStore();
  const { actions } = store;
  
  // 错误恢复计数器
  const errorCountRef = useRef(0);
  const maxRetries = 3;
  
  // 带错误恢复的URL同步方法
  const syncWithRecovery = useCallback(async (direction: 'toUrl' | 'fromUrl' = 'toUrl') => {
    try {
      if (direction === 'toUrl') {
        basicSync.syncUrlFromStore();
      } else {
        basicSync.syncStoreFromUrl();
      }
      
      // 同步成功，重置错误计数
      errorCountRef.current = 0;
      
    } catch (error) {
      console.error('URL sync error:', error);
      errorCountRef.current += 1;
      
      // 如果错误次数超过限制，禁用URL同步并显示错误
      if (errorCountRef.current >= maxRetries) {
        actions.disableUrlSync();
        actions.setError('page', 'URL状态同步失败，已切换到离线模式。请刷新页面重试。');
        return;
      }
      
      // 等待一段时间后重试
      setTimeout(() => {
        if (errorCountRef.current < maxRetries) {
          syncWithRecovery(direction);
        }
      }, 1000 * errorCountRef.current); // 递增延迟重试
    }
  }, [basicSync, actions]);
  
  // 智能初始化：检测URL参数合法性
  const smartInitialize = useCallback(() => {
    const { urlState } = basicSync;
    
    // 检查URL参数的基本合法性
    const hasValidParams = Object.entries(urlState).some(([key, value]) => {
      if (!value) return false;
      
      // 基本格式验证
      switch (key) {
        case 'page':
          return !isNaN(Number(value)) && Number(value) > 0;
        case 'limit':
          return !isNaN(Number(value)) && Number(value) > 0 && Number(value) <= 100;
        case 'rating':
          return !isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 5;
        case 'view':
          return ['grid', 'list'].includes(value as string);
        case 'order':
          return ['asc', 'desc'].includes(value as string);
        case 'featured':
        case 'ads':
          return ['true', 'false'].includes(value as string);
        default:
          return true; // 其他参数暂时不验证
      }
    });
    
    if (hasValidParams) {
      // URL参数看起来合法，从URL初始化
      syncWithRecovery('fromUrl');
    } else {
      // URL参数无效或为空，使用默认状态并清理URL
      actions.resetFilters();
      basicSync.setUrlState({});
    }
  }, [basicSync, actions, syncWithRecovery]);
  
  return {
    ...basicSync,
    
    // 增强的同步方法
    syncWithRecovery,
    smartInitialize,
    
    // 错误状态
    errorCount: errorCountRef.current,
    canRetry: errorCountRef.current < maxRetries,
    
    // 工具方法
    resetErrors: () => {
      errorCountRef.current = 0;
      actions.enableUrlSync();
      actions.clearError('page');
    },
  };
}

// 默认导出store hook
export default useBrowsablePageStore;