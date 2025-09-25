/**
 * CategoryTree 分类折叠树组件
 * 
 * 使用@radix-ui/react-collapsible实现分类的层次展示和折叠/展开功能
 * 支持Group1-5的层次结构，集成状态管理和分类选择功能
 * 
 * 需求引用:
 * - 3.0: 分类导航系统 - 支持分类层次结构和筛选功能
 * 
 * @author WebVault Team
 */

'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Category,
  CategoryTreeNode
} from '../types';
import { useHomepageCategories, useHomepageFilters } from '../stores/homepage-store';

/**
 * CategoryTree组件属性
 */
interface CategoryTreeProps {
  /**
   * 分类数据列表
   */
  categories?: Category[];
  
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 是否显示加载状态
   */
  isLoading?: boolean;
  
  /**
   * 是否紧凑显示模式
   */
  compact?: boolean;
  
  /**
   * 自定义分类点击处理
   */
  onCategorySelect?: (categoryId: string | null) => void;
}

/**
 * 单个分类树节点组件
 */
interface CategoryTreeNodeProps {
  /**
   * 分类节点数据
   */
  node: CategoryTreeNode;
  
  /**
   * 当前节点层级深度 (0开始)
   */
  level: number;
  
  /**
   * 当前选中的分类ID
   */
  selectedCategoryId: string | null;
  
  /**
   * 已展开的分类ID列表
   */
  expandedCategories: string[];
  
  /**
   * 是否紧凑模式
   */
  compact: boolean;
  
  /**
   * 分类选择处理函数
   */
  onSelect: (categoryId: string | null) => void;
  
  /**
   * 展开/折叠处理函数
   */
  onToggleExpand: (categoryId: string) => void;
}

/**
 * 单个分类树节点组件实现
 */
function CategoryTreeNodeComponent({
  node,
  level,
  selectedCategoryId,
  expandedCategories,
  compact,
  onSelect,
  onToggleExpand
}: CategoryTreeNodeProps) {
  const isSelected = selectedCategoryId === node.id;
  const isExpanded = expandedCategories.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;
  
  // 计算缩进样式
  const indentStyle = {
    paddingLeft: `${level * (compact ? 12 : 16) + (compact ? 8 : 12)}px`
  };
  
  /**
   * 处理分类选择
   */
  const handleSelect = () => {
    onSelect(isSelected ? null : node.id);
  };
  
  /**
   * 处理展开/折叠
   */
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };
  
  return (
    <Collapsible.Root open={isExpanded}>
      {/* 分类节点按钮 */}
      <div
        className={cn(
          'group relative flex items-center transition-colors duration-200',
          'hover:bg-muted/50',
          isSelected && 'bg-primary/10 border-l-2 border-primary'
        )}
        style={indentStyle}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'mr-1 h-6 w-6 shrink-0 p-0',
              'text-muted-foreground hover:text-foreground',
              'transition-transform duration-200',
              isExpanded && 'rotate-0'
            )}
            onClick={handleToggleExpand}
            aria-label={isExpanded ? '折叠分类' : '展开分类'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {/* 没有子分类时的占位空间 */}
        {!hasChildren && (
          <div className="mr-1 w-6 shrink-0" />
        )}
        
        {/* 分类选择按钮 */}
        <Button
          variant="ghost"
          className={cn(
            'flex-1 justify-start text-left h-auto min-h-0 p-0',
            'hover:bg-transparent',
            compact ? 'py-1' : 'py-2'
          )}
          onClick={handleSelect}
          aria-pressed={isSelected}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {/* 分类图标 */}
            <div className="shrink-0">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className={cn(
                    'text-primary',
                    compact ? 'h-3 w-3' : 'h-4 w-4'
                  )} />
                ) : (
                  <Folder className={cn(
                    'text-muted-foreground',
                    compact ? 'h-3 w-3' : 'h-4 w-4'
                  )} />
                )
              ) : (
                <div className={cn(
                  'rounded-full bg-muted-foreground',
                  compact ? 'h-1.5 w-1.5' : 'h-2 w-2'
                )} />
              )}
            </div>
            
            {/* 分类名称 */}
            <span className={cn(
              'truncate',
              compact ? 'text-xs' : 'text-sm',
              isSelected ? 'font-medium text-primary' : 'text-foreground',
              'group-hover:text-foreground'
            )}>
              {node.name}
            </span>
            
            {/* 网站数量 */}
            {node.website_count > 0 && (
              <span className={cn(
                'ml-auto shrink-0 text-xs text-muted-foreground',
                'bg-muted/50 px-1.5 py-0.5 rounded-full',
                compact && 'px-1 py-0'
              )}>
                {node.website_count}
              </span>
            )}
          </div>
        </Button>
      </div>
      
      {/* 子分类列表 */}
      {hasChildren && (
        <Collapsible.Content className="overflow-hidden transition-all duration-300 ease-in-out">
          <div className="space-y-0">
            {node.children.map((childNode) => (
              <CategoryTreeNodeComponent
                key={childNode.id}
                node={childNode}
                level={level + 1}
                selectedCategoryId={selectedCategoryId}
                expandedCategories={expandedCategories}
                compact={compact}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </div>
        </Collapsible.Content>
      )}
    </Collapsible.Root>
  );
}

/**
 * 构建分类树数据结构
 */
function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  // 创建ID到分类的映射
  const categoryMap = new Map<string, Category>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));
  
  // 构建树结构
  const rootNodes: CategoryTreeNode[] = [];
  const processedIds = new Set<string>();
  
  // 处理根节点 (parentId为null)
  categories
    .filter(cat => cat.parentId === null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach(rootCategory => {
      if (!processedIds.has(rootCategory.id)) {
        const treeNode = buildTreeNode(rootCategory, categoryMap, processedIds);
        if (treeNode) {
          rootNodes.push(treeNode);
        }
      }
    });
  
  return rootNodes;
}

/**
 * 递归构建单个树节点
 */
function buildTreeNode(
  category: Category, 
  categoryMap: Map<string, Category>,
  processedIds: Set<string>
): CategoryTreeNode | null {
  if (processedIds.has(category.id)) {
    return null;
  }
  
  processedIds.add(category.id);
  
  // 查找子分类
  const children: CategoryTreeNode[] = [];
  const childCategories = Array.from(categoryMap.values())
    .filter(cat => cat.parentId === category.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  
  childCategories.forEach(childCategory => {
    if (!processedIds.has(childCategory.id)) {
      const childNode = buildTreeNode(childCategory, categoryMap, processedIds);
      if (childNode) {
        children.push(childNode);
      }
    }
  });
  
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    children,
    website_count: category.website_count,
    is_expanded: category.is_expanded,
    sort_order: category.sort_order,
  };
}

/**
 * 模拟分类数据 (用于开发测试)
 */
const MOCK_CATEGORIES: Category[] = [
  // Group 1 - Technology
  {
    id: 'tech',
    name: 'Technology',
    slug: 'technology',
    parentId: null,
    description: 'Technology related websites',
    status: 'active',
    sort_order: 1,
    website_count: 45,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ai',
    name: 'AI & Machine Learning',
    slug: 'ai-machine-learning',
    parentId: 'tech',
    description: 'AI and ML resources',
    status: 'active',
    sort_order: 1,
    website_count: 15,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'webdev',
    name: 'Web Development',
    slug: 'web-development',
    parentId: 'tech',
    description: 'Web development tools and resources',
    status: 'active',
    sort_order: 2,
    website_count: 30,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  // Group 2 - Business
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    parentId: null,
    description: 'Business and entrepreneurship',
    status: 'active',
    sort_order: 2,
    website_count: 32,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'finance',
    name: 'Finance',
    slug: 'finance',
    parentId: 'business',
    description: 'Financial tools and services',
    status: 'active',
    sort_order: 1,
    website_count: 18,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    slug: 'marketing',
    parentId: 'business',
    description: 'Marketing tools and resources',
    status: 'active',
    sort_order: 2,
    website_count: 14,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  // Group 3 - Lifestyle
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    slug: 'lifestyle',
    parentId: null,
    description: 'Lifestyle and entertainment',
    status: 'active',
    sort_order: 3,
    website_count: 28,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'travel',
    name: 'Travel',
    slug: 'travel',
    parentId: 'lifestyle',
    description: 'Travel planning and inspiration',
    status: 'active',
    sort_order: 1,
    website_count: 12,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    parentId: 'lifestyle',
    description: 'Health and wellness resources',
    status: 'active',
    sort_order: 2,
    website_count: 16,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  // Group 4 - Education
  {
    id: 'education',
    name: 'Education',
    slug: 'education',
    parentId: null,
    description: 'Educational resources and tools',
    status: 'active',
    sort_order: 4,
    website_count: 22,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'programming',
    name: 'Programming',
    slug: 'programming',
    parentId: 'education',
    description: 'Programming tutorials and courses',
    status: 'active',
    sort_order: 1,
    website_count: 15,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  // Group 5 - Tools
  {
    id: 'tools',
    name: 'Tools',
    slug: 'tools',
    parentId: null,
    description: 'Productivity and utility tools',
    status: 'active',
    sort_order: 5,
    website_count: 35,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'design',
    name: 'Design',
    slug: 'design',
    parentId: 'tools',
    description: 'Design tools and resources',
    status: 'active',
    sort_order: 1,
    website_count: 20,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    slug: 'productivity',
    parentId: 'tools',
    description: 'Productivity and organization tools',
    status: 'active',
    sort_order: 2,
    website_count: 15,
    is_expanded: false,
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * CategoryTree 主组件
 */
export function CategoryTree({
  categories = MOCK_CATEGORIES,
  className = '',
  isLoading = false,
  compact = false,
  onCategorySelect,
}: CategoryTreeProps) {
  const {
    expandedCategories,
    selectedCategory: _selectedCategory,
    toggleExpanded
  } = useHomepageCategories();
  
  const { 
    categoryId, 
    setCategory 
  } = useHomepageFilters();
  
  // 构建分类树
  const categoryTree = React.useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return buildCategoryTree(categories);
  }, [categories]);
  
  /**
   * 处理分类选择
   */
  const handleCategorySelect = (categoryId: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    } else {
      setCategory(categoryId);
    }
  };
  
  /**
   * 处理分类展开/折叠
   */
  const handleToggleExpand = (categoryId: string) => {
    toggleExpanded(categoryId);
  };
  
  // 加载状态
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 px-2 py-1">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-3 w-6 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  
  // 空状态
  if (!categoryTree || categoryTree.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Folder className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          暂无分类数据
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-0', className)}>
      {categoryTree.map((node) => (
        <CategoryTreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          selectedCategoryId={categoryId}
          expandedCategories={expandedCategories}
          compact={compact}
          onSelect={handleCategorySelect}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </div>
  );
}

export default CategoryTree;