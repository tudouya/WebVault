/**
 * Homepage State Management Store
 * 
 * 使用Zustand创建首页状态管理，支持搜索、筛选、分页和分类导航状态
 * 集成nuqs实现URL状态同步，保证浏览器前进后退和链接分享功能
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  parseAsString, 
  parseAsInteger, 
  parseAsArrayOf,
  parseAsBoolean,
  createSerializer,
  useQueryState,
  useQueryStates
} from 'nuqs';
import { 
  FilterState, 
  SortField,
  SortOrder,
  WebsitePagination,
  Category 
} from '../types';
import { DEFAULT_FILTER_STATE } from '../types/filters';

/**
 * 分页状态接口
 */
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * URL搜索参数解析器配置
 * 临时简化实现以修复构建问题
 */
export const searchParamsParsers = {
  // 搜索查询
  search: parseAsString,
  
  // 分类筛选
  category: parseAsString,
  
  // 标签筛选 (JSON数组) - 临时使用字符串实现
  tags: parseAsString,
  
  // 排序字段
  sortBy: parseAsString,
  
  // 排序方向
  sortOrder: parseAsString,
  
  // 分页
  page: parseAsInteger,
  limit: parseAsInteger,
  
  // 高级筛选
  featured: parseAsBoolean,
  includeAds: parseAsBoolean,
  minRating: parseAsInteger,
} as const;

/**
 * 首页状态接口
 */
export interface HomepageState extends FilterState {
  // 分页状态
  pagination: PaginationState;
  
  // 分类导航状态
  categoryNavigation: {
    expandedCategories: string[];
    selectedCategory: string | null;
    categories: Category[];
  };
  
  // 搜索建议状态 (future enhancement)
  searchSuggestions: {
    isLoading: boolean;
    suggestions: string[];
  };
  
  // UI状态
  ui: {
    isLoading: boolean;
    isSidebarCollapsed: boolean;
    viewMode: 'grid' | 'list';
  };
  
  // 状态操作方法
  actions: {
    // 搜索相关
    setSearch: (query: string) => void;
    clearSearch: () => void;
    
    // 分类相关
    setCategory: (categoryId: string | null) => void;
    toggleCategoryExpanded: (categoryId: string) => void;
    
    // 标签相关
    addTag: (tagId: string) => void;
    removeTag: (tagId: string) => void;
    setTags: (tagIds: string[]) => void;
    
    // 排序相关
    setSorting: (field: SortField, order: SortOrder) => void;
    
    // 分页相关
    setPage: (page: number) => void;
    setItemsPerPage: (limit: number) => void;
    updatePagination: (pagination: Partial<PaginationState>) => void;
    
    // 高级筛选
    setFeaturedOnly: (featured: boolean) => void;
    setIncludeAds: (includeAds: boolean) => void;
    setMinRating: (rating: number) => void;
    
    // 重置操作
    resetFilters: () => void;
    resetPagination: () => void;
    resetAll: () => void;
    
    // UI操作
    setLoading: (isLoading: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setViewMode: (mode: 'grid' | 'list') => void;
    
    // 分类数据更新
    updateCategories: (categories: Category[]) => void;
    
    // URL状态同步 (由组件调用)
    syncFromURL: (params: Record<string, any>) => void;
  };
}

/**
 * 默认分页状态
 */
const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  itemsPerPage: 12,
  totalItems: 24, // 模拟总数据量，支持多页显示
  totalPages: 2,  // 计算得出的总页数 (24/12 = 2)
};

/**
 * 创建首页状态管理Store
 */
export const useHomepageStore = create<HomepageState>()(
  devtools(
    persist(
      (set, get) => ({
        // 继承默认筛选状态
        ...DEFAULT_FILTER_STATE,
        
        // 分页状态
        pagination: DEFAULT_PAGINATION,
        
        // 分类导航状态
        categoryNavigation: {
          expandedCategories: [],
          selectedCategory: null,
          categories: [],
        },
        
        // 搜索建议状态
        searchSuggestions: {
          isLoading: false,
          suggestions: [],
        },
        
        // UI状态
        ui: {
          isLoading: false,
          isSidebarCollapsed: false,
          viewMode: 'grid',
        },
        
        // 状态操作方法
        actions: {
          // 搜索相关方法
          setSearch: (query: string) => {
            set(
              (state) => ({
                search: query,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setSearch'
            );
          },
          
          clearSearch: () => {
            set(
              (state) => ({
                search: '',
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'clearSearch'
            );
          },
          
          // 分类相关方法
          setCategory: (categoryId: string | null) => {
            set(
              (state) => ({
                categoryId,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setCategory'
            );
          },
          
          toggleCategoryExpanded: (categoryId: string) => {
            set(
              (state) => {
                const expanded = state.categoryNavigation.expandedCategories;
                const isExpanded = expanded.includes(categoryId);
                
                return {
                  categoryNavigation: {
                    ...state.categoryNavigation,
                    expandedCategories: isExpanded
                      ? expanded.filter((id) => id !== categoryId)
                      : [...expanded, categoryId],
                  },
                };
              },
              false,
              'toggleCategoryExpanded'
            );
          },
          
          // 标签相关方法
          addTag: (tagId: string) => {
            set(
              (state) => {
                if (state.selectedTags.includes(tagId)) return state;
                
                return {
                  selectedTags: [...state.selectedTags, tagId],
                  pagination: { ...state.pagination, currentPage: 1 },
                };
              },
              false,
              'addTag'
            );
          },
          
          removeTag: (tagId: string) => {
            set(
              (state) => ({
                selectedTags: state.selectedTags.filter((id) => id !== tagId),
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'removeTag'
            );
          },
          
          setTags: (tagIds: string[]) => {
            set(
              (state) => ({
                selectedTags: tagIds,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setTags'
            );
          },
          
          // 排序相关方法
          setSorting: (field: SortField, order: SortOrder) => {
            set(
              (state) => ({
                sortBy: field,
                sortOrder: order,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setSorting'
            );
          },
          
          // 分页相关方法
          setPage: (page: number) => {
            set(
              (state) => ({
                pagination: { ...state.pagination, currentPage: page },
              }),
              false,
              'setPage'
            );
          },
          
          setItemsPerPage: (limit: number) => {
            set(
              (state) => ({
                pagination: { 
                  ...state.pagination, 
                  itemsPerPage: limit, 
                  currentPage: 1 
                },
              }),
              false,
              'setItemsPerPage'
            );
          },
          
          updatePagination: (paginationUpdate: Partial<PaginationState>) => {
            set(
              (state) => ({
                pagination: { ...state.pagination, ...paginationUpdate },
              }),
              false,
              'updatePagination'
            );
          },
          
          // 高级筛选方法
          setFeaturedOnly: (featured: boolean) => {
            set(
              (state) => ({
                featuredOnly: featured,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setFeaturedOnly'
            );
          },
          
          setIncludeAds: (includeAds: boolean) => {
            set(
              (state) => ({
                includeAds,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setIncludeAds'
            );
          },
          
          setMinRating: (rating: number) => {
            set(
              (state) => ({
                minRating: rating,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'setMinRating'
            );
          },
          
          // 重置操作方法
          resetFilters: () => {
            set(
              (state) => ({
                ...DEFAULT_FILTER_STATE,
                pagination: { ...state.pagination, currentPage: 1 },
              }),
              false,
              'resetFilters'
            );
          },
          
          resetPagination: () => {
            set(
              { pagination: DEFAULT_PAGINATION },
              false,
              'resetPagination'
            );
          },
          
          resetAll: () => {
            set(
              {
                ...DEFAULT_FILTER_STATE,
                pagination: DEFAULT_PAGINATION,
                categoryNavigation: {
                  expandedCategories: [],
                  selectedCategory: null,
                  categories: get().categoryNavigation.categories,
                },
              },
              false,
              'resetAll'
            );
          },
          
          // UI操作方法
          setLoading: (isLoading: boolean) => {
            set(
              (state) => ({
                ui: { ...state.ui, isLoading },
              }),
              false,
              'setLoading'
            );
          },
          
          setSidebarCollapsed: (collapsed: boolean) => {
            set(
              (state) => ({
                ui: { ...state.ui, isSidebarCollapsed: collapsed },
              }),
              false,
              'setSidebarCollapsed'
            );
          },
          
          setViewMode: (mode: 'grid' | 'list') => {
            set(
              (state) => ({
                ui: { ...state.ui, viewMode: mode },
              }),
              false,
              'setViewMode'
            );
          },
          
          // 分类数据更新方法
          updateCategories: (categories: Category[]) => {
            set(
              (state) => ({
                categoryNavigation: {
                  ...state.categoryNavigation,
                  categories,
                },
              }),
              false,
              'updateCategories'
            );
          },
          
          // URL状态同步方法
          syncFromURL: (params: Record<string, any>) => {
            const {
              search = '',
              category = '',
              tags = '',
              sortBy = 'created_at',
              sortOrder = 'desc',
              page = 1,
              limit = 12,
              featured = false,
              includeAds = true,
              minRating = 0,
            } = params;
            
            // 处理标签：如果是字符串，按逗号分割成数组
            const tagsArray = typeof tags === 'string' && tags.trim() 
              ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
              : Array.isArray(tags) ? tags : [];
            
            set(
              (state) => ({
                search,
                categoryId: category || null,
                selectedTags: tagsArray,
                sortBy: sortBy as SortField,
                sortOrder: sortOrder as SortOrder,
                featuredOnly: featured,
                includeAds,
                minRating,
                pagination: {
                  ...state.pagination,
                  currentPage: Math.max(1, parseInt(String(page)) || 1),
                  itemsPerPage: Math.max(1, parseInt(String(limit)) || 12),
                },
              }),
              false,
              'syncFromURL'
            );
          },
        },
      }),
      {
        name: 'homepage-store',
        storage: createJSONStorage(() => sessionStorage),
        // 只持久化UI偏好设置，URL参数通过nuqs管理
        partialize: (state) => ({
          ui: {
            isSidebarCollapsed: state.ui.isSidebarCollapsed,
            viewMode: state.ui.viewMode,
          },
          categoryNavigation: {
            expandedCategories: state.categoryNavigation.expandedCategories,
          },
        }),
      }
    ),
    {
      name: 'homepage-store',
    }
  )
);

/**
 * URL状态同步Hook
 * 
 * 使用nuqs管理URL参数，与Zustand store双向同步
 * 这个hook应该在页面组件中使用来保持URL和状态的同步
 */
export function useHomepageUrlSync() {
  const store = useHomepageStore();
  const { actions } = store;
  
  // 使用nuqs管理所有URL参数
  const [urlState, setUrlState] = useQueryStates(searchParamsParsers);
  
  // 从URL更新store状态 (组件首次加载时)
  const syncStoreFromUrl = () => {
    actions.syncFromURL(urlState);
  };
  
  // 从store更新URL状态
  const syncUrlFromStore = () => {
    setUrlState({
      search: store.search || undefined,
      category: store.categoryId || undefined,
      tags: store.selectedTags.length > 0 ? store.selectedTags.join(',') : undefined,
      sortBy: store.sortBy !== 'created_at' ? store.sortBy : undefined,
      sortOrder: store.sortOrder !== 'desc' ? store.sortOrder : undefined,
      page: store.pagination.currentPage > 1 ? store.pagination.currentPage : undefined,
      limit: store.pagination.itemsPerPage !== 12 ? store.pagination.itemsPerPage : undefined,
      featured: store.featuredOnly || undefined,
      includeAds: !store.includeAds ? store.includeAds : undefined,
      minRating: store.minRating && store.minRating > 0 ? store.minRating : undefined,
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
 * 筛选状态计算Hook
 * 
 * 提供计算后的筛选状态和便捷的操作方法
 */
export function useHomepageFilters() {
  const {
    search,
    categoryId,
    selectedTags,
    sortBy,
    sortOrder,
    featuredOnly,
    includeAds,
    minRating,
    actions,
  } = useHomepageStore();
  
  // 计算活跃筛选器数量
  const activeFiltersCount = [
    search.length > 0,
    categoryId !== null,
    selectedTags.length > 0,
    featuredOnly,
    !includeAds,
    minRating && minRating > 0,
  ].filter(Boolean).length;
  
  // 检查是否有任何筛选条件
  const hasActiveFilters = activeFiltersCount > 0;
  
  // 构建筛选对象 (用于API调用)
  const currentFilters = {
    search: search || undefined,
    category: categoryId || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    featured: featuredOnly || undefined,
    includeAds: includeAds,
    minRating: minRating || undefined,
    sortBy,
    sortOrder,
  };
  
  return {
    // 当前筛选状态
    search,
    categoryId,
    selectedTags,
    sortBy,
    sortOrder,
    featuredOnly,
    includeAds,
    minRating,
    
    // 计算属性
    activeFiltersCount,
    hasActiveFilters,
    currentFilters,
    
    // 操作方法
    setSearch: actions.setSearch,
    setCategory: actions.setCategory,
    addTag: actions.addTag,
    removeTag: actions.removeTag,
    setTags: actions.setTags,
    setSorting: actions.setSorting,
    setFeaturedOnly: actions.setFeaturedOnly,
    setIncludeAds: actions.setIncludeAds,
    setMinRating: actions.setMinRating,
    resetFilters: actions.resetFilters,
  };
}

/**
 * 分页状态Hook
 * 
 * 提供分页相关的状态和操作方法
 */
export function useHomepagePagination() {
  const { pagination, actions } = useHomepageStore();
  
  return {
    ...pagination,
    setPage: actions.setPage,
    setItemsPerPage: actions.setItemsPerPage,
    updatePagination: actions.updatePagination,
    resetPagination: actions.resetPagination,
  };
}

/**
 * 分类导航状态Hook
 * 
 * 提供分类导航相关的状态和操作方法
 */
export function useHomepageCategories() {
  const { categoryNavigation, actions } = useHomepageStore();
  
  return {
    ...categoryNavigation,
    toggleExpanded: actions.toggleCategoryExpanded,
    updateCategories: actions.updateCategories,
    setCategory: actions.setCategory,
  };
}

// 默认导出store hook
export default useHomepageStore;