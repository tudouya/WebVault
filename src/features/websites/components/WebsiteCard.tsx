import React from "react";
import { ExternalLink, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WebsiteCardData } from "../types/website";
import { TagPill } from "./TagPill";

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

export function WebsiteCard({ website, className, style, onVisit, onTagClick }: WebsiteCardProps) {
  const handleVisit = () => {
    onVisit?.(website);
    // 在新窗口打开网站
    window.open(website.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={cn("relative overflow-hidden group website-card", className)} style={style}>
      {/* AD标记 - 右上角 */}
      {website.isAd && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-md">
            AD
          </span>
        </div>
      )}

      <CardContent className="p-6">
        {/* 头部区域 - 图标和标题 */}
        <div className="flex items-center gap-4 mb-4">
          {/* 网站图标 */}
          <div 
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white",
              getIconColor(website.title)
            )}
          >
            {website.favicon_url ? (
              <img 
                src={website.favicon_url} 
                alt={`${website.title} icon`}
                className="w-8 h-8 rounded"
                onError={(e) => {
                  // 如果图标加载失败，显示默认图标
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <Globe className="w-6 h-6" />
            )}
            {website.favicon_url && (
              <Globe className="w-6 h-6 hidden" />
            )}
          </div>

          {/* 标题和描述 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
              {website.title}
            </h3>
            {website.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {website.description}
              </p>
            )}
          </div>
        </div>

        {/* 标签区域 */}
        {website.tags && website.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {website.tags.slice(0, 3).map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                onClick={onTagClick}
                size="md"
              />
            ))}
            {website.tags.length > 3 && (
              <TagPill
                tag={`+${website.tags.length - 3}`}
                variant="gray"
                size="md"
              />
            )}
          </div>
        )}

        {/* 底部统计和访问按钮 */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {/* 访问统计 */}
          <div className="text-sm text-muted-foreground">
            {website.visitCount.toLocaleString()} visits
          </div>

          {/* 访问网站按钮 - 使用次要强调色 */}
          <Button 
            variant="secondary"
            size="sm"
            onClick={handleVisit}
            className="text-sm bg-secondary hover:bg-secondary/90 text-secondary-foreground btn-secondary-animated"
          >
            Visit Website
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default WebsiteCard;