/**
 * Performance Optimization Hook
 * 
 * 提供搜索页面性能优化的专用hooks和工具函数
 * 支持防抖、节流、虚拟化和内存优化
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

/**
 * 性能配置接口
 */
export interface PerformanceConfig {
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 节流延迟时间（毫秒） */
  throttleDelay?: number;
  /** 虚拟化阈值（超过此数量启用虚拟化） */
  virtualizationThreshold?: number;
  /** 是否启用内存优化 */
  enableMemoryOptimization?: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  /** 渲染时间（毫秒） */
  renderTime: number;
  /** 内存使用量（估算） */
  memoryUsage: number;
  /** 组件更新次数 */
  updateCount: number;
  /** 最后更新时间 */
  lastUpdateTime: number;
}

/**
 * 默认性能配置
 */
const DEFAULT_PERFORMANCE_CONFIG: Required<PerformanceConfig> = {
  debounceDelay: 300,
  throttleDelay: 16, // ~60fps
  virtualizationThreshold: 100,
  enableMemoryOptimization: true,
  enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
};

/**
 * 搜索页面性能优化Hook
 * 
 * 提供全面的性能优化功能：
 * - 防抖搜索输入
 * - 节流滚动事件
 * - 虚拟化大数据集
 * - 内存使用优化
 * - 性能指标监控
 */
export function usePerformanceOptimization(config: PerformanceConfig = {}) {
  // 合并配置
  const perfConfig = useMemo(() => ({ ...DEFAULT_PERFORMANCE_CONFIG, ...config }), [config]);
  
  // 性能指标引用
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    updateCount: 0,
    lastUpdateTime: Date.now(),
  });
  
  // 更新计数器
  const updateCountRef = useRef(0);
  
  /**
   * 防抖函数工厂
   */
  const createDebouncedCallback = useCallback(<T extends any[]>(
    callback: (...args: T) => void,
    delay?: number
  ) => {
    return useDebouncedCallback(callback, delay || perfConfig.debounceDelay);
  }, [perfConfig.debounceDelay]);
  
  /**
   * 节流函数工厂
   */
  const createThrottledCallback = useCallback(<T extends any[]>(
    callback: (...args: T) => void,
    delay?: number
  ) => {
    const lastCall = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    
    return (...args: T) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall.current;
      const throttleDelay = delay || perfConfig.throttleDelay;
      
      if (timeSinceLastCall >= throttleDelay) {
        lastCall.current = now;
        callback(...args);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, throttleDelay - timeSinceLastCall);
      }
    };
  }, [perfConfig.throttleDelay]);
  
  /**
   * 虚拟化检查函数
   */
  const shouldUseVirtualization = useCallback((itemCount: number) => {
    return itemCount > perfConfig.virtualizationThreshold;
  }, [perfConfig.virtualizationThreshold]);
  
  /**
   * 内存优化函数
   */
  const optimizeMemory = useCallback(() => {
    if (!perfConfig.enableMemoryOptimization) return;
    
    // 强制垃圾回收（仅在开发环境）
    if (process.env.NODE_ENV === 'development' && window.gc) {
      window.gc();
    }
  }, [perfConfig.enableMemoryOptimization]);
  
  /**
   * 性能指标更新
   */
  const updateMetrics = useCallback((renderStart: number) => {
    if (!perfConfig.enablePerformanceMonitoring) return;
    
    const now = Date.now();
    updateCountRef.current += 1;
    
    metricsRef.current = {
      renderTime: now - renderStart,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      updateCount: updateCountRef.current,
      lastUpdateTime: now,
    };
    
    // 在开发环境输出性能警告
    if (process.env.NODE_ENV === 'development') {
      const { renderTime, updateCount } = metricsRef.current;
      
      if (renderTime > 100) {
        console.warn(`[Performance] Slow render detected: ${renderTime}ms`);
      }
      
      if (updateCount > 50) {
        console.warn(`[Performance] High update count: ${updateCount} renders`);
      }
    }
  }, [perfConfig.enablePerformanceMonitoring]);
  
  /**
   * 性能监控包装器
   */
  const withPerformanceMonitoring = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    name?: string
  ) => {
    return (...args: T): R => {
      const start = Date.now();
      
      try {
        const result = fn(...args);
        updateMetrics(start);
        return result;
      } catch (error) {
        updateMetrics(start);
        console.error(`[Performance] Error in ${name || 'function'}:`, error);
        throw error;
      }
    };
  }, [updateMetrics]);
  
  /**
   * 列表分片渲染（用于大数据集）
   */
  const createChunkedRenderer = useCallback(<T>(
    items: T[],
    chunkSize: number = 20,
    renderItem: (item: T, index: number) => React.ReactNode
  ) => {
    return useMemo(() => {
      const chunks: T[][] = [];
      for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
      }
      
      return chunks.map((chunk, chunkIndex) => 
        chunk.map((item, itemIndex) => 
          renderItem(item, chunkIndex * chunkSize + itemIndex)
        )
      );
    }, [items, chunkSize, renderItem]);
  }, []);
  
  /**
   * 清理副作用
   */
  useEffect(() => {
    return () => {
      // 执行内存优化
      if (perfConfig.enableMemoryOptimization) {
        optimizeMemory();
      }
    };
  }, [perfConfig.enableMemoryOptimization, optimizeMemory]);
  
  // 返回性能优化工具
  return {
    // 防抖和节流
    createDebouncedCallback,
    createThrottledCallback,
    
    // 虚拟化
    shouldUseVirtualization,
    virtualizationThreshold: perfConfig.virtualizationThreshold,
    
    // 内存优化
    optimizeMemory,
    
    // 性能监控
    withPerformanceMonitoring,
    metrics: metricsRef.current,
    
    // 渲染优化
    createChunkedRenderer,
    
    // 配置
    config: perfConfig,
    
    // 调试信息（开发环境）
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        updateCount: updateCountRef.current,
        metrics: metricsRef.current,
        config: perfConfig,
      },
    }),
  };
}

/**
 * 搜索特定的性能优化Hook
 * 
 * 专为搜索功能设计的性能优化配置
 */
export function useSearchPerformanceOptimization() {
  return usePerformanceOptimization({
    debounceDelay: 300, // 搜索防抖
    throttleDelay: 100, // 滚动节流
    virtualizationThreshold: 50, // 搜索结果虚拟化阈值更低
    enableMemoryOptimization: true,
    enablePerformanceMonitoring: true,
  });
}

/**
 * 滚动性能优化Hook
 * 
 * 专为滚动事件优化设计
 */
export function useScrollPerformanceOptimization() {
  const { createThrottledCallback } = usePerformanceOptimization({
    throttleDelay: 16, // 60fps
  });
  
  const throttledScrollHandler = useCallback((handler: (event: Event) => void) => {
    return createThrottledCallback(handler, 16);
  }, [createThrottledCallback]);
  
  return {
    throttledScrollHandler,
  };
}

/**
 * 内存使用监控Hook
 * 
 * 监控组件内存使用情况
 */
export function useMemoryMonitoring() {
  const memoryInfo = useRef<any>(null);
  
  useEffect(() => {
    if ('memory' in performance) {
      memoryInfo.current = (performance as any).memory;
    }
  }, []);
  
  const getMemoryUsage = useCallback(() => {
    if (!memoryInfo.current) return null;
    
    return {
      used: memoryInfo.current.usedJSHeapSize,
      total: memoryInfo.current.totalJSHeapSize,
      limit: memoryInfo.current.jsHeapSizeLimit,
    };
  }, []);
  
  return {
    getMemoryUsage,
    isSupported: !!memoryInfo.current,
  };
}

// 默认导出
export default usePerformanceOptimization;