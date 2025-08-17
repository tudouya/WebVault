"use client";

import React, { useCallback, useState } from "react";
import { ExternalLink, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/shared/LazyImage";
import type { WebsiteDetailData } from "../types/detail";

interface WebsiteDetailHeroProps {
  /** Website detail data */
  website: WebsiteDetailData;
  /** Callback function when visit button is clicked */
  onVisit: (websiteId: string, url: string) => void | Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Website icon component with fallback handling
 * Based on the pattern from WebsiteCard but optimized for detail page
 */
interface WebsiteIconProps {
  website: WebsiteDetailData;
  size?: number;
  className?: string;
}

const WebsiteIcon = React.memo(function WebsiteIcon({ 
  website, 
  size = 64, 
  className 
}: WebsiteIconProps) {
  /**
   * 图标颜色映射 - 复用 WebsiteCard 的逻辑
   * 为不同网站提供彩色圆角图标
   */
  const getIconColor = (title: string): string => {
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-blue-500',
      'bg-red-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-teal-500'
    ];
    return colors[hash % colors.length];
  };

  return (
    <div 
      className={cn(
        "flex-shrink-0 rounded-lg flex items-center justify-center text-white relative",
        getIconColor(website.title),
        className
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${website.title} icon`}
    >
      {website.favicon_url ? (
        <LazyImage
          src={website.favicon_url}
          alt={`${website.title} icon`}
          className="rounded"
          containerClassName="flex items-center justify-center"
          style={{ width: size * 0.6, height: size * 0.6 }}
          rootMargin="0px 0px 50px 0px" // 较早触发加载
          lazy={false} // Hero 区域不使用懒加载
          fallback={
            <Globe 
              style={{ width: size * 0.4, height: size * 0.4 }} 
              aria-hidden="true"
            />
          }
          placeholder={
            <div 
              className="rounded-full border-2 border-white/30 border-t-white animate-spin"
              style={{ width: size * 0.3, height: size * 0.3 }}
            />
          }
        />
      ) : (
        <Globe 
          style={{ width: size * 0.4, height: size * 0.4 }} 
          aria-hidden="true"
        />
      )}
    </div>
  );
});

/**
 * Website cover image component with fallback handling
 */
interface WebsiteCoverImageProps {
  website: WebsiteDetailData;
  className?: string;
}

const WebsiteCoverImage = React.memo(function WebsiteCoverImage({ 
  website, 
  className 
}: WebsiteCoverImageProps) {
  // 如果没有封面图片URL，不显示任何内容
  if (!website.screenshot_url) {
    return null;
  }

  return (
    <div className={cn("w-full overflow-hidden rounded-lg", className)}>
      <LazyImage
        src={website.screenshot_url}
        alt={`${website.title} screenshot`}
        className="w-full h-auto object-cover max-h-96"
        containerClassName="w-full"
        rootMargin="0px 0px 200px 0px" // 提前200px开始加载
        enablePerformanceMonitoring={true} // 启用性能监控
        fallback={
          /* 默认封面占位图 - 基于 BlogCard 的模式 */
          <div className="w-full h-96 bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium mb-2">Screenshot not available</p>
              <p className="text-xs text-muted-foreground/70">
                Visit the website to see the current content
              </p>
            </div>
          </div>
        }
        placeholder={
          <div className="w-full h-96 bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
          </div>
        }
      />
    </div>
  );
});

/**
 * WebsiteDetailHero Component
 * 
 * 网站详情页面的英雄区域组件，包含：
 * - 网站图标（带加载状态和降级处理）
 * - 网站标题和描述
 * - 可点击的网站URL
 * - 访问网站按钮
 * - 网站截图/封面图片（可选，带加载状态和占位图）
 * 
 * Features:
 * - 响应式设计，支持移动端
 * - 图片加载失败的优雅降级处理（AC-2.1.3）
 * - 图片加载状态指示器和平滑过渡动画
 * - 语义化HTML结构和ARIA标签
 * - 可访问性支持
 * - 与现有设计系统保持一致
 * - 基于 BlogCard 组件的成熟图片处理模式
 * 
 * Image Error Handling:
 * - Favicon: 加载失败时显示彩色圆角背景 + Globe 图标
 * - Cover Image: 加载失败时显示统一样式的占位图
 * - Loading States: 显示适当的加载指示器
 * - Smooth Transitions: 图片加载完成后的平滑显示效果
 * 
 * @example
 * ```tsx
 * <WebsiteDetailHero
 *   website={websiteData}
 *   onVisit={(id, url) => {
 *     // 处理访问逻辑
 *     window.open(url, '_blank', 'noopener,noreferrer');
 *   }}
 * />
 * ```
 */
const WebsiteDetailHero = React.memo(function WebsiteDetailHero({
  website,
  onVisit,
  className
}: WebsiteDetailHeroProps) {
  const handleVisit = useCallback(() => {
    onVisit(website.id, website.url);
    // 在新标签页打开网站
    window.open(website.url, '_blank', 'noopener,noreferrer');
  }, [onVisit, website.id, website.url]);

  const handleUrlClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleVisit();
  }, [handleVisit]);

  const handleUrlKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleVisit();
    }
  }, [handleVisit]);

  return (
    <section 
      className={cn("space-y-6", className)}
      role="banner"
      aria-labelledby="website-hero-heading"
      aria-describedby="website-hero-description"
    >
      {/* 封面图片 - 在顶部显示 */}
      <WebsiteCoverImage website={website} />
      
      {/* 主要信息区域 */}
      <div className="space-y-6">
        {/* 网站基本信息 */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* 图标和基本信息 */}
          <div className="flex items-start gap-4">
            <WebsiteIcon website={website} size={64} />
            
            <div className="flex-1 min-w-0 space-y-3">
              {/* 网站标题 */}
              <h1 
                id="website-hero-heading"
                className="text-2xl sm:text-3xl font-bold text-foreground leading-tight"
                role="heading"
                aria-level={1}
              >
                {website.title}
              </h1>
              
              {/* 网站URL - 可点击 */}
              <button
                onClick={handleUrlClick}
                onKeyDown={handleUrlKeyDown}
                className={cn(
                  "group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "rounded-sm px-1 py-0.5"
                )}
                aria-label={`访问 ${website.title} 网站: ${website.url}`}
                role="button"
                tabIndex={0}
              >
                <span className="underline-offset-4 group-hover:underline truncate max-w-md">
                  {website.url}
                </span>
                <ExternalLink 
                  className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                  aria-hidden="true"
                />
              </button>
              
              {/* 网站描述 */}
              {website.description && (
                <p 
                  id="website-hero-description"
                  className="text-muted-foreground leading-relaxed"
                  role="text"
                >
                  {website.description}
                </p>
              )}
              
              {/* 可访问性状态 */}
              {!website.is_accessible && (
                <div 
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm",
                    "warning-banner dark:warning-banner-dark",
                    "border border-yellow-300 dark:border-yellow-700"
                  )}
                  role="alert"
                  aria-label="网站可访问性警告"
                >
                  <AlertCircle 
                    className="w-4 h-4" 
                    aria-hidden="true"
                  />
                  <span>网站可能存在无障碍访问问题</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 访问按钮 - 右侧或底部 */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleVisit}
              size="lg"
              className={cn(
                "w-full sm:w-auto min-w-[140px] gap-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label={`访问 ${website.title} 网站`}
              role="button"
              type="button"
            >
              <span>访问网站</span>
              <ExternalLink 
                className="w-4 h-4" 
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
        
        {/* 扩展信息 - 可选 */}
        {website.content && (
          <div 
            className="prose prose-sm max-w-none text-muted-foreground"
            role="region"
            aria-label="网站扩展信息"
          >
            <p>{website.content}</p>
          </div>
        )}
      </div>
    </section>
  );
});

export { WebsiteDetailHero };
export default WebsiteDetailHero;