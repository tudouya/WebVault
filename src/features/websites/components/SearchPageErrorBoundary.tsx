/**
 * SearchPageErrorBoundary 组件
 * 
 * 搜索页面专用的错误边界组件，复用现有ErrorBoundary逻辑
 * 添加搜索特定的错误恢复和重试功能，确保搜索错误不影响整个应用程序
 * 
 * 特性:
 * - 复用ErrorBoundary的核心错误处理逻辑
 * - 添加搜索特定的错误类型检测
 * - 提供搜索上下文的错误恢复选项
 * - 智能的重试机制和降级处理
 * - 保持搜索状态的局部隔离
 * 
 * 需求引用:
 * - 3.7: 当搜索出错时系统应该显示错误状态和重试选项
 */

'use client';

import React from 'react';
import { Search, RefreshCw, Home, AlertTriangle, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 复用现有的ErrorBoundary类型和工具
import { 
  ErrorBoundary, 
  ErrorType, 
  ErrorInfo, 
  ErrorBoundaryProps,
  ErrorFallbackProps,
  detectErrorType 
} from './ErrorBoundary';

/**
 * 搜索特定的错误类型枚举
 */
export enum SearchErrorType {
  SEARCH_QUERY = 'search_query',
  SEARCH_API = 'search_api', 
  SEARCH_TIMEOUT = 'search_timeout',
  SEARCH_FILTER = 'search_filter',
  SEARCH_PAGINATION = 'search_pagination',
  SEARCH_RESULTS = 'search_results'
}

/**
 * 搜索错误边界组件属性
 */
export interface SearchPageErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallback'> {
  /** 当前搜索查询词 */
  searchQuery?: string;
  
  /** 搜索重试回调 */
  onSearchRetry?: () => void;
  
  /** 清除搜索状态回调 */
  onClearSearch?: () => void;
  
  /** 重置筛选器回调 */
  onResetFilters?: () => void;
  
  /** 搜索页面特定的错误处理回调 */
  onSearchError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** 错误边界作用域 */
  scope?: 'search-page' | 'search-results' | 'search-filters' | 'search-pagination';
}

/**
 * 搜索错误回退组件属性
 */
interface SearchErrorFallbackProps extends ErrorFallbackProps {
  searchQuery?: string;
  onSearchRetry?: () => void;
  onClearSearch?: () => void;
  onResetFilters?: () => void;
  scope?: 'search-page' | 'search-results' | 'search-filters' | 'search-pagination';
}

/**
 * 检测搜索特定的错误类型
 */
const detectSearchErrorType = (error: Error): SearchErrorType => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // 搜索查询错误
  if (message.includes('search query') || 
      message.includes('invalid query') ||
      message.includes('search params')) {
    return SearchErrorType.SEARCH_QUERY;
  }

  // 搜索API错误
  if (message.includes('search api') || 
      message.includes('search endpoint') ||
      message.includes('search service')) {
    return SearchErrorType.SEARCH_API;
  }

  // 搜索超时错误
  if (message.includes('search timeout') || 
      message.includes('search slow') ||
      (message.includes('timeout') && message.includes('search'))) {
    return SearchErrorType.SEARCH_TIMEOUT;
  }

  // 搜索筛选器错误
  if (message.includes('filter') || 
      message.includes('search filter') ||
      message.includes('filtering')) {
    return SearchErrorType.SEARCH_FILTER;
  }

  // 搜索分页错误
  if (message.includes('pagination') || 
      message.includes('page') ||
      message.includes('search page')) {
    return SearchErrorType.SEARCH_PAGINATION;
  }

  // 搜索结果处理错误
  if (message.includes('search result') || 
      message.includes('result processing') ||
      message.includes('search data')) {
    return SearchErrorType.SEARCH_RESULTS;
  }

  // 默认搜索API错误
  return SearchErrorType.SEARCH_API;
};

/**
 * 搜索错误回退UI组件
 */
function SearchErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  level,
  searchQuery,
  onSearchRetry,
  onClearSearch,
  onResetFilters,
  scope = 'search-page'
}: SearchErrorFallbackProps) {
  
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';
  
  // 根据搜索错误类型提供不同的显示和恢复选项
  const getSearchErrorDisplay = (errorType: ErrorType | SearchErrorType) => {
    switch (errorType) {
      case SearchErrorType.SEARCH_QUERY:
        return {
          icon: Search,
          title: '搜索查询有误',
          description: '请检查搜索关键词是否正确，或尝试使用不同的搜索词',
          actionText: '重新搜索',
          variant: 'default' as const,
          showClearSearch: true,
          showResetFilters: false,
        };
        
      case SearchErrorType.SEARCH_API:
        return {
          icon: Network,
          title: '搜索服务暂时不可用',
          description: '搜索功能遇到技术问题，请稍后重试或联系技术支持',
          actionText: '重试搜索',
          variant: 'default' as const,
          showClearSearch: false,
          showResetFilters: false,
        };
        
      case SearchErrorType.SEARCH_TIMEOUT:
        return {
          icon: RefreshCw,
          title: '搜索超时',
          description: '搜索用时过长，请尝试简化搜索条件或稍后重试',
          actionText: '重新搜索',
          variant: 'default' as const,
          showClearSearch: true,
          showResetFilters: true,
        };
        
      case SearchErrorType.SEARCH_FILTER:
        return {
          icon: AlertTriangle,
          title: '筛选条件有误',
          description: '当前筛选条件可能存在冲突，请重置筛选器后重试',
          actionText: '重置筛选',
          variant: 'default' as const,
          showClearSearch: false,
          showResetFilters: true,
        };
        
      case SearchErrorType.SEARCH_PAGINATION:
        return {
          icon: AlertTriangle,
          title: '分页加载失败',
          description: '页面跳转时出现问题，请返回第一页或重新搜索',
          actionText: '重新加载',
          variant: 'default' as const,
          showClearSearch: false,
          showResetFilters: false,
        };
        
      case SearchErrorType.SEARCH_RESULTS:
        return {
          icon: Search,
          title: '搜索结果处理失败',
          description: '搜索结果显示异常，请重新搜索或稍后重试',
          actionText: '重新搜索',
          variant: 'default' as const,
          showClearSearch: true,
          showResetFilters: false,
        };
        
      case ErrorType.NETWORK:
        return {
          icon: Network,
          title: '网络连接问题',
          description: '无法连接到搜索服务，请检查网络连接后重试',
          actionText: '重试搜索',
          variant: 'default' as const,
          showClearSearch: false,
          showResetFilters: false,
        };
        
      default:
        return {
          icon: AlertTriangle,
          title: '搜索遇到问题',
          description: '搜索功能暂时异常，请尝试刷新页面或重新搜索',
          actionText: '重新搜索',
          variant: 'default' as const,
          showClearSearch: true,
          showResetFilters: true,
        };
    }
  };

  const errorDisplay = getSearchErrorDisplay(errorInfo.type);
  const IconComponent = errorDisplay.icon;

  // 处理搜索特定的重试操作
  const handleSearchRetry = () => {
    if (onSearchRetry) {
      onSearchRetry();
    } else {
      resetError();
    }
  };

  const handleClearSearch = () => {
    if (onClearSearch) {
      onClearSearch();
    }
    resetError();
  };

  const handleResetFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    }
    resetError();
  };

  if (isPageLevel) {
    // 页面级搜索错误 - 全屏显示
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <IconComponent className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-foreground">
              {errorDisplay.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorDisplay.description}
            </p>
            
            {/* 搜索上下文信息 */}
            {searchQuery && (
              <div className="p-3 bg-muted rounded-lg text-left">
                <p className="text-xs text-muted-foreground mb-1">当前搜索:</p>
                <p className="text-sm font-mono text-foreground">{searchQuery}</p>
              </div>
            )}
            
            {/* 错误详情 - 仅开发环境显示 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  技术详情
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {error?.message}
                  {errorInfo.componentStack && (
                    <div className="mt-2">
                      <div className="font-semibold">组件堆栈:</div>
                      {errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {/* 主要恢复操作 */}
              <Button 
                variant={errorDisplay.variant}
                onClick={handleSearchRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {errorDisplay.actionText}
              </Button>
              
              {/* 搜索特定的恢复选项 */}
              <div className="flex flex-col sm:flex-row gap-2">
                {errorDisplay.showClearSearch && onClearSearch && (
                  <Button 
                    variant="outline"
                    onClick={handleClearSearch}
                    className="flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    清除搜索
                  </Button>
                )}
                
                {errorDisplay.showResetFilters && onResetFilters && (
                  <Button 
                    variant="outline"
                    onClick={handleResetFilters}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重置筛选
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  返回首页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSectionLevel) {
    // 区块级搜索错误 - 卡片样式
    return (
      <Card className="w-full border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">
                {errorDisplay.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {errorDisplay.description}
              </p>
              {searchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  搜索词: <span className="font-mono">{searchQuery}</span>
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant={errorDisplay.variant}
                size="sm"
                onClick={handleSearchRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                {errorDisplay.actionText}
              </Button>
              
              {errorDisplay.showClearSearch && onClearSearch && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleClearSearch}
                  className="flex items-center gap-2"
                >
                  <Search className="w-3 h-3" />
                  清除搜索
                </Button>
              )}
              
              {errorDisplay.showResetFilters && onResetFilters && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  重置筛选
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 组件级搜索错误 - 最小化显示
  return (
    <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        <IconComponent className="w-4 h-4 text-destructive" />
        搜索功能暂时不可用
      </div>
      <div className="flex flex-wrap gap-1 justify-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSearchRetry}
          className="text-xs"
        >
          重试
        </Button>
        
        {errorDisplay.showClearSearch && onClearSearch && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearSearch}
            className="text-xs"
          >
            清除
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 搜索页面错误边界组件
 * 
 * 继承ErrorBoundary的核心功能，为搜索页面提供专门的错误处理
 * 包含搜索特定的错误恢复选项和智能重试机制
 */
export class SearchPageErrorBoundary extends React.Component<SearchPageErrorBoundaryProps, any> {
  constructor(props: SearchPageErrorBoundaryProps) {
    super(props);
  }

  render() {
    const { 
      children, 
      searchQuery,
      onSearchRetry,
      onClearSearch,
      onResetFilters,
      onSearchError,
      scope,
      onError,
      ...errorBoundaryProps 
    } = this.props;

    // 增强的错误处理回调
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      // 检测搜索特定的错误类型
      const searchErrorType = detectSearchErrorType(error);
      
      const enhancedErrorInfo: ErrorInfo = {
        type: searchErrorType as unknown as ErrorType,
        message: error.message,
        componentStack: errorInfo.componentStack || undefined,
        errorBoundary: 'SearchPageErrorBoundary',
        errorId: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      // 调用搜索特定的错误处理
      onSearchError?.(error, enhancedErrorInfo);
      
      // 调用通用错误处理
      onError?.(error, errorInfo);

      // 在开发环境中记录搜索错误详情
      if (process.env.NODE_ENV === 'development') {
        console.group('🔍 SearchPageErrorBoundary 捕获到搜索错误');
        console.error('搜索错误:', error);
        console.error('搜索查询:', searchQuery);
        console.error('错误作用域:', scope);
        console.error('错误信息:', enhancedErrorInfo);
        console.groupEnd();
      }
    };

    // 自定义搜索错误回退组件
    const SearchFallback = ({ error, errorInfo, resetError, level }: ErrorFallbackProps) => (
      <SearchErrorFallback
        error={error}
        errorInfo={errorInfo}
        resetError={resetError}
        level={level}
        searchQuery={searchQuery}
        onSearchRetry={onSearchRetry}
        onClearSearch={onClearSearch}
        onResetFilters={onResetFilters}
        scope={scope}
      />
    );

    return (
      <ErrorBoundary
        {...errorBoundaryProps}
        fallback={SearchFallback}
        onError={handleError}
        isolate={true} // 确保搜索错误不影响其他部分
      >
        {children}
      </ErrorBoundary>
    );
  }
}

/**
 * 搜索页面错误边界高阶组件
 */
export function withSearchPageErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<SearchPageErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <SearchPageErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </SearchPageErrorBoundary>
  );

  WrappedComponent.displayName = `withSearchPageErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * 搜索错误处理Hook
 */
export function useSearchErrorHandler() {
  const [searchError, setSearchError] = React.useState<Error | null>(null);
  
  const handleSearchError = React.useCallback((error: Error, context?: {
    searchQuery?: string;
    filters?: any;
    page?: number;
  }) => {
    setSearchError(error);
    
    // 在开发环境中记录搜索错误
    if (process.env.NODE_ENV === 'development') {
      console.error('Search Error:', error, context);
    }
    
    // 抛出错误让错误边界捕获
    setTimeout(() => {
      throw error;
    });
  }, []);
  
  const clearSearchError = React.useCallback(() => {
    setSearchError(null);
  }, []);
  
  return {
    searchError,
    handleSearchError,
    clearSearchError
  };
}

/**
 * 导出主要组件和类型
 */
export default SearchPageErrorBoundary;
export { detectSearchErrorType as detectSearchSpecificErrorType };