import React from "react";
import { cn } from "@/lib/utils";
import { BlogCard } from "./BlogCard";
import { 
  BlogCardSkeleton,
  BlogErrorState,
  BlogEmptyState 
} from "./BlogLoadingStates";
import type { BlogCardData } from "../types";

interface BlogGridProps {
  /** 博客数据列表 */
  blogs: BlogCardData[];
  
  /** 是否正在加载 */
  loading?: boolean;
  
  /** 错误信息 */
  error?: string;
  
  /** 自定义空状态内容 */
  emptyState?: React.ReactNode;
  
  /** 自定义类名 */
  className?: string;
  
  /** 博客卡片点击回调 */
  onBlogClick?: (blog: BlogCardData) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 作者点击回调 */
  onAuthorClick?: (authorId: string) => void;
  
  /** 重试回调 */
  onRetry?: () => void;
  
  /** 重置筛选回调 */
  onResetFilters?: () => void;
}

/**
 * BlogGrid组件
 * 
 * 响应式博客文章网格容器，支持：
 * - 桌面端3列、平板2列、移动端1列的响应式布局
 * - loading、empty、error状态处理
 * - 博客卡片交互事件
 * - 响应式间距：移动端16px，平板20px，桌面端24px
 * - 触摸友好的移动端体验
 * - 平滑的布局切换动画
 * 
 * 响应式布局规格 (优化):
 * - Desktop (1024px+): 3列网格，列间距24px (lg:grid-cols-3 lg:gap-6)
 * - Tablet (768-1023px): 2列网格，列间距20px (md:grid-cols-2 md:gap-5)  
 * - Mobile (<768px): 单列布局，左右边距16px (grid-cols-1 gap-4 px-4)
 * 
 * 移动端优化:
 * - 禁用触摸缩放 (touch-action: manipulation)
 * - 优化触摸目标大小和间距
 * - 平滑的断点过渡效果
 * 
 * 基于现有响应式设计模式实现，确保与其他Grid组件一致性
 */
export function BlogGrid({
  blogs,
  loading = false,
  error,
  emptyState,
  className,
  onBlogClick,
  onTagClick,
  onAuthorClick,
  onRetry,
  onResetFilters,
}: BlogGridProps) {
  // 加载状态：显示骨架屏
  if (loading) {
    return (
      <div className={cn(
        // 响应式网格：移动端1列，平板2列，桌面3列
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 响应式间距：移动端16px (gap-4)，平板20px (gap-5)，桌面24px (gap-6)
        "gap-4 md:gap-5 lg:gap-6",
        // 移动端左右边距：16px
        "px-4 md:px-0",
        // 布局切换动画 - 平滑过渡
        "transition-all duration-300 ease-out",
        // 移动端触摸优化
        "touch-manipulation",
        className
      )}>
        {/* 显示6个骨架屏 */}
        <BlogCardSkeleton count={6} />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={cn(
        // 响应式网格布局
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 响应式间距：移动端16px，平板20px，桌面24px
        "gap-4 md:gap-5 lg:gap-6",
        // 移动端左右边距：16px
        "px-4 md:px-0",
        // 布局切换动画 - 平滑过渡
        "transition-all duration-300 ease-out",
        // 移动端触摸优化
        "touch-manipulation",
        className
      )}>
        <BlogErrorState 
          error={error}
          type={error?.toLowerCase?.().includes('network') ? 'network' : 'data'}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // 空状态：没有博客数据
  if (!blogs || blogs.length === 0) {
    return (
      <div className={cn(
        // 响应式网格布局
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 响应式间距：移动端16px，平板20px，桌面24px
        "gap-4 md:gap-5 lg:gap-6",
        // 移动端左右边距：16px
        "px-4 md:px-0",
        // 布局切换动画 - 平滑过渡
        "transition-all duration-300 ease-out",
        // 移动端触摸优化
        "touch-manipulation",
        className
      )}>
        {emptyState || (
          <BlogEmptyState 
            onResetFilters={onResetFilters}
          />
        )}
      </div>
    );
  }

  // 正常状态：显示博客卡片网格
  return (
    <div className={cn(
      // 响应式网格布局：移动端1列，平板2列，桌面3列
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      // 响应式间距：移动端16px，平板20px，桌面24px
      "gap-4 md:gap-5 lg:gap-6",
      // 移动端左右边距：16px (确保内容不贴边)
      "px-4 md:px-0",
      // 布局切换动画 - 提供平滑的响应式过渡
      "transition-all duration-300 ease-out",
      // 页面淡入动画
      "page-fade-in",
      // 移动端触摸体验优化
      "touch-manipulation", // 禁用双击缩放，优化移动端交互
      // 网格布局容器样式 - 确保平滑的布局切换
      "blog-grid-container",
      className
    )}>
      {/* 渲染博客卡片 */}
      {blogs.map((blog, index) => (
        <div
          key={blog.id}
          className={cn(
            // 确保卡片高度自适应内容
            "h-fit",
            // 网格入场动画
            "blog-grid-enter"
          )}
          style={{ 
            // 分阶段入场动画，最大延迟500ms
            animationDelay: `${Math.min(index * 100, 500)}ms`
          }}
        >
          <BlogCard
            blog={blog}
            onTagClick={onTagClick}
            onAuthorClick={onAuthorClick}
          />
        </div>
      ))}
    </div>
  );
}

export default BlogGrid;