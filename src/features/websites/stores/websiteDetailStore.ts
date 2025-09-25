/**
 * Website Detail Page State Management Store
 * 
 * 基于Zustand创建网站详情页面状态管理，支持网站详情展示、相关网站推荐、
 * 访问统计跟踪、用户交互管理和详情页面导航功能
 * 
 * 复用现有blog-store.ts的成熟模式，确保代码一致性和可靠性
 * 
 * Requirements满足:
 * - AC-2.4.3: 访问统计记录 - 当用户点击访问按钮时，系统应记录该网站的访问次数增加1次
 * - 网站详情数据管理
 * - 相关网站推荐算法和状态管理
 * - 用户交互状态跟踪
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  parseAsString, 
  parseAsBoolean,
  useQueryStates
} from 'nuqs';

// 导入网站相关类型
import { 
  WebsiteDetailData,
  WebsiteDetailNavigation,
  WebsiteDetailLoadingState,
  WebsiteDetailErrorState
} from '../types/detail';
import { WebsiteCardData } from '../types/website';

// 导入服务层
import {
  getWebsiteById,
  getRelatedWebsites,
  trackWebsiteVisit,
  RelatedWebsitesOptions,
  VisitTrackingResult
} from '../services/websiteDetailService';

type DetailUrlStateValue = string | number | boolean | null | undefined;
type DetailUrlStateParams = Record<string, DetailUrlStateValue>;

function toStringValue(value: DetailUrlStateValue, defaultValue: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return defaultValue;
}

function toNumberValue(value: DetailUrlStateValue, defaultValue: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
}

function toBooleanValue(value: DetailUrlStateValue, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return defaultValue;
}

/**
 * 网站详情页面URL搜索参数解析器配置
 * 支持访问跟踪、相关网站筛选等状态的URL持久化
 */
export const websiteDetailSearchParamsParsers = {
  // 相关网站推荐设置
  relatedStrategy: parseAsString,
  
  // 相关网站数量
  relatedLimit: parseAsString,
  
  // 是否显示相关网站
  showRelated: parseAsBoolean,
  
  // 是否显示访问统计
  showStats: parseAsBoolean,
} as const;

/**
 * 访问统计接口
 * 跟踪用户的访问行为和统计信息
 */
export interface VisitStats {
  /** 本次访问开始时间 */
  visitStartTime: string | null;
  
  /** 页面停留时间（秒） */
  pageViewDuration: number;
  
  /** 是否已记录访问 */
  hasRecordedVisit: boolean;
  
  /** 访问来源页面 */
  referrerPage: string | null;
  
  /** 访问会话ID */
  sessionId: string | null;
}

/**
 * 用户交互状态接口
 * 跟踪用户在详情页面的交互行为
 */
export interface UserInteractionState {
  /** 是否已收藏 */
  hasBookmarked: boolean;
  
  /** 是否已分享 */
  hasShared: boolean;
  
  /** 分享次数 */
  shareCount: number;
  
  /** 最后交互时间 */
  lastInteractionTime: string | null;
  
  /** 分享平台记录 */
  sharedPlatforms: string[];
}

/**
 * 相关网站推荐配置
 */
export interface RelatedWebsitesConfig {
  /** 推荐策略：基于分类、标签、内容或混合算法 */
  strategy: 'category' | 'tags' | 'content' | 'mixed';
  
  /** 推荐网站数量 */
  limit: number;
  
  /** 最小相似度阈值 */
  minSimilarityScore: number;
  
  /** 是否排除当前网站 */
  excludeCurrentWebsite: boolean;
  
  /** 是否包含广告网站 */
  includeAds: boolean;
}

/**
 * 网站详情页面完整状态接口
 * 扩展基础状态，添加更多实用功能
 */
export interface WebsiteDetailStoreState {
  // ========== 核心数据状态 ==========
  
  /** 当前网站详情数据 */
  currentWebsite: WebsiteDetailData | null;
  
  /** 当前网站ID（用于路由和数据获取） */
  currentWebsiteId: string | null;
  
  /** 相关网站推荐列表 */
  relatedWebsites: WebsiteCardData[];
  
  /** 页面导航信息 */
  navigationInfo: WebsiteDetailNavigation | null;
  
  // ========== 加载状态 ==========
  
  /** 主要加载状态 */
  isLoading: boolean;
  
  /** 相关网站加载状态 */
  isLoadingRelated: boolean;
  
  /** 访问统计更新状态 */
  isUpdatingVisit: boolean;
  
  /** 详细加载状态 */
  loadingState: WebsiteDetailLoadingState;
  
  // ========== 错误状态 ==========
  
  /** 主要错误信息 */
  error: string | null;
  
  /** 相关网站错误 */
  relatedError: string | null;
  
  /** 详细错误状态 */
  errorState: WebsiteDetailErrorState;
  
  // ========== 扩展功能状态 ==========
  
  /** 相关网站推荐配置 */
  relatedWebsitesConfig: RelatedWebsitesConfig;
  
  /** 访问统计状态 */
  visitStats: VisitStats;
  
  /** 用户交互状态 */
  userInteractions: UserInteractionState;
  
  // ========== UI交互状态 ==========
  
  /** 是否显示相关网站区域 */
  showRelatedWebsites: boolean;
  
  /** 是否显示访问统计 */
  showVisitStats: boolean;
  
  /** 是否显示分享面板 */
  showSharePanel: boolean;
  
  /** 是否处于全屏浏览模式 */
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
  actions: WebsiteDetailStoreActions;
}

/**
 * 网站详情页面操作接口
 * 提供完整的页面交互和数据管理方法
 */
export interface WebsiteDetailStoreActions {
  // ========== 数据加载方法 ==========
  
  /** 根据ID加载网站详情 */
  loadWebsiteDetail: (websiteId: string, force?: boolean) => Promise<void>;
  
  /** 加载相关网站 */
  loadRelatedWebsites: (websiteId: string, config?: Partial<RelatedWebsitesConfig>) => Promise<void>;
  
  /** 刷新当前网站数据 */
  refreshCurrentWebsite: () => Promise<void>;
  
  /** 重试加载（带指数退避） */
  retryLoad: () => Promise<void>;
  
  /** 预加载相关网站 */
  preloadRelatedWebsites: (websiteId: string) => Promise<void>;
  
  // ========== 访问统计管理 (AC-2.4.3) ==========
  
  /** 跟踪网站访问 - 核心功能 */
  trackVisit: (websiteId: string) => Promise<VisitTrackingResult>;
  
  /** 开始访问计时 */
  startVisitTimer: () => void;
  
  /** 结束访问计时 */
  endVisitTimer: () => void;
  
  /** 更新访问统计 */
  updateVisitStats: (stats: Partial<VisitStats>) => void;
  
  /** 重置访问统计 */
  resetVisitStats: () => void;
  
  // ========== 用户交互管理 ==========
  
  /** 切换收藏状态 */
  toggleBookmark: (websiteId: string) => Promise<void>;
  
  /** 分享网站 */
  shareWebsite: (websiteId: string, platform?: string) => Promise<void>;
  
  /** 记录分享行为 */
  recordShare: (platform: string) => void;
  
  /** 重置用户交互状态 */
  resetUserInteractions: () => void;
  
  // ========== 相关网站管理 ==========
  
  /** 设置相关网站推荐配置 */
  setRelatedWebsitesConfig: (config: Partial<RelatedWebsitesConfig>) => void;
  
  /** 刷新相关网站推荐 */
  refreshRelatedWebsites: () => Promise<void>;
  
  // ========== UI状态管理 ==========
  
  /** 切换相关网站显示 */
  toggleRelatedWebsites: () => void;
  
  /** 切换访问统计显示 */
  toggleVisitStats: () => void;
  
  /** 切换分享面板 */
  toggleSharePanel: () => void;
  
  /** 切换全屏模式 */
  toggleFullscreen: () => void;
  
  // ========== 导航管理 ==========
  
  /** 设置导航信息 */
  setNavigationInfo: (navigation: WebsiteDetailNavigation) => void;
  
  /** 更新面包屑导航 */
  updateBreadcrumb: (breadcrumb: WebsiteDetailNavigation['categoryBreadcrumb']) => void;
  
  // ========== 错误处理 ==========
  
  /** 设置主要错误 */
  setError: (error: string | null) => void;
  
  /** 设置相关网站错误 */
  setRelatedError: (error: string | null) => void;
  
  /** 设置详细错误状态 */
  setErrorState: (errorState: Partial<WebsiteDetailErrorState>) => void;
  
  /** 清除所有错误 */
  clearAllErrors: () => void;
  
  // ========== 状态重置 ==========
  
  /** 重置为初始状态 */
  reset: () => void;
  
  /** 重置UI状态 */
  resetUIState: () => void;
  
  /** 软重置（保留用户偏好） */
  softReset: () => void;
  
  // ========== URL同步方法 ==========
  
  /** 从URL同步状态 */
  syncFromURL: (params: DetailUrlStateParams) => void;
  
  /** 同步状态到URL */
  syncToURL: () => DetailUrlStateParams;
}

/**
 * 默认访问统计状态
 */
const DEFAULT_VISIT_STATS: VisitStats = {
  visitStartTime: null,
  pageViewDuration: 0,
  hasRecordedVisit: false,
  referrerPage: null,
  sessionId: null,
};

/**
 * 默认用户交互状态
 */
const DEFAULT_USER_INTERACTIONS: UserInteractionState = {
  hasBookmarked: false,
  hasShared: false,
  shareCount: 0,
  lastInteractionTime: null,
  sharedPlatforms: [],
};

/**
 * 默认相关网站推荐配置
 */
const DEFAULT_RELATED_CONFIG: RelatedWebsitesConfig = {
  strategy: 'mixed',
  limit: 4,
  minSimilarityScore: 0.2,
  excludeCurrentWebsite: true,
  includeAds: false,
};

/**
 * 默认加载状态
 */
const DEFAULT_LOADING_STATE: WebsiteDetailLoadingState = {
  website: false,
  relatedWebsites: false,
  publisher: false,
  visitUpdate: false,
};

/**
 * 默认错误状态
 */
const DEFAULT_ERROR_STATE: WebsiteDetailErrorState = {
  website: undefined,
  relatedWebsites: undefined,
  publisher: undefined,
  visitUpdate: undefined,
};

/**
 * 生成会话ID
 */
function generateSessionId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建网站详情页面状态管理Store
 * 使用与blog-store相同的中间件配置，确保一致的开发体验
 */
export const useWebsiteDetailStore = create<WebsiteDetailStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== 核心数据初始化 ==========
        currentWebsite: null,
        currentWebsiteId: null,
        relatedWebsites: [],
        navigationInfo: null,
        
        // ========== 加载状态初始化 ==========
        isLoading: false,
        isLoadingRelated: false,
        isUpdatingVisit: false,
        loadingState: DEFAULT_LOADING_STATE,
        
        // ========== 错误状态初始化 ==========
        error: null,
        relatedError: null,
        errorState: DEFAULT_ERROR_STATE,
        
        // ========== 扩展功能状态初始化 ==========
        relatedWebsitesConfig: DEFAULT_RELATED_CONFIG,
        visitStats: DEFAULT_VISIT_STATS,
        userInteractions: DEFAULT_USER_INTERACTIONS,
        
        // ========== UI交互状态初始化 ==========
        showRelatedWebsites: true,
        showVisitStats: true,
        showSharePanel: false,
        isFullscreen: false,
        
        // ========== 元数据初始化 ==========
        dataSource: 'mock',
        lastUpdated: null,
        retryCount: 0,
        isInitialized: false,
        
        // ========== 操作方法实现 ==========
        actions: {
          // ========== 数据加载方法 ==========
          
          loadWebsiteDetail: async (websiteId: string, force = false) => {
            const state = get();
            
            // 如果已经加载了相同的网站且不强制刷新，则跳过
            if (!force && state.currentWebsiteId === websiteId && state.currentWebsite) {
              return;
            }
            
            // 防止重复加载
            if (state.isLoading) return;
            
            set(
              (current) => ({
                isLoading: true,
                error: null,
                currentWebsiteId: websiteId,
                loadingState: { ...current.loadingState, website: true },
              }),
              false,
              'loadWebsiteDetail:start'
            );
            
            try {
              // 调用服务层获取网站详情
              const websiteDetail = await getWebsiteById(websiteId);
              
              set(
                (current) => ({
                  currentWebsite: websiteDetail,
                  isLoading: false,
                  isInitialized: true,
                  retryCount: 0,
                  lastUpdated: new Date().toISOString(),
                  loadingState: { ...current.loadingState, website: false },
                  // 重置访问统计
                  visitStats: {
                    ...DEFAULT_VISIT_STATS,
                    sessionId: generateSessionId(),
                  },
                }),
                false,
                'loadWebsiteDetail:success'
              );
              
              // 自动加载相关网站
              if (websiteDetail.id) {
                setTimeout(() => {
                  get().actions.loadRelatedWebsites(websiteDetail.id);
                }, 100);
              }
              
            } catch (error) {
              console.error('Failed to load website detail:', error);
              
              const errorMessage = error instanceof Error ? error.message : '加载网站详情失败，请稍后重试';
              
              set(
                (current) => ({
                  isLoading: false,
                  retryCount: current.retryCount + 1,
                  error: errorMessage,
                  loadingState: { ...current.loadingState, website: false },
                  errorState: { ...current.errorState, website: errorMessage },
                }),
                false,
                'loadWebsiteDetail:error'
              );
            }
          },
          
          loadRelatedWebsites: async (websiteId: string, config?: Partial<RelatedWebsitesConfig>) => {
            const state = get();
            const finalConfig: RelatedWebsitesOptions = { 
              ...state.relatedWebsitesConfig, 
              ...config 
            };
            
            // 防止重复加载
            if (state.isLoadingRelated) return;
            
            set(
              (current) => ({
                isLoadingRelated: true,
                relatedError: null,
                relatedWebsitesConfig: { ...current.relatedWebsitesConfig, ...config },
                loadingState: { ...current.loadingState, relatedWebsites: true },
              }),
              false,
              'loadRelatedWebsites:start'
            );
            
            try {
              // 调用服务层获取相关网站
              const relatedWebsites = await getRelatedWebsites(websiteId, finalConfig);
              
              set(
                (current) => ({
                  relatedWebsites,
                  isLoadingRelated: false,
                  loadingState: { ...current.loadingState, relatedWebsites: false },
                }),
                false,
                'loadRelatedWebsites:success'
              );
              
            } catch (error) {
              console.error('Failed to load related websites:', error);
              
              const errorMessage = error instanceof Error ? error.message : '加载相关网站失败';
              
              set(
                (current) => ({
                  isLoadingRelated: false,
                  relatedError: errorMessage,
                  loadingState: { ...current.loadingState, relatedWebsites: false },
                  errorState: { ...current.errorState, relatedWebsites: errorMessage },
                }),
                false,
                'loadRelatedWebsites:error'
              );
            }
          },
          
          refreshCurrentWebsite: async () => {
            const state = get();
            if (state.currentWebsiteId) {
              await get().actions.loadWebsiteDetail(state.currentWebsiteId, true);
            }
          },
          
          retryLoad: async () => {
            const state = get();
            if (state.retryCount < 3 && state.currentWebsiteId) {
              await get().actions.loadWebsiteDetail(state.currentWebsiteId, true);
            }
          },
          
          preloadRelatedWebsites: async (websiteId: string) => {
            // 异步预加载，不阻塞主流程
            try {
              await get().actions.loadRelatedWebsites(websiteId);
            } catch (error) {
              console.warn('Preload related websites failed:', error);
            }
          },
          
          // ========== 访问统计管理 (AC-2.4.3) ==========
          
          trackVisit: async (websiteId: string) => {
            const state = get();
            
            // 避免重复记录同一会话的访问
            if (state.visitStats.hasRecordedVisit) {
              return {
                success: true,
                newVisitCount: state.currentWebsite?.visitCount || 0,
              };
            }
            
            set(
              (current) => ({
                isUpdatingVisit: true,
                loadingState: { ...current.loadingState, visitUpdate: true },
              }),
              false,
              'trackVisit:start'
            );
            
            try {
              // 调用服务层记录访问
              const result = await trackWebsiteVisit(websiteId);
              
              if (result.success) {
                set(
                  (current) => ({
                    isUpdatingVisit: false,
                    visitStats: {
                      ...current.visitStats,
                      hasRecordedVisit: true,
                    },
                    currentWebsite: current.currentWebsite ? {
                      ...current.currentWebsite,
                      visitCount: result.newVisitCount,
                    } : null,
                    loadingState: { ...current.loadingState, visitUpdate: false },
                  }),
                  false,
                  'trackVisit:success'
                );
              } else {
                set(
                  (current) => ({
                    isUpdatingVisit: false,
                    loadingState: { ...current.loadingState, visitUpdate: false },
                    errorState: { ...current.errorState, visitUpdate: result.error },
                  }),
                  false,
                  'trackVisit:error'
                );
              }
              
              return result;
              
            } catch (error) {
              console.error('Failed to track visit:', error);
              
              const errorMessage = error instanceof Error ? error.message : '访问统计失败';
              
              set(
                (current) => ({
                  isUpdatingVisit: false,
                  loadingState: { ...current.loadingState, visitUpdate: false },
                  errorState: { ...current.errorState, visitUpdate: errorMessage },
                }),
                false,
                'trackVisit:error'
              );
              
              return {
                success: false,
                newVisitCount: state.currentWebsite?.visitCount || 0,
                error: errorMessage,
              };
            }
          },
          
          startVisitTimer: () => {
            const now = new Date().toISOString();
            set(
              (current) => ({
                visitStats: {
                  ...current.visitStats,
                  visitStartTime: now,
                },
              }),
              false,
              'startVisitTimer'
            );
          },
          
          endVisitTimer: () => {
            const state = get();
            if (state.visitStats.visitStartTime) {
              const startTime = new Date(state.visitStats.visitStartTime);
              const now = new Date();
              const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
              
              set(
                (current) => ({
                  visitStats: {
                    ...current.visitStats,
                    pageViewDuration: current.visitStats.pageViewDuration + duration,
                    visitStartTime: null,
                  },
                }),
                false,
                'endVisitTimer'
              );
            }
          },
          
          updateVisitStats: (stats: Partial<VisitStats>) => {
            set(
              (current) => ({
                visitStats: {
                  ...current.visitStats,
                  ...stats,
                },
              }),
              false,
              'updateVisitStats'
            );
          },
          
          resetVisitStats: () => {
            set(
              {
                visitStats: {
                  ...DEFAULT_VISIT_STATS,
                  sessionId: generateSessionId(),
                },
              },
              false,
              'resetVisitStats'
            );
          },
          
          // ========== 用户交互管理 ==========
          
          toggleBookmark: async (_websiteId: string) => {
            try {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const now = new Date().toISOString();
              
              set(
                (current) => ({
                  userInteractions: {
                    ...current.userInteractions,
                    hasBookmarked: !current.userInteractions.hasBookmarked,
                    lastInteractionTime: now,
                  },
                }),
                false,
                'toggleBookmark'
              );
              
            } catch (error) {
              console.error('Failed to toggle bookmark:', error);
            }
          },
          
          shareWebsite: async (_websiteId: string, platform = 'copy') => {
            const state = get();
            if (!state.currentWebsite) return;
            
            try {
              // 记录分享行为
              get().actions.recordShare(platform);
              
              // 模拟分享API调用
              await new Promise(resolve => setTimeout(resolve, 200));
              
              set(
                (current) => ({
                  userInteractions: {
                    ...current.userInteractions,
                    hasShared: true,
                    shareCount: current.userInteractions.shareCount + 1,
                    lastInteractionTime: new Date().toISOString(),
                  },
                }),
                false,
                'shareWebsite'
              );
              
            } catch (error) {
              console.error('Failed to share website:', error);
            }
          },
          
          recordShare: (platform: string) => {
            const now = new Date().toISOString();
            set(
              (current) => ({
                userInteractions: {
                  ...current.userInteractions,
                  hasShared: true,
                  shareCount: current.userInteractions.shareCount + 1,
                  sharedPlatforms: [
                    ...current.userInteractions.sharedPlatforms.filter(p => p !== platform),
                    platform
                  ],
                  lastInteractionTime: now,
                },
              }),
              false,
              'recordShare'
            );
          },
          
          resetUserInteractions: () => {
            set(
              { userInteractions: DEFAULT_USER_INTERACTIONS },
              false,
              'resetUserInteractions'
            );
          },
          
          // ========== 相关网站管理 ==========
          
          setRelatedWebsitesConfig: (config: Partial<RelatedWebsitesConfig>) => {
            set(
              (current) => ({
                relatedWebsitesConfig: {
                  ...current.relatedWebsitesConfig,
                  ...config,
                },
              }),
              false,
              'setRelatedWebsitesConfig'
            );
          },
          
          refreshRelatedWebsites: async () => {
            const state = get();
            if (state.currentWebsiteId) {
              await get().actions.loadRelatedWebsites(state.currentWebsiteId, state.relatedWebsitesConfig);
            }
          },
          
          // ========== UI状态管理 ==========
          
          toggleRelatedWebsites: () => {
            set(
              (current) => ({
                showRelatedWebsites: !current.showRelatedWebsites,
              }),
              false,
              'toggleRelatedWebsites'
            );
          },
          
          toggleVisitStats: () => {
            set(
              (current) => ({
                showVisitStats: !current.showVisitStats,
              }),
              false,
              'toggleVisitStats'
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
          
          toggleFullscreen: () => {
            set(
              (current) => ({
                isFullscreen: !current.isFullscreen,
              }),
              false,
              'toggleFullscreen'
            );
          },
          
          // ========== 导航管理 ==========
          
          setNavigationInfo: (navigation: WebsiteDetailNavigation) => {
            set(
              { navigationInfo: navigation },
              false,
              'setNavigationInfo'
            );
          },
          
          updateBreadcrumb: (breadcrumb: WebsiteDetailNavigation['categoryBreadcrumb']) => {
            set(
              (current) => ({
                navigationInfo: current.navigationInfo ? {
                  ...current.navigationInfo,
                  categoryBreadcrumb: breadcrumb,
                } : null,
              }),
              false,
              'updateBreadcrumb'
            );
          },
          
          // ========== 错误处理 ==========
          
          setError: (error: string | null) => {
            set(
              (current) => ({
                error,
                errorState: { ...current.errorState, website: error || undefined },
              }),
              false,
              'setError'
            );
          },
          
          setRelatedError: (error: string | null) => {
            set(
              (current) => ({
                relatedError: error,
                errorState: { ...current.errorState, relatedWebsites: error || undefined },
              }),
              false,
              'setRelatedError'
            );
          },
          
          setErrorState: (errorState: Partial<WebsiteDetailErrorState>) => {
            set(
              (current) => ({
                errorState: { ...current.errorState, ...errorState },
              }),
              false,
              'setErrorState'
            );
          },
          
          clearAllErrors: () => {
            set(
              { 
                error: null, 
                relatedError: null,
                errorState: DEFAULT_ERROR_STATE,
              },
              false,
              'clearAllErrors'
            );
          },
          
          // ========== 状态重置 ==========
          
          reset: () => {
            set(
              {
                // 核心数据重置
                currentWebsite: null,
                currentWebsiteId: null,
                relatedWebsites: [],
                navigationInfo: null,
                
                // 加载状态重置
                isLoading: false,
                isLoadingRelated: false,
                isUpdatingVisit: false,
                loadingState: DEFAULT_LOADING_STATE,
                
                // 错误状态重置
                error: null,
                relatedError: null,
                errorState: DEFAULT_ERROR_STATE,
                
                // 扩展功能状态重置
                relatedWebsitesConfig: DEFAULT_RELATED_CONFIG,
                visitStats: {
                  ...DEFAULT_VISIT_STATS,
                  sessionId: generateSessionId(),
                },
                userInteractions: DEFAULT_USER_INTERACTIONS,
                
                // UI状态重置
                showRelatedWebsites: true,
                showVisitStats: true,
                showSharePanel: false,
                isFullscreen: false,
                
                // 保留元数据
                dataSource: get().dataSource,
                lastUpdated: get().lastUpdated,
                retryCount: 0,
                isInitialized: false,
                
                // 保留操作方法
                actions: get().actions,
              },
              false,
              'reset'
            );
          },
          
          resetUIState: () => {
            set(
              {
                showRelatedWebsites: true,
                showVisitStats: true,
                showSharePanel: false,
                isFullscreen: false,
              },
              false,
              'resetUIState'
            );
          },
          
          softReset: () => {
            set(
              (current) => ({
                // 重置数据但保留用户偏好
                currentWebsite: null,
                currentWebsiteId: null,
                relatedWebsites: [],
                navigationInfo: null,
                
                // 重置加载和错误状态
                isLoading: false,
                isLoadingRelated: false,
                isUpdatingVisit: false,
                loadingState: DEFAULT_LOADING_STATE,
                error: null,
                relatedError: null,
                errorState: DEFAULT_ERROR_STATE,
                
                // 重置交互状态但保留配置
                visitStats: {
                  ...DEFAULT_VISIT_STATS,
                  sessionId: generateSessionId(),
                },
                userInteractions: DEFAULT_USER_INTERACTIONS,
                
                // 保留UI偏好设置
                showRelatedWebsites: current.showRelatedWebsites,
                showVisitStats: current.showVisitStats,
                relatedWebsitesConfig: current.relatedWebsitesConfig,
                
                // 重置计数器
                retryCount: 0,
                isInitialized: false,
              }),
              false,
              'softReset'
            );
          },
          
          // ========== URL同步方法 ==========
          
          syncFromURL: (params: DetailUrlStateParams) => {
            const {
              relatedStrategy = 'mixed',
              relatedLimit = '4',
              showRelated = true,
              showStats = true,
            } = params;
            
            const strategyValue = toStringValue(relatedStrategy, 'mixed');
            const limitValue = toNumberValue(relatedLimit, 4);
            const limit = Number.isFinite(limitValue) ? limitValue : 4;
            const showRelatedValue = toBooleanValue(showRelated, true);
            const showStatsValue = toBooleanValue(showStats, true);
            
            set(
              (current) => ({
                relatedWebsitesConfig: {
                  ...current.relatedWebsitesConfig,
                  strategy: strategyValue as RelatedWebsitesConfig['strategy'],
                  limit: Math.max(1, Math.min(10, limit)),
                },
                showRelatedWebsites: showRelatedValue,
                showVisitStats: showStatsValue,
                isInitialized: true,
              }),
              false,
              'syncFromURL'
            );
          },
          
          syncToURL: () => {
            const state = get();
            const urlState: DetailUrlStateParams = {};
            
            // 只有当配置不是默认值时才添加到URL
            if (state.relatedWebsitesConfig.strategy !== 'mixed') {
              urlState.relatedStrategy = state.relatedWebsitesConfig.strategy;
            }
            
            if (state.relatedWebsitesConfig.limit !== 4) {
              urlState.relatedLimit = state.relatedWebsitesConfig.limit.toString();
            }
            
            if (!state.showRelatedWebsites) {
              urlState.showRelated = false;
            }
            
            if (!state.showVisitStats) {
              urlState.showStats = false;
            }
            
            return urlState;
          },
        },
      }),
      {
        name: 'website-detail-store',
        storage: createJSONStorage(() => sessionStorage),
        // 只持久化用户偏好设置
        partialize: (state) => ({
          showRelatedWebsites: state.showRelatedWebsites,
          showVisitStats: state.showVisitStats,
          relatedWebsitesConfig: state.relatedWebsitesConfig,
        }),
      }
    ),
    {
      name: 'website-detail-store',
    }
  )
);

/**
 * 网站详情页面URL状态同步Hook
 * 
 * 使用nuqs管理URL参数，与Zustand store双向同步
 * 专门针对网站详情页面的URL状态管理需求
 */
export function useWebsiteDetailUrlSync() {
  const store = useWebsiteDetailStore();
  const { actions } = store;
  
  // 使用nuqs管理网站详情页面URL参数
  const [urlState, setUrlState] = useQueryStates(websiteDetailSearchParamsParsers);
  
  // 从URL更新store状态
  const syncStoreFromUrl = () => {
    actions.syncFromURL(urlState);
  };
  
  // 从store更新URL状态
  const syncUrlFromStore = () => {
    const websiteDetailUrlState = actions.syncToURL();
    setUrlState(websiteDetailUrlState);
  };
  
  return {
    urlState,
    setUrlState,
    syncStoreFromUrl,
    syncUrlFromStore,
  };
}

/**
 * 网站详情内容Hook
 * 
 * 提供网站详情相关的状态和操作方法
 */
export function useWebsiteContent() {
  const { 
    currentWebsite, 
    currentWebsiteId,
    isLoading, 
    error, 
    isInitialized,
    actions 
  } = useWebsiteDetailStore();
  
  return {
    // 网站数据
    currentWebsite,
    currentWebsiteId,
    isLoading,
    error,
    isInitialized,
    
    // 内容操作方法
    loadWebsite: actions.loadWebsiteDetail,
    refreshWebsite: actions.refreshCurrentWebsite,
    retryLoad: actions.retryLoad,
    setError: actions.setError,
  };
}

/**
 * 相关网站Hook
 * 
 * 提供相关网站推荐相关的状态和操作方法
 */
export function useRelatedWebsites() {
  const { 
    relatedWebsites, 
    isLoadingRelated, 
    relatedError, 
    relatedWebsitesConfig,
    showRelatedWebsites,
    actions 
  } = useWebsiteDetailStore();
  
  return {
    // 相关网站数据
    relatedWebsites,
    isLoading: isLoadingRelated,
    error: relatedError,
    config: relatedWebsitesConfig,
    showRelated: showRelatedWebsites,
    
    // 相关网站操作方法
    loadRelatedWebsites: actions.loadRelatedWebsites,
    refreshRelated: actions.refreshRelatedWebsites,
    setConfig: actions.setRelatedWebsitesConfig,
    setError: actions.setRelatedError,
    toggleShow: actions.toggleRelatedWebsites,
  };
}

/**
 * 访问统计Hook
 * 
 * 提供访问统计跟踪相关的状态和操作方法
 */
export function useWebsiteVisitStats() {
  const { 
    visitStats, 
    showVisitStats,
    isUpdatingVisit,
    actions 
  } = useWebsiteDetailStore();
  
  return {
    // 访问统计数据
    ...visitStats,
    showStats: showVisitStats,
    isUpdating: isUpdatingVisit,
    
    // 访问统计操作方法
    trackVisit: actions.trackVisit,
    startTimer: actions.startVisitTimer,
    endTimer: actions.endVisitTimer,
    updateStats: actions.updateVisitStats,
    resetStats: actions.resetVisitStats,
    toggleShow: actions.toggleVisitStats,
  };
}

/**
 * 用户交互Hook
 * 
 * 提供用户交互相关的状态和操作方法（收藏、分享等）
 */
export function useWebsiteUserInteractions() {
  const { 
    userInteractions, 
    showSharePanel,
    actions 
  } = useWebsiteDetailStore();
  
  return {
    // 交互状态
    ...userInteractions,
    showSharePanel,
    
    // 交互操作方法
    toggleBookmark: actions.toggleBookmark,
    shareWebsite: actions.shareWebsite,
    recordShare: actions.recordShare,
    toggleSharePanel: actions.toggleSharePanel,
    resetInteractions: actions.resetUserInteractions,
  };
}

/**
 * 网站导航Hook
 * 
 * 提供页面导航相关的状态和操作方法
 */
export function useWebsiteNavigation() {
  const { 
    navigationInfo,
    actions 
  } = useWebsiteDetailStore();
  
  return {
    // 导航数据
    navigationInfo,
    
    // 导航操作方法
    setNavigation: actions.setNavigationInfo,
    updateBreadcrumb: actions.updateBreadcrumb,
  };
}

/**
 * 网站详情UI状态Hook
 * 
 * 提供UI状态管理相关的状态和操作方法
 */
export function useWebsiteUIState() {
  const { 
    isFullscreen,
    showRelatedWebsites,
    showVisitStats,
    showSharePanel,
    actions 
  } = useWebsiteDetailStore();
  
  return {
    // UI状态
    isFullscreen,
    showRelatedWebsites,
    showVisitStats,
    showSharePanel,
    
    // UI操作方法
    toggleFullscreen: actions.toggleFullscreen,
    toggleRelatedWebsites: actions.toggleRelatedWebsites,
    toggleVisitStats: actions.toggleVisitStats,
    toggleSharePanel: actions.toggleSharePanel,
    resetUIState: actions.resetUIState,
  };
}

// 默认导出store hook
export default useWebsiteDetailStore;
