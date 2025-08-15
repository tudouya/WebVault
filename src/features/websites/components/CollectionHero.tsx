/**
 * CollectionHero 组件
 * 
 * 集合页面的标题和说明区域
 * 显示"COLLECTION"小标题和"Explore by collections"主标题
 * 
 * 需求引用:
 * - 2.1-2.4: 页面标题和说明区域 - 清晰的页面标题和说明
 * - 8.3: 标题和内容区域布局 - 基于8pt网格的垂直间距系统
 * - 9.0: 精确配色系统 - 使用HSL主题色彩
 * - 13.0: 字体和排版规范 - 分层文字大小和权重
 */

'use client';

import React from 'react';

/**
 * CollectionHero组件属性
 */
interface CollectionHeroProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
}

/**
 * CollectionHero 页面标题组件
 * 
 * 提供集合页面的标题和说明展示
 * 复用homepage-ui的标题样式模式和8pt网格间距系统
 */
export function CollectionHero({ 
  className = ''
}: CollectionHeroProps) {
  return (
    <section 
      className={`relative bg-background py-12 px-4 sm:py-16 sm:px-6 lg:px-8 ${className}`}
      aria-label="集合页面标题和说明"
    >
      <div className="mx-auto max-w-6xl text-center">
        {/* 主标题区域 - 基于8pt网格间距系统 */}
        <div className="mb-8">
          {/* 小标题 - COLLECTION */}
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
            COLLECTION
          </p>
          
          {/* 主标题 - Explore by collections */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            <span className="inline-block">Explore by </span>
            <span className="text-primary inline-block">collections</span>
          </h1>
          
          {/* 说明文字 */}
          <p className="mt-6 text-lg leading-8 text-card-foreground sm:text-xl">
            精心策划的主题集合，帮你快速找到相关的优质网站资源
          </p>
        </div>
      </div>
    </section>
  );
}

export default CollectionHero;