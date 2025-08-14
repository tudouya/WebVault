'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'network',
  RENDER = 'render', 
  DATA = 'data',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  componentStack?: string;
  errorBoundary?: string;
  errorId?: string;
}

/**
 * ErrorBoundary 组件属性
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

/**
 * 错误回退组件属性
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  level: 'page' | 'section' | 'component';
}

/**
 * ErrorBoundary 组件状态
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId?: string;
}

/**
 * 默认错误回退组件
 */
function DefaultErrorFallback({ error, errorInfo, resetError, level }: ErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';

  // 根据错误类型提供不同的图标和样式
  const getErrorDisplay = (errorType: ErrorType) => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return {
          icon: AlertCircle,
          title: '网络连接问题',
          description: '无法加载内容，请检查网络连接后重试',
          actionText: '重试加载',
          variant: 'default' as const,
        };
      case ErrorType.DATA:
        return {
          icon: Bug,
          title: '数据加载失败',
          description: '内容暂时无法显示，请稍后重试',
          actionText: '重新加载',
          variant: 'default' as const,
        };
      case ErrorType.PERMISSION:
        return {
          icon: AlertCircle,
          title: '访问权限不足',
          description: '您没有权限访问此内容',
          actionText: '返回首页',
          variant: 'outline' as const,
        };
      default:
        return {
          icon: AlertCircle,
          title: '出现了一些问题',
          description: '页面遇到意外错误，请尝试重新加载',
          actionText: '重新加载',
          variant: 'default' as const,
        };
    }
  };

  const errorDisplay = getErrorDisplay(errorInfo.type);
  const IconComponent = errorDisplay.icon;

  if (isPageLevel) {
    // 页面级错误 - 全屏显示
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

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button 
                variant={errorDisplay.variant}
                onClick={resetError}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {errorDisplay.actionText}
              </Button>
              
              {errorInfo.type !== ErrorType.PERMISSION && (
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  返回首页
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
            </div>
            <Button 
              variant={errorDisplay.variant}
              size="sm"
              onClick={resetError}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              {errorDisplay.actionText}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 组件级错误 - 最小化显示
  return (
    <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        <IconComponent className="w-4 h-4 text-destructive" />
        内容加载失败
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={resetError}
        className="text-xs"
      >
        重试
      </Button>
    </div>
  );
}

/**
 * 错误类型检测工具
 */
const detectErrorType = (error: Error): ErrorType => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // 网络错误
  if (message.includes('network') || 
      message.includes('fetch') ||
      message.includes('connection') ||
      name.includes('networkerror')) {
    return ErrorType.NETWORK;
  }

  // 权限错误
  if (message.includes('permission') || 
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      error.name === 'PermissionError') {
    return ErrorType.PERMISSION;
  }

  // 数据错误
  if (message.includes('data') || 
      message.includes('parse') ||
      message.includes('json') ||
      name.includes('syntaxerror')) {
    return ErrorType.DATA;
  }

  // 渲染错误
  if (message.includes('render') || 
      message.includes('component') ||
      name.includes('typeerror')) {
    return ErrorType.RENDER;
  }

  return ErrorType.UNKNOWN;
};

/**
 * React 错误边界组件
 * 捕获子组件中的JavaScript错误，记录错误并显示降级UI
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新状态以便下一次渲染能够显示降级后的UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorType = detectErrorType(error);
    const enhancedErrorInfo: ErrorInfo = {
      type: errorType,
      message: error.message,
      componentStack: errorInfo.componentStack || undefined,
      errorBoundary: this.constructor.name,
      errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.setState({
      errorInfo: enhancedErrorInfo,
      eventId: enhancedErrorInfo.errorId,
    });

    // 调用错误处理回调
    this.props.onError?.(error, errorInfo);

    // 在开发环境中输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary 捕获到错误');
      console.error('错误:', error);
      console.error('错误信息:', enhancedErrorInfo);
      console.error('组件堆栈:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
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
    const { children, fallback: FallbackComponent, level = 'component', isolate } = this.props;

    if (hasError && error && errorInfo) {
      // 使用自定义回退组件或默认组件
      const FallbackToRender = FallbackComponent || DefaultErrorFallback;
      
      return (
        <div 
          className={cn(
            isolate && "isolation-isolate",
            level === 'page' && "error-boundary-page",
            level === 'section' && "error-boundary-section",
            level === 'component' && "error-boundary-component"
          )}
          data-error-boundary={level}
          data-error-type={errorInfo.type}
        >
          <FallbackToRender
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetErrorBoundary}
            level={level}
          />
        </div>
      );
    }

    return children;
  }
}

/**
 * 高阶组件 - 为组件添加错误边界
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook - 手动触发错误边界
 */
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: Partial<ErrorInfo>) => {
    // 在下一个事件循环中抛出错误，让错误边界捕获
    setTimeout(() => {
      throw error;
    });
  }, []);
}

/**
 * 导出常用类型和组件
 */
export default ErrorBoundary;
export { DefaultErrorFallback, detectErrorType };