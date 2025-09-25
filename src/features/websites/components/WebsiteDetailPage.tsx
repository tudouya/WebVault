"use client";

/**
 * WebsiteDetailPage 组件
 * 
 * 网站详情页面的主容器组件，协调所有子组件和状态管理
 * 集成导航栏、面包屑、网站详情内容、信息栏、相关推荐和页脚
 * 提供完整的网站浏览体验，包括响应式布局和访问统计功能
 * 
 * 需求引用:
 * - AC-2.1.1: 网站完整标题和描述内容展示
 * - AC-2.2.1: 面包屑导航显示
 * - AC-2.3.1: 发布者信息展示
 * - AC-2.4.1: "访问网站"操作按钮
 * - AC-2.4.3: 访问统计记录
 * - AC-2.5.1: 相关推荐区域展示
 * - AC-2.6.3: 主导航栏显示
 * 
 * 设计模式:
 * - 复用 BlogDetailPage 的页面结构模式和滚动状态管理
 * - 集成现有的 HeaderNavigation 和 Footer 组件
 * - 基于 Feature First Architecture 实现模块化组件组织
 * - 支持面包屑导航和网站上下文信息
 */

import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// 导入通用布局组件
import { HeaderNavigation } from './HeaderNavigation';
import { Footer } from './Footer';

// 导入网站详情页面的子组件
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { WebsiteDetailHero } from './WebsiteDetailHero';
import { WebsiteDetailContent } from './WebsiteDetailContent';
import { WebsiteDetailInfo } from './WebsiteDetailInfo';
import { RelatedWebsiteGrid } from './RelatedWebsiteGrid';

// 导入类型定义
import type { WebsiteDetailData } from '../types/detail';
import type { WebsiteCardData } from '../types/website';

// 导入服务层
import { trackWebsiteVisit } from '../services/websiteDetailService';

// 导入错误边界组件
import { withErrorBoundary } from './ErrorBoundary';

// 导入样式文件以确保动画和无障碍颜色可用
import '../styles/animations.css';
import '../styles/accessibility-colors.css';

/**
 * WebsiteDetailPage组件属性接口
 */
export interface WebsiteDetailPageProps {
  /**
   * 网站详情数据
   */
  initialData: WebsiteDetailData;
  
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
   * 是否显示面包屑导航
   * @default true
   */
  showBreadcrumb?: boolean;
  
  /**
   * 是否显示页脚区域
   * @default true
   */
  showFooter?: boolean;
  
  /**
   * 网站访问回调
   * 可用于自定义访问统计或分析
   */
  onWebsiteVisit?: (websiteId: string, url: string) => void | Promise<void>;
  
  /**
   * 标签点击回调
   */
  onTagClick?: (tag: string) => void;
  
  /**
   * 面包屑点击回调
   */
  onBreadcrumbClick?: (path: string) => void;
}

/**
 * WebsiteDetailPage 网站详情页面主容器组件
 * 
 * 提供完整的网站详情浏览体验，包括：
 * - 响应式布局设计（移动端单列，桌面端双列）
 * - 面包屑导航和网站上下文信息
 * - 网站详情展示和发布者信息
 * - 访问统计记录和相关网站推荐
 * - 集成导航栏和页脚组件
 * - 支持主题切换和动画效果
 * 
 * 基于现有 BlogDetailPage 的成熟模式，确保代码一致性和可维护性
 */
function WebsiteDetailPageComponent({
  initialData,
  className,
  isLoading = false,
  showNavigation = true,
  showBreadcrumb = true,
  showFooter = true,
  onWebsiteVisit,
  onTagClick,
  onBreadcrumbClick,
}: WebsiteDetailPageProps) {
  
  // 滚动时的导航栏固定效果 - 复用 BlogDetailPage 模式
  const [isScrolled, setIsScrolled] = useState(false);
  const [visitUpdateLoading, setVisitUpdateLoading] = useState(false);
  
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

  /**
   * 处理网站访问事件
   * AC-2.4.3: 访问统计记录
   */
  const handleWebsiteVisit = useCallback(async (websiteId: string, url: string) => {
    try {
      setVisitUpdateLoading(true);
      
      // 执行自定义访问回调（如果提供）
      if (onWebsiteVisit) {
        await onWebsiteVisit(websiteId, url);
      }
      
      // 记录访问统计
      const result = await trackWebsiteVisit(websiteId);
      
      if (!result.success && result.error) {
        console.warn('Visit tracking failed:', result.error);
        // 访问统计失败不应中断用户体验，继续正常流程
      }
      
    } catch (error) {
      console.error('Failed to handle website visit:', error);
      // 错误情况下不阻止用户访问网站
    } finally {
      setVisitUpdateLoading(false);
    }
  }, [onWebsiteVisit]);

  /**
   * 处理相关网站访问
   */
  const handleRelatedWebsiteVisit = useCallback((website: WebsiteCardData) => {
    handleWebsiteVisit(website.id, website.url);
  }, [handleWebsiteVisit]);

  return (
    <div 
      className={cn(
        // 基础页面布局 - 复用 BlogDetailPage 模式
        'min-h-screen bg-background',
        // 确保内容能够正确显示
        'flex flex-col',
        // 网站详情页面淡入动画
        'website-detail-fade-in',
        className
      )}
      role="document"
      aria-label="网站详情页面"
    >
      {/* Skip Links for Accessibility */}
      <div className="sr-only focus-within:not-sr-only">
        <a 
          href="#main-content"
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform transform -translate-y-full focus:translate-y-0"
          aria-label="跳转到主要内容"
        >
          跳转到主要内容
        </a>
        <a 
          href="#website-info"
          className="fixed top-4 left-32 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform transform -translate-y-full focus:translate-y-0"
          aria-label="跳转到网站信息"
        >
          跳转到网站信息
        </a>
        <a 
          href="#related-websites"
          className="fixed top-4 left-60 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform transform -translate-y-full focus:translate-y-0"
          aria-label="跳转到相关推荐"
        >
          跳转到相关推荐
        </a>
      </div>
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
      <main 
        id="main-content"
        className="flex-1"
        role="main"
        aria-label="网站详情主要内容"
      >
        <div className="relative">
          {/* 主内容容器 - 使用最大宽度和响应式边距 */}
          <div 
            id="website-detail-top"
            className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12"
          >
            
            {/* 面包屑导航区域 - AC-2.2.1: 面包屑导航显示 */}
            {showBreadcrumb && (
              <div className="pt-8 sm:pt-12 lg:pt-16 pb-6">
                <BreadcrumbNavigation
                  website={{
                    title: initialData.title,
                    id: initialData.id,
                    category: initialData.category
                  }}
                  onBreadcrumbClick={onBreadcrumbClick}
                  className={cn(
                    "website-detail-fade-in",
                    isLoading && "opacity-70"
                  )}
                />
              </div>
            )}

            {/* 网站详情内容区域 */}
            <div 
              id="website-info"
              className={cn(
                "mb-12 sm:mb-16 lg:mb-20",
                // 内容淡入动画
                "website-detail-fade-in",
                isLoading && "opacity-70"
              )}
              role="region"
              aria-labelledby="website-hero-heading"
              aria-describedby="website-hero-description"
            >
              
              {/* 英雄区域 - AC-2.1.1, AC-2.4.1: 网站信息展示和访问按钮 */}
              <div className="mb-8 lg:mb-12">
                <WebsiteDetailHero
                  website={initialData}
                  onVisit={handleWebsiteVisit}
                  className="website-detail-fade-in"
                />
              </div>
              
              {/* 桌面端双列布局，移动端单列布局 - 响应式设计 */}
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                
                {/* 主要内容区域 */}
                <div className="lg:col-span-8">
                  <WebsiteDetailContent
                    website={initialData}
                    className="mb-8 lg:mb-0"
                  />
                </div>

                {/* 右侧信息栏 - 桌面端显示，移动端显示在内容下方 */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
                  <div className="space-y-6">
                    {/* AC-2.3.1: 发布者信息展示 */}
                    <WebsiteDetailInfo
                      website={initialData}
                      onTagClick={onTagClick}
                      className="website-detail-fade-in"
                    />
                    
                    {/* 访问统计状态指示 */}
                    {visitUpdateLoading && (
                      <div 
                        className="bg-card border rounded-lg p-4 text-center"
                        role="status"
                        aria-live="polite"
                        aria-label="更新访问统计中"
                      >
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                          <div className="h-3 w-3 animate-spin rounded-full border border-primary/30 border-t-primary" />
                          <span>更新访问统计中...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 相关网站推荐区域 - AC-2.5.1: 相关推荐区域展示 */}
            {initialData.related_websites && initialData.related_websites.length > 0 && (
              <div 
                id="related-websites"
                className={cn(
                  "mb-12 sm:mb-16 lg:mb-20",
                  "website-detail-fade-in",
                  isLoading && "opacity-70"
                )}
                role="region"
                aria-labelledby="related-websites-heading"
              >
                <RelatedWebsiteGrid
                  relatedWebsites={initialData.related_websites}
                  onVisitWebsite={handleRelatedWebsiteVisit}
                  onTagClick={onTagClick}
                  title="相关推荐"
                  maxItems={6}
                  className="website-detail-fade-in"
                />
              </div>
            )}
          </div>
        </div>
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
      
      {/* 全局加载状态覆盖层 - 复用 BlogDetailPage 模式 */}
      {isLoading && (
        <div 
          className={cn(
            "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
            "flex items-center justify-center",
            "transition-all duration-300 ease-in-out",
            "animate-in fade-in-0"
          )}
          role="status"
          aria-live="assertive"
          aria-label="页面加载中"
          aria-busy="true"
        >
          <div className="flex flex-col items-center space-y-4 animate-in slide-in-from-bottom-4">
            {/* 增强的加载动画 - 使用脉冲效果 */}
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full border border-primary/20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground animate-pulse">正在加载网站详情...</p>
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
 * 使用错误边界包装的 WebsiteDetailPage 组件
 * 
 * 集成错误边界处理以满足 NFR-3.5.2 需求：
 * - 当网站不存在或无权访问时显示404错误页面
 * - 提供网络错误、数据错误、权限错误的优雅降级
 * - 支持错误重试和返回首页操作
 * - 页面级错误边界确保整个页面的错误处理
 */
export const WebsiteDetailPage = withErrorBoundary(WebsiteDetailPageComponent, {
  level: 'page',
  onError: (error, errorInfo) => {
    // 在开发环境中记录错误详情
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 WebsiteDetailPage Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
    
    // 这里可以集成错误报告服务
    // 例如: reportError(error, { component: 'WebsiteDetailPage', ...errorInfo });
  },
  resetOnPropsChange: true,
  isolate: true,
});

/**
 * WebsiteDetailPage组件默认导出
 * 提供向后兼容性
 */
export default WebsiteDetailPage;
