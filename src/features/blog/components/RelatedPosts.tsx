"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BlogCard } from "./BlogCard";
import { blogDetailService, RelatedPostsOptions } from "../data/blogDetailService";
import type { BlogCardData } from "../types";
import { cn } from "@/lib/utils";

interface RelatedPostsProps {
  /** 当前博客文章ID */
  currentBlogId: string;
  
  /** 组件额外样式类名 */
  className?: string;
  
  /** 推荐文章数量，默认3篇 */
  limit?: number;
  
  /** 推荐策略 */
  strategy?: RelatedPostsOptions['strategy'];
  
  /** 最小相似度阈值 */
  minSimilarityScore?: number;
  
  /** 标签点击处理 */
  onTagClick?: (tag: string) => void;
  
  /** 作者点击处理 */
  onAuthorClick?: (authorId: string) => void;
}

/**
 * 相关文章推荐组件
 * 
 * 在博客详情页底部显示相关文章推荐，基于分类、标签和内容相似度
 * 使用3列网格布局展示推荐文章，复用现有BlogCard组件
 * 
 * 核心功能：
 * - 基于当前文章的分类和标签智能推荐相关文章
 * - 支持多种推荐策略（分类、标签、内容、混合）
 * - 3列响应式网格布局，移动端自适应单列/双列
 * - 推荐文章加载状态和错误处理
 * - 空状态提示和重试功能
 * - Stagger动画效果提升用户体验
 * 
 * Requirements满足：
 * - 4.1: 基于相同分类或标签的相关文章推荐
 * - 4.2: 3列卡片布局，复用BlogCard组件
 * - 4.5: 适当的加载状态和错误处理
 */
const RelatedPosts = React.memo(function RelatedPosts({
  currentBlogId,
  className,
  limit = 3,
  strategy = 'mixed',
  minSimilarityScore = 0.2,
  onTagClick,
  onAuthorClick
}: RelatedPostsProps) {
  // 相关文章数据状态
  const [relatedPosts, setRelatedPosts] = useState<BlogCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * 获取相关文章数据
   */
  const fetchRelatedPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const options: RelatedPostsOptions = {
        strategy,
        limit,
        excludeCurrentPost: true,
        minSimilarityScore
      };

      const posts = await blogDetailService.getRelatedPosts(currentBlogId, options);
      setRelatedPosts(posts);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load related posts';
      setError(errorMessage);
      console.error('Failed to fetch related posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentBlogId, strategy, limit, minSimilarityScore]);

  /**
   * 重试加载相关文章
   */
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchRelatedPosts();
  }, [fetchRelatedPosts]);

  // 初始化和依赖变化时获取数据
  useEffect(() => {
    if (currentBlogId) {
      fetchRelatedPosts();
    }
  }, [fetchRelatedPosts]);

  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return (
      <section 
        className={cn("space-y-6", className)}
        aria-label="Related posts loading"
      >
        {/* 标题骨架 */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* 文章卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <div 
              key={index}
              className="space-y-4 p-4 border rounded-xl bg-card animate-pulse"
              style={{
                animationDelay: `${index * 150}ms`
              }}
            >
              {/* 封面图片骨架 */}
              <div className="aspect-[16/10] bg-muted rounded-lg" />
              
              {/* 文章标题骨架 */}
              <div className="space-y-2">
                <div className="h-5 bg-muted rounded w-full" />
                <div className="h-5 bg-muted/60 rounded w-3/4" />
              </div>

              {/* 作者信息骨架 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded-full" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 如果发生错误，显示错误状态
  if (error) {
    return (
      <section 
        className={cn("space-y-4 p-6 border border-destructive/20 rounded-xl bg-destructive/5", className)}
        aria-label="Related posts error"
      >
        <div className="text-center space-y-3">
          {/* 错误图标 */}
          <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* 错误信息 */}
          <div className="space-y-1">
            <h3 className="font-semibold text-destructive">
              Failed to Load Related Posts
            </h3>
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
          </div>

          {/* 重试按钮 */}
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            disabled={isLoading}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
            {retryCount > 0 && (
              <span className="text-xs opacity-70">
                ({retryCount})
              </span>
            )}
          </button>
        </div>
      </section>
    );
  }

  // 如果没有相关文章，显示空状态
  if (relatedPosts.length === 0) {
    return (
      <section 
        className={cn("space-y-4 p-6 border border-dashed rounded-xl bg-muted/30", className)}
        aria-label="No related posts found"
      >
        <div className="text-center space-y-3">
          {/* 空状态图标 */}
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          {/* 空状态信息 */}
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">
              No Related Posts Found
            </h3>
            <p className="text-sm text-muted-foreground">
              We couldn't find any related articles at the moment. Check back later for more content!
            </p>
          </div>
        </div>
      </section>
    );
  }

  // 渲染相关文章列表
  return (
    <section 
      className={cn("space-y-6", className)}
      aria-label="Related posts"
    >
      {/* 标题区域 */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Related Posts
        </h2>
        <p className="text-muted-foreground">
          Discover more articles you might find interesting
        </p>
      </div>

      {/* 相关文章网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post, index) => (
          <div
            key={post.id}
            className="related-post-item"
            style={{
              // Stagger动画延迟
              animationDelay: `${index * 150}ms`
            }}
          >
            <BlogCard
              blog={post}
              onTagClick={onTagClick}
              onAuthorClick={onAuthorClick}
              animationIndex={index}
              className="h-full hover:shadow-lg transition-shadow duration-300"
            />
          </div>
        ))}
      </div>

      {/* 推荐策略说明（开发模式下显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground/60 text-center mt-4">
          Recommended using "{strategy}" strategy • {relatedPosts.length} of {limit} posts found
        </div>
      )}
    </section>
  );
});

export { RelatedPosts };
export default RelatedPosts;