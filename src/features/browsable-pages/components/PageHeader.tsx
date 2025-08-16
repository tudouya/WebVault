/**
 * PageHeader组件
 * 
 * 为collection、category、tag页面提供统一的页面标题展示
 * 根据页面类型显示不同的标识符和标题内容
 * 
 * 需求引用:
 * - 需求9.1: 根据页面类型显示COLLECTION/CATEGORY/TAG小标识
 * - 需求9.5: 保持与首页相似的居中布局和间距
 */

'use client';

import React from 'react';
import type { PageType } from '../types/page-config';

/**
 * PageHeader组件属性接口
 */
export interface PageHeaderProps {
  /** 页面类型：collection、category 或 tag */
  pageType: PageType;
  
  /** 主标题 */
  title: string;
  
  /** 副标题，可选 */
  subtitle?: string;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 是否显示在加载状态 */
  isLoading?: boolean;
  
  /** 描述信息，可选 */
  description?: string;
  
  /** 统计信息，可选 */
  stats?: {
    count: number;
    label: string;
  };
}

/**
 * 根据页面类型获取标识符和默认标题配置
 */
function getPageTypeConfig(pageType: PageType) {
  switch (pageType) {
    case 'collection':
      return {
        badge: 'COLLECTION',
        defaultTitle: 'Collection Details',
        defaultSubtitle: 'Explore curated website collections'
      };
    case 'category':
      return {
        badge: 'CATEGORY',
        defaultTitle: 'Explore by categories',
        defaultSubtitle: 'Discover websites organized by categories'
      };
    case 'tag':
      return {
        badge: 'TAG', 
        defaultTitle: 'Explore by tags',
        defaultSubtitle: 'Find websites with specific tags'
      };
    default:
      return {
        badge: 'PAGE',
        defaultTitle: 'Browse Content',
        defaultSubtitle: 'Explore our curated content'
      };
  }
}

/**
 * PageHeader组件
 * 
 * 提供统一的页面标题展示，支持不同页面类型的标识符
 * 采用与HeroSection相似的布局和响应式设计
 */
export function PageHeader({
  pageType,
  title,
  subtitle,
  className = '',
  isLoading = false,
  description,
  stats
}: PageHeaderProps) {
  const config = getPageTypeConfig(pageType);
  
  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return (
      <section 
        className={`relative bg-background py-12 px-4 sm:py-16 sm:px-6 lg:px-8 ${className}`}
        aria-label="页面标题加载中"
      >
        <div className="mx-auto max-w-6xl text-center">
          <div className="animate-pulse">
            {/* 标识符骨架 */}
            <div className="mb-4">
              <div className="mx-auto h-6 w-24 bg-muted rounded"></div>
            </div>
            
            {/* 标题骨架 */}
            <div className="mb-4">
              <div className="mx-auto h-10 w-3/4 bg-muted rounded sm:h-12"></div>
            </div>
            
            {/* 副标题骨架 */}
            <div className="mx-auto h-6 w-1/2 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={`relative bg-background py-12 px-4 sm:py-16 sm:px-6 lg:px-8 ${className}`}
      aria-label="页面标题"
    >
      <div className="mx-auto max-w-6xl text-center">
        {/* 页面类型标识 */}
        <div className="mb-4">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
            {config.badge}
          </span>
        </div>

        {/* 主标题区域 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            <span className="block">
              {title || config.defaultTitle}
            </span>
          </h1>
          
          {/* 副标题 */}
          {(subtitle || config.defaultSubtitle) && (
            <p className="mt-4 text-lg leading-8 text-card-foreground sm:text-xl">
              {subtitle || config.defaultSubtitle}
            </p>
          )}
        </div>

        {/* 描述信息 */}
        {description && (
          <div className="mb-6">
            <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
        )}

        {/* 统计信息 */}
        {stats && (
          <div className="mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary sm:text-3xl">
                {stats.count.toLocaleString()}
              </div>
              <div className="mt-2 text-sm font-medium text-card-foreground">
                {stats.label}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHeader;