/**
 * CollectionIndexPage 组件
 * 
 * 集合索引页面的主要组件，集成导航栏、标题区域、集合展示和页脚
 * 提供完整的集合浏览体验，包括品牌展示、集合展示、分页导航等
 * 
 * 需求引用:
 * - 1.1-1.4: 页面导航和品牌一致性 - HeaderNavigation组件集成
 * - 2.0: 页面标题区域 - CollectionHero组件集成
 * 
 * 设计模式:
 * - 复用HomePage的页面结构模式和布局系统
 * - 集成现有的HeaderNavigation和CollectionHero组件
 * - 预留集合展示和分页功能的扩展空间
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// 导入已存在的组件
import { HeaderNavigation } from './HeaderNavigation';
import { CollectionHero } from './CollectionHero';
import { Footer } from './Footer';

// 导入集合展示相关组件
import { CollectionGrid } from './CollectionGrid';
import { CollectionPagination } from './CollectionPagination';
import { CollectionErrorBoundary, CollectionGridLoadingOverlay } from './CollectionLoadingStates';

// 导入集合页面状态管理
import { 
  useCollectionData, 
  useCollectionPagination, 
  useCollectionUrlSync 
} from '../stores/collection-store';
import { CollectionCardData } from '../types/collection';

/**
 * CollectionIndexPage组件属性接口
 */
export interface CollectionIndexPageProps {
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
   * 是否显示标题区域
   * @default true
   */
  showHeroSection?: boolean;
  
  /**
   * 是否显示集合内容区域
   * @default true
   */
  showContentSection?: boolean;
  
  /**
   * 是否显示页脚区域
   * @default true
   */
  showFooter?: boolean;
}

/**
 * CollectionIndexPage 集合索引页面组件
 * 
 * 集成完整的集合页面功能：导航栏、标题区域、集合展示区域和页脚
 * 实现响应式布局，支持状态管理、平滑动画和固定导航栏
 * 提供现代化的用户体验，包含交互动画、加载效果和响应式设计
 */
export function CollectionIndexPage({
  className,
  isLoading = false,
  showNavigation = true,
  showHeroSection = true,
  showContentSection = true,
  showFooter = true,
}: CollectionIndexPageProps) {
  // Next.js路由
  const router = useRouter();
  
  // 集合数据状态管理
  const { 
    collections,
    loading: dataLoading,
    error: dataError,
    isInitialized,
    loadCollections
  } = useCollectionData();
  
  // 集合分页状态管理
  const collectionPagination = useCollectionPagination();
  
  // URL状态同步
  const { syncStoreFromUrl } = useCollectionUrlSync();
  
  // 合并loading状态
  const combinedLoading = isLoading || dataLoading;
  
  // 首次加载时初始化数据
  React.useEffect(() => {
    if (!isInitialized) {
      // 先从URL同步状态
      syncStoreFromUrl();
      // 然后加载数据
      loadCollections();
    }
  }, [isInitialized]); // 只依赖isInitialized，避免无限循环
  
  // 处理集合卡片点击 - 导航到集合详情页面
  const handleCollectionClick = (collection: CollectionCardData) => {
    try {
      // 构建集合详情页面的URL
      const detailUrl = `/collection/${collection.id}`;
      
      // 开发环境调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log('Navigating to collection detail:', {
          title: collection.title,
          id: collection.id,
          url: detailUrl
        });
      }
      
      // 导航到集合详情页面
      router.push(detailUrl);
    } catch (error) {
      console.error('Failed to navigate to collection detail:', error);
      // 如果导航失败，可以显示错误提示
      // 这里暂时只记录错误，不中断用户体验
    }
  };
  
  // 处理标签点击
  const handleTagClick = (tag: string) => {
    // TODO: 后续任务实现 - 筛选标签功能
    console.log('Tag clicked:', tag);
  };
  
  // 处理分页变化
  const handlePageChange = (page: number) => {
    collectionPagination.setPage(page);
  };
  // 滚动时的导航栏固定效果 - 复用HomePage模式
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
        // 基础页面布局 - 复用HomePage模式
        'min-h-screen bg-background',
        // 确保内容能够正确显示
        'flex flex-col',
        className
      )}
      role="main"
      aria-label="集合索引页面"
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
        {/* 标题区域 - CollectionHero组件 */}
        {showHeroSection && (
          <CollectionHero 
            className="border-b border-border"
          />
        )}
        
        {/* 集合内容展示区域 - 支持fade-in动画 */}
        {showContentSection && (
          <div className="relative">
            {/* 主内容区域 */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {/* 集合展示区域 - 包装在错误边界中 */}
              <CollectionErrorBoundary
                level="section"
                onError={(error, errorInfo) => {
                  console.error('Collection display error:', error, errorInfo);
                }}
                onRetry={() => {
                  // 重新加载集合数据
                  loadCollections();
                }}
              >
                <div 
                  className={cn(
                    "mb-8 transition-all duration-300 ease-in-out relative",
                    combinedLoading && "opacity-70"
                  )} 
                  aria-label="集合展示区域"
                >
                  <CollectionGrid
                    collections={collections}
                    isLoading={combinedLoading && !isInitialized}
                    isError={!!dataError}
                    error={dataError || undefined}
                    onCollectionClick={handleCollectionClick}
                    onTagClick={handleTagClick}
                    className={cn(
                      // 页面内容切换动画
                      'transition-all duration-300 ease-in-out',
                      // 确保正确的网格布局已在CollectionGrid内部实现
                    )}
                  />

                  {/* 加载遮罩层 - 用于分页切换时的加载状态 */}
                  <CollectionGridLoadingOverlay 
                    isLoading={combinedLoading && isInitialized}
                    text="正在更新集合..."
                  />
                </div>
              </CollectionErrorBoundary>

              {/* 分页导航区域 */}
              {!combinedLoading && collections && collections.length > 0 && collectionPagination.totalPages > 1 && (
                <div 
                  className={cn(
                    "mt-8 mb-12 transition-all duration-300 ease-in-out",
                    "animate-in fade-in-50 slide-in-from-bottom-4"
                  )} 
                  aria-label="分页导航区域"
                >
                  <CollectionPagination
                    currentPage={collectionPagination.currentPage}
                    totalPages={collectionPagination.totalPages}
                    totalItems={collectionPagination.totalItems}
                    itemsPerPage={collectionPagination.itemsPerPage}
                    onPageChange={handlePageChange}
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
      
      {/* 全局加载状态覆盖层 - 复用HomePage模式 */}
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
              <p className="text-sm text-muted-foreground animate-pulse">正在加载集合...</p>
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
 * CollectionIndexPage组件默认导出
 * 提供向后兼容性
 */
export default CollectionIndexPage;