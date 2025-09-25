/**
 * BrowsablePageLayout核心布局组件
 * 
 * 实现配置驱动的页面布局容器，支持集合详情页、分类浏览页和标签浏览页
 * 通过BrowsablePageConfig统一配置，实现90%+代码复用
 * 
 * 需求引用:
 * - 需求1.1: 集合页面加载并显示集合详细信息和包含的网站列表
 * - 需求2.1: 分类页面显示"CATEGORY"标识和"Explore by categories"标题
 * - 需求3.1: 标签页面显示"TAG"标识和"Explore by tags"标题
 * - 需求4.1: 任一页面显示网站卡片时复用现有的WebsiteCard组件设计
 * - 需求5.1: 桌面端使用3列网格布局展示网站卡片
 */

'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

// 导入子组件
import { PageHeader } from './PageHeader';
import { FilterTabs, type FilterTabItem } from './FilterTabs';
import { SortDropdown, type SortOption as SortDropdownOption } from './SortDropdown';
import { AdBanner } from './AdBanner';
import { WebsiteGrid } from '@/features/websites/components/WebsiteGrid';
import { Pagination } from './Pagination';
import { HeaderNavigation } from '@/features/websites/components/HeaderNavigation';
import { Footer } from '@/features/websites/components/Footer';

// 导入类型和Store
import type { BrowsablePageConfig } from '../types';
import { useBrowsablePageStore } from '../stores/browsable-page-store';
import type { SortField, SortOrder } from '@/features/websites/types/filters';

/**
 * BrowsablePageLayout组件属性接口
 */
export interface BrowsablePageLayoutProps {
  /** 页面配置对象，驱动布局渲染逻辑 */
  config: BrowsablePageConfig;
  
  /** 实体标识符（集合/分类/标签的slug） */
  entitySlug?: string;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 网站卡片访问回调 */
  onVisitWebsite?: (websiteId: string) => void;
  
  /** 标签点击回调 */
  onTagClick?: (tag: string) => void;
}

/**
 * 错误状态组件
 */
const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[400px]">
    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-destructive"
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
    <h3 className="text-lg font-semibold text-foreground mb-2">
      页面加载失败
    </h3>
    <p className="text-muted-foreground max-w-md mb-4">
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        重试
      </button>
    )}
  </div>
);

/**
 * 布局容器组件
 * 提供一致的页面容器和间距
 */
const LayoutContainer = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => (
  <div className={cn("min-h-screen bg-background", className)}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  </div>
);

/**
 * FilterControls筛选控制容器组件
 * 
 * 集成筛选标签和排序下拉菜单的业务逻辑，支持条件性渲染：
 * - FilterTabs：当存在筛选功能时显示
 * - SortDropdown：当启用排序功能时显示
 * 
 * 需求引用:
 * - 需求2.2: 分类页面加载筛选控件，提供分类筛选标签栏和排序下拉菜单
 * - 需求3.2: 标签页面加载筛选控件，提供标签筛选栏和排序下拉菜单
 * - 需求5.1: 桌面端使用3列网格布局展示网站卡片（响应式布局）
 */
const FilterControls = ({
  config,
  isLoading
}: {
  config: BrowsablePageConfig;
  isLoading: boolean;
}) => {
  const { data, filters, actions } = useBrowsablePageStore();

  // 确定筛选类型：检查启用的筛选功能
  const filterType = React.useMemo(() => {
    if (config.filters.categoryEnabled || config.filters.tagEnabled) {
      // 优先显示category类型，如果都启用的话
      return config.filters.categoryEnabled ? 'category' : 'tag';
    }
    return 'none';
  }, [config.filters.categoryEnabled, config.filters.tagEnabled]);

  // 启用排序功能检查
  const enableSorting = config.features.enableSorting && config.filters.sortEnabled;

  // 准备筛选标签数据
  const filterItems = React.useMemo(() => {
    const items: FilterTabItem[] = [
      {
        id: 'all',
        label: 'All',
        value: '',
        isDefault: true
      }
    ];

    // 根据配置添加筛选项
    if (config.filters.categoryEnabled && data?.filterOptions.categories) {
      data.filterOptions.categories.forEach(category => {
        items.push({
          id: `category-${category.id}`,
          label: category.name,
          value: category.id,
          count: config.filters.showFilterCounts ? category.websiteCount : undefined
        });
      });
    }

    if (config.filters.tagEnabled && data?.filterOptions.tags) {
      data.filterOptions.tags.forEach(tag => {
        items.push({
          id: `tag-${tag.id}`,
          label: tag.name,
          value: tag.id,
          count: config.filters.showFilterCounts ? tag.websiteCount : undefined
        });
      });
    }

    return items;
  }, [config.filters, data?.filterOptions]);

  // 当前选中的筛选值
  const selectedFilterValue = filters.categoryId || filters.selectedTags?.[0] || '';

  // 当前选中的排序选项
  const currentSortValue = `${filters.sortBy}_${filters.sortOrder}`;

  // 转换配置中的排序选项为SortDropdown兼容格式
  const sortDropdownOptions: SortDropdownOption[] = React.useMemo(() => {
    return config.filters.availableSorts.map(option => ({
      field: option.field,
      label: option.label,
      order: option.order,
      description: option.description,
      // icon字符串暂时忽略，SortDropdown会使用默认图标
    }));
  }, [config.filters.availableSorts]);

  // 筛选标签变更处理
  const handleFilterTabChange = React.useCallback((value: string) => {
    if (value === '') {
      // 清除所有筛选
      actions.setCategory(null);
      actions.setTags([]);
    } else {
      // 根据value类型设置筛选
      const categoryItem = data?.filterOptions.categories?.find(c => c.id === value);
      const tagItem = data?.filterOptions.tags?.find(t => t.id === value);
      
      if (categoryItem) {
        actions.setCategory(value);
        actions.setTags([]);
      } else if (tagItem) {
        actions.setTags([value]);
        actions.setCategory(null);
      }
    }
  }, [data?.filterOptions, actions]);

  // 排序选项变更处理
  const handleSortChange = React.useCallback((value: string) => {
    // 解析value格式 "field_order"
    const [field, order] = value.split('_') as [SortField, SortOrder];
    actions.setSorting(field, order);
  }, [actions]);

  // 如果筛选和排序都禁用，则不显示控制栏
  if (filterType === 'none' && !enableSorting) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      {/* 筛选标签 - 条件性渲染：当filterType !== 'none'时显示 */}
      {filterType !== 'none' && (
        <div className="flex-1">
          <FilterTabs 
            items={filterItems}
            selectedValue={selectedFilterValue}
            onTabChange={handleFilterTabChange}
            loading={isLoading}
            showCounts={config.filters.showFilterCounts}
            filterType={filterType as 'category' | 'tag'}
            allowDeselect={true}
          />
        </div>
      )}
      
      {/* 排序下拉框 - 条件性渲染：当enableSorting为true时显示 */}
      {enableSorting && (
        <div className="flex-shrink-0">
          <SortDropdown 
            options={sortDropdownOptions}
            value={currentSortValue}
            onValueChange={handleSortChange}
            loading={isLoading}
            placeholder={config.filters.searchPlaceholder || 'Sort by Time listed'}
          />
        </div>
      )}
    </div>
  );
};

/**
 * 内容区域组件
 * 
 * 集成WebsiteGrid组件作为筛选结果的展示区域，支持：
 * - loading、error、empty状态的用户界面显示
 * - AdBanner的条件性渲染
 * - 响应式布局和广告位置的自适应调整
 * 
 * 需求引用:
 * - 需求4.1: 任一页面显示网站卡片时复用现有的WebsiteCard组件设计
 * - 需求5.1: 桌面端使用3列网格布局展示网站卡片
 * - 需求5.6: 内容区域右侧显示广告时合理分配空间比例
 */
const ContentArea = ({ 
  config, 
  onVisitWebsite, 
  onTagClick 
}: { 
  config: BrowsablePageConfig; 
  onVisitWebsite?: (websiteId: string) => void; 
  onTagClick?: (tag: string) => void; 
}) => {
  const { data, loading, error, actions } = useBrowsablePageStore();

  // 错误状态处理
  if (error.page) {
    return (
      <ErrorState 
        message={error.page} 
        onRetry={() => actions.retryLoad()} 
      />
    );
  }

  // 准备数据状态
  const websites = data?.websites.items || [];
  const isLoading = loading.page || loading.content;
  const isError = !!error.content;
  const pagination = data?.websites.pagination;
  
  // 检查是否有侧边栏广告（需求5.6：合理分配空间比例）
  // 使用navigation.sidebar.enabled来判断是否采用侧边栏布局
  const hasSidebarAd = config.features.showAdBanner && config.navigation.sidebar.enabled;
  
  return (
    <div className={cn(
      "space-y-6",
      // 需求5.6: 内容区域右侧显示广告时合理分配空间比例
      hasSidebarAd && "lg:flex lg:gap-8 lg:space-y-0"
    )}>
      {/* 主内容区域 */}
      <div className={cn(
        "min-w-0", // 防止flex布局溢出
        hasSidebarAd ? "lg:flex-1" : "w-full"
      )}>
        {/* 顶部广告横幅 - 条件性渲染 */}
        {config.features.showAdBanner && !hasSidebarAd && (
          <div className="mb-6">
            <AdBanner 
              displayType="inline"
              enabled={config.features.showAdBanner}
              adSlot="above_content"
              showAdLabel={true}
            />
          </div>
        )}
        
        {/* 网站网格 - 集成WebsiteGrid组件作为筛选结果的展示区域 */}
        <WebsiteGrid
          websites={websites}
          isLoading={isLoading}
          isError={isError}
          error={error.content}
          onVisitWebsite={(website) => onVisitWebsite?.(website.id)}
          onTagClick={onTagClick}
          hasMore={pagination?.hasNextPage || false}
          isLoadingMore={loading.content}
          onLoadMore={() => actions.goToNextPage()}
          className={cn(
            "page-fade-in",
            // 需求5.1: 桌面端使用3列网格布局，需求5.6: 有侧边栏时调整网格列数
            hasSidebarAd && "lg:grid-cols-2 xl:grid-cols-3"
          )}
        />
        
        {/* 分页导航 - 条件性渲染：当enablePagination为true时显示 */}
        {config.features.enablePagination && pagination && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={data?.websites.totalCount || 0}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={(page) => actions.setPage(page)}
              scrollToTop={true}
              scrollTarget="main"
            />
          </div>
        )}
        
        {/* 底部广告横幅 - 条件性渲染 */}
        {config.features.showAdBanner && !hasSidebarAd && (
          <div className="mt-6">
            <AdBanner 
              displayType="inline"
              enabled={config.features.showAdBanner}
              adSlot="below_content"
              showAdLabel={true}
            />
          </div>
        )}
      </div>
      
      {/* 侧边栏广告区域 - 响应式布局和广告位置的自适应调整 */}
      {hasSidebarAd && (
        <aside className={cn(
          "lg:w-80 lg:flex-shrink-0", // 固定宽度320px，不缩放
          "space-y-6" // 垂直间距
        )}>
          {/* 侧边栏广告 */}
          <AdBanner 
            displayType="sidebar"
            enabled={config.features.showAdBanner}
            adSlot="sidebar_primary"
            showAdLabel={true}
            className="sticky top-4" // 粘性定位
          />
          
          {/* 可选的第二个侧边栏广告 - 使用相关区域配置判断 */}
          {config.navigation.related.showSimilar && (
            <AdBanner 
              displayType="sidebar"
              enabled={config.features.showAdBanner}
              adSlot="sidebar_secondary"
              showAdLabel={true}
            />
          )}
        </aside>
      )}
    </div>
  );
};

/**
 * BrowsablePageLayout组件
 * 
 * 配置驱动的页面布局容器，支持：
 * - 集合详情页面显示
 * - 分类浏览页面渲染
 * - 标签浏览页面展示
 * - 响应式布局和移动端适配
 * - 统一的加载、错误、空状态处理
 * - 完整的页面结构（HeaderNavigation + 内容 + Footer）
 */
export function BrowsablePageLayout({
  config,
  entitySlug,
  className,
  onVisitWebsite,
  onTagClick,
}: BrowsablePageLayoutProps) {
  const { 
    data, 
    loading, 
    error, 
    meta,
    actions 
  } = useBrowsablePageStore();

  // 滚动状态管理（用于导航栏固定效果）
  const [isScrolled, setIsScrolled] = React.useState(false);
  
  useEffect(() => {
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

  // 组件挂载时设置配置并加载数据
  useEffect(() => {
    // 设置页面配置
    actions.setConfig(config);
    
    // 如果有entitySlug且未初始化，则加载数据
    if (entitySlug && !meta.isInitialized) {
      actions.loadData(entitySlug);
    }
  }, [config, entitySlug, meta.isInitialized, actions]);

  // 页面级错误状态
  if (error.page && !loading.page) {
    return (
      <div className={cn('min-h-screen bg-background flex flex-col', className)}>
        {/* 导航栏 */}
        <div className={cn(
          "navbar-fixed",
          isScrolled && "navbar-scrolled"
        )}>
          <HeaderNavigation />
        </div>
        
        {/* 错误内容 */}
        <main className="flex-1">
          <LayoutContainer>
            <ErrorState 
              message={error.page} 
              onRetry={() => actions.retryLoad()} 
            />
          </LayoutContainer>
        </main>
        
        {/* 页脚 */}
        <Footer />
      </div>
    );
  }

  // 准备PageHeader的props
  const entity = data?.entity;
  const pageHeaderProps = {
    pageType: config.pageType,
    title: entity?.name || '',
    subtitle: undefined, // hero配置中没有subtitle，使用PageHeader默认逻辑
    description: entity?.description,
    stats: entity?.stats ? {
      count: entity.stats.websiteCount,
      label: '个网站'
    } : undefined,
    isLoading: loading.page,
  };

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
      aria-label="浏览页面"
    >
      {/* 导航栏区域 - 固定定位和平滑过渡 */}
      <div className={cn(
        "navbar-fixed",
        isScrolled && "navbar-scrolled"
      )}>
        <HeaderNavigation />
      </div>
      
      {/* 主要内容区域 */}
      <main className="flex-1">
        <LayoutContainer className="space-y-8">
          {/* 页面标题区域 */}
          {config.hero.enabled && (
            <PageHeader {...pageHeaderProps} />
          )}
          
          {/* 内容区域 */}
          <div className="space-y-8">
            {/* 筛选控制栏 */}
            <FilterControls 
              config={config} 
              isLoading={loading.page || loading.filters} 
            />
            
            {/* 内容展示区域 */}
            <ContentArea
              config={config}
              onVisitWebsite={onVisitWebsite}
              onTagClick={onTagClick}
            />
          </div>
        </LayoutContainer>
      </main>
      
      {/* 页脚区域 - 支持平滑动画过渡 */}
      <div 
        className="transition-all duration-300 ease-in-out"
        style={{
          opacity: loading.page ? 0.7 : 1,
          transform: loading.page ? 'translateY(10px)' : 'translateY(0px)'
        }}
      >
        <Footer 
          className="transition-all duration-500 ease-in-out"
        />
      </div>
      
      {/* 全局加载状态覆盖层 */}
      {loading.page && !meta.isInitialized && (
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
              <p className="text-sm text-muted-foreground animate-pulse">正在加载页面...</p>
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

export default BrowsablePageLayout;