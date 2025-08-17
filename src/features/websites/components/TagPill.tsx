import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 标签颜色映射
 * 根据标签类型提供不同的彩色背景
 */
const getTagVariant = (tag: string): TagVariant => {
  const tagMapping: Record<string, TagVariant> = {
    // 娱乐类 - 红色系
    'Entertainment': 'red',
    'Gaming': 'red',
    'Movies': 'red',
    
    // 体育类 - 绿色系
    'Sports': 'green',
    'Fitness': 'green',
    
    // 教育类 - 蓝色系
    'Education': 'blue',
    'Learning': 'blue',
    'Technology': 'blue',
    
    // 商业类 - 紫色系
    'Business': 'purple',
    'Finance': 'purple',
    
    // 生活类 - 橙色系
    'Lifestyle': 'orange',
    'Health': 'orange',
    
    // 设计类 - 粉色系
    'Design': 'pink',
    'Art': 'pink',
    
    // 新闻类 - 青色系
    'News': 'cyan',
    'Media': 'cyan',
    
    // 生产力类 - 黄色系
    'Productivity': 'yellow',
    
    // 游戏类 - 靛色系
    'Games': 'indigo',
    
    // 旅行类 - 蓝绿色系
    'Travel': 'teal',
  };
  
  return tagMapping[tag] || 'gray';
};

/**
 * TagPill组件变体配置
 * 使用CVA管理不同颜色变体和尺寸
 */
const tagPillVariants = cva(
  // 基础样式 - 使用设计系统的标签圆角(6px)
  "inline-flex items-center font-medium transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        red: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
        green: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
        blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30",
        purple: "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30",
        orange: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30",
        pink: "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/30",
        cyan: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/30",
        yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
        indigo: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30",
        teal: "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/30",
        gray: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-md", // 对应设计系统的6px圆角
        md: "px-2.5 py-1 text-xs rounded-md",   // 默认尺寸
        lg: "px-3 py-1.5 text-sm rounded-lg",  // 大尺寸标签
      },
    },
    defaultVariants: {
      variant: "gray",
      size: "md",
    },
  }
);

type TagVariant = 
  | "red" 
  | "green" 
  | "blue" 
  | "purple" 
  | "orange" 
  | "pink" 
  | "cyan" 
  | "yellow" 
  | "indigo" 
  | "teal" 
  | "gray";

export interface TagPillProps extends VariantProps<typeof tagPillVariants> {
  /** 标签文本 */
  tag: string;
  /** 额外的CSS类名 */
  className?: string;
  /** 点击事件处理器 */
  onClick?: (tag: string) => void;
  /** 是否为选中状态 */
  selected?: boolean;
  /** 手动指定颜色变体，如不指定则自动根据标签内容判断 */
  variant?: TagVariant;
  /** 标签尺寸 */
  size?: "sm" | "md" | "lg";
}

/**
 * TagPill组件
 * 
 * 用于展示彩色标签pills，支持点击筛选和悬停效果
 * 
 * 特性:
 * - 自动根据标签内容判断颜色变体
 * - 支持手动指定颜色变体
 * - 响应式悬停和点击效果
 * - 使用设计系统的6px圆角规范
 * - 支持亮色和暗色主题
 * - 可选的选中状态样式
 * 
 * @example
 * ```tsx
 * // 自动颜色判断
 * <TagPill tag="Technology" onClick={handleTagClick} />
 * 
 * // 手动指定颜色
 * <TagPill tag="Custom" variant="purple" onClick={handleTagClick} />
 * 
 * // 不同尺寸
 * <TagPill tag="Small" size="sm" />
 * <TagPill tag="Large" size="lg" />
 * 
 * // 选中状态
 * <TagPill tag="Selected" selected={true} />
 * ```
 */
export function TagPill({ 
  tag, 
  className, 
  onClick, 
  selected = false,
  variant,
  size = "md",
  ...props 
}: TagPillProps) {
  // 自动判断颜色变体，优先使用手动指定的variant
  const colorVariant = variant || getTagVariant(tag);
  
  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // 阻止事件冒泡
    }
    onClick?.(tag);
  };

  return (
    <span
      className={cn(
        tagPillVariants({ variant: colorVariant, size }),
        "tag-pill",
        {
          // 选中状态样式增强
          "ring-2 ring-offset-1 ring-current/30": selected,
          // 可点击时的样式
          "hover:shadow-sm": onClick,
        },
        className
      )}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation(); // 阻止事件冒泡
          handleClick();
        }
      } : undefined}
      {...props}
    >
      {tag}
    </span>
  );
}

export default TagPill;