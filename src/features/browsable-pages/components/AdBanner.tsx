/**
 * AdBanner组件
 * 
 * 为browsable pages提供广告显示功能，支持条件性显示和多种展示方式
 * 根据BrowsablePageConfig.features.showAdBanner配置控制是否显示
 * 
 * 需求引用:
 * - 需求1.4: 集合页面包含广告位时，在合适位置展示AD内容
 * - 需求2.1: 分类页面显示"CATEGORY"标识和"Explore by categories"标题  
 * - 需求3.1: 标签页面显示"TAG"标识和"Explore by tags"标题
 * - 需求5.6: 内容区域右侧显示广告时合理分配空间比例
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/features/websites/components/LoadingStates';
import { AlertCircle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/* ========================================
   类型定义
   ======================================== */

/**
 * 广告展示方式
 */
export type AdDisplayType = 'sidebar' | 'inline';

/**
 * 广告数据结构
 */
export interface AdData {
  /** 广告唯一标识 */
  id: string;
  /** 广告标题 */
  title: string;
  /** 广告描述 */
  description?: string;
  /** 广告图片URL */
  imageUrl?: string;
  /** 广告链接URL */
  linkUrl?: string;
  /** 广告来源/品牌 */
  source?: string;
  /** 广告类型 */
  type?: 'banner' | 'card' | 'sponsored' | 'native';
  /** 是否在新窗口打开 */
  openInNewTab?: boolean;
  /** 广告失效时间 */
  expiresAt?: string;
  /** 自定义样式 */
  customStyles?: React.CSSProperties;
}

/**
 * AdBanner组件属性接口
 */
export interface AdBannerProps {
  /** 广告展示方式 */
  displayType: AdDisplayType;
  
  /** 是否显示广告（来自config.features.showAdBanner） */
  enabled?: boolean;
  
  /** 广告数据，可选：支持静态配置或动态获取 */
  adData?: AdData;
  
  /** 广告位标识，用于获取对应广告内容 */
  adSlot?: string;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 广告点击回调 */
  onAdClick?: (ad: AdData) => void;
  
  /** 广告关闭回调（仅部分展示类型支持） */
  onAdClose?: (adId: string) => void;
  
  /** 是否允许关闭广告 */
  dismissible?: boolean;
  
  /** 是否显示"广告"标识 */
  showAdLabel?: boolean;
  
  /** 自定义错误信息 */
  errorMessage?: string;
  
  /** 自定义占位符内容 */
  placeholder?: React.ReactNode;
}

/* ========================================
   工具函数
   ======================================== */

/**
 * 模拟广告数据获取API
 * 实际项目中应该从真实的广告服务获取
 */
async function fetchAdData(adSlot: string): Promise<AdData | null> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  
  // 模拟不同广告位的不同内容
  const mockAds: Record<string, AdData> = {
    'collection-sidebar': {
      id: 'ad-collection-001',
      title: 'Developer Tools Bundle',
      description: 'Boost your productivity with our curated collection of professional development tools.',
      imageUrl: '/assets/temp/ad-developer-tools.png',
      linkUrl: 'https://example.com/dev-tools',
      source: 'DevTools Pro',
      type: 'sponsored',
      openInNewTab: true,
    },
    'category-inline': {
      id: 'ad-category-001', 
      title: 'Web Design Resources',
      description: 'Premium design assets and templates for modern web development.',
      imageUrl: '/assets/temp/ad-design-resources.png',
      linkUrl: 'https://example.com/design-resources',
      source: 'DesignHub',
      type: 'banner',
      openInNewTab: true,
    },
    'tag-sidebar': {
      id: 'ad-tag-001',
      title: 'JavaScript Masterclass',
      description: 'Learn advanced JavaScript concepts with our comprehensive online course.',
      linkUrl: 'https://example.com/js-course',
      source: 'CodeAcademy',
      type: 'native',
      openInNewTab: true,
    }
  };
  
  // 模拟一些获取失败的情况（仅在测试环境）
  if (process.env.NODE_ENV === 'test' && Math.random() < 0.1) {
    throw new Error('Failed to fetch ad data');
  }
  
  // 开发环境中不再模拟网络错误，确保稳定的开发体验
  
  return mockAds[adSlot] || null;
}

/**
 * 验证广告数据是否有效
 */
function isValidAdData(ad: AdData): boolean {
  if (!ad.id || !ad.title) return false;
  
  // 检查广告是否已过期
  if (ad.expiresAt && new Date(ad.expiresAt) < new Date()) {
    return false;
  }
  
  return true;
}

/* ========================================
   子组件
   ======================================== */

/**
 * 广告加载状态组件
 */
const AdLoadingState = ({ displayType, className }: { 
  displayType: AdDisplayType; 
  className?: string; 
}) => (
  <Card className={cn(
    'border border-border bg-muted/30',
    displayType === 'sidebar' ? 'w-full' : 'max-w-md mx-auto',
    className
  )}>
    <CardContent className="p-6">
      <div className="animate-pulse">
        {displayType === 'sidebar' ? (
          // Sidebar广告骨架屏 
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        ) : (
          // Inline广告骨架屏
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-center">
        <LoadingSpinner size="sm" text="Loading ad..." />
      </div>
    </CardContent>
  </Card>
);

/**
 * 广告错误状态组件
 */
const AdErrorState = ({ 
  displayType, 
  errorMessage, 
  onRetry, 
  className 
}: {
  displayType: AdDisplayType;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}) => (
  <Card className={cn(
    'border border-destructive/20 bg-destructive/5',
    displayType === 'sidebar' ? 'w-full' : 'max-w-md mx-auto',
    className
  )}>
    <CardContent className="p-6 text-center">
      <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
      <p className="text-sm text-destructive mb-3">
        {errorMessage || 'Failed to load advertisement'}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="text-destructive border-destructive hover:bg-destructive/10"
        >
          Retry
        </Button>
      )}
    </CardContent>
  </Card>
);

/**
 * 广告内容渲染组件
 */
const AdContent = ({ 
  ad, 
  displayType, 
  showAdLabel, 
  dismissible,
  onAdClick, 
  onAdClose,
  className 
}: {
  ad: AdData;
  displayType: AdDisplayType;
  showAdLabel?: boolean;
  dismissible?: boolean;
  onAdClick?: (ad: AdData) => void;
  onAdClose?: (adId: string) => void;
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [ad.imageUrl]);

  const handleClick = () => {
    onAdClick?.(ad);
    
    // 如果有链接，打开链接
    if (ad.linkUrl) {
      if (ad.openInNewTab) {
        window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        // 使用location.assign在测试环境中更好处理
        if (typeof window !== 'undefined') {
          window.location.assign(ad.linkUrl);
        }
      }
    }
  };
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdClose?.(ad.id);
  };
  
  return (
    <Card className={cn(
      'border border-border bg-card hover:shadow-md transition-all duration-200',
      displayType === 'sidebar' ? 'w-full' : 'max-w-md mx-auto',
      ad.linkUrl && 'cursor-pointer hover:border-primary/30',
      className
    )} onClick={ad.linkUrl ? handleClick : undefined}>
      <CardContent className="p-6">
        {/* 广告标签和关闭按钮 */}
        <div className="flex items-center justify-between mb-4">
          {showAdLabel && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
              SPONSORED
            </span>
          )}
          {dismissible && onAdClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* 广告图片 */}
        {ad.imageUrl && !imageError && (
          <div
            className={cn(
              'relative mb-4 overflow-hidden rounded-md',
              displayType === 'sidebar' ? 'h-32' : 'h-24'
            )}
          >
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              className="object-cover"
              fill
              sizes={displayType === 'sidebar' ? '(min-width: 768px) 16rem, 100vw' : '(min-width: 768px) 24rem, 100vw'}
              onError={() => setImageError(true)}
              unoptimized
            />
          </div>
        )}
        
        {/* 广告标题 */}
        <h3 className={cn(
          'font-semibold text-foreground mb-2',
          displayType === 'sidebar' ? 'text-base' : 'text-sm'
        )}>
          {ad.title}
        </h3>
        
        {/* 广告描述 */}
        {ad.description && (
          <p className={cn(
            'text-muted-foreground mb-4',
            displayType === 'sidebar' ? 'text-sm' : 'text-xs'
          )}>
            {ad.description}
          </p>
        )}
        
        {/* 广告来源和行动按钮 */}
        <div className="flex items-center justify-between">
          {ad.source && (
            <span className="text-xs text-muted-foreground">
              by {ad.source}
            </span>
          )}
          {ad.linkUrl && (
            <Button 
              variant="outline" 
              size="sm"
              className="ml-auto"
            >
              Learn More
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ========================================
   主组件
   ======================================== */

/**
 * AdBanner组件
 * 
 * 提供灵活的广告显示功能，支持多种展示方式和配置选项
 * 根据config.features.showAdBanner控制是否显示
 */
export function AdBanner({
  displayType = 'sidebar',
  enabled = false,
  adData,
  adSlot,
  className,
  onAdClick,
  onAdClose,
  dismissible = false,
  showAdLabel = true,
  errorMessage,
  placeholder
}: AdBannerProps) {
  const [currentAd, setCurrentAd] = useState<AdData | null>(adData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  /**
   * 获取广告数据
   */
  const loadAdData = React.useCallback(async () => {
    if (!adSlot && !adData) return;

    setIsLoading(true);
    setError(null);

    try {
      let ad: AdData | null = null;

      if (adData) {
        // 使用传入的静态广告数据
        ad = adData;
      } else if (adSlot) {
        // 动态获取广告数据
        ad = await fetchAdData(adSlot);
      }

      if (ad && isValidAdData(ad)) {
        setCurrentAd(ad);
      } else {
        setError('No valid advertisement available');
      }
    } catch (err) {
      console.error('Failed to load ad data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load advertisement';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [adSlot, adData]);

  // 初始化时验证和加载广告数据
  useEffect(() => {
    if (adData) {
      // 对于传入的静态数据，立即验证
      if (isValidAdData(adData)) {
        setCurrentAd(adData);
      } else {
        setError('Invalid advertisement data');
      }
    } else if (!currentAd && adSlot) {
      // 对于动态数据，执行加载
      loadAdData();
    }
  }, [adSlot, adData, currentAd, loadAdData]);

  // 如果未启用广告显示，不渲染组件
  if (!enabled || isDismissed) {
    return null;
  }
  
  /**
   * 处理广告关闭
   */
  const handleAdClose = (adId: string) => {
    setIsDismissed(true);
    onAdClose?.(adId);
  };
  
  /**
   * 重试加载广告
   */
  const handleRetry = () => {
    loadAdData();
  };
  
  // 渲染基础容器样式
  const containerClasses = cn(
    'ad-banner',
    displayType === 'sidebar' ? 'w-full max-w-sm' : 'w-full',
    className
  );
  
  // 加载状态
  if (isLoading) {
    return (
      <div className={containerClasses}>
        <AdLoadingState displayType={displayType} />
      </div>
    );
  }
  
  // 错误状态
  if (error || !currentAd) {
    // 如果有自定义占位符，显示占位符
    if (placeholder) {
      return <div className={containerClasses}>{placeholder}</div>;
    }
    
    return (
      <div className={containerClasses}>
        <AdErrorState
          displayType={displayType}
          errorMessage={errorMessage || error || undefined}
          onRetry={handleRetry}
        />
      </div>
    );
  }
  
  // 正常显示广告内容
  return (
    <div className={containerClasses}>
      <AdContent
        ad={currentAd}
        displayType={displayType}
        showAdLabel={showAdLabel}
        dismissible={dismissible}
        onAdClick={onAdClick}
        onAdClose={handleAdClose}
      />
    </div>
  );
}

export default AdBanner;
