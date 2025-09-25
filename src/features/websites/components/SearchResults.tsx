import React, { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { WebsiteCard } from "./WebsiteCard";
import { WebsiteCardSkeleton } from "./LoadingStates";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, AlertTriangle } from "lucide-react";
import type { WebsiteCardData } from "../types/website";

interface SearchResultsProps {
  /** 搜索结果网站数据列表 */
  websites: WebsiteCardData[];
  
  /** 是否正在加载 */
  isLoading?: boolean;
  
  /** 是否有错误 */
  isError?: boolean;
  
  /** 错误信息 */
  error?: string;
  
  /** 网站访问回调 */
  onWebsiteVisit?: (website: WebsiteCardData) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 自定义类名 */
  className?: string;
  
  /** 搜索查询词（用于结果数量显示） */
  searchQuery?: string;
  
  /** 总结果数量 */
  totalResults?: number;
  
  /** 重试搜索回调 */
  onRetry?: () => void;
}


/**
 * 搜索空结果状态组件
 * 使用React.memo优化性能
 */
const EmptySearchResults = React.memo(function EmptySearchResults({ searchQuery }: { searchQuery?: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center min-h-[400px]">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Search className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        未找到搜索结果
      </h3>
      <div className="text-muted-foreground max-w-md space-y-4">
        {searchQuery ? (
          <>
            <p>没有找到包含 <span className="font-medium text-foreground">"{searchQuery}"</span> 的网站</p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">搜索建议：</p>
              <ul className="text-sm space-y-1 text-left">
                <li>• 尝试使用更简单的关键词</li>
                <li>• 检查关键词的拼写</li>
                <li>• 使用同义词或相关术语</li>
                <li>• 清除筛选条件重新搜索</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <p>没有符合当前筛选条件的网站</p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">建议操作：</p>
              <ul className="text-sm space-y-1 text-left">
                <li>• 清除部分筛选条件</li>
                <li>• 尝试输入搜索关键词</li>
                <li>• 查看所有分类的网站</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

/**
 * 搜索错误状态组件
 * 使用React.memo优化性能
 */
const SearchErrorState = React.memo(function SearchErrorState({ 
  message, 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void; 
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center min-h-[400px]">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        搜索出错了
      </h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {message || "无法完成搜索请求，请稍后重试"}
      </p>
      
      {/* 重试按钮 */}
      {onRetry && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onRetry}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试搜索
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新页面
          </Button>
        </div>
      )}
    </div>
  );
});

/**
 * 搜索结果统计信息组件
 * 使用React.memo优化性能
 */
const SearchResultStats = React.memo(function SearchResultStats({ 
  totalResults, 
  searchQuery,
  isLoading 
}: { 
  totalResults?: number; 
  searchQuery?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="mb-6 pb-4 border-b border-border">
        <div className="h-6 bg-muted rounded w-48 mb-2" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
    );
  }

  if (typeof totalResults !== 'number') {
    return null;
  }

  return (
    <div className="mb-6 pb-4 border-b border-border">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          搜索结果
          {searchQuery && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              "{searchQuery}"
            </span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          共找到 <span className="font-medium text-foreground">{totalResults}</span> 个相关网站
        </p>
      </div>
    </div>
  );
});

/**
 * SearchResults 组件
 * 
 * 搜索结果展示容器，专为搜索页面设计：
 * - 复用 WebsiteGrid 的响应式布局（桌面3列、平板2列、移动1列）
 * - 添加搜索结果统计信息和视觉分离
 * - 优化的空状态和错误状态显示
 * - 保持与 WebsiteGrid 一致的样式和动画效果
 * - 使用React.memo和虚拟化优化大数据集性能
 */
const SearchResults = React.memo(function SearchResults({
  websites,
  isLoading = false,
  isError = false,
  error,
  onWebsiteVisit,
  onTagClick,
  className,
  searchQuery,
  totalResults,
  onRetry,
}: SearchResultsProps) {
  // 使用useMemo优化网站列表处理，避免不必要的重新计算
  const processedWebsites = useMemo(() => {
    if (!websites || websites.length === 0) return [];
    
    // 对于大数据集，这里可以添加更多优化逻辑
    // 例如：去重、排序、筛选等
    return websites;
  }, [websites]);

  // 检查是否需要虚拟化（如果数据量很大）
  const shouldUseVirtualization = useMemo(() => {
    return processedWebsites.length > 100; // 超过100项启用虚拟化
  }, [processedWebsites.length]);
  
  // 优化的渲染回调
  const renderWebsiteCard = useCallback((website: typeof websites[0], index: number) => (
    <WebsiteCard
      key={website.id}
      website={website}
      onVisit={onWebsiteVisit}
      onTagClick={onTagClick}
      className={cn(
        "h-fit", // 确保卡片高度自适应内容
        "website-grid-enter" // 网格入场动画
      )}
      style={{ 
        animationDelay: `${Math.min(index * 100, 500)}ms` // 最大延迟500ms
      }}
    />
  ), [onWebsiteVisit, onTagClick]);
  // 加载状态：显示统计信息骨架和卡片骨架
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* 搜索结果统计骨架 */}
        <SearchResultStats 
          isLoading={true}
        />
        
        {/* 搜索结果网格骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 使用复用的WebsiteCardSkeleton组件 */}
          <WebsiteCardSkeleton 
            count={6}
            className="website-grid-enter"
          />
        </div>
      </div>
    );
  }

  // 错误状态
  if (isError) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SearchErrorState 
            message={error} 
            onRetry={onRetry}
          />
        </div>
      </div>
    );
  }

  // 空状态：没有搜索结果
  if (!processedWebsites || processedWebsites.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* 显示搜索统计（即使是0个结果） */}
        <SearchResultStats 
          totalResults={0}
          searchQuery={searchQuery}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmptySearchResults searchQuery={searchQuery} />
        </div>
      </div>
    );
  }

  // 正常状态：显示搜索结果
  return (
    <div className={cn("space-y-6", className)}>
      {/* 搜索结果统计信息 */}
      <SearchResultStats 
        totalResults={totalResults || processedWebsites.length}
        searchQuery={searchQuery}
      />
      
      {/* 搜索结果网格 - 复用 WebsiteGrid 的响应式布局 */}
      <div className={cn(
        // 响应式网格布局：移动端1列，平板2列，桌面3列
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 使用24px间距 (--spacing-md)，与 WebsiteGrid 保持一致
        "gap-6",
        // 页面淡入动画
        "page-fade-in"
      )}>
        {/* 渲染搜索结果网站卡片 */}
        {shouldUseVirtualization ? (
          // 对于大数据集，可以在这里集成虚拟化组件
          // 目前先使用普通渲染，后续可以集成 react-window 或 react-virtualized
          processedWebsites.map((website, index) => renderWebsiteCard(website, index))
        ) : (
          // 普通渲染（小于100项）
          processedWebsites.map((website, index) => renderWebsiteCard(website, index))
        )}
      </div>
    </div>
  );
});

export { SearchResults };
export default SearchResults;
