'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Globe, 
  Loader2, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  Home, 
  Folder,
  Grid3X3,
  Tag
} from "lucide-react";

/**
 * CollectionLoadingStates组件
 * 
 * 为集合索引页面提供专门的加载状态和错误处理组件
 * 
 * 特性:
 * - 集合卡片骨架屏loading状态
 * - 集合数据加载失败的错误提示和重试功能  
 * - 集成ErrorBoundary错误边界处理
 * - 为异步数据加载提供用户友好的反馈
 * - 复用LoadingStates.tsx的设计模式和动画
 * - 遵循项目组件规范和样式约定
 * 
 * @example
 * ```tsx
 * // 集合卡片加载状态
 * <CollectionCardSkeleton />
 * <CollectionCardSkeleton count={6} />
 * 
 * // 集合加载指示器
 * <CollectionLoadingIndicator isLoading={true} />
 * 
 * // 集合错误状态组件
 * <CollectionErrorState onRetry={handleRetry} />
 * 
 * // 集合网格加载遮罩
 * <CollectionGridLoadingOverlay isLoading={true} />
 * ```
 */

/* ========================================
   接口定义
   ======================================== */

export interface CollectionLoadingSpinnerProps {
  /** 旋转器尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 额外的CSS类名 */
  className?: string;
  /** 加载文本 */
  text?: string;
}

export interface CollectionCardSkeletonProps {
  /** 骨架屏数量 */
  count?: number;
  /** 额外的CSS类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export interface CollectionLoadingIndicatorProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 额外的CSS类名 */
  className?: string;
  /** 加载文本 */
  text?: string;
}

export interface CollectionErrorStateProps {
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

export interface CollectionGridLoadingOverlayProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 额外的CSS类名 */
  className?: string;
  /** 加载文本 */
  text?: string;
}

export interface CollectionEmptyStateProps {
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
 * CollectionLoadingSpinner - 集合专用加载旋转器
 * 
 * 提供不同尺寸的加载旋转器，针对集合页面优化
 * 使用Lucide的Loader2图标和Tailwind动画
 */
export function CollectionLoadingSpinner({ 
  size = 'md', 
  className, 
  text = "Loading collections..."
}: CollectionLoadingSpinnerProps) {
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
   集合卡片骨架屏组件
   ======================================== */

/**
 * CollectionCardSkeleton - 集合卡片骨架屏
 * 
 * 模拟CollectionCard的结构和布局，提供loading占位效果
 * 使用shimmer动画和Tailwind的skeleton样式
 * 复用LoadingStates中WebsiteCardSkeleton的设计模式
 */
export function CollectionCardSkeleton({ 
  count = 1, 
  className, 
  style 
}: CollectionCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card 
          key={index}
          className={cn(
            "relative overflow-hidden collection-card-skeleton",
            "bg-card border border-border rounded-2xl shadow-sm",
            className
          )} 
          style={style}
        >
          <CardContent className="p-4">
            {/* 头部区域 - 图标和内容骨架 */}
            <div className="flex items-start gap-4">
              {/* 集合图标骨架 - 64px彩色圆角 */}
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-muted skeleton relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Folder className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </div>

              {/* 标题、描述和统计骨架 */}
              <div className="flex-1 min-w-0">
                {/* 标题骨架 - 20px semibold */}
                <div className="h-6 bg-muted skeleton rounded-md mb-2 w-3/4"></div>
                
                {/* 描述骨架 - 14px regular, 最多3行 */}
                <div className="space-y-2 mb-3">
                  <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-5/6"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-4/6"></div>
                </div>

                {/* 底部统计和标签区域骨架 */}
                <div className="flex items-center justify-between">
                  {/* 网站计数骨架 */}
                  <div className="h-4 bg-muted skeleton rounded-md w-20"></div>

                  {/* 标签骨架 */}
                  <div className="flex gap-1">
                    <div className="h-5 bg-muted skeleton rounded-md w-16"></div>
                    <div className="h-5 bg-muted skeleton rounded-md w-14"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/* ========================================
   集合加载指示器组件
   ======================================== */

/**
 * CollectionLoadingIndicator - 集合加载指示器
 * 
 * 在集合操作时显示加载状态
 * 使用文件夹图标和脉冲动画，突出集合特性
 */
export function CollectionLoadingIndicator({ 
  isLoading, 
  className,
  text = "Loading collections..."
}: CollectionLoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border/50",
      "collection-loading-fade-in",
      className
    )}>
      <Grid3X3 className="w-5 h-5 text-muted-foreground animate-pulse" />
      <span className="text-sm text-muted-foreground animate-pulse">
        {text}
      </span>
    </div>
  );
}

/* ========================================
   集合错误状态组件
   ======================================== */

/**
 * CollectionErrorState - 集合错误状态组件
 * 
 * 显示集合加载错误并提供重试功能
 * 根据错误类型提供不同的UI和操作选项
 * 集成ErrorBoundary的错误处理模式
 */
export function CollectionErrorState({
  error,
  onRetry,
  onGoHome,
  type = 'unknown',
  className,
  showDetails = false
}: CollectionErrorStateProps) {
  // 根据错误类型获取显示内容
  const getErrorDisplay = (errorType: CollectionErrorStateProps['type']) => {
    switch (errorType) {
      case 'network':
        return {
          icon: AlertCircle,
          title: '网络连接问题',
          description: '无法加载集合数据，请检查网络连接后重试',
          actionText: '重试加载',
          variant: 'default' as const,
        };
      case 'data':
        return {
          icon: Grid3X3,
          title: '数据加载失败',
          description: '集合数据暂时无法显示，请稍后重试',
          actionText: '重新加载',
          variant: 'default' as const,
        };
      case 'permission':
        return {
          icon: AlertCircle,
          title: '访问权限不足',
          description: '您没有权限访问这些集合内容',
          actionText: '返回首页',
          variant: 'outline' as const,
        };
      default:
        return {
          icon: AlertCircle,
          title: '出现了一些问题',
          description: '集合页面遇到意外错误，请尝试重新加载',
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
      "collection-error-fade-in",
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
   集合网格加载遮罩组件
   ======================================== */

/**
 * CollectionGridLoadingOverlay - 集合网格加载遮罩
 * 
 * 在集合网格上方显示半透明加载遮罩
 * 用于分页切换和筛选更新时的过渡效果
 * 复用WebsiteGridLoadingOverlay的设计模式
 */
export function CollectionGridLoadingOverlay({ 
  isLoading, 
  className,
  text = "Loading collections..."
}: CollectionGridLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-lg",
      "flex items-center justify-center z-10",
      "collection-pagination-loading-fade-in",
      className
    )}>
      <div className="bg-background/90 backdrop-blur-sm rounded-lg p-6 border border-border shadow-lg">
        <CollectionLoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

/* ========================================
   集合空状态组件
   ======================================== */

/**
 * CollectionEmptyState - 集合空状态组件
 * 
 * 当没有集合数据时显示的占位组件
 * 提供搜索建议和筛选重置选项
 */
export function CollectionEmptyState({ 
  title = "没有找到集合",
  description = "没有符合当前筛选条件的集合。请尝试调整搜索条件或标签筛选。",
  className,
  showSearchSuggestion = true,
  onResetFilters
}: CollectionEmptyStateProps) {
  return (
    <div className={cn(
      "col-span-full flex flex-col items-center justify-center py-12 px-4 text-center min-h-[400px]",
      "collection-empty-fade-in",
      className
    )}>
      {/* 空状态图标 */}
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Folder className="w-8 h-8 text-muted-foreground" />
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
   带加载状态的空状态组件
   ======================================== */

/**
 * CollectionEmptyStateWithLoading - 带加载状态的集合空状态
 * 
 * 当没有数据但正在加载时显示的占位组件
 * 结合空状态设计和加载指示器
 * 复用EmptyStateWithLoading的设计模式
 */
export function CollectionEmptyStateWithLoading({ 
  isLoading, 
  title = "正在加载集合...",
  description = "请稍候，我们正在为您获取最新的集合数据。",
  className 
}: {
  isLoading: boolean;
  title?: string;
  description?: string;
  className?: string;
}) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      "collection-empty-loading-fade-in",
      className
    )}>
      <div className="mb-4">
        <CollectionLoadingSpinner size="lg" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
    </div>
  );
}

/* ========================================
   高阶错误边界组件
   ======================================== */

/**
 * CollectionErrorBoundary - 集合专用错误边界
 * 
 * 为集合相关组件提供错误边界保护
 * 使用CollectionErrorState作为fallback组件
 */
export class CollectionErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    onRetry?: () => void;
    level?: 'page' | 'section' | 'component';
  },
  {
    hasError: boolean;
    error: Error | null;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 调用错误处理回调
    this.props.onError?.(error, errorInfo);

    // 在开发环境中输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 CollectionErrorBoundary 捕获到错误');
      console.error('错误:', error);
      console.error('组件堆栈:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const errorType = this.state.error.message.toLowerCase().includes('network') 
        ? 'network'
        : this.state.error.message.toLowerCase().includes('permission')
        ? 'permission'
        : 'data';

      return (
        <CollectionErrorState
          error={this.state.error}
          type={errorType}
          onRetry={() => {
            // 重置错误状态
            this.setState({ hasError: false, error: null });
            this.props.onRetry?.();
          }}
          onGoHome={() => window.location.href = '/'}
          showDetails={process.env.NODE_ENV === 'development'}
          className={cn(
            this.props.level === 'page' && "min-h-[60vh]",
            this.props.level === 'section' && "min-h-[300px]",
            this.props.level === 'component' && "min-h-[200px]"
          )}
        />
      );
    }

    return this.props.children;
  }
}

/* ========================================
   默认导出所有组件
   ======================================== */

export default {
  CollectionLoadingSpinner,
  CollectionCardSkeleton,
  CollectionLoadingIndicator,
  CollectionErrorState,
  CollectionGridLoadingOverlay,
  CollectionEmptyState,
  CollectionEmptyStateWithLoading,
  CollectionErrorBoundary,
};