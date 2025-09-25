/**
 * Blog Page State Management Store
 * 
 * 基于Zustand创建博客页面状态管理，支持分页导航、分类筛选、数据加载和错误处理
 * 集成nuqs实现URL状态同步，支持浏览器前进后退和链接分享功能
 * 复用collection-store.ts的成熟模式，确保一致性和可靠性
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  parseAsString,
  parseAsInteger,
  useQueryStates
} from 'nuqs';
import { BlogCardData, BlogURLParams } from '../types';
import {
  BlogCategoryType,
  BLOG_CATEGORIES,
  BlogCategoryUtils
} from '../constants/categories';

/**
 * 博客页面URL搜索参数解析器配置
 * 支持博客页面的完整URL状态管理，与博客类型定义保持一致
 */
export const blogSearchParamsParsers = {
  // 分类筛选
  category: parseAsString,
  
  // 分页参数
  page: parseAsInteger,
} as const;

/**
 * 博客页面分页接口
 */
export interface BlogPagination {
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 总文章数 */
  totalItems: number;
  /** 每页文章数（固定6篇） */
  itemsPerPage: 6;
}

/**
 * 博客页面完整状态接口
 * 基于设计文档简化的博客页面状态，移除不必要的搜索功能
 */
export interface BlogPageState {
  // 数据状态
  /** 当前页面的博客文章列表 */
  blogs: BlogCardData[];
  /** 文章总数 */
  totalCount: number;
  
  // 筛选状态
  /** 当前激活的分类 */
  activeCategory: BlogCategoryType;
  
  // 分页状态
  /** 分页信息 */
  pagination: BlogPagination;
  
  // UI状态
  /** 数据加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 重试计数 */
  retryCount: number;
  
  // 元数据
  /** 上次数据更新时间 */
  lastUpdated: string | null;
  /** 数据来源标识 */
  dataSource: 'mock' | 'api';
  
  // 操作方法
  actions: {
    // 数据加载方法
    /** 加载博客文章 */
    fetchBlogs: () => Promise<void>;
    /** 刷新博客文章 */
    refreshBlogs: () => Promise<void>;
    
    // 分类筛选方法
    /** 设置激活的分类 */
    setActiveCategory: (category: BlogCategoryType) => void;
    
    // 分页方法
    /** 设置当前页 */
    setCurrentPage: (page: number) => void;
    /** 跳转到下一页 */
    goToNextPage: () => void;
    /** 跳转到上一页 */
    goToPreviousPage: () => void;
    
    // 错误处理方法
    /** 设置错误信息 */
    setError: (error: string | null) => void;
    /** 清除错误信息 */
    clearError: () => void;
    /** 重试加载 */
    retryLoad: () => Promise<void>;
    
    // 重置方法
    /** 重置分页 */
    resetPagination: () => void;
    /** 重置所有状态 */
    resetAll: () => void;
    
    // URL同步方法
    /** 从URL同步状态 */
    syncFromURL: (params: BlogURLParams) => void;
  };
}

/**
 * 默认分页状态
 */
const DEFAULT_PAGINATION: BlogPagination = {
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 6,
};

/**
 * 模拟博客数据生成器
 * 临时数据，后续会替换为API调用
 */
function generateMockBlogs(category: BlogCategoryType, page: number, itemsPerPage: number): { blogs: BlogCardData[], totalCount: number } {
  // 模拟不同分类的文章数量
  const categoryItemCounts: Record<BlogCategoryType, number> = {
    'All': 30,
    'Lifestyle': 8,
    'Technologies': 12,
    'Design': 6,
    'Travel': 4,
    'Growth': 10,
  };
  
  const totalCount = categoryItemCounts[category] || 0;
  // const totalPages = Math.ceil(totalCount / itemsPerPage); // TODO: Use for pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
  
  const blogs: BlogCardData[] = [];
  
  for (let i = startIndex; i < endIndex; i++) {
    const blogId = `${category.toLowerCase()}-blog-${i + 1}`;
    const categoryForBlog = category === 'All' 
      ? BLOG_CATEGORIES[Math.floor(Math.random() * (BLOG_CATEGORIES.length - 1)) + 1] 
      : category;
    
    blogs.push({
      id: blogId,
      title: `${categoryForBlog} Blog Post ${i + 1}`,
      excerpt: `This is an engaging excerpt for ${categoryForBlog.toLowerCase()} blog post ${i + 1}. It provides a compelling preview of the content that will make readers want to click and read more.`,
      slug: `${categoryForBlog.toLowerCase()}-blog-post-${i + 1}`,
      coverImage: `/assets/images/blog-${(i % 6) + 1}.jpg`,
      author: {
        name: `Author ${Math.floor(i / 3) + 1}`,
        avatar: `/assets/images/avatar-${(i % 4) + 1}.jpg`,
      },
      category: categoryForBlog,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return { blogs, totalCount };
}

/**
 * 创建博客页面状态管理Store
 * 使用与collection-store相同的中间件配置，确保一致的开发体验
 */
export const useBlogStore = create<BlogPageState>()(
  devtools(
    persist(
      (set, get) => ({
        // 基础数据初始化
        blogs: [],
        totalCount: 0,
        
        // 筛选状态初始化
        activeCategory: 'All',
        
        // 分页状态初始化
        pagination: DEFAULT_PAGINATION,
        
        // UI状态初始化
        loading: false,
        error: null,
        isInitialized: false,
        retryCount: 0,
        
        // 元数据初始化
        lastUpdated: null,
        dataSource: 'mock',
        
        // 操作方法实现
        actions: {
          // 数据加载方法
          fetchBlogs: async () => {
            const state = get();
            
            // 防止重复加载
            if (state.loading) return;
            
            set(
              () => ({
                loading: true,
                error: null,
              }),
              false,
              'fetchBlogs:start'
            );
            
            try {
              // 模拟网络请求延迟
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // 获取当前筛选条件和分页信息
              const { activeCategory, pagination } = state;
              
              // 生成模拟数据
              const { blogs, totalCount } = generateMockBlogs(
                activeCategory,
                pagination.currentPage,
                pagination.itemsPerPage
              );
              
              // 计算总页数
              const totalPages = Math.ceil(totalCount / pagination.itemsPerPage);
              
              set(
                (current) => ({
                  blogs,
                  totalCount,
                  pagination: {
                    ...current.pagination,
                    totalItems: totalCount,
                    totalPages,
                  },
                  loading: false,
                  isInitialized: true,
                  retryCount: 0,
                  lastUpdated: new Date().toISOString(),
                }),
                false,
                'fetchBlogs:success'
              );
              
            } catch (error) {
              console.error('Failed to load blogs:', error);
              
              set(
                (current) => ({
                  loading: false,
                  retryCount: current.retryCount + 1,
                  error: error instanceof Error ? error.message : '加载博客文章失败，请稍后重试',
                }),
                false,
                'fetchBlogs:error'
              );
            }
          },
          
          refreshBlogs: async () => {
            const { actions } = get();
            await actions.fetchBlogs();
          },
          
          // 分类筛选方法
          setActiveCategory: (category: BlogCategoryType) => {
            set(
              (state) => ({
                activeCategory: category,
                pagination: { ...state.pagination, currentPage: 1 }, // 重置到第一页
              }),
              false,
              'setActiveCategory'
            );
            
            // 自动重新加载数据
            setTimeout(() => get().actions.fetchBlogs(), 100);
          },
          
          // 分页方法
          setCurrentPage: (page: number) => {
            const state = get();
            if (page < 1 || page > state.pagination.totalPages) return;
            
            set(
              (current) => ({
                pagination: { ...current.pagination, currentPage: page },
              }),
              false,
              'setCurrentPage'
            );
            
            // 重新加载数据
            setTimeout(() => get().actions.fetchBlogs(), 100);
          },
          
          goToNextPage: () => {
            const state = get();
            if (state.pagination.currentPage < state.pagination.totalPages) {
              get().actions.setCurrentPage(state.pagination.currentPage + 1);
            }
          },
          
          goToPreviousPage: () => {
            const state = get();
            if (state.pagination.currentPage > 1) {
              get().actions.setCurrentPage(state.pagination.currentPage - 1);
            }
          },
          
          // 错误处理方法
          setError: (error) => {
            set(
              { error },
              false,
              'setError'
            );
          },
          
          clearError: () => {
            set(
              { error: null },
              false,
              'clearError'
            );
          },
          
          retryLoad: async () => {
            const state = get();
            if (state.retryCount < 3) {  // 最多重试3次
              await get().actions.fetchBlogs();
            }
          },
          
          // 重置方法
          resetPagination: () => {
            set(
              { pagination: DEFAULT_PAGINATION },
              false,
              'resetPagination'
            );
          },
          
          resetAll: () => {
            set(
              {
                // 基础数据重置
                blogs: [],
                totalCount: 0,
                
                // 筛选状态重置
                activeCategory: 'All',
                
                // 分页状态重置
                pagination: DEFAULT_PAGINATION,
                
                // UI状态重置
                loading: false,
                error: null,
                isInitialized: false,
                retryCount: 0,
                
                // 保留元数据
                lastUpdated: get().lastUpdated,
                dataSource: get().dataSource,
                
                // 保留操作方法
                actions: get().actions,
              },
              false,
              'resetAll'
            );
          },
          
          // URL同步方法
          syncFromURL: (params: BlogURLParams) => {
            const {
              category = 'All',
              page = 1,
            } = params;
            
            // 验证分类是否有效
            const validCategory = BlogCategoryUtils.getValidCategory(category);
            
            set(
              (state) => ({
                activeCategory: validCategory,
                pagination: {
                  ...state.pagination,
                  currentPage: Math.max(1, parseInt(String(page)) || 1),
                },
                isInitialized: true, // 标记为已初始化，防止无限循环
              }),
              false,
              'syncFromURL'
            );
          },
        },
      }),
      {
        name: 'blog-store',
        storage: createJSONStorage(() => sessionStorage),
        // 只持久化用户偏好设置，URL参数通过nuqs管理
        partialize: () => ({
          // 不持久化任何状态，所有状态通过URL管理
        }),
      }
    ),
    {
      name: 'blog-store',
    }
  )
);

/**
 * 博客页面URL状态同步Hook
 * 
 * 使用nuqs管理URL参数，与Zustand store双向同步
 * 专门针对博客页面的URL状态管理需求
 */
export function useBlogUrlSync() {
  const store = useBlogStore();
  const { actions } = store;
  
  // 使用nuqs管理所有博客页面URL参数
  const [urlState, setUrlState] = useQueryStates(blogSearchParamsParsers);
  
  // 从URL更新store状态 (组件首次加载时调用)
  const syncStoreFromUrl = () => {
    actions.syncFromURL(urlState);
  };
  
  // 从store更新URL状态 (状态变更时调用)
  const syncUrlFromStore = () => {
    const blogUrlState: BlogURLParams = {};
    
    // 只有当分类不是 'All' 时才添加到URL
    if (store.activeCategory && store.activeCategory !== 'All') {
      blogUrlState.category = store.activeCategory;
    }
    
    // 只有当页面大于1时才添加到URL
    if (store.pagination.currentPage && store.pagination.currentPage > 1) {
      blogUrlState.page = store.pagination.currentPage;
    }
    
    setUrlState(blogUrlState);
  };
  
  return {
    urlState,
    setUrlState,
    syncStoreFromUrl,
    syncUrlFromStore,
  };
}

/**
 * 博客分页状态Hook
 * 
 * 提供分页相关的状态和操作方法，支持分页导航需求
 */
export function useBlogPagination() {
  const { pagination, actions, loading } = useBlogStore();
  
  return {
    ...pagination,
    
    // 分页状态计算
    hasNextPage: pagination.currentPage < pagination.totalPages,
    hasPreviousPage: pagination.currentPage > 1,
    isFirstPage: pagination.currentPage === 1,
    isLastPage: pagination.currentPage === pagination.totalPages,
    
    // 分页操作方法
    setPage: actions.setCurrentPage,
    goToNext: actions.goToNextPage,
    goToPrevious: actions.goToPreviousPage,
    resetPagination: actions.resetPagination,
    
    // UI状态
    isLoading: loading,
  };
}

/**
 * 博客分类筛选状态Hook
 * 
 * 提供分类筛选相关的状态和操作方法
 */
export function useBlogCategories() {
  const { activeCategory, actions } = useBlogStore();
  
  return {
    // 当前筛选状态
    activeCategory,
    availableCategories: BLOG_CATEGORIES,
    
    // 筛选操作方法
    setActiveCategory: actions.setActiveCategory,
  };
}

/**
 * 博客数据管理Hook
 * 
 * 提供数据加载和错误处理相关功能
 */
export function useBlogData() {
  const { 
    blogs, 
    totalCount, 
    loading, 
    error, 
    isInitialized, 
    retryCount, 
    lastUpdated, 
    dataSource, 
    actions 
  } = useBlogStore();
  
  return {
    // 数据状态
    blogs,
    totalCount,
    loading,
    error,
    isInitialized,
    retryCount,
    lastUpdated,
    dataSource,
    
    // 数据操作方法
    fetchBlogs: actions.fetchBlogs,
    refreshBlogs: actions.refreshBlogs,
    retryLoad: actions.retryLoad,
    setError: actions.setError,
    clearError: actions.clearError,
  };
}

// 默认导出store hook
export default useBlogStore;