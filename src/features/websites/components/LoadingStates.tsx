import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Globe, Loader2, Search } from "lucide-react";

/**
 * LoadingStates组件
 * 
 * 提供网站目录管理平台的各种loading状态组件
 * 
 * 特性:
 * - 网站卡片骨架屏loading状态
 * - 搜索和筛选加载指示器
 * - 异步数据加载视觉反馈
 * - 使用Tailwind CSS动画和设计系统配色
 * - 遵循项目组件规范和样式约定
 * 
 * @example
 * ```tsx
 * // 网站卡片加载状态
 * <WebsiteCardSkeleton />
 * <WebsiteCardSkeleton count={6} />
 * 
 * // 搜索加载指示器
 * <SearchLoadingIndicator />
 * 
 * // 筛选加载指示器
 * <FilterLoadingIndicator />
 * 
 * // 通用加载旋转器
 * <LoadingSpinner size="lg" />
 * ```
 */

/* ========================================
   接口定义
   ======================================== */

export interface LoadingSpinnerProps {
  /** 旋转器尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 额外的CSS类名 */
  className?: string;
  /** 加载文本 */
  text?: string;
}

export interface WebsiteCardSkeletonProps {
  /** 骨架屏数量 */
  count?: number;
  /** 额外的CSS类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export interface SearchLoadingIndicatorProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 额外的CSS类名 */
  className?: string;
}

export interface FilterLoadingIndicatorProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 额外的CSS类名 */
  className?: string;
  /** 筛选文本 */
  text?: string;
}

/* ========================================
   基础加载旋转器组件
   ======================================== */

/**
 * LoadingSpinner - 通用加载旋转器
 * 
 * 提供不同尺寸的加载旋转器，支持自定义文本
 * 使用Lucide的Loader2图标和Tailwind动画
 */
export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text 
}: LoadingSpinnerProps) {
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
   网站卡片骨架屏组件
   ======================================== */

/**
 * WebsiteCardSkeleton - 网站卡片骨架屏
 * 
 * 模拟WebsiteCard的结构和布局，提供loading占位效果
 * 使用shimmer动画和Tailwind的skeleton样式
 */
export function WebsiteCardSkeleton({ 
  count = 1, 
  className, 
  style 
}: WebsiteCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card 
          key={index}
          className={cn(
            "relative overflow-hidden website-card-skeleton",
            className
          )} 
          style={style}
        >
          <CardContent className="p-6">
            {/* 头部区域 - 图标和标题骨架 */}
            <div className="flex items-start gap-4 mb-4">
              {/* 网站图标骨架 */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted skeleton relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-muted-foreground/50" />
                </div>
              </div>

              {/* 标题和描述骨架 */}
              <div className="flex-1 min-w-0">
                {/* 标题骨架 */}
                <div className="h-6 bg-muted skeleton rounded-md mb-2 w-3/4"></div>
                
                {/* 描述骨架 - 多行 */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-5/6"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-4/6"></div>
                </div>
              </div>
            </div>

            {/* 标签区域骨架 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from({ length: 3 }).map((_, tagIndex) => (
                <div
                  key={tagIndex}
                  className="h-6 bg-muted skeleton rounded-md"
                  style={{ 
                    width: `${60 + (tagIndex * 20)}px` // 不同宽度的标签
                  }}
                ></div>
              ))}
            </div>

            {/* 底部统计和按钮骨架 */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {/* 访问统计骨架 */}
              <div className="h-4 bg-muted skeleton rounded-md w-20"></div>

              {/* 访问按钮骨架 */}
              <div className="h-8 bg-muted skeleton rounded-md w-28"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/* ========================================
   搜索加载指示器组件
   ======================================== */

/**
 * SearchLoadingIndicator - 搜索加载指示器
 * 
 * 在搜索框附近显示搜索进行中的状态
 * 使用搜索图标和脉冲动画
 */
export function SearchLoadingIndicator({ 
  isLoading, 
  className 
}: SearchLoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-border/50",
      "search-loading-fade-in",
      className
    )}>
      <Search className="w-4 h-4 text-muted-foreground animate-pulse" />
      <span className="text-sm text-muted-foreground animate-pulse">
        Searching websites...
      </span>
    </div>
  );
}

/* ========================================
   筛选加载指示器组件
   ======================================== */

/**
 * FilterLoadingIndicator - 筛选加载指示器
 * 
 * 在筛选操作时显示加载状态
 * 提供筛选进行中的视觉反馈
 */
export function FilterLoadingIndicator({ 
  isLoading, 
  className,
  text = "Applying filters..."
}: FilterLoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 py-4 px-6",
      "bg-background/80 backdrop-blur-sm rounded-lg border border-border",
      "filter-loading-fade-in",
      className
    )}>
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}

/* ========================================
   网站网格加载状态组件
   ======================================== */

/**
 * WebsiteGridLoadingOverlay - 网站网格加载遮罩
 * 
 * 在网站网格上方显示半透明加载遮罩
 * 用于分页切换和筛选更新时的过渡效果
 */
export function WebsiteGridLoadingOverlay({ 
  isLoading, 
  className 
}: { 
  isLoading: boolean; 
  className?: string; 
}) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-lg",
      "flex items-center justify-center z-10",
      "pagination-loading-fade-in",
      className
    )}>
      <div className="bg-background/90 backdrop-blur-sm rounded-lg p-6 border border-border shadow-lg">
        <LoadingSpinner size="lg" text="Loading websites..." />
      </div>
    </div>
  );
}

/* ========================================
   空状态加载组件
   ======================================== */

/**
 * EmptyStateWithLoading - 带加载状态的空状态
 * 
 * 当没有数据但正在加载时显示的占位组件
 * 结合空状态设计和加载指示器
 */
export function EmptyStateWithLoading({ 
  isLoading, 
  title = "Loading websites...",
  description = "Please wait while we fetch the latest website data.",
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
      "empty-state-loading-fade-in",
      className
    )}>
      <div className="mb-4">
        <LoadingSpinner size="lg" />
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
   默认导出所有组件
   ======================================== */

const loadingStateComponents = {
  LoadingSpinner,
  WebsiteCardSkeleton,
  SearchLoadingIndicator,
  FilterLoadingIndicator,
  WebsiteGridLoadingOverlay,
  EmptyStateWithLoading,
};

export default loadingStateComponents;
