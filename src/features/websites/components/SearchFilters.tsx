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

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Search } from 'lucide-react';

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
import { DEFAULT_SORT_OPTIONS } from '../types/filters';
import type { Category } from '../types/category';

/**
 * 网站筛选器接口
 */
export interface WebsiteFilters {
  search?: string;
  categoryId?: string | null;
  selectedTags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  featuredOnly?: boolean;
  includeAds?: boolean;
  minRating?: number;
}

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
  onFiltersChange?: (filters: WebsiteFilters) => void;
  
  /**
   * 重置回调函数
   */
  onReset?: () => void;
}

// 模拟分类数据 - 后续可以从API获取
const MOCK_CATEGORIES: Category[] = [
  { 
    id: '1', 
    name: 'Technology', 
    description: 'Tech websites and tools',
    slug: 'technology', 
    parentId: null,
    status: 'active',
    sort_order: 1,
    website_count: 15,
    is_expanded: false,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '2', 
    name: 'Design', 
    description: 'Design resources and inspiration',
    slug: 'design', 
    parentId: null,
    status: 'active',
    sort_order: 2,
    website_count: 12,
    is_expanded: false,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '3', 
    name: 'Education', 
    description: 'Learning platforms and resources',
    slug: 'education', 
    parentId: null,
    status: 'active',
    sort_order: 3,
    website_count: 8,
    is_expanded: false,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '4', 
    name: 'Business', 
    description: 'Business tools and services',
    slug: 'business', 
    parentId: null,
    status: 'active',
    sort_order: 4,
    website_count: 10,
    is_expanded: false,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
];

// 模拟标签数据 - 后续可以从API获取
const MOCK_TAGS = [
  { id: '1', name: 'Free', slug: 'free', website_count: 20, color: '#10B981' },
  { id: '2', name: 'Premium', slug: 'premium', website_count: 15, color: '#F59E0B' },
  { id: '3', name: 'Open Source', slug: 'open-source', website_count: 12, color: '#3B82F6' },
  { id: '4', name: 'Mobile App', slug: 'mobile-app', website_count: 8, color: '#8B5CF6' },
  { id: '5', name: 'Web Based', slug: 'web-based', website_count: 25, color: '#06B6D4' },
  { id: '6', name: 'API', slug: 'api', website_count: 7, color: '#EF4444' },
];

// 通用筛选选项
const GENERAL_FILTER_OPTIONS = [
  { value: 'no-filter', label: 'No Filter' },
  { value: 'featured', label: 'Featured Only' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'free', label: 'Free Only' },
];

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
  onReset 
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
    setSorting,
    setFeaturedOnly,
    resetFilters,
  } = useHomepageFilters();

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

  // 同步表单值与store状态
  useEffect(() => {
    setValue('query', search);
    setQuery(search);
  }, [search, setValue, setQuery]);

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
  const handleCategorySelect = (categoryId: string) => {
    const selectedCategoryId = categoryId === 'all' ? null : categoryId;
    setCategory(selectedCategoryId);
    
    // 触发筛选器变化回调
    onFiltersChange?.({
      search,
      categoryId: selectedCategoryId,
      selectedTags,
      sortBy,
      sortOrder,
      featuredOnly,
    });
  };

  /**
   * 处理标签选择
   */
  const handleTagSelect = (tagId: string) => {
    if (tagId === 'no-tags') {
      // 清除所有标签筛选
      selectedTags.forEach(tag => removeTag(tag));
      return;
    }
    
    if (selectedTags.includes(tagId)) {
      removeTag(tagId);
    } else {
      addTag(tagId);
    }
    
    // 触发筛选器变化回调
    onFiltersChange?.({
      search,
      categoryId,
      selectedTags: selectedTags.includes(tagId) 
        ? selectedTags.filter(t => t !== tagId)
        : [...selectedTags, tagId],
      sortBy,
      sortOrder,
      featuredOnly,
    });
  };

  /**
   * 处理通用筛选选择
   */
  const handleGeneralFilterSelect = (value: string) => {
    let newFeaturedOnly = featuredOnly;
    let newSortBy = sortBy;
    let newSortOrder = sortOrder;

    switch (value) {
      case 'no-filter':
        newFeaturedOnly = false;
        break;
      case 'featured':
        newFeaturedOnly = true;
        break;
      case 'recent':
        newSortBy = 'created_at';
        newSortOrder = 'desc';
        setSorting('created_at', 'desc');
        break;
      case 'popular':
        newSortBy = 'visit_count';
        newSortOrder = 'desc';
        setSorting('visit_count', 'desc');
        break;
    }

    if (newFeaturedOnly !== featuredOnly) {
      setFeaturedOnly(newFeaturedOnly);
    }
    
    // 触发筛选器变化回调
    onFiltersChange?.({
      search,
      categoryId,
      selectedTags,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      featuredOnly: newFeaturedOnly,
    });
  };

  /**
   * 处理排序选择
   */
  const handleSortSelect = (value: string) => {
    const [field, order] = value.split('-');
    setSorting(
      field as 'created_at' | 'updated_at' | 'title' | 'rating' | 'visit_count' | 'featured' | 'relevance',
      order as 'asc' | 'desc'
    );
    
    // 触发筛选器变化回调
    onFiltersChange?.({
      search,
      categoryId,
      selectedTags,
      sortBy: field,
      sortOrder: order as 'asc' | 'desc',
      featuredOnly,
    });
  };

  /**
   * 处理重置操作
   */
  const handleReset = () => {
    resetFilters();
    clearSearch();
    setValue('query', '');
    onReset?.();
  };

  // 获取当前选中的分类显示文本
  const getSelectedCategoryText = () => {
    if (!categoryId) return 'All Categories';
    const category = MOCK_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || 'All Categories';
  };

  // 获取当前选中的标签显示文本
  const getSelectedTagsText = () => {
    if (selectedTags.length === 0) {
      return 'Select tags';
    }
    
    if (selectedTags.length === 1) {
      const tag = MOCK_TAGS.find(t => t.id === selectedTags[0]);
      return tag?.name || 'Select tags';
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
    <section 
      className={`bg-background border-b border-border py-4 ${className}`}
      aria-label="搜索和筛选控制"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 统一的搜索和筛选控制区域 - 确保边缘对齐 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 搜索表单区域 - 左侧对齐网站卡片 */}
          <div className="flex-1 max-w-md lg:max-w-sm xl:max-w-md lg:flex-shrink-0">
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

          {/* 筛选器控制区域 */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
          {/* 分类筛选下拉框 */}
          <div className="min-w-[140px] w-auto">
            <Select onValueChange={handleCategorySelect} value={categoryId || 'all'}>
              <SelectTrigger className="h-9 border-border bg-background text-sm">
                <SelectValue placeholder={getSelectedCategoryText()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-muted-foreground">
                  All Categories
                </SelectItem>
                {MOCK_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {category.website_count}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 标签筛选下拉框 */}
          <div className="min-w-[120px] w-auto">
            <Select onValueChange={handleTagSelect}>
              <SelectTrigger className="h-9 border-border bg-background text-sm">
                <SelectValue placeholder={getSelectedTagsText()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-tags" className="text-muted-foreground">
                  Clear Tags
                </SelectItem>
                {MOCK_TAGS.map((tag) => (
                  <SelectItem 
                    key={tag.id} 
                    value={tag.id}
                    className={selectedTags.includes(tag.id) ? "bg-accent" : ""}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
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
          <div className="min-w-[110px] w-auto">
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
          <div className="min-w-[160px] w-auto">
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
            onClick={handleReset}
            disabled={!hasActiveFilters && !hasActiveSearch}
            className="h-9 px-3 text-sm"
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
