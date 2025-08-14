/**
 * Website Search Hook
 * 
 * 提供搜索功能的业务逻辑，包括防抖处理、状态管理和URL同步
 * 集成homepage-store状态管理和nuqs URL同步功能
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useHomepageStore, useHomepageUrlSync } from '../stores/homepage-store';
import type { SearchSuggestion } from '../types/filters';

/**
 * 搜索配置接口
 */
export interface SearchConfig {
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 最小搜索长度 */
  minSearchLength?: number;
  /** 最大搜索建议数量 */
  maxSuggestions?: number;
  /** 是否启用搜索建议 */
  enableSuggestions?: boolean;
  /** 是否自动执行搜索 */
  autoSearch?: boolean;
}

/**
 * 搜索状态接口
 */
export interface SearchState {
  /** 当前搜索查询 */
  query: string;
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 搜索建议列表 */
  suggestions: SearchSuggestion[];
  /** 是否正在加载建议 */
  isLoadingSuggestions: boolean;
  /** 搜索错误信息 */
  error: string | null;
  /** 是否有活跃的搜索 */
  hasActiveSearch: boolean;
}

/**
 * 搜索操作接口
 */
export interface SearchActions {
  /** 设置搜索查询 */
  setQuery: (query: string) => void;
  /** 执行搜索 */
  executeSearch: (query?: string) => void;
  /** 清除搜索 */
  clearSearch: () => void;
  /** 选择搜索建议 */
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  /** 重置搜索状态 */
  resetSearch: () => void;
  /** 刷新搜索建议 */
  refreshSuggestions: () => void;
}

/**
 * 搜索验证结果接口
 */
export interface SearchValidation {
  isValid: boolean;
  message?: string;
}

/**
 * 默认搜索配置
 */
const DEFAULT_CONFIG: Required<SearchConfig> = {
  debounceDelay: 300,
  minSearchLength: 1,
  maxSuggestions: 8,
  enableSuggestions: true,
  autoSearch: true,
};

/**
 * 网站搜索Hook
 * 
 * 提供完整的搜索功能，包括：
 * - 防抖处理
 * - 状态管理集成
 * - URL状态同步
 * - 搜索建议（future enhancement）
 * - 搜索验证
 * - 错误处理
 */
export function useWebsiteSearch(config: SearchConfig = {}) {
  // 合并配置
  const searchConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // 获取状态管理
  const store = useHomepageStore();
  const { syncUrlFromStore } = useHomepageUrlSync();
  
  // 内部状态引用
  const searchInputRef = useRef<string>(store.search);
  const isExecutingRef = useRef<boolean>(false);
  
  // 从store获取相关状态
  const {
    search: currentQuery,
    searchSuggestions,
    ui: { isLoading },
    actions: {
      setSearch,
      clearSearch: storeClearSearch,
      setLoading,
    },
  } = store;

  /**
   * 验证搜索查询
   */
  const validateSearch = useCallback((query: string): SearchValidation => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length === 0) {
      return { isValid: true }; // 空查询是有效的（清空搜索）
    }
    
    if (trimmedQuery.length < searchConfig.minSearchLength) {
      return {
        isValid: false,
        message: `搜索关键词至少需要 ${searchConfig.minSearchLength} 个字符`,
      };
    }
    
    // 检查特殊字符（基本验证）
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
   * 模拟搜索建议API（future enhancement）
   * 当前返回空数组，后续可接入真实的建议服务
   */
  const fetchSearchSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    // Future enhancement: 实际的搜索建议API调用
    if (!searchConfig.enableSuggestions || query.length < 2) {
      return [];
    }
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 返回模拟建议（后续替换为真实API）
    return [];
  }, [searchConfig.enableSuggestions]);

  /**
   * 防抖的搜索建议获取
   */
  const debouncedFetchSuggestions = useDebouncedCallback(
    async (query: string) => {
      if (!searchConfig.enableSuggestions) return;
      
      try {
        const suggestions = await fetchSearchSuggestions(query);
        // Future: 更新搜索建议状态
        console.log('搜索建议:', suggestions);
      } catch (error) {
        console.error('获取搜索建议失败:', error);
      }
    },
    searchConfig.debounceDelay
  );

  /**
   * 防抖的搜索执行
   */
  const debouncedExecuteSearch = useDebouncedCallback(
    (query: string) => {
      if (isExecutingRef.current) return;
      
      const validation = validateSearch(query);
      if (!validation.isValid) {
        console.warn('搜索验证失败:', validation.message);
        return;
      }
      
      isExecutingRef.current = true;
      
      try {
        // 更新store状态
        setSearch(query.trim());
        
        // 同步URL状态
        syncUrlFromStore();
        
        console.log('执行搜索:', query.trim() || '(清空搜索)');
      } catch (error) {
        console.error('搜索执行失败:', error);
      } finally {
        isExecutingRef.current = false;
      }
    },
    searchConfig.debounceDelay
  );

  /**
   * 设置搜索查询
   */
  const setQuery = useCallback((query: string) => {
    searchInputRef.current = query;
    
    if (searchConfig.autoSearch) {
      debouncedExecuteSearch(query);
    }
    
    if (searchConfig.enableSuggestions && query.trim().length >= 2) {
      debouncedFetchSuggestions(query.trim());
    }
  }, [
    searchConfig.autoSearch,
    searchConfig.enableSuggestions,
    debouncedExecuteSearch,
    debouncedFetchSuggestions,
  ]);

  /**
   * 立即执行搜索
   */
  const executeSearch = useCallback((query?: string) => {
    const searchQuery = query !== undefined ? query : searchInputRef.current;
    const validation = validateSearch(searchQuery);
    
    if (!validation.isValid && validation.message) {
      console.warn('搜索验证失败:', validation.message);
      return;
    }
    
    // 取消防抖，立即执行
    debouncedExecuteSearch.cancel();
    
    try {
      setSearch(searchQuery.trim());
      syncUrlFromStore();
      console.log('立即执行搜索:', searchQuery.trim() || '(清空搜索)');
    } catch (error) {
      console.error('搜索执行失败:', error);
    }
  }, [setSearch, syncUrlFromStore, validateSearch, debouncedExecuteSearch]);

  /**
   * 清除搜索
   */
  const clearSearch = useCallback(() => {
    searchInputRef.current = '';
    debouncedExecuteSearch.cancel();
    debouncedFetchSuggestions.cancel();
    
    try {
      storeClearSearch();
      syncUrlFromStore();
      console.log('清除搜索');
    } catch (error) {
      console.error('清除搜索失败:', error);
    }
  }, [storeClearSearch, syncUrlFromStore, debouncedExecuteSearch, debouncedFetchSuggestions]);

  /**
   * 选择搜索建议
   */
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    const query = suggestion.text;
    searchInputRef.current = query;
    
    try {
      setSearch(query);
      syncUrlFromStore();
      console.log('选择搜索建议:', suggestion);
    } catch (error) {
      console.error('选择搜索建议失败:', error);
    }
  }, [setSearch, syncUrlFromStore]);

  /**
   * 重置搜索状态
   */
  const resetSearch = useCallback(() => {
    searchInputRef.current = '';
    debouncedExecuteSearch.cancel();
    debouncedFetchSuggestions.cancel();
    
    // 不清除store中的搜索，只重置本地状态
    console.log('重置搜索状态');
  }, [debouncedExecuteSearch, debouncedFetchSuggestions]);

  /**
   * 刷新搜索建议
   */
  const refreshSuggestions = useCallback(() => {
    const query = searchInputRef.current;
    if (searchConfig.enableSuggestions && query.trim().length >= 2) {
      debouncedFetchSuggestions.cancel();
      debouncedFetchSuggestions(query.trim());
    }
  }, [searchConfig.enableSuggestions, debouncedFetchSuggestions]);

  // 同步搜索输入引用与store状态
  useEffect(() => {
    searchInputRef.current = currentQuery;
  }, [currentQuery]);

  // 清理副作用
  useEffect(() => {
    return () => {
      debouncedExecuteSearch.cancel();
      debouncedFetchSuggestions.cancel();
    };
  }, [debouncedExecuteSearch, debouncedFetchSuggestions]);

  // 构建搜索状态
  const searchState: SearchState = useMemo(() => ({
    query: currentQuery,
    isSearching: isLoading,
    suggestions: [], // Future: 使用 searchSuggestions.suggestions 当实现后
    isLoadingSuggestions: searchSuggestions.isLoading,
    error: null, // Future: 添加错误状态管理
    hasActiveSearch: currentQuery.trim().length > 0,
  }), [
    currentQuery,
    isLoading,
    searchSuggestions.isLoading,
  ]);

  // 构建搜索操作
  const searchActions: SearchActions = useMemo(() => ({
    setQuery,
    executeSearch,
    clearSearch,
    selectSuggestion,
    resetSearch,
    refreshSuggestions,
  }), [
    setQuery,
    executeSearch,
    clearSearch,
    selectSuggestion,
    resetSearch,
    refreshSuggestions,
  ]);

  // 返回搜索状态和操作
  return {
    // 搜索状态
    ...searchState,
    
    // 搜索操作
    ...searchActions,
    
    // 额外的便捷属性
    config: searchConfig,
    validation: validateSearch,
    
    // 调试信息（开发环境）
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        inputRef: searchInputRef.current,
        isExecuting: isExecutingRef.current,
        storeQuery: currentQuery,
      },
    }),
  };
}

/**
 * 简化的搜索Hook
 * 
 * 为简单使用场景提供最基本的搜索功能
 */
export function useSimpleSearch() {
  return useWebsiteSearch({
    enableSuggestions: false,
    autoSearch: true,
    debounceDelay: 500,
  });
}

// 类型已在上方定义，通过 index.ts 统一导出

// 默认导出
export default useWebsiteSearch;