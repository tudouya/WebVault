'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home, BookOpen, Wifi, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * BlogErrorBoundary组件
 * 
 * 为博客页面提供专门的错误边界处理
 * 
 * 特性:
 * - 博客页面专用的错误类型检测和处理
 * - 集成ErrorBoundary错误边界功能  
 * - 提供网络错误、数据错误等不同错误类型的UI
 * - 支持重试机制和错误恢复
 * - 复用websites/ErrorBoundary的设计模式
 * - 遵循项目组件规范和样式约定
 * 
 * @example
 * ```tsx
 * // 包装博客页面组件
 * <BlogErrorBoundary level="page">
 *   <BlogIndexPage />
 * </BlogErrorBoundary>
 * 
 * // 包装博客网格组件
 * <BlogErrorBoundary level="section" onRetry={fetchBlogs}>
 *   <BlogGrid blogs={blogs} />
 * </BlogErrorBoundary>
 * ```
 */

/* ========================================
   类型定义
   ======================================== */

/**
 * 博客错误类型枚举
 */
export enum BlogErrorType {
  NETWORK = 'network',
  API = 'api',
  DATA = 'data',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

/**
 * 博客错误信息接口
 */
export interface BlogErrorInfo {
  type: BlogErrorType;
  message: string;
  componentStack?: string;
  errorBoundary?: string;
  errorId?: string;
  retryable?: boolean;
}

/**
 * BlogErrorBoundary 组件属性
 */
export interface BlogErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<BlogErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'section' | 'component';
  className?: string;
}

/**
 * 博客错误回退组件属性
 */
export interface BlogErrorFallbackProps {
  error: Error;
  errorInfo: BlogErrorInfo;
  resetError: () => void;
  onRetry?: () => void;
  level: 'page' | 'section' | 'component';
  className?: string;
}

/**
 * BlogErrorBoundary 组件状态
 */
interface BlogErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: BlogErrorInfo | null;
  eventId?: string;
}

/* ========================================
   错误类型检测工具
   ======================================== */

/**
 * 博客专用错误类型检测
 */
const detectBlogErrorType = (error: Error): BlogErrorType => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // 网络错误
  if (message.includes('network') || 
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      name.includes('networkerror')) {
    return BlogErrorType.NETWORK;
  }

  // API错误
  if (message.includes('api') || 
      message.includes('endpoint') ||
      message.includes('blog') ||
      message.includes('posts') ||
      message.includes('category')) {
    return BlogErrorType.API;
  }

  // 权限错误
  if (message.includes('permission') || 
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      error.name === 'PermissionError') {
    return BlogErrorType.PERMISSION;
  }

  // 数据错误
  if (message.includes('data') || 
      message.includes('parse') ||
      message.includes('json') ||
      message.includes('invalid') ||
      name.includes('syntaxerror')) {
    return BlogErrorType.DATA;
  }

  return BlogErrorType.UNKNOWN;
};

/* ========================================
   默认错误回退组件
   ======================================== */

/**
 * BlogDefaultErrorFallback - 博客默认错误回退组件
 * 
 * 根据错误类型和层级提供不同的错误显示UI
 * 复用网站ErrorBoundary的设计模式但针对博客内容优化
 */
function BlogDefaultErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  onRetry,
  level,
  className 
}: BlogErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';

  // 根据错误类型提供不同的图标和样式
  const getErrorDisplay = (errorType: BlogErrorType) => {
    switch (errorType) {
      case BlogErrorType.NETWORK:
        return {
          icon: Wifi,
          title: '网络连接问题',
          description: '无法加载博客文章，请检查网络连接后重试',
          actionText: '重试加载',
          variant: 'default' as const,
          retryable: true,
        };
      case BlogErrorType.API:
        return {
          icon: Database,
          title: '博客服务异常',
          description: '博客数据暂时无法获取，请稍后重试',
          actionText: '重新加载',
          variant: 'default' as const,
          retryable: true,
        };
      case BlogErrorType.DATA:
        return {
          icon: BookOpen,
          title: '数据格式错误',
          description: '博客内容格式异常，请刷新页面重试',
          actionText: '刷新页面',
          variant: 'default' as const,
          retryable: true,
        };
      case BlogErrorType.PERMISSION:
        return {
          icon: AlertCircle,
          title: '访问权限不足',
          description: '您没有权限访问这些博客内容',
          actionText: '返回首页',
          variant: 'outline' as const,
          retryable: false,
        };
      default:
        return {
          icon: AlertCircle,
          title: '博客页面出错',
          description: '页面遇到意外错误，请尝试重新加载',
          actionText: '重新加载',
          variant: 'default' as const,
          retryable: true,
        };
    }
  };

  const errorDisplay = getErrorDisplay(errorInfo.type);
  const IconComponent = errorDisplay.icon;

  const handlePrimaryAction = () => {
    if (errorInfo.type === BlogErrorType.PERMISSION) {
      window.location.href = '/';
    } else if (onRetry && errorDisplay.retryable) {
      onRetry();
    } else {
      resetError();
    }
  };

  if (isPageLevel) {
    // 页面级错误 - 全屏显示
    return (
      <div className={cn(
        "min-h-[60vh] flex items-center justify-center p-4",
        className
      )}>
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
            
            {/* 错误详情 - 仅开发环境显示 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  技术详情
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  错误: {error?.message}
                  {errorInfo.componentStack && (
                    <div className="mt-2">
                      <div className="font-semibold">组件堆栈:</div>
                      {errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button 
                variant={errorDisplay.variant}
                onClick={handlePrimaryAction}
                className="flex items-center gap-2"
              >
                {errorInfo.type === BlogErrorType.PERMISSION ? (
                  <Home className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {errorDisplay.actionText}
              </Button>
              
              {errorInfo.type !== BlogErrorType.PERMISSION && (
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/blog'}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  博客首页
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSectionLevel) {
    // 区块级错误 - 卡片样式
    return (
      <Card className={cn(
        "w-full border-destructive/20 bg-destructive/5",
        className
      )}>
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
            </div>
            <Button 
              variant={errorDisplay.variant}
              size="sm"
              onClick={handlePrimaryAction}
              className="flex items-center gap-2"
            >
              {errorInfo.type === BlogErrorType.PERMISSION ? (
                <Home className="w-3 h-3" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {errorDisplay.actionText}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 组件级错误 - 最小化显示
  return (
    <div className={cn(
      "p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center",
      className
    )}>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        <IconComponent className="w-4 h-4 text-destructive" />
        博客内容加载失败
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePrimaryAction}
        className="text-xs"
      >
        重试
      </Button>
    </div>
  );
}

/* ========================================
   博客错误边界组件
   ======================================== */

/**
 * BlogErrorBoundary - 博客错误边界组件
 * 
 * 专门为博客页面设计的React错误边界
 * 捕获博客相关组件中的JavaScript错误，记录错误并显示降级UI
 */
export class BlogErrorBoundary extends React.Component<BlogErrorBoundaryProps, BlogErrorBoundaryState> {
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: BlogErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BlogErrorBoundaryState> {
    // 更新状态以便下一次渲染能够显示降级后的UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorType = detectBlogErrorType(error);
    const enhancedErrorInfo: BlogErrorInfo = {
      type: errorType,
      message: error.message,
      componentStack: errorInfo.componentStack || undefined,
      errorBoundary: 'BlogErrorBoundary',
      errorId: `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retryable: errorType !== BlogErrorType.PERMISSION,
    };

    this.setState({
      errorInfo: enhancedErrorInfo,
      eventId: enhancedErrorInfo.errorId,
    });

    // 调用错误处理回调
    this.props.onError?.(error, errorInfo);

    // 在开发环境中输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 BlogErrorBoundary 捕获到错误');
      console.error('错误:', error);
      console.error('博客错误信息:', enhancedErrorInfo);
      console.error('组件堆栈:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: BlogErrorBoundaryProps) {
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
    const { 
      children, 
      fallback: FallbackComponent, 
      level = 'component',
      onRetry,
      className
    } = this.props;

    if (hasError && error && errorInfo) {
      // 使用自定义回退组件或默认组件
      const FallbackToRender = FallbackComponent || BlogDefaultErrorFallback;
      
      return (
        <div 
          className={cn(
            "blog-error-boundary",
            level === 'page' && "blog-error-boundary-page",
            level === 'section' && "blog-error-boundary-section", 
            level === 'component' && "blog-error-boundary-component",
            className
          )}
          data-error-boundary="blog"
          data-error-type={errorInfo.type}
          data-error-level={level}
        >
          <FallbackToRender
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetErrorBoundary}
            onRetry={onRetry}
            level={level}
          />
        </div>
      );
    }

    return children;
  }
}

/* ========================================
   博客错误边界HOC
   ======================================== */

/**
 * withBlogErrorBoundary - 博客错误边界高阶组件
 * 
 * 为博客组件添加错误边界保护
 */
export function withBlogErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<BlogErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <BlogErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BlogErrorBoundary>
  );

  WrappedComponent.displayName = `withBlogErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/* ========================================
   博客错误处理Hook
   ======================================== */

/**
 * useBlogErrorHandler - 博客错误处理Hook
 * 
 * 提供手动触发博客错误边界的功能
 */
export function useBlogErrorHandler() {
  return React.useCallback((error: Error, context?: { 
    component?: string; 
    action?: string; 
    blogId?: string;
  }) => {
    // 增强错误信息
    const enhancedError = new Error(
      `[Blog Error] ${context?.component ? `${context.component}: ` : ''}${error.message}`
    );
    enhancedError.name = error.name;
    enhancedError.stack = error.stack;

    // 在开发环境中输出上下文信息
    if (process.env.NODE_ENV === 'development' && context) {
      console.error('Blog Error Context:', context);
    }

    // 在下一个事件循环中抛出错误，让错误边界捕获
    setTimeout(() => {
      throw enhancedError;
    });
  }, []);
}

/* ========================================
   导出常用类型和组件
   ======================================== */

export default BlogErrorBoundary;
export { 
  BlogDefaultErrorFallback, 
  detectBlogErrorType
};