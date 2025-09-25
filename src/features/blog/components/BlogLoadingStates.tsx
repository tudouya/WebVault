'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Loader2, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  Home, 
  FileText,
  PenTool
} from "lucide-react";

/**
 * BlogLoadingStates组件
 * 
 * 为博客页面提供专门的加载状态和错误处理组件
 * 
 * 特性:
 * - 博客卡片骨架屏loading状态
 * - 博客数据加载失败的错误提示和重试功能  
 * - 集成ErrorBoundary错误边界处理
 * - 为异步数据加载提供用户友好的反馈
 * - 复用CollectionLoadingStates的设计模式和动画
 * - 遵循项目组件规范和样式约定
 */

/* ========================================
   接口定义
   ======================================== */

export interface BlogLoadingSpinnerProps {
  /** 旋转器尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 额外的CSS类名 */
  className?: string;
  /** 加载文本 */
  text?: string;
}

export interface BlogCardSkeletonProps {
  /** 骨架屏数量 */
  count?: number;
  /** 额外的CSS类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export interface BlogErrorStateProps {
  /** 错误信息 */
  error?: string | Error | null;
  /** 重试回调函数 */
  onRetry?: () => void;
  /** 返回首页回调函数 */
  onGoHome?: () => void;
  /** 错误类型 */
  type?: 'network' | 'data' | 'permission' | 'unknown';
  /** 额外的CSS类名 */
  className?: string;
  /** 是否显示详细错误信息 */
  showDetails?: boolean;
}

export interface BlogEmptyStateProps {
  /** 空状态标题 */
  title?: string;
  /** 空状态描述 */
  description?: string;
  /** 额外的CSS类名 */
  className?: string;
  /** 是否显示搜索建议 */
  showSearchSuggestion?: boolean;
  /** 重置筛选回调 */
  onResetFilters?: () => void;
}

/* ========================================
   基础加载旋转器组件
   ======================================== */

/**
 * BlogLoadingSpinner - 博客专用加载旋转器
 * 
 * 提供不同尺寸的加载旋转器，针对博客页面优化
 * 使用Lucide的Loader2图标和Tailwind动画
 */
export function BlogLoadingSpinner({ 
  size = 'md', 
  className, 
  text = "Loading blog posts..."
}: BlogLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn(
      "flex items-center justify-center gap-2",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size]
      )} />
      {text && (
        <span className={cn(
          "text-muted-foreground font-medium",
          textSizeClasses[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );
}

/* ========================================
   博客卡片骨架屏组件
   ======================================== */

/**
 * BlogCardSkeleton - 博客卡片骨架屏
 * 
 * 模拟BlogCard的结构和布局，提供loading占位效果
 * 使用shimmer动画和Tailwind的skeleton样式
 * 复用CollectionLoadingStates中CardSkeleton的设计模式
 */
export function BlogCardSkeleton({ 
  count = 1, 
  className, 
  style 
}: BlogCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card 
          key={index}
          className={cn(
            "relative overflow-hidden blog-card-skeleton",
            "bg-card border border-border rounded-xl shadow-sm",
            className
          )} 
          style={style}
        >
          {/* 封面图片骨架 - 16:10比例 */}
          <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-xl bg-muted skeleton">
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </div>

          <CardContent className="p-4 flex flex-col h-32">
            {/* 标题骨架 - 2行 */}
            <div className="flex-1 mb-3">
              <div className="h-6 bg-muted skeleton rounded-md mb-2 w-full"></div>
              <div className="h-6 bg-muted skeleton rounded-md w-3/4"></div>
            </div>

            {/* 底部作者信息和时间骨架 */}
            <div className="flex items-center justify-between mt-auto">
              {/* 作者信息骨架 */}
              <div className="flex items-center gap-2">
                {/* 作者头像骨架 */}
                <div className="w-6 h-6 rounded-full bg-muted skeleton"></div>
                {/* 作者名称骨架 */}
                <div className="h-4 bg-muted skeleton rounded-md w-16"></div>
              </div>

              {/* 发布时间骨架 */}
              <div className="h-4 bg-muted skeleton rounded-md w-12"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/* ========================================
   博客错误状态组件
   ======================================== */

/**
 * BlogErrorState - 博客错误状态组件
 * 
 * 显示博客加载错误并提供重试功能
 * 根据错误类型提供不同的UI和操作选项
 * 集成ErrorBoundary的错误处理模式
 */
export function BlogErrorState({
  error,
  onRetry,
  onGoHome,
  type = 'unknown',
  className,
  showDetails = false
}: BlogErrorStateProps) {
  // 根据错误类型获取显示内容
  const getErrorDisplay = (errorType: BlogErrorStateProps['type']) => {
    switch (errorType) {
      case 'network':
        return {
          icon: AlertCircle,
          title: '网络连接问题',
          description: '无法加载博客文章，请检查网络连接后重试',
          actionText: '重试加载',
          variant: 'default' as const,
        };
      case 'data':
        return {
          icon: BookOpen,
          title: '数据加载失败',
          description: '博客文章暂时无法显示，请稍后重试',
          actionText: '重新加载',
          variant: 'default' as const,
        };
      case 'permission':
        return {
          icon: AlertCircle,
          title: '访问权限不足',
          description: '您没有权限访问这些博客内容',
          actionText: '返回首页',
          variant: 'outline' as const,
        };
      default:
        return {
          icon: AlertCircle,
          title: '出现了一些问题',
          description: '博客页面遇到意外错误，请尝试重新加载',
          actionText: '重新加载',
          variant: 'default' as const,
        };
    }
  };

  const errorDisplay = getErrorDisplay(type);
  const IconComponent = errorDisplay.icon;
  
  // 处理错误消息
  const errorMessage = error 
    ? (error instanceof Error ? error.message : String(error))
    : errorDisplay.description;

  const handleRetry = () => {
    if (type === 'permission') {
      if (onGoHome) {
        onGoHome();
      } else {
        window.location.href = '/';
      }
    } else {
      onRetry?.();
    }
  };

  return (
    <div className={cn(
      "col-span-full flex flex-col items-center justify-center py-12 px-4 text-center min-h-[400px]",
      "blog-error-fade-in",
      className
    )}>
      {/* 错误图标 */}
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-destructive" />
      </div>

      {/* 错误标题 */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {errorDisplay.title}
      </h3>

      {/* 错误描述 */}
      <p className="text-muted-foreground max-w-md mb-6">
        {errorMessage}
      </p>
      
      {/* 错误详情 - 仅开发环境显示 */}
      {showDetails && process.env.NODE_ENV === 'development' && error && (
        <details className="mb-6 text-left max-w-lg">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground mb-2">
            技术详情
          </summary>
          <div className="p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground whitespace-pre-wrap">
            {error instanceof Error ? error.stack : String(error)}
          </div>
        </details>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          variant={errorDisplay.variant}
          onClick={handleRetry}
          className="flex items-center gap-2"
        >
          {type === 'permission' ? (
            <Home className="w-4 h-4" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {errorDisplay.actionText}
        </Button>
        
        {type !== 'permission' && onGoHome && (
          <Button 
            variant="outline"
            onClick={onGoHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Button>
        )}
      </div>
    </div>
  );
}

/* ========================================
   博客空状态组件
   ======================================== */

/**
 * BlogEmptyState - 博客空状态组件
 * 
 * 当没有博客数据时显示的占位组件
 * 提供搜索建议和筛选重置选项
 */
export function BlogEmptyState({ 
  title = "暂无博客文章",
  description = "没有符合当前筛选条件的博客文章。请尝试调整搜索条件或分类筛选。",
  className,
  showSearchSuggestion = true,
  onResetFilters
}: BlogEmptyStateProps) {
  return (
    <div className={cn(
      "col-span-full flex flex-col items-center justify-center py-12 px-4 text-center min-h-[400px]",
      "blog-empty-fade-in",
      className
    )}>
      {/* 空状态图标 */}
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <PenTool className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* 空状态标题 */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* 空状态描述 */}
      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>

      {/* 搜索建议和操作按钮 */}
      {showSearchSuggestion && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onResetFilters && (
            <Button 
              variant="default"
              onClick={onResetFilters}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              重置筛选条件
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
      )}
    </div>
  );
}

/* ========================================
   网络状态检测组件
   ======================================== */

/**
 * BlogNetworkStatus - 博客网络状态检测组件
 * 
 * 检测网络连接状态并提供离线提示
 * 在网络断开时显示友好的错误提示
 */
export function BlogNetworkStatus({ 
  children,
  className 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isOnline, setIsOnline] = React.useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // 检查初始网络状态
    setIsOnline(navigator.onLine);

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 如果离线，显示网络错误状态
  if (!isOnline && showOfflineMessage) {
    return (
      <div className={cn(className)}>
        <BlogErrorState
          error="网络连接已断开"
          type="network"
          onRetry={() => {
            // 重新检查网络状态
            if (navigator.onLine) {
              setIsOnline(true);
              setShowOfflineMessage(false);
            }
          }}
          showDetails={false}
        />
      </div>
    );
  }

  return <>{children}</>;
}

/* ========================================
   加载状态管理Hook
   ======================================== */

/**
 * useBlogLoadingState - 博客加载状态管理Hook
 * 
 * 统一管理博客页面的加载、错误和空状态
 * 提供标准的状态管理模式和错误处理
 */
export function useBlogLoadingState() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | Error | null>(null);
  const [isEmpty, setIsEmpty] = React.useState(false);

  const startLoading = React.useCallback(() => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);
  }, []);

  const stopLoading = React.useCallback(() => {
    setLoading(false);
  }, []);

  const setErrorState = React.useCallback((error: string | Error) => {
    setError(error);
    setLoading(false);
    setIsEmpty(false);
  }, []);

  const setEmptyState = React.useCallback(() => {
    setIsEmpty(true);
    setError(null);
    setLoading(false);
  }, []);

  const clearState = React.useCallback(() => {
    setLoading(false);
    setError(null);
    setIsEmpty(false);
  }, []);

  const retry = React.useCallback((retryFn?: () => void | Promise<void>) => {
    clearState();
    startLoading();
    
    if (retryFn) {
      const result = retryFn();
      if (result instanceof Promise) {
        result.catch(setErrorState);
      }
    }
  }, [clearState, startLoading, setErrorState]);

  return {
    loading,
    error,
    isEmpty,
    startLoading,
    stopLoading,
    setErrorState,
    setEmptyState,
    clearState,
    retry,
  };
}

/* ========================================
   默认导出所有组件
   ======================================== */

const blogLoadingStates = {
  BlogLoadingSpinner,
  BlogCardSkeleton,
  BlogErrorState,
  BlogEmptyState,
  BlogNetworkStatus,
  useBlogLoadingState,
};

export default blogLoadingStates;
