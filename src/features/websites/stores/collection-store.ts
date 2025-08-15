/**
 * Collection Index Page State Management Store
 * 
 * 基于Zustand创建集合索引页面状态管理，支持分页导航、搜索筛选、数据加载和错误处理
 * 集成nuqs实现URL状态同步，支持浏览器前进后退和链接分享功能
 * 复用homepage-store.ts的成熟模式，确保一致性和可靠性
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  parseAsString, 
  parseAsInteger, 
  parseAsArrayOf,
  parseAsBoolean,
  useQueryState,
  useQueryStates
} from 'nuqs';
import { 
  Collection,
  CollectionState,
  CollectionStatus,
  CollectionSearchParams,
  DEFAULT_COLLECTION_STATE 
} from '../types/collection';
import { 
  getMockCollections,
  searchMockCollections,
  filterMockCollectionsByStatus,
  filterMockCollectionsByTags,
  getAllMockCollectionTags
} from '../data/mockCollections';

/**
 * 集合页面URL搜索参数解析器配置
 * 支持集合索引页面的完整URL状态管理，与collection类型定义保持一致
 */
export const collectionSearchParamsParsers = {
  // 搜索查询
  search: parseAsString,
  
  // 分页参数
  page: parseAsInteger,
  limit: parseAsInteger,
  
  // 状态筛选 (逗号分隔的状态值)
  status: parseAsString,
  
  // 标签筛选 (逗号分隔的标签)
  tags: parseAsString,
  
  // 排序参数
  sortBy: parseAsString,
  sortOrder: parseAsString,
  
  // 视图设置
  view: parseAsString,              // 'grid' | 'list' | 'compact'
  groupBy: parseAsString,           // 'status' | 'tags' | 'createdBy' | 'none'
  showPreview: parseAsBoolean,      // 是否显示集合预览
  
  // 高级筛选
  dateFrom: parseAsString,          // 创建日期范围开始
  dateTo: parseAsString,            // 创建日期范围结束
  createdBy: parseAsString,         // 创建者筛选
} as const;

/**
 * 集合页面完整状态接口
 * 继承CollectionState基础结构，扩展操作方法和UI状态
 */
export interface CollectionPageState extends CollectionState {
  // UI状态
  ui: {
    /** 数据加载状态 */
    isLoading: boolean;
    /** 初始化状态 */
    isInitialized: boolean;
    /** 重试计数 */
    retryCount: number;
  };
  
  // 元数据
  meta: {
    /** 上次数据更新时间 */
    lastUpdated: string | null;
    /** 可用的所有标签列表 */
    availableTags: string[];
    /** 数据来源标识 */
    dataSource: 'mock' | 'api';
  };
  
  // 操作方法
  actions: {
    // 数据加载方法
    loadCollections: () => Promise<void>;
    refreshCollections: () => Promise<void>;
    
    // 搜索方法
    setSearchQuery: (query: string) => void;
    clearSearch: () => void;
    
    // 分页方法
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (limit: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    
    // 筛选方法
    setStatusFilter: (statuses: CollectionStatus[]) => void;
    setTagsFilter: (tags: string[]) => void;
    setDateRangeFilter: (from: string, to: string) => void;
    clearFilters: () => void;
    
    // 排序方法
    setSorting: (sortBy: NonNullable<CollectionState['sorting']>['sortBy'], sortOrder: NonNullable<CollectionState['sorting']>['sortOrder']) => void;
    
    // 视图设置方法
    setViewMode: (mode: NonNullable<CollectionState['viewSettings']>['viewMode']) => void;
    setGroupBy: (groupBy: NonNullable<CollectionState['viewSettings']>['groupBy']) => void;
    setShowPreview: (show: boolean) => void;
    
    // 错误处理方法
    setError: (error: string | null) => void;
    clearError: () => void;
    retryLoad: () => Promise<void>;
    
    // 重置方法
    resetPagination: () => void;
    resetFilters: () => void;
    resetViewSettings: () => void;
    resetAll: () => void;
    
    // URL同步方法
    syncFromURL: (params: Record<string, any>) => void;
    
    // 工具方法
    getFilteredCollections: () => Collection[];
    getTotalFilteredCount: () => number;
  };
}

/**
 * 默认分页状态
 */
const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 12,
};

/**
 * 创建集合页面状态管理Store
 * 使用与homepage-store相同的中间件配置，确保一致的开发体验
 */
export const useCollectionStore = create<CollectionPageState>()(
  devtools(
    persist(
      (set, get) => ({
        // 基础数据初始化
        collections: [],
        loading: false,
        error: null,
        
        // 分页状态初始化
        pagination: DEFAULT_PAGINATION,
        
        // 搜索查询初始化
        searchQuery: '',
        
        // 筛选条件初始化
        filters: {
          status: undefined,
          tags: undefined,
          dateRange: undefined,
          createdBy: undefined,
        },
        
        // 排序配置初始化
        sorting: {
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
        },
        
        // 视图设置初始化
        viewSettings: {
          viewMode: 'grid' as const,
          groupBy: 'none' as const,
          showPreview: true,
        },
        
        // UI状态初始化
        ui: {
          isLoading: false,
          isInitialized: false,
          retryCount: 0,
        },
        
        // 元数据初始化
        meta: {
          lastUpdated: null,
          availableTags: [],
          dataSource: 'mock',
        },
        
        // 操作方法实现
        actions: {
          // 数据加载方法
          loadCollections: async () => {
            const state = get();
            
            // 防止重复加载
            if (state.ui.isLoading) return;
            
            set(
              (current) => ({
                ui: { ...current.ui, isLoading: true },
                error: null,
              }),
              false,
              'loadCollections:start'
            );
            
            try {
              // 模拟网络请求延迟
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // 获取当前筛选条件
              const { searchQuery, filters, sorting } = state;
              
              // 应用筛选和搜索
              let collections = getMockCollections();
              
              // 搜索筛选
              if (searchQuery && searchQuery.trim()) {
                collections = searchMockCollections(searchQuery.trim());
              }
              
              // 状态筛选
              if (filters?.status && filters.status.length > 0) {
                collections = collections.filter(collection => 
                  filters.status!.includes(collection.status)
                );
              }
              
              // 标签筛选
              if (filters?.tags && filters.tags.length > 0) {
                collections = filterMockCollectionsByTags(filters.tags);
              }
              
              // 日期范围筛选
              if (filters?.dateRange?.from || filters?.dateRange?.to) {
                collections = collections.filter(collection => {
                  const createdDate = new Date(collection.createdAt);
                  if (filters.dateRange?.from && createdDate < new Date(filters.dateRange.from)) {
                    return false;
                  }
                  if (filters.dateRange?.to && createdDate > new Date(filters.dateRange.to)) {
                    return false;
                  }
                  return true;
                });
              }
              
              // 创建者筛选
              if (filters?.createdBy) {
                collections = collections.filter(collection => 
                  collection.createdBy === filters.createdBy
                );
              }
              
              // 排序应用
              if (sorting && sorting.sortBy && sorting.sortOrder) {
                collections.sort((a, b) => {
                  let aValue: any, bValue: any;
                  
                  switch (sorting.sortBy) {
                    case 'title':
                      aValue = a.title.toLowerCase();
                      bValue = b.title.toLowerCase();
                      break;
                    case 'websiteCount':
                      aValue = a.websiteCount;
                      bValue = b.websiteCount;
                      break;
                    case 'createdAt':
                      aValue = new Date(a.createdAt);
                      bValue = new Date(b.createdAt);
                      break;
                    case 'updatedAt':
                      aValue = new Date(a.updatedAt);
                      bValue = new Date(b.updatedAt);
                      break;
                    case 'sortOrder':
                      aValue = a.sortOrder || 999;
                      bValue = b.sortOrder || 999;
                      break;
                    default:
                      aValue = a.createdAt;
                      bValue = b.createdAt;
                  }
                  
                  if (aValue < bValue) {
                    return sorting.sortOrder === 'asc' ? -1 : 1;
                  }
                  if (aValue > bValue) {
                    return sorting.sortOrder === 'asc' ? 1 : -1;
                  }
                  return 0;
                });
              }
              
              // 计算分页
              const totalItems = collections.length;
              const totalPages = Math.ceil(totalItems / state.pagination.itemsPerPage);
              const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
              const endIndex = startIndex + state.pagination.itemsPerPage;
              const paginatedCollections = collections.slice(startIndex, endIndex);
              
              // 获取可用标签
              const availableTags = getAllMockCollectionTags();
              
              set(
                (current) => ({
                  collections: paginatedCollections,
                  pagination: {
                    ...current.pagination,
                    totalItems,
                    totalPages,
                  },
                  ui: {
                    ...current.ui,
                    isLoading: false,
                    isInitialized: true,
                    retryCount: 0,
                  },
                  meta: {
                    ...current.meta,
                    lastUpdated: new Date().toISOString(),
                    availableTags,
                    dataSource: 'mock',
                  },
                  error: null,
                }),
                false,
                'loadCollections:success'
              );
              
            } catch (error) {
              console.error('Failed to load collections:', error);
              
              set(
                (current) => ({
                  ui: {
                    ...current.ui,
                    isLoading: false,
                    retryCount: current.ui.retryCount + 1,
                  },
                  error: error instanceof Error ? error.message : '加载集合数据失败，请稍后重试',
                }),
                false,
                'loadCollections:error'
              );
            }
          },
          
          refreshCollections: async () => {
            const { actions } = get();
            await actions.loadCollections();
          },
          
          // 搜索方法
          setSearchQuery: (query: string) => {
            set(
              (state) => ({
                searchQuery: query,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setSearchQuery'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          clearSearch: () => {
            set(
              (state) => ({
                searchQuery: '',
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'clearSearch'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          // 分页方法
          setCurrentPage: (page: number) => {
            const state = get();
            if (page < 1 || page > state.pagination.totalPages) return;
            
            set(
              (current) => ({
                pagination: { ...current.pagination, currentPage: page },
              }),
              false,
              'setCurrentPage'
            );
            
            // 重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          setItemsPerPage: (limit: number) => {
            if (limit < 1 || limit > 100) return;
            
            set(
              (state) => ({
                pagination: { 
                  ...state.pagination, 
                  itemsPerPage: limit,
                  currentPage: 1  // 重置到第一页
                },
              }),
              false,
              'setItemsPerPage'
            );
            
            // 重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          goToNextPage: () => {
            const state = get();
            if (state.pagination.currentPage < state.pagination.totalPages) {
              get().actions.setCurrentPage(state.pagination.currentPage + 1);
            }
          },
          
          goToPreviousPage: () => {
            const state = get();
            if (state.pagination.currentPage > 1) {
              get().actions.setCurrentPage(state.pagination.currentPage - 1);
            }
          },
          
          // 筛选方法
          setStatusFilter: (statuses: CollectionStatus[]) => {
            set(
              (state) => ({
                filters: {
                  ...state.filters,
                  status: statuses.length > 0 ? statuses : undefined,
                },
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setStatusFilter'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          setTagsFilter: (tags: string[]) => {
            set(
              (state) => ({
                filters: {
                  ...state.filters,
                  tags: tags.length > 0 ? tags : undefined,
                },
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setTagsFilter'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          setDateRangeFilter: (from: string, to: string) => {
            set(
              (state) => ({
                filters: {
                  ...state.filters,
                  dateRange: (from || to) ? { from, to } : undefined,
                },
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setDateRangeFilter'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          clearFilters: () => {
            set(
              (state) => ({
                searchQuery: '',
                filters: {
                  status: undefined,
                  tags: undefined,
                  dateRange: undefined,
                  createdBy: undefined,
                },
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'clearFilters'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          // 排序方法
          setSorting: (sortBy, sortOrder) => {
            set(
              (state) => ({
                sorting: { sortBy, sortOrder },
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setSorting'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          // 视图设置方法
          setViewMode: (mode) => {
            set(
              (state) => ({
                viewSettings: {
                  ...state.viewSettings,
                  viewMode: mode,
                } as CollectionState['viewSettings'],
              }),
              false,
              'setViewMode'
            );
          },
          
          setGroupBy: (groupBy) => {
            set(
              (state) => ({
                viewSettings: {
                  ...state.viewSettings,
                  groupBy,
                } as CollectionState['viewSettings'],
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setGroupBy'
            );
            
            // 如果分组发生变化，重新加载数据
            setTimeout(() => get().actions.loadCollections(), 100);
          },
          
          setShowPreview: (show) => {
            set(
              (state) => ({
                viewSettings: {
                  ...state.viewSettings,
                  showPreview: show,
                } as CollectionState['viewSettings'],
              }),
              false,
              'setShowPreview'
            );
          },
          
          // 错误处理方法
          setError: (error) => {
            set(
              { error },
              false,
              'setError'
            );
          },
          
          clearError: () => {
            set(
              { error: null },
              false,
              'clearError'
            );
          },
          
          retryLoad: async () => {
            const state = get();
            if (state.ui.retryCount < 3) {  // 最多重试3次
              await get().actions.loadCollections();
            }
          },
          
          // 重置方法
          resetPagination: () => {
            set(
              { pagination: DEFAULT_PAGINATION },
              false,
              'resetPagination'
            );
          },
          
          resetFilters: () => {
            set(
              (state) => ({
                searchQuery: '',
                filters: {
                  status: undefined,
                  tags: undefined,
                  dateRange: undefined,
                  createdBy: undefined,
                },
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'resetFilters'
            );
          },
          
          resetViewSettings: () => {
            set(
              {
                viewSettings: {
                  viewMode: 'grid',
                  groupBy: 'none',
                  showPreview: true,
                },
              },
              false,
              'resetViewSettings'
            );
          },
          
          resetAll: () => {
            set(
              {
                // 基础数据重置
                collections: [],
                loading: false,
                error: null,
                
                // 分页状态重置
                pagination: DEFAULT_PAGINATION,
                
                // 搜索查询重置
                searchQuery: '',
                
                // 筛选条件重置
                filters: {
                  status: undefined,
                  tags: undefined,
                  dateRange: undefined,
                  createdBy: undefined,
                },
                
                // 排序配置重置
                sorting: {
                  sortBy: 'createdAt' as const,
                  sortOrder: 'desc' as const,
                },
                
                // 视图设置重置
                viewSettings: {
                  viewMode: 'grid' as const,
                  groupBy: 'none' as const,
                  showPreview: true,
                },
                
                // UI状态重置
                ui: {
                  isLoading: false,
                  isInitialized: false,
                  retryCount: 0,
                },
                
                // 保留元数据
                meta: get().meta,
                
                // 保留操作方法
                actions: get().actions,
              },
              false,
              'resetAll'
            );
          },
          
          // URL同步方法
          syncFromURL: (params: Record<string, any>) => {
            const {
              search = '',
              page = 1,
              limit = 12,
              status = '',
              tags = '',
              sortBy = 'createdAt',
              sortOrder = 'desc',
              view = 'grid',
              groupBy = 'none',
              showPreview = true,
              dateFrom = null,
              dateTo = null,
              createdBy = null,
            } = params;
            
            // 处理状态筛选：逗号分隔的状态值
            const statusArray = typeof status === 'string' && status.trim() 
              ? status.split(',').map(s => s.trim()).filter(Boolean) as CollectionStatus[]
              : [];
            
            // 处理标签筛选：逗号分隔的标签
            const tagsArray = typeof tags === 'string' && tags.trim() 
              ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
              : [];
            
            set(
              (state) => ({
                searchQuery: search,
                pagination: {
                  ...state.pagination,
                  currentPage: Math.max(1, parseInt(String(page)) || 1),
                  itemsPerPage: Math.max(1, Math.min(100, parseInt(String(limit)) || 12)),
                },
                filters: {
                  status: statusArray.length > 0 ? statusArray : undefined,
                  tags: tagsArray.length > 0 ? tagsArray : undefined,
                  dateRange: (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined,
                  createdBy: createdBy || undefined,
                },
                sorting: {
                  sortBy: sortBy as NonNullable<CollectionState['sorting']>['sortBy'],
                  sortOrder: sortOrder as NonNullable<CollectionState['sorting']>['sortOrder'],
                },
                viewSettings: {
                  viewMode: view as NonNullable<CollectionState['viewSettings']>['viewMode'],
                  groupBy: groupBy as NonNullable<CollectionState['viewSettings']>['groupBy'],
                  showPreview: Boolean(showPreview),
                },
              }),
              false,
              'syncFromURL'
            );
          },
          
          // 工具方法
          getFilteredCollections: () => {
            // 返回当前页面的集合数据，已经过筛选和分页处理
            return get().collections;
          },
          
          getTotalFilteredCount: () => {
            return get().pagination.totalItems;
          },
        },
      }),
      {
        name: 'collection-store',
        storage: createJSONStorage(() => sessionStorage),
        // 只持久化用户偏好设置，URL参数通过nuqs管理
        partialize: (state) => ({
          viewSettings: {
            viewMode: state.viewSettings?.viewMode,
            showPreview: state.viewSettings?.showPreview,
            groupBy: state.viewSettings?.groupBy,
          },
          meta: {
            availableTags: state.meta.availableTags,
          },
        }),
      }
    ),
    {
      name: 'collection-store',
    }
  )
);

/**
 * 集合页面URL状态同步Hook
 * 
 * 使用nuqs管理URL参数，与Zustand store双向同步
 * 专门针对集合页面的URL状态管理需求
 */
export function useCollectionUrlSync() {
  const store = useCollectionStore();
  const { actions } = store;
  
  // 使用nuqs管理所有集合页面URL参数
  const [urlState, setUrlState] = useQueryStates(collectionSearchParamsParsers);
  
  // 从URL更新store状态 (组件首次加载时调用)
  const syncStoreFromUrl = () => {
    actions.syncFromURL(urlState);
  };
  
  // 从store更新URL状态 (状态变更时调用)
  const syncUrlFromStore = () => {
    const collectionUrlState: Record<string, any> = {
      search: store.searchQuery || undefined,
      page: store.pagination.currentPage > 1 ? store.pagination.currentPage : undefined,
      limit: store.pagination.itemsPerPage !== 12 ? store.pagination.itemsPerPage : undefined,
      status: store.filters?.status?.length ? store.filters.status.join(',') : undefined,
      tags: store.filters?.tags?.length ? store.filters.tags.join(',') : undefined,
      sortBy: store.sorting?.sortBy !== 'createdAt' ? store.sorting?.sortBy : undefined,
      sortOrder: store.sorting?.sortOrder !== 'desc' ? store.sorting?.sortOrder : undefined,
      view: store.viewSettings?.viewMode !== 'grid' ? store.viewSettings?.viewMode : undefined,
      groupBy: store.viewSettings?.groupBy !== 'none' ? store.viewSettings?.groupBy : undefined,
      showPreview: !store.viewSettings?.showPreview ? store.viewSettings?.showPreview : undefined,
      dateFrom: store.filters?.dateRange?.from || undefined,
      dateTo: store.filters?.dateRange?.to || undefined,
      createdBy: store.filters?.createdBy || undefined,
    };
    
    setUrlState(collectionUrlState);
  };
  
  return {
    urlState,
    setUrlState,
    syncStoreFromUrl,
    syncUrlFromStore,
  };
}

/**
 * 集合分页状态Hook
 * 
 * 提供分页相关的状态和操作方法，支持分页导航需求
 */
export function useCollectionPagination() {
  const { pagination, actions, ui } = useCollectionStore();
  
  return {
    ...pagination,
    
    // 分页状态计算
    hasNextPage: pagination.currentPage < pagination.totalPages,
    hasPreviousPage: pagination.currentPage > 1,
    isFirstPage: pagination.currentPage === 1,
    isLastPage: pagination.currentPage === pagination.totalPages,
    
    // 分页操作方法
    setPage: actions.setCurrentPage,
    setItemsPerPage: actions.setItemsPerPage,
    goToNext: actions.goToNextPage,
    goToPrevious: actions.goToPreviousPage,
    resetPagination: actions.resetPagination,
    
    // UI状态
    isLoading: ui.isLoading,
  };
}

/**
 * 集合筛选状态Hook
 * 
 * 提供筛选相关的状态和操作方法
 */
export function useCollectionFilters() {
  const { searchQuery, filters, sorting, actions, meta } = useCollectionStore();
  
  // 计算活跃筛选器数量
  const activeFiltersCount = [
    searchQuery && searchQuery.length > 0,
    filters?.status && filters.status.length > 0,
    filters?.tags && filters.tags.length > 0,
    filters?.dateRange && (filters.dateRange.from || filters.dateRange.to),
    filters?.createdBy,
  ].filter(Boolean).length;
  
  return {
    // 当前筛选状态
    searchQuery,
    statusFilter: filters?.status || [],
    tagsFilter: filters?.tags || [],
    dateRangeFilter: filters?.dateRange,
    createdByFilter: filters?.createdBy,
    sorting,
    
    // 计算属性
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
    availableTags: meta.availableTags,
    
    // 筛选操作方法
    setSearchQuery: actions.setSearchQuery,
    clearSearch: actions.clearSearch,
    setStatusFilter: actions.setStatusFilter,
    setTagsFilter: actions.setTagsFilter,
    setDateRangeFilter: actions.setDateRangeFilter,
    setSorting: actions.setSorting,
    clearFilters: actions.clearFilters,
  };
}

/**
 * 集合视图状态Hook
 * 
 * 提供视图设置相关的状态和操作方法
 */
export function useCollectionView() {
  const { viewSettings, actions } = useCollectionStore();
  
  return {
    ...viewSettings,
    
    // 视图操作方法
    setViewMode: actions.setViewMode,
    setGroupBy: actions.setGroupBy,
    setShowPreview: actions.setShowPreview,
    resetViewSettings: actions.resetViewSettings,
  };
}

/**
 * 集合数据管理Hook
 * 
 * 提供数据加载和错误处理相关功能
 */
export function useCollectionData() {
  const { collections, loading, error, ui, meta, actions } = useCollectionStore();
  
  return {
    // 数据状态
    collections,
    loading,
    error,
    isLoading: ui.isLoading,
    isInitialized: ui.isInitialized,
    retryCount: ui.retryCount,
    lastUpdated: meta.lastUpdated,
    dataSource: meta.dataSource,
    
    // 数据操作方法
    loadCollections: actions.loadCollections,
    refreshCollections: actions.refreshCollections,
    retryLoad: actions.retryLoad,
    setError: actions.setError,
    clearError: actions.clearError,
    
    // 工具方法
    getFilteredCollections: actions.getFilteredCollections,
    getTotalFilteredCount: actions.getTotalFilteredCount,
  };
}

// 默认导出store hook
export default useCollectionStore;