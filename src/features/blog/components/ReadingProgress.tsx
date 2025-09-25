"use client";

/**
 * ReadingProgress 组件
 * 
 * 博客阅读进度指示器组件，提供优雅的阅读体验
 * 固定在页面顶部，显示当前文章的阅读进度百分比
 * 支持平滑动画、主题适配和响应式设计
 * 
 * 需求引用:
 * - Requirements 2.5: 页面顶部显示阅读进度条，根据滚动位置计算阅读百分比，平滑的动画过渡效果
 * - Requirements 11.2: 支持亮色和暗色主题，使用主题适配颜色，良好的视觉反馈
 * 
 * 设计模式:
 * - 复用项目的主题色彩系统和CSS变量
 * - 集成 theme.ts 中定义的博客主题配色
 * - 遵循 Feature First Architecture 的组件组织
 * - 支持无障碍性和性能优化
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getBlogTheme, type BlogThemeVariant } from '../styles/theme';

/**
 * ReadingProgress组件属性接口
 */
export interface ReadingProgressProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 是否显示百分比文字
   * @default false
   */
  showPercentage?: boolean;
  
  /**
   * 是否显示组件
   * @default true
   */
  visible?: boolean;
  
  /**
   * 目标容器选择器，用于计算阅读进度
   * @default 'body'
   */
  targetSelector?: string;
  
  /**
   * 进度条高度
   * @default 3
   */
  height?: number;
  
  /**
   * 是否启用平滑动画
   * @default true
   */
  smooth?: boolean;
  
  /**
   * 滚动事件节流延迟（毫秒）
   * @default 16
   */
  throttleDelay?: number;
  
  /**
   * 进度更新回调函数
   */
  onProgressChange?: (progress: number) => void;
  
  /**
   * 最小显示阈值，低于此值不显示进度条
   * @default 0
   */
  minThreshold?: number;
  
  /**
   * 最大显示阈值，高于此值保持100%
   * @default 100
   */
  maxThreshold?: number;
}

/**
 * 节流工具函数
 */
function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * 计算页面阅读进度
 */
function calculateReadingProgress(targetSelector: string): number {
  const target = targetSelector === 'body' 
    ? document.body 
    : document.querySelector(targetSelector);
    
  if (!target) return 0;

  const scrollTop = window.scrollY;
  const docHeight = target.scrollHeight;
  const winHeight = window.innerHeight;
  const scrollableHeight = docHeight - winHeight;

  if (scrollableHeight <= 0) return 0;
  
  const progress = (scrollTop / scrollableHeight) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * ReadingProgress 阅读进度组件
 * 
 * 固定在页面顶部的阅读进度指示器，提供以下功能：
 * - 实时显示当前页面阅读进度（0-100%）
 * - 平滑的CSS动画过渡效果
 * - 支持亮色/暗色主题适配
 * - 性能优化的滚动事件处理
 * - 响应式设计和无障碍性支持
 * - 可选的百分比数字显示
 * 
 * 基于项目的主题系统和设计规范实现
 */
export function ReadingProgress({
  className,
  showPercentage = false,
  visible = true,
  targetSelector = 'body',
  height = 3,
  smooth = true,
  throttleDelay = 16,
  onProgressChange,
  minThreshold = 0,
  maxThreshold = 100,
}: ReadingProgressProps) {
  
  // 阅读进度状态
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // 主题检测 - 基于CSS类名检测当前主题
  const [currentTheme, setCurrentTheme] = useState<BlogThemeVariant>('light');
  
  // 主题检测逻辑
  useEffect(() => {
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(isDark ? 'dark' : 'light');
    };
    
    // 初始检测
    detectTheme();
    
    // 监听主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => detectTheme();
    
    mediaQuery.addEventListener('change', handleChange);
    
    // 监听DOM类名变化（如果有主题切换功能）
    const observer = new MutationObserver(() => detectTheme());
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);
  
  // 获取当前主题的色彩配置
  const themeColors = useMemo(() => getBlogTheme(currentTheme), [currentTheme]);
  
  // 滚动事件处理函数
  const handleScroll = useCallback(() => {
    if (!visible) return;
    
    const newProgress = calculateReadingProgress(targetSelector);
    const clampedProgress = Math.min(Math.max(newProgress, minThreshold), maxThreshold);
    
    setProgress(clampedProgress);
    setIsVisible(clampedProgress > minThreshold);
    
    // 触发进度变化回调
    if (onProgressChange) {
      onProgressChange(clampedProgress);
    }
  }, [visible, targetSelector, minThreshold, maxThreshold, onProgressChange]);

  // 创建节流后的滚动处理函数
  const throttledHandleScroll = useMemo(
    () => throttle(handleScroll, throttleDelay),
    [handleScroll, throttleDelay]
  );

  // 监听滚动事件
  useEffect(() => {
    if (!visible) {
      setIsVisible(false);
      return;
    }

    // 初始化计算
    handleScroll();

    // 添加滚动监听器
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('resize', throttledHandleScroll);
    };
  }, [visible, throttledHandleScroll, handleScroll]);

  // 如果不可见，不渲染组件
  if (!visible || !isVisible) {
    return null;
  }

  return (
    <>
      {/* 阅读进度条 */}
      <div
        className={cn(
          // 固定定位在页面顶部
          'fixed top-0 left-0 right-0 z-50',
          // 确保在导航栏之上
          'pointer-events-none',
          className
        )}
        role="progressbar"
        aria-label="阅读进度"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`阅读进度 ${Math.round(progress)}%`}
      >
        {/* 进度条背景 */}
        <div
          className={cn(
            'w-full bg-background/80 backdrop-blur-sm',
            // 支持自定义高度
            'transition-all duration-300 ease-out'
          )}
          style={{ 
            height: `${height}px`,
            backgroundColor: currentTheme === 'dark' 
              ? 'rgba(0, 0, 0, 0.3)' 
              : 'rgba(255, 255, 255, 0.8)'
          }}
        >
          {/* 进度指示器 */}
          <div
            className={cn(
              'h-full origin-left',
              // 平滑动画配置
              smooth && 'transition-all duration-150 ease-out',
              // 渐变背景效果
              'bg-gradient-to-r',
              // 轻微的发光效果
              'shadow-sm'
            )}
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${themeColors.primary.main} 0%, ${themeColors.primary.hover} 100%)`,
              boxShadow: `0 0 8px ${themeColors.primary.main}20`,
              transform: 'translateZ(0)', // 启用硬件加速
            }}
          />
        </div>
      </div>

      {/* 百分比显示（可选） */}
      {showPercentage && (
        <div
          className={cn(
            // 固定定位在右上角
            'fixed top-4 right-4 z-50',
            // 样式设计
            'bg-card/90 backdrop-blur-sm',
            'border border-border rounded-full',
            'px-3 py-1.5 text-xs font-medium',
            'text-foreground shadow-lg',
            // 平滑动画
            'transition-all duration-300 ease-out',
            // 响应式适配
            'hidden sm:block'
          )}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="flex items-center space-x-1">
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColors.primary.main }}
            />
            <span>{Math.round(progress)}%</span>
          </span>
        </div>
      )}
    </>
  );
}

/**
 * 自定义Hook：使用阅读进度
 * 提供便捷的阅读进度状态管理
 */
export function useReadingProgress(targetSelector = 'body') {
  const [progress, setProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);
  
  useEffect(() => {
    const handleScroll = throttle(() => {
      const newProgress = calculateReadingProgress(targetSelector);
      setProgress(newProgress);
      setIsReading(newProgress > 5 && newProgress < 95);
    }, 16);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetSelector]);
  
  return { progress, isReading };
}

/**
 * ReadingProgress组件默认导出
 * 提供向后兼容性
 */
export default ReadingProgress;
