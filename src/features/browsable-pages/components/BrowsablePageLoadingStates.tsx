import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Globe, Loader2, Filter, Grid, Tag, FolderOpen } from "lucide-react";

/**
 * BrowsablePageLoadingStates组件
 * 
 * 为浏览页面(集合、分类、标签)提供专用的加载状态组件
 * 
 * 特性:
 * - 页面初始加载的骨架屏展示
 * - 筛选操作时的Loading状态指示器
 * - 数据重新获取的加载提示
 * - 分页切换的加载状态
 * - 兼容现有LoadingStates组件的设计语言
 * - 支持不同页面类型（集合、分类、标签）的特定加载状态
 * 
 * @example
 * ```tsx
 * // 页面初始加载骨架屏
 * <BrowsablePageSkeleton pageType="collection" />
 * <BrowsablePageSkeleton pageType="category" count={9} />
 * 
 * // 筛选操作加载状态
 * <BrowsableFilterLoadingIndicator isLoading={true} pageType="tag" />
 * 
 * // 数据重新获取加载提示
 * <BrowsableDataRefreshIndicator isLoading={true} />
 * 
 * // 页面内容加载遮罩
 * <BrowsablePageLoadingOverlay isLoading={true} pageType="collection" />
 * ```
 */

/* ========================================
   接口定义
   ======================================== */

export type BrowsablePageType = 'collection' | 'category' | 'tag';

export interface BrowsablePageSkeletonProps {
  /** 页面类型 */
  pageType: BrowsablePageType;
  /** 骨架屏数量 */
  count?: number;
  /** 额外的CSS类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export interface BrowsableFilterLoadingIndicatorProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 页面类型 */
  pageType: BrowsablePageType;
  /** 额外的CSS类名 */
  className?: string;
  /** 自定义筛选文本 */
  text?: string;
}

export interface BrowsableDataRefreshIndicatorProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 额外的CSS类名 */
  className?: string;
  /** 自定义刷新文本 */
  text?: string;
}

export interface BrowsablePageLoadingOverlayProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 页面类型 */
  pageType: BrowsablePageType;
  /** 额外的CSS类名 */
  className?: string;
}

export interface BrowsablePageHeaderSkeletonProps {
  /** 页面类型 */
  pageType: BrowsablePageType;
  /** 额外的CSS类名 */
  className?: string;
}

/* ========================================
   页面特定配置
   ======================================== */

const pageTypeConfig = {
  collection: {
    icon: Grid,
    title: "Collection",
    filterText: "Filtering collections...",
    loadingText: "Loading collections...",
    refreshText: "Refreshing collections..."
  },
  category: {
    icon: FolderOpen,
    title: "Category",
    filterText: "Filtering categories...",
    loadingText: "Loading categories...",
    refreshText: "Refreshing categories..."
  },
  tag: {
    icon: Tag,
    title: "Tag",
    filterText: "Filtering tags...",
    loadingText: "Loading tags...",
    refreshText: "Refreshing tags..."
  }
} as const;

/* ========================================
   页面骨架屏组件
   ======================================== */

/**
 * BrowsablePageSkeleton - 浏览页面骨架屏
 * 
 * 为集合、分类、标签页面提供专用的骨架屏加载状态
 * 模拟页面的整体结构和布局，提供loading占位效果
 */
export function BrowsablePageSkeleton({ 
  pageType,
  count = 6, 
  className, 
  style 
}: BrowsablePageSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} style={style}>
      {/* 页面头部骨架 */}
      <BrowsablePageHeaderSkeleton pageType={pageType} />
      
      {/* 筛选栏骨架 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-3">
          {/* 筛选标签骨架 */}
          <div className="h-8 bg-muted skeleton rounded-md w-20"></div>
          <div className="h-8 bg-muted skeleton rounded-md w-24"></div>
          <div className="h-8 bg-muted skeleton rounded-md w-16"></div>
        </div>
        
        {/* 排序下拉菜单骨架 */}
        <div className="h-9 bg-muted skeleton rounded-md w-32"></div>
      </div>
      
      {/* 内容网格骨架 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <BrowsablePageCardSkeleton 
            key={index}
            pageType={pageType}
          />
        ))}
      </div>
      
      {/* 分页骨架 */}
      <div className="flex items-center justify-between pt-6">
        <div className="h-9 bg-muted skeleton rounded-md w-32"></div>
        <div className="flex items-center gap-2">
          <div className="h-9 bg-muted skeleton rounded-md w-8"></div>
          <div className="h-9 bg-muted skeleton rounded-md w-8"></div>
          <div className="h-9 bg-muted skeleton rounded-md w-8"></div>
        </div>
        <div className="h-9 bg-muted skeleton rounded-md w-24"></div>
      </div>
    </div>
  );
}

/**
 * BrowsablePageHeaderSkeleton - 页面头部骨架屏
 * 
 * 模拟页面头部的标题、描述和统计信息
 */
export function BrowsablePageHeaderSkeleton({ 
  pageType, 
  className 
}: BrowsablePageHeaderSkeletonProps) {
  const config = pageTypeConfig[pageType];
  const IconComponent = config.icon;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 面包屑导航骨架 */}
      <div className="flex items-center gap-2 text-sm">
        <div className="h-4 bg-muted skeleton rounded-md w-16"></div>
        <span className="text-muted-foreground">/</span>
        <div className="h-4 bg-muted skeleton rounded-md w-20"></div>
      </div>
      
      {/* 页面标题区域骨架 */}
      <div className="flex items-start gap-4">
        {/* 页面图标 */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-muted skeleton relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-muted-foreground/50" />
          </div>
        </div>

        {/* 标题和描述区域 */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* 页面标题骨架 */}
          <div className="h-8 bg-muted skeleton rounded-md w-3/4 max-w-md"></div>
          
          {/* 页面描述骨架 */}
          <div className="space-y-2">
            <div className="h-4 bg-muted skeleton rounded-md w-full max-w-2xl"></div>
            <div className="h-4 bg-muted skeleton rounded-md w-5/6 max-w-xl"></div>
          </div>
          
          {/* 统计信息骨架 */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted skeleton rounded"></div>
              <div className="h-4 bg-muted skeleton rounded-md w-16"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted skeleton rounded"></div>
              <div className="h-4 bg-muted skeleton rounded-md w-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BrowsablePageCardSkeleton - 页面卡片骨架屏
 * 
 * 根据页面类型模拟不同的卡片结构
 */
function BrowsablePageCardSkeleton({ pageType }: { pageType: BrowsablePageType }) {
  return (
    <Card className="relative overflow-hidden browsable-page-card-skeleton">
      <CardContent className="p-6">
        {/* 卡片头部区域 */}
        <div className="flex items-start gap-4 mb-4">
          {/* 图标骨架 */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted skeleton relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="w-6 h-6 text-muted-foreground/50" />
            </div>
          </div>

          {/* 标题和描述骨架 */}
          <div className="flex-1 min-w-0">
            {/* 标题骨架 */}
            <div className="h-5 bg-muted skeleton rounded-md mb-2 w-4/5"></div>
            
            {/* 描述骨架 - 根据页面类型调整行数 */}
            <div className="space-y-2">
              <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
              {pageType === 'collection' && (
                <div className="h-4 bg-muted skeleton rounded-md w-3/4"></div>
              )}
            </div>
          </div>
        </div>

        {/* 根据页面类型显示不同内容 */}
        {pageType === 'collection' && (
          <>
            {/* 集合统计信息骨架 */}
            <div className="flex items-center gap-4 mb-4 py-3 border-y border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted skeleton rounded"></div>
                <div className="h-4 bg-muted skeleton rounded-md w-12"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted skeleton rounded"></div>
                <div className="h-4 bg-muted skeleton rounded-md w-16"></div>
              </div>
            </div>
          </>
        )}

        {pageType === 'tag' && (
          <>
            {/* 标签使用频率骨架 */}
            <div className="mb-4">
              <div className="h-2 bg-muted skeleton rounded-full w-full mb-2"></div>
              <div className="h-3 bg-muted skeleton rounded-md w-20"></div>
            </div>
          </>
        )}

        {/* 底部按钮区域骨架 */}
        <div className="flex items-center justify-between pt-4">
          {/* 左侧统计骨架 */}
          <div className="h-4 bg-muted skeleton rounded-md w-24"></div>

          {/* 右侧按钮骨架 */}
          <div className="h-8 bg-muted skeleton rounded-md w-20"></div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================
   筛选加载指示器组件
   ======================================== */

/**
 * BrowsableFilterLoadingIndicator - 浏览页面筛选加载指示器
 * 
 * 在筛选操作时显示页面特定的加载状态
 * 提供筛选进行中的视觉反馈
 */
export function BrowsableFilterLoadingIndicator({ 
  isLoading, 
  pageType,
  className,
  text
}: BrowsableFilterLoadingIndicatorProps) {
  if (!isLoading) return null;

  const config = pageTypeConfig[pageType];
  const displayText = text || config.filterText;

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 py-6 px-8",
      "bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-sm",
      "browsable-filter-loading-fade-in",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Filter className="w-5 h-5 text-primary animate-pulse" />
          <Loader2 className="w-3 h-3 animate-spin text-primary/70 absolute -top-1 -right-1" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {displayText}
        </span>
      </div>
    </div>
  );
}

/* ========================================
   数据刷新指示器组件
   ======================================== */

/**
 * BrowsableDataRefreshIndicator - 浏览页面数据刷新指示器
 * 
 * 在数据重新获取时显示刷新状态
 * 提供数据更新中的视觉反馈
 */
export function BrowsableDataRefreshIndicator({ 
  isLoading, 
  className,
  text = "Refreshing data..."
}: BrowsableDataRefreshIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-3 bg-muted/60 rounded-md border border-border/60",
      "browsable-refresh-loading-fade-in",
      className
    )}>
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground font-medium">
        {text}
      </span>
    </div>
  );
}

/* ========================================
   页面加载遮罩组件
   ======================================== */

/**
 * BrowsablePageLoadingOverlay - 浏览页面加载遮罩
 * 
 * 在页面内容上方显示半透明加载遮罩
 * 用于分页切换和内容更新时的过渡效果
 */
export function BrowsablePageLoadingOverlay({ 
  isLoading, 
  pageType,
  className 
}: BrowsablePageLoadingOverlayProps) {
  if (!isLoading) return null;

  const config = pageTypeConfig[pageType];
  const IconComponent = config.icon;

  return (
    <div className={cn(
      "absolute inset-0 bg-background/70 backdrop-blur-[3px] rounded-lg",
      "flex items-center justify-center z-20",
      "browsable-page-loading-fade-in",
      className
    )}>
      <div className="bg-background/95 backdrop-blur-sm rounded-xl p-8 border border-border shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <IconComponent className="w-8 h-8 text-muted-foreground/70" />
            <Loader2 className="w-5 h-5 animate-spin text-primary absolute -top-1 -right-1" />
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-foreground mb-1">
              {config.loadingText}
            </div>
            <div className="text-xs text-muted-foreground">
              Please wait a moment...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================
   空状态加载组件
   ======================================== */

/**
 * BrowsablePageEmptyStateWithLoading - 带加载状态的空状态
 * 
 * 当没有数据但正在加载时显示的占位组件
 * 结合浏览页面特定的设计和加载指示器
 */
export function BrowsablePageEmptyStateWithLoading({ 
  isLoading, 
  pageType,
  title,
  description,
  className 
}: {
  isLoading: boolean;
  pageType: BrowsablePageType;
  title?: string;
  description?: string;
  className?: string;
}) {
  if (!isLoading) return null;

  const config = pageTypeConfig[pageType];
  const IconComponent = config.icon;
  const defaultTitle = title || config.loadingText;
  const defaultDescription = description || `Please wait while we fetch the latest ${pageType} data.`;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      "browsable-empty-loading-fade-in",
      className
    )}>
      <div className="mb-6 relative">
        <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
          <IconComponent className="w-8 h-8 text-muted-foreground/70" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary absolute -top-1 -right-1" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {defaultTitle}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md">
        {defaultDescription}
      </p>
    </div>
  );
}

/* ========================================
   复合加载状态组件
   ======================================== */

/**
 * BrowsablePageLoadingState - 综合加载状态组件
 * 
 * 根据不同的加载阶段显示对应的加载状态
 * 提供统一的加载状态管理
 */
export function BrowsablePageLoadingState({
  isInitialLoading,
  isFiltering,
  isRefreshing,
  isPaginating,
  pageType,
  className
}: {
  isInitialLoading: boolean;
  isFiltering: boolean;
  isRefreshing: boolean;
  isPaginating: boolean;
  pageType: BrowsablePageType;
  className?: string;
}) {
  // 初始加载时显示页面骨架屏
  if (isInitialLoading) {
    return <BrowsablePageSkeleton pageType={pageType} className={className} />;
  }

  // 筛选时显示筛选加载指示器
  if (isFiltering) {
    return (
      <BrowsableFilterLoadingIndicator 
        isLoading={true} 
        pageType={pageType} 
        className={className}
      />
    );
  }

  // 数据刷新时显示刷新指示器
  if (isRefreshing) {
    return (
      <BrowsableDataRefreshIndicator 
        isLoading={true} 
        className={className}
      />
    );
  }

  // 分页时显示页面加载遮罩
  if (isPaginating) {
    return (
      <BrowsablePageLoadingOverlay 
        isLoading={true} 
        pageType={pageType} 
        className={className}
      />
    );
  }

  return null;
}

/* ========================================
   默认导出所有组件
   ======================================== */

const BrowsablePageLoadingStates = {
  BrowsablePageSkeleton,
  BrowsablePageHeaderSkeleton,
  BrowsableFilterLoadingIndicator,
  BrowsableDataRefreshIndicator,
  BrowsablePageLoadingOverlay,
  BrowsablePageEmptyStateWithLoading,
  BrowsablePageLoadingState,
};

export default BrowsablePageLoadingStates;