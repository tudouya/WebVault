import React, { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CollectionCardData } from "../types/collection";

interface CollectionCardProps {
  collection: CollectionCardData;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (collection: CollectionCardData) => void;
  onTagClick?: (tag: string) => void;
}

/**
 * CollectionCard组件
 * 
 * 展示集合信息的核心UI组件，包含彩色图标、标题、描述
 * 支持点击事件和键盘导航，遵循无障碍访问标准
 * 
 * 功能特性:
 * - 彩色圆角图标展示（64px）
 * - 20px semibold标题字体
 * - 14px regular描述字体，最多3行
 * - 悬停时阴影加深和2px向上位移
 * - 支持Tab键切换和Enter键激活
 * - 点击导航到集合详情页面
 */
const CollectionCard = React.memo(function CollectionCard({ 
  collection, 
  className, 
  style, 
  onClick,
  onTagClick
}: CollectionCardProps) {
  const handleClick = useCallback(() => {
    onClick?.(collection);
  }, [onClick, collection]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleTagClick = useCallback((event: React.MouseEvent, tag: string) => {
    event.stopPropagation();
    onTagClick?.(tag);
  }, [onTagClick]);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden group collection-card",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "bg-white rounded-2xl border shadow-sm",
        className
      )} 
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View collection: ${collection.title}`}
    >
      <CardContent className="p-4">
        {/* 头部区域 - 图标和内容 */}
        <div className="flex items-start gap-4">
          {/* 集合图标 - 64px彩色圆角 */}
          <div 
            className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-medium shadow-sm"
            style={{
              backgroundColor: collection.icon.backgroundColor,
              color: collection.icon.textColor,
            }}
            aria-hidden="true"
          >
            {collection.icon.character}
          </div>

          {/* 标题、描述和统计 */}
          <div className="flex-1 min-w-0">
            {/* 集合标题 - 20px semibold */}
            <h3 className="font-semibold text-xl text-foreground mb-2 line-clamp-2 leading-tight">
              {collection.title}
            </h3>
            
            {/* 集合描述 - 14px regular, 最多3行 */}
            {collection.description && (
              <p 
                className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed"
                title={collection.description}
              >
                {collection.description}
              </p>
            )}

            {/* 底部统计信息 */}
            <div className="flex items-center justify-between">
              {/* 网站计数 */}
              <div className="text-sm text-muted-foreground">
                {collection.websiteCount} {collection.websiteCount === 1 ? 'website' : 'websites'}
              </div>

              {/* 标签显示（如果有的话） */}
              {collection.tags && collection.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {collection.tags.slice(0, 2).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:scale-95 touch-manipulation min-h-[28px]"
                      onClick={(e) => handleTagClick(e, tag)}
                      title={`Filter by tag: ${tag}`}
                      aria-label={`筛选标签：${tag}`}
                    >
                      {tag}
                    </button>
                  ))}
                  {collection.tags.length > 2 && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-md min-h-[28px]">
                      +{collection.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export { CollectionCard };
export default CollectionCard;