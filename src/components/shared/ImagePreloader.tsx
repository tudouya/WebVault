"use client";

import { useEffect, useRef } from "react";

interface ImagePreloaderProps {
  /** 要预加载的图片URL列表 */
  images: string[];
  /** 预加载优先级，默认为low */
  priority?: 'high' | 'low';
  /** 最大同时预加载数量，默认3 */
  maxConcurrent?: number;
  /** 预加载完成回调 */
  onComplete?: (loadedCount: number, totalCount: number) => void;
}

/**
 * ImagePreloader 组件
 * 
 * 用于预加载关键图片资源，提升用户体验
 * 特别适用于即将进入视窗的图片或用户可能访问的页面图片
 * 
 * 功能特性：
 * - 控制并发数量，避免阻塞关键资源
 * - 支持优先级控制
 * - 内存友好，自动清理无用的图片引用
 * - 静默失败，不影响主要功能
 * 
 * @example
 * ```tsx
 * <ImagePreloader
 *   images={['/hero.jpg', '/featured.jpg']}
 *   priority="high"
 *   maxConcurrent={2}
 * />
 * ```
 */
export function ImagePreloader({
  images,
  priority = 'low',
  maxConcurrent = 3,
  onComplete,
}: ImagePreloaderProps) {
  const loadedCountRef = useRef(0);
  const totalCountRef = useRef(0);

  useEffect(() => {
    if (!images || images.length === 0) return;

    totalCountRef.current = images.length;
    loadedCountRef.current = 0;

    let loadQueue: string[] = [...images];
    let loadingCount = 0;

    const processQueue = () => {
      while (loadQueue.length > 0 && loadingCount < maxConcurrent) {
        const imageUrl = loadQueue.shift()!;
        loadingCount++;

        const img = new Image();
        
        const handleLoad = () => {
          loadedCountRef.current++;
          loadingCount--;
          processQueue(); // 继续处理队列
          
          // 检查是否全部完成
          if (loadedCountRef.current === totalCountRef.current) {
            onComplete?.(loadedCountRef.current, totalCountRef.current);
          }
        };

        const handleError = () => {
          loadingCount--;
          processQueue(); // 即使失败也继续处理
          
          // 检查是否全部完成（包括失败的）
          if (loadedCountRef.current + (totalCountRef.current - loadQueue.length - loadingCount) === totalCountRef.current) {
            onComplete?.(loadedCountRef.current, totalCountRef.current);
          }
        };

        img.onload = handleLoad;
        img.onerror = handleError;
        
        // 使用 fetchpriority 提示浏览器
        if ('fetchpriority' in img) {
          (img as any).fetchpriority = priority;
        }
        
        img.src = imageUrl;
      }
    };

    // 启动预加载
    processQueue();

    // 清理函数
    return () => {
      loadQueue = [];
    };
  }, [images, priority, maxConcurrent, onComplete]);

  // 这是一个纯逻辑组件，不渲染任何内容
  return null;
}

/**
 * 预加载策略Hook
 * 提供更灵活的预加载控制
 */
export function useImagePreloader() {
  const preloadImages = (
    images: string[],
    options: {
      priority?: 'high' | 'low';
      maxConcurrent?: number;
    } = {}
  ): Promise<{ loaded: number; total: number }> => {
    return new Promise((resolve) => {
      const { priority = 'low', maxConcurrent = 3 } = options;
      
      if (!images || images.length === 0) {
        resolve({ loaded: 0, total: 0 });
        return;
      }

      let loadedCount = 0;
      let loadingCount = 0;
      const totalCount = images.length;
      const loadQueue = [...images];

      const processQueue = () => {
        while (loadQueue.length > 0 && loadingCount < maxConcurrent) {
          const imageUrl = loadQueue.shift()!;
          loadingCount++;

          const img = new Image();
          
          const handleComplete = () => {
            loadingCount--;
            if (loadQueue.length === 0 && loadingCount === 0) {
              resolve({ loaded: loadedCount, total: totalCount });
            } else {
              processQueue();
            }
          };

          const handleLoad = () => {
            loadedCount++;
            handleComplete();
          };

          const handleError = () => {
            handleComplete();
          };

          img.onload = handleLoad;
          img.onerror = handleError;
          
          if ('fetchpriority' in img) {
            (img as any).fetchpriority = priority;
          }
          
          img.src = imageUrl;
        }
      };

      processQueue();
    });
  };

  return { preloadImages };
}

export default ImagePreloader;