import React from 'react';
import { LoadingSpinner, WebsiteCardSkeleton, SearchLoadingIndicator } from '@/features/websites/components/LoadingStates';
import { cn } from '@/lib/utils';
import { Search, Filter, Globe } from 'lucide-react';

/**
 * 搜索页面加载组件
 * 
 * 为搜索页面提供专门的加载状态，复用现有LoadingStates组件的设计和动画
 * 根据搜索页面的布局结构提供对应的骨架屏效果
 * 
 * 特性:
 * - 复用现有loading动画和样式
 * - 与搜索页面布局一致的结构
 * - 响应式设计，适配移动设备
 * - 优化用户等待体验
 * - 包含导航栏、搜索区域、筛选器和结果区域的加载状态
 * 
 * 需求满足:
 * - 任务20: 创建搜索页面特定的加载状态组件
 * - 1.5: 响应式布局，适配小屏幕显示，包括加载状态
 */
export default function SearchPageLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 导航栏加载骨架 */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo区域骨架 */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted skeleton rounded-lg"></div>
              <div className="h-6 w-24 bg-muted skeleton rounded-md"></div>
            </div>
            
            {/* 导航菜单骨架 */}
            <div className="hidden md:flex items-center gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 bg-muted skeleton rounded-md w-16"
                ></div>
              ))}
            </div>
            
            {/* 右侧按钮区域骨架 */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-20 bg-muted skeleton rounded-md hidden sm:block"></div>
              <div className="h-8 w-8 bg-muted skeleton rounded-md md:hidden"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 搜索标题区域骨架 */}
      <div className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            {/* 主标题骨架 */}
            <div className="h-8 w-48 bg-muted skeleton rounded-md mx-auto"></div>
            {/* 副标题骨架 */}
            <div className="h-5 w-96 bg-muted skeleton rounded-md mx-auto max-w-full"></div>
          </div>
        </div>
      </div>
      
      {/* 搜索和筛选控制区域骨架 */}
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* 搜索框区域骨架 */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* 搜索输入框骨架 */}
              <div className="flex-1 relative">
                <div className="h-10 bg-muted skeleton rounded-md w-full"></div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
              
              {/* 搜索按钮骨架 */}
              <div className="h-10 w-24 bg-muted skeleton rounded-md"></div>
            </div>
            
            {/* 筛选器区域骨架 */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">筛选:</span>
              </div>
              
              {/* 筛选选项骨架 */}
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-8 bg-muted skeleton rounded-md"
                  style={{ width: `${80 + (index * 20)}px` }}
                ></div>
              ))}
              
              {/* 重置按钮骨架 */}
              <div className="h-8 w-16 bg-muted skeleton rounded-md ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 主内容区域 */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 搜索状态指示器 */}
          <div className="mb-6 flex items-center justify-center">
            <SearchLoadingIndicator 
              isLoading={true}
              className="bg-background border-border shadow-sm"
            />
          </div>
          
          {/* 结果统计骨架 */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-5 w-32 bg-muted skeleton rounded-md"></div>
            <div className="h-5 w-24 bg-muted skeleton rounded-md"></div>
          </div>
          
          {/* 网站卡片网格骨架 */}
          <div className={cn(
            // 响应式网格布局 - 与SearchResults保持一致
            "grid gap-6",
            "grid-cols-1", // 移动设备: 1列
            "sm:grid-cols-1", // 小屏幕: 1列  
            "md:grid-cols-2", // 中等屏幕: 2列
            "lg:grid-cols-2", // 大屏幕: 2列
            "xl:grid-cols-3", // 超大屏幕: 3列
            "2xl:grid-cols-3" // 超超大屏幕: 3列
          )}>
            <WebsiteCardSkeleton count={9} />
          </div>
          
          {/* 分页区域骨架 */}
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-2">
              {/* 上一页按钮骨架 */}
              <div className="h-9 w-20 bg-muted skeleton rounded-md"></div>
              
              {/* 页码按钮骨架 */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-9 w-9 bg-muted skeleton rounded-md"
                ></div>
              ))}
              
              {/* 下一页按钮骨架 */}
              <div className="h-9 w-20 bg-muted skeleton rounded-md"></div>
            </div>
          </div>
        </div>
      </main>
      
      {/* 页脚加载骨架 */}
      <footer className="bg-muted/30 border-t border-border mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* 页脚列骨架 */}
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <div key={colIndex} className="space-y-4">
                <div className="h-5 w-20 bg-muted skeleton rounded-md"></div>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, linkIndex) => (
                    <div
                      key={linkIndex}
                      className="h-4 bg-muted skeleton rounded-md"
                      style={{ width: `${60 + (linkIndex * 15)}px` }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* 页脚底部骨架 */}
          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="h-4 w-48 bg-muted skeleton rounded-md"></div>
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-6 w-6 bg-muted skeleton rounded-md"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </footer>
      
      {/* 全页面加载指示器 */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4 border border-border shadow-lg">
          <LoadingSpinner size="md" text="加载搜索页面..." />
        </div>
      </div>
    </div>
  );
}