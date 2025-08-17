import React from 'react';
import { BlogLoadingSpinner } from '@/features/blog/components/BlogLoadingStates';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  User,
  Clock,
  FileText,
  Tag
} from 'lucide-react';

/**
 * 博客详情页面加载组件
 * 
 * 为博客详情页面提供专门的加载状态，匹配详情页面的完整布局结构
 * 包括面包屑导航、文章标题、内容区域、右侧信息栏等所有元素的骨架屏
 * 
 * 特性:
 * - 复用现有BlogLoadingStates组件的动画和样式
 * - 匹配博客详情页面的完整布局结构
 * - 响应式设计，适配移动设备和桌面设备
 * - 优化用户等待体验，提供视觉层次感
 * - 包含面包屑、标题、作者信息、正文内容、侧边栏等所有区域
 * 
 * 需求满足:
 * - 任务5: 创建博客详情页面加载状态
 * - 1.1: 根据设计图实现博客文章详情页面UI的加载状态
 * - 复用现有加载动画样式和组件设计模式
 */
export default function BlogDetailPageLoading() {
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 主文章内容区域 - 占据大部分空间 */}
            <div className="lg:col-span-3 space-y-8">
              {/* 面包屑导航骨架 */}
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-4 w-12 bg-muted skeleton rounded-md"></div>
                <ArrowLeft className="h-3 w-3 text-muted-foreground/50 rotate-180" />
                <div className="h-4 w-16 bg-muted skeleton rounded-md"></div>
                <ArrowLeft className="h-3 w-3 text-muted-foreground/50 rotate-180" />
                <div className="h-4 w-20 bg-muted skeleton rounded-md"></div>
                <ArrowLeft className="h-3 w-3 text-muted-foreground/50 rotate-180" />
                <div className="h-4 w-32 bg-muted skeleton rounded-md"></div>
              </div>

              {/* 分类标签骨架 */}
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground/50" />
                <div className="h-6 w-20 bg-muted skeleton rounded-full"></div>
              </div>
              
              {/* 文章标题骨架 */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="h-10 bg-muted skeleton rounded-md w-full"></div>
                  <div className="h-10 bg-muted skeleton rounded-md w-4/5"></div>
                </div>
              </div>
              
              {/* 文章元信息骨架 */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                {/* 作者信息骨架 */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-4 w-20 bg-muted skeleton rounded-md"></div>
                </div>
                
                {/* 发布日期骨架 */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-4 w-24 bg-muted skeleton rounded-md"></div>
                </div>
                
                {/* 阅读时间骨架 */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-4 w-16 bg-muted skeleton rounded-md"></div>
                </div>
              </div>
              
              {/* 封面图片骨架 */}
              <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-muted skeleton">
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30" />
                </div>
              </div>
              
              {/* 文章内容骨架 */}
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="space-y-6">
                  {/* 第一段落 */}
                  <div className="space-y-3">
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-5/6"></div>
                  </div>
                  
                  {/* 第二段落 */}
                  <div className="space-y-3">
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-4/5"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-3/4"></div>
                  </div>
                  
                  {/* 小标题骨架 */}
                  <div className="h-6 bg-muted skeleton rounded-md w-2/3 mt-8"></div>
                  
                  {/* 第三段落 */}
                  <div className="space-y-3">
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-2/3"></div>
                  </div>
                  
                  {/* 列表项骨架 */}
                  <div className="space-y-2 ml-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 bg-muted skeleton rounded-full"></div>
                      <div className="h-4 bg-muted skeleton rounded-md w-3/4"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 bg-muted skeleton rounded-full"></div>
                      <div className="h-4 bg-muted skeleton rounded-md w-4/5"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 bg-muted skeleton rounded-full"></div>
                      <div className="h-4 bg-muted skeleton rounded-md w-2/3"></div>
                    </div>
                  </div>
                  
                  {/* 引用块骨架 */}
                  <div className="border-l-4 border-muted pl-4 space-y-2">
                    <div className="h-4 bg-muted skeleton rounded-md w-5/6"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-3/4"></div>
                  </div>
                  
                  {/* 更多段落 */}
                  <div className="space-y-3">
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-4/5"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧信息栏 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 作者信息卡片骨架 */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="h-5 w-16 bg-muted skeleton rounded-md"></div>
                
                {/* 作者头像和基本信息 */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-muted skeleton rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted skeleton rounded-md w-3/4"></div>
                    <div className="h-4 bg-muted skeleton rounded-md w-1/2"></div>
                  </div>
                </div>
                
                {/* 作者简介 */}
                <div className="space-y-2">
                  <div className="h-3 bg-muted skeleton rounded-md w-full"></div>
                  <div className="h-3 bg-muted skeleton rounded-md w-4/5"></div>
                </div>
                
                {/* 社交链接 */}
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted skeleton rounded-md"></div>
                  <div className="h-8 w-8 bg-muted skeleton rounded-md"></div>
                  <div className="h-8 w-8 bg-muted skeleton rounded-md"></div>
                </div>
              </div>

              {/* 文章标签骨架 */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="h-5 w-12 bg-muted skeleton rounded-md"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 bg-muted skeleton rounded-full"></div>
                  <div className="h-6 w-20 bg-muted skeleton rounded-full"></div>
                  <div className="h-6 w-14 bg-muted skeleton rounded-full"></div>
                  <div className="h-6 w-18 bg-muted skeleton rounded-full"></div>
                </div>
              </div>

              {/* 目录骨架 */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-5 w-12 bg-muted skeleton rounded-md"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted skeleton rounded-md w-5/6"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-3/4 ml-4"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-4/5 ml-4"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-2/3"></div>
                  <div className="h-4 bg-muted skeleton rounded-md w-3/4 ml-4"></div>
                </div>
              </div>

              {/* 相关文章骨架 */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="h-5 w-20 bg-muted skeleton rounded-md"></div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-16 h-12 bg-muted skeleton rounded-md flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted skeleton rounded-md w-full"></div>
                        <div className="h-3 bg-muted skeleton rounded-md w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
      
      {/* 固定在右下角的加载指示器 */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className={cn(
          "bg-background/90 backdrop-blur-sm rounded-lg p-4 border border-border shadow-lg",
          "blog-error-fade-in" // 复用现有的动画类
        )}>
          <BlogLoadingSpinner 
            size="md" 
            text="加载博客详情..." 
            className="text-primary"
          />
        </div>
      </div>
    </div>
  );
}