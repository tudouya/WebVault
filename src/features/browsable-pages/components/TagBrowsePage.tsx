/**
 * TagBrowsePage标签浏览页组件
 * 
 * 实现标签浏览页面的完整功能，包括：
 * - 使用BrowsablePageLayout统一布局
 * - 集成useTagWebsites Hook处理标签筛选
 * - 支持多标签同时筛选的交互逻辑
 * - 实现标签条件变更的URL参数同步
 * 
 * 需求引用:
 * - 需求3.1: 标签页面显示"TAG"标识和"Explore by tags"标题
 * - 需求3.2: 页面加载筛选控件，提供标签筛选栏和排序下拉菜单
 * - 需求3.5: 用户导航翻页时保持当前筛选条件并同步URL状态
 * - 需求4.1: 显示网站卡片时复用现有的WebsiteCard组件设计
 * - 需求5.1: 桌面端使用3列网格布局展示网站卡片
 * - 需求7.1: 页面URL能够反映筛选条件，方便分享链接和收藏页面
 */

'use client';

import React, { useMemo } from 'react';

// 导入布局组件
import { BrowsablePageLayout } from './BrowsablePageLayout';
import type { BrowsablePageConfig } from '../types';

// 导入React基础功能

// 导入类型

/**
 * 创建标签页面配置
 * 
 * 根据设计规范生成标签浏览页面的BrowsablePageConfig配置
 * 支持多标签同时筛选的特性
 */
function createTagPageConfig(): BrowsablePageConfig {
  return {
    // 基础配置
    pageType: 'tag',
    id: 'tag-browse-page',
    
    // 标题配置
    title: {
      prefix: 'TAG',
      dynamic: true,
      fallback: 'Explore by tags',
      template: 'Explore by tags - WebVault',
    },
    
    // 描述配置
    description: {
      enabled: true,
      source: 'dynamic',
      maxLength: 200,
      fallback: 'Browse and discover websites organized by tags',
    },
    
    // 头部区域配置
    hero: {
      enabled: true,
      layout: 'minimal',
      showStats: true,
      showBreadcrumbs: true,
      background: {
        type: 'pattern',
        theme: 'accent',
      },
      content: {
        showDescription: true,
        descriptionMaxLength: 120,
        showIcon: false,
        showActions: false,
      },
    },
    
    // 筛选配置
    filters: {
      searchEnabled: true,
      searchPlaceholder: 'Search websites...',
      categoryEnabled: true,  // 标签页面也支持分类筛选
      tagEnabled: true,       // 启用标签筛选栏（支持多标签筛选）
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
        defaultItemsPerPage: 18,
        itemsPerPageOptions: [18, 36, 72],
        columns: {
          desktop: 3,          // 桌面端3列网格布局
          tablet: 2,
          mobile: 1,
        },
      },
      list: {
        defaultItemsPerPage: 30,
        compactMode: true,
      },
      pagination: {
        infiniteScroll: true,
        loadMoreButton: false,
        loadIncrement: 18,
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
        maxItems: 3,
        dropdown: false,
      },
      related: {
        showParents: false,
        showChildren: false,
        showSimilar: true,
        maxItems: 10,
      },
    },
    
    // SEO配置
    seo: {
      metaDescription: true,
      metaDescriptionLength: 160,
      structuredData: true,
      canonicalPattern: '/tag/{slug}',
      openGraph: {
        enabled: true,
        siteName: 'WebVault',
      },
      twitterCard: {
        enabled: true,
        cardType: 'summary',
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
      customEvents: ['tag_view', 'tag_filter', 'multi_tag_filter', 'website_click'],
    },
    
    // 功能特性配置
    features: {
      enableSorting: true,     // 启用排序功能
      enablePagination: true,  // 启用分页导航
      showAdBanner: true,      // 显示广告横幅
      enableExport: false,
      enableSharing: true,
      enableBookmarks: false,
      enableRatings: false,
      enableComments: false,
    },
    
    // 自定义配置
    custom: {
      tag: {
        showRelatedTags: true,
        showTrending: true,
        enableFollowing: false,
        showStats: true,
        showUsageCount: true,
        showGroup: true,
        // 多标签筛选特性
        multiTagMode: true,
        maxCombinedTags: 5,
        showTagCombinations: true,
      },
    },
  };
}

/**
 * 标签浏览页面属性接口
 */
export interface TagBrowsePageProps {
  /** 当前选中的标签slugs（支持多标签） */
  selectedTags?: string[];
  
  /** 单标签模式的标签slug（向后兼容） */
  selectedTag?: string;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 网站卡片访问回调 */
  onVisitWebsite?: (websiteId: string) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 标签选择回调（支持多标签） */
  onTagsChange?: (tagSlugs: string[]) => void;
  
  /** 标签添加回调 */
  onTagAdd?: (tagSlug: string) => void;
  
  /** 标签移除回调 */
  onTagRemove?: (tagSlug: string) => void;
  
  /** 错误回调 */
  onError?: (error: string) => void;
  
  /** 加载状态回调 */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * 错误状态组件
 */
const TagErrorState = ({ 
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
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    </div>
    
    <h3 className="text-xl font-semibold text-foreground mb-3">
      加载标签失败
    </h3>
    
    <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
      无法加载标签数据：{error}。请检查网络连接并重试。
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
const _TagLoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[500px]">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
      <div className="w-8 h-8 bg-primary/20 rounded-full animate-spin border-2 border-primary/30 border-t-primary" />
    </div>
    
    <h3 className="text-lg font-semibold text-foreground mb-2">
      正在加载标签数据
    </h3>
    
    <p className="text-muted-foreground max-w-sm leading-relaxed">
      正在获取标签信息和网站列表...
    </p>
  </div>
);

/**
 * 标签浏览页面主组件
 * 
 * 简化版本，直接使用BrowsablePageLayout和browsable-page-store
 * 核心特性：
 * - 配置驱动的布局渲染（通过createTagPageConfig）
 * - 直接使用browsable-page-store的状态管理
 * - 响应式布局适配
 */
export function TagBrowsePage({
  selectedTags,
  selectedTag,
  className,
  onVisitWebsite,
  onTagClick,
  onTagsChange: _onTagsChange,
  onTagAdd: _onTagAdd,
  onTagRemove: _onTagRemove,
  onError,
  onLoadingChange: _onLoadingChange,
}: TagBrowsePageProps) {
  // 处理标签参数（支持多标签模式和单标签向后兼容）
  const tagSlugs = useMemo(() => {
    if (selectedTags && selectedTags.length > 0) {
      return selectedTags.filter(tag => tag && tag.trim());
    }
    if (selectedTag && selectedTag.trim()) {
      return [selectedTag.trim()];
    }
    return [];
  }, [selectedTags, selectedTag]);

  // 生成页面配置
  const pageConfig = useMemo(() => {
    try {
      return createTagPageConfig();
    } catch (error) {
      console.error('Failed to create tag page config:', error);
      onError?.(error instanceof Error ? error.message : 'Configuration error');
      return null;
    }
  }, [onError]);

  // 配置生成失败
  if (!pageConfig) {
    return (
      <div className={className}>
        <TagErrorState
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
        entitySlug={tagSlugs.length === 1 ? tagSlugs[0] : 'all-tags'}
        onVisitWebsite={onVisitWebsite}
        onTagClick={onTagClick}
      />
    </div>
  );
}

/**
 * 简化的标签浏览页面组件
 * 
 * 为简单使用场景提供基础的标签浏览功能
 */
export function SimpleTagBrowsePage({
  selectedTags,
  selectedTag,
  className,
}: {
  selectedTags?: string[];
  selectedTag?: string;
  className?: string;
}) {
  return (
    <TagBrowsePage
      selectedTags={selectedTags}
      selectedTag={selectedTag}
      className={className}
      onVisitWebsite={(websiteId) => {
        console.log('Website visited:', websiteId);
      }}
      onTagClick={(tag) => {
        console.log('Tag clicked:', tag);
      }}
      onTagsChange={(tagSlugs) => {
        console.log('Tags changed:', tagSlugs);
      }}
      onTagAdd={(tagSlug) => {
        console.log('Tag added:', tagSlug);
      }}
      onTagRemove={(tagSlug) => {
        console.log('Tag removed:', tagSlug);
      }}
      onError={(error) => {
        console.error('Tag page error:', error);
      }}
      onLoadingChange={(loading) => {
        console.log('Loading state changed:', loading);
      }}
    />
  );
}

/**
 * 多标签浏览页面组件
 * 
 * 专为多标签筛选场景优化的组件版本
 */
export function MultiTagBrowsePage({
  selectedTags,
  className,
  onTagsChange,
  onTagAdd,
  onTagRemove,
}: {
  selectedTags: string[];
  className?: string;
  onTagsChange?: (tagSlugs: string[]) => void;
  onTagAdd?: (tagSlug: string) => void;
  onTagRemove?: (tagSlug: string) => void;
}) {
  return (
    <TagBrowsePage
      selectedTags={selectedTags}
      className={className}
      onTagsChange={onTagsChange}
      onTagAdd={onTagAdd}
      onTagRemove={onTagRemove}
      onVisitWebsite={(websiteId) => {
        console.log('Website visited from multi-tag page:', websiteId);
      }}
      onTagClick={(tag) => {
        console.log('Tag clicked from multi-tag page:', tag);
      }}
      onError={(error) => {
        console.error('Multi-tag page error:', error);
      }}
      onLoadingChange={(loading) => {
        console.log('Multi-tag loading state changed:', loading);
      }}
    />
  );
}

// 默认导出
export default TagBrowsePage;