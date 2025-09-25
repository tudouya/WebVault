/**
 * BreadcrumbNavigation面包屑导航组件
 * 
 * 为网站详情页面提供面包屑导航功能
 * 显示 Home > 分类名称 > 网站名称 的导航结构
 * 
 * 需求引用:
 * - AC-2.2.1: 系统SHALL在页面顶部显示面包屑导航：Home > 分类名称 > 网站名称
 * - AC-2.2.2: 用户点击面包屑中的分类链接时，系统SHALL导航到对应分类的网站列表页面
 * 
 * 技术实现:
 * - 参考BlogNavigation组件的面包屑模式
 * - 使用Next.js Link进行导航
 * - 使用Lucide图标（Home, ChevronRight）
 * - 支持响应式设计和无障碍访问
 * - 集成shadcn/ui设计系统
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '../types/category';

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
 * BreadcrumbNavigation组件属性接口
 */
export interface BreadcrumbNavigationProps {
  /** 当前网站信息 */
  website: {
    /** 网站标题 */
    title: string;
    /** 网站ID */
    id: string;
    /** 网站分类信息 */
    category?: Pick<Category, 'id' | 'name' | 'slug'>;
  };
  
  /** 自定义样式类名 */
  className?: string;
  
  /** 面包屑点击事件回调 */
  onBreadcrumbClick?: (path: string) => void;
}

/**
 * BreadcrumbNavigation面包屑导航组件
 * 
 * 提供网站详情页面的面包屑导航体验：
 * - 面包屑导航：Home > Category > Website
 * - 点击导航链接跳转到对应页面
 * - 响应式设计和无障碍访问支持
 * - 当前页面的非链接状态显示
 * 
 * 特性:
 * - 响应式布局：移动端优化的层次结构
 * - 文本截断：长标题的响应式处理
 * - 键盘导航：完整的a11y支持
 * - 主题适配：暗色/亮色模式兼容
 * - 类型安全：完整的TypeScript支持
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <BreadcrumbNavigation 
 *   website={{
 *     title: "GitHub - 全球最大的代码托管平台",
 *     id: "github-123",
 *     category: { id: "dev-tools", name: "开发工具", slug: "dev-tools" }
 *   }}
 * />
 * 
 * // 自定义回调
 * <BreadcrumbNavigation 
 *   website={websiteData}
 *   onBreadcrumbClick={(path) => router.push(path)}
 *   className="mb-6"
 * />
 * ```
 */
export function BreadcrumbNavigation({
  website,
  className,
  onBreadcrumbClick,
}: BreadcrumbNavigationProps) {
  // 处理网站标题截断，保持与博客组件一致的模式
  const truncatedTitle = website.title.length > 50 
    ? `${website.title.slice(0, 50)}...` 
    : website.title;

  // 构建面包屑导航项
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];

  // 如果有分类信息，添加分类面包屑
  if (website.category) {
    breadcrumbItems.push({
      label: website.category.name,
      href: `/category/${website.category.slug}`,
    });
  }

  // 添加当前网站作为最后一项（非链接状态）
  breadcrumbItems.push({
    label: truncatedTitle,
    isCurrent: true
  });

  // 处理面包屑点击导航
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (!item.href || item.isCurrent) return;
    
    if (onBreadcrumbClick) {
      onBreadcrumbClick(item.href);
    }
    // 注意：不需要默认的router.push，因为使用Link组件自动处理
  };

  return (
    <nav 
      className={cn(
        // 基础布局容器
        "w-full",
        // 使用与blog导航一致的动画类
        "blog-category-filter-fade-in",
        className
      )}
      aria-label="网站详情页导航"
      role="navigation"
    >
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
                  data-testid="chevron-separator"
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
                  title={website.title}
                >
                  {item.label}
                </span>
              ) : (
                // 可点击的导航链接
                <Link
                  href={item.href!}
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
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

export default BreadcrumbNavigation;