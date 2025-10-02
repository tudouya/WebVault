/**
 * SearchFilters 组件
 * 
 * 搜索和筛选控制区域，集成搜索框和各种筛选器
 * 复用HeroSection搜索输入框样式，实现防抖搜索功能
 * 
 * 需求引用:
 * - 2.1: 搜索输入框带"Search..."占位符文本
 * - 2.2: 实时搜索建议或防抖处理
 * - 2.3: "All Categories"分类下拉选择器
 * - 2.5: "Select tags"标签下拉选择器，支持多选
 * - 2.7: "No Filter"通用筛选下拉选择器
 * - 2.8: "Sort by Time listed"排序下拉选择器
 * - 2.9: "Reset"重置按钮
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Check } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import {
  searchFormResolver,
  searchFormDefaults,
  type SearchFormData,
} from '../schemas';
import { useHomepageFilters } from '../stores/homepage-store';
import { useWebsiteSearch } from '../hooks/useWebsiteSearch';
import { useHomepageCategoryTree, useWebsiteTags } from '../hooks';
import type { CategoryNode } from '@/features/categories/types';
import type { SearchPageFilters } from '../types/website';

/**
 * SearchFilters组件属性
 */
interface SearchFiltersProps {
  /**
   * 自定义CSS类名
   */
  className?: string;

  /**
   * 搜索回调函数
   */
  onSearch?: (query: string) => void;

  /**
   * 筛选器变化回调函数
   */
  onFiltersChange?: (filters: Partial<SearchPageFilters>) => void;

  /**
   * 重置回调函数
   */
  onReset?: () => void;

  /**
   * 执行搜索函数
   * 当筛选器变化时调用此函数重新加载搜索结果
   */
  performSearch?: () => void;
}

// 通用筛选选项已删除 - 功能简化

/**
 * SearchFilters 搜索和筛选控制组件
 * 
 * 提供搜索框和各种筛选选择器的统一界面
 * 集成防抖搜索、表单验证和状态管理
 */
export function SearchFilters({
  className = '',
  onSearch,
  onFiltersChange,
  onReset,
  performSearch
}: SearchFiltersProps) {
  // 获取状态管理hooks
  const {
    search,
    categoryId,
    selectedTags,
    sortBy,
    sortOrder,
    featuredOnly,
    hasActiveFilters,
    setSearch,
    setCategory,
    addTag,
    removeTag,
    resetFilters,
  } = useHomepageFilters();

  const {
    categories: categoryTree,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useHomepageCategoryTree();

  const {
    tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useWebsiteTags();

  // 分类和标签搜索状态
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const categoryOptions = useMemo(() => {
    return flattenCategories(categoryTree).map((item) => ({
      id: item.id,
      name: item.name,
      label: item.depth > 0 ? `${'— '.repeat(item.depth)}${item.name}` : item.name,
      websiteCount: item.websiteCount,
    }));
  }, [categoryTree]);

  const tagOptions = useMemo(() => {
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      websiteCount: tag.websiteCount ?? 0,
      color: tag.color ?? undefined,
    }));
  }, [tags]);

  // 过滤后的分类选项
  const filteredCategoryOptions = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoryOptions;
    const query = categorySearchQuery.toLowerCase().trim();
    return categoryOptions.filter(cat =>
      cat.name.toLowerCase().includes(query)
    );
  }, [categoryOptions, categorySearchQuery]);

  // 过滤后的标签选项
  const filteredTagOptions = useMemo(() => {
    if (!tagSearchQuery.trim()) return tagOptions;
    const query = tagSearchQuery.toLowerCase().trim();
    return tagOptions.filter(tag =>
      tag.name.toLowerCase().includes(query)
    );
  }, [tagOptions, tagSearchQuery]);

  // 使用防抖搜索hook
  const {
    setQuery,
    executeSearch,
    clearSearch,
    isSearching,
    error: searchError,
    hasActiveSearch,
  } = useWebsiteSearch({
    debounceDelay: 300, // 300ms防抖延迟
    autoSearch: true,
    enableSuggestions: false, // 暂时禁用搜索建议
  });

  // React Hook Form设置 - 复用HeroSection的表单验证
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm({
    resolver: searchFormResolver,
    defaultValues: searchFormDefaults,
    mode: 'onChange',
  });

  // 监听搜索输入变化以清除错误
  const queryValue = watch('query');
  useEffect(() => {
    if (queryValue && errors.query) {
      clearErrors('query');
    }
  }, [queryValue, errors.query, clearErrors]);

  // 同步表单值与store状态 - 只同步表单值，不触发搜索
  const prevSearchRef = React.useRef(search);
  useEffect(() => {
    // 只在外部状态变化时更新表单，避免循环
    if (prevSearchRef.current !== search) {
      prevSearchRef.current = search;
      setValue('query', search);
      // 注意：这里不调用 setQuery，避免触发防抖搜索导致循环
    }
  }, [search, setValue]);

  /**
   * 处理搜索表单提交
   * 复用HeroSection的验证逻辑
   */
  const onSubmit = async (data: SearchFormData) => {
    try {
      const { query } = data;
      
      // 检查是否为空搜索
      if (!query || query.trim().length === 0) {
        clearSearch();
        onSearch?.('');
        return;
      }

      // 更新store状态
      setSearch(query.trim());
      executeSearch(query.trim());
      onSearch?.(query.trim());
      
    } catch (error) {
      console.error('搜索提交错误:', error);
      setError('query', {
        type: 'manual',
        message: '搜索时发生错误，请重试',
      });
    }
  };

  /**
   * 处理搜索输入变化 - 防抖处理
   */
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue('query', value);
    setQuery(value); // 触发防抖搜索
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  /**
   * 处理分类选择
   */
  const handleCategorySelect = (value: string) => {
    if (value.startsWith('__')) {
      return;
    }

    const selectedCategoryId = value === 'all' ? null : value;
    setCategory(selectedCategoryId);

    // 触发筛选器变化回调
    onFiltersChange?.({
      query: search,
      category: selectedCategoryId === null ? undefined : selectedCategoryId,
      tags: selectedTags,
      sortBy,
      sortOrder,
      featured: featuredOnly,
    });

    // 延迟触发搜索，确保状态已更新
    setTimeout(() => {
      performSearch?.();
    }, 0);
  };

  /**
   * 处理标签选择
   */
  const handleTagSelect = (tagId: string) => {
    if (tagId.startsWith('__')) {
      return;
    }

    if (tagId === 'no-tags') {
      // 清除所有标签筛选
      selectedTags.forEach(tag => removeTag(tag));

      // 延迟触发搜索
      setTimeout(() => {
        performSearch?.();
      }, 0);
      return;
    }

    if (selectedTags.includes(tagId)) {
      removeTag(tagId);
    } else {
      addTag(tagId);
    }

    // 触发筛选器变化回调
    const nextTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];

    onFiltersChange?.({
      query: search,
      category: categoryId ?? undefined,
      tags: nextTags,
      sortBy,
      sortOrder,
      featured: featuredOnly,
    });

    // 延迟触发搜索，确保状态已更新
    setTimeout(() => {
      performSearch?.();
    }, 0);
  };

  // 通用筛选和排序处理函数已删除 - 功能简化

  /**
   * 处理重置操作
   */
  const handleReset = () => {
    resetFilters();
    clearSearch();
    setValue('query', '');
    onFiltersChange?.({
      query: '',
      category: undefined,
      tags: [],
      sortBy: undefined,
      sortOrder: undefined,
      featured: undefined,
      includeAds: undefined,
      minRating: undefined,
    });
    onReset?.();
  };

  // 获取当前选中的分类显示文本
  const getSelectedCategoryText = () => {
    if (!categoryId) return 'All Categories';
    const category = categoryOptions.find((option) => option.id === categoryId);
    return category?.name || 'All Categories';
  };

  // 获取当前选中的标签显示文本
  const getSelectedTagsText = () => {
    if (selectedTags.length === 0) {
      return 'Select tags';
    }
    
    if (selectedTags.length === 1) {
      const tag = tagOptions.find(t => t.id === selectedTags[0]);
      return tag?.name || 'Select tags';
    }
    
    return `${selectedTags.length} tags selected`;
  };

  const tagSelectKey = useMemo(() => {
    if (selectedTags.length === 0) return 'tags-empty';
    const sorted = [...selectedTags].sort();
    return `tags-${sorted.join('-')}`;
  }, [selectedTags]);

  // 显示文本获取函数已删除 - 功能简化

  return (
    <section 
      className={`bg-background border-b border-border py-4 ${className}`}
      aria-label="搜索和筛选控制"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 统一的搜索和筛选控制区域 - 确保边缘对齐 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          {/* 搜索表单区域 - 增大宽度以利用释放的空间 */}
          <div className="flex-1 max-w-md lg:max-w-lg xl:max-w-2xl lg:flex-shrink-0">
            <form 
              onSubmit={handleSubmit(onSubmit)}
              className="w-full"
              noValidate
              role="search"
              aria-label="网站搜索表单"
            >
              {/* 搜索输入框 - 复用HeroSection样式 */}
              <div className="relative w-full">
              <div className="relative">
                <Input
                  {...register('query')}
                  type="text"
                  placeholder="Search..."
                  value={queryValue || ''}
                  onChange={handleSearchInputChange}
                  className={`
                    h-10 w-full pl-4 pr-10 text-sm
                    ${errors.query ? 'border-destructive ring-destructive' : ''}
                    focus:ring-primary focus:border-primary
                    ${isSearching ? 'opacity-75' : ''}
                  `}
                  disabled={isSubmitting || isSearching}
                  onKeyDown={handleKeyDown}
                  aria-invalid={errors.query ? 'true' : 'false'}
                  aria-describedby={errors.query ? 'search-error' : undefined}
                />
                
                {/* 搜索图标 */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search 
                    className={`h-4 w-4 text-muted-foreground ${isSearching ? 'animate-pulse' : ''}`} 
                    aria-hidden="true"
                  />
                </div>
              </div>
              </div>
              
              {/* 搜索错误提示 */}
              {errors.query && (
                <p 
                  id="search-error"
                  className="mt-1 text-xs text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.query.message}
                </p>
              )}
              
              {/* 搜索状态提示 */}
              {searchError && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {searchError}
                </p>
              )}
            </form>
          </div>

          {/* 筛选器控制区域 - 更宽松的间距 */}
          <div className="flex flex-wrap items-center gap-3 lg:gap-4 flex-shrink-0">
          {/* 分类筛选下拉框 - 带搜索功能 */}
          <div className="min-w-[160px] sm:min-w-[180px] w-auto">
            <Select
              onValueChange={(value) => {
                handleCategorySelect(value);
                setCategorySearchQuery(''); // 选择后清空搜索
              }}
              value={categoryId || 'all'}
              onOpenChange={(open) => {
                if (!open) setCategorySearchQuery(''); // 关闭时清空搜索
              }}
            >
              <SelectTrigger className="h-10 border-border bg-background text-sm" disabled={categoriesLoading}>
                <SelectValue placeholder={getSelectedCategoryText()} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {/* 搜索框 */}
                <div className="sticky top-0 z-10 bg-background p-2 border-b">
                  <Input
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => {
                      e.stopPropagation();
                      setCategorySearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-8 text-sm"
                  />
                </div>
                <SelectItem value="all" className="text-muted-foreground">
                  All Categories
                </SelectItem>
                {categoriesLoading ? (
                  <SelectItem value="__categories_loading" disabled>
                    分类加载中...
                  </SelectItem>
                ) : categoriesError ? (
                  <SelectItem value="__categories_error" disabled>
                    {categoriesError}
                  </SelectItem>
                ) : filteredCategoryOptions.length === 0 ? (
                  <SelectItem value="__categories_empty" disabled>
                    {categorySearchQuery ? '未找到匹配的分类' : '暂无分类'}
                  </SelectItem>
                ) : (
                  filteredCategoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{category.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {category.websiteCount}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 标签筛选下拉框 - 带搜索功能和多选指示 */}
          <div className="min-w-[140px] sm:min-w-[160px] w-auto">
            <Select
              key={tagSelectKey}
              onValueChange={handleTagSelect}
              onOpenChange={(open) => {
                if (!open) setTagSearchQuery(''); // 关闭时清空搜索
              }}
            >
              <SelectTrigger className="h-10 border-border bg-background text-sm" disabled={tagsLoading}>
                <SelectValue placeholder={getSelectedTagsText()} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {/* 搜索框 */}
                <div className="sticky top-0 z-10 bg-background p-2 border-b">
                  <Input
                    placeholder="Search tags..."
                    value={tagSearchQuery}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTagSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-8 text-sm"
                  />
                </div>
                <SelectItem value="no-tags" className="text-muted-foreground">
                  Clear Tags
                </SelectItem>
                {tagsLoading ? (
                  <SelectItem value="__tags_loading" disabled>
                    标签加载中...
                  </SelectItem>
                ) : tagsError ? (
                  <SelectItem value="__tags_error" disabled>
                    {tagsError}
                  </SelectItem>
                ) : filteredTagOptions.length === 0 ? (
                  <SelectItem value="__tags_empty" disabled>
                    {tagSearchQuery ? '未找到匹配的标签' : '暂无标签'}
                  </SelectItem>
                ) : (
                  filteredTagOptions.map((tag) => (
                    <SelectItem
                      key={tag.id}
                      value={tag.id}
                      className={selectedTags.includes(tag.id) ? 'bg-accent' : ''}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {selectedTags.includes(tag.id) && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                          {tag.color && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                          <span>{tag.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {tag.websiteCount}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Reset按钮 - 与选择器高度一致 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasActiveFilters && !hasActiveSearch}
            className="h-10 px-4 text-sm"
            aria-label="重置所有筛选条件"
          >
            重置
          </Button>
          </div>
        </div>

        {/* 活跃筛选条件指示器 */}
        {(hasActiveFilters || hasActiveSearch) && (
          <div className="mt-3 text-xs text-muted-foreground">
            {hasActiveSearch && search && (
              <span>搜索: "{search}" </span>
            )}
            {categoryId && (
              <span>分类: {getSelectedCategoryText()} </span>
            )}
            {selectedTags.length > 0 && (
              <span>标签: {selectedTags.length}个 </span>
            )}
            {featuredOnly && (
              <span>仅显示推荐 </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default SearchFilters;

interface FlattenedCategory {
  id: string
  name: string
  depth: number
  websiteCount: number
}

function flattenCategories(nodes: CategoryNode[], depth = 0): FlattenedCategory[] {
  return nodes.flatMap((node) => {
    const current: FlattenedCategory = {
      id: node.id,
      name: node.name,
      depth,
      websiteCount: node.websiteCount ?? 0,
    }

    const children = Array.isArray(node.children) ? flattenCategories(node.children, depth + 1) : []

    return [current, ...children]
  })
}
