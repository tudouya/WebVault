/**
 * HeroSection 组件
 * 
 * 首页的主要内容区域，包含品牌标题、描述和搜索表单
 * 集成React Hook Form处理搜索表单，支持XSS防护和表单验证
 * 
 * 需求引用:
 * - 2.0: 搜索功能 - 主搜索框和搜索按钮
 * - 9.0: 精确配色系统 - 使用HSL主题色彩
 * - 13.0: 字体和排版规范 - 分层文字大小和权重
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  searchFormSchema, 
  searchFormResolver, 
  searchFormDefaults,
  type SearchFormData,
  FORM_ERROR_MESSAGES 
} from '../schemas';
import { useHomepageFilters } from '../stores/homepage-store';

/**
 * HeroSection组件属性
 */
interface HeroSectionProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 是否显示在加载状态
   */
  isLoading?: boolean;
}

/**
 * HeroSection 主要内容组件
 * 
 * 提供品牌展示和搜索入口功能
 * 集成搜索表单验证和URL导航
 */
export function HeroSection({ 
  className = '',
  isLoading = false 
}: HeroSectionProps) {
  const router = useRouter();
  const { setSearch } = useHomepageFilters();
  
  // React Hook Form设置
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch
  } = useForm({
    resolver: searchFormResolver,
    defaultValues: searchFormDefaults,
    mode: 'onChange',
  });
  
  // 监听搜索输入变化以清除错误
  const queryValue = watch('query');
  React.useEffect(() => {
    if (queryValue && errors.query) {
      clearErrors('query');
    }
  }, [queryValue, errors.query, clearErrors]);

  /**
   * 处理搜索表单提交
   * 验证输入后导航到搜索结果页面
   */
  const onSubmit = async (data: any) => {
    try {
      const { query, searchType } = data;
      
      // 检查是否为空搜索
      if (!query || query.trim().length === 0) {
        setError('query', {
          type: 'manual',
          message: FORM_ERROR_MESSAGES.SEARCH.REQUIRED,
        });
        return;
      }

      // 更新store状态
      setSearch(query.trim());
      
      // 导航到搜索结果页面
      const searchParams = new URLSearchParams();
      searchParams.set('search', query.trim());
      
      if (searchType && searchType !== 'all') {
        searchParams.set('type', searchType);
      }
      
      router.push(`/search?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('搜索提交错误:', error);
      setError('query', {
        type: 'manual',
        message: '搜索时发生错误，请重试',
      });
    }
  };

  /**
   * 处理搜索按钮点击
   * 支持Enter键和点击搜索按钮
   */
  const handleSearchClick = () => {
    handleSubmit(onSubmit)();
  };

  /**
   * 处理键盘事件
   * Enter键触发搜索
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <section 
      className={`relative bg-background py-16 px-4 sm:py-24 sm:px-6 lg:px-8 ${className}`}
      aria-label="网站主要内容和搜索"
    >
      <div className="mx-auto max-w-6xl text-center">
        {/* 主标题区域 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight overflow-hidden">
            <div className="whitespace-nowrap overflow-x-auto sm:overflow-visible text-center">
              <span className="inline-block">The Best</span>{' '}
              <span className="text-primary inline-block">Directory</span>{' '}
              <span className="inline-block">Website Template</span>
            </div>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-card-foreground sm:text-xl">
            发现、收藏、分类优质网站，构建你的专属资源库
          </p>
        </div>

        {/* 搜索表单区域 */}
        <div className="mx-auto mt-10 max-w-2xl">
          <form 
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 sm:flex-row sm:gap-2"
            noValidate
            role="search"
            aria-label="网站搜索表单"
          >
            {/* 搜索输入框 */}
            <div className="relative flex-1">
              <div className="relative">
                <Input
                  {...register('query')}
                  type="text"
                  placeholder="搜索网站、分类或关键词..."
                  className={`
                    h-12 w-full pl-4 pr-12 text-base
                    ${errors.query ? 'border-destructive ring-destructive' : ''}
                    focus:ring-primary focus:border-primary
                  `}
                  disabled={isLoading || isSubmitting}
                  onKeyDown={handleKeyDown}
                  aria-invalid={errors.query ? 'true' : 'false'}
                  aria-describedby={errors.query ? 'search-error' : undefined}
                />
                
                {/* 搜索图标 */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search 
                    className="h-5 w-5 text-muted-foreground" 
                    aria-hidden="true"
                  />
                </div>
              </div>
              
              {/* 搜索错误提示 */}
              {errors.query && (
                <p 
                  id="search-error"
                  className="mt-2 text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.query.message}
                </p>
              )}
            </div>

            {/* 搜索按钮 */}
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 text-base font-semibold"
              disabled={isLoading || isSubmitting}
              onClick={handleSearchClick}
              aria-label="执行搜索"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  搜索中...
                </>
              ) : (
                '搜索'
              )}
            </Button>
          </form>

          {/* 搜索提示信息 */}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              尝试搜索 "设计工具"、"开发资源" 或 "学习平台" 等关键词
            </p>
          </div>
        </div>

        {/* 特色统计信息 */}
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 sm:max-w-none sm:grid-cols-3 sm:gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">1000+</div>
            <div className="mt-2 text-sm font-medium text-card-foreground">精选网站</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">50+</div>
            <div className="mt-2 text-sm font-medium text-card-foreground">分类标签</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="mt-2 text-sm font-medium text-card-foreground">持续更新</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;