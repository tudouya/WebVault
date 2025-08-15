/**
 * SearchHeader 组件
 * 
 * 搜索页面的标题区域，显示主标题和描述文案
 * 复用HeroSection的排版样式和主题色彩系统
 * 
 * 需求引用:
 * - 1.3: 搜索页面基础布局 - 搜索标题区域显示
 * - 13.0: 字体和排版规范 - 分层文字大小和权重
 * - 9.0: 精确配色系统 - 使用HSL主题色彩
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SearchHeaderProps, DEFAULT_SEARCH_HEADER_PROPS } from '../types';

/**
 * SearchHeader 搜索页面标题组件
 * 
 * 提供搜索页面的主标题显示和描述信息
 * 使用语义化HTML标签和无障碍属性
 */
export function SearchHeader({ 
  className = '',
  title = DEFAULT_SEARCH_HEADER_PROPS.title,
  description = DEFAULT_SEARCH_HEADER_PROPS.description,
}: SearchHeaderProps) {
  return (
    <header 
      className={cn(
        "relative bg-background py-12 px-4 sm:py-16 sm:px-6 lg:px-8",
        className
      )}
      aria-label="搜索页面标题区域"
    >
      <div className="mx-auto max-w-6xl text-center">
        {/* 主标题区域 - 复用HeroSection的排版样式 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            <span className="text-primary">{title}</span>
          </h1>
          
          {/* 描述文案 - 复用HeroSection的样式 */}
          {description && (
            <p className="mt-4 text-lg leading-8 text-card-foreground sm:text-xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

export default SearchHeader;