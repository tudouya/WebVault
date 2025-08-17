"use client";

/**
 * BlogDetailPage 组件
 * 
 * 博客详情页面的主容器组件，协调所有子组件和状态管理
 * 集成导航栏、面包屑、文章内容、作者信息、相关推荐和页脚
 * 提供完整的博客文章阅读体验，包括响应式布局和主题支持
 * 
 * 需求引用:
 * - 1.1: Feature Overview - 展示完整的博客文章内容，包括标题、内容、作者信息、分类标签
 * - 1.3: 导航和上下文 - 面包屑导航显示文章层级关系，显示文章所属分类和标签信息
 * - 7.1: 响应式设计 - 在不同设备上良好阅读，移动端单列，平板适当宽度，桌面端双列布局
 * 
 * 设计模式:
 * - 复用 BlogIndexPage 的页面结构模式和布局系统
 * - 集成现有的 HeaderNavigation 和 Footer 组件
 * - 基于 Feature First Architecture 实现模块化组件组织
 * - 支持面包屑导航和文章上下文信息
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight, Home, Calendar, Clock, Tag, User } from 'lucide-react';

// 导入已存在的通用组件
import { HeaderNavigation } from '@/features/websites/components/HeaderNavigation';
import { Footer } from '@/features/websites/components/Footer';

// 导入博客相关类型
import { BlogDetailData } from '../types';

// 导入样式文件以确保动画可用
import '../styles/animations.css';

/**
 * BlogDetailPage组件属性接口
 */
export interface BlogDetailPageProps {
  /**
   * 博客详情数据
   */
  initialData: BlogDetailData;
  
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
   * 是否显示面包屑导航
   * @default true
   */
  showBreadcrumb?: boolean;
  
  /**
   * 是否显示页脚区域
   * @default true
   */
  showFooter?: boolean;
}

/**
 * 面包屑导航组件
 */
interface BreadcrumbProps {
  category: string;
  title: string;
  className?: string;
}

const Breadcrumb = ({ category, title, className }: BreadcrumbProps) => (
  <nav 
    className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
    aria-label="面包屑导航"
  >
    <Link 
      href="/" 
      className="flex items-center hover:text-foreground transition-colors"
      aria-label="返回首页"
    >
      <Home className="h-4 w-4" />
      <span className="ml-1">Home</span>
    </Link>
    <ChevronRight className="h-4 w-4" />
    <Link 
      href="/blog" 
      className="hover:text-foreground transition-colors"
      aria-label="返回博客列表"
    >
      Blog
    </Link>
    <ChevronRight className="h-4 w-4" />
    <Link 
      href={`/blog?category=${encodeURIComponent(category)}`} 
      className="hover:text-foreground transition-colors"
      aria-label={`查看${category}分类文章`}
    >
      {category}
    </Link>
    <ChevronRight className="h-4 w-4" />
    <span className="text-foreground font-medium line-clamp-1" title={title}>
      {title}
    </span>
  </nav>
);

/**
 * 文章元信息组件
 */
interface ArticleMetaProps {
  author: BlogDetailData['author'];
  publishedAt: string;
  readingTime: number;
  category: string;
  tags: string[];
  className?: string;
}

const ArticleMeta = ({ 
  author, 
  publishedAt, 
  readingTime, 
  category, 
  tags, 
  className 
}: ArticleMetaProps) => {
  const formattedDate = new Date(publishedAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* 作者信息 */}
      <div className="flex items-center space-x-4">
        {author.avatar && (
          <div className="relative">
            <img
              src={author.avatar}
              alt={`${author.name}的头像`}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{author.name}</span>
          </div>
          {author.bio && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {author.bio}
            </p>
          )}
        </div>
      </div>

      {/* 文章元数据 */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{readingTime} 分钟阅读</span>
        </div>
        <div className="flex items-center space-x-1">
          <Tag className="h-4 w-4" />
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
            {category}
          </span>
        </div>
      </div>

      {/* 标签列表 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                         bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground
                         transition-colors duration-200"
              aria-label={`查看标签"${tag}"的相关文章`}
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 文章内容组件
 */
interface ArticleContentProps {
  title: string;
  content: string;
  contentType: 'markdown' | 'html';
  coverImage?: string;
  className?: string;
}

const ArticleContent = ({ 
  title, 
  content, 
  contentType, 
  coverImage, 
  className 
}: ArticleContentProps) => (
  <article className={cn("prose prose-lg max-w-none", className)}>
    {/* 文章标题 */}
    <header className="mb-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-0">
        {title}
      </h1>
    </header>

    {/* 封面图片 */}
    {coverImage && (
      <div className="mb-8 -mx-4 sm:mx-0">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={coverImage}
            alt={`${title} - 封面图片`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
    )}

    {/* 文章内容 */}
    <div 
      className="prose-content"
      dangerouslySetInnerHTML={{ 
        __html: contentType === 'html' ? content : content 
      }}
    />
  </article>
);

/**
 * BlogDetailPage 博客详情页面主容器组件
 * 
 * 提供完整的博客文章阅读体验，包括：
 * - 响应式布局设计（移动端单列，桌面端双列）
 * - 面包屑导航和文章上下文信息
 * - 文章内容展示和作者信息
 * - 集成导航栏和页脚组件
 * - 支持主题切换和动画效果
 * 
 * 基于现有 BlogIndexPage 的成熟模式，确保代码一致性和可维护性
 */
export function BlogDetailPage({
  initialData,
  className,
  isLoading = false,
  showNavigation = true,
  showBreadcrumb = true,
  showFooter = true,
}: BlogDetailPageProps) {
  
  // 滚动时的导航栏固定效果 - 复用 BlogIndexPage 模式
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
        // 基础页面布局 - 复用 BlogIndexPage 模式
        'min-h-screen bg-background',
        // 确保内容能够正确显示
        'flex flex-col',
        className
      )}
      role="main"
      aria-label="博客详情页面"
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
        <div className="relative">
          {/* 主内容容器 - 使用1200px最大宽度和响应式边距 */}
          <div 
            id="blog-detail-top"
            className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12"
          >
            
            {/* 面包屑导航区域 - Requirements 1.3: 导航和上下文 */}
            {showBreadcrumb && (
              <div className="pt-8 sm:pt-12 lg:pt-16 pb-6">
                <Breadcrumb
                  category={initialData.category}
                  title={initialData.title}
                  className={cn(
                    "blog-content-fade-in",
                    isLoading && "opacity-70"
                  )}
                />
              </div>
            )}

            {/* 文章内容区域 */}
            <div 
              className={cn(
                "mb-12 sm:mb-16 lg:mb-20",
                // 内容淡入动画
                "blog-content-fade-in",
                isLoading && "opacity-70"
              )}
              aria-label="文章内容区域"
            >
              
              {/* 桌面端双列布局，移动端单列布局 - Requirements 7.1: 响应式设计 */}
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                
                {/* 主要内容区域 */}
                <div className="lg:col-span-8">
                  <ArticleContent
                    title={initialData.title}
                    content={initialData.content}
                    contentType={initialData.contentType}
                    coverImage={initialData.coverImage}
                    className="mb-8"
                  />
                </div>

                {/* 右侧信息栏 - 桌面端显示，移动端隐藏在内容下方 */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
                  <div className="bg-card border rounded-lg p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      文章信息
                    </h2>
                    
                    <ArticleMeta
                      author={initialData.author}
                      publishedAt={initialData.publishedAt}
                      readingTime={initialData.readingTime}
                      category={initialData.category}
                      tags={initialData.tags}
                    />

                    {/* 统计信息 */}
                    {(initialData.viewCount || initialData.likeCount) && (
                      <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          文章统计
                        </h3>
                        <div className="space-y-2 text-sm">
                          {initialData.viewCount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">浏览量:</span>
                              <span className="font-medium">{initialData.viewCount.toLocaleString()}</span>
                            </div>
                          )}
                          {initialData.likeCount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">点赞数:</span>
                              <span className="font-medium">{initialData.likeCount.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
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
      
      {/* 全局加载状态覆盖层 - 复用 BlogIndexPage 模式 */}
      {isLoading && (
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
              <p className="text-sm text-muted-foreground animate-pulse">正在加载文章内容...</p>
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
 * BlogDetailPage组件默认导出
 * 提供向后兼容性
 */
export default BlogDetailPage;