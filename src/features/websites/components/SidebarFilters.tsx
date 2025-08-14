/**
 * SidebarFilters Component
 * 
 * 基于设计图重新实现的筛选面板组件
 * - 桌面端：左侧筛选面板，显示分类、标签和排序选项
 * - 移动端：可收缩的筛选抽屉
 * 
 * 符合设计图要求：
 * - "All Categories" 紫色按钮
 * - 分类层次结构展示
 * - 简洁的筛选控件
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

interface SidebarFiltersProps {
  /**
   * 是否在移动端折叠
   */
  isMobileCollapsed?: boolean;
  
  /**
   * 移动端切换回调
   */
  onMobileToggle?: () => void;
  
  /**
   * 是否正在加载
   */
  isLoading?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 分类数据结构（示例数据）
 */
const mockCategories = [
  {
    id: 'group1',
    name: 'Group 1',
    children: [
      { id: 'finance', name: 'Finance' },
      { id: 'travel', name: 'Travel' }
    ]
  },
  {
    id: 'group2',
    name: 'Group 2',
    children: [
      { id: 'education', name: 'Education' },
      { id: 'sports', name: 'Sports' }
    ]
  },
  {
    id: 'group3',
    name: 'Group 3',
    children: [
      { id: 'business', name: 'Business' },
      { id: 'games', name: 'Games' }
    ]
  },
  {
    id: 'group4',
    name: 'Group 4',
    children: [
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'lifestyle', name: 'Lifestyle' }
    ]
  },
  {
    id: 'group5',
    name: 'Group 5',
    children: [
      { id: 'productivity', name: 'Productivity' },
      { id: 'design', name: 'Design' }
    ]
  }
];

export function SidebarFilters({
  isMobileCollapsed = true,
  onMobileToggle,
  isLoading = false,
  className
}: SidebarFiltersProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set(['group1']));

  // 切换分组展开/折叠
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // 选择分类
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className={cn("relative", className)}>
      {/* 移动端遮罩层 */}
      {!isMobileCollapsed && (
        <div 
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileToggle}
          aria-hidden="true"
        />
      )}

      {/* 筛选面板主体 */}
      <div 
        className={cn(
          // 桌面端：正常的筛选面板
          'lg:block lg:space-y-6',
          // 移动端：固定定位的抽屉
          'fixed left-0 top-0 z-30 h-full w-80 transform transition-transform duration-300 ease-in-out',
          'lg:relative lg:w-full lg:h-auto lg:transform-none',
          // 移动端背景和边框
          'bg-background border-r border-border lg:bg-transparent lg:border-r-0',
          // 移动端折叠状态
          isMobileCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
        aria-label="筛选和分类导航"
      >
        {/* 移动端头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
          <h3 className="text-lg font-semibold">筛选器</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            aria-label="关闭筛选面板"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 筛选内容 */}
        <div className="p-4 lg:p-0 space-y-6">
          {/* All Categories 按钮 */}
          <div>
            <Button
              variant={selectedCategory === 'all' ? "default" : "outline"}
              className={cn(
                'w-full justify-start text-left h-auto py-3 px-4',
                selectedCategory === 'all' 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-border hover:bg-muted'
              )}
              onClick={() => handleCategorySelect('all')}
              disabled={isLoading}
            >
              All Categories
            </Button>
          </div>

          {/* 分类层次结构 - 改进版 */}
          <div className="space-y-1">
            {mockCategories.map((group) => (
              <div key={group.id} className="space-y-1">
                {/* 分组标题 - 更现代的卡片式设计 */}
                <button
                  className={cn(
                    "group flex w-full items-center justify-between py-3 px-4 text-sm font-semibold",
                    "bg-muted/30 hover:bg-muted/60 rounded-lg transition-all duration-200",
                    "border border-transparent hover:border-border/50",
                    expandedGroups.has(group.id) 
                      ? "text-foreground bg-muted/60 border-border/50 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => toggleGroup(group.id)}
                  disabled={isLoading}
                >
                  <span className="flex items-center gap-2">
                    {/* 分组图标 */}
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors duration-200",
                      expandedGroups.has(group.id) ? "bg-primary" : "bg-muted-foreground/40"
                    )} />
                    {group.name}
                  </span>
                  <div className={cn(
                    "transition-transform duration-200",
                    expandedGroups.has(group.id) && "rotate-180"
                  )}>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-colors duration-200",
                      expandedGroups.has(group.id) ? "text-foreground" : "text-muted-foreground"
                    )} />
                  </div>
                </button>

                {/* 子分类 - 更精致的子项设计 */}
                {expandedGroups.has(group.id) && (
                  <div className="ml-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {group.children.map((child, index) => (
                      <button
                        key={child.id}
                        className={cn(
                          "flex w-full items-center gap-3 py-2.5 px-4 text-sm",
                          "rounded-md transition-all duration-200 text-left group relative",
                          selectedCategory === child.id 
                            ? "text-primary font-medium bg-primary/10 border-l-2 border-primary shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                        onClick={() => handleCategorySelect(child.id)}
                        disabled={isLoading}
                        style={{ 
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        {/* 连接线效果 */}
                        <div className={cn(
                          "w-3 h-px bg-border transition-colors duration-200",
                          selectedCategory === child.id ? "bg-primary/30" : "group-hover:bg-border"
                        )} />
                        <span className="flex-1">{child.name}</span>
                        {/* 项目计数 - 可选 */}
                        {selectedCategory === child.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 标签筛选 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Select Tags</h4>
            <Select disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-filter">No Filter</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 排序选择 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Sort by</h4>
            <Select defaultValue="time-listed" disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time-listed">Time listed</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 重置按钮 */}
          <div className="pt-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSelectedCategory('all');
                setExpandedGroups(new Set(['group1']));
              }}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidebarFilters;