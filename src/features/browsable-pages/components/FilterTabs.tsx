/**
 * FilterTabs筛选标签组件
 * 
 * 为collection、category、tag浏览页面提供统一的筛选标签栏
 * 支持"All"默认选项和动态筛选标签，提供直观的选中、悬停状态
 * 
 * 需求引用:
 * - 需求2.2: 分类页面加载筛选控件时应提供分类筛选标签栏
 * - 需求3.2: 标签页面加载筛选控件时应提供标签筛选栏
 * - 需求10.1: 显示筛选标签时应使用"All"作为默认选中状态的标签
 * - 需求10.2: 标签未选中时应使用浅灰色背景和深色文字
 * - 需求10.4: 用户悬停标签时应提供视觉反馈效果
 */

'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * 筛选标签项数据接口
 */
export interface FilterTabItem {
  /** 唯一标识符 */
  id: string;
  /** 显示标签文本 */
  label: string;
  /** 标签值，用于筛选逻辑 */
  value: string;
  /** 该筛选项对应的数据条数，可选 */
  count?: number;
  /** 是否为默认选中项 */
  isDefault?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * FilterTabs组件属性接口
 */
export interface FilterTabsProps {
  /** 筛选标签数据列表 */
  items: FilterTabItem[];
  /** 当前选中的标签值 */
  selectedValue?: string;
  /** 标签点击回调函数 */
  onTabChange?: (value: string, item: FilterTabItem) => void;
  /** 组件自定义类名 */
  className?: string;
  /** 是否显示数量统计 */
  showCounts?: boolean;
  /** 筛选类型，影响样式主题 */
  filterType?: 'category' | 'tag' | 'collection';
  /** 是否为加载状态 */
  loading?: boolean;
  /** 是否允许取消选中（回到无选中状态）*/
  allowDeselect?: boolean;
}

/**
 * FilterTabs标签按钮变体配置
 * 使用CVA管理选中、非选中、悬停、活动状态
 */
const filterTabVariants = cva(
  // 基础样式 - 与项目Button组件保持一致的基础样式
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // 默认未选中状态 - 浅灰色背景和深色文字 (需求10.2)
        default: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground active:bg-secondary/90",
        // 选中状态 - 使用指定的#8B5CF6背景色
        selected: "bg-[#8B5CF6] text-white shadow-sm hover:bg-[#8B5CF6]/90 active:bg-[#8B5CF6]/95",
        // 禁用状态
        disabled: "bg-muted text-muted-foreground cursor-not-allowed",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-sm",
        lg: "h-10 px-6 py-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * 根据筛选类型生成默认的"All"选项
 */
function createAllOption(filterType: FilterTabsProps['filterType']): FilterTabItem {
  const typeLabels = {
    category: 'All Categories',
    tag: 'All Tags',
    collection: 'All Collections',
  };

  return {
    id: `__filter_all_${filterType}__`,
    label: typeLabels[filterType || 'category'] || 'All',
    value: '',
    isDefault: true,
  };
}

/**
 * FilterTabs筛选标签组件
 * 
 * 提供统一的筛选标签栏，支持不同页面类型的筛选需求
 * 自动处理"All"默认选项，提供丰富的交互状态反馈
 * 
 * 特性:
 * - 自动添加"All"默认选项 (需求10.1)
 * - 选中状态使用#8B5CF6背景色
 * - 未选中状态使用浅灰色背景和深色文字 (需求10.2) 
 * - 悬停和活动状态提供视觉反馈 (需求10.4)
 * - 支持数量统计显示
 * - 支持禁用状态和加载状态
 * - 键盘无障碍访问支持
 * - 响应式布局适配
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <FilterTabs 
 *   items={categoryItems} 
 *   onTabChange={(value) => setSelectedCategory(value)}
 *   filterType="category"
 * />
 * 
 * // 显示数量统计
 * <FilterTabs 
 *   items={tagItems}
 *   selectedValue={selectedTag}
 *   onTabChange={handleTagChange}
 *   showCounts={true}
 *   filterType="tag"
 * />
 * 
 * // 加载状态
 * <FilterTabs 
 *   items={[]}
 *   loading={true}
 *   filterType="collection"
 * />
 * ```
 */
export function FilterTabs({
  items,
  selectedValue = '',
  onTabChange,
  className,
  showCounts = false,
  filterType = 'category',
  loading = false,
  allowDeselect = false,
}: FilterTabsProps) {
  // 合并"All"选项和传入的items
  const allOption = createAllOption(filterType);
  
  // 确保 ID 唯一性 - 如果传入的 items 中有与 allOption.id 冲突的，给它们添加后缀
  const itemsWithUniqueIds = items.map((item, index) => {
    if (item.id === allOption.id) {
      return {
        ...item,
        id: `${item.id}_${index}`
      };
    }
    return item;
  });
  
  const allItems = [allOption, ...itemsWithUniqueIds];

  // 处理标签点击
  const handleTabClick = (item: FilterTabItem) => {
    if (item.disabled || loading) return;
    
    // 如果允许取消选中且点击的是当前选中项，则取消选中
    if (allowDeselect && selectedValue === item.value) {
      onTabChange?.('', allOption);
      return;
    }
    
    onTabChange?.(item.value, item);
  };

  // 如果正在加载，显示骨架屏
  if (loading) {
    return (
      <div 
        className={cn("flex flex-wrap gap-2", className)}
        aria-label="筛选标签加载中"
      >
        {/* 加载状态显示几个骨架标签 */}
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-9 w-20 bg-muted rounded-md animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn("flex flex-wrap gap-2", className)}
      role="tablist"
      aria-label={`${filterType} 筛选标签`}
    >
      {allItems.map((item) => {
        const isSelected = selectedValue === item.value || (selectedValue === '' && item.isDefault);
        const isDisabled = item.disabled;

        return (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={cn(
              filterTabVariants({ 
                variant: isDisabled ? 'disabled' : isSelected ? 'selected' : 'default',
                size: 'default'
              }),
              // 增强悬停效果 (需求10.4)
              !isDisabled && !isSelected && "hover:shadow-sm hover:scale-[1.02]",
              isSelected && "shadow-md",
              "transition-all duration-200 ease-out"
            )}
            onClick={() => handleTabClick(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick(item);
              }
            }}
            disabled={isDisabled}
            role="tab"
            aria-selected={isSelected}
            aria-controls={`${filterType}-content`}
            tabIndex={isSelected ? 0 : -1}
          >
            <span className="flex items-center gap-1.5">
              <span>{item.label}</span>
              {/* 可选的数量统计显示 */}
              {showCounts && item.count !== undefined && (
                <span className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
                  isSelected 
                    ? "bg-white/20 text-white" 
                    : "bg-muted-foreground/10 text-muted-foreground"
                )}>
                  {item.count}
                </span>
              )}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export default FilterTabs;