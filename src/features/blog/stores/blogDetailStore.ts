/**
 * Blog Detail Page State Management Store
 * 
 * 基于Zustand创建博客详情页面状态管理，支持文章内容展示、相关文章推荐、
 * 阅读进度跟踪、社交分享状态和用户交互管理
 * 
 * 复用现有blog-store.ts的成熟模式，确保代码一致性和可靠性
 * 
 * Requirements满足:
 * - 1.1: 完整的博客文章详情数据管理
 * - 4.5: 相关文章推荐算法和状态管理
 * - 5.6: 社交分享状态跟踪和交互记录
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  parseAsString,
  parseAsBoolean,
  useQueryStates
} from 'nuqs';

// 导入博客相关类型
import {
  BlogDetailData,
  BlogDetailPageState,
  BlogDetailActions
} from '../types/detail';
import { BlogCardData } from '../types';

/**
 * 博客详情页面URL搜索参数解析器配置
 * 支持阅读进度、目录显示等状态的URL持久化
 */
export const blogDetailSearchParamsParsers = {
  // 显示目录
  showToc: parseAsBoolean,
  
  // 当前激活的标题锚点
  activeHeading: parseAsString,
} as const;

/**
 * 阅读进度接口
 * 跟踪用户的阅读行为和进度
 */
export interface ReadingProgress {
  /** 阅读进度百分比 (0-100) */
  percentage: number;
  
  /** 当前阅读位置的元素ID */
  currentSection: string | null;
  
  /** 预估剩余阅读时间（分钟） */
  estimatedTimeLeft: number;
  
  /** 阅读开始时间 */
  startTime: string | null;
  
  /** 总阅读时间（秒） */
  totalReadingTime: number;
}

/**
 * 分享状态接口
 * 跟踪用户的分享行为
 */
export interface ShareState {
  /** 是否已分享 */
  hasShared: boolean;
  
  /** 分享次数 */
  shareCount: number;
  
  /** 分享平台记录 */
  sharedPlatforms: string[];
  
  /** 最后分享时间 */
  lastShareTime: string | null;
}

/**
 * 相关文章推荐配置
 */
export interface RelatedPostsConfig {
  /** 推荐策略：基于分类、标签、混合算法 */
  strategy: 'category' | 'tags' | 'mixed' | 'content';
  
  /** 推荐文章数量 */
  limit: number;
  
  /** 最小相似度阈值 */
  minSimilarityScore: number;
  
  /** 是否排除当前文章 */
  excludeCurrentPost: boolean;
}

/**
 * 博客详情页面完整状态接口
 * 扩展基础的BlogDetailPageState，添加更多实用功能
 */
export interface BlogDetailStoreState extends BlogDetailPageState {
  // ========== 扩展数据状态 ==========
  
  /** 文章slug（用于路由和数据获取） */
  currentSlug: string | null;
  
  /** 相关文章推荐配置 */
  relatedPostsConfig: RelatedPostsConfig;
  
  /** 阅读进度状态 */
  readingProgress: ReadingProgress;
  
  /** 分享状态 */
  shareState: ShareState;
  
  // ========== UI交互状态 ==========
  
  /** 是否正在加载相关文章 */
  isLoadingRelated: boolean;
  
  /** 相关文章加载错误 */
  relatedError: string | null;
  
  /** 是否显示分享面板 */
  showSharePanel: boolean;
  
  /** 是否显示阅读进度条 */
  showProgressBar: boolean;
  
  /** 是否处于全屏阅读模式 */
  isFullscreen: boolean;
  
  // ========== 元数据和缓存 ==========
  
  /** 数据来源标识 */
  dataSource: 'mock' | 'api' | 'cache';
  
  /** 上次数据更新时间 */
  lastUpdated: string | null;
  
  /** 重试计数 */
  retryCount: number;
  
  /** 是否已初始化 */
  isInitialized: boolean;
  
  // ========== 操作方法 ==========
  actions: BlogDetailStoreActions;
}

/**
 * 博客详情页面操作接口
 * 扩展基础的BlogDetailActions，添加更多功能方法
 */
export interface BlogDetailStoreActions extends BlogDetailActions {
  // ========== 数据加载方法 ==========
  
  /** 根据slug加载文章详情 */
  loadPostBySlug: (slug: string, force?: boolean) => Promise<void>;
  
  /** 加载相关文章 */
  loadRelatedPosts: (postId: string, config?: Partial<RelatedPostsConfig>) => Promise<void>;
  
  /** 刷新当前文章数据 */
  refreshCurrentPost: () => Promise<void>;
  
  /** 重试加载（带指数退避） */
  retryLoad: () => Promise<void>;
  
  // ========== 阅读进度管理 ==========
  
  /** 更新阅读进度 */
  updateReadingProgress: (progress: Partial<ReadingProgress>) => void;
  
  /** 开始阅读计时 */
  startReadingTimer: () => void;
  
  /** 暂停阅读计时 */
  pauseReadingTimer: () => void;
  
  /** 重置阅读进度 */
  resetReadingProgress: () => void;
  
  // ========== 分享状态管理 ==========
  
  /** 记录分享行为 */
  recordShare: (platform: string) => void;
  
  /** 重置分享状态 */
  resetShareState: () => void;
  
  /** 切换分享面板显示 */
  toggleSharePanel: () => void;
  
  // ========== UI状态管理 ==========
  
  /** 切换全屏阅读模式 */
  toggleFullscreen: () => void;
  
  /** 切换进度条显示 */
  toggleProgressBar: () => void;
  
  /** 设置相关文章推荐配置 */
  setRelatedPostsConfig: (config: Partial<RelatedPostsConfig>) => void;
  
  // ========== 错误处理 ==========
  
  /** 设置主要错误 */
  setError: (error: string | null) => void;
  
  /** 设置相关文章错误 */
  setRelatedError: (error: string | null) => void;
  
  /** 清除所有错误 */
  clearAllErrors: () => void;
  
  // ========== 状态重置 ==========
  
  /** 重置为初始状态 */
  resetToInitial: () => void;
  
  /** 重置UI状态 */
  resetUIState: () => void;
  
  // ========== URL同步方法 ==========

  /** 从URL同步状态 */
  syncFromURL: (params: Record<string, string | null>) => void;

  /** 同步状态到URL */
  syncToURL: () => Record<string, string | null>;
}

/**
 * 默认阅读进度状态
 */
const DEFAULT_READING_PROGRESS: ReadingProgress = {
  percentage: 0,
  currentSection: null,
  estimatedTimeLeft: 0,
  startTime: null,
  totalReadingTime: 0,
};

/**
 * 默认分享状态
 */
const DEFAULT_SHARE_STATE: ShareState = {
  hasShared: false,
  shareCount: 0,
  sharedPlatforms: [],
  lastShareTime: null,
};

/**
 * 默认相关文章推荐配置
 */
const DEFAULT_RELATED_CONFIG: RelatedPostsConfig = {
  strategy: 'mixed',
  limit: 3,
  minSimilarityScore: 0.2,
  excludeCurrentPost: true,
};

/**
 * 模拟博客详情数据生成器
 * 临时数据，后续会替换为API调用
 */
function generateMockBlogDetail(slug: string): BlogDetailData {
  const mockId = `blog-detail-${slug}`;
  
  return {
    id: mockId,
    title: `深度解析：${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    excerpt: '这是一篇深入探讨现代Web开发最佳实践的文章，涵盖了从基础概念到高级技巧的全方位内容。',
    slug,
    coverImage: `/assets/images/blog-${Math.floor(Math.random() * 6) + 1}.jpg`,
    author: {
      name: 'Alex Chen',
      avatar: '/assets/images/avatar-1.jpg',
      bio: '资深前端工程师，专注于React生态系统和现代Web开发技术。',
      socialLinks: {
        twitter: 'https://twitter.com/alexchen',
        github: 'https://github.com/alexchen',
        website: 'https://alexchen.dev',
      },
      stats: {
        postsCount: 42,
        totalLikes: 1337,
        followersCount: 856,
      },
    },
    category: 'Technologies',
    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    
    // 详情页面特有字段
    content: `# ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

这是一篇关于现代Web开发的深度文章。我们将探讨一些重要的概念和最佳实践。

## 目录

- [引言](#introduction)
- [核心概念](#core-concepts)
- [实践指南](#practical-guide)
- [总结](#conclusion)

## 引言 {#introduction}

在现代Web开发中，我们面临着许多挑战和机遇。本文将带您深入了解这些关键技术。

## 核心概念 {#core-concepts}

让我们从基础开始，了解一些核心概念：

### 状态管理

状态管理是现代应用开发的核心。我们需要考虑：

- 全局状态 vs 局部状态
- 数据流的方向性
- 性能优化策略

### 组件设计

良好的组件设计原则包括：

1. 单一职责原则
2. 可复用性
3. 可测试性

## 实践指南 {#practical-guide}

在实际开发中，我们需要关注以下几个方面：

### 性能优化

- 代码分割
- 懒加载
- 缓存策略

### 测试策略

- 单元测试
- 集成测试
- E2E测试

## 总结 {#conclusion}

通过本文的学习，我们了解了现代Web开发的关键概念和最佳实践。希望这些内容对您的开发工作有所帮助。

---

感谢阅读！如果您觉得这篇文章有用，请分享给更多的朋友。`,
    
    contentType: 'markdown',
    readingTime: Math.floor(Math.random() * 10) + 5,
    tags: ['React', 'TypeScript', 'Web Development', 'Best Practices'],
    keywords: ['web development', 'react', 'typescript', 'frontend'],
    tableOfContents: [
      { title: '引言', level: 2, anchor: 'introduction' },
      { title: '核心概念', level: 2, anchor: 'core-concepts' },
      { title: '状态管理', level: 3, anchor: 'state-management' },
      { title: '组件设计', level: 3, anchor: 'component-design' },
      { title: '实践指南', level: 2, anchor: 'practical-guide' },
      { title: '性能优化', level: 3, anchor: 'performance' },
      { title: '测试策略', level: 3, anchor: 'testing' },
      { title: '总结', level: 2, anchor: 'conclusion' },
    ],
    viewCount: Math.floor(Math.random() * 5000) + 100,
    likeCount: Math.floor(Math.random() * 200) + 10,
    shareCount: Math.floor(Math.random() * 50) + 5,
    isPublished: true,
    isFeatured: Math.random() > 0.7,
    relatedPostIds: [
      'react-best-practices',
      'typescript-advanced-tips',
      'web-performance-guide'
    ],
  };
}

/**
 * 模拟相关文章数据生成器
 */
function generateMockRelatedPosts(currentPostId: string, config: RelatedPostsConfig): BlogCardData[] {
  const relatedPosts: BlogCardData[] = [];
  
  for (let i = 0; i < config.limit; i++) {
    const postId = `related-${currentPostId}-${i + 1}`;
    relatedPosts.push({
      id: postId,
      title: `Related Article ${i + 1}: Advanced Topics`,
      excerpt: `This is a related article that complements the main content with additional insights and practical examples.`,
      slug: `related-article-${i + 1}`,
      coverImage: `/assets/images/blog-${(i % 6) + 1}.jpg`,
      author: {
        name: `Author ${i + 1}`,
        avatar: `/assets/images/avatar-${(i % 4) + 1}.jpg`,
      },
      category: 'Technologies',
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return relatedPosts;
}

/**
 * 创建博客详情页面状态管理Store
 * 使用与blog-store相同的中间件配置，确保一致的开发体验
 */
export const useBlogDetailStore = create<BlogDetailStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== 基础数据初始化 ==========
        currentPost: null,
        currentSlug: null,
        relatedPosts: [],
        
        // ========== UI状态初始化 ==========
        isLoading: false,
        isLoadingRelated: false,
        error: null,
        relatedError: null,
        showTableOfContents: true,
        activeHeading: null,
        showSharePanel: false,
        showProgressBar: true,
        isFullscreen: false,
        
        // ========== 交互状态初始化 ==========
        userInteractions: {
          hasLiked: false,
          hasBookmarked: false,
          hasShared: false,
        },
        
        // ========== 扩展状态初始化 ==========
        relatedPostsConfig: DEFAULT_RELATED_CONFIG,
        readingProgress: DEFAULT_READING_PROGRESS,
        shareState: DEFAULT_SHARE_STATE,
        
        // ========== 元数据初始化 ==========
        dataSource: 'mock',
        lastUpdated: null,
        retryCount: 0,
        isInitialized: false,
        
        // ========== 操作方法实现 ==========
        actions: {
          // ========== 数据加载方法 ==========
          
          loadPostDetail: async (slug: string) => {
            await get().actions.loadPostBySlug(slug);
          },
          
          loadPostBySlug: async (slug: string, force = false) => {
            const state = get();
            
            // 如果已经加载了相同的文章且不强制刷新，则跳过
            if (!force && state.currentSlug === slug && state.currentPost) {
              return;
            }
            
            // 防止重复加载
            if (state.isLoading) return;
            
            set(
              () => ({
                isLoading: true,
                error: null,
                currentSlug: slug,
              }),
              false,
              'loadPostBySlug:start'
            );
            
            try {
              // 模拟网络请求延迟
              await new Promise(resolve => setTimeout(resolve, 800));
              
              // 生成模拟数据
              const postDetail = generateMockBlogDetail(slug);
              
              set(
                () => ({
                  currentPost: postDetail,
                  isLoading: false,
                  isInitialized: true,
                  retryCount: 0,
                  lastUpdated: new Date().toISOString(),
                  // 重置阅读进度
                  readingProgress: {
                    ...DEFAULT_READING_PROGRESS,
                    estimatedTimeLeft: postDetail.readingTime,
                  },
                }),
                false,
                'loadPostBySlug:success'
              );
              
              // 自动加载相关文章
              if (postDetail.id) {
                setTimeout(() => {
                  get().actions.loadRelatedPosts(postDetail.id);
                }, 100);
              }
              
            } catch (error) {
              console.error('Failed to load blog post:', error);
              
              set(
                (current) => ({
                  isLoading: false,
                  retryCount: current.retryCount + 1,
                  error: error instanceof Error ? error.message : '加载文章失败，请稍后重试',
                }),
                false,
                'loadPostBySlug:error'
              );
            }
          },
          
          loadRelatedPosts: async (postId: string, config?: Partial<RelatedPostsConfig>) => {
            const state = get();
            const finalConfig = { ...state.relatedPostsConfig, ...config };
            
            // 防止重复加载
            if (state.isLoadingRelated) return;
            
            set(
              () => ({
                isLoadingRelated: true,
                relatedError: null,
                relatedPostsConfig: finalConfig,
              }),
              false,
              'loadRelatedPosts:start'
            );
            
            try {
              // 模拟网络请求延迟
              await new Promise(resolve => setTimeout(resolve, 600));
              
              // 生成模拟相关文章数据
              const relatedPosts = generateMockRelatedPosts(postId, finalConfig);
              
              set(
                () => ({
                  relatedPosts,
                  isLoadingRelated: false,
                }),
                false,
                'loadRelatedPosts:success'
              );
              
            } catch (error) {
              console.error('Failed to load related posts:', error);
              
              set(
                () => ({
                  isLoadingRelated: false,
                  relatedError: error instanceof Error ? error.message : '加载相关文章失败',
                }),
                false,
                'loadRelatedPosts:error'
              );
            }
          },
          
          refreshCurrentPost: async () => {
            const state = get();
            if (state.currentSlug) {
              await get().actions.loadPostBySlug(state.currentSlug, true);
            }
          },
          
          retryLoad: async () => {
            const state = get();
            if (state.retryCount < 3 && state.currentSlug) {
              await get().actions.loadPostBySlug(state.currentSlug, true);
            }
          },
          
          // ========== 交互方法 ==========
          
          toggleLike: async () => {
            const state = get();
            if (!state.currentPost) return;
            
            try {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 300));
              
              set(
                (current) => ({
                  userInteractions: {
                    ...current.userInteractions,
                    hasLiked: !current.userInteractions.hasLiked,
                  },
                  currentPost: current.currentPost ? {
                    ...current.currentPost,
                    likeCount: (current.currentPost.likeCount || 0) + 
                              (current.userInteractions.hasLiked ? -1 : 1),
                  } : null,
                }),
                false,
                'toggleLike'
              );
              
            } catch (error) {
              console.error('Failed to toggle like:', error);
            }
          },
          
          toggleBookmark: async () => {
            try {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 200));
              
              set(
                (current) => ({
                  userInteractions: {
                    ...current.userInteractions,
                    hasBookmarked: !current.userInteractions.hasBookmarked,
                  },
                }),
                false,
                'toggleBookmark'
              );
              
            } catch (error) {
              console.error('Failed to toggle bookmark:', error);
            }
          },
          
          sharePost: async (platform = 'copy') => {
            const state = get();
            if (!state.currentPost) return;
            
            try {
              // 记录分享行为
              get().actions.recordShare(platform);
              
              // 模拟分享API调用
              await new Promise(resolve => setTimeout(resolve, 100));
              
              set(
                (current) => ({
                  userInteractions: {
                    ...current.userInteractions,
                    hasShared: true,
                  },
                  currentPost: current.currentPost ? {
                    ...current.currentPost,
                    shareCount: (current.currentPost.shareCount || 0) + 1,
                  } : null,
                }),
                false,
                'sharePost'
              );
              
            } catch (error) {
              console.error('Failed to share post:', error);
            }
          },
          
          // ========== 阅读进度管理 ==========
          
          updateReadingProgress: (progress: Partial<ReadingProgress>) => {
            set(
              (current) => ({
                readingProgress: {
                  ...current.readingProgress,
                  ...progress,
                },
              }),
              false,
              'updateReadingProgress'
            );
          },
          
          startReadingTimer: () => {
            const now = new Date().toISOString();
            set(
              (current) => ({
                readingProgress: {
                  ...current.readingProgress,
                  startTime: now,
                },
              }),
              false,
              'startReadingTimer'
            );
          },
          
          pauseReadingTimer: () => {
            const state = get();
            if (state.readingProgress.startTime) {
              const startTime = new Date(state.readingProgress.startTime);
              const now = new Date();
              const sessionTime = Math.floor((now.getTime() - startTime.getTime()) / 1000);
              
              set(
                (current) => ({
                  readingProgress: {
                    ...current.readingProgress,
                    totalReadingTime: current.readingProgress.totalReadingTime + sessionTime,
                    startTime: null,
                  },
                }),
                false,
                'pauseReadingTimer'
              );
            }
          },
          
          resetReadingProgress: () => {
            set(
              { readingProgress: DEFAULT_READING_PROGRESS },
              false,
              'resetReadingProgress'
            );
          },
          
          // ========== 分享状态管理 ==========
          
          recordShare: (platform: string) => {
            const now = new Date().toISOString();
            set(
              (current) => ({
                shareState: {
                  hasShared: true,
                  shareCount: current.shareState.shareCount + 1,
                  sharedPlatforms: [
                    ...current.shareState.sharedPlatforms.filter(p => p !== platform),
                    platform
                  ],
                  lastShareTime: now,
                },
              }),
              false,
              'recordShare'
            );
          },
          
          resetShareState: () => {
            set(
              { shareState: DEFAULT_SHARE_STATE },
              false,
              'resetShareState'
            );
          },
          
          toggleSharePanel: () => {
            set(
              (current) => ({
                showSharePanel: !current.showSharePanel,
              }),
              false,
              'toggleSharePanel'
            );
          },
          
          // ========== UI状态管理 ==========
          
          setActiveHeading: (anchor: string) => {
            set(
              { activeHeading: anchor },
              false,
              'setActiveHeading'
            );
          },
          
          toggleTableOfContents: () => {
            set(
              (current) => ({
                showTableOfContents: !current.showTableOfContents,
              }),
              false,
              'toggleTableOfContents'
            );
          },
          
          toggleFullscreen: () => {
            set(
              (current) => ({
                isFullscreen: !current.isFullscreen,
              }),
              false,
              'toggleFullscreen'
            );
          },
          
          toggleProgressBar: () => {
            set(
              (current) => ({
                showProgressBar: !current.showProgressBar,
              }),
              false,
              'toggleProgressBar'
            );
          },
          
          setRelatedPostsConfig: (config: Partial<RelatedPostsConfig>) => {
            set(
              (current) => ({
                relatedPostsConfig: {
                  ...current.relatedPostsConfig,
                  ...config,
                },
              }),
              false,
              'setRelatedPostsConfig'
            );
          },
          
          // ========== 错误处理 ==========
          
          setError: (error: string | null) => {
            set(
              { error },
              false,
              'setError'
            );
          },
          
          setRelatedError: (error: string | null) => {
            set(
              { relatedError: error },
              false,
              'setRelatedError'
            );
          },
          
          clearAllErrors: () => {
            set(
              { error: null, relatedError: null },
              false,
              'clearAllErrors'
            );
          },
          
          // ========== 状态重置 ==========
          
          reset: () => {
            get().actions.resetToInitial();
          },
          
          resetToInitial: () => {
            set(
              {
                // 基础数据重置
                currentPost: null,
                currentSlug: null,
                relatedPosts: [],
                
                // UI状态重置
                isLoading: false,
                isLoadingRelated: false,
                error: null,
                relatedError: null,
                showTableOfContents: true,
                activeHeading: null,
                showSharePanel: false,
                showProgressBar: true,
                isFullscreen: false,
                
                // 交互状态重置
                userInteractions: {
                  hasLiked: false,
                  hasBookmarked: false,
                  hasShared: false,
                },
                
                // 扩展状态重置
                relatedPostsConfig: DEFAULT_RELATED_CONFIG,
                readingProgress: DEFAULT_READING_PROGRESS,
                shareState: DEFAULT_SHARE_STATE,
                
                // 保留元数据
                dataSource: get().dataSource,
                lastUpdated: get().lastUpdated,
                retryCount: 0,
                isInitialized: false,
                
                // 保留操作方法
                actions: get().actions,
              },
              false,
              'resetToInitial'
            );
          },
          
          resetUIState: () => {
            set(
              () => ({
                showTableOfContents: true,
                activeHeading: null,
                showSharePanel: false,
                showProgressBar: true,
                isFullscreen: false,
              }),
              false,
              'resetUIState'
            );
          },
          
          // ========== URL同步方法 ==========

          syncFromURL: (params: Record<string, string | null>) => {
            const {
              showToc = 'true',
              activeHeading = null,
            } = params;

            set(
              () => ({
                showTableOfContents: showToc === 'true',
                activeHeading: activeHeading || null,
                isInitialized: true,
              }),
              false,
              'syncFromURL'
            );
          },
          
          syncToURL: () => {
            const state = get();
            const urlState: Record<string, string | null> = {};

            // 只有当目录隐藏时才添加到URL
            if (!state.showTableOfContents) {
              urlState.showToc = 'false';
            }

            // 只有当有激活标题时才添加到URL
            if (state.activeHeading) {
              urlState.activeHeading = state.activeHeading;
            }
            
            return urlState;
          },
        },
      }),
      {
        name: 'blog-detail-store',
        storage: createJSONStorage(() => sessionStorage),
        // 只持久化用户偏好设置
        partialize: (state) => ({
          showTableOfContents: state.showTableOfContents,
          showProgressBar: state.showProgressBar,
          relatedPostsConfig: state.relatedPostsConfig,
        }),
      }
    ),
    {
      name: 'blog-detail-store',
    }
  )
);

/**
 * 博客详情页面URL状态同步Hook
 * 
 * 使用nuqs管理URL参数，与Zustand store双向同步
 * 专门针对博客详情页面的URL状态管理需求
 */
export function useBlogDetailUrlSync() {
  const store = useBlogDetailStore();
  const { actions } = store;
  
  // 使用nuqs管理博客详情页面URL参数
  const [urlState, setUrlState] = useQueryStates(blogDetailSearchParamsParsers);
  
  // 从URL更新store状态
  const syncStoreFromUrl = () => {
    actions.syncFromURL(urlState as Record<string, string | null>);
  };
  
  // 从store更新URL状态
  const syncUrlFromStore = () => {
    const blogDetailUrlState = actions.syncToURL();
    setUrlState(blogDetailUrlState);
  };
  
  return {
    urlState,
    setUrlState,
    syncStoreFromUrl,
    syncUrlFromStore,
  };
}

/**
 * 博客文章内容Hook
 * 
 * 提供文章内容相关的状态和操作方法
 */
export function useBlogPostContent() {
  const { 
    currentPost, 
    currentSlug,
    isLoading, 
    error, 
    isInitialized,
    actions 
  } = useBlogDetailStore();
  
  return {
    // 文章数据
    currentPost,
    currentSlug,
    isLoading,
    error,
    isInitialized,
    
    // 内容操作方法
    loadPost: actions.loadPostBySlug,
    refreshPost: actions.refreshCurrentPost,
    retryLoad: actions.retryLoad,
    setError: actions.setError,
  };
}

/**
 * 博客相关文章Hook
 * 
 * 提供相关文章推荐相关的状态和操作方法
 */
export function useBlogRelatedPosts() {
  const { 
    relatedPosts, 
    isLoadingRelated, 
    relatedError, 
    relatedPostsConfig,
    actions 
  } = useBlogDetailStore();
  
  return {
    // 相关文章数据
    relatedPosts,
    isLoading: isLoadingRelated,
    error: relatedError,
    config: relatedPostsConfig,
    
    // 相关文章操作方法
    loadRelatedPosts: actions.loadRelatedPosts,
    setConfig: actions.setRelatedPostsConfig,
    setError: actions.setRelatedError,
  };
}

/**
 * 博客阅读进度Hook
 * 
 * 提供阅读进度跟踪相关的状态和操作方法
 */
export function useBlogReadingProgress() {
  const { 
    readingProgress, 
    showProgressBar,
    actions 
  } = useBlogDetailStore();
  
  return {
    // 阅读进度数据
    ...readingProgress,
    showProgressBar,
    
    // 阅读进度操作方法
    updateProgress: actions.updateReadingProgress,
    startTimer: actions.startReadingTimer,
    pauseTimer: actions.pauseReadingTimer,
    resetProgress: actions.resetReadingProgress,
    toggleProgressBar: actions.toggleProgressBar,
  };
}

/**
 * 博客用户交互Hook
 * 
 * 提供用户交互相关的状态和操作方法（点赞、收藏、分享等）
 */
export function useBlogUserInteractions() {
  const { 
    userInteractions, 
    shareState,
    showSharePanel,
    actions 
  } = useBlogDetailStore();
  
  return {
    // 交互状态
    ...userInteractions,
    shareState,
    showSharePanel,
    
    // 交互操作方法
    toggleLike: actions.toggleLike,
    toggleBookmark: actions.toggleBookmark,
    sharePost: actions.sharePost,
    recordShare: actions.recordShare,
    toggleSharePanel: actions.toggleSharePanel,
    resetShareState: actions.resetShareState,
  };
}

/**
 * 博客目录导航Hook
 * 
 * 提供目录显示和导航相关的状态和操作方法
 */
export function useBlogTableOfContents() {
  const { 
    currentPost,
    showTableOfContents,
    activeHeading,
    actions 
  } = useBlogDetailStore();
  
  return {
    // 目录数据
    tableOfContents: currentPost?.tableOfContents || [],
    showTableOfContents,
    activeHeading,
    
    // 目录操作方法
    setActiveHeading: actions.setActiveHeading,
    toggleTableOfContents: actions.toggleTableOfContents,
  };
}

/**
 * 博客UI状态Hook
 * 
 * 提供UI状态管理相关的状态和操作方法
 */
export function useBlogUIState() {
  const { 
    isFullscreen,
    showProgressBar,
    showSharePanel,
    showTableOfContents,
    actions 
  } = useBlogDetailStore();
  
  return {
    // UI状态
    isFullscreen,
    showProgressBar,
    showSharePanel,
    showTableOfContents,
    
    // UI操作方法
    toggleFullscreen: actions.toggleFullscreen,
    toggleProgressBar: actions.toggleProgressBar,
    toggleSharePanel: actions.toggleSharePanel,
    toggleTableOfContents: actions.toggleTableOfContents,
    resetUIState: actions.resetUIState,
  };
}

// 默认导出store hook
export default useBlogDetailStore;