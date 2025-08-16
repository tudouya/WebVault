/**
 * SortDropdown排序下拉组件
 * 
 * 为collection、category、tag浏览页面提供统一的排序下拉菜单
 * 默认显示"Sort by Time listed"选项，支持动态排序选项和状态管理
 * 
 * 需求引用:
 * - 需求2.2: 分类页面加载筛选控件时应提供排序下拉菜单
 * - 需求3.2: 标签页面加载筛选控件时应提供排序下拉菜单
 * - 需求11.1: 排序下拉菜单显示时应在筛选区域右侧显示"Sort by Time listed"默认选项
 * - 需求11.2: 下拉菜单展开时应显示可选的排序选项列表
 * - 需求11.5: 排序操作触发时应提供适当的加载和状态反馈
 */

'use client';

import React from 'react';
import { ChevronDown, Clock, ArrowUpDown, Star, TrendingUp, Hash } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SortField, SortOrder } from '@/features/websites/types/filters';

/**
 * 排序选项配置接口
 */
export interface SortOption {
  /** 排序字段 */
  field: SortField;
  /** 显示标签 */
  label: string;
  /** 排序顺序 */
  order: SortOrder;
  /** 图标（可选） */
  icon?: React.ElementType;
  /** 描述（可选） */
  description?: string;
}

/**
 * SortDropdown组件属性接口
 */
export interface SortDropdownProps {
  /** 可用的排序选项列表 */
  options: SortOption[];
  /** 当前选中的排序值（格式为 "field-order"） */
  value?: string;
  /** 排序选项改变时的回调函数 */
  onValueChange?: (value: string, option: SortOption) => void;
  /** 组件自定义类名 */
  className?: string;
  /** 是否为加载状态 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 组件大小 */
  size?: 'sm' | 'default' | 'lg';
  /** 下拉菜单位置 */
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * 默认排序选项配置
 */
export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  {
    field: 'created_at',
    label: 'Time listed',
    order: 'desc',
    icon: Clock,
    description: 'Recently added websites first',
  },
  {
    field: 'updated_at',
    label: 'Recently updated',
    order: 'desc',
    icon: ArrowUpDown,
    description: 'Recently updated websites first',
  },
  {
    field: 'title',
    label: 'Name (A-Z)',
    order: 'asc',
    icon: Hash,
    description: 'Alphabetical order',
  },
  {
    field: 'title',
    label: 'Name (Z-A)',
    order: 'desc',
    icon: Hash,
    description: 'Reverse alphabetical order',
  },
  {
    field: 'rating',
    label: 'Highest rated',
    order: 'desc',
    icon: Star,
    description: 'Highest rated websites first',
  },
  {
    field: 'visit_count',
    label: 'Most popular',
    order: 'desc',
    icon: TrendingUp,
    description: 'Most visited websites first',
  },
];

/**
 * 生成排序选项的唯一值标识符
 */
function getSortValue(option: SortOption): string {
  return `${option.field}-${option.order}`;
}

/**
 * 根据值字符串解析排序选项
 */
function parseSortValue(value: string, options: SortOption[]): SortOption | null {
  return options.find(option => getSortValue(option) === value) || null;
}

/**
 * 获取显示标签文本
 */
function getDisplayLabel(option: SortOption | null): string {
  if (!option) return 'Sort by Time listed';
  return `Sort by ${option.label}`;
}

/**
 * SortDropdown排序下拉组件
 * 
 * 提供统一的排序下拉菜单，支持多种排序方式的选择
 * 默认显示"Sort by Time listed"，可自定义排序选项和状态
 * 
 * 特性:
 * - 默认显示"Sort by Time listed"选项 (需求11.1)
 * - 展开显示可选排序选项列表 (需求11.2)
 * - 加载状态和错误处理 (需求11.5)
 * - 支持图标和描述的丰富显示
 * - 响应式设计和无障碍访问
 * - 与现有UI组件风格保持一致
 * - 灵活的配置选项支持不同页面需求
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <SortDropdown 
 *   options={DEFAULT_SORT_OPTIONS}
 *   value="created_at-desc"
 *   onValueChange={(value, option) => handleSortChange(option)}
 * />
 * 
 * // 自定义选项
 * <SortDropdown 
 *   options={customSortOptions}
 *   placeholder="Choose sort option"
 *   loading={isLoading}
 *   size="lg"
 * />
 * 
 * // 禁用状态
 * <SortDropdown 
 *   options={sortOptions}
 *   disabled={true}
 *   className="w-48"
 * />
 * ```
 */
export function SortDropdown({
  options = DEFAULT_SORT_OPTIONS,
  value,
  onValueChange,
  className,
  loading = false,
  disabled = false,
  placeholder = 'Sort by Time listed',
  size = 'default',
  side = 'bottom',
}: SortDropdownProps) {
  // 获取当前选中的排序选项
  const selectedOption = value ? parseSortValue(value, options) : null;
  const displayValue = getDisplayLabel(selectedOption);

  // 处理排序选项改变
  const handleValueChange = (newValue: string) => {
    const option = parseSortValue(newValue, options);
    if (option && onValueChange) {
      onValueChange(newValue, option);
    }
  };

  // 大小样式配置
  const sizeStyles = {
    sm: 'h-8 text-xs',
    default: 'h-9 text-sm',
    lg: 'h-10 text-base',
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div 
        className={cn(
          "inline-flex items-center justify-between rounded-md border border-input bg-background px-3 py-2",
          sizeStyles[size],
          "animate-pulse cursor-not-allowed opacity-60",
          className
        )}
        aria-label="排序选项加载中"
      >
        <span className="text-muted-foreground">Loading...</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger 
        className={cn(
          "inline-flex items-center justify-between gap-2 transition-all duration-200",
          sizeStyles[size],
          // 悬停和聚焦效果
          "hover:border-primary/50 focus:border-primary",
          // 禁用状态
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
        aria-label="选择排序方式"
      >
        <SelectValue placeholder={placeholder}>
          <div className="flex items-center gap-2">
            {/* 显示当前选中选项的图标 */}
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="truncate">{displayValue}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent 
        side={side}
        className="min-w-[200px] p-1"
        sideOffset={4}
      >
        {options.map((option) => {
          const optionValue = getSortValue(option);
          const Icon = option.icon;
          
          return (
            <SelectItem
              key={optionValue}
              value={optionValue}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground",
                "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                {/* 排序选项图标 */}
                {Icon && (
                  <Icon className="h-4 w-4 flex-shrink-0" />
                )}
                
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {/* 排序选项标签 */}
                  <div className="font-medium truncate">
                    {option.label}
                  </div>
                  
                  {/* 可选的描述文字 */}
                  {option.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {option.description}
                    </div>
                  )}
                </div>
                
                {/* 排序顺序指示器 */}
                <div className="flex items-center text-xs text-muted-foreground">
                  {option.order === 'asc' ? '↑' : '↓'}
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export default SortDropdown;