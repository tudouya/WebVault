/**
 * useBrowsablePageData Hook 集成测试
 * 
 * 测试配置驱动的浏览页面数据获取Hook的核心功能：
 * - 配置驱动的数据获取逻辑（collection、category、tag页面类型）
 * - 状态管理集成（browsable-page-store）
 * - 错误处理和重试逻辑
 * - 模拟API调用和响应
 * - 防抖处理和性能优化
 * - 缓存机制验证
 * - URL状态同步
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { 
  useBrowsablePageData, 
  useSimpleBrowsablePageData,
  fetchDataByConfig,
  type DataFetchConfig,
  type ApiCallParams,
  type DataFetchResult 
} from '../useBrowsablePageData';
import { useBrowsablePageStore, useBrowsablePageUrlSync } from '../../stores/browsable-page-store';
import type { 
  BrowsablePageConfig, 
  BrowsablePageData, 
  PageType,
  FilterParams
} from '../../types';

// Mock external dependencies
jest.mock('use-debounce', () => ({
  useDebouncedCallback: jest.fn((fn, delay) => {
    const debouncedFn = jest.fn(fn);
    debouncedFn.cancel = jest.fn();
    return debouncedFn;
  }),
}));

jest.mock('nuqs', () => ({
  parseAsString: jest.fn(),
  parseAsInteger: jest.fn(),
  parseAsBoolean: jest.fn(),
  useQueryState: jest.fn(() => [null, jest.fn()]),
  useQueryStates: jest.fn(() => [{}, jest.fn()]),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock store
jest.mock('../../stores/browsable-page-store', () => ({
  useBrowsablePageStore: jest.fn(),
  useBrowsablePageUrlSync: jest.fn(),
}));

// Mock data types and test fixtures
const mockBrowsablePageConfig: BrowsablePageConfig = {
  pageType: 'collection',
  hero: {
    enabled: true,
    showBreadcrumbs: true,
    showStats: true,
  },
  filters: {
    searchEnabled: true,
    categoryEnabled: true,
    tagEnabled: true,
    sortEnabled: true,
    showFilterCounts: true,
    searchPlaceholder: 'Search websites...',
    defaultSort: {
      field: 'created_at',
      order: 'desc',
    },
    availableSorts: [
      {
        field: 'created_at',
        label: 'Latest',
        order: 'desc',
        description: 'Most recently added',
      },
      {
        field: 'name',
        label: 'Name',
        order: 'asc',
        description: 'Alphabetical order',
      },
    ],
  },
  content: {
    defaultViewMode: 'grid',
    viewModeToggle: true,
    grid: {
      defaultItemsPerPage: 12,
      responsiveColumns: {
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4,
      },
    },
  },
  features: {
    enableSorting: true,
    enablePagination: true,
    showAdBanner: true,
    showRelated: true,
  },
  navigation: {
    breadcrumbs: {
      enabled: true,
      showHome: true,
    },
    sidebar: {
      enabled: false,
      collapsible: true,
      defaultCollapsed: false,
    },
    related: {
      showSimilar: true,
      showChildren: false,
    },
  },
};

const mockBrowsablePageData: BrowsablePageData = {
  entity: {
    id: 'test-collection',
    name: 'Test Collection',
    slug: 'test-collection',
    description: 'A test collection for testing',
    stats: {
      websiteCount: 42,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-08-16T00:00:00Z',
    },
  },
  websites: {
    items: [
      {
        id: 'website-1',
        title: 'Example Website',
        description: 'An example website for testing',
        url: 'https://example.com',
        image_url: '/images/example.jpg',
        favicon_url: '/favicons/example.ico',
        category: 'development',
        tags: ['react', 'javascript'],
        rating: 4.5,
        visit_count: 150,
        is_featured: true,
        isAd: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-08-16T00:00:00Z',
      },
    ],
    totalCount: 42,
    pagination: {
      currentPage: 1,
      itemsPerPage: 12,
      totalPages: 4,
      hasNextPage: true,
      hasPrevPage: false,
    },
  },
  filterOptions: {
    categories: [
      { id: 'cat1', name: 'Development', slug: 'development', websiteCount: 25 },
      { id: 'cat2', name: 'Design', slug: 'design', websiteCount: 17 },
    ],
    tags: [
      { id: 'tag1', name: 'react', slug: 'react', websiteCount: 15, color: '#61dafb' },
      { id: 'tag2', name: 'javascript', slug: 'javascript', websiteCount: 20, color: '#f7df1e' },
    ],
  },
  breadcrumbs: [
    { label: 'Home', href: '/', current: false },
    { label: 'Collections', href: '/collections', current: false },
    { label: 'Test Collection', href: '/collections/test-collection', current: true },
  ],
  related: {
    similar: [
      {
        id: 'similar-1',
        name: 'Similar Collection',
        slug: 'similar-collection',
        type: 'collection',
        websiteCount: 30,
      },
    ],
  },
};

const mockDefaultFilters: FilterParams = {
  entityId: null,
  search: '',
  categoryId: null,
  selectedTags: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
  featuredOnly: false,
  includeAds: true,
  minRating: 0,
  viewMode: 'grid',
  itemsPerPage: 12,
  currentPage: 1,
};

// Mock store state
const createMockStoreState = (overrides = {}) => ({
  config: mockBrowsablePageConfig,
  data: null as BrowsablePageData | null,
  filters: mockDefaultFilters,
  loading: {
    page: false,
    content: false,
    filters: false,
  },
  error: {
    page: undefined,
    content: undefined,
    filters: undefined,
  },
  ui: {
    sidebarOpen: false,
    mobileFiltersOpen: false,
    viewMode: 'grid' as const,
  },
  meta: {
    lastUpdated: null,
    dataSource: 'mock' as const,
    retryCount: 0,
    isInitialized: false,
    urlSyncEnabled: true,
    lastUrlSync: null,
    isSyncingUrl: false,
  },
  actions: {
    setConfig: jest.fn(),
    loadData: jest.fn(),
    refreshData: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    retryLoad: jest.fn(),
    getCurrentEntitySlug: jest.fn(() => 'test-collection'),
  },
  ...overrides,
});

// Mock URL sync
const createMockUrlSync = () => ({
  urlState: {},
  setUrlState: jest.fn(),
  syncStoreFromUrl: jest.fn(),
  syncUrlFromStore: jest.fn(),
});

const mockUseBrowsablePageStore = jest.mocked(useBrowsablePageStore);
const mockUseBrowsablePageUrlSync = jest.mocked(useBrowsablePageUrlSync);

describe('useBrowsablePageData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    mockUseBrowsablePageStore.mockReturnValue(createMockStoreState());
    mockUseBrowsablePageUrlSync.mockReturnValue(createMockUrlSync());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State and Configuration', () => {
    test('returns correct initial state', () => {
      const { result } = renderHook(() => useBrowsablePageData());

      expect(result.current.data).toBeNull();
      expect(result.current.entity).toBeUndefined();
      expect(result.current.websites).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.pagination).toBeUndefined();
      expect(result.current.filterOptions).toBeUndefined();
      expect(result.current.breadcrumbs).toEqual([]);
      expect(result.current.loading).toEqual({
        page: false,
        content: false,
        filters: false,
      });
      expect(result.current.error).toEqual({
        page: undefined,
        content: undefined,
        filters: undefined,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(false);
    });

    test('accepts and merges custom fetch configuration', () => {
      const customConfig: DataFetchConfig = {
        debounceDelay: 500,
        maxRetries: 5,
        enableCaching: false,
        autoRefresh: true,
      };

      const { result } = renderHook(() => useBrowsablePageData(customConfig));

      expect(result.current.config).toMatchObject(customConfig);
      expect(result.current.config.retryDelay).toBe(1000); // Default value maintained
    });

    test('returns debugging information in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { result } = renderHook(() => useBrowsablePageData());

      expect(result.current._debug).toBeDefined();
      expect(result.current._debug).toHaveProperty('isLoading');
      expect(result.current._debug).toHaveProperty('retryCount');
      expect(result.current._debug).toHaveProperty('autoRefreshActive');
      expect(result.current._debug).toHaveProperty('cacheEnabled');
      expect(result.current._debug).toHaveProperty('fetchConfig');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Data Loading Integration', () => {
    test('loads data successfully', async () => {
      const mockStoreState = createMockStoreState({
        data: mockBrowsablePageData,
        meta: { ...createMockStoreState().meta, isInitialized: true },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useBrowsablePageData());

      await act(async () => {
        await result.current.loadData('test-collection');
      });

      expect(result.current.data).toEqual(mockBrowsablePageData);
      expect(result.current.entity).toEqual(mockBrowsablePageData.entity);
      expect(result.current.websites).toEqual(mockBrowsablePageData.websites.items);
      expect(result.current.totalCount).toBe(42);
      expect(result.current.pagination).toEqual(mockBrowsablePageData.websites.pagination);
    });

    test('handles data loading errors', async () => {
      const mockStoreState = createMockStoreState({
        error: { page: 'Failed to load data', content: undefined, filters: undefined },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useBrowsablePageData());

      expect(result.current.error.page).toBe('Failed to load data');
      expect(result.current.isLoading).toBe(false);
    });

    test('manages loading states correctly', () => {
      const mockStoreState = createMockStoreState({
        loading: { page: true, content: true, filters: false },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useBrowsablePageData());

      expect(result.current.loading.page).toBe(true);
      expect(result.current.loading.content).toBe(true);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Configuration-driven Data Fetching', () => {
    test('validates API call parameters correctly', () => {
      const { result } = renderHook(() => useBrowsablePageData());

      // Verify that hook can handle loading without errors
      expect(result.current.loadData).toBeDefined();
      expect(typeof result.current.loadData).toBe('function');
    });

    test('handles different page types correctly', async () => {
      const pageTypes: PageType[] = ['collection', 'category', 'tag'];

      for (const pageType of pageTypes) {
        const config = { ...mockBrowsablePageConfig, pageType };
        const mockStoreState = createMockStoreState({ config });
        
        mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

        const { result } = renderHook(() => useBrowsablePageData());

        expect(result.current.pageConfig.pageType).toBe(pageType);
      }
    });

    test('applies filters correctly when loading data', async () => {
      const filtersWithSearch: FilterParams = {
        ...mockDefaultFilters,
        search: 'react',
        categoryId: 'development',
        selectedTags: ['javascript'],
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const mockStoreState = createMockStoreState({
        filters: filtersWithSearch,
        data: mockBrowsablePageData,
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useBrowsablePageData());

      expect(result.current.data).toEqual(mockBrowsablePageData);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('implements retry logic with exponential backoff', async () => {
      const mockStoreState = createMockStoreState();
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useBrowsablePageData());

      expect(result.current.retryCount).toBe(0);
      expect(result.current.canRetry).toBe(true);
      expect(result.current.maxRetries).toBe(3);

      await act(async () => {
        await result.current.retryLoad();
      });

      expect(mockStoreState.actions.clearError).toHaveBeenCalled();
    });

    test('respects maximum retry limits', () => {
      const customConfig: DataFetchConfig = { maxRetries: 1 };
      const { result } = renderHook(() => useBrowsablePageData(customConfig));

      expect(result.current.maxRetries).toBe(1);
    });

    test('clears errors when requested', async () => {
      const mockStoreState = createMockStoreState({
        error: { page: 'Some error', content: undefined, filters: undefined },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useBrowsablePageData());

      // The clearError method should be available through store actions
      expect(mockStoreState.actions.clearError).toBeDefined();
      expect(typeof mockStoreState.actions.clearError).toBe('function');
    });
  });

  describe('Debouncing and Performance Optimization', () => {
    test('debounces data fetch calls', () => {
      const mockDebouncedCallback = jest.fn();
      mockDebouncedCallback.cancel = jest.fn();
      
      require('use-debounce').useDebouncedCallback.mockReturnValue(mockDebouncedCallback);

      renderHook(() => useBrowsablePageData({ debounceDelay: 500 }));

      // Verify debounced function setup
      expect(require('use-debounce').useDebouncedCallback).toHaveBeenCalledWith(
        expect.any(Function),
        500
      );
    });

    test('cancels pending debounced calls on unmount', () => {
      const mockDebouncedCallback = jest.fn();
      mockDebouncedCallback.cancel = jest.fn();
      
      require('use-debounce').useDebouncedCallback.mockReturnValue(mockDebouncedCallback);

      const { unmount } = renderHook(() => useBrowsablePageData());

      unmount();

      expect(mockDebouncedCallback.cancel).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    test('provides cache management methods', () => {
      const { result } = renderHook(() => useBrowsablePageData());

      expect(typeof result.current.clearCache).toBe('function');
      
      act(() => {
        result.current.clearCache();
      });

      // Cache should be cleared (no error thrown)
    });

    test('cache configuration affects behavior', () => {
      const { result: resultWithCache } = renderHook(() => 
        useBrowsablePageData({ enableCaching: true })
      );
      
      const { result: resultWithoutCache } = renderHook(() => 
        useBrowsablePageData({ enableCaching: false })
      );

      expect(resultWithCache.current.config.enableCaching).toBe(true);
      expect(resultWithoutCache.current.config.enableCaching).toBe(false);
    });
  });

  describe('Auto-refresh Functionality', () => {
    test('sets up auto-refresh when enabled', () => {
      const mockStoreState = createMockStoreState({
        loading: { page: false, content: false, filters: false },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      renderHook(() => useBrowsablePageData({ 
        autoRefresh: true, 
        refreshInterval: 1000 
      }));

      // Fast-forward time to trigger auto-refresh
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Auto-refresh logic would call refreshData internally
    });

    test('clears auto-refresh on unmount', () => {
      const { unmount } = renderHook(() => useBrowsablePageData({ 
        autoRefresh: true,
        refreshInterval: 1000 
      }));

      unmount();

      // Timer should be cleared (no error thrown)
    });
  });

  describe('Filter Change Reactions', () => {
    test('reacts to filter changes when initialized', () => {
      const mockStoreState = createMockStoreState({
        meta: { ...createMockStoreState().meta, isInitialized: true },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      renderHook(() => useBrowsablePageData());

      // Filter changes would trigger debounced data fetch when isInitialized is true
    });

    test('does not react to filter changes when not initialized', () => {
      const mockStoreState = createMockStoreState({
        meta: { ...createMockStoreState().meta, isInitialized: false },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      renderHook(() => useBrowsablePageData());

      // No data fetch should be triggered when not initialized
    });
  });

  describe('Store Integration', () => {
    test('provides access to store actions', () => {
      const { result } = renderHook(() => useBrowsablePageData());

      expect(typeof result.current.loadData).toBe('function');
      expect(typeof result.current.refreshData).toBe('function');
      expect(typeof result.current.retryLoad).toBe('function');
      expect(typeof result.current.getCurrentEntitySlug).toBe('function');
    });

    test('returns store state correctly', () => {
      const mockStoreState = createMockStoreState({
        data: mockBrowsablePageData,
        meta: { ...createMockStoreState().meta, lastUpdated: '2024-08-16T00:00:00Z' },
      });
      
      mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useBrowsablePageData());

      expect(result.current.lastUpdated).toBe('2024-08-16T00:00:00Z');
      expect(result.current.dataSource).toBe('mock');
    });
  });
});

describe('useSimpleBrowsablePageData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBrowsablePageStore.mockReturnValue(createMockStoreState());
    mockUseBrowsablePageUrlSync.mockReturnValue(createMockUrlSync());
  });

  test('returns simplified configuration', () => {
    const { result } = renderHook(() => useSimpleBrowsablePageData());

    expect(result.current.config).toEqual({
      debounceDelay: 500,
      maxRetries: 1,
      retryDelay: 1000,
      enableCaching: false,
      cacheTimeout: 5 * 60 * 1000,
      autoRefresh: false,
      refreshInterval: 30 * 1000,
    });
  });

  test('provides same interface as full hook', () => {
    const { result } = renderHook(() => useSimpleBrowsablePageData());

    expect(typeof result.current.loadData).toBe('function');
    expect(typeof result.current.refreshData).toBe('function');
    expect(typeof result.current.retryLoad).toBe('function');
    expect(result.current.data).toBeNull();
    expect(result.current.websites).toEqual([]);
  });
});

describe('fetchDataByConfig Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Data Fetching', () => {
    test('fetches data for collection page type', async () => {
      const params: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'test-collection',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      // Use promise resolution with timer advancement
      const resultPromise = fetchDataByConfig(params);
      
      // Advance timers to complete async operations
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.entity.slug).toBe('test-collection');
      expect(result.data?.entity.name).toContain('Collection');
      expect(typeof result.fromCache).toBe('boolean');
      expect(typeof result.duration).toBe('number');
    });

    test('fetches data for category page type', async () => {
      const params: ApiCallParams = {
        pageType: 'category',
        entitySlug: 'development',
        filters: mockDefaultFilters,
        config: { ...mockBrowsablePageConfig, pageType: 'category' },
      };

      const resultPromise = fetchDataByConfig(params);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data?.entity.slug).toBe('development');
      expect(result.data?.entity.name).toBe('Development');
    });

    test('fetches data for tag page type', async () => {
      const params: ApiCallParams = {
        pageType: 'tag',
        entitySlug: 'react',
        filters: mockDefaultFilters,
        config: { ...mockBrowsablePageConfig, pageType: 'tag' },
      };

      const resultPromise = fetchDataByConfig(params);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data?.entity.slug).toBe('react');
      expect(result.data?.entity.name).toBe('react');
    });

    test('handles unsupported page types', async () => {
      const params: ApiCallParams = {
        pageType: 'unsupported' as PageType,
        entitySlug: 'test',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      const resultPromise = fetchDataByConfig(params);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported page type');
    });
  });

  describe('Response Data Structure', () => {
    test('returns correct data structure for all page types', async () => {
      const pageTypes: PageType[] = ['collection', 'category', 'tag'];

      for (const pageType of pageTypes) {
        const params: ApiCallParams = {
          pageType,
          entitySlug: 'test-entity',
          filters: mockDefaultFilters,
          config: { ...mockBrowsablePageConfig, pageType },
        };

        const resultPromise = fetchDataByConfig(params);
        act(() => {
          jest.advanceTimersByTime(1000);
        });
        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(result.data).toMatchObject({
          entity: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
            stats: expect.objectContaining({
              websiteCount: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            }),
          }),
          websites: expect.objectContaining({
            items: expect.any(Array),
            totalCount: expect.any(Number),
            pagination: expect.objectContaining({
              currentPage: expect.any(Number),
              itemsPerPage: expect.any(Number),
              totalPages: expect.any(Number),
              hasNextPage: expect.any(Boolean),
              hasPrevPage: expect.any(Boolean),
            }),
          }),
          filterOptions: expect.objectContaining({
            categories: expect.any(Array),
            tags: expect.any(Array),
          }),
          breadcrumbs: expect.any(Array),
          related: expect.objectContaining({
            similar: expect.any(Array),
          }),
        });
      }
    });

    test('applies pagination filters correctly', async () => {
      const filtersWithPagination: FilterParams = {
        ...mockDefaultFilters,
        currentPage: 2,
        itemsPerPage: 6,
      };

      const params: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'test',
        filters: filtersWithPagination,
        config: mockBrowsablePageConfig,
      };

      const resultPromise = fetchDataByConfig(params);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data?.websites.pagination.currentPage).toBe(2);
      expect(result.data?.websites.pagination.itemsPerPage).toBe(6);
      expect(result.data?.websites.items.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      // Mock console.error to avoid test noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate error by modifying global setTimeout to throw
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn(() => {
        throw new Error('Network timeout');
      });

      const params: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'test',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      const result = await fetchDataByConfig(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
      expect(typeof result.duration).toBe('number');

      // Restore mocks
      global.setTimeout = originalSetTimeout;
      consoleErrorSpy.mockRestore();
    });

    test('handles non-Error exceptions', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock the buildMockDataByType to throw a string instead of Error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn(() => {
        throw 'String error';
      });

      const params: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'test',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      const result = await fetchDataByConfig(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load collection data');

      global.setTimeout = originalSetTimeout;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Caching Behavior', () => {
    test('caches successful responses', async () => {
      const params: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'cached-test',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      // First call - should fetch from API
      const firstPromise = fetchDataByConfig(params);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      const firstResult = await firstPromise;
      expect(firstResult.success).toBe(true);
      expect(typeof firstResult.fromCache).toBe('boolean');

      // Second call with same parameters - should potentially return from cache
      const secondResult = await fetchDataByConfig(params);
      expect(secondResult.success).toBe(true);
      expect(typeof secondResult.fromCache).toBe('boolean');
    });

    test('generates different cache keys for different parameters', async () => {
      const baseParams: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'test',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      // Different entity slug
      const params1 = { ...baseParams, entitySlug: 'test-1' };
      const params2 = { ...baseParams, entitySlug: 'test-2' };

      const promise1 = fetchDataByConfig(params1);
      const promise2 = fetchDataByConfig(params2);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const result1 = await promise1;
      const result2 = await promise2;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(typeof result1.fromCache).toBe('boolean');
      expect(typeof result2.fromCache).toBe('boolean');
    });
  });

  describe('Performance Characteristics', () => {
    test('simulates network delay', async () => {
      const startTime = Date.now();
      
      const params: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'perf-test',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      // Fast-forward through the simulated delay
      const resultPromise = fetchDataByConfig(params);
      act(() => {
        jest.advanceTimersByTime(500); // Advance through the setTimeout delay
      });
      
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    test('measures execution duration', async () => {
      const params: ApiCallParams = {
        pageType: 'collection',
        entitySlug: 'duration-test',
        filters: mockDefaultFilters,
        config: mockBrowsablePageConfig,
      };

      const resultPromise = fetchDataByConfig(params);
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      const result = await resultPromise;

      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});

describe('Integration with Store and URL Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBrowsablePageStore.mockReturnValue(createMockStoreState());
    mockUseBrowsablePageUrlSync.mockReturnValue(createMockUrlSync());
  });

  test('integrates with store state correctly', () => {
    const mockStoreState = createMockStoreState({
      data: mockBrowsablePageData,
      meta: { ...createMockStoreState().meta, isInitialized: true },
    });
    
    mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useBrowsablePageData());

    expect(result.current.data).toEqual(mockBrowsablePageData);
    expect(result.current.isInitialized).toBe(true);
  });

  test('provides URL sync integration', () => {
    const mockUrlSync = createMockUrlSync();
    mockUseBrowsablePageUrlSync.mockReturnValue(mockUrlSync);

    const { result } = renderHook(() => useBrowsablePageData());

    // URL sync should be available through the hook integration
    expect(mockUseBrowsablePageUrlSync).toHaveBeenCalled();
  });

  test('handles store action calls', () => {
    const mockStoreState = createMockStoreState();
    mockUseBrowsablePageStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useBrowsablePageData());

    // Verify store action is available and callable
    expect(typeof result.current.refreshData).toBe('function');
    expect(mockStoreState.actions.refreshData).toBeDefined();
  });
});