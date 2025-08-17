/**
 * CategoryFilter筛选标签组件
 * 
 * 为博客页面提供分类筛选标签栏，基于6个预定义分类常量
 * 支持激活状态显示、悬停效果和移动端触摸滑动功能
 * 
 * 需求引用:
 * - 需求2.1: 分类筛选标签栏在页面标题下方水平排列显示
 * - 需求2.5: 选中分类时通过背景色和字体颜色变化高亮显示
 * - 需求10.1: 使用水平滚动的标签容器，支持触摸滑动
 * - 需求10.2: 圆角胶囊样式 border-radius: 20px，内边距 12px 20px
 * - 需求10.3: 默认状态使用浅灰背景和深灰文字，边框样式
 * - 需求10.4: 选中状态使用紫色背景 #8B5CF6 和白色文字
 * - 需求10.5: 悬停状态提供 transition: all 0.2s ease 的平滑过渡效果
 * - 需求10.6: 移动端最小触摸区域 44px
 * - 需求13.2: ✅ 分类切换fade-in动画，持续300ms (任务21已完成)
 * - 需求13.5: ✅ 图片加载placeholder背景色渐变动画支持 (任务21已完成)
 */

'use client';

import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BlogCategoryType, 
  BLOG_CATEGORIES,
  BlogCategoryUtils
} from '../constants/categories';

/**
 * CategoryFilter组件属性接口
 */
export interface CategoryFilterProps {
  /** 当前激活的分类 */
  activeCategory: BlogCategoryType;
  /** 分类切换回调函数 */
  onCategoryChange: (category: BlogCategoryType) => void;
  /** 组件自定义类名 */
  className?: string;
}

/**
 * CategoryFilter分类筛选标签栏组件
 * 
 * 提供博客分类筛选功能，基于6个预定义分类常量
 * 实现圆角胶囊样式、精确配色系统和平滑过渡动画
 * 
 * 特性:
 * - 基于6个预定义分类常量：All, Lifestyle, Technologies, Design, Travel, Growth
 * - 圆角胶囊样式 (border-radius: 20px)，内边距 12px 20px
 * - 默认状态：浅灰背景 #F3F4F6，深灰文字 #4B5563
 * - 激活状态：紫色背景 #8B5CF6，白色文字
 * - 悬停效果：transition: all 0.2s ease
 * - 水平滚动容器，支持移动端触摸滑动
 * - 移动端最小触摸区域 44px
 * - 完整键盘导航支持：
 *   • 左/右箭头键或上/下箭头键：在分类间循环切换
 *   • Home键：跳转到第一个分类
 *   • End键：跳转到最后一个分类
 *   • Enter/Space键：激活当前焦点分类
 *   • Tab键：按逻辑顺序在激活分类上设置焦点
 * - WCAG 2.1 AA合规的无障碍性支持
 * - 屏幕阅读器友好的语义化标签和ARIA属性
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <CategoryFilter 
 *   activeCategory={activeCategory}
 *   onCategoryChange={setActiveCategory}
 * />
 * 
 * // 自定义样式
 * <CategoryFilter 
 *   activeCategory={activeCategory}
 *   onCategoryChange={handleCategoryChange}
 *   className="mt-4"
 * />
 * ```
 */
export function CategoryFilter({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryFilterProps) {
  
  // 引用container元素用于焦点管理
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 处理分类点击
  const handleCategoryClick = (category: BlogCategoryType) => {
    onCategoryChange(category);
  };

  // 获取当前激活分类的索引
  const getActiveCategoryIndex = useCallback(() => {
    return BLOG_CATEGORIES.findIndex(category => 
      BlogCategoryUtils.isSameCategory(activeCategory, category)
    );
  }, [activeCategory]);

  // 移动焦点到指定索引的分类标签
  const focusCategoryAtIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    const buttons = containerRef.current.querySelectorAll('[role="tab"]');
    const targetButton = buttons[index] as HTMLElement;
    
    if (targetButton) {
      targetButton.focus();
      // 同时滚动到可视区域
      targetButton.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      });
    }
  }, []);

  // 处理键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentCategory: BlogCategoryType) => {
    const currentIndex = getActiveCategoryIndex();
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : BLOG_CATEGORIES.length - 1;
        const prevCategory = BLOG_CATEGORIES[prevIndex];
        onCategoryChange(prevCategory);
        // 使用 setTimeout 确保状态更新后再设置焦点
        setTimeout(() => focusCategoryAtIndex(prevIndex), 0);
        break;
        
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < BLOG_CATEGORIES.length - 1 ? currentIndex + 1 : 0;
        const nextCategory = BLOG_CATEGORIES[nextIndex];
        onCategoryChange(nextCategory);
        // 使用 setTimeout 确保状态更新后再设置焦点
        setTimeout(() => focusCategoryAtIndex(nextIndex), 0);
        break;
        
      case 'Home':
        e.preventDefault();
        const firstCategory = BLOG_CATEGORIES[0];
        onCategoryChange(firstCategory);
        setTimeout(() => focusCategoryAtIndex(0), 0);
        break;
        
      case 'End':
        e.preventDefault();
        const lastIndex = BLOG_CATEGORIES.length - 1;
        const lastCategory = BLOG_CATEGORIES[lastIndex];
        onCategoryChange(lastCategory);
        setTimeout(() => focusCategoryAtIndex(lastIndex), 0);
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleCategoryClick(currentCategory);
        break;
    }
  }, [getActiveCategoryIndex, onCategoryChange, focusCategoryAtIndex]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        // 水平滚动容器 (需求10.1)
        "flex gap-3 overflow-x-auto scrollbar-hide",
        // 移动端触摸滑动优化
        "snap-x snap-mandatory scroll-smooth",
        // 防止垂直滚动影响
        "pb-2 mb-2",
        // 分类切换容器动画 - 支持内容更新的fade-in效果
        "transition-all duration-300 ease-in-out",
        className
      )}
      role="tablist"
      aria-label="博客分类筛选"
      aria-orientation="horizontal"
    >
      {BLOG_CATEGORIES.map((category) => {
        const isActive = BlogCategoryUtils.isSameCategory(activeCategory, category);
        const categoryLabel = BlogCategoryUtils.getCategoryLabel(category);

        return (
          <Button
            key={category}
            variant="ghost"
            className={cn(
              // 圆角胶囊样式 (需求10.2) 
              "rounded-[20px] px-5 py-3 whitespace-nowrap snap-start shrink-0",
              // 最小触摸区域 44px (需求10.6)
              "min-h-[44px] min-w-fit",
              // 应用博客分类标签动画样式 - 任务21实现
              "blog-category-tag",
              // 默认状态样式 (需求10.3)
              !isActive && [
                "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]",
                // 增强悬停效果 - 使用CSS动画类
                "hover:bg-[#E5E7EB] hover:text-[#374151] hover:border-[#D1D5DB]"
              ],
              // 激活状态样式 (需求10.4) 
              isActive && [
                "bg-[#8B5CF6] text-white border-transparent",
                "hover:bg-[#8B5CF6]/90",
                "shadow-md",
                // 激活状态特殊动画 - Requirements 13.2 fade-in 300ms
                "blog-category-tag-active"
              ],
              // 焦点状态 - 保持键盘导航体验
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2",
              "focus-visible:ring-offset-background"
            )}
            onClick={() => handleCategoryClick(category)}
            onKeyDown={(e) => handleKeyDown(e, category)}
            role="tab"
            aria-selected={isActive}
            aria-controls="blog-content"
            title={`选择${categoryLabel}分类筛选博客文章`}
            tabIndex={isActive ? 0 : -1}
          >
            <span 
              className={cn(
                "text-sm font-medium transition-all duration-200 ease-in-out",
                // 文字动画优化
                isActive && "animate-in fade-in-0 duration-300"
              )}
            >
              {categoryLabel}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;