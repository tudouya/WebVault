import React from "react";
import { cn } from "@/lib/utils";
import { WebsiteCard } from "./WebsiteCard";
import type { WebsiteCardData } from "../types/website";

interface RelatedWebsiteGridProps {
  /** 相关网站数据列表 */
  relatedWebsites: WebsiteCardData[];
  
  /** 自定义类名 */
  className?: string;
  
  /** 网站卡片访问回调 */
  onVisitWebsite?: (website: WebsiteCardData) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 标题文本，默认为"更多产品" */
  title?: string;
  
  /** 是否显示标题区域，默认为true */
  showTitle?: boolean;
  
  /** 最大显示数量，默认为6 */
  maxItems?: number;
}

/**
 * 相关网站推荐组件
 * 
 * 用于在网站详情页面底部显示相关网站推荐，完全复用现有的 WebsiteCard 组件。
 * 
 * 功能特性：
 * - 复用现有 WebsiteCard 组件进行网站展示
 * - 响应式网格布局（移动端1列，平板2列，桌面3列）
 * - 支持自定义标题和显示数量限制
 * - 当没有相关网站时自动隐藏
 * - 包含语义化 HTML 结构和 ARIA 标签
 * - 支持网站访问和标签点击事件
 * 
 * @example
 * ```tsx
 * <RelatedWebsiteGrid
 *   relatedWebsites={website.related_websites}
 *   onVisitWebsite={handleVisitWebsite}
 *   onTagClick={handleTagClick}
 *   title="推荐网站"
 *   maxItems={6}
 * />
 * ```
 */
export function RelatedWebsiteGrid({
  relatedWebsites,
  className,
  onVisitWebsite,
  onTagClick,
  title = "更多产品",
  showTitle = true,
  maxItems = 6,
}: RelatedWebsiteGridProps) {
  // 如果没有相关网站数据，不渲染组件
  if (!relatedWebsites || relatedWebsites.length === 0) {
    return null;
  }

  // 限制显示数量
  const displayWebsites = relatedWebsites.slice(0, maxItems);

  return (
    <section 
      className={cn("space-y-6", className)}
      aria-labelledby="related-websites-heading"
      role="region"
    >
      {/* 标题区域 */}
      {showTitle && (
        <header className="flex items-center justify-between">
          <h2 
            id="related-websites-heading"
            className="text-2xl font-bold text-foreground"
            role="heading"
            aria-level={2}
          >
            {title}
          </h2>
          
          {/* 显示数量信息 */}
          {relatedWebsites.length > maxItems && (
            <span 
              className="text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
              aria-label={`显示 ${displayWebsites.length} 个，共 ${relatedWebsites.length} 个相关网站`}
            >
              显示 {displayWebsites.length} / {relatedWebsites.length}
            </span>
          )}
        </header>
      )}

      {/* 相关网站网格 */}
      <div 
        className={cn(
          // 响应式网格布局：移动端1列，平板2列，桌面3列
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          // 使用24px间距 (--spacing-md)，与 WebsiteGrid 保持一致
          "gap-6",
          // 页面淡入动画
          "page-fade-in"
        )}
        role="grid"
        aria-label="相关网站推荐"
      >
        {/* 渲染相关网站卡片 */}
        {displayWebsites.map((website, index) => (
          <div
            key={website.id}
            role="gridcell"
            className="h-fit"
          >
            <WebsiteCard
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
          </div>
        ))}
      </div>

      {/* 如果有更多网站，显示提示信息 */}
      {relatedWebsites.length > maxItems && (
        <footer 
          className="text-center"
          role="contentinfo"
          aria-label="更多相关网站提示"
        >
          <p 
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            还有 {relatedWebsites.length - maxItems} 个相关网站...
          </p>
        </footer>
      )}
    </section>
  );
}

export default RelatedWebsiteGrid;