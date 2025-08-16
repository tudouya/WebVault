'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug, Wifi, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * 浏览页面错误类型枚举
 */
export enum BrowsablePageErrorType {
  NETWORK = 'network',
  DATA_LOADING = 'data_loading',
  CONFIG = 'config',
  RENDERING = 'rendering',
  FILTER_STATE = 'filter_state',
  UNKNOWN = 'unknown'
}

/**
 * 浏览页面错误信息接口
 */
export interface BrowsablePageErrorInfo {
  type: BrowsablePageErrorType;
  message: string;
  pageType?: 'category' | 'tag' | 'collection' | 'search';
  componentStack?: string;
  errorBoundary?: string;
  errorId?: string;
  context?: {
    categoryId?: string;
    tagId?: string;
    collectionId?: string;
    searchQuery?: string;
    filterState?: Record<string, unknown>;
  };
}

/**
 * 浏览页面错误边界组件属性
 */
export interface BrowsablePageErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<BrowsablePageErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  pageType?: 'category' | 'tag' | 'collection' | 'search';
  pageContext?: {
    categoryId?: string;
    tagId?: string;
    collectionId?: string;
    searchQuery?: string;
  };
}

/**
 * 浏览页面错误回退组件属性
 */
export interface BrowsablePageErrorFallbackProps {
  error: Error;
  errorInfo: BrowsablePageErrorInfo;
  resetError: () => void;
  pageType?: 'category' | 'tag' | 'collection' | 'search';
}

/**
 * 浏览页面错误边界组件状态
 */
interface BrowsablePageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: BrowsablePageErrorInfo | null;
  eventId?: string;
}

/**
 * 浏览页面专用错误回退组件
 */
function BrowsablePageErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  pageType 
}: BrowsablePageErrorFallbackProps) {
  // 根据错误类型和页面类型提供定制化的错误信息
  const getErrorDisplay = (errorType: BrowsablePageErrorType, pageType?: string) => {
    const pageTypeText = pageType ? `${pageType}页面` : '页面';
    
    switch (errorType) {
      case BrowsablePageErrorType.NETWORK:
        return {
          icon: Wifi,
          title: '网络连接问题',
          description: `无法加载${pageTypeText}数据，请检查网络连接后重试`,
          actionText: '重新连接',
          variant: 'default' as const,
          suggestions: [
            '检查网络连接是否正常',
            '尝试刷新页面',
            '清除浏览器缓存后重试'
          ]
        };
      case BrowsablePageErrorType.DATA_LOADING:
        return {
          icon: Bug,
          title: '数据加载失败',
          description: `${pageTypeText}内容暂时无法显示，服务器可能正在维护`,
          actionText: '重新加载',
          variant: 'default' as const,
          suggestions: [
            '稍等片刻后再次尝试',
            '检查页面参数是否正确',
            '联系技术支持'
          ]
        };
      case BrowsablePageErrorType.CONFIG:
        return {
          icon: AlertCircle,
          title: '页面配置错误',
          description: `${pageTypeText}配置有误，请联系管理员解决`,
          actionText: '返回首页',
          variant: 'outline' as const,
          suggestions: [
            '检查页面URL是否正确',
            '尝试从首页重新进入',
            '联系管理员检查配置'
          ]
        };
      case BrowsablePageErrorType.FILTER_STATE:
        return {
          icon: Search,
          title: '筛选状态异常',
          description: `筛选器状态出现问题，无法正确显示筛选结果`,
          actionText: '重置筛选',
          variant: 'default' as const,
          suggestions: [
            '清除当前筛选条件',
            '尝试使用其他筛选组合',
            '刷新页面重新开始'
          ]
        };
      case BrowsablePageErrorType.RENDERING:
        return {
          icon: AlertCircle,
          title: '页面渲染错误',
          description: `${pageTypeText}渲染时遇到问题，可能是组件配置错误`,
          actionText: '重新渲染',
          variant: 'default' as const,
          suggestions: [
            '尝试刷新页面',
            '清除浏览器缓存',
            '使用其他浏览器访问'
          ]
        };
      default:
        return {
          icon: AlertCircle,
          title: '页面出现异常',
          description: `${pageTypeText}遇到意外错误，请尝试重新加载`,
          actionText: '重新加载',
          variant: 'default' as const,
          suggestions: [
            '刷新页面重试',
            '检查浏览器兼容性',
            '联系技术支持'
          ]
        };
    }
  };

  const errorDisplay = getErrorDisplay(errorInfo.type, pageType);
  const IconComponent = errorDisplay.icon;

  // 生成适合当前页面类型的返回链接
  const getReturnLink = () => {
    switch (pageType) {
      case 'category':
        return { href: '/categories', text: '返回分类' };
      case 'tag':
        return { href: '/tags', text: '返回标签' };
      case 'collection':
        return { href: '/collections', text: '返回合集' };
      case 'search':
        return { href: '/search', text: '返回搜索' };
      default:
        return { href: '/', text: '返回首页' };
    }
  };

  const returnLink = getReturnLink();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <IconComponent className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl text-foreground">
            {errorDisplay.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {errorDisplay.description}
            </p>
          </div>

          {/* 页面上下文信息 */}
          {errorInfo.context && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs">
              <div className="font-medium text-muted-foreground mb-2">当前页面信息:</div>
              <div className="space-y-1 text-muted-foreground">
                {errorInfo.context.categoryId && (
                  <div>分类 ID: {errorInfo.context.categoryId}</div>
                )}
                {errorInfo.context.tagId && (
                  <div>标签 ID: {errorInfo.context.tagId}</div>
                )}
                {errorInfo.context.collectionId && (
                  <div>合集 ID: {errorInfo.context.collectionId}</div>
                )}
                {errorInfo.context.searchQuery && (
                  <div>搜索关键词: {errorInfo.context.searchQuery}</div>
                )}
              </div>
            </div>
          )}

          {/* 解决建议 */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              解决建议：
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {errorDisplay.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 错误详情 - 仅开发环境显示 */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                技术详情 (开发环境)
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground">
                <div className="mb-2">
                  <div className="font-semibold">错误消息:</div>
                  <div className="whitespace-pre-wrap">{error?.message}</div>
                </div>
                {errorInfo.errorId && (
                  <div className="mb-2">
                    <div className="font-semibold">错误 ID:</div>
                    <div>{errorInfo.errorId}</div>
                  </div>
                )}
                {errorInfo.componentStack && (
                  <div>
                    <div className="font-semibold">组件堆栈:</div>
                    <div className="whitespace-pre-wrap">{errorInfo.componentStack}</div>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button 
              variant={errorDisplay.variant}
              onClick={resetError}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {errorDisplay.actionText}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = returnLink.href}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              {returnLink.text}
            </Button>
          </div>

          {/* 错误报告 */}
          {process.env.NODE_ENV === 'production' && (
            <div className="text-center pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // 这里可以集成错误报告服务
                  console.log('报告错误:', { error, errorInfo });
                  // 示例：发送到错误跟踪服务
                  // errorReportingService.report(error, errorInfo);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                报告此问题
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 浏览页面错误类型检测工具
 */
const detectBrowsablePageErrorType = (error: Error): BrowsablePageErrorType => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // 网络错误
  if (message.includes('network') || 
      message.includes('fetch') ||
      message.includes('connection') ||
      name.includes('networkerror') ||
      message.includes('timeout')) {
    return BrowsablePageErrorType.NETWORK;
  }

  // 数据加载错误
  if (message.includes('data') || 
      message.includes('loading') ||
      message.includes('response') ||
      message.includes('api') ||
      name.includes('syntaxerror')) {
    return BrowsablePageErrorType.DATA_LOADING;
  }

  // 配置错误
  if (message.includes('config') || 
      message.includes('invalid') ||
      message.includes('missing') ||
      message.includes('undefined') && message.includes('prop')) {
    return BrowsablePageErrorType.CONFIG;
  }

  // 筛选状态错误
  if (message.includes('filter') || 
      message.includes('search') ||
      message.includes('query') ||
      message.includes('param')) {
    return BrowsablePageErrorType.FILTER_STATE;
  }

  // 渲染错误
  if (message.includes('render') || 
      message.includes('component') ||
      message.includes('hook') ||
      name.includes('typeerror')) {
    return BrowsablePageErrorType.RENDERING;
  }

  return BrowsablePageErrorType.UNKNOWN;
};

/**
 * 浏览页面React错误边界组件
 * 专门为browsable-pages功能模块设计的错误捕获和恢复系统
 */
export class BrowsablePageErrorBoundary extends React.Component<
  BrowsablePageErrorBoundaryProps, 
  BrowsablePageErrorBoundaryState
> {
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: BrowsablePageErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BrowsablePageErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorType = detectBrowsablePageErrorType(error);
    const enhancedErrorInfo: BrowsablePageErrorInfo = {
      type: errorType,
      message: error.message,
      pageType: this.props.pageType,
      componentStack: errorInfo.componentStack || undefined,
      errorBoundary: this.constructor.name,
      errorId: `browsable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      context: this.props.pageContext,
    };

    this.setState({
      errorInfo: enhancedErrorInfo,
      eventId: enhancedErrorInfo.errorId,
    });

    // 调用错误处理回调
    this.props.onError?.(error, errorInfo);

    // 在开发环境中输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 BrowsablePageErrorBoundary 捕获到错误');
      console.error('页面类型:', this.props.pageType);
      console.error('页面上下文:', this.props.pageContext);
      console.error('错误:', error);
      console.error('错误信息:', enhancedErrorInfo);
      console.error('组件堆栈:', errorInfo.componentStack);
      console.groupEnd();
    }

    // 在生产环境中可以集成错误监控服务
    if (process.env.NODE_ENV === 'production') {
      // 示例：发送到错误跟踪服务
      // errorMonitoringService.captureException(error, {
      //   extra: enhancedErrorInfo,
      //   tags: {
      //     component: 'BrowsablePageErrorBoundary',
      //     pageType: this.props.pageType,
      //     errorType: errorType,
      //   }
      // });
    }
  }

  componentDidUpdate(prevProps: BrowsablePageErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;
    
    // 如果错误状态存在且启用了属性变化重置
    if (hasError && prevProps.resetOnPropsChange !== resetOnPropsChange) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }

    // 基于 resetKeys 重置
    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, idx) => key !== prevResetKeys[idx]);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // 页面上下文变化时重置错误状态
    if (hasError && this.props.pageContext !== prevProps.pageContext) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    // 清除错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: undefined,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback: FallbackComponent, pageType } = this.props;

    if (hasError && error && errorInfo) {
      // 使用自定义回退组件或专用的浏览页面错误组件
      const FallbackToRender = FallbackComponent || BrowsablePageErrorFallback;
      
      return (
        <div 
          className={cn(
            "error-boundary-browsable-page",
            pageType && `error-boundary-${pageType}`
          )}
          data-error-boundary="browsable-page"
          data-error-type={errorInfo.type}
          data-page-type={pageType}
        >
          <FallbackToRender
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetErrorBoundary}
            pageType={pageType}
          />
        </div>
      );
    }

    return children;
  }
}

/**
 * 高阶组件 - 为浏览页面组件添加专用错误边界
 */
export function withBrowsablePageErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<BrowsablePageErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <BrowsablePageErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BrowsablePageErrorBoundary>
  );

  WrappedComponent.displayName = `withBrowsablePageErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook - 手动触发浏览页面错误边界
 */
export function useBrowsablePageErrorHandler() {
  return React.useCallback((error: Error, context?: {
    pageType?: 'category' | 'tag' | 'collection' | 'search';
    pageContext?: Record<string, unknown>;
  }) => {
    // 增强错误对象以包含浏览页面特定信息
    const enhancedError = new Error(error.message);
    enhancedError.name = error.name;
    enhancedError.stack = error.stack;
    
    // 在错误对象上附加上下文信息（仅用于调试）
    if (context && process.env.NODE_ENV === 'development') {
      (enhancedError as any).__browsablePageContext = context;
    }

    // 在下一个事件循环中抛出错误，让错误边界捕获
    setTimeout(() => {
      throw enhancedError;
    });
  }, []);
}

/**
 * 导出常用类型和组件
 */
export default BrowsablePageErrorBoundary;
export { 
  BrowsablePageErrorFallback, 
  detectBrowsablePageErrorType
};