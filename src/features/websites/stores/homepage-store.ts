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
  parseAsBoolean,
  useQueryStates
} from 'nuqs';
import { 
  FilterState, 
  SortField,
  SortOrder,
  Category,
  PaginationState
} from '../types';
import { DEFAULT_FILTER_STATE } from '../types/filters';

type UrlStateValue = string | number | boolean | null | undefined | string[];
type UrlStateParams = Record<string, UrlStateValue>;

function toStringValue(value: UrlStateValue, defaultValue = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(String).join(',');
  }
  return defaultValue;
}

function toNullableString(value: UrlStateValue): string | null {
  const normalized = toStringValue(value, '').trim();
  return normalized.length > 0 ? normalized : null;
}

function toNumberValue(value: UrlStateValue, defaultValue: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
}

function toBooleanValue(value: UrlStateValue, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return defaultValue;
}

/**
 * URL搜索参数解析器配置
 * 支持首页和搜索页面的完整URL状态管理
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
  
  // 搜索页面特定参数
  searchType: parseAsString,        // 搜索类型: 'websites' | 'categories' | 'tags' | 'all'
  searchScope: parseAsString,       // 搜索范围: 'title' | 'description' | 'url' | 'content' | 'all'
  searchMode: parseAsString,        // 搜索模式: 'simple' | 'advanced' | 'fuzzy'
  dateFrom: parseAsString,          // 日期范围开始
  dateTo: parseAsString,            // 日期范围结束
  language: parseAsString,          // 语言筛选
  status: parseAsString,            // 状态筛选 (多个值用逗号分隔)
  
  // 视图和显示选项
  view: parseAsString,              // 视图模式: 'grid' | 'list' | 'compact'
  groupBy: parseAsString,           // 分组方式: 'none' | 'category' | 'tag' | 'date'
  showPreview: parseAsBoolean,      // 是否显示预览
  
  // 搜索结果排序选项
  relevance: parseAsBoolean,        // 按相关性排序
  
  // 高级搜索选项
  exactMatch: parseAsBoolean,       // 精确匹配
  excludeTerms: parseAsString,      // 排除词汇 (用逗号分隔)
  requiredTerms: parseAsString,     // 必需词汇 (用逗号分隔)
} as const;

/**
 * 搜索页面特定状态接口
 */
export interface SearchPageState {
  // 搜索类型和范围
  searchType: 'websites' | 'categories' | 'tags' | 'all';
  searchScope: 'title' | 'description' | 'url' | 'content' | 'all';
  searchMode: 'simple' | 'advanced' | 'fuzzy';
  
  // 高级搜索选项
  exactMatch: boolean;
  excludeTerms: string[];
  requiredTerms: string[];
  
  // 日期范围筛选
  dateRange: {
    from: string | null;
    to: string | null;
  };
  
  // 语言和状态筛选
  language: string | null;
  status: string[];
  
  // 视图和显示选项
  viewMode: 'grid' | 'list' | 'compact';
  groupBy: 'none' | 'category' | 'tag' | 'date';
  showPreview: boolean;
  relevanceSort: boolean;
  
  // 搜索历史和建议
  searchHistory: string[];
  recentSearches: Array<{
    query: string;
    timestamp: string;
    resultCount: number;
  }>;
  
  // 搜索统计
  searchStats: {
    totalResults: number;
    searchTime: number;
    lastSearchQuery: string;
    lastSearchTime: string | null;
  };
}

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
  
  // 搜索页面状态 (支持搜索页面功能)
  searchPage: SearchPageState;
  
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
    syncFromURL: (params: UrlStateParams) => void;
    
    // 搜索页面特定操作方法
    searchPage: {
      // 搜索类型和范围设置
      setSearchType: (type: SearchPageState['searchType']) => void;
      setSearchScope: (scope: SearchPageState['searchScope']) => void;
      setSearchMode: (mode: SearchPageState['searchMode']) => void;
      
      // 高级搜索选项
      setExactMatch: (exactMatch: boolean) => void;
      setExcludeTerms: (terms: string[]) => void;
      setRequiredTerms: (terms: string[]) => void;
      addExcludeTerm: (term: string) => void;
      removeExcludeTerm: (term: string) => void;
      addRequiredTerm: (term: string) => void;
      removeRequiredTerm: (term: string) => void;
      
      // 日期范围设置
      setDateRange: (from: string | null, to: string | null) => void;
      clearDateRange: () => void;
      
      // 语言和状态筛选
      setLanguage: (language: string | null) => void;
      setStatus: (status: string[]) => void;
      addStatus: (status: string) => void;
      removeStatus: (status: string) => void;
      
      // 视图和显示选项
      setViewMode: (mode: SearchPageState['viewMode']) => void;
      setGroupBy: (groupBy: SearchPageState['groupBy']) => void;
      setShowPreview: (show: boolean) => void;
      setRelevanceSort: (enabled: boolean) => void;
      
      // 搜索历史管理
      addToSearchHistory: (query: string) => void;
      clearSearchHistory: () => void;
      addRecentSearch: (query: string, resultCount: number) => void;
      clearRecentSearches: () => void;
      
      // 搜索统计更新
      updateSearchStats: (stats: Partial<SearchPageState['searchStats']>) => void;
      
      // 搜索页面重置操作
      resetSearchPageFilters: () => void;
      resetAdvancedSearch: () => void;
      
      // 搜索页面URL同步
      syncSearchPageFromURL: (params: UrlStateParams) => void;
    };
  };
}

/**
 * 默认搜索页面状态
 */
const DEFAULT_SEARCH_PAGE_STATE: SearchPageState = {
  searchType: 'all',
  searchScope: 'all',
  searchMode: 'simple',
  exactMatch: false,
  excludeTerms: [],
  requiredTerms: [],
  dateRange: {
    from: null,
    to: null,
  },
  language: null,
  status: [],
  viewMode: 'grid',
  groupBy: 'none',
  showPreview: true,
  relevanceSort: false,
  searchHistory: [],
  recentSearches: [],
  searchStats: {
    totalResults: 0,
    searchTime: 0,
    lastSearchQuery: '',
    lastSearchTime: null,
  },
};

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
        
        // 搜索页面状态
        searchPage: DEFAULT_SEARCH_PAGE_STATE,
        
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
          syncFromURL: (params: UrlStateParams) => {
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

            const normalizedSearch = toStringValue(search, '');
            const normalizedCategory = toNullableString(category);
            const normalizedFeatured = toBooleanValue(featured, false);
            const normalizedIncludeAds = toBooleanValue(includeAds, true);
            const normalizedMinRating = toNumberValue(minRating, 0);
            const currentPage = Math.max(1, toNumberValue(page, 1));
            const itemsPerPage = Math.max(1, toNumberValue(limit, 12));
            
            set(
              (state) => ({
                search: normalizedSearch,
                categoryId: normalizedCategory,
                selectedTags: tagsArray,
                sortBy: sortBy as SortField,
                sortOrder: sortOrder as SortOrder,
                featuredOnly: normalizedFeatured,
                includeAds: normalizedIncludeAds,
                minRating: normalizedMinRating,
                pagination: {
                  ...state.pagination,
                  currentPage,
                  itemsPerPage,
                },
              }),
              false,
              'syncFromURL'
            );
          },
          
          // 搜索页面特定操作方法实现
          searchPage: {
            // 搜索类型和范围设置
            setSearchType: (type: SearchPageState['searchType']) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, searchType: type },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setSearchType'
              );
            },
            
            setSearchScope: (scope: SearchPageState['searchScope']) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, searchScope: scope },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setSearchScope'
              );
            },
            
            setSearchMode: (mode: SearchPageState['searchMode']) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, searchMode: mode },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setSearchMode'
              );
            },
            
            // 高级搜索选项
            setExactMatch: (exactMatch: boolean) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, exactMatch },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setExactMatch'
              );
            },
            
            setExcludeTerms: (terms: string[]) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, excludeTerms: terms },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setExcludeTerms'
              );
            },
            
            setRequiredTerms: (terms: string[]) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, requiredTerms: terms },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setRequiredTerms'
              );
            },
            
            addExcludeTerm: (term: string) => {
              set(
                (state) => {
                  const newTerms = [...state.searchPage.excludeTerms];
                  if (!newTerms.includes(term)) {
                    newTerms.push(term);
                  }
                  return {
                    searchPage: { ...state.searchPage, excludeTerms: newTerms },
                    pagination: { ...state.pagination, currentPage: 1 },
                  };
                },
                false,
                'searchPage.addExcludeTerm'
              );
            },
            
            removeExcludeTerm: (term: string) => {
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    excludeTerms: state.searchPage.excludeTerms.filter(t => t !== term),
                  },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.removeExcludeTerm'
              );
            },
            
            addRequiredTerm: (term: string) => {
              set(
                (state) => {
                  const newTerms = [...state.searchPage.requiredTerms];
                  if (!newTerms.includes(term)) {
                    newTerms.push(term);
                  }
                  return {
                    searchPage: { ...state.searchPage, requiredTerms: newTerms },
                    pagination: { ...state.pagination, currentPage: 1 },
                  };
                },
                false,
                'searchPage.addRequiredTerm'
              );
            },
            
            removeRequiredTerm: (term: string) => {
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    requiredTerms: state.searchPage.requiredTerms.filter(t => t !== term),
                  },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.removeRequiredTerm'
              );
            },
            
            // 日期范围设置
            setDateRange: (from: string | null, to: string | null) => {
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    dateRange: { from, to },
                  },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setDateRange'
              );
            },
            
            clearDateRange: () => {
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    dateRange: { from: null, to: null },
                  },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.clearDateRange'
              );
            },
            
            // 语言和状态筛选
            setLanguage: (language: string | null) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, language },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setLanguage'
              );
            },
            
            setStatus: (status: string[]) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, status },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setStatus'
              );
            },
            
            addStatus: (status: string) => {
              set(
                (state) => {
                  const newStatus = [...state.searchPage.status];
                  if (!newStatus.includes(status)) {
                    newStatus.push(status);
                  }
                  return {
                    searchPage: { ...state.searchPage, status: newStatus },
                    pagination: { ...state.pagination, currentPage: 1 },
                  };
                },
                false,
                'searchPage.addStatus'
              );
            },
            
            removeStatus: (status: string) => {
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    status: state.searchPage.status.filter(s => s !== status),
                  },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.removeStatus'
              );
            },
            
            // 视图和显示选项
            setViewMode: (mode: SearchPageState['viewMode']) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, viewMode: mode },
                }),
                false,
                'searchPage.setViewMode'
              );
            },
            
            setGroupBy: (groupBy: SearchPageState['groupBy']) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, groupBy },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setGroupBy'
              );
            },
            
            setShowPreview: (show: boolean) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, showPreview: show },
                }),
                false,
                'searchPage.setShowPreview'
              );
            },
            
            setRelevanceSort: (enabled: boolean) => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, relevanceSort: enabled },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.setRelevanceSort'
              );
            },
            
            // 搜索历史管理
            addToSearchHistory: (query: string) => {
              set(
                (state) => {
                  const history = [...state.searchPage.searchHistory];
                  // 移除已存在的相同查询
                  const existingIndex = history.indexOf(query);
                  if (existingIndex > -1) {
                    history.splice(existingIndex, 1);
                  }
                  // 添加到开头
                  history.unshift(query);
                  // 保持最大50条历史记录
                  if (history.length > 50) {
                    history.pop();
                  }
                  return {
                    searchPage: { ...state.searchPage, searchHistory: history },
                  };
                },
                false,
                'searchPage.addToSearchHistory'
              );
            },
            
            clearSearchHistory: () => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, searchHistory: [] },
                }),
                false,
                'searchPage.clearSearchHistory'
              );
            },
            
            addRecentSearch: (query: string, resultCount: number) => {
              set(
                (state) => {
                  const recentSearches = [...state.searchPage.recentSearches];
                  const newSearch = {
                    query,
                    timestamp: new Date().toISOString(),
                    resultCount,
                  };
                  
                  // 移除已存在的相同查询
                  const existingIndex = recentSearches.findIndex(s => s.query === query);
                  if (existingIndex > -1) {
                    recentSearches.splice(existingIndex, 1);
                  }
                  
                  // 添加到开头
                  recentSearches.unshift(newSearch);
                  
                  // 保持最大20条最近搜索
                  if (recentSearches.length > 20) {
                    recentSearches.pop();
                  }
                  
                  return {
                    searchPage: { ...state.searchPage, recentSearches },
                  };
                },
                false,
                'searchPage.addRecentSearch'
              );
            },
            
            clearRecentSearches: () => {
              set(
                (state) => ({
                  searchPage: { ...state.searchPage, recentSearches: [] },
                }),
                false,
                'searchPage.clearRecentSearches'
              );
            },
            
            // 搜索统计更新
            updateSearchStats: (stats: Partial<SearchPageState['searchStats']>) => {
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    searchStats: { ...state.searchPage.searchStats, ...stats },
                  },
                }),
                false,
                'searchPage.updateSearchStats'
              );
            },
            
            // 搜索页面重置操作
            resetSearchPageFilters: () => {
              set(
                (state) => ({
                  searchPage: {
                    ...DEFAULT_SEARCH_PAGE_STATE,
                    // 保留搜索历史和统计
                    searchHistory: state.searchPage.searchHistory,
                    recentSearches: state.searchPage.recentSearches,
                    searchStats: state.searchPage.searchStats,
                  },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.resetSearchPageFilters'
              );
            },
            
            resetAdvancedSearch: () => {
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    searchMode: 'simple',
                    exactMatch: false,
                    excludeTerms: [],
                    requiredTerms: [],
                    dateRange: { from: null, to: null },
                    language: null,
                    status: [],
                  },
                  pagination: { ...state.pagination, currentPage: 1 },
                }),
                false,
                'searchPage.resetAdvancedSearch'
              );
            },
            
            // 搜索页面URL同步
            syncSearchPageFromURL: (params: UrlStateParams) => {
              const {
                searchType = 'all',
                searchScope = 'all',
                searchMode = 'simple',
                exactMatch = false,
                excludeTerms = '',
                requiredTerms = '',
                dateFrom = null,
                dateTo = null,
                language = null,
                status = '',
                view = 'grid',
                groupBy = 'none',
                showPreview = true,
                relevance = false,
              } = params;
              
              // 处理逗号分隔的字符串参数
              const excludeTermsArray = typeof excludeTerms === 'string' && excludeTerms.trim()
                ? excludeTerms.split(',').map(term => term.trim()).filter(Boolean)
                : [];
              
              const requiredTermsArray = typeof requiredTerms === 'string' && requiredTerms.trim()
                ? requiredTerms.split(',').map(term => term.trim()).filter(Boolean)
                : [];
              
              const statusArray = typeof status === 'string' && status.trim()
                ? status.split(',').map(s => s.trim()).filter(Boolean)
                : [];

              const normalizedDateFrom = toNullableString(dateFrom);
              const normalizedDateTo = toNullableString(dateTo);
              const normalizedLanguage = toNullableString(language);
              const normalizedView = typeof view === 'string' ? view : 'grid';
              const normalizedGroupBy = typeof groupBy === 'string' ? groupBy : 'none';
              const normalizedSearchType = typeof searchType === 'string' ? searchType : 'all';
              const normalizedSearchScope = typeof searchScope === 'string' ? searchScope : 'all';
              const normalizedSearchMode = typeof searchMode === 'string' ? searchMode : 'simple';
              const normalizedShowPreview = toBooleanValue(showPreview, true);
              const normalizedRelevance = toBooleanValue(relevance, false);
              const normalizedExactMatch = toBooleanValue(exactMatch, false);
              
              set(
                (state) => ({
                  searchPage: {
                    ...state.searchPage,
                    searchType: normalizedSearchType as SearchPageState['searchType'],
                    searchScope: normalizedSearchScope as SearchPageState['searchScope'],
                    searchMode: normalizedSearchMode as SearchPageState['searchMode'],
                    exactMatch: normalizedExactMatch,
                    excludeTerms: excludeTermsArray,
                    requiredTerms: requiredTermsArray,
                    dateRange: {
                      from: normalizedDateFrom,
                      to: normalizedDateTo,
                    },
                    language: normalizedLanguage,
                    status: statusArray,
                    viewMode: normalizedView as SearchPageState['viewMode'],
                    groupBy: normalizedGroupBy as SearchPageState['groupBy'],
                    showPreview: normalizedShowPreview,
                    relevanceSort: normalizedRelevance,
                  },
                }),
                false,
                'searchPage.syncSearchPageFromURL'
              );
            },
          },
        },
      }),
      {
        name: 'homepage-store',
        storage: createJSONStorage(() => sessionStorage),
        // 只持久化UI偏好设置和搜索历史，URL参数通过nuqs管理
        partialize: (state) => ({
          ui: {
            isSidebarCollapsed: state.ui.isSidebarCollapsed,
            viewMode: state.ui.viewMode,
          },
          categoryNavigation: {
            expandedCategories: state.categoryNavigation.expandedCategories,
          },
          searchPage: {
            // 持久化搜索历史和用户偏好
            searchHistory: state.searchPage.searchHistory,
            recentSearches: state.searchPage.recentSearches,
            viewMode: state.searchPage.viewMode,
            showPreview: state.searchPage.showPreview,
            groupBy: state.searchPage.groupBy,
            searchMode: state.searchPage.searchMode,
            // 保留搜索统计信息
            searchStats: state.searchPage.searchStats,
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
  
  // 从store更新URL状态 (支持搜索页面参数)
  const syncUrlFromStore = (includeSearchPageParams = false) => {
    const baseUrlState = {
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
    };

    // 如果需要包含搜索页面参数
    if (includeSearchPageParams) {
      const searchPageUrlState = {
        searchType: store.searchPage.searchType !== 'all' ? store.searchPage.searchType : undefined,
        searchScope: store.searchPage.searchScope !== 'all' ? store.searchPage.searchScope : undefined,
        searchMode: store.searchPage.searchMode !== 'simple' ? store.searchPage.searchMode : undefined,
        exactMatch: store.searchPage.exactMatch || undefined,
        excludeTerms: store.searchPage.excludeTerms.length > 0 ? store.searchPage.excludeTerms.join(',') : undefined,
        requiredTerms: store.searchPage.requiredTerms.length > 0 ? store.searchPage.requiredTerms.join(',') : undefined,
        dateFrom: store.searchPage.dateRange.from || undefined,
        dateTo: store.searchPage.dateRange.to || undefined,
        language: store.searchPage.language || undefined,
        status: store.searchPage.status.length > 0 ? store.searchPage.status.join(',') : undefined,
        view: store.searchPage.viewMode !== 'grid' ? store.searchPage.viewMode : undefined,
        groupBy: store.searchPage.groupBy !== 'none' ? store.searchPage.groupBy : undefined,
        showPreview: !store.searchPage.showPreview ? store.searchPage.showPreview : undefined,
        relevance: store.searchPage.relevanceSort || undefined,
      };
      
      setUrlState({ ...baseUrlState, ...searchPageUrlState });
    } else {
      setUrlState(baseUrlState);
    }
  };
  
  return {
    urlState,
    setUrlState,
    syncStoreFromUrl,
    syncUrlFromStore,
  };
}

/**
 * 搜索页面URL状态同步Hook
 * 
 * 专门用于搜索页面的URL参数管理，包含所有搜索页面特定参数
 */
export function useSearchPageUrlSync() {
  const store = useHomepageStore();
  const { actions } = store;
  
  // 使用nuqs管理所有URL参数（包含搜索页面特定参数）
  const [urlState, setUrlState] = useQueryStates(searchParamsParsers);
  
  // 从URL更新搜索页面状态
  const syncSearchPageFromUrl = () => {
    // 先同步基础过滤状态
    actions.syncFromURL(urlState);
    // 再同步搜索页面特定状态
    actions.searchPage.syncSearchPageFromURL(urlState);
  };
  
  // 从搜索页面状态更新URL
  const syncUrlFromSearchPage = () => {
    const searchPageUrlState = {
      // 基础参数
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
      
      // 搜索页面特定参数
      searchType: store.searchPage.searchType !== 'all' ? store.searchPage.searchType : undefined,
      searchScope: store.searchPage.searchScope !== 'all' ? store.searchPage.searchScope : undefined,
      searchMode: store.searchPage.searchMode !== 'simple' ? store.searchPage.searchMode : undefined,
      exactMatch: store.searchPage.exactMatch || undefined,
      excludeTerms: store.searchPage.excludeTerms.length > 0 ? store.searchPage.excludeTerms.join(',') : undefined,
      requiredTerms: store.searchPage.requiredTerms.length > 0 ? store.searchPage.requiredTerms.join(',') : undefined,
      dateFrom: store.searchPage.dateRange.from || undefined,
      dateTo: store.searchPage.dateRange.to || undefined,
      language: store.searchPage.language || undefined,
      status: store.searchPage.status.length > 0 ? store.searchPage.status.join(',') : undefined,
      view: store.searchPage.viewMode !== 'grid' ? store.searchPage.viewMode : undefined,
      groupBy: store.searchPage.groupBy !== 'none' ? store.searchPage.groupBy : undefined,
      showPreview: !store.searchPage.showPreview ? store.searchPage.showPreview : undefined,
      relevance: store.searchPage.relevanceSort || undefined,
    };
    
    setUrlState(searchPageUrlState);
  };
  
  return {
    urlState,
    setUrlState,
    syncSearchPageFromUrl,
    syncUrlFromSearchPage,
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

/**
 * 搜索页面状态Hook
 * 
 * 提供搜索页面特定的状态和操作方法
 */
export function useSearchPageState() {
  const { searchPage, actions } = useHomepageStore();
  
  return {
    // 搜索页面状态
    ...searchPage,
    
    // 操作方法
    setSearchType: actions.searchPage.setSearchType,
    setSearchScope: actions.searchPage.setSearchScope,
    setSearchMode: actions.searchPage.setSearchMode,
    
    // 高级搜索选项
    setExactMatch: actions.searchPage.setExactMatch,
    setExcludeTerms: actions.searchPage.setExcludeTerms,
    setRequiredTerms: actions.searchPage.setRequiredTerms,
    addExcludeTerm: actions.searchPage.addExcludeTerm,
    removeExcludeTerm: actions.searchPage.removeExcludeTerm,
    addRequiredTerm: actions.searchPage.addRequiredTerm,
    removeRequiredTerm: actions.searchPage.removeRequiredTerm,
    
    // 日期范围
    setDateRange: actions.searchPage.setDateRange,
    clearDateRange: actions.searchPage.clearDateRange,
    
    // 语言和状态筛选
    setLanguage: actions.searchPage.setLanguage,
    setStatus: actions.searchPage.setStatus,
    addStatus: actions.searchPage.addStatus,
    removeStatus: actions.searchPage.removeStatus,
    
    // 视图和显示选项
    setViewMode: actions.searchPage.setViewMode,
    setGroupBy: actions.searchPage.setGroupBy,
    setShowPreview: actions.searchPage.setShowPreview,
    setRelevanceSort: actions.searchPage.setRelevanceSort,
    
    // 搜索历史管理
    addToSearchHistory: actions.searchPage.addToSearchHistory,
    clearSearchHistory: actions.searchPage.clearSearchHistory,
    addRecentSearch: actions.searchPage.addRecentSearch,
    clearRecentSearches: actions.searchPage.clearRecentSearches,
    
    // 搜索统计
    updateSearchStats: actions.searchPage.updateSearchStats,
    
    // 重置操作
    resetSearchPageFilters: actions.searchPage.resetSearchPageFilters,
    resetAdvancedSearch: actions.searchPage.resetAdvancedSearch,
  };
}

/**
 * 搜索历史Hook
 * 
 * 专门管理搜索历史和最近搜索
 */
export function useSearchHistory() {
  const { searchPage, actions } = useHomepageStore();
  
  return {
    // 搜索历史数据
    searchHistory: searchPage.searchHistory,
    recentSearches: searchPage.recentSearches,
    
    // 历史管理方法
    addToHistory: actions.searchPage.addToSearchHistory,
    clearHistory: actions.searchPage.clearSearchHistory,
    addRecentSearch: actions.searchPage.addRecentSearch,
    clearRecentSearches: actions.searchPage.clearRecentSearches,
  };
}

/**
 * 搜索统计Hook
 * 
 * 提供搜索性能和结果统计
 */
export function useSearchStats() {
  const { searchPage, actions } = useHomepageStore();
  
  return {
    // 统计数据
    ...searchPage.searchStats,
    
    // 更新方法
    updateStats: actions.searchPage.updateSearchStats,
  };
}

// 默认导出store hook
export default useHomepageStore;
