/**
 * HomePage 组件
 * 
 * WebVault网站目录首页的主要组件，集成导航栏、主要内容区域和搜索功能
 * 提供完整的首页体验，包括品牌展示、网站搜索、分类筛选和网站展示
 * 
 * 需求引用:
 * - 1.0: 导航栏 - HeaderNavigation组件集成
 * - 2.0: 搜索功能 - HeroSection搜索表单集成
 * - 3.0: 分类导航系统 - SidebarFilters组件集成
 * - 5.0: 网站卡片展示 - WebsiteGrid组件集成
 * - 6.0: 分页导航 - Pagination组件集成
 * - 7.0: 社区订阅功能 - NewsletterSection组件集成
 * - 8.0: 页脚信息展示 - Footer组件集成
 * - 9.0: 精确配色系统 - 使用HSL主题色彩
 * - 11.0: 布局和间距系统 - 响应式布局设计
 * - 12.0: 交互效果和动画 - 平滑过渡、固定导航栏、加载动画
 * - 13.0: 字体和排版规范 - 统一的排版和字体系统
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// 导入已存在的组件
import { HeaderNavigation } from './HeaderNavigation';
import { HeroSection } from './HeroSection';
import { SidebarFilters } from './SidebarFilters';
import { WebsiteGrid } from './WebsiteGrid';
import { Pagination } from './Pagination';
import { NewsletterSection } from './NewsletterSection';
import { Footer } from './Footer';

// 导入hooks和类型
// TODO: 暂时禁用，等 nuqs 配置完成后恢复
// import { useHomepageStore, useHomepageUrlSync } from '../stores/homepage-store';
import { WebsiteCardData } from '../types/website';
import { getMockWebsites } from '../data/mockWebsites';

/**
 * HomePage组件属性接口
 */
export interface HomePageProps {
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
   * 是否显示主要内容区域
   * @default true
   */
  showHeroSection?: boolean;
  
  /**
   * 网站数据列表
   */
  websites?: WebsiteCardData[];
  
  /**
   * 是否显示内容筛选和展示区域
   * @default true
   */
  showContentSection?: boolean;
  
  /**
   * 是否显示Newsletter订阅区域
   * @default true
   */
  showNewsletterSection?: boolean;
  
  /**
   * 是否显示页脚区域
   * @default true
   */
  showFooter?: boolean;
  
  /**
   * 网站数据获取错误
   */
  websitesError?: string;
  
  /**
   * 网站卡片点击回调
   */
  onWebsiteVisit?: (website: WebsiteCardData) => void;
  
  /**
   * 标签点击回调
   */
  onTagClick?: (tag: string) => void;
  
  /**
   * 分页回调
   */
  onPageChange?: (page: number) => void;
  
  /**
   * Newsletter订阅成功回调
   */
  onNewsletterSubscribe?: (email: string) => void;
}

/**
 * HomePage 主页组件
 * 
 * 集成完整的首页功能：导航栏、Hero区域、筛选侧边栏、网站展示、订阅区域和页脚
 * 实现响应式布局，支持侧边栏折叠、状态管理、平滑动画和固定导航栏
 * 提供现代化的用户体验，包含交互动画、加载效果和响应式设计
 */
export function HomePage({
  className,
  isLoading = false,
  showNavigation = true,
  showHeroSection = true,
  websites,
  showContentSection = true,
  showNewsletterSection = true,
  showFooter = true,
  websitesError,
  onWebsiteVisit,
  onTagClick,
  onPageChange,
  onNewsletterSubscribe,
}: HomePageProps) {
  // TODO: 暂时禁用状态管理 hooks，等 nuqs 配置完成后恢复
  // const { ui } = useHomepageStore();
  // const { syncStoreFromUrl } = useHomepageUrlSync();

  // 使用模拟数据作为默认值，如果没有提供 websites prop
  const displayWebsites = websites || getMockWebsites(12);

  // 更新分页状态以反映当前数据
  React.useEffect(() => {
    if (displayWebsites) {
      // 这里可以添加更新分页总数的逻辑
      // 暂时使用静态值，后续可以根据实际数据动态计算
    }
  }, [displayWebsites]);

  // 移动端侧边栏状态
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // TODO: 暂时禁用URL状态同步
  // React.useEffect(() => {
  //   syncStoreFromUrl();
  // }, [syncStoreFromUrl]);

  // 滚动时的导航栏固定效果
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

  // 处理移动端侧边栏切换
  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  // 处理网站卡片点击
  const handleWebsiteVisit = (website: WebsiteCardData) => {
    onWebsiteVisit?.(website);
    // 可以在这里添加访问统计逻辑
  };

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    onTagClick?.(tag);
    // 可以在这里添加标签筛选逻辑
  };

  return (
    <div 
      className={cn(
        // 基础页面布局
        'min-h-screen bg-background',
        // 确保内容能够正确显示
        'flex flex-col',
        className
      )}
      role="main"
      aria-label="WebVault首页"
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
        {/* Hero Section - 品牌展示和搜索 */}
        {showHeroSection && (
          <HeroSection 
            isLoading={isLoading}
            className="border-b border-border"
          />
        )}
        
        {/* 内容筛选和展示区域 - 支持fade-in动画 */}
        {showContentSection && (
          <div className="relative">
            {/* 主内容区域 */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {/* 筛选控制区域 */}
              <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:gap-8">
                {/* 左侧筛选面板 */}
                <div className="lg:w-64 lg:flex-shrink-0">
                  <SidebarFilters
                    isMobileCollapsed={!isMobileSidebarOpen}
                    onMobileToggle={handleMobileSidebarToggle}
                    isLoading={isLoading}
                  />
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 min-w-0">
                  {/* 移动端筛选按钮 - 增强交互动画 */}
                  <div className="mb-6 lg:hidden">
                    <button
                      onClick={handleMobileSidebarToggle}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2",
                        "bg-primary text-primary-foreground rounded-lg",
                        "btn-primary-animated"
                      )}
                      aria-label="打开筛选面板"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      筛选器
                    </button>
                  </div>

                  {/* 网站展示网格 - 增强动画效果 */}
                  <div 
                    className={cn(
                      "mb-8 pagination-transition",
                      isLoading && "loading"
                    )} 
                    aria-label="网站展示区域"
                  >
                    <WebsiteGrid
                      websites={displayWebsites}
                      isLoading={isLoading && !displayWebsites?.length}
                      isError={!!websitesError}
                      error={websitesError}
                      onVisitWebsite={handleWebsiteVisit}
                      onTagClick={handleTagClick}
                      className={cn(
                        // 确保网格正确响应式布局
                        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                        // 间距使用项目标准
                        'gap-6',
                        // 添加内容切换动画
                        'transition-all duration-300 ease-in-out'
                      )}
                    />
                  </div>

                  {/* 分页导航 - 增强切换动画 */}
                  {!isLoading && displayWebsites && displayWebsites.length > 0 && (
                    <div 
                      className={cn(
                        "mt-8 transition-all duration-300 ease-in-out",
                        "animate-in fade-in-50 slide-in-from-bottom-4"
                      )} 
                      aria-label="分页导航区域"
                    >
                      <Pagination
                        onPageChange={onPageChange}
                        className={cn(
                          "border-t border-border pt-8",
                          "transition-all duration-200 ease-in-out"
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Newsletter订阅区域 - 支持平滑动画过渡 */}
        {showNewsletterSection && (
          <div 
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: isLoading ? 0.7 : 1,
              transform: isLoading ? 'translateY(10px)' : 'translateY(0px)'
            }}
          >
            <NewsletterSection
              isLoading={isLoading}
              onSubscribeSuccess={onNewsletterSubscribe}
              className="transition-all duration-500 ease-in-out"
            />
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
      
      {/* 全局加载状态覆盖层 - 增强subtile加载动画 */}
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
              <p className="text-sm text-muted-foreground animate-pulse">加载中...</p>
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
 * HomePage组件默认导出
 * 提供向后兼容性
 */
export default HomePage;