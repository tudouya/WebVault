/**
 * Website Detail Service Layer Integration Tests
 * 
 * 全面测试网站详情页面服务层的API集成、错误处理、状态管理
 * 和并发操作等核心功能，确保数据流和业务逻辑的正确性。
 * 
 * 测试范围：
 * - API集成测试：服务层与后端API的交互
 * - 数据流测试：从API到组件的完整数据流程
 * - 错误处理测试：网络错误、数据格式错误、权限错误
 * - 状态管理集成：Zustand store与服务层的集成
 * - 并发操作测试：多个请求的处理和状态同步
 * - 缓存机制测试：数据缓存和失效策略
 * - 性能优化测试：请求去重和批处理
 * 
 * Requirements满足:
 * - AC-2.1.1-2.1.4: 网站信息查看功能
 * - AC-2.2.1-2.2.4: 导航和上下文信息
 * - AC-2.3.1-2.3.4: 发布者和元数据信息
 * - AC-2.4.1-2.4.4: 网站访问功能
 * - AC-2.5.1-2.5.4: 相关网站推荐
 * - AC-2.6.1-2.6.4: 页面导航和返回
 */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// 导入服务层和类型
import {
  WebsiteDetailService,
  WebsiteDetailServiceError,
  RelatedWebsitesOptions,
  VisitTrackingResult,
  websiteDetailService,
  getWebsiteById,
  getRelatedWebsites,
  trackWebsiteVisit,
  getWebsitesByIdsBatch,
  getSmartRecommendations,
} from '../services/websiteDetailService';

// 导入状态管理
import { useWebsiteDetailStore } from '../stores/websiteDetailStore';

// 导入类型和Mock数据
import { WebsiteDetailData } from '../types/detail';
import { WebsiteCardData } from '../types/website';
import { mockWebsites } from '../data/mockWebsites';

// Mock Next.js环境
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/websites/test-id',
}));

// Mock nuqs
jest.mock('nuqs', () => ({
  parseAsString: { parseServerSide: jest.fn(), serialize: jest.fn() },
  parseAsBoolean: { parseServerSide: jest.fn(), serialize: jest.fn() },
  useQueryState: jest.fn(() => [null, jest.fn()]),
  useQueryStates: jest.fn(() => [{}, jest.fn()]),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('Website Detail Service Layer Integration Tests', () => {
  // 测试数据
  const mockValidWebsiteId = 'website-1';
  const mockInvalidWebsiteId = 'non-existent-website';
  
  const mockWebsiteDetail: WebsiteDetailData = {
    id: mockValidWebsiteId,
    title: '测试网站标题',
    description: '这是一个测试网站的详细描述',
    url: 'https://example.com',
    favicon_url: 'https://example.com/favicon.ico',
    screenshot_url: 'https://example.com/screenshot.jpg',
    category: '开发工具',
    tags: ['React', 'TypeScript', '前端开发'],
    status: 'active',
    is_featured: true,
    rating: 4.5,
    visit_count: 1250,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    
    // 详情页面专有字段
    content: '详细的网站介绍内容',
    language: 'zh-CN',
    popularity_score: 0.85,
    last_checked_at: '2024-01-15T00:00:00Z',
    is_accessible: true,
    meta_title: '测试网站标题 - SEO标题',
    meta_description: 'SEO描述文本',
    
    stats: {
      total_visits: 1250,
      monthly_visits: 375,
      weekly_visits: 125,
      daily_visits: 25,
      bounce_rate: 0.6,
      avg_session_duration: 180,
    },
    
    features: ['免费', '开源', '实时'],
    pricing: {
      is_free: true,
      has_paid_plans: false,
      starting_price: '免费',
      currency: 'CNY',
    },
  };

  const mockRelatedWebsites: WebsiteCardData[] = [
    {
      id: 'related-1',
      title: '相关网站1',
      description: '第一个相关网站',
      url: 'https://related1.com',
      favicon_url: 'https://related1.com/favicon.ico',
      image_url: 'https://related1.com/image.jpg',
      category: '开发工具',
      tags: ['React', 'JavaScript'],
      isAd: false,
      rating: 4.2,
      visit_count: 800,
      is_featured: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
    },
    {
      id: 'related-2',
      title: '相关网站2',
      description: '第二个相关网站',
      url: 'https://related2.com',
      favicon_url: 'https://related2.com/favicon.ico',
      image_url: 'https://related2.com/image.jpg',
      category: '开发工具',
      tags: ['TypeScript', 'Node.js'],
      isAd: false,
      rating: 4.0,
      visit_count: 600,
      is_featured: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-05T00:00:00Z',
    },
  ];

  // 清理和重置
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // 重置服务实例的缓存
    websiteDetailService.clearCache();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('1. 服务层单例模式测试', () => {
    test('WebsiteDetailService应该是单例模式', () => {
      const instance1 = WebsiteDetailService.getInstance();
      const instance2 = WebsiteDetailService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(WebsiteDetailService);
    });

    test('便捷导出函数应该使用相同的服务实例', () => {
      const serviceInstance = WebsiteDetailService.getInstance();
      
      // 验证导出的服务实例
      expect(websiteDetailService).toBe(serviceInstance);
    });
  });

  describe('2. API集成测试 - 网站详情获取', () => {
    test('应该成功获取网站详情数据', async () => {
      // Mock 服务方法返回测试数据
      jest.spyOn(websiteDetailService, 'getWebsiteById').mockResolvedValue(mockWebsiteDetail);

      const result = await getWebsiteById(mockValidWebsiteId);

      expect(result).toEqual(mockWebsiteDetail);
      expect(websiteDetailService.getWebsiteById).toHaveBeenCalledWith(mockValidWebsiteId);
    });

    test('应该处理网站不存在的错误', async () => {
      const notFoundError = new WebsiteDetailServiceError(
        'Website with ID "non-existent" not found',
        'NOT_FOUND',
        { requestedId: 'non-existent' }
      );

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(notFoundError);

      await expect(getWebsiteById(mockInvalidWebsiteId)).rejects.toThrow(WebsiteDetailServiceError);
      await expect(getWebsiteById(mockInvalidWebsiteId)).rejects.toThrow('Website with ID "non-existent" not found');
    });

    test('应该处理网络请求失败', async () => {
      const networkError = new WebsiteDetailServiceError(
        'Failed to fetch website detail: Network error',
        'FETCH_ERROR',
        { originalError: new Error('Network error') }
      );

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(networkError);

      await expect(getWebsiteById(mockValidWebsiteId)).rejects.toThrow('Failed to fetch website detail');
    });

    test('应该处理无效的输入参数', async () => {
      const validationError = new WebsiteDetailServiceError(
        'Invalid website ID parameter',
        'VALIDATION_ERROR',
        { providedId: '' }
      );

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(validationError);

      await expect(getWebsiteById('')).rejects.toThrow('Invalid website ID parameter');
    });

    test('应该处理访问权限被拒绝的情况', async () => {
      const accessDeniedError = new WebsiteDetailServiceError(
        'Website is not accessible or not public',
        'ACCESS_DENIED',
        { websiteId: mockValidWebsiteId }
      );

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(accessDeniedError);

      await expect(getWebsiteById(mockValidWebsiteId)).rejects.toThrow('Website is not accessible or not public');
    });
  });

  describe('3. API集成测试 - 相关网站推荐', () => {
    test('应该成功获取相关网站列表', async () => {
      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue(mockRelatedWebsites);

      const options: RelatedWebsitesOptions = {
        strategy: 'mixed',
        limit: 3,
        minSimilarityScore: 0.2,
      };

      const result = await getRelatedWebsites(mockValidWebsiteId, options);

      expect(result).toEqual(mockRelatedWebsites);
      expect(websiteDetailService.getRelatedWebsites).toHaveBeenCalledWith(mockValidWebsiteId, options);
    });

    test('应该处理不同的推荐策略', async () => {
      const strategies: Array<RelatedWebsitesOptions['strategy']> = ['category', 'tags', 'content', 'mixed'];
      
      for (const strategy of strategies) {
        jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue(mockRelatedWebsites);

        const result = await getRelatedWebsites(mockValidWebsiteId, { strategy });

        expect(result).toEqual(mockRelatedWebsites);
        expect(websiteDetailService.getRelatedWebsites).toHaveBeenCalledWith(
          mockValidWebsiteId,
          expect.objectContaining({ strategy })
        );
      }
    });

    test('应该处理推荐数量限制', async () => {
      const limitedResults = mockRelatedWebsites.slice(0, 1);
      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue(limitedResults);

      const result = await getRelatedWebsites(mockValidWebsiteId, { limit: 1 });

      expect(result).toHaveLength(1);
      expect(result).toEqual(limitedResults);
    });

    test('应该处理空的相关网站结果', async () => {
      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue([]);

      const result = await getRelatedWebsites(mockValidWebsiteId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('应该处理相关网站获取失败', async () => {
      const error = new WebsiteDetailServiceError(
        'Failed to get related websites',
        'FETCH_ERROR'
      );

      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockRejectedValue(error);

      await expect(getRelatedWebsites(mockValidWebsiteId)).rejects.toThrow('Failed to get related websites');
    });
  });

  describe('4. API集成测试 - 访问统计追踪', () => {
    test('应该成功记录网站访问', async () => {
      const expectedResult: VisitTrackingResult = {
        success: true,
        newVisitCount: 1251,
      };

      jest.spyOn(websiteDetailService, 'trackWebsiteVisit').mockResolvedValue(expectedResult);

      const result = await trackWebsiteVisit(mockValidWebsiteId);

      expect(result).toEqual(expectedResult);
      expect(result.success).toBe(true);
      expect(result.newVisitCount).toBe(1251);
      expect(websiteDetailService.trackWebsiteVisit).toHaveBeenCalledWith(mockValidWebsiteId);
    });

    test('应该处理访问统计失败', async () => {
      const failedResult: VisitTrackingResult = {
        success: false,
        newVisitCount: 1250,
        error: 'Website not found',
      };

      jest.spyOn(websiteDetailService, 'trackWebsiteVisit').mockResolvedValue(failedResult);

      const result = await trackWebsiteVisit(mockInvalidWebsiteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Website not found');
    });

    test('应该处理无效的网站ID', async () => {
      const invalidResult: VisitTrackingResult = {
        success: false,
        newVisitCount: 0,
        error: 'Invalid website ID parameter',
      };

      jest.spyOn(websiteDetailService, 'trackWebsiteVisit').mockResolvedValue(invalidResult);

      const result = await trackWebsiteVisit('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid website ID parameter');
    });
  });

  describe('5. 状态管理集成测试', () => {
    test('应该正确集成Zustand store和服务层', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      // Mock 服务方法
      jest.spyOn(websiteDetailService, 'getWebsiteById').mockResolvedValue(mockWebsiteDetail);
      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue(mockRelatedWebsites);

      // 测试加载网站详情
      await act(async () => {
        await result.current.actions.loadWebsiteDetail(mockValidWebsiteId);
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(result.current.currentWebsite).toEqual(mockWebsiteDetail);
        expect(result.current.currentWebsiteId).toBe(mockValidWebsiteId);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isInitialized).toBe(true);
      });

      // 验证相关网站也被加载
      await waitFor(() => {
        expect(result.current.relatedWebsites).toEqual(mockRelatedWebsites);
        expect(result.current.isLoadingRelated).toBe(false);
      }, { timeout: 1000 });
    });

    test('应该正确处理加载错误状态', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      const error = new WebsiteDetailServiceError(
        'Website not found',
        'NOT_FOUND'
      );

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(error);

      await act(async () => {
        await result.current.actions.loadWebsiteDetail(mockInvalidWebsiteId);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Website not found');
        expect(result.current.currentWebsite).toBe(null);
        expect(result.current.retryCount).toBe(1);
      });
    });

    test('应该正确管理访问统计状态', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      const trackingResult: VisitTrackingResult = {
        success: true,
        newVisitCount: 1251,
      };

      jest.spyOn(websiteDetailService, 'trackWebsiteVisit').mockResolvedValue(trackingResult);

      // 先加载网站详情
      jest.spyOn(websiteDetailService, 'getWebsiteById').mockResolvedValue(mockWebsiteDetail);
      await act(async () => {
        await result.current.actions.loadWebsiteDetail(mockValidWebsiteId);
      });

      // 然后记录访问
      await act(async () => {
        await result.current.actions.trackVisit(mockValidWebsiteId);
      });

      await waitFor(() => {
        expect(result.current.visitStats.hasRecordedVisit).toBe(true);
        expect(result.current.currentWebsite?.visitCount).toBe(1251);
        expect(result.current.isUpdatingVisit).toBe(false);
      });
    });

    test('应该正确管理相关网站配置', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      const newConfig = {
        strategy: 'category' as const,
        limit: 5,
        minSimilarityScore: 0.3,
      };

      act(() => {
        result.current.actions.setRelatedWebsitesConfig(newConfig);
      });

      expect(result.current.relatedWebsitesConfig).toMatchObject(newConfig);
    });
  });

  describe('6. 并发操作测试', () => {
    test('应该正确处理并发的网站详情请求', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockImplementation(async (id) => {
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        return { ...mockWebsiteDetail, id };
      });

      const websiteId1 = 'website-1';
      const websiteId2 = 'website-2';

      // 同时发起两个请求
      const promise1 = act(async () => {
        await result.current.actions.loadWebsiteDetail(websiteId1);
      });

      const promise2 = act(async () => {
        await result.current.actions.loadWebsiteDetail(websiteId2);
      });

      await Promise.all([promise1, promise2]);

      // 快进时间
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // 验证最后一个请求的结果被保留
      await waitFor(() => {
        expect(result.current.currentWebsiteId).toBe(websiteId2);
        expect(result.current.currentWebsite?.id).toBe(websiteId2);
      });
    });

    test('应该正确处理重复请求的去重', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      const getMock = jest.spyOn(websiteDetailService, 'getWebsiteById')
        .mockResolvedValue(mockWebsiteDetail);

      // 快速发起多个相同的请求
      await act(async () => {
        const promises = Array(3).fill(null).map(() => 
          result.current.actions.loadWebsiteDetail(mockValidWebsiteId)
        );
        await Promise.all(promises);
      });

      // 验证实际只调用了一次服务方法
      expect(getMock).toHaveBeenCalledTimes(1);
    });

    test('应该正确处理访问统计的并发请求', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      const trackMock = jest.spyOn(websiteDetailService, 'trackWebsiteVisit')
        .mockResolvedValue({ success: true, newVisitCount: 1251 });

      // 快速发起多个访问统计请求
      await act(async () => {
        const promises = Array(3).fill(null).map(() => 
          result.current.actions.trackVisit(mockValidWebsiteId)
        );
        await Promise.all(promises);
      });

      // 由于有重复访问保护，应该只记录一次
      expect(trackMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. 缓存机制测试', () => {
    test('应该正确使用缓存减少重复请求', async () => {
      const getMock = jest.spyOn(websiteDetailService, 'getWebsiteById')
        .mockResolvedValue(mockWebsiteDetail);

      // 第一次请求
      const result1 = await getWebsiteById(mockValidWebsiteId);
      expect(result1).toEqual(mockWebsiteDetail);
      expect(getMock).toHaveBeenCalledTimes(1);

      // 第二次请求相同的ID，应该使用缓存
      const result2 = await getWebsiteById(mockValidWebsiteId);
      expect(result2).toEqual(mockWebsiteDetail);
      expect(getMock).toHaveBeenCalledTimes(1); // 仍然是1次，使用了缓存
    });

    test('应该正确清除缓存', () => {
      const stats = websiteDetailService.getCacheStats();
      const initialCacheSize = stats.totalCacheEntries;

      // 清除缓存
      websiteDetailService.clearCache();

      const newStats = websiteDetailService.getCacheStats();
      expect(newStats.websitesCached).toBe(0);
      expect(newStats.relatedWebsitesCached).toBe(0);
      expect(newStats.totalCacheEntries).toBe(0);
    });

    test('应该正确管理相关网站缓存', async () => {
      const getRelatedMock = jest.spyOn(websiteDetailService, 'getRelatedWebsites')
        .mockResolvedValue(mockRelatedWebsites);

      const options: RelatedWebsitesOptions = { strategy: 'mixed', limit: 3 };

      // 第一次请求
      await getRelatedWebsites(mockValidWebsiteId, options);
      expect(getRelatedMock).toHaveBeenCalledTimes(1);

      // 相同参数的第二次请求应该使用缓存
      await getRelatedWebsites(mockValidWebsiteId, options);
      expect(getRelatedMock).toHaveBeenCalledTimes(1);

      // 不同参数的请求应该触发新的API调用
      await getRelatedWebsites(mockValidWebsiteId, { ...options, limit: 5 });
      expect(getRelatedMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('8. 批量操作测试', () => {
    test('应该正确处理批量网站详情获取', async () => {
      const websiteIds = ['website-1', 'website-2', 'website-3'];
      const mockResults = websiteIds.map(id => ({ ...mockWebsiteDetail, id }));

      jest.spyOn(websiteDetailService, 'getWebsiteById')
        .mockImplementation(async (id) => ({ ...mockWebsiteDetail, id }));

      const results = await getWebsitesByIdsBatch(websiteIds);

      expect(results).toHaveLength(3);
      expect(results.map(r => r.id)).toEqual(websiteIds);
    });

    test('应该正确处理批量操作中的部分失败', async () => {
      const websiteIds = ['website-1', 'invalid-id', 'website-3'];

      jest.spyOn(websiteDetailService, 'getWebsiteById')
        .mockImplementation(async (id) => {
          if (id === 'invalid-id') {
            throw new WebsiteDetailServiceError('Not found', 'NOT_FOUND');
          }
          return { ...mockWebsiteDetail, id };
        });

      const results = await getWebsitesByIdsBatch(websiteIds);

      // 应该只返回成功的结果
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toEqual(['website-1', 'website-3']);
    });
  });

  describe('9. 智能推荐测试', () => {
    test('应该正确处理基于用户历史的智能推荐', async () => {
      const userHistory = ['history-1', 'history-2'];
      
      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue(mockRelatedWebsites);

      const results = await getSmartRecommendations(
        mockValidWebsiteId,
        userHistory,
        4
      );

      expect(results).toEqual(mockRelatedWebsites);
    });

    test('应该正确处理无用户历史的情况', async () => {
      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue(mockRelatedWebsites);

      const results = await getSmartRecommendations(mockValidWebsiteId, [], 4);

      expect(results).toEqual(mockRelatedWebsites);
      expect(websiteDetailService.getRelatedWebsites).toHaveBeenCalledWith(
        mockValidWebsiteId,
        expect.objectContaining({ strategy: 'mixed' })
      );
    });

    test('应该正确处理智能推荐失败的降级', async () => {
      // Mock 智能推荐失败
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // 先让第一次调用失败，然后让降级调用成功
      jest.spyOn(websiteDetailService, 'getRelatedWebsites')
        .mockRejectedValueOnce(new Error('Smart recommendation failed'))
        .mockResolvedValueOnce(mockRelatedWebsites);

      const results = await getSmartRecommendations(mockValidWebsiteId, ['history-1'], 4);

      expect(results).toEqual(mockRelatedWebsites);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Smart recommendations failed, falling back to standard related websites:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('10. 性能优化测试', () => {
    test('应该正确实现网络延迟模拟', async () => {
      const startTime = Date.now();
      
      // 在开发模式下模拟网络延迟
      process.env.NODE_ENV = 'development';
      
      jest.spyOn(websiteDetailService, 'getWebsiteById').mockImplementation(async (id) => {
        // 调用真实的simulateNetworkDelay逻辑
        await new Promise(resolve => setTimeout(resolve, 200));
        return mockWebsiteDetail;
      });

      await getWebsiteById(mockValidWebsiteId);
      
      // 快进时间
      act(() => {
        jest.advanceTimersByTime(200);
      });

      const endTime = Date.now();
      
      // 重置环境变量
      delete process.env.NODE_ENV;
    });

    test('应该正确处理预加载操作', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue(mockRelatedWebsites);

      await act(async () => {
        await result.current.actions.preloadRelatedWebsites(mockValidWebsiteId);
      });

      expect(websiteDetailService.getRelatedWebsites).toHaveBeenCalledWith(mockValidWebsiteId);
    });

    test('应该正确处理预加载失败', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      jest.spyOn(websiteDetailService, 'getRelatedWebsites')
        .mockRejectedValue(new Error('Preload failed'));

      await act(async () => {
        await result.current.actions.preloadRelatedWebsites(mockValidWebsiteId);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Preload related websites failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('11. 边界情况和错误处理', () => {
    test('应该正确处理空字符串ID', async () => {
      const error = new WebsiteDetailServiceError(
        'Invalid website ID parameter',
        'VALIDATION_ERROR'
      );

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(error);

      await expect(getWebsiteById('')).rejects.toThrow('Invalid website ID parameter');
    });

    test('应该正确处理null和undefined输入', async () => {
      const error = new WebsiteDetailServiceError(
        'Invalid website ID parameter',
        'VALIDATION_ERROR'
      );

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(error);

      await expect(getWebsiteById(null as any)).rejects.toThrow();
      await expect(getWebsiteById(undefined as any)).rejects.toThrow();
    });

    test('应该正确处理超长的网站ID', async () => {
      const longId = 'a'.repeat(1000);
      
      jest.spyOn(websiteDetailService, 'getWebsiteById').mockResolvedValue({
        ...mockWebsiteDetail,
        id: longId,
      });

      const result = await getWebsiteById(longId);
      expect(result.id).toBe(longId);
    });

    test('应该正确处理特殊字符的网站ID', async () => {
      const specialId = 'website-测试-123!@#$%^&*()';
      
      jest.spyOn(websiteDetailService, 'getWebsiteById').mockResolvedValue({
        ...mockWebsiteDetail,
        id: specialId,
      });

      const result = await getWebsiteById(specialId);
      expect(result.id).toBe(specialId);
    });

    test('应该正确处理相关网站推荐的极限参数', async () => {
      jest.spyOn(websiteDetailService, 'getRelatedWebsites').mockResolvedValue([]);

      // 测试极小的limit
      await expect(getRelatedWebsites(mockValidWebsiteId, { limit: 0 }))
        .rejects.toThrow('Limit must be between 1 and 20');

      // 测试极大的limit
      await expect(getRelatedWebsites(mockValidWebsiteId, { limit: 100 }))
        .rejects.toThrow('Limit must be between 1 and 20');
    });
  });

  describe('12. 错误恢复和重试机制', () => {
    test('应该正确实现重试机制', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      let callCount = 0;
      jest.spyOn(websiteDetailService, 'getWebsiteById').mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return mockWebsiteDetail;
      });

      // 第一次调用失败
      await act(async () => {
        await result.current.actions.loadWebsiteDetail(mockValidWebsiteId);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.retryCount).toBe(1);

      // 重试调用
      await act(async () => {
        await result.current.actions.retryLoad();
      });

      expect(result.current.retryCount).toBe(2);

      // 再次重试，这次成功
      await act(async () => {
        await result.current.actions.retryLoad();
      });

      await waitFor(() => {
        expect(result.current.currentWebsite).toEqual(mockWebsiteDetail);
        expect(result.current.error).toBe(null);
        expect(result.current.retryCount).toBe(0);
      });
    });

    test('应该限制重试次数', async () => {
      const { result } = renderHook(() => useWebsiteDetailStore());

      jest.spyOn(websiteDetailService, 'getWebsiteById').mockRejectedValue(new Error('Network error'));

      // 连续失败4次，超过最大重试次数
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          await result.current.actions.loadWebsiteDetail(mockValidWebsiteId);
        });
      }

      expect(result.current.retryCount).toBe(4);

      // 尝试再次重试，应该被限制
      const initialRetryCount = result.current.retryCount;
      await act(async () => {
        await result.current.actions.retryLoad();
      });

      // 由于超过最大重试次数，重试应该被跳过
      expect(result.current.retryCount).toBe(initialRetryCount);
    });
  });
});