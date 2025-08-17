import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  rootMargin?: string;
  threshold?: number | number[];
  freezeOnceVisible?: boolean;
}

/**
 * useIntersectionObserver Hook
 * 
 * 用于监听元素是否进入可视区域，支持自定义触发边距
 * 专门为图片懒加载优化，支持视窗底部200px触发距离
 * 
 * @param options - Intersection Observer 配置选项
 * @returns {Object} - 包含 ref 和 isIntersecting 状态
 */
export function useIntersectionObserver<T extends Element>({
  rootMargin = '200px 0px 200px 0px', // 默认视窗底部200px触发
  threshold = 0,
  freezeOnceVisible = true,
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 如果已经可见且设置了冻结，则不再监听
    if (freezeOnceVisible && isIntersecting) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        // 如果设置了冻结且元素已可见，停止观察
        if (freezeOnceVisible && isVisible) {
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, freezeOnceVisible, isIntersecting]);

  return { ref, isIntersecting };
}