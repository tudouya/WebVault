import React, { useState } from "react";
import {
  LoadingSpinner,
  WebsiteCardSkeleton,
  SearchLoadingIndicator,
  FilterLoadingIndicator,
  WebsiteGridLoadingOverlay,
  EmptyStateWithLoading,
} from "./LoadingStates";
import { Button } from "@/components/ui/button";

/**
 * LoadingStatesExample - LoadingStates组件使用示例
 * 
 * 展示各种加载状态组件的使用方法和效果
 * 仅用于开发期间的测试和演示
 * 
 * 特性演示:
 * - 基础加载旋转器的不同尺寸
 * - 网站卡片骨架屏的批量展示
 * - 搜索和筛选加载指示器
 * - 网站网格加载遮罩
 * - 空状态加载组件
 * 
 * @example
 * ```tsx
 * import { LoadingStatesExample } from '@/features/websites/components/LoadingStatesExample'
 * 
 * function TestPage() {
 *   return <LoadingStatesExample />
 * }
 * ```
 */
export function LoadingStatesExample() {
  const [searchLoading, setSearchLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [emptyLoading, setEmptyLoading] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Loading States Examples
        </h1>
        <p className="text-muted-foreground">
          LoadingStates组件的各种使用示例和效果演示
        </p>
      </div>

      {/* 基础加载旋转器示例 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          1. 基础加载旋转器 (LoadingSpinner)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Small Size</h3>
            <LoadingSpinner size="sm" text="Loading..." />
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Medium Size (默认)</h3>
            <LoadingSpinner size="md" text="Processing..." />
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Large Size</h3>
            <LoadingSpinner size="lg" text="Please wait..." />
          </div>
        </div>
      </section>

      {/* 网站卡片骨架屏示例 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          2. 网站卡片骨架屏 (WebsiteCardSkeleton)
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          模拟WebsiteCard的结构和布局，提供shimmer动画效果
        </p>
        
        {/* 单个骨架屏 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">单个卡片骨架屏</h3>
          <div className="max-w-md">
            <WebsiteCardSkeleton count={1} />
          </div>
        </div>

        {/* 网格骨架屏 */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">网格布局骨架屏 (3个卡片)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WebsiteCardSkeleton count={3} />
          </div>
        </div>
      </section>

      {/* 搜索加载指示器示例 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          3. 搜索加载指示器 (SearchLoadingIndicator)
        </h2>
        <div className="flex gap-4 items-center">
          <Button
            onClick={() => {
              setSearchLoading(true);
              setTimeout(() => setSearchLoading(false), 3000);
            }}
            disabled={searchLoading}
          >
            {searchLoading ? "搜索中..." : "触发搜索加载"}
          </Button>
          <SearchLoadingIndicator isLoading={searchLoading} />
        </div>
      </section>

      {/* 筛选加载指示器示例 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          4. 筛选加载指示器 (FilterLoadingIndicator)
        </h2>
        <div className="flex gap-4 items-center">
          <Button
            onClick={() => {
              setFilterLoading(true);
              setTimeout(() => setFilterLoading(false), 2500);
            }}
            disabled={filterLoading}
          >
            {filterLoading ? "筛选中..." : "触发筛选加载"}
          </Button>
        </div>
        <FilterLoadingIndicator 
          isLoading={filterLoading} 
          text="正在应用筛选条件..."
        />
      </section>

      {/* 网站网格加载遮罩示例 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          5. 网站网格加载遮罩 (WebsiteGridLoadingOverlay)
        </h2>
        <div className="flex gap-4 items-center mb-4">
          <Button
            onClick={() => {
              setGridLoading(true);
              setTimeout(() => setGridLoading(false), 3000);
            }}
            disabled={gridLoading}
          >
            {gridLoading ? "加载中..." : "触发网格加载"}
          </Button>
        </div>
        
        <div className="relative min-h-[300px] border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">模拟网站网格内容</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-md flex items-center justify-center">
                <span className="text-sm text-muted-foreground">网站卡片 {i + 1}</span>
              </div>
            ))}
          </div>
          
          {/* 加载遮罩 */}
          <WebsiteGridLoadingOverlay isLoading={gridLoading} />
        </div>
      </section>

      {/* 空状态加载组件示例 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          6. 空状态加载组件 (EmptyStateWithLoading)
        </h2>
        <div className="flex gap-4 items-center mb-4">
          <Button
            onClick={() => {
              setEmptyLoading(true);
              setTimeout(() => setEmptyLoading(false), 4000);
            }}
            disabled={emptyLoading}
          >
            {emptyLoading ? "加载中..." : "触发空状态加载"}
          </Button>
        </div>
        
        <div className="min-h-[300px] border border-border rounded-lg">
          <EmptyStateWithLoading 
            isLoading={emptyLoading}
            title="正在加载网站数据..."
            description="请稍等，我们正在获取最新的网站信息。"
          />
          {!emptyLoading && (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">没有加载状态时的正常内容</p>
            </div>
          )}
        </div>
      </section>

      {/* 使用说明 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          使用说明
        </h2>
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="font-medium text-foreground mb-2">导入方式:</h3>
          <pre className="text-sm text-muted-foreground mb-4">
{`import {
  LoadingSpinner,
  WebsiteCardSkeleton,
  SearchLoadingIndicator,
  FilterLoadingIndicator,
  WebsiteGridLoadingOverlay,
  EmptyStateWithLoading,
} from '@/features/websites/components/LoadingStates';`}
          </pre>
          
          <h3 className="font-medium text-foreground mb-2">主要特性:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>支持亮色和暗色主题适配</li>
            <li>响应式设计，移动设备优化</li>
            <li>遵循无障碍访问标准</li>
            <li>支持用户动画偏好设置</li>
            <li>使用Tailwind CSS和shadcn/ui设计系统</li>
            <li>硬件加速的流畅动画效果</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default LoadingStatesExample;