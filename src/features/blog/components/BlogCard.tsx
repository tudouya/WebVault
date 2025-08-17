"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { BlogCardData } from "../types";

interface BlogCardProps {
  blog: BlogCardData;
  className?: string;
  onTagClick?: (tag: string) => void;
  onAuthorClick?: (authorId: string) => void;
  animationIndex?: number; // 用于stagger动画的索引
}

/**
 * 计算相对时间显示格式（如 "20d AHEAD"）
 */
function formatRelativeTime(publishedAt: string): string {
  const now = new Date();
  const publishDate = new Date(publishedAt);
  const diffInMs = now.getTime() - publishDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "1d ago";
  } else if (diffInDays > 0) {
    return `${diffInDays}d ago`;
  } else {
    // 未来日期
    const futureDays = Math.abs(diffInDays);
    return `${futureDays}d AHEAD`;
  }
}

/**
 * BlogCard组件
 * 
 * 展示博客文章信息的核心UI组件，包含封面图、标题、作者信息和发布时间
 * 支持点击事件和键盘导航，遵循无障碍访问标准
 * 
 * 功能特性:
 * - 16:10比例封面图片展示，支持懒加载优化（视窗底部200px触发）
 * - 图片加载失败自动回退到默认占位图
 * - 文章标题限制最多2行显示，超出部分显示省略号
 * - 作者信息展示（圆形头像 + 姓名）
 * - 相对时间格式显示（如 "20d AHEAD"）
 * - Stagger进入动画：页面加载时按索引延迟100ms递进显示
 * - 悬停时translateY(-4px)向上位移和阴影加深效果 (Requirements 13.1)
 * - 支持Tab键切换和Enter键激活
 * - 支持点击导航到文章详情页面
 * - 性能优化：LCP < 2.5秒，CLS < 0.1，支持prefers-reduced-motion
 */
const BlogCard = React.memo(function BlogCard({ 
  blog, 
  className,
  onTagClick,
  onAuthorClick,
  animationIndex = 0
}: BlogCardProps) {
  // 封面图片加载状态管理
  const [coverImageError, setCoverImageError] = useState(false);
  const [authorAvatarError, setAuthorAvatarError] = useState(false);

  // Next.js 路由导航
  const router = useRouter();

  // 懒加载监听 - 视窗底部200px触发
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '0px 0px 200px 0px', // 视窗底部200px触发
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  const handleClick = useCallback(() => {
    // 导航到博客详情页面
    router.push(`/blog/${blog.slug}`);
  }, [router, blog.slug]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleAuthorClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onAuthorClick?.(blog.id); // 使用blog.id作为authorId的简化实现
  }, [onAuthorClick, blog.id]);

  // 图片加载错误处理
  const handleCoverImageError = useCallback(() => {
    setCoverImageError(true);
  }, []);

  const handleAuthorAvatarError = useCallback(() => {
    setAuthorAvatarError(true);
  }, []);

  const relativeTime = formatRelativeTime(blog.publishedAt);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden group blog-card blog-grid-enter",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "bg-white rounded-xl border shadow-sm",
        className
      )}
      style={{
        animationDelay: `${Math.min(animationIndex * 100, 500)}ms` // 最大延迟500ms
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Read blog post: ${blog.title}`}
    >
      {/* 封面图片区域 - 16:10比例 */}
      <div 
        ref={intersectionRef}
        className="relative w-full aspect-[16/10] overflow-hidden rounded-t-xl bg-muted"
      >
        {isIntersecting && !coverImageError ? (
          <Image
            src={blog.coverImage}
            alt={`Cover image for ${blog.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            onError={handleCoverImageError}
            unoptimized={false}
            quality={85}
            style={{
              color: 'transparent',
            }}
          />
        ) : !isIntersecting ? (
          /* 懒加载占位图 - 在元素进入视窗前显示 */
          <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
          </div>
        ) : (
          /* 默认封面占位图 */
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs font-medium">Image not available</p>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col h-32">
        {/* 文章标题 - 限制2行，省略号 */}
        <h3 
          className="font-semibold text-lg text-foreground mb-3 line-clamp-2 leading-tight flex-1"
          title={blog.title}
        >
          {blog.title}
        </h3>

        {/* 底部作者信息和发布时间 */}
        <div className="flex items-center justify-between mt-auto">
          {/* 作者信息 */}
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            onClick={handleAuthorClick}
            title={`View posts by ${blog.author.name}`}
            aria-label={`View posts by ${blog.author.name}`}
          >
            {/* 作者头像 */}
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted">
              {blog.author.avatar && !authorAvatarError ? (
                <Image
                  src={blog.author.avatar}
                  alt={`${blog.author.name}'s avatar`}
                  fill
                  className="object-cover"
                  sizes="24px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  onError={handleAuthorAvatarError}
                  unoptimized={false}
                />
              ) : (
                /* 默认用户头像 */
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {blog.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* 作者名称 */}
            <span className="font-medium truncate max-w-20">
              {blog.author.name}
            </span>
          </button>

          {/* 发布时间 */}
          <time 
            className="text-sm text-muted-foreground font-medium"
            dateTime={blog.publishedAt}
            title={new Date(blog.publishedAt).toLocaleDateString()}
          >
            {relativeTime}
          </time>
        </div>
      </CardContent>
    </Card>
  );
});

export { BlogCard };
export default BlogCard;