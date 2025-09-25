/**
 * Collection Navigation Hook
 * 
 * 提供集合卡片点击导航功能的业务逻辑支持
 * 支持集合详情页面跳转、键盘导航和参数传递
 * 
 * 功能特性:
 * - 集合ID参数传递和路由跳转
 * - 键盘导航支持 (Tab切换、Enter激活)
 * - 与状态管理和URL同步集成
 * - 统一的点击和键盘事件处理
 * 
 * 需求引用:
 * - 6.1: 用户点击集合卡片的标题时系统应导航到该集合的详情页面
 * - 6.2: 用户点击集合卡片的图标或卡片主体时系统应触发相同的导航行为
 * - 6.3: 集合卡片可点击区域明确时系统应通过cursor: pointer和悬停效果表示可交互性
 * - 6.4: 导航到集合详情时系统应传递正确的集合ID参数
 * - 6.5: 用户使用键盘导航时系统应支持Tab键在集合卡片间切换和Enter键激活
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, KeyboardEvent, MouseEvent } from 'react';
import type { Collection, CollectionNavigation } from '../types/collection';

/**
 * Collection navigation configuration interface
 */
export interface CollectionNavigationConfig {
  /** Base path for collection details (default: '/collection') */
  basePath?: string;
  /** Whether to preserve current search params when navigating */
  preserveSearchParams?: boolean;
  /** Additional query parameters to append */
  additionalParams?: Record<string, string>;
  /** Custom navigation behavior callback */
  onNavigate?: (collection: Collection) => void;
  /** Navigation analytics tracking callback */
  onTrack?: (collection: Collection, source: 'click' | 'keyboard') => void;
}

/**
 * Collection navigation return interface
 */
export interface CollectionNavigationReturn {
  /** Navigate to collection detail page */
  navigateToCollection: (collection: Collection, source?: 'click' | 'keyboard') => void;
  /** Handle mouse click events on collection cards */
  handleCollectionClick: (collection: Collection) => (event: MouseEvent) => void;
  /** Handle keyboard events on collection cards */
  handleCollectionKeyDown: (collection: Collection) => (event: KeyboardEvent) => void;
  /** Get collection detail URL */
  getCollectionUrl: (collection: Collection) => string;
  /** Check if navigation is currently in progress */
  isNavigating: boolean;
  /** Generate navigation props for collection cards */
  getNavigationProps: (collection: Collection) => {
    onClick: (event: MouseEvent) => void;
    onKeyDown: (event: KeyboardEvent) => void;
    role: string;
    tabIndex: number;
    'aria-label': string;
    style: { cursor: string };
  };
}

/**
 * Default collection navigation configuration
 */
const DEFAULT_CONFIG: Required<CollectionNavigationConfig> = {
  basePath: '/collection',
  preserveSearchParams: false,
  additionalParams: {},
  onNavigate: () => {},
  onTrack: () => {},
};

/**
 * Collection Navigation Hook
 * 
 * 为集合访问功能提供统一的导航逻辑支持
 * 处理点击、键盘导航和参数传递
 * 
 * @param config - 导航配置选项
 * @returns 导航相关的方法和状态
 * 
 * @example
 * ```tsx
 * // 基础用法
 * const { handleCollectionClick, handleCollectionKeyDown } = useCollectionNavigation();
 * 
 * // 在集合卡片中使用
 * <div 
 *   onClick={handleCollectionClick(collection)}
 *   onKeyDown={handleCollectionKeyDown(collection)}
 * >
 * 
 * // 高级用法 - 自定义配置
 * const navigation = useCollectionNavigation({
 *   basePath: '/collections',
 *   preserveSearchParams: true,
 *   onTrack: (collection, source) => {
 *     analytics.track('collection_clicked', { id: collection.id, source });
 *   }
 * });
 * 
 * // 使用导航props (推荐)
 * const navProps = navigation.getNavigationProps(collection);
 * <div {...navProps}>
 * ```
 */
export function useCollectionNavigation(
  config: CollectionNavigationConfig = {}
): CollectionNavigationReturn {
  const router = useRouter();

  // 合并配置
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  /**
   * 获取集合详情页面URL
   */
  const getCollectionUrl = useCallback((collection: Collection): string => {
    const { basePath, additionalParams, preserveSearchParams } = finalConfig;
    
    // 构建基础URL
    let url = `${basePath}/${collection.id}`;
    
    // 使用slug如果存在 (SEO优化)
    if (collection.slug) {
      url = `${basePath}/${collection.slug}`;
    }
    
    // 构建查询参数
    const searchParams = new URLSearchParams();
    
    // 添加额外参数
    Object.entries(additionalParams).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
    
    // 保留当前搜索参数（如果配置启用）
    if (preserveSearchParams && typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.forEach((value, key) => {
        if (!searchParams.has(key)) {
          searchParams.set(key, value);
        }
      });
    }
    
    // 拼接完整URL
    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }, [finalConfig]);
  
  /**
   * 导航到集合详情页面
   */
  const navigateToCollection = useCallback((
    collection: Collection, 
    source: 'click' | 'keyboard' = 'click'
  ) => {
    const { onNavigate, onTrack } = finalConfig;
    
    try {
      // 执行自定义导航回调
      onNavigate(collection);
      
      // 执行分析跟踪
      onTrack(collection, source);
      
      // 获取目标URL
      const targetUrl = getCollectionUrl(collection);
      
      // 执行路由跳转
      router.push(targetUrl);
      
    } catch (error) {
      console.error('Collection navigation failed:', error, {
        collectionId: collection.id,
        collectionTitle: collection.title,
        source,
      });
      
      // 降级处理：使用原生跳转
      if (typeof window !== 'undefined') {
        window.location.href = getCollectionUrl(collection);
      }
    }
  }, [router, getCollectionUrl, finalConfig]);
  
  /**
   * 处理集合卡片点击事件
   */
  const handleCollectionClick = useCallback((collection: Collection) => {
    return (event: MouseEvent) => {
      // 阻止事件冒泡和默认行为
      event.preventDefault();
      event.stopPropagation();
      
      // 检查是否为修饰键点击 (Ctrl, Cmd, Shift)
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        // 新窗口打开集合详情
        const targetUrl = getCollectionUrl(collection);
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // 执行导航
      navigateToCollection(collection, 'click');
    };
  }, [navigateToCollection, getCollectionUrl]);
  
  /**
   * 处理集合卡片键盘事件
   */
  const handleCollectionKeyDown = useCallback((collection: Collection) => {
    return (event: KeyboardEvent) => {
      // Enter 或 Space 键激活导航
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        
        // 执行导航
        navigateToCollection(collection, 'keyboard');
      }
      
      // 支持其他键盘快捷键 (可扩展)
      // Ctrl+Enter / Cmd+Enter: 新窗口打开
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        const targetUrl = getCollectionUrl(collection);
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    };
  }, [navigateToCollection, getCollectionUrl]);
  
  /**
   * 生成集合卡片的导航属性
   */
  const getNavigationProps = useCallback((collection: Collection) => {
    return {
      onClick: handleCollectionClick(collection),
      onKeyDown: handleCollectionKeyDown(collection),
      role: 'button' as const,
      tabIndex: 0,
      'aria-label': `查看集合: ${collection.title}，包含 ${collection.websiteCount} 个网站`,
      style: { cursor: 'pointer' },
    };
  }, [handleCollectionClick, handleCollectionKeyDown]);
  
  return {
    navigateToCollection,
    handleCollectionClick,
    handleCollectionKeyDown,
    getCollectionUrl,
    isNavigating: false, // 简化实现，可以后续添加导航状态管理
    getNavigationProps,
  };
}

/**
 * Collection Navigation Utilities
 * 
 * 提供集合导航相关的工具函数
 */
export const CollectionNavigationUtils = {
  /**
   * 生成集合面包屑导航
   */
  generateBreadcrumb: (collection: Collection): CollectionNavigation => ({
    id: collection.id,
    title: collection.title,
    slug: collection.slug,
  }),
  
  /**
   * 检查集合是否可以导航
   */
  isNavigable: (collection: Collection): boolean => {
    return Boolean(collection.id && collection.status === 'active');
  },
  
  /**
   * 格式化集合URL
   */
  formatCollectionUrl: (collection: Collection, basePath: string = '/collection'): string => {
    if (collection.slug) {
      return `${basePath}/${collection.slug}`;
    }
    return `${basePath}/${collection.id}`;
  },
  
  /**
   * 解析集合URL参数
   */
  parseCollectionParams: (pathname: string): { collectionId?: string; collectionSlug?: string } => {
    const segments = pathname.split('/').filter(Boolean);
    const collectionIndex = segments.indexOf('collection');
    
    if (collectionIndex !== -1 && segments[collectionIndex + 1]) {
      const param = segments[collectionIndex + 1];
      
      // 检查是否为UUID格式 (简单判断)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param)) {
        return { collectionId: param };
      }
      
      // 否则视为slug
      return { collectionSlug: param };
    }
    
    return {};
  },
};

/**
 * Additional exports for module consumption
 * Types are already exported inline above
 */