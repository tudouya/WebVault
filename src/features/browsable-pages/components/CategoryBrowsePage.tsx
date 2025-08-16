/**
 * CategoryBrowsePage分类浏览页组件
 * 
 * 实现分类浏览页面的完整功能，包括：
 * - 使用BrowsablePageLayout统一布局
 * - 集成useCategoryWebsites Hook处理分类筛选
 * - 实现分类筛选标签的缓存和状态管理
 * - 包含URL状态同步的浏览器前进后退支持
 * 
 * 需求引用:
 * - 需求2.1: 分类页面显示"CATEGORY"标识和"Explore by categories"标题
 * - 需求2.2: 页面加载筛选控件，提供分类筛选标签栏和排序下拉菜单
 * - 需求2.5: 分类内容超过单页显示时保持当前筛选条件并同步URL状态
 * - 需求4.1: 显示网站卡片时复用现有的WebsiteCard组件设计
 * - 需求5.1: 桌面端使用3列网格布局展示网站卡片
 * - 需求7.1: 页面URL能够反映筛选条件，方便分享链接和收藏页面
 */

'use client';

import React, { useEffect, useMemo } from 'react';

// 导入布局组件
import { BrowsablePageLayout } from './BrowsablePageLayout';
import type { BrowsablePageConfig } from '../types';

// 导入数据Hook
import { useCategoryWebsites } from '../hooks/useCategoryWebsites';

// 导入类型
import type { WebsiteCardData } from '@/features/websites/types/website';

/**
 * 创建分类页面配置
 * 
 * 根据设计规范生成分类浏览页面的BrowsablePageConfig配置
 */
function createCategoryPageConfig(): BrowsablePageConfig {
  return {
    // 基础配置
    pageType: 'category',
    id: 'category-browse-page',
    
    // 标题配置
    title: {
      prefix: 'CATEGORY',
      dynamic: true,
      fallback: 'Explore by categories',
      template: 'Explore by categories - WebVault',
    },
    
    // 描述配置
    description: {
      enabled: true,
      source: 'dynamic',
      maxLength: 200,
      fallback: 'Browse and discover websites organized by categories',
    },
    
    // 头部区域配置
    hero: {
      enabled: true,
      layout: 'standard',
      showStats: true,
      showBreadcrumbs: true,
      background: {
        type: 'gradient',
        theme: 'secondary',
      },
      content: {
        showDescription: true,
        descriptionMaxLength: 150,
        showIcon: true,
        showActions: false,
      },
    },
    
    // 筛选配置
    filters: {
      searchEnabled: true,
      searchPlaceholder: 'Search websites...',
      categoryEnabled: true,  // 启用分类筛选标签栏
      tagEnabled: true,
      sortEnabled: true,      // 启用排序下拉菜单
      availableSorts: [
        { field: 'created_at', label: 'Recently Added', order: 'desc', icon: 'clock' },
        { field: 'updated_at', label: 'Recently Updated', order: 'desc', icon: 'refresh' },
        { field: 'title', label: 'Name (A-Z)', order: 'asc', icon: 'alphabetical' },
        { field: 'title', label: 'Name (Z-A)', order: 'desc', icon: 'alphabetical' },
        { field: 'rating', label: 'Highest Rated', order: 'desc', icon: 'star' },
        { field: 'visit_count', label: 'Most Popular', order: 'desc', icon: 'trending-up' },
      ],
      defaultSort: { field: 'created_at', label: 'Recently Added', order: 'desc' },
      advanced: {
        ratingFilter: true,
        dateRangeFilter: true,
        statusFilter: false,
        featuredToggle: true,
        adsToggle: true,
        customFilters: [],
      },
      urlSync: true,           // 启用URL状态同步
      showFilterCounts: true,
      presets: false,
    },
    
    // 内容配置
    content: {
      defaultViewMode: 'grid',
      viewModeToggle: true,
      grid: {
        defaultItemsPerPage: 15,
        itemsPerPageOptions: [15, 30, 60],
        columns: {
          desktop: 3,          // 桌面端3列网格布局
          tablet: 2,
          mobile: 1,
        },
      },
      list: {
        defaultItemsPerPage: 25,
        compactMode: true,
      },
      pagination: {
        infiniteScroll: false,
        loadMoreButton: true,
        loadIncrement: 15,
      },
    },
    
    // 导航配置
    navigation: {
      sidebar: {
        enabled: true,
        position: 'right',
        collapsible: true,
        defaultCollapsed: false,
        sections: {
          related: true,
          hierarchy: false,
          quickFilters: true,
          recent: false,
        },
      },
      breadcrumbs: {
        enabled: true,
        showHome: true,
        maxItems: 4,
        dropdown: true,
      },
      related: {
        showParents: false,
        showChildren: false,
        showSimilar: true,
        maxItems: 8,
      },
    },
    
    // SEO配置
    seo: {
      metaDescription: true,
      metaDescriptionLength: 160,
      structuredData: true,
      canonicalPattern: '/category/{slug}',
      openGraph: {
        enabled: true,
        siteName: 'WebVault',
      },
      twitterCard: {
        enabled: true,
        cardType: 'summary_large_image',
      },
    },
    
    // 性能配置
    performance: {
      lazyImages: true,
      virtualization: false,
      prefetchRelated: true,
      caching: {
        enabled: true,
        duration: 300, // 5分钟
        keyStrategy: 'url',
      },
    },
    
    // 分析配置
    analytics: {
      pageViews: true,
      filterUsage: true,
      searchTracking: true,
      interactions: true,
      customEvents: ['category_view', 'category_filter', 'website_click'],
    },
    
    // 功能特性配置
    features: {
      enableSorting: true,     // 启用排序功能
      enablePagination: true,  // 启用分页导航
      showAdBanner: true,      // 显示广告横幅
      enableExport: false,
      enableSharing: true,
      enableBookmarks: false,
      enableRatings: true,
      enableComments: false,
    },
    
    // 自定义配置
    custom: {
      category: {
        showSubcategories: true,
        showParentNav: true,
        enableFollowing: false,
        showHierarchy: true,
        expandableTree: true,
      },
    },
  };
}

/**
 * 分类浏览页面属性接口
 */
export interface CategoryBrowsePageProps {
  /** 当前选中的分类slug */
  selectedCategory?: string;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 网站卡片访问回调 */
  onVisitWebsite?: (websiteId: string) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 分类选择回调 */
  onCategoryChange?: (categorySlug: string) => void;
  
  /** 错误回调 */
  onError?: (error: string) => void;
  
  /** 加载状态回调 */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * 错误状态组件
 */
const CategoryErrorState = ({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[500px]">
    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
      <svg
        className="w-10 h-10 text-destructive"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    </div>
    
    <h3 className="text-xl font-semibold text-foreground mb-3">
      加载分类失败
    </h3>
    
    <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
      无法加载分类数据：{error}。请检查网络连接并重试。
    </p>
    
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        重新加载
      </button>
    )}
  </div>
);

/**
 * 加载状态组件
 */
const CategoryLoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[500px]">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
      <div className="w-8 h-8 bg-primary/20 rounded-full animate-spin border-2 border-primary/30 border-t-primary" />
    </div>
    
    <h3 className="text-lg font-semibold text-foreground mb-2">
      正在加载分类数据
    </h3>
    
    <p className="text-muted-foreground max-w-sm leading-relaxed">
      正在获取分类信息和网站列表...
    </p>
  </div>
);

/**
 * 分类浏览页面主组件
 * 
 * 简化版本，直接使用BrowsablePageLayout和browsable-page-store
 * 核心特性：
 * - 配置驱动的布局渲染（通过createCategoryPageConfig）
 * - 直接使用browsable-page-store的状态管理
 * - 响应式布局适配
 */
export function CategoryBrowsePage({
  selectedCategory,
  className,
  onVisitWebsite,
  onTagClick,
  onCategoryChange,
  onError,
  onLoadingChange,
}: CategoryBrowsePageProps) {
  // 生成页面配置
  const pageConfig = useMemo(() => {
    try {
      return createCategoryPageConfig();
    } catch (error) {
      console.error('Failed to create category page config:', error);
      onError?.(error instanceof Error ? error.message : 'Configuration error');
      return null;
    }
  }, [onError]);

  // 配置生成失败
  if (!pageConfig) {
    return (
      <div className={className}>
        <CategoryErrorState
          error="页面配置生成失败，请重试"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // 正常渲染：使用BrowsablePageLayout
  return (
    <div className={className}>
      <BrowsablePageLayout
        config={pageConfig}
        entitySlug={selectedCategory || 'development'}
        onVisitWebsite={onVisitWebsite}
        onTagClick={onTagClick}
      />
    </div>
  );
}

/**
 * 简化的分类浏览页面组件
 * 
 * 为简单使用场景提供基础的分类浏览功能
 */
export function SimpleCategoryBrowsePage({
  selectedCategory,
  className,
}: {
  selectedCategory?: string;
  className?: string;
}) {
  return (
    <CategoryBrowsePage
      selectedCategory={selectedCategory}
      className={className}
      onVisitWebsite={(websiteId) => {
        console.log('Website visited:', websiteId);
      }}
      onTagClick={(tag) => {
        console.log('Tag clicked:', tag);
      }}
      onCategoryChange={(categorySlug) => {
        console.log('Category changed:', categorySlug);
      }}
      onError={(error) => {
        console.error('Category page error:', error);
      }}
      onLoadingChange={(loading) => {
        console.log('Loading state changed:', loading);
      }}
    />
  );
}

// 默认导出
export default CategoryBrowsePage;