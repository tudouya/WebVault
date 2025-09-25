/**
 * CollectionDetailPage集合详情页组件
 * 
 * 实现集合详情页面的完整功能，包括：
 * - 使用BrowsablePageLayout统一布局
 * - 集成useCollectionDetail Hook处理数据获取
 * - 支持服务端渲染的数据预加载和错误处理
 * - 实现集合特有的SEO meta信息
 * 
 * 需求引用:
 * - 需求1.1: 集合详情页面加载并显示集合详细信息和包含的网站列表
 * - 需求1.2: 页面加载集合信息时显示"COLLECTION"标识和集合标题
 * - 需求1.5: 集合内容超过单页显示时提供分页导航功能
 * - 需求1.6: 集合数据获取失败时显示错误状态和重试选项
 * - 需求4.1: 显示网站卡片时复用现有的WebsiteCard组件设计
 * - 需求5.1: 桌面端使用3列网格布局展示网站卡片
 * - 需求6.1: 便捷地浏览多页内容，在翻页时保持当前的筛选条件
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Metadata } from 'next';

// 导入布局和配置工厂
import { BrowsablePageLayout } from './BrowsablePageLayout';
import { createCollectionPageConfig } from '../types/config-factory';
import type { BrowsablePageConfig } from '../types';

// 导入数据Hook
import { useCollectionDetail } from '../hooks/useCollectionDetail';

// 导入类型
import type { Collection } from '@/features/websites/types/collection';
import type { WebsiteCardData } from '@/features/websites/types/website';

/**
 * 集合详情页面属性接口
 */
export interface CollectionDetailPageProps {
  /** 集合slug或ID */
  collectionSlug: string;
  
  /** 预加载的服务端数据 */
  initialData?: {
    collection: Collection | null;
    websites: WebsiteCardData[];
    totalCount: number;
  };
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 网站卡片访问回调 */
  onVisitWebsite?: (websiteId: string) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
  
  /** 错误回调 */
  onError?: (error: string) => void;
  
  /** 加载状态回调 */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * 错误状态组件
 */
const CollectionErrorState = ({ 
  error, 
  onRetry, 
  collectionSlug 
}: { 
  error: string; 
  onRetry?: () => void;
  collectionSlug: string;
}) => {
  const router = useRouter();
  
  const isNotFound = error.includes('not found') || error.includes('Collection not found');
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[500px]">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        {isNotFound ? (
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
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146-.832-5.657-2.343m0 0L3.515 9.829C2.296 8.61 3.389 6.5 5.172 6.5h13.656c1.783 0 2.876 2.11 1.657 3.329L17.657 12.657z"
            />
          </svg>
        ) : (
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
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {isNotFound ? '集合未找到' : '加载失败'}
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
        {isNotFound 
          ? `集合 "${collectionSlug}" 不存在或已被删除。请检查URL是否正确，或浏览其他集合。`
          : `无法加载集合详情信息：${error}。请检查网络连接并重试。`
        }
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {!isNotFound && onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            重新加载
          </button>
        )}
        
        <button
          onClick={() => router.push('/collection')}
          className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
        >
          {isNotFound ? '浏览集合' : '返回集合列表'}
        </button>
      </div>
    </div>
  );
};

/**
 * 加载状态组件
 */
const CollectionLoadingState = ({ collectionSlug }: { collectionSlug: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[500px]">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
      <div className="w-8 h-8 bg-primary/20 rounded-full animate-spin border-2 border-primary/30 border-t-primary" />
    </div>
    
    <h3 className="text-lg font-semibold text-foreground mb-2">
      正在加载集合详情
    </h3>
    
    <p className="text-muted-foreground max-w-sm leading-relaxed">
      正在获取&ldquo;{collectionSlug}&rdquo;集合的详细信息和网站列表...
    </p>
  </div>
);

/**
 * 集合详情页面主组件
 * 
 * 核心特性：
 * - 配置驱动的布局渲染（通过createCollectionPageConfig）
 * - 完整的数据获取和状态管理（通过useCollectionDetail）
 * - 错误处理和重试机制
 * - 服务端渲染数据预加载支持
 * - SEO友好的meta信息生成
 * - 响应式布局适配
 */
export function CollectionDetailPage({
  collectionSlug,
  initialData,
  className,
  onVisitWebsite,
  onTagClick,
  onError,
  onLoadingChange,
}: CollectionDetailPageProps) {
  // 使用集合详情Hook获取数据
  const {
    collection,
    websites,
    totalCount,
    isLoading,
    hasError,
    error,
    isEmpty: _isEmpty,
    isNotFound,
    found,
    source,
    duration,
    retryLoad,
    clearError,
    currentPage,
    totalPages,
    hasNextPage: _hasNextPage,
    hasPrevPage: _hasPrevPage,
    searchQuery: _searchQuery,
    tagsFilter: _tagsFilter,
    sorting: _sorting,
    config: _hookConfig,
  } = useCollectionDetail({
    collectionId: collectionSlug,
    initialData,
    autoLoad: true,
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
    maxRetries: 3,
    debounceDelay: 300,
  });

  // 生成页面配置
  const pageConfig: BrowsablePageConfig | null = useMemo(() => {
    if (!collection) return null;
    
    try {
      return createCollectionPageConfig({
        collection,
        features: {
          enablePagination: true,
          enableSharing: true,
          enableBookmarks: true,
          showCurator: true,
        },
        overrides: {
          // 集合详情页特定的配置覆盖
          features: {
            enableSorting: false, // 集合详情页通常不需要复杂排序
            showAdBanner: true,
            enablePagination: true,
            enableExport: false,
            enableSharing: true,
            enableBookmarks: true,
            enableRatings: false,
            enableComments: false,
          },
          content: {
            defaultViewMode: 'grid',
            viewModeToggle: true,
            grid: {
              defaultItemsPerPage: 12,
              itemsPerPageOptions: [12, 24, 48],
              columns: {
                desktop: 3,
                tablet: 2,
                mobile: 1,
              },
            },
            list: {
              defaultItemsPerPage: 20,
              compactMode: true,
            },
            pagination: {
              infiniteScroll: false,
              loadMoreButton: true,
              loadIncrement: 12,
            },
          },
          navigation: {
            sidebar: {
              enabled: true,
              position: 'right',
              collapsible: true,
              defaultCollapsed: false,
              sections: {
                related: true,
                hierarchy: false,
                quickFilters: false,
                recent: true,
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
              maxItems: 6,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to create collection page config:', error);
      onError?.(error instanceof Error ? error.message : 'Configuration error');
      return null;
    }
  }, [collection, onError]);

  // 监听加载状态变化
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // 监听错误状态变化
  useEffect(() => {
    if (hasError && error) {
      onError?.(error);
    }
  }, [hasError, error, onError]);

  // 网站访问处理
  const handleVisitWebsite = React.useCallback((websiteId: string) => {
    onVisitWebsite?.(websiteId);
    
    // 这里可以添加访问统计逻辑
    console.log('Website visited:', {
      websiteId,
      collectionId: collection?.id,
      collectionSlug,
      source,
    });
  }, [onVisitWebsite, collection?.id, collectionSlug, source]);

  // 标签点击处理
  const handleTagClick = React.useCallback((tag: string) => {
    onTagClick?.(tag);
    
    // 这里可以添加标签点击统计逻辑
    console.log('Tag clicked:', {
      tag,
      collectionId: collection?.id,
      collectionSlug,
    });
  }, [onTagClick, collection?.id, collectionSlug]);

  // 重试处理
  const handleRetry = React.useCallback(() => {
    clearError();
    retryLoad();
  }, [clearError, retryLoad]);

  // 开发环境调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('CollectionDetailPage render:', {
      collectionSlug,
      collectionId: collection?.id,
      isLoading,
      hasError,
      error,
      found,
      source,
      duration,
      websitesCount: websites.length,
      totalCount,
      currentPage,
      totalPages,
      hasInitialData: !!initialData,
      configGenerated: !!pageConfig,
    });
  }

  // 错误状态：数据获取失败
  if (hasError && !isLoading) {
    return (
      <div className={className}>
        <CollectionErrorState
          error={error || 'Unknown error'}
          onRetry={handleRetry}
          collectionSlug={collectionSlug}
        />
      </div>
    );
  }

  // 加载状态：首次加载且无初始数据
  if (isLoading && !collection && !initialData) {
    return (
      <div className={className}>
        <CollectionLoadingState collectionSlug={collectionSlug} />
      </div>
    );
  }

  // 集合未找到状态
  if (!isLoading && isNotFound && !collection) {
    return (
      <div className={className}>
        <CollectionErrorState
          error="Collection not found"
          collectionSlug={collectionSlug}
        />
      </div>
    );
  }

  // 配置生成失败
  if (collection && !pageConfig) {
    return (
      <div className={className}>
        <CollectionErrorState
          error="页面配置生成失败，请重试"
          onRetry={handleRetry}
          collectionSlug={collectionSlug}
        />
      </div>
    );
  }

  // 正常渲染：使用BrowsablePageLayout
  if (pageConfig) {
    return (
      <div className={className}>
        <BrowsablePageLayout
          config={pageConfig}
          entitySlug={collectionSlug}
          onVisitWebsite={handleVisitWebsite}
          onTagClick={handleTagClick}
        />
      </div>
    );
  }

  // 兜底状态：不应该到达这里
  return (
    <div className={className}>
      <CollectionErrorState
        error="页面渲染异常，请重新加载"
        onRetry={handleRetry}
        collectionSlug={collectionSlug}
      />
    </div>
  );
}

/**
 * 生成集合详情页面的SEO meta信息
 * 
 * 用于服务端渲染时生成动态的meta标签
 */
export function generateCollectionMetadata(
  collection: Collection | null,
  searchParams?: {
    page?: number;
    search?: string;
    tags?: string[];
  }
): Metadata {
  // 默认meta信息
  const _defaultTitle = 'WebVault - 网站集合详情';
  const defaultDescription = '探索WebVault精选的网站集合，发现按主题整理的优质网站资源。';
  
  if (!collection) {
    return {
      title: '集合未找到 - WebVault',
      description: '该集合不存在或已被删除，请浏览其他精选集合。',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  // 构建动态标题
  let title = `${collection.title} - WebVault 集合`;
  if (searchParams?.page && searchParams.page > 1) {
    title = `${title} - 第${searchParams.page}页`;
  }

  // 构建动态描述
  let description = collection.description || collection.metaDescription || defaultDescription;
  if (searchParams?.search) {
    description = `在"${collection.title}"集合中搜索"${searchParams.search}"的结果。${description}`;
  }
  if (searchParams?.tags && searchParams.tags.length > 0) {
    description = `${description} 筛选标签：${searchParams.tags.join(', ')}。`;
  }

  // 截断描述到合适长度
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  // 构建关键词
  const keywords = [
    'WebVault',
    '网站集合',
    collection.title,
    '精选网站',
    '资源合辑'
  ];
  
  if (collection.tags) {
    keywords.push(...collection.tags);
  }

  // 构建URL
  const collectionUrl = new URL(`/collection/${collection.slug || collection.id}`, 'https://webvault.cn');
  if (searchParams?.page && searchParams.page > 1) {
    collectionUrl.searchParams.set('page', searchParams.page.toString());
  }
  if (searchParams?.search) {
    collectionUrl.searchParams.set('search', searchParams.search);
  }

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'WebVault Team' }],
    creator: 'WebVault',
    publisher: 'WebVault',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: collectionUrl.toString(),
      siteName: 'WebVault',
      locale: 'zh_CN',
      images: [
        {
          url: '/logo.svg',
          width: 1200,
          height: 630,
          alt: `${collection.title} - WebVault 集合`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@WebVault',
      images: ['/logo.svg'],
    },
    alternates: {
      canonical: collectionUrl.toString(),
    },
    other: {
      // 结构化数据标记 - Collection Schema
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Collection',
        name: collection.title,
        description: collection.description,
        url: collectionUrl.toString(),
        creator: {
          '@type': 'Organization',
          name: 'WebVault',
          url: 'https://webvault.cn',
        },
        numberOfItems: collection.websiteCount,
        dateCreated: collection.createdAt,
        dateModified: collection.updatedAt,
        inDefinedTermSet: collection.tags?.map(tag => ({
          '@type': 'DefinedTerm',
          name: tag,
        })),
        mainEntity: {
          '@type': 'ItemList',
          name: `${collection.title}中的网站`,
          description: `${collection.title}集合包含的精选网站列表`,
          numberOfItems: collection.websiteCount,
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'WebVault',
              item: 'https://webvault.cn'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: '网站集合',
              item: 'https://webvault.cn/collection'
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: collection.title,
              item: collectionUrl.toString()
            }
          ]
        }
      }),
    },
  };
}

// 默认导出
export default CollectionDetailPage;