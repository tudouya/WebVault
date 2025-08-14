import React from "react";
import { cn } from "@/lib/utils";
import { WebsiteCard } from "./WebsiteCard";
import type { WebsiteCardData } from "../types/website";

interface WebsiteGridProps {
  /** 网站数据列表 */
  websites: WebsiteCardData[];
  
  /** 是否正在加载 */
  isLoading?: boolean;
  
  /** 是否有错误 */
  isError?: boolean;
  
  /** 错误信息 */
  error?: string;
  
  /** 自定义类名 */
  className?: string;
  
  /** 网站卡片访问回调 */
  onVisitWebsite?: (website: WebsiteCardData) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 加载更多回调 */
  onLoadMore?: () => void;
  
  /** 是否可以加载更多 */
  hasMore?: boolean;
  
  /** 是否正在加载更多 */
  isLoadingMore?: boolean;
}

/**
 * 加载骨架组件
 * 模拟网站卡片的骨架屏效果
 */
const WebsiteCardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-6 skeleton loading-pulse">
    {/* 头部区域骨架 */}
    <div className="flex items-start gap-4 mb-4">
      {/* 图标骨架 */}
      <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0" />
      
      {/* 标题和描述骨架 */}
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-muted rounded mb-2 w-3/4" />
        <div className="h-4 bg-muted rounded mb-1 w-full" />
        <div className="h-4 bg-muted rounded mb-1 w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>

    {/* 标签区域骨架 */}
    <div className="flex gap-2 mb-4">
      <div className="h-6 bg-muted rounded-full w-20" />
      <div className="h-6 bg-muted rounded-full w-16" />
      <div className="h-6 bg-muted rounded-full w-24" />
    </div>

    {/* 底部区域骨架 */}
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <div className="h-4 bg-muted rounded w-20" />
      <div className="h-8 bg-muted rounded w-24" />
    </div>
  </div>
);

/**
 * 空状态组件
 */
const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center min-h-[300px]">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">
      没有找到网站
    </h3>
    <p className="text-muted-foreground max-w-md">
      没有符合当前筛选条件的网站。请尝试调整搜索条件或分类筛选。
    </p>
  </div>
);

/**
 * 错误状态组件
 */
const ErrorState = ({ message }: { message?: string }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center min-h-[300px]">
    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-destructive"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">
      加载出错了
    </h3>
    <p className="text-muted-foreground max-w-md">
      {message || "无法加载网站数据，请稍后重试。"}
    </p>
  </div>
);

/**
 * 加载更多按钮组件
 */
const LoadMoreButton = ({ 
  onLoadMore, 
  isLoadingMore,
  hasMore 
}: {
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}) => {
  if (!hasMore) return null;
  
  return (
    <div className="col-span-full flex justify-center pt-8">
      <button
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className={cn(
          "px-6 py-3 bg-primary text-primary-foreground rounded-lg",
          "hover:bg-primary/90 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center gap-2",
          "btn-primary-animated" // 添加主要按钮动画效果
        )}
      >
        {isLoadingMore && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isLoadingMore ? '加载中...' : '加载更多'}
      </button>
    </div>
  );
};

/**
 * WebsiteGrid组件
 * 
 * 响应式网站卡片网格容器，支持：
 * - 桌面端3列、平板2列、移动端1列的响应式布局
 * - loading、empty、error状态处理
 * - 网站卡片交互事件
 * - 无限滚动加载更多功能
 */
export function WebsiteGrid({
  websites,
  isLoading = false,
  isError = false,
  error,
  className,
  onVisitWebsite,
  onTagClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: WebsiteGridProps) {
  // 加载状态：显示骨架屏
  if (isLoading) {
    return (
      <div className={cn(
        // 响应式网格：移动端1列，平板2列，桌面3列
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 使用24px间距 (--spacing-md)
        "gap-6",
        className
      )}>
        {/* 显示6个骨架屏 */}
        {Array.from({ length: 6 }).map((_, index) => (
          <WebsiteCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 错误状态
  if (isError) {
    return (
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}>
        <ErrorState message={error} />
      </div>
    );
  }

  // 空状态：没有网站数据
  if (!websites || websites.length === 0) {
    return (
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}>
        <EmptyState />
      </div>
    );
  }

  // 正常状态：显示网站卡片网格
  return (
    <div className={cn(
      // 响应式网格布局
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      // 24px间距，符合--spacing-md规范
      "gap-6",
      // 页面淡入动画
      "page-fade-in",
      className
    )}>
      {/* 渲染网站卡片 */}
      {websites.map((website, index) => (
        <WebsiteCard
          key={website.id}
          website={website}
          onVisit={onVisitWebsite}
          onTagClick={onTagClick}
          className={cn(
            "h-fit", // 确保卡片高度自适应内容
            "website-grid-enter" // 网格入场动画
          )}
          style={{ 
            animationDelay: `${Math.min(index * 100, 500)}ms` // 最大延迟500ms
          }}
        />
      ))}
      
      {/* 加载更多按钮 */}
      <LoadMoreButton
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
      />
    </div>
  );
}

export default WebsiteGrid;