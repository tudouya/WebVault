/**
 * SearchPage 主组件
 * 
 * 集成完整的搜索页面功能，包括导航栏、搜索标题、筛选器、结果展示和分页导航
 * 复用HomePage的布局结构和响应式设计，确保用户体验一致性
 * 
 * 需求引用:
 * - 1.1: HeaderNavigation导航栏集成
 * - 1.2: SearchHeader搜索标题区域
 * - 1.4: SearchFilters和SearchResults组件集成
 * - 2.0: 搜索功能完整流程
 * - 4.1-4.6: 分页导航功能 - 复用Pagination组件，联动搜索条件，平滑滚动
 * - 11.0: 布局和间距系统 - 响应式布局设计
 * - 12.0: 交互效果和动画 - 平滑过渡、固定导航栏
 */

'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

// 导入已存在的组件
import { HeaderNavigation } from './HeaderNavigation';
import { SearchHeader } from './SearchHeader';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import { Footer } from './Footer';
import { ErrorBoundary } from './ErrorBoundary';

// 导入hooks和类型
import type { WebsiteCardData, WebsiteFilters } from '../types/website';
import type { SearchHeaderProps, SearchPageStatus } from '../types/search';
import { useSearchPage } from '../hooks';

/**
 * SearchPaginationWrapper 组件
 * 
 * 包装现有的 Pagination 组件以适配搜索页面的需求
 * 提供独立的分页状态管理，不与首页分页状态冲突
 * 使用React.memo优化性能，避免不必要的重新渲染
 */
interface SearchPaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const SearchPaginationWrapper = React.memo(function SearchPaginationWrapper({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className
}: SearchPaginationWrapperProps) {
  const showPageNumbers = 5; // 显示页码数量，与 Pagination 组件保持一致

  // 确保有合理的默认值
  const safeTotalPages = Math.max(totalPages, 1);
  const safeTotalItems = Math.max(totalItems, 0);
  const safeCurrentPage = Math.max(Math.min(currentPage, safeTotalPages), 1);

  // 如果只有一页或没有数据，不显示分页
  if (safeTotalPages <= 1 || safeTotalItems === 0) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= safeTotalPages && page !== safeCurrentPage) {
      onPageChange(page);
    }
  };

  const handleNextPage = () => {
    if (safeCurrentPage < safeTotalPages) {
      handlePageChange(safeCurrentPage + 1);
    }
  };

  // 计算显示的页码范围（复用 Pagination 组件的逻辑）
  const getPageRange = () => {
    const half = Math.floor(showPageNumbers / 2);
    let start = Math.max(1, safeCurrentPage - half);
    const end = Math.min(safeTotalPages, start + showPageNumbers - 1);
    
    // 调整开始位置，确保显示足够的页码
    if (end - start + 1 < showPageNumbers) {
      start = Math.max(1, end - showPageNumbers + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageRange = getPageRange();
  const isLastPage = safeCurrentPage >= safeTotalPages;

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-2 py-6",
        className
      )}
      role="navigation"
      aria-label="搜索结果分页导航"
    >
      {/* 页码数字按钮 */}
      <div className="flex items-center gap-1">
        {/* 显示第一页（如果不在当前范围内） */}
        {pageRange[0] > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(1)}
              className={cn(
                "w-10 h-10 p-0 text-sm font-medium",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="转到第1页"
            >
              1
            </Button>
            {pageRange[0] > 2 && (
              <span className="px-2 text-muted-foreground text-sm">...</span>
            )}
          </>
        )}

        {/* 当前范围的页码 */}
        {pageRange.map((page) => (
          <Button
            key={page}
            variant={page === safeCurrentPage ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className={cn(
              "w-10 h-10 p-0 text-sm font-medium",
              page === safeCurrentPage
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={page === safeCurrentPage ? `当前页 ${page}` : `转到第${page}页`}
            aria-current={page === safeCurrentPage ? "page" : undefined}
          >
            {page}
          </Button>
        ))}

        {/* 显示最后一页（如果不在当前范围内） */}
        {pageRange[pageRange.length - 1] < safeTotalPages && (
          <>
            {pageRange[pageRange.length - 1] < safeTotalPages - 1 && (
              <span className="px-2 text-muted-foreground text-sm">...</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(safeTotalPages)}
              className={cn(
                "w-10 h-10 p-0 text-sm font-medium",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label={`转到第${safeTotalPages}页`}
            >
              {safeTotalPages}
            </Button>
          </>
        )}
      </div>

      {/* 下一页箭头按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNextPage}
        disabled={isLastPage}
        className={cn(
          "w-10 h-10 p-0 ml-2",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        aria-label={isLastPage ? "已是最后一页" : "下一页"}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 页面信息（移动端隐藏） */}
      <div className="hidden sm:flex items-center ml-4 text-sm text-muted-foreground">
        第 {safeCurrentPage} 页，共 {safeTotalPages} 页
        <span className="mx-2">•</span>
        共 {safeTotalItems.toLocaleString()} 项
      </div>
    </div>
  );
});

/**
 * SearchPage组件属性接口
 */
export interface SearchPageProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 页面加载状态
   */
  isLoading?: boolean;
  
  /**
   * 是否显示导航栏
   * @default true
   */
  showNavigation?: boolean;
  
  /**
   * 是否显示搜索标题区域
   * @default true
   */
  showSearchHeader?: boolean;
  
  /**
   * 是否显示页脚区域
   * @default true
   */
  showFooter?: boolean;
  
  /**
   * 搜索标题属性
   */
  searchHeaderProps?: SearchHeaderProps;
  
  /**
   * 当前搜索查询词
   */
  searchQuery?: string;
  
  /**
   * 搜索结果网站数据列表
   */
  websites?: WebsiteCardData[];
  
  /**
   * 搜索结果总数
   */
  totalResults?: number;
  
  /**
   * 搜索状态
   */
  searchStatus?: SearchPageStatus;
  
  /**
   * 搜索错误信息
   */
  searchError?: string;
  
  /**
   * 搜索回调函数
   */
  onSearch?: (query: string) => void;
  
  /**
   * 筛选器变化回调函数
   */
  onFiltersChange?: (filters: Partial<WebsiteFilters>) => void;
  
  /**
   * 重置筛选回调函数
   */
  onFiltersReset?: () => void;
  
  /**
   * 网站卡片点击回调
   */
  onWebsiteVisit?: (website: WebsiteCardData) => void;
  
  /**
   * 标签点击回调
   */
  onTagClick?: (tag: string) => void;
  
  /**
   * 搜索重试回调
   */
  onSearchRetry?: () => void;
  
  /**
   * 当前页码
   */
  currentPage?: number;
  
  /**
   * 每页显示数量
   */
  itemsPerPage?: number;
  
  /**
   * 总页数
   */
  totalPages?: number;
  
  /**
   * 分页变化回调
   */
  onPageChange?: (page: number) => void;
  
  /**
   * 是否显示分页组件
   * @default true
   */
  showPagination?: boolean;
}

/**
 * SearchPage 搜索页面主组件
 * 
 * 集成完整的搜索功能：导航栏、搜索标题、筛选控制、结果展示、分页导航和页脚
 * 实现响应式布局，支持状态管理、平滑动画和固定导航栏
 * 提供现代化的搜索体验，包含交互动画、加载效果、错误处理和分页功能
 * 
 * 性能优化特性：
 * - 使用React.memo避免不必要的重新渲染
 * - 使用useCallback优化事件处理函数
 * - 防抖搜索输入减少API调用
 * - 组件级别的性能监控和优化
 * 
 * 分页功能特性：
 * - 复用现有Pagination组件的UI设计，保持交互一致性
 * - 独立分页状态管理，不与首页分页状态冲突
 * - 分页变化时保持搜索条件和筛选状态
 * - 翻页时平滑滚动到页面顶部
 * - 仅在有多页结果时显示分页组件
 */
const SearchPage = React.memo(function SearchPage({
  className,
  isLoading = false,
  showNavigation = true,
  showSearchHeader = true,
  showFooter = true,
  showPagination = true,
  searchHeaderProps,
  searchQuery: externalSearchQuery,
  websites: externalWebsites,
  totalResults: externalTotalResults,
  searchStatus: externalSearchStatus,
  searchError: externalSearchError,
  currentPage: externalCurrentPage,
  itemsPerPage = 12,
  totalPages: externalTotalPages,
  onSearch,
  onFiltersChange,
  onFiltersReset,
  onWebsiteVisit,
  onTagClick,
  onSearchRetry,
  onPageChange,
}: SearchPageProps) {
  const {
    filters,
    results,
    performSearch,
  } = useSearchPage(
    {
      debounceDelay: 300,
      enableRealTimeSearch: false,
      enableSuggestions: false,
      autoAddToHistory: true,
      minSearchLength: 1,
      enableAnalytics: true,
    },
    {
      itemsPerPage,
    }
  );

  const {
    results: websiteResults,
    isLoading: searchLoading,
    status: resultStatus,
    error: resultError,
    totalResults: resultTotal,
    currentPage: resultCurrentPage,
    totalPages: resultTotalPages,
    loadResults: loadSearchResults,
    setPage: setSearchPage,
    retrySearch: retrySearchResults,
  } = results;

  const initialLoadRef = React.useRef(false);
  React.useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      const initialQuery = filters.query || externalSearchQuery || '';
      void performSearch(initialQuery);
    }
  }, [performSearch, filters.query, externalSearchQuery]);

  const activeQuery = filters.query || externalSearchQuery || '';
  const effectiveWebsites = externalWebsites ?? websiteResults;
  const combinedLoading = isLoading || searchLoading;
  const searchStatus = externalSearchStatus ?? resultStatus;
  const searchErrorMessage = externalSearchError ?? resultError ?? undefined;
  const isSearchError = searchStatus === 'error' || Boolean(searchErrorMessage);
  const effectiveTotalResults = typeof externalTotalResults === 'number' ? externalTotalResults : resultTotal;
  const effectiveTotalPages = typeof externalTotalPages === 'number' ? externalTotalPages : resultTotalPages;
  const effectiveCurrentPage = externalCurrentPage ?? resultCurrentPage;
  const shouldShowPagination = showPagination
    && effectiveTotalPages > 1
    && effectiveTotalResults > 0
    && !combinedLoading
    && !isSearchError;

  const handleWebsiteVisit = useCallback((website: WebsiteCardData) => {
    onWebsiteVisit?.(website);
  }, [onWebsiteVisit]);

  const handleTagClick = useCallback((tag: string) => {
    onTagClick?.(tag);
  }, [onTagClick]);

  const handleSearch = useCallback((query: string) => {
    onSearch?.(query);
    void performSearch(query);
  }, [onSearch, performSearch]);

  const handleFiltersChange = useCallback((nextFilters: Partial<WebsiteFilters>) => {
    onFiltersChange?.(nextFilters);
    void performSearch(undefined, filters.filters);
  }, [onFiltersChange, performSearch, filters.filters]);

  const handleReset = useCallback(() => {
    onFiltersReset?.();
    void performSearch('');
  }, [onFiltersReset, performSearch]);

  const handleRetry = useCallback(() => {
    onSearchRetry?.();
    retrySearchResults();
  }, [onSearchRetry, retrySearchResults]);

  const handlePageChange = useCallback((page: number) => {
    if (page === effectiveCurrentPage) {
      return;
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    onPageChange?.(page);
    setSearchPage(page);
    void loadSearchResults(activeQuery, filters.filters, page);
  }, [activeQuery, effectiveCurrentPage, onPageChange, setSearchPage, loadSearchResults, filters.filters]);

  const [isScrolled, setIsScrolled] = React.useState(false);
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const threshold = 100;
      setIsScrolled(scrollTop > threshold);
    };

    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const showGlobalLoadingOverlay = searchStatus === 'loading' && searchLoading;

  return (
    <div 
      className={cn(
        // 基础页面布局 - 复用HomePage样式
        'min-h-screen bg-background',
        // 确保内容能够正确显示
        'flex flex-col',
        className
      )}
      role="main"
      aria-label="WebVault搜索页面"
    >
      {/* 导航栏区域 - 固定定位和平滑过渡 */}
      {showNavigation && (
        <ErrorBoundary level="component" onError={(error) => console.error('Navigation error:', error)}>
          <div className={cn(
            "navbar-fixed",
            isScrolled && "navbar-scrolled"
          )}>
            <HeaderNavigation />
          </div>
        </ErrorBoundary>
      )}
      
      {/* 主要内容区域 */}
      <main className="flex-1">
        {/* 搜索标题区域 - SearchHeader组件 */}
        {showSearchHeader && (
          <ErrorBoundary level="section" onError={(error) => console.error('Search header error:', error)}>
            <SearchHeader 
              {...searchHeaderProps}
              className="border-b border-border"
            />
          </ErrorBoundary>
        )}
        
        {/* 搜索和筛选控制区域 - SearchFilters组件 */}
        <ErrorBoundary level="section" onError={(error) => console.error('Search filters error:', error)}>
          <SearchFilters
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            className={cn(
              "transition-all duration-300 ease-in-out",
              combinedLoading && "opacity-75"
            )}
          />
        </ErrorBoundary>
        
        {/* 搜索结果展示区域 - 复用HomePage的内容区域样式 */}
        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ErrorBoundary level="section" onError={(error) => console.error('Search results error:', error)}>
              <div 
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  "animate-in fade-in-50"
                )} 
                aria-label="搜索结果区域"
              >
                <SearchResults
                  websites={effectiveWebsites}
                  isLoading={combinedLoading}
                  isError={isSearchError}
                  error={searchErrorMessage}
                  searchQuery={activeQuery}
                  totalResults={effectiveTotalResults}
                  onWebsiteVisit={handleWebsiteVisit}
                  onTagClick={handleTagClick}
                  onRetry={handleRetry}
                  className={cn(
                    // 添加内容切换动画
                    'transition-all duration-300 ease-in-out',
                    combinedLoading && 'opacity-75'
                  )}
                />
              </div>
            </ErrorBoundary>
            
            {/* 分页导航组件 - 仅在有多页结果时显示 */}
            {shouldShowPagination && (
              <ErrorBoundary level="section" onError={(error) => console.error('Pagination error:', error)}>
                <div className="mt-8">
                  <SearchPaginationWrapper
                    currentPage={effectiveCurrentPage}
                    totalPages={effectiveTotalPages}
                    totalItems={effectiveTotalResults}
                    onPageChange={handlePageChange}
                    className={cn(
                      "transition-all duration-300 ease-in-out",
                      combinedLoading && "opacity-75"
                    )}
                  />
                </div>
              </ErrorBoundary>
            )}
          </div>
        </div>
      </main>
      
      {/* 页脚区域 - 支持平滑动画过渡 */}
      {showFooter && (
        <ErrorBoundary level="component" onError={(error) => console.error('Footer error:', error)}>
          <div 
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: isLoading ? 0.7 : 1,
              transform: isLoading ? 'translateY(10px)' : 'translateY(0px)'
            }}
          >
            <Footer 
              className="transition-all duration-500 ease-in-out"
            />
          </div>
        </ErrorBoundary>
      )}
      
      {/* 全局加载状态覆盖层 - 增强subtle加载动画 */}
      {showGlobalLoadingOverlay && (
        <div 
          className={cn(
            "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
            "flex items-center justify-center",
            "transition-all duration-300 ease-in-out",
            "animate-in fade-in-0"
          )}
          role="status"
          aria-live="polite"
          aria-label="搜索进行中"
        >
          <div className="flex flex-col items-center space-y-4 animate-in slide-in-from-bottom-4">
            {/* 增强的加载动画 - 使用脉冲效果 */}
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full border border-primary/20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground animate-pulse">搜索中...</p>
              <div className="flex space-x-1 justify-center">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * SearchPage组件默认导出
 * 提供向后兼容性
 */
export { SearchPage };
export default SearchPage;
