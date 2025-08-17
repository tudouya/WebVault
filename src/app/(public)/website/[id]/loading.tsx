import React from 'react';
import { LoadingSpinner } from '@/features/websites/components/LoadingStates';
import { cn } from '@/lib/utils';
import { 
  Globe, 
  ExternalLink, 
  Tag,
  Calendar,
  TrendingUp,
  Share2,
  ChevronRight
} from 'lucide-react';

/**
 * 网站详情页面加载组件
 * 
 * 为网站详情页面提供专门的加载状态，匹配详情页面的完整布局结构
 * 包括面包屑导航、网站头部信息、内容区域、统计数据等所有元素的骨架屏
 * 
 * 特性:
 * - 复用现有LoadingStates组件的动画和样式
 * - 匹配网站详情页面的完整布局结构 (AC-2.1.1)
 * - 响应式设计，适配移动设备和桌面设备
 * - 优化用户等待体验，提供视觉层次感 (NFR-3.1.1)
 * - 包含面包屑、标题、描述、预览图、统计数据、操作按钮等所有区域
 * 
 * 需求满足:
 * - Task 2.2: 创建网站详情页面加载状态
 * - NFR-3.1.1: 页面加载时间优化 - 骨架屏提升感知性能
 * - 复用现有加载动画样式和组件设计模式
 */
export default function WebsiteDetailPageLoading() {
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

      {/* 主内容区域 */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* 面包屑导航骨架 */}
            <nav className="flex items-center space-x-2 text-sm mb-6">
              <div className="h-4 w-12 bg-muted skeleton rounded-md"></div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <div className="h-4 w-16 bg-muted skeleton rounded-md"></div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <div className="h-4 w-32 bg-muted skeleton rounded-md"></div>
            </nav>

            {/* 网站头部信息区域骨架 */}
            <header className="space-y-4">
              <div className="flex items-start gap-4">
                {/* 网站图标骨架 */}
                <div className="w-12 h-12 bg-muted skeleton rounded-lg border flex-shrink-0 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  {/* 网站标题骨架 */}
                  <div className="space-y-2">
                    <div className="h-8 bg-muted skeleton rounded-md w-3/4"></div>
                  </div>
                  
                  {/* 网站URL骨架 */}
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                    <div className="h-4 bg-muted skeleton rounded-md w-64"></div>
                  </div>
                </div>
              </div>

              {/* 分类和标签骨架 */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-6 w-20 bg-muted skeleton rounded-full"></div>
                </div>
                
                {/* 标签骨架 */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-6 bg-muted skeleton rounded"
                    style={{ width: `${50 + (index * 15)}px` }}
                  ></div>
                ))}
              </div>
            </header>

            {/* 网站描述内容骨架 */}
            <section className="space-y-4">
              <div className="h-6 bg-muted skeleton rounded-md w-32"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                <div className="h-4 bg-muted skeleton rounded-md w-4/5"></div>
                <div className="h-4 bg-muted skeleton rounded-md w-3/4"></div>
              </div>
            </section>

            {/* 网站预览截图骨架 */}
            <section className="space-y-4">
              <div className="h-6 bg-muted skeleton rounded-md w-24"></div>
              <div className="w-full aspect-[16/9] bg-muted skeleton rounded-lg border shadow-lg relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-muted-foreground/30" />
                </div>
              </div>
            </section>

            {/* 访问统计信息骨架 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
                <div className="h-6 bg-muted skeleton rounded-md w-24"></div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="text-center p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="h-8 bg-muted skeleton rounded-md w-16 mx-auto"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-12 mx-auto"></div>
                  </div>
                ))}
              </div>
            </section>

            {/* 操作按钮区域骨架 */}
            <section className="pt-8 border-t">
              <div className="flex flex-wrap gap-4">
                {/* 访问网站按钮骨架 */}
                <div className="flex items-center gap-2">
                  <div className="h-12 w-32 bg-muted skeleton rounded-lg"></div>
                </div>
                
                {/* 分享按钮骨架 */}
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-12 w-24 bg-muted skeleton rounded-lg"></div>
                </div>
              </div>
            </section>

            {/* 相关信息区域骨架 */}
            <section className="space-y-4">
              <div className="h-6 bg-muted skeleton rounded-md w-32"></div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-4 bg-muted skeleton rounded-md w-40"></div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-4 bg-muted skeleton rounded-md w-36"></div>
                </div>
              </div>
            </section>
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
      
      {/* 固定在右下角的加载指示器 */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className={cn(
          "bg-background/90 backdrop-blur-sm rounded-lg p-4 border border-border shadow-lg",
          "website-detail-loading-fade-in" // 复用现有的动画类
        )}>
          <LoadingSpinner 
            size="md" 
            text="加载网站详情..." 
            className="text-primary"
          />
        </div>
      </div>
    </div>
  );
}