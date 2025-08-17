"use client";

import React, { useCallback } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/shared/LazyImage";
import type { WebsiteCardData } from "../types/website";
import { TagPill } from "./TagPill";
import { useRouter } from "next/navigation";

interface WebsiteCardProps {
  website: WebsiteCardData;
  className?: string;
  style?: React.CSSProperties;
  onVisit?: (website: WebsiteCardData) => void;
  onTagClick?: (tag: string) => void;
}


/**
 * 图标颜色映射
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

const WebsiteCard = React.memo(function WebsiteCard({ website, className, style, onVisit, onTagClick }: WebsiteCardProps) {
  const router = useRouter();
  
  // 处理访问外部网站
  const handleVisit = useCallback(() => {
    onVisit?.(website);
    // 在新窗口打开网站
    window.open(website.url, '_blank', 'noopener,noreferrer');
  }, [onVisit, website]);

  // 处理跳转到详情页
  const handleCardClick = useCallback(() => {
    router.push(`/website/${website.id}`);
  }, [router, website.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden group website-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        className
      )} 
      style={style}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`查看 ${website.title} 详情`}
      aria-describedby={`website-${website.id}-description`}
    >
      {/* AD标记 - 右上角 */}
      {website.isAd && (
        <div 
          className="absolute top-3 right-3 z-10"
          role="img"
          aria-label="广告内容"
        >
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-md">
            AD
          </span>
        </div>
      )}

      <CardContent className="p-6">
        {/* 头部区域 - 图标和标题 */}
        <div className="flex items-center gap-4 mb-4">
          {/* 网站图标 - 使用LazyImage组件 */}
          <div 
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white",
              getIconColor(website.title)
            )}
            role="img"
            aria-label={`${website.title} 网站图标`}
          >
            {website.favicon_url ? (
              <LazyImage
                src={website.favicon_url}
                alt={`${website.title} icon`}
                className="w-8 h-8 rounded"
                containerClassName="w-8 h-8"
                rootMargin="0px 0px 100px 0px"
                fallback={<Globe className="w-6 h-6" aria-hidden="true" />}
                placeholder={
                  <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                }
              />
            ) : (
              <Globe className="w-6 h-6" aria-hidden="true" />
            )}
          </div>

          {/* 标题和描述 */}
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-lg text-foreground mb-2 line-clamp-2"
              role="heading"
              aria-level={3}
            >
              {website.title}
            </h3>
            {website.description && (
              <p 
                id={`website-${website.id}-description`}
                className="text-sm text-muted-foreground line-clamp-3"
                role="text"
              >
                {website.description}
              </p>
            )}
          </div>
        </div>

        {/* 标签区域 */}
        {website.tags && website.tags.length > 0 && (
          <div 
            className="flex flex-wrap gap-2 mb-4"
            role="group"
            aria-label={`网站标签，共 ${website.tags.length} 个`}
          >
            {website.tags.slice(0, 3).map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                onClick={(clickedTag) => {
                  // 阻止事件冒泡，避免触发卡片点击
                  if (onTagClick) {
                    onTagClick(clickedTag);
                  }
                }}
                size="md"
                aria-label={`按标签 ${tag} 筛选`}
              />
            ))}
            {website.tags.length > 3 && (
              <TagPill
                tag={`+${website.tags.length - 3}`}
                variant="gray"
                size="md"
                aria-label={`还有 ${website.tags.length - 3} 个标签`}
              />
            )}
          </div>
        )}

        {/* 底部统计和访问按钮 */}
        <div 
          className="flex items-center justify-between pt-4 border-t border-border"
          role="group"
          aria-label="网站统计信息和操作"
        >
          {/* 访问统计 */}
          <div 
            className="text-sm text-muted-foreground"
            role="status"
            aria-label={`访问次数: ${(website.visit_count || 0).toLocaleString()} 次`}
          >
            {(website.visit_count || 0).toLocaleString()} 次访问
          </div>

          {/* 访问网站按钮 - 使用次要强调色 */}
          <Button 
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              handleVisit();
            }}
            className={cn(
              "text-sm bg-secondary hover:bg-secondary/90 text-secondary-foreground btn-secondary-animated",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={`访问 ${website.title} 网站`}
            tabIndex={-1} // 使用-1以避免重复tab焦点，卡片本身已经可以操作
          >
            访问网站
            <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export { WebsiteCard };
export default WebsiteCard;