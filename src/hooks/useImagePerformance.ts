"use client";

import { useEffect, useRef, useState } from 'react';

interface ImagePerformanceMetrics {
  /** 图片开始加载时间 */
  loadStartTime: number;
  /** 图片加载完成时间 */
  loadEndTime: number;
  /** 总加载时间（毫秒） */
  loadDuration: number;
  /** 图片大小信息 */
  size?: {
    width: number;
    height: number;
    naturalWidth: number;
    naturalHeight: number;
  };
}

interface UseImagePerformanceOptions {
  /** 是否启用性能监控，默认在开发环境启用 */
  enabled?: boolean;
  /** 性能数据回调 */
  onMetrics?: (metrics: ImagePerformanceMetrics) => void;
  /** 是否记录到控制台 */
  logToConsole?: boolean;
}

/**
 * useImagePerformance Hook
 * 
 * 用于监控图片加载性能，帮助识别性能瓶颈
 * 特别适用于懒加载图片的性能分析
 * 
 * @param options - 性能监控配置选项
 * @returns 性能监控方法和当前指标
 */
export function useImagePerformance({
  enabled = process.env.NODE_ENV === 'development',
  onMetrics,
  logToConsole = process.env.NODE_ENV === 'development',
}: UseImagePerformanceOptions = {}) {
  const [currentMetrics, setCurrentMetrics] = useState<ImagePerformanceMetrics | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * 开始监控图片加载性能
   */
  const startMonitoring = () => {
    if (!enabled) return;
    startTimeRef.current = performance.now();
  };

  /**
   * 记录图片加载完成
   */
  const recordLoad = (imgElement?: HTMLImageElement) => {
    if (!enabled || startTimeRef.current === 0) return;

    const loadEndTime = performance.now();
    const loadDuration = loadEndTime - startTimeRef.current;

    const metrics: ImagePerformanceMetrics = {
      loadStartTime: startTimeRef.current,
      loadEndTime,
      loadDuration,
      size: imgElement ? {
        width: imgElement.width,
        height: imgElement.height,
        naturalWidth: imgElement.naturalWidth,
        naturalHeight: imgElement.naturalHeight,
      } : undefined,
    };

    setCurrentMetrics(metrics);
    onMetrics?.(metrics);

    if (logToConsole) {
      console.log('🖼️ Image Load Performance:', {
        duration: `${loadDuration.toFixed(2)}ms`,
        size: metrics.size ? 
          `${metrics.size.naturalWidth}x${metrics.size.naturalHeight}` : 
          'unknown',
        src: imgElement?.src,
      });
    }

    // 重置开始时间
    startTimeRef.current = 0;
  };

  /**
   * 记录图片加载错误
   */
  const recordError = (imgElement?: HTMLImageElement) => {
    if (!enabled || startTimeRef.current === 0) return;

    const errorTime = performance.now();
    const attemptDuration = errorTime - startTimeRef.current;

    if (logToConsole) {
      console.warn('❌ Image Load Failed:', {
        duration: `${attemptDuration.toFixed(2)}ms`,
        src: imgElement?.src,
      });
    }

    // 重置开始时间
    startTimeRef.current = 0;
  };

  return {
    currentMetrics,
    startMonitoring,
    recordLoad,
    recordError,
  };
}

/**
 * 全局图片性能统计Hook
 * 用于收集整个应用的图片加载性能数据
 */
export function useGlobalImagePerformance() {
  const [globalMetrics, setGlobalMetrics] = useState<{
    totalImages: number;
    successfulLoads: number;
    failedLoads: number;
    averageLoadTime: number;
    slowestLoad: number;
    fastestLoad: number;
  }>({
    totalImages: 0,
    successfulLoads: 0,
    failedLoads: 0,
    averageLoadTime: 0,
    slowestLoad: 0,
    fastestLoad: Infinity,
  });

  const metricsRef = useRef<number[]>([]);

  const recordImageLoad = (duration: number, success: boolean) => {
    if (success) {
      metricsRef.current.push(duration);
    }

    setGlobalMetrics(prev => {
      const newMetrics = { ...prev };
      newMetrics.totalImages++;
      
      if (success) {
        newMetrics.successfulLoads++;
        newMetrics.slowestLoad = Math.max(newMetrics.slowestLoad, duration);
        newMetrics.fastestLoad = Math.min(newMetrics.fastestLoad, duration);
        newMetrics.averageLoadTime = 
          metricsRef.current.reduce((sum, time) => sum + time, 0) / metricsRef.current.length;
      } else {
        newMetrics.failedLoads++;
      }

      return newMetrics;
    });
  };

  const resetMetrics = () => {
    metricsRef.current = [];
    setGlobalMetrics({
      totalImages: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0,
      slowestLoad: 0,
      fastestLoad: Infinity,
    });
  };

  return {
    globalMetrics,
    recordImageLoad,
    resetMetrics,
  };
}

/**
 * Core Web Vitals 相关的图片性能指标
 */
export function useImageCoreWebVitals() {
  const [lcpCandidate, setLcpCandidate] = useState<{
    element: HTMLImageElement;
    loadTime: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 监听 LCP（Largest Contentful Paint）
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      if (lastEntry?.element?.tagName === 'IMG') {
        setLcpCandidate({
          element: lastEntry.element,
          loadTime: lastEntry.loadTime,
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // 浏览器不支持 LCP
      console.warn('LCP monitoring not supported');
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    lcpCandidate,
  };
}

export default useImagePerformance;