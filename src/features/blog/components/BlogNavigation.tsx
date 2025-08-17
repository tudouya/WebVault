/**
 * BlogNavigation导航组件
 * 
 * 为博客详情页面提供面包屑导航和返回按钮功能
 * 支持文章标题显示、分类标签展示和平滑过渡动画
 * 
 * 需求引用:
 * - 需求1.3: 面包屑导航结构 (Home > Blog > Category > Article)，文章标题显示，分类标签显示
 * - 需求4.4: 返回博客列表按钮，带有平滑过渡动画，移动端响应式优化
 * 
 * 技术实现:
 * - 使用已有的Button组件和shadcn/ui设计系统
 * - 参考CategoryFilter组件的样式一致性
 * - 利用animations.css中的动画类
 * - 集成Next.js路由导航功能
 * - TypeScript严格类型检查
 * - 支持暗色/亮色主题和无障碍性
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BlogCategoryUtils } from '../constants/categories';

/**
 * BlogNavigation组件属性接口
 */
export interface BlogNavigationProps {
  /** 当前文章信息 */
  article: {
    /** 文章标题 */
    title: string;
    /** 文章分类 */
    category: string;
    /** 文章URL slug */
    slug: string;
  };
  
  /** 自定义样式类名 */
  className?: string;
  
  /** 返回按钮点击事件回调 */
  onBackClick?: () => void;
  
  /** 面包屑点击事件回调 */
  onBreadcrumbClick?: (path: string) => void;
}

/**
 * 面包屑导航项接口
 */
interface BreadcrumbItem {
  /** 显示文本 */
  label: string;
  /** 导航路径 */
  href?: string;
  /** 是否为当前页面 */
  isCurrent?: boolean;
}

/**
 * BlogNavigation博客导航组件
 * 
 * 提供博客详情页面的完整导航体验：
 * - 面包屑导航：Home > Blog > Category > Article
 * - 文章标题显示和分类标签
 * - 返回博客列表按钮
 * - 响应式设计和平滑动画
 * - 键盘导航支持
 * 
 * 特性:
 * - 响应式布局：移动端优化的层次结构
 * - 动画效果：利用blog-category-tag和fade-in动画
 * - 文本截断：长标题的响应式处理
 * - 键盘导航：完整的a11y支持
 * - 主题适配：暗色/亮色模式兼容
 * - 类型安全：完整的TypeScript支持
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <BlogNavigation 
 *   article={{
 *     title: "深入理解React状态管理",
 *     category: "technologies",
 *     slug: "react-state-management"
 *   }}
 * />
 * 
 * // 自定义回调
 * <BlogNavigation 
 *   article={articleData}
 *   onBackClick={() => router.push('/blog')}
 *   onBreadcrumbClick={(path) => router.push(path)}
 *   className="mb-6"
 * />
 * ```
 */
export function BlogNavigation({
  article,
  className,
  onBackClick,
  onBreadcrumbClick,
}: BlogNavigationProps) {
  const router = useRouter();
  
  // 获取有效分类和处理后的标题
  const validCategory = BlogCategoryUtils.getValidCategory(article.category);
  const categoryLabel = BlogCategoryUtils.getCategoryLabel(validCategory);
  const truncatedTitle = article.title.length > 50 
    ? `${article.title.slice(0, 50)}...` 
    : article.title;

  // 构建面包屑导航项
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: categoryLabel, href: `/blog?category=${validCategory}` },
    { label: truncatedTitle, isCurrent: true }
  ];

  // 处理返回按钮点击
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push('/blog');
    }
  };

  // 处理面包屑点击导航
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (!item.href || item.isCurrent) return;
    
    if (onBreadcrumbClick) {
      onBreadcrumbClick(item.href);
    } else {
      router.push(item.href);
    }
  };

  return (
    <nav 
      className={cn(
        // 基础布局容器
        "w-full",
        // 分类切换fade-in动画 (Requirements 13.2)
        "blog-category-filter-fade-in",
        className
      )}
      aria-label="博客文章导航"
      role="navigation"
    >
      {/* 返回按钮 - 移动端优先显示 */}
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className={cn(
            // 使用blog-category-tag样式保持一致性
            "blog-category-tag",
            // 按钮样式
            "h-9 px-3 text-sm font-medium",
            // 悬停和焦点效果
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            // 图标和文本间距
            "gap-2"
          )}
          aria-label="返回博客列表"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">返回博客列表</span>
          <span className="sm:hidden">返回</span>
        </Button>
      </div>

      {/* 面包屑导航 */}
      <div className="mb-4 md:mb-6">
        <ol 
          className={cn(
            // 基础flex布局
            "flex flex-wrap items-center gap-1 md:gap-2",
            // 文本样式
            "text-sm text-muted-foreground",
            // 内容fade-in动画
            "blog-content-fade-in"
          )}
          aria-label="面包屑导航"
        >
          {breadcrumbItems.map((item, index) => (
            <li key={item.href || item.label} className="flex items-center">
              {/* 分隔符 - 非首项显示 */}
              {index > 0 && (
                <ChevronRight 
                  className="h-3 w-3 mx-1 md:mx-2 text-muted-foreground/60" 
                  aria-hidden="true"
                />
              )}
              
              {/* 面包屑项 */}
              {item.isCurrent ? (
                // 当前页面 - 非链接状态
                <span 
                  className={cn(
                    "font-medium text-foreground",
                    // 移动端文本截断
                    "truncate max-w-[120px] sm:max-w-[200px] md:max-w-none",
                    // 当前页面指示器
                    "blog-category-tag-active"
                  )}
                  aria-current="page"
                  title={article.title}
                >
                  {item.label}
                </span>
              ) : (
                // 可点击的导航链接
                <button
                  onClick={() => handleBreadcrumbClick(item)}
                  className={cn(
                    // 链接样式
                    "transition-colors hover:text-foreground focus:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    "rounded-sm px-1 py-0.5",
                    // 首页图标特殊处理
                    index === 0 && "flex items-center gap-1"
                  )}
                  aria-label={`导航到${item.label}`}
                >
                  {index === 0 && <Home className="h-3 w-3" />}
                  <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-none">
                    {item.label}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* 文章标题和分类标签 */}
      <div className="mb-6 md:mb-8">
        {/* 文章标题 */}
        <h1 
          className={cn(
            // 标题样式
            "text-2xl md:text-3xl lg:text-4xl font-bold text-foreground",
            // 行高和间距
            "leading-tight mb-4",
            // 响应式处理
            "break-words",
            // 标题fade-in动画
            "blog-content-fade-in"
          )}
          title={article.title}
        >
          {article.title}
        </h1>

        {/* 分类标签 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">分类:</span>
          <Link
            href={`/blog?category=${validCategory}`}
            className={cn(
              // 使用CategoryFilter的标签样式保持一致
              "blog-category-tag",
              // 圆角胶囊样式 (参考CategoryFilter需求10.2)
              "rounded-[20px] px-4 py-2",
              // 分类标签配色 (参考CategoryFilter需求10.4)
              "bg-[#8B5CF6] text-white border-transparent",
              "hover:bg-[#8B5CF6]/90",
              // 文本样式
              "text-sm font-medium",
              // 焦点状态
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2",
              // 激活状态动画
              "blog-category-tag-active"
            )}
            aria-label={`查看${categoryLabel}分类的所有文章`}
          >
            {categoryLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default BlogNavigation;