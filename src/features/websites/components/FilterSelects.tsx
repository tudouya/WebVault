"use client"

import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useHomepageFilters } from '../stores/homepage-store';
import { DEFAULT_SORT_OPTIONS } from '../types/filters';

/**
 * FilterSelects Component
 * 
 * 实现筛选下拉选择器，包含标签筛选、通用筛选和排序功能
 * 基于需求4：筛选和排序功能的实现
 */

// 模拟标签数据 - 后续可以从API获取
const MOCK_TAGS = [
  { id: '1', name: 'Sports', slug: 'sports', website_count: 5 },
  { id: '2', name: 'Education', slug: 'education', website_count: 8 },
  { id: '3', name: 'Entertainment', slug: 'entertainment', website_count: 12 },
  { id: '4', name: 'Business', slug: 'business', website_count: 6 },
  { id: '5', name: 'Finance', slug: 'finance', website_count: 4 },
  { id: '6', name: 'Design', slug: 'design', website_count: 7 },
  { id: '7', name: 'Games', slug: 'games', website_count: 3 },
  { id: '8', name: 'Lifestyle', slug: 'lifestyle', website_count: 9 },
];

// 通用筛选选项
const GENERAL_FILTER_OPTIONS = [
  { value: 'no-filter', label: 'No Filter' },
  { value: 'featured', label: 'Featured Only' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'popular', label: 'Most Popular' },
];

export const FilterSelects: React.FC = () => {
  const {
    selectedTags,
    sortBy,
    sortOrder,
    featuredOnly,
    hasActiveFilters,
    addTag,
    removeTag,
    setSorting,
    setFeaturedOnly,
    resetFilters,
  } = useHomepageFilters();

  // 处理标签选择
  const handleTagSelect = (tagId: string) => {
    if (tagId === 'no-filter') {
      // 清除所有标签筛选
      selectedTags.forEach(tag => removeTag(tag));
      return;
    }
    
    if (selectedTags.includes(tagId)) {
      removeTag(tagId);
    } else {
      addTag(tagId);
    }
  };

  // 处理通用筛选选择
  const handleGeneralFilterSelect = (value: string) => {
    switch (value) {
      case 'no-filter':
        setFeaturedOnly(false);
        break;
      case 'featured':
        setFeaturedOnly(true);
        break;
      case 'recent':
        setSorting('created_at', 'desc');
        break;
      case 'popular':
        setSorting('visit_count', 'desc');
        break;
    }
  };

  // 处理排序选择
  const handleSortSelect = (value: string) => {
    const [field, order] = value.split('-');
    setSorting(
      field as 'created_at' | 'updated_at' | 'title' | 'rating' | 'visit_count' | 'featured' | 'relevance',
      order as 'asc' | 'desc'
    );
  };

  // 获取当前选中的标签显示文本
  const getSelectedTagsText = () => {
    if (selectedTags.length === 0) {
      return 'Select Tags';
    }
    
    if (selectedTags.length === 1) {
      const tag = MOCK_TAGS.find(t => t.id === selectedTags[0]);
      return tag?.name || 'Select Tags';
    }
    
    return `${selectedTags.length} tags selected`;
  };

  // 获取当前通用筛选显示文本
  const getGeneralFilterText = () => {
    if (featuredOnly) return 'Featured Only';
    return 'No Filter';
  };

  // 获取当前排序显示文本
  const getCurrentSortText = () => {
    const currentSort = DEFAULT_SORT_OPTIONS.find(
      option => option.field === sortBy && option.order === sortOrder
    );
    return currentSort?.label || 'Sort by Time listed';
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* 标签筛选下拉框 */}
      <div className="min-w-[140px]">
        <Select onValueChange={handleTagSelect}>
          <SelectTrigger className="h-9 border-border bg-background text-sm">
            <SelectValue placeholder={getSelectedTagsText()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-filter" className="text-muted-foreground">
              No Filter
            </SelectItem>
            {MOCK_TAGS.map((tag) => (
              <SelectItem 
                key={tag.id} 
                value={tag.id}
                className={selectedTags.includes(tag.id) ? "bg-accent" : ""}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{tag.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {tag.website_count}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 通用筛选下拉框 */}
      <div className="min-w-[120px]">
        <Select onValueChange={handleGeneralFilterSelect}>
          <SelectTrigger className="h-9 border-border bg-background text-sm">
            <SelectValue placeholder={getGeneralFilterText()} />
          </SelectTrigger>
          <SelectContent>
            {GENERAL_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 排序下拉框 */}
      <div className="min-w-[160px]">
        <Select onValueChange={handleSortSelect}>
          <SelectTrigger className="h-9 border-border bg-background text-sm">
            <SelectValue placeholder={getCurrentSortText()} />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_SORT_OPTIONS.map((option) => (
              <SelectItem 
                key={`${option.field}-${option.order}`} 
                value={`${option.field}-${option.order}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset按钮 */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={resetFilters}
        disabled={!hasActiveFilters}
        className="h-9 px-3 text-sm"
      >
        Reset
      </Button>
    </div>
  );
};

export default FilterSelects;