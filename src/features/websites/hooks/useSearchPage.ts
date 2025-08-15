/**
 * Search Page Specific Hooks
 * 
 * 提供搜索页面专用的hooks，包括搜索筛选逻辑和搜索结果状态管理
 * 集成防抖搜索、URL同步、错误处理和搜索历史管理
 * 
 * 实现需求:
 * - 2.2: 用户输入搜索关键词时，系统应该提供实时搜索建议或防抖处理
 * - 5.1: 当用户执行搜索时，系统应该将搜索参数更新到URL中
 * - 5.2: 当用户修改筛选条件时，系统应该更新URL参数反映当前状态
 * - 5.3: 当用户通过URL直接访问时，系统应该根据URL参数恢复搜索状态
 * - 5.4: 当用户点击浏览器后退时，系统应该恢复之前的搜索状态
 * - 5.5: 当用户分享URL时，其他用户应该能够看到相同的搜索结果
 * - 5.6: 当导航栏中的Search链接被点击时，系统应该正确高亮显示当前页面
 * 
 * URL状态同步功能:
 * - 搜索参数、筛选条件、分页状态的双向同步
 * - 浏览器前进/后退功能支持
 * - 直接URL访问状态恢复
 * - 分享URL功能支持
 * - 搜索状态持久化
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { 
  useHomepageStore,
  useSearchPageUrlSync,
  useSearchPageState,
  useSearchHistory,
  useSearchStats,
  SearchPageState
} from '../stores/homepage-store';
import type { 
  SearchPageFilters,
  WebsiteCardData,
  SearchPageStatus,
  SearchAnalytics,
  SearchSuggestions,
  WebsiteStatus
} from '../types';
import type { FilterState, SortField, SortOrder } from '../types/filters';

/**
 * 搜索筛选器配置接口
 */
export interface SearchFiltersConfig {
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 是否启用实时搜索 */
  enableRealTimeSearch?: boolean;
  /** 是否启用搜索建议 */
  enableSuggestions?: boolean;
  /** 是否自动将搜索添加到历史记录 */
  autoAddToHistory?: boolean;
  /** 最小搜索长度 */
  minSearchLength?: number;
  /** 是否启用搜索分析 */
  enableAnalytics?: boolean;
}

/**
 * 搜索筛选器状态接口
 */
export interface SearchFiltersState {
  /** 当前搜索查询 */
  query: string;
  /** 当前筛选状态 */
  filters: SearchPageFilters;
  /** 基础筛选状态 */
  baseFilters: FilterState;
  /** 搜索页面特定状态 */
  searchPageState: SearchPageState;
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 搜索建议 */
  suggestions: SearchSuggestions;
  /** 是否正在加载建议 */
  isLoadingSuggestions: boolean;
  /** 搜索错误 */
  searchError: string | null;
  /** 是否有活跃的搜索 */
  hasActiveSearch: boolean;
  /** 是否有活跃的筛选 */
  hasActiveFilters: boolean;
}

/**
 * 搜索筛选器操作接口
 */
export interface SearchFiltersActions {
  /** 设置搜索查询 */
  setQuery: (query: string) => void;
  /** 执行搜索 */
  executeSearch: (query?: string, filters?: Partial<SearchPageFilters>) => void;
  /** 清除搜索 */
  clearSearch: () => void;
  /** 重置所有筛选器 */
  resetFilters: () => void;
  /** 重置高级搜索筛选器 */
  resetAdvancedFilters: () => void;
  /** 选择搜索建议 */
  selectSuggestion: (suggestion: string) => void;
  /** 刷新搜索建议 */
  refreshSuggestions: () => void;
  
  // 基础筛选操作
  /** 设置分类筛选 */
  setCategory: (categoryId: string | null) => void;
  /** 设置标签筛选 */
  setTags: (tagIds: string[]) => void;
  /** 添加标签 */
  addTag: (tagId: string) => void;
  /** 移除标签 */
  removeTag: (tagId: string) => void;
  /** 设置排序方式 */
  setSorting: (field: SortField, order: SortOrder) => void;
  
  // 搜索页面特定操作
  /** 设置搜索类型 */
  setSearchType: (type: SearchPageState['searchType']) => void;
  /** 设置搜索范围 */
  setSearchScope: (scope: SearchPageState['searchScope']) => void;
  /** 设置搜索模式 */
  setSearchMode: (mode: SearchPageState['searchMode']) => void;
  /** 设置精确匹配 */
  setExactMatch: (exactMatch: boolean) => void;
  /** 设置日期范围 */
  setDateRange: (from: string | null, to: string | null) => void;
  /** 设置语言筛选 */
  setLanguage: (language: string | null) => void;
  /** 设置状态筛选 */
  setStatusFilter: (status: string[]) => void;
  /** 设置视图模式 */
  setViewMode: (mode: SearchPageState['viewMode']) => void;
  /** 设置分组方式 */
  setGroupBy: (groupBy: SearchPageState['groupBy']) => void;
}

/**
 * 搜索结果配置接口
 */
export interface SearchResultsConfig {
  /** 每页显示数量 */
  itemsPerPage?: number;
  /** 是否启用分页 */
  enablePagination?: boolean;
  /** 是否启用无限滚动 */
  enableInfiniteScroll?: boolean;
  /** 结果缓存时间（毫秒） */
  cacheTimeout?: number;
  /** 是否启用结果分析 */
  enableResultAnalytics?: boolean;
}

/**
 * 搜索结果状态接口
 */
export interface SearchResultsState {
  /** 搜索结果数据 */
  results: WebsiteCardData[];
  /** 搜索状态 */
  status: SearchPageStatus;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否有错误 */
  isError: boolean;
  /** 错误信息 */
  error: string | null;
  /** 总结果数量 */
  totalResults: number;
  /** 搜索时间（毫秒） */
  searchTime: number;
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有更多数据 */
  hasMoreData: boolean;
  /** 是否为空结果 */
  isEmpty: boolean;
  /** 上次搜索查询 */
  lastSearchQuery: string;
  /** 搜索分析数据 */
  analytics: SearchAnalytics | null;
}

/**
 * 搜索结果操作接口
 */
export interface SearchResultsActions {
  /** 加载搜索结果 */
  loadResults: (query: string, filters: SearchPageFilters, page?: number) => Promise<void>;
  /** 刷新当前结果 */
  refreshResults: () => Promise<void>;
  /** 加载更多结果（无限滚动） */
  loadMoreResults: () => Promise<void>;
  /** 设置页码 */
  setPage: (page: number) => void;
  /** 清除结果 */
  clearResults: () => void;
  /** 重试搜索 */
  retrySearch: () => void;
  /** 跟踪网站访问 */
  trackWebsiteVisit: (website: WebsiteCardData, position: number) => void;
}

/**
 * 默认搜索筛选器配置
 */
const DEFAULT_SEARCH_FILTERS_CONFIG: Required<SearchFiltersConfig> = {
  debounceDelay: 300,
  enableRealTimeSearch: true,
  enableSuggestions: true,
  autoAddToHistory: true,
  minSearchLength: 1,
  enableAnalytics: true,
};

/**
 * 默认搜索结果配置
 */
const DEFAULT_SEARCH_RESULTS_CONFIG: Required<SearchResultsConfig> = {
  itemsPerPage: 12,
  enablePagination: true,
  enableInfiniteScroll: false,
  cacheTimeout: 5 * 60 * 1000, // 5分钟
  enableResultAnalytics: true,
};

/**
 * 默认搜索建议
 */
const DEFAULT_SEARCH_SUGGESTIONS: SearchSuggestions = {
  queries: [],
  websites: [],
  categories: [],
  tags: [],
};

/**
 * 搜索筛选器Hook
 * 
 * 封装搜索页面的筛选逻辑，包括搜索查询、基础筛选和高级筛选
 * 提供防抖搜索、URL同步、搜索建议和历史记录管理
 */
export function useSearchFilters(config: SearchFiltersConfig = {}) {
  // 合并配置
  const searchConfig = useMemo(() => ({ 
    ...DEFAULT_SEARCH_FILTERS_CONFIG, 
    ...config 
  }), [config]);

  // 获取状态管理hooks
  const store = useHomepageStore();
  const { syncSearchPageFromUrl, syncUrlFromSearchPage } = useSearchPageUrlSync();
  const searchPageState = useSearchPageState();
  const { addToHistory, addRecentSearch } = useSearchHistory();
  const { updateStats } = useSearchStats();

  // 内部状态
  const [suggestions, setSuggestions] = useState<SearchSuggestions>(DEFAULT_SEARCH_SUGGESTIONS);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isExecutingRef = useRef(false);
  const searchStartTimeRef = useRef<number>(0);

  // 从store获取相关状态
  const {
    search: currentQuery,
    categoryId,
    selectedTags,
    sortBy,
    sortOrder,
    featuredOnly,
    includeAds,
    minRating,
    ui: { isLoading },
    actions: {
      setSearch,
      clearSearch: storeClearSearch,
      setCategory,
      setTags,
      addTag,
      removeTag,
      setSorting,
      setFeaturedOnly,
      setIncludeAds,
      setMinRating,
      resetFilters: storeResetFilters,
    },
  } = store;

  /**
   * 验证搜索查询
   */
  const validateSearchQuery = useCallback((query: string): { isValid: boolean; message?: string } => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length === 0) {
      return { isValid: true }; // 空查询是有效的
    }
    
    if (trimmedQuery.length < searchConfig.minSearchLength) {
      return {
        isValid: false,
        message: `搜索关键词至少需要 ${searchConfig.minSearchLength} 个字符`,
      };
    }
    
    // 检查特殊字符
    const invalidChars = /[<>{}\\]/;
    if (invalidChars.test(trimmedQuery)) {
      return {
        isValid: false,
        message: '搜索关键词包含无效字符',
      };
    }
    
    return { isValid: true };
  }, [searchConfig.minSearchLength]);

  /**
   * 模拟获取搜索建议
   */
  const fetchSearchSuggestions = useCallback(async (query: string): Promise<SearchSuggestions> => {
    if (!searchConfig.enableSuggestions || query.length < 2) {
      return DEFAULT_SEARCH_SUGGESTIONS;
    }
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 返回模拟建议（后续替换为真实API）
    return {
      queries: [
        { text: `${query} tools`, type: 'suggestion' },
        { text: `${query} app`, type: 'suggestion' },
        { text: `best ${query}`, type: 'suggestion' },
      ],
      websites: [],
      categories: [],
      tags: [],
    };
  }, [searchConfig.enableSuggestions]);

  /**
   * 防抖的搜索建议获取
   */
  const debouncedFetchSuggestions = useDebouncedCallback(
    async (query: string) => {
      if (!searchConfig.enableSuggestions) return;
      
      setIsLoadingSuggestions(true);
      try {
        const newSuggestions = await fetchSearchSuggestions(query);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('获取搜索建议失败:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    searchConfig.debounceDelay
  );

  /**
   * 执行搜索操作
   */
  const executeSearchInternal = useCallback(async (
    query: string, 
    filters?: Partial<SearchPageFilters>
  ) => {
    if (isExecutingRef.current) return;
    
    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      setSearchError(validation.message || '搜索查询无效');
      return;
    }
    
    isExecutingRef.current = true;
    searchStartTimeRef.current = Date.now();
    setSearchError(null);
    
    try {
      // 更新搜索状态
      setSearch(query.trim());
      
      // 如果提供了筛选器，应用它们
      if (filters) {
        // 应用筛选器更新逻辑
        if (filters.category !== undefined) setCategory(filters.category);
        if (filters.tags !== undefined) setTags(filters.tags);
        if (filters.sortBy !== undefined && filters.sortOrder !== undefined) {
          setSorting(filters.sortBy as SortField, filters.sortOrder as SortOrder);
        }
      }
      
      // 同步URL状态
      syncUrlFromSearchPage();
      
      // 添加到搜索历史
      if (searchConfig.autoAddToHistory && query.trim()) {
        addToHistory(query.trim());
      }
      
      // 更新搜索统计
      if (searchConfig.enableAnalytics) {
        const searchTime = Date.now() - searchStartTimeRef.current;
        updateStats({
          lastSearchQuery: query.trim(),
          lastSearchTime: new Date().toISOString(),
          searchTime,
        });
      }
      
      console.log('执行搜索:', { query: query.trim(), filters });
    } catch (error) {
      console.error('搜索执行失败:', error);
      setSearchError('搜索失败，请重试');
    } finally {
      isExecutingRef.current = false;
    }
  }, [
    validateSearchQuery,
    setSearch,
    setCategory,
    setTags,
    setSorting,
    syncUrlFromSearchPage,
    addToHistory,
    updateStats,
    searchConfig.autoAddToHistory,
    searchConfig.enableAnalytics,
  ]);

  /**
   * 防抖的搜索执行
   */
  const debouncedExecuteSearch = useDebouncedCallback(
    executeSearchInternal,
    searchConfig.debounceDelay
  );

  /**
   * 设置搜索查询
   */
  const setQuery = useCallback((query: string) => {
    // 立即更新搜索状态（不触发实际搜索）
    setSearch(query);
    
    // 同步URL状态
    syncUrlFromSearchPage();
    
    if (searchConfig.enableRealTimeSearch) {
      debouncedExecuteSearch(query);
    }
    
    if (searchConfig.enableSuggestions && query.trim().length >= 2) {
      debouncedFetchSuggestions(query.trim());
    }
  }, [
    setSearch,
    syncUrlFromSearchPage,
    searchConfig.enableRealTimeSearch,
    searchConfig.enableSuggestions,
    debouncedExecuteSearch,
    debouncedFetchSuggestions,
  ]);

  /**
   * 立即执行搜索
   */
  const executeSearch = useCallback((query?: string, filters?: Partial<SearchPageFilters>) => {
    const searchQuery = query !== undefined ? query : currentQuery;
    debouncedExecuteSearch.cancel();
    executeSearchInternal(searchQuery, filters);
  }, [currentQuery, executeSearchInternal, debouncedExecuteSearch]);

  /**
   * 清除搜索
   */
  const clearSearch = useCallback(() => {
    debouncedExecuteSearch.cancel();
    debouncedFetchSuggestions.cancel();
    setSearchError(null);
    setSuggestions(DEFAULT_SEARCH_SUGGESTIONS);
    
    storeClearSearch();
    syncUrlFromSearchPage();
  }, [
    storeClearSearch,
    syncUrlFromSearchPage,
    debouncedExecuteSearch,
    debouncedFetchSuggestions,
  ]);

  /**
   * 重置筛选器
   */
  const resetFilters = useCallback(() => {
    storeResetFilters();
    syncUrlFromSearchPage();
  }, [storeResetFilters, syncUrlFromSearchPage]);

  /**
   * 重置高级搜索筛选器
   */
  const resetAdvancedFilters = useCallback(() => {
    searchPageState.resetAdvancedSearch();
    syncUrlFromSearchPage();
  }, [searchPageState, syncUrlFromSearchPage]);

  /**
   * 选择搜索建议
   */
  const selectSuggestion = useCallback((suggestion: string) => {
    executeSearchInternal(suggestion);
  }, [executeSearchInternal]);

  /**
   * 刷新搜索建议
   */
  const refreshSuggestions = useCallback(() => {
    if (currentQuery.trim().length >= 2) {
      debouncedFetchSuggestions.cancel();
      debouncedFetchSuggestions(currentQuery.trim());
    }
  }, [currentQuery, debouncedFetchSuggestions]);

  // 构建当前筛选状态
  const currentFilters: SearchPageFilters = useMemo(() => ({
    query: currentQuery,
    category: categoryId || undefined,
    tags: selectedTags,
    sortBy,
    sortOrder,
    featured: featuredOnly,
    includeAds,
    minRating,
    searchType: searchPageState.searchType,
    searchScope: searchPageState.searchScope,
    searchMode: searchPageState.searchMode,
    exactMatch: searchPageState.exactMatch,
    excludeTerms: searchPageState.excludeTerms,
    requiredTerms: searchPageState.requiredTerms,
    dateRange: searchPageState.dateRange,
    language: searchPageState.language,
    status: searchPageState.status.length > 0 ? searchPageState.status[0] as WebsiteStatus : undefined,
  }), [
    currentQuery,
    categoryId,
    selectedTags,
    sortBy,
    sortOrder,
    featuredOnly,
    includeAds,
    minRating,
    searchPageState,
  ]);

  // 检查是否有活跃的搜索和筛选
  const hasActiveSearch = currentQuery.trim().length > 0;
  const hasActiveFilters = [
    categoryId !== null,
    selectedTags.length > 0,
    featuredOnly,
    !includeAds,
    minRating && minRating > 0,
    searchPageState.exactMatch,
    searchPageState.excludeTerms.length > 0,
    searchPageState.requiredTerms.length > 0,
    searchPageState.dateRange.from || searchPageState.dateRange.to,
    searchPageState.language,
    searchPageState.status.length > 0,
  ].some(Boolean);

  // 清理副作用
  useEffect(() => {
    return () => {
      debouncedExecuteSearch.cancel();
      debouncedFetchSuggestions.cancel();
    };
  }, [debouncedExecuteSearch, debouncedFetchSuggestions]);

  // 构建搜索筛选器状态
  const searchFiltersState: SearchFiltersState = useMemo(() => ({
    query: currentQuery,
    filters: currentFilters,
    baseFilters: {
      search: currentQuery,
      categoryId,
      selectedTags,
      sortBy,
      sortOrder,
      featuredOnly,
      includeAds,
      minRating,
    },
    searchPageState,
    isSearching: isLoading,
    suggestions,
    isLoadingSuggestions,
    searchError,
    hasActiveSearch,
    hasActiveFilters,
  }), [
    currentQuery,
    currentFilters,
    categoryId,
    selectedTags,
    sortBy,
    sortOrder,
    featuredOnly,
    includeAds,
    minRating,
    searchPageState,
    isLoading,
    suggestions,
    isLoadingSuggestions,
    searchError,
    hasActiveSearch,
    hasActiveFilters,
  ]);

  // 为搜索页面特定操作创建带URL同步的包装函数
  const createSyncedAction = useCallback(<T extends any[]>(
    action: (...args: T) => void
  ) => {
    return (...args: T) => {
      action(...args);
      // 延迟同步URL以确保状态已更新
      setTimeout(() => syncUrlFromSearchPage(), 0);
    };
  }, [syncUrlFromSearchPage]);

  // 构建搜索筛选器操作
  const searchFiltersActions: SearchFiltersActions = useMemo(() => ({
    setQuery,
    executeSearch,
    clearSearch,
    resetFilters,
    resetAdvancedFilters,
    selectSuggestion,
    refreshSuggestions,
    
    // 基础筛选操作（添加URL同步）
    setCategory: createSyncedAction(setCategory),
    setTags: createSyncedAction(setTags),
    addTag: createSyncedAction(addTag),
    removeTag: createSyncedAction(removeTag),
    setSorting: createSyncedAction(setSorting),
    
    // 搜索页面特定操作（添加URL同步）
    setSearchType: createSyncedAction(searchPageState.setSearchType),
    setSearchScope: createSyncedAction(searchPageState.setSearchScope),
    setSearchMode: createSyncedAction(searchPageState.setSearchMode),
    setExactMatch: createSyncedAction(searchPageState.setExactMatch),
    setDateRange: createSyncedAction(searchPageState.setDateRange),
    setLanguage: createSyncedAction(searchPageState.setLanguage),
    setStatusFilter: createSyncedAction(searchPageState.setStatus),
    setViewMode: createSyncedAction(searchPageState.setViewMode),
    setGroupBy: createSyncedAction(searchPageState.setGroupBy),
  }), [
    setQuery,
    executeSearch,
    clearSearch,
    resetFilters,
    resetAdvancedFilters,
    selectSuggestion,
    refreshSuggestions,
    createSyncedAction,
    setCategory,
    setTags,
    addTag,
    removeTag,
    setSorting,
    searchPageState,
  ]);

  return {
    // 搜索筛选器状态
    ...searchFiltersState,
    
    // 搜索筛选器操作
    ...searchFiltersActions,
    
    // 配置信息
    config: searchConfig,
    
    // URL同步方法
    syncFromUrl: syncSearchPageFromUrl,
    syncToUrl: syncUrlFromSearchPage,
  };
}

/**
 * 搜索结果Hook
 * 
 * 管理搜索结果的状态，包括加载、错误处理、分页和缓存
 * 提供搜索结果分析和用户行为跟踪功能
 */
export function useSearchResults(config: SearchResultsConfig = {}) {
  // 合并配置
  const searchConfig = useMemo(() => ({ 
    ...DEFAULT_SEARCH_RESULTS_CONFIG, 
    ...config 
  }), [config]);

  // 获取状态管理和URL同步
  const { addRecentSearch } = useSearchHistory();
  const { updateStats } = useSearchStats();
  const { syncUrlFromSearchPage } = useSearchPageUrlSync();
  const store = useHomepageStore();

  // 内部状态
  const [results, setResults] = useState<WebsiteCardData[]>([]);
  const [status, setStatus] = useState<SearchPageStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);

  // 缓存和引用
  const resultsCache = useRef<Map<string, { 
    results: WebsiteCardData[]; 
    timestamp: number; 
    totalResults: number;
  }>>(new Map());
  const lastSearchRef = useRef<string>('');
  const searchStartTimeRef = useRef<number>(0);

  /**
   * 生成缓存键
   */
  const generateCacheKey = useCallback((query: string, filters: SearchPageFilters, page: number): string => {
    return `${query}|${JSON.stringify(filters)}|${page}`;
  }, []);

  /**
   * 检查缓存是否有效
   */
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < searchConfig.cacheTimeout;
  }, [searchConfig.cacheTimeout]);

  /**
   * 模拟搜索API
   */
  const mockSearchAPI = useCallback(async (
    query: string, 
    filters: SearchPageFilters, 
    page: number
  ): Promise<{ results: WebsiteCardData[]; totalResults: number }> => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    // 模拟搜索结果
    const mockResults: WebsiteCardData[] = Array.from({ length: 12 }, (_, i) => ({
      id: `search-result-${page}-${i}`,
      title: `Search Result ${page * 12 + i + 1} for "${query}"`,
      description: `This is a mock search result for query "${query}" with applied filters.`,
      url: `https://example-${page}-${i}.com`,
      favicon_url: '/assets/icons/default-favicon.png',
      image_url: `/assets/images/mock-${(i % 6) + 1}.jpg`,
      tags: ['search', 'mock', 'result'],
      category: filters.category || 'general',
      rating: 4 + Math.random(),
      visit_count: Math.floor(Math.random() * 1000),
      is_featured: Math.random() > 0.8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const mockTotalResults = query ? 48 : 0; // 模拟总结果数

    return { results: mockResults, totalResults: mockTotalResults };
  }, []);

  /**
   * 加载搜索结果
   */
  const loadResults = useCallback(async (
    query: string,
    filters: SearchPageFilters,
    page: number = 1
  ) => {
    const cacheKey = generateCacheKey(query, filters, page);
    
    // 检查缓存
    const cached = resultsCache.current.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      setResults(cached.results);
      setTotalResults(cached.totalResults);
      setStatus('success');
      setCurrentPage(page);
      return;
    }
    
    // 开始搜索
    setStatus('loading');
    setError(null);
    searchStartTimeRef.current = Date.now();
    lastSearchRef.current = query;
    
    try {
      const { results: newResults, totalResults: newTotalResults } = await mockSearchAPI(query, filters, page);
      
      // 计算搜索时间
      const searchDuration = Date.now() - searchStartTimeRef.current;
      setSearchTime(searchDuration);
      
      // 更新状态
      setResults(newResults);
      setTotalResults(newTotalResults);
      setCurrentPage(page);
      setStatus(newResults.length > 0 ? 'success' : 'empty');
      
      // 缓存结果
      resultsCache.current.set(cacheKey, {
        results: newResults,
        totalResults: newTotalResults,
        timestamp: Date.now(),
      });
      
      // 添加到最近搜索
      if (query.trim()) {
        addRecentSearch(query, newTotalResults);
      }
      
      // 更新搜索统计
      updateStats({
        totalResults: newTotalResults,
        searchTime: searchDuration,
        lastSearchQuery: query,
        lastSearchTime: new Date().toISOString(),
      });
      
      // 创建搜索分析数据
      if (searchConfig.enableResultAnalytics) {
        const analyticsData: SearchAnalytics = {
          query,
          filters,
          resultCount: newTotalResults,
          searchTime: searchDuration,
          timestamp: new Date().toISOString(),
        };
        setAnalytics(analyticsData);
      }
      
      console.log('搜索完成:', { query, totalResults: newTotalResults, searchTime: searchDuration });
    } catch (err) {
      console.error('搜索失败:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : '搜索失败，请重试');
    }
  }, [
    generateCacheKey,
    isCacheValid,
    mockSearchAPI,
    addRecentSearch,
    updateStats,
    searchConfig.enableResultAnalytics,
  ]);

  /**
   * 刷新当前结果
   */
  const refreshResults = useCallback(async () => {
    if (lastSearchRef.current) {
      // 清除缓存
      resultsCache.current.clear();
      // 重新加载
      // 需要当前筛选状态，这里简化处理
      await loadResults(lastSearchRef.current, {} as SearchPageFilters, currentPage);
    }
  }, [loadResults, currentPage]);

  /**
   * 加载更多结果（无限滚动）
   */
  const loadMoreResults = useCallback(async () => {
    if (!searchConfig.enableInfiniteScroll || status === 'loading') return;
    
    const nextPage = currentPage + 1;
    const totalPages = Math.ceil(totalResults / searchConfig.itemsPerPage);
    
    if (nextPage <= totalPages) {
      // 简化处理，实际需要追加结果
      await loadResults(lastSearchRef.current, {} as SearchPageFilters, nextPage);
    }
  }, [
    searchConfig.enableInfiniteScroll,
    searchConfig.itemsPerPage,
    status,
    currentPage,
    totalResults,
    loadResults,
  ]);

  /**
   * 设置页码
   */
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    // 更新store中的分页状态
    store.actions.setPage(page);
    // 同步URL状态
    syncUrlFromSearchPage();
  }, [store.actions, syncUrlFromSearchPage]);

  /**
   * 清除结果
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setStatus('idle');
    setError(null);
    setTotalResults(0);
    setSearchTime(0);
    setCurrentPage(1);
    setAnalytics(null);
    lastSearchRef.current = '';
  }, []);

  /**
   * 重试搜索
   */
  const retrySearch = useCallback(() => {
    if (lastSearchRef.current) {
      loadResults(lastSearchRef.current, {} as SearchPageFilters, currentPage);
    }
  }, [loadResults, currentPage]);

  /**
   * 跟踪网站访问
   */
  const trackWebsiteVisit = useCallback((website: WebsiteCardData, position: number) => {
    if (searchConfig.enableResultAnalytics && analytics) {
      const updatedAnalytics: SearchAnalytics = {
        ...analytics,
        resultClicked: {
          websiteId: website.id,
          position,
        },
      };
      setAnalytics(updatedAnalytics);
      console.log('跟踪网站访问:', { website: website.title, position });
    }
  }, [searchConfig.enableResultAnalytics, analytics]);

  // 计算衍生状态
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isEmpty = status === 'empty';
  const totalPages = Math.ceil(totalResults / searchConfig.itemsPerPage);
  const hasMoreData = currentPage < totalPages;

  // 构建搜索结果状态
  const searchResultsState: SearchResultsState = useMemo(() => ({
    results,
    status,
    isLoading,
    isError,
    error,
    totalResults,
    searchTime,
    currentPage,
    totalPages,
    hasMoreData,
    isEmpty,
    lastSearchQuery: lastSearchRef.current,
    analytics,
  }), [
    results,
    status,
    isLoading,
    isError,
    error,
    totalResults,
    searchTime,
    currentPage,
    totalPages,
    hasMoreData,
    isEmpty,
    analytics,
  ]);

  // 构建搜索结果操作
  const searchResultsActions: SearchResultsActions = useMemo(() => ({
    loadResults,
    refreshResults,
    loadMoreResults,
    setPage,
    clearResults,
    retrySearch,
    trackWebsiteVisit,
  }), [
    loadResults,
    refreshResults,
    loadMoreResults,
    setPage,
    clearResults,
    retrySearch,
    trackWebsiteVisit,
  ]);

  return {
    // 搜索结果状态
    ...searchResultsState,
    
    // 搜索结果操作
    ...searchResultsActions,
    
    // 配置信息
    config: searchConfig,
  };
}

/**
 * 搜索页面综合Hook
 * 
 * 组合搜索筛选器和搜索结果hooks，提供完整的搜索页面状态管理
 * 包含URL状态同步和浏览器前进后退支持
 */
export function useSearchPage(
  filtersConfig?: SearchFiltersConfig,
  resultsConfig?: SearchResultsConfig
) {
  const searchFilters = useSearchFilters(filtersConfig);
  const searchResults = useSearchResults(resultsConfig);
  const { syncSearchPageFromUrl, urlState } = useSearchPageUrlSync();
  
  // 从URL恢复搜索状态 (组件初始化时)
  useEffect(() => {
    // 检查URL是否包含搜索参数
    const hasUrlParams = Object.entries(urlState).some(([_, value]) => 
      value !== undefined && value !== null && value !== ''
    );
    
    if (hasUrlParams) {
      console.log('从URL恢复搜索状态:', urlState);
      syncSearchPageFromUrl();
      
      // 如果有搜索查询，自动触发搜索
      if (urlState.search) {
        searchFilters.executeSearch(urlState.search);
      }
    }
  }, []); // 只在组件初始化时运行一次
  
  // 监听浏览器前进后退事件，恢复搜索状态
  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      console.log('浏览器后退/前进，恢复搜索状态');
      syncSearchPageFromUrl();
      
      // 如果状态中有搜索查询，重新执行搜索
      if (searchFilters.query) {
        searchFilters.executeSearch();
      }
    };
    
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [syncSearchPageFromUrl, searchFilters]);

  /**
   * 执行完整搜索流程
   */
  const performSearch = useCallback(async (
    query?: string,
    filters?: Partial<SearchPageFilters>
  ) => {
    const searchQuery = query || searchFilters.query;
    const searchFilters_combined = { ...searchFilters.filters, ...filters };
    
    // 先更新筛选器状态
    if (query !== undefined) {
      searchFilters.setQuery(query);
    }
    
    // 执行搜索
    searchFilters.executeSearch(searchQuery, filters);
    
    // 加载搜索结果
    await searchResults.loadResults(searchQuery, searchFilters_combined, 1);
  }, [searchFilters, searchResults]);

  /**
   * 重置整个搜索页面
   */
  const resetSearchPage = useCallback(() => {
    searchFilters.clearSearch();
    searchFilters.resetFilters();
    searchResults.clearResults();
  }, [searchFilters, searchResults]);

  return {
    // 搜索筛选器
    filters: searchFilters,
    
    // 搜索结果
    results: searchResults,
    
    // 综合操作
    performSearch,
    resetSearchPage,
    
    // URL状态同步
    urlState,
    syncFromUrl: syncSearchPageFromUrl,
    syncToUrl: searchFilters.syncToUrl,
    
    // 综合状态
    isSearching: searchFilters.isSearching || searchResults.isLoading,
    hasActiveSearch: searchFilters.hasActiveSearch,
    hasActiveFilters: searchFilters.hasActiveFilters,
    
    // URL同步状态
    isUrlSynced: true, // 表示URL状态已同步
  };
}

/**
 * 搜索页面URL状态同步Hook
 * 
 * 专门用于搜索页面的URL参数管理，包含完整的搜索状态同步
 * 支持浏览器前进后退、直接URL访问、状态恢复等功能
 */
export function useSearchPageUrlStateSync() {
  const { syncSearchPageFromUrl, syncUrlFromSearchPage, urlState } = useSearchPageUrlSync();
  const store = useHomepageStore();
  
  /**
   * 从URL恢复完整搜索状态
   */
  const restoreFromUrl = useCallback(() => {
    console.log('从URL恢复搜索状态:', urlState);
    syncSearchPageFromUrl();
  }, [syncSearchPageFromUrl, urlState]);
  
  /**
   * 将当前搜索状态同步到URL
   */
  const saveToUrl = useCallback(() => {
    syncUrlFromSearchPage();
  }, [syncUrlFromSearchPage]);
  
  /**
   * 检查URL是否包含搜索参数
   */
  const hasUrlParams = useMemo(() => {
    return Object.entries(urlState).some(([_, value]) => {
      return value !== undefined && value !== null && value !== '';
    });
  }, [urlState]);
  
  /**
   * 获取当前搜索状态的URL
   */
  const getCurrentUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    Object.entries(urlState).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
  }, [urlState]);
  
  /**
   * 生成分享用的URL
   */
  const getShareableUrl = useCallback(() => {
    const fullUrl = getCurrentUrl();
    return `${window.location.origin}${fullUrl}`;
  }, [getCurrentUrl]);
  
  /**
   * 清除所有URL参数
   */
  const clearUrlParams = useCallback(() => {
    // 使用window.history.replaceState来清除URL参数而不触发导航
    window.history.replaceState({}, '', window.location.pathname);
  }, []);
  
  return {
    // URL状态
    urlState,
    hasUrlParams,
    
    // 同步操作
    restoreFromUrl,
    saveToUrl,
    
    // URL生成
    getCurrentUrl,
    getShareableUrl,
    
    // URL管理
    clearUrlParams,
    
    // 便捷访问
    syncFromUrl: syncSearchPageFromUrl,
    syncToUrl: syncUrlFromSearchPage,
  };
}

/**
 * 搜索页面URL参数提取Hook
 * 
 * 提供从URL中提取和验证搜索参数的便捷方法
 */
export function useSearchPageUrlParams() {
  const { urlState } = useSearchPageUrlSync();
  
  /**
   * 提取基础搜索参数
   */
  const baseParams = useMemo(() => ({
    search: urlState.search || '',
    category: urlState.category || null,
    tags: urlState.tags ? urlState.tags.split(',').filter(Boolean) : [],
    sortBy: (urlState.sortBy as SortField) || 'created_at',
    sortOrder: (urlState.sortOrder as SortOrder) || 'desc',
    page: urlState.page || 1,
    limit: urlState.limit || 12,
    featured: urlState.featured || false,
    includeAds: urlState.includeAds ?? true,
    minRating: urlState.minRating || 0,
  }), [urlState]);
  
  /**
   * 提取搜索页面特定参数
   */
  const searchPageParams = useMemo(() => ({
    searchType: (urlState.searchType as SearchPageState['searchType']) || 'all',
    searchScope: (urlState.searchScope as SearchPageState['searchScope']) || 'all',
    searchMode: (urlState.searchMode as SearchPageState['searchMode']) || 'simple',
    exactMatch: urlState.exactMatch || false,
    excludeTerms: urlState.excludeTerms ? urlState.excludeTerms.split(',').filter(Boolean) : [],
    requiredTerms: urlState.requiredTerms ? urlState.requiredTerms.split(',').filter(Boolean) : [],
    dateRange: {
      from: urlState.dateFrom || null,
      to: urlState.dateTo || null,
    },
    language: urlState.language || null,
    status: urlState.status ? urlState.status.split(',').filter(Boolean) : [],
    viewMode: (urlState.view as SearchPageState['viewMode']) || 'grid',
    groupBy: (urlState.groupBy as SearchPageState['groupBy']) || 'none',
    showPreview: urlState.showPreview ?? true,
    relevanceSort: urlState.relevance || false,
  }), [urlState]);
  
  /**
   * 合并后的完整搜索参数
   */
  const allParams = useMemo(() => ({
    ...baseParams,
    ...searchPageParams,
  }), [baseParams, searchPageParams]);
  
  /**
   * 检查是否有有效的搜索查询
   */
  const hasSearchQuery = useMemo(() => {
    return Boolean(baseParams.search && baseParams.search.trim());
  }, [baseParams.search]);
  
  /**
   * 检查是否有活跃的筛选条件
   */
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      baseParams.category ||
      baseParams.tags.length > 0 ||
      baseParams.featured ||
      !baseParams.includeAds ||
      baseParams.minRating > 0 ||
      searchPageParams.exactMatch ||
      searchPageParams.excludeTerms.length > 0 ||
      searchPageParams.requiredTerms.length > 0 ||
      searchPageParams.dateRange.from ||
      searchPageParams.dateRange.to ||
      searchPageParams.language ||
      searchPageParams.status.length > 0
    );
  }, [baseParams, searchPageParams]);
  
  return {
    // 原始URL状态
    urlState,
    
    // 解析后的参数
    baseParams,
    searchPageParams,
    allParams,
    
    // 状态检查
    hasSearchQuery,
    hasActiveFilters,
    
    // 便捷访问特定参数
    searchQuery: baseParams.search,
    currentPage: baseParams.page,
    sortBy: baseParams.sortBy,
    sortOrder: baseParams.sortOrder,
    selectedCategory: baseParams.category,
    selectedTags: baseParams.tags,
  };
}

// 默认导出
export default useSearchPage;