"use client";

/**
 * BlogIndexPage 组件
 * 
 * 博客索引页面的主要组件，集成导航栏、标题区域、分类筛选、博客展示和页脚
 * 提供完整的博客浏览体验，包括品牌展示、文章展示、分页导航和Newsletter订阅
 * 
 * 需求引用:
 * - 1.1-1.5: 页面导航和品牌一致性 - HeaderNavigation组件集成
 * - 2.1-2.5: 分类筛选系统 - CategoryFilter组件集成
 * - 3.1-3.7: 分页导航系统 - Pagination组件集成
 * - 6.1-6.5: Newsletter订阅功能 - NewsletterSection组件集成
 * 
 * 设计模式:
 * - 复用CollectionIndexPage的页面结构模式和布局系统
 * - 集成现有的HeaderNavigation、Footer和NewsletterSection组件
 * - 基于Feature First Architecture实现模块化组件组织
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// 导入已存在的通用组件
import { HeaderNavigation } from '@/features/websites/components/HeaderNavigation';
import { Footer } from '@/features/websites/components/Footer';
import { NewsletterSection } from '@/features/websites/components/NewsletterSection';
import { Pagination } from '@/features/browsable-pages/components/Pagination';

// 导入博客专用组件
import { BlogGrid } from './BlogGrid';
import { CategoryFilter } from './CategoryFilter';

// 导入博客页面状态管理
import { 
  useBlogData, 
  useBlogPagination, 
  useBlogCategories,
  useBlogUrlSync 
} from '../stores/blog-store';

/**
 * BlogIndexPage组件属性接口
 */
export interface BlogIndexPageProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 页面加载状态
   */
  isLoading?: boolean;
  
  /**
   * 是否显示导航栏
   * @default true
   */
  showNavigation?: boolean;
  
  /**
   * 是否显示博客内容区域
   * @default true
   */
  showContentSection?: boolean;
  
  /**
   * 是否显示Newsletter区域
   * @default true
   */
  showNewsletterSection?: boolean;
  
  /**
   * 是否显示页脚区域
   * @default true
   */
  showFooter?: boolean;
}

/**
 * BlogIndexPage 博客索引页面组件
 * 
 * 集成完整的博客页面功能：导航栏、标题区域、分类筛选、博客展示、分页导航、Newsletter订阅和页脚
 * 实现响应式布局，支持状态管理、平滑动画和固定导航栏
 * 提供现代化的用户体验，包含交互动画、加载效果和响应式设计
 * 
 * 基于CollectionIndexPage的成熟模式，确保代码一致性和可维护性
 */
export function BlogIndexPage({
  className,
  isLoading = false,
  showNavigation = true,
  showContentSection = true,
  showNewsletterSection = true,
  showFooter = true,
}: BlogIndexPageProps) {
  
  // 博客数据状态管理
  const { 
    blogs,
    loading: dataLoading,
    error: dataError,
    isInitialized,
    fetchBlogs
  } = useBlogData();
  
  // 博客分页状态管理
  const blogPagination = useBlogPagination();
  
  // 博客分类筛选状态管理
  const { activeCategory, setActiveCategory } = useBlogCategories();
  
  // URL状态同步
  const { syncStoreFromUrl, syncUrlFromStore } = useBlogUrlSync();
  
  // 合并loading状态
  const combinedLoading = isLoading || dataLoading;
  
  // 首次加载时初始化数据
  React.useEffect(() => {
    if (!isInitialized) {
      // 先从URL同步状态
      syncStoreFromUrl();
      // 然后加载数据
      fetchBlogs();
    }
  }, [isInitialized, syncStoreFromUrl, fetchBlogs]); // 添加依赖避免stale closure
  
  // 当分类或分页状态变化时，同步到URL（但避免初始加载时执行）
  React.useEffect(() => {
    if (isInitialized) {
      // 使用setTimeout避免在渲染过程中更新URL
      const timeoutId = setTimeout(() => {
        syncUrlFromStore();
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeCategory, blogPagination.currentPage, isInitialized, syncUrlFromStore]);
  
  // 处理分类筛选变化
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category as any);
  };
  
  // 处理分页变化
  const handlePageChange = (page: number) => {
    blogPagination.setPage(page);
  };
  
  // 处理文章卡片点击 - 导航到文章详情页面
  const handleBlogClick = (blog: any) => {
    try {
      // 构建文章详情页面的URL
      const detailUrl = `/blog/${blog.slug || blog.id}`;
      
      // 开发环境调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log('Navigating to blog detail:', {
          title: blog.title,
          slug: blog.slug,
          id: blog.id,
          url: detailUrl
        });
      }
      
      // 导航到文章详情页面
      window.location.href = detailUrl;
    } catch (error) {
      console.error('Failed to navigate to blog detail:', error);
      // 如果导航失败，可以显示错误提示
      // 这里暂时只记录错误，不中断用户体验
    }
  };
  
  // 滚动时的导航栏固定效果 - 复用CollectionIndexPage模式
  const [isScrolled, setIsScrolled] = React.useState(false);
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const threshold = 100; // 100px后显示阴影效果
      setIsScrolled(scrollTop > threshold);
    };

    // 添加节流处理
    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16); // ~60fps
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div 
      className={cn(
        // 基础页面布局 - 复用CollectionIndexPage模式
        'min-h-screen bg-background',
        // 确保内容能够正确显示
        'flex flex-col',
        className
      )}
      role="main"
      aria-label="博客索引页面"
    >
      {/* 导航栏区域 - 固定定位和平滑过渡 */}
      {showNavigation && (
        <div className={cn(
          "navbar-fixed",
          isScrolled && "navbar-scrolled"
        )}>
          <HeaderNavigation />
        </div>
      )}
      
      {/* 主要内容区域 */}
      <main className="flex-1">
        {/* 博客内容展示区域 - 支持fade-in动画 */}
        {showContentSection && (
          <div className="relative">
            {/* 主内容容器 - 使用1200px最大宽度和响应式边距，符合Requirements 12.3-12.5 */}
            <div 
              id="blog-content-top"
              className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-12"
            >
              
              {/* 页面标题区域 - Requirements 12.3: 上方80px间距，下方32px间距，响应式调整 */}
              <div className="pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-7 lg:pb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Read our latest blog posts
                </h1>
                <p className="mt-4 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                  Discover insights, tutorials, and updates from our team
                </p>
              </div>

              {/* 分类筛选区域 - Requirements 12.4: 标题下方24px间距，与网格间距48px，响应式调整 */}
              <div className="pt-4 sm:pt-5 lg:pt-6 pb-8 sm:pb-10 lg:pb-12 flex justify-center">
                <CategoryFilter
                  activeCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                  className="w-full max-w-4xl"
                />
              </div>

              {/* 博客文章展示区域 - Requirements 13.2 fade-in动画支持 */}
              <div 
                className={cn(
                  "mb-12 sm:mb-16 lg:mb-20 relative", // Requirements 12.5: Newsletter区域间距，响应式调整
                  // 分类切换时的fade-in动画 - 300ms持续时间
                  "blog-content-fade-in",
                  combinedLoading && "opacity-70"
                )} 
                aria-label="博客文章展示区域"
                key={`blog-content-${activeCategory}`} // 强制重新挂载触发动画
              >
                <BlogGrid
                  blogs={blogs}
                  loading={combinedLoading && !isInitialized}
                  error={dataError || undefined}
                  onBlogClick={handleBlogClick}
                  className={cn(
                    // 页面内容切换动画 - 使用CSS动画类
                    'blog-content-fade-in',
                  )}
                />
              </div>

              {/* 分页导航区域 - 保持与上方博客网格的一致间距 */}
              {!combinedLoading && blogs && blogs.length > 0 && blogPagination.totalPages > 1 && (
                <div 
                  className={cn(
                    "mt-8 mb-12 sm:mb-16 lg:mb-20 transition-all duration-300 ease-in-out", // Requirements 12.5: Newsletter区域间距，响应式调整
                    "animate-in fade-in-50 slide-in-from-bottom-4"
                  )} 
                  aria-label="分页导航区域"
                >
                  <Pagination
                    currentPage={blogPagination.currentPage}
                    totalPages={blogPagination.totalPages}
                    totalItems={blogPagination.totalItems}
                    itemsPerPage={blogPagination.itemsPerPage}
                    onPageChange={handlePageChange}
                    showPageNumbers={5}
                    scrollToTop={true}
                    scrollTarget="#blog-content-top"
                    className={cn(
                      "border-t border-border pt-8",
                      "transition-all duration-200 ease-in-out"
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Newsletter订阅区域 */}
      {showNewsletterSection && (
        <div 
          className="transition-all duration-300 ease-in-out"
          style={{
            opacity: isLoading ? 0.7 : 1,
            transform: isLoading ? 'translateY(10px)' : 'translateY(0px)'
          }}
        >
          <NewsletterSection 
            className="transition-all duration-500 ease-in-out"
          />
        </div>
      )}
      
      {/* 页脚区域 - 支持平滑动画过渡 */}
      {showFooter && (
        <div 
          className="transition-all duration-300 ease-in-out"
          style={{
            opacity: isLoading ? 0.7 : 1,
            transform: isLoading ? 'translateY(10px)' : 'translateY(0px)'
          }}
        >
          <Footer 
            className="transition-all duration-500 ease-in-out"
          />
        </div>
      )}
      
      {/* 全局加载状态覆盖层 - 复用CollectionIndexPage模式 */}
      {combinedLoading && !isInitialized && (
        <div 
          className={cn(
            "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
            "flex items-center justify-center",
            "transition-all duration-300 ease-in-out",
            "animate-in fade-in-0"
          )}
          role="status"
          aria-live="polite"
          aria-label="页面加载中"
        >
          <div className="flex flex-col items-center space-y-4 animate-in slide-in-from-bottom-4">
            {/* 增强的加载动画 - 使用脉冲效果 */}
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full border border-primary/20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground animate-pulse">正在加载博客文章...</p>
              <div className="flex space-x-1 justify-center">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * BlogIndexPage组件默认导出
 * 提供向后兼容性
 */
export default BlogIndexPage;