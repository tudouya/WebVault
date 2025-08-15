import React from "react";
import { cn } from "@/lib/utils";
import { CollectionCard } from "./CollectionCard";
import { 
  CollectionCardSkeleton,
  CollectionErrorState,
  CollectionEmptyState 
} from "./CollectionLoadingStates";
import type { CollectionCardData } from "../types/collection";

interface CollectionGridProps {
  /** 集合数据列表 */
  collections: CollectionCardData[];
  
  /** 是否正在加载 */
  isLoading?: boolean;
  
  /** 是否有错误 */
  isError?: boolean;
  
  /** 错误信息 */
  error?: string;
  
  /** 自定义类名 */
  className?: string;
  
  /** 集合卡片点击回调 */
  onCollectionClick?: (collection: CollectionCardData) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 加载更多回调 */
  onLoadMore?: () => void;
  
  /** 是否可以加载更多 */
  hasMore?: boolean;
  
  /** 是否正在加载更多 */
  isLoadingMore?: boolean;
}

// 骨架屏组件已迁移到 CollectionLoadingStates.tsx

// 空状态组件已迁移到 CollectionLoadingStates.tsx

// 错误状态组件已迁移到 CollectionLoadingStates.tsx

/**
 * 加载更多按钮组件
 * 确保触摸友好的交互区域和响应式间距
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
    <div className="col-span-full flex justify-center pt-6 sm:pt-8">
      <button
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className={cn(
          // 基础样式
          "px-6 py-3 bg-primary text-primary-foreground rounded-lg",
          // 触摸友好：确保最小44px高度
          "min-h-[44px] min-w-[120px]",
          // 状态变化
          "hover:bg-primary/90 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          // 过渡动画
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // 布局
          "flex items-center justify-center gap-2",
          // 响应式触摸体验
          "touch-manipulation", // 禁用双击缩放
          "btn-primary-animated" // 添加主要按钮动画效果
        )}
        type="button"
        aria-label={isLoadingMore ? '正在加载更多集合...' : '加载更多集合'}
      >
        {isLoadingMore && (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
        <span className="font-medium">
          {isLoadingMore ? '加载中...' : '加载更多'}
        </span>
      </button>
    </div>
  );
};

/**
 * CollectionGrid组件
 * 
 * 响应式集合卡片网格容器，支持：
 * - 桌面端3列、平板2列、移动端1列的响应式布局
 * - loading、empty、error状态处理
 * - 集合卡片交互事件
 * - 无限滚动加载更多功能
 * - 响应式间距：移动端16px，桌面端24px
 * - 触摸友好的移动端体验
 * - 平滑的布局切换动画
 */
export function CollectionGrid({
  collections,
  isLoading = false,
  isError = false,
  error,
  className,
  onCollectionClick,
  onTagClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: CollectionGridProps) {
  // 加载状态：显示骨架屏
  if (isLoading) {
    return (
      <div className={cn(
        // 响应式网格：移动端1列，平板2列，桌面3列
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 响应式间距：移动端16px (gap-4)，桌面端24px (gap-6)
        "gap-4 sm:gap-5 md:gap-6",
        // 布局切换动画
        "transition-all duration-300 ease-out",
        className
      )}>
        {/* 显示6个骨架屏 */}
        <CollectionCardSkeleton count={6} />
      </div>
    );
  }

  // 错误状态
  if (isError) {
    return (
      <div className={cn(
        // 响应式网格布局
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 响应式间距：移动端16px，桌面端24px
        "gap-4 sm:gap-5 md:gap-6",
        // 布局切换动画
        "transition-all duration-300 ease-out",
        className
      )}>
        <CollectionErrorState 
          error={error}
          type={error?.toLowerCase?.().includes('network') ? 'network' : 'data'}
        />
      </div>
    );
  }

  // 空状态：没有集合数据
  if (!collections || collections.length === 0) {
    return (
      <div className={cn(
        // 响应式网格布局
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 响应式间距：移动端16px，桌面端24px
        "gap-4 sm:gap-5 md:gap-6",
        // 布局切换动画
        "transition-all duration-300 ease-out",
        className
      )}>
        <CollectionEmptyState />
      </div>
    );
  }

  // 正常状态：显示集合卡片网格
  return (
    <div className={cn(
      // 响应式网格布局：移动端1列，平板2列，桌面3列
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      // 响应式间距：移动端16px，小屏20px，桌面24px
      "gap-4 sm:gap-5 md:gap-6",
      // 布局切换动画 - 提供平滑的响应式过渡
      "transition-all duration-300 ease-out",
      // 页面淡入动画
      "page-fade-in",
      // 移动端触摸体验优化
      "touch-manipulation", // 禁用双击缩放
      className
    )}>
      {/* 渲染集合卡片 */}
      {collections.map((collection, index) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onClick={onCollectionClick}
          onTagClick={onTagClick}
          className={cn(
            // 确保卡片高度自适应内容
            "h-fit",
            // 网格入场动画
            "collection-grid-enter"
          )}
          style={{ 
            // 分阶段入场动画，最大延迟500ms（已在CSS中处理移动端优化）
            animationDelay: `${Math.min(index * 100, 500)}ms`
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

export default CollectionGrid;