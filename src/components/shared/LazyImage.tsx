"use client";

import Image, { type ImageProps } from "next/image";
import React, { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useImagePerformance } from "@/hooks/useImagePerformance";

interface LazyImageProps {
  /** 图片源URL */
  src: string;
  /** 图片alt文本 */
  alt: string;
  /** 自定义类名 */
  className?: string;
  /** 图片容器类名 */
  containerClassName?: string;
  /** 加载失败时的回退内容 */
  fallback?: React.ReactNode;
  /** 懒加载触发距离 */
  rootMargin?: string;
  /** 占位符内容 */
  placeholder?: React.ReactNode;
  /** 是否启用懒加载，默认true */
  lazy?: boolean;
  /** 图片加载完成回调 */
  onLoad?: () => void;
  /** 图片加载失败回调 */
  onError?: () => void;
  /** 传递给 Next.js Image 组件的其他属性 */
  imageProps?: Omit<ImageProps, "src" | "alt">;
  /** 图片的内联样式 */
  style?: React.CSSProperties;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
}

/**
 * LazyImage 组件
 * 
 * 专门为性能优化设计的图片懒加载组件，支持：
 * - IntersectionObserver 实现的高效懒加载
 * - 自定义触发距离和加载状态
 * - 优雅的错误处理和回退机制
 * - 平滑的加载过渡动画
 * - 可自定义的占位符和加载状态
 * 
 * 性能特性：
 * - 默认视窗底部100px触发加载
 * - 使用 loading="lazy" 双重保险
 * - 支持一次性加载（freezeOnceVisible）
 * - 最小化重渲染和内存占用
 * 
 * @example
 * ```tsx
 * <LazyImage
 *   src="/image.jpg"
 *   alt="示例图片"
 *   className="w-full h-auto"
 *   fallback={<div className="w-full h-32 bg-muted" />}
 *   rootMargin="0px 0px 200px 0px"
 * />
 * ```
 */
export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  fallback,
  rootMargin = "0px 0px 100px 0px",
  placeholder,
  lazy = true,
  onLoad,
  onError,
  imageProps,
  style,
  enablePerformanceMonitoring = false,
}: LazyImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 懒加载监听
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  // 性能监控
  const { startMonitoring, recordLoad, recordError } = useImagePerformance({
    enabled: enablePerformanceMonitoring,
    logToConsole: enablePerformanceMonitoring,
  });

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const imgElement = event.currentTarget;
    setImageLoaded(true);
    recordLoad(imgElement);
    onLoad?.();
  }, [onLoad, recordLoad]);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const imgElement = event.currentTarget;
    setImageError(true);
    recordError(imgElement);
    onError?.();
  }, [onError, recordError]);

  // 是否应该显示图片
  const shouldShowImage = !lazy || isIntersecting;

  useEffect(() => {
    if (shouldShowImage && enablePerformanceMonitoring) {
      startMonitoring();
    }
  }, [enablePerformanceMonitoring, shouldShowImage, startMonitoring]);

  const {
    priority: propPriority,
    width,
    height,
    sizes,
    quality,
    placeholder: nextPlaceholder,
    blurDataURL,
    unoptimized = true,
    ...restImageProps
  } = imageProps ?? {};

  const hasExplicitDimensions = typeof width === "number" && typeof height === "number";
  const priority = propPriority ?? false;
  const loading = priority ? undefined : (lazy ? "lazy" : "eager");

  return (
    <div 
      ref={intersectionRef}
      className={cn("relative overflow-hidden", containerClassName)}
    >
      {shouldShowImage && !imageError ? (
        <Image
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          style={style}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={priority}
          loading={loading}
          width={hasExplicitDimensions ? width : undefined}
          height={hasExplicitDimensions ? height : undefined}
          fill={!hasExplicitDimensions}
          sizes={sizes}
          quality={quality}
          placeholder={nextPlaceholder}
          blurDataURL={blurDataURL}
          unoptimized={unoptimized}
          {...restImageProps}
        />
      ) : imageError && fallback ? (
        fallback
      ) : !shouldShowImage && placeholder ? (
        placeholder
      ) : !shouldShowImage ? (
        /* 默认加载占位符 */
        <div className={cn(
          "w-full h-full bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center",
          className
        )}>
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
        </div>
      ) : null}

      {/* 加载状态遮罩 - 在图片未完全加载时显示 */}
      {shouldShowImage && !imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
        </div>
      )}
    </div>
  );
}

export default LazyImage;
