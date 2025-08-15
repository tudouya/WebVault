/**
 * Collection Store 状态管理单元测试
 * 
 * 测试集合状态管理Store的核心功能：
 * - 初始状态验证和默认值
 * - 数据加载和异步操作处理
 * - 搜索查询和分页状态管理
 * - 筛选条件和排序逻辑
 * - 错误处理和重试机制
 * - URL状态同步功能
 * - 视图设置和用户偏好
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useCollectionStore, 
  useCollectionUrlSync, 
  useCollectionPagination, 
  useCollectionFilters,
  useCollectionView,
  useCollectionData
} from '../collection-store';
import type { CollectionStatus, Collection } from '../../types/collection';

// Mock the mock data functions
jest.mock('../../data/mockCollections', () => ({
  getMockCollections: jest.fn(() => [
    {
      id: 'collection-1',
      title: 'Web Development',
      description: 'Frontend and backend development tools',
      icon: { character: '💻', backgroundColor: '#3b82f6', textColor: '#ffffff' },
      websiteCount: 15,
      status: 'active' as const,
      tags: ['development', 'frontend'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-08-10T15:30:00Z',
      createdBy: 'user-1'
    },
    {
      id: 'collection-2', 
      title: 'Design Resources',
      description: 'UI/UX design tools and inspiration',
      icon: { character: '🎨', backgroundColor: '#8b5cf6', textColor: '#ffffff' },
      websiteCount: 8,
      status: 'active' as const,
      tags: ['design', 'ui'],
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-08-05T12:00:00Z',
      createdBy: 'user-2'
    },
    {
      id: 'collection-3',
      title: 'Draft Collection',
      description: 'Work in progress collection',
      icon: { character: '📝', backgroundColor: '#6b7280', textColor: '#ffffff' },
      websiteCount: 3,
      status: 'draft' as const,
      tags: ['misc'],
      createdAt: '2024-03-01T14:00:00Z',
      updatedAt: '2024-08-01T16:00:00Z',
      createdBy: 'user-1'
    }
  ]),
  searchMockCollections: jest.fn((query: string) => {
    const mockCollections = [
      {
        id: 'collection-1',
        title: 'Web Development',
        description: 'Frontend and backend development tools',
        icon: { character: '💻', backgroundColor: '#3b82f6', textColor: '#ffffff' },
        websiteCount: 15,
        status: 'active' as const,
        tags: ['development', 'frontend'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-10T15:30:00Z',
        createdBy: 'user-1'
      }
    ];
    
    if (query.toLowerCase().includes('development')) {
      return mockCollections;
    }
    return [];
  }),
  filterMockCollectionsByStatus: jest.fn(() => []),
  filterMockCollectionsByTags: jest.fn(() => []),
  getAllMockCollectionTags: jest.fn(() => ['development', 'frontend', 'design', 'ui', 'misc'])
}));

// Mock nuqs hooks
jest.mock('nuqs', () => ({
  parseAsString: { parseServerSide: jest.fn(), withDefault: jest.fn() },
  parseAsInteger: { parseServerSide: jest.fn(), withDefault: jest.fn() },
  parseAsArrayOf: jest.fn(),
  parseAsBoolean: { parseServerSide: jest.fn(), withDefault: jest.fn() },
  useQueryState: jest.fn(() => ['', jest.fn()]),
  useQueryStates: jest.fn(() => [{}, jest.fn()]),
}));

describe('useCollectionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCollectionStore.getState().actions.resetAll();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('initializes with correct default values', () => {
      const store = useCollectionStore.getState();

      expect(store.collections).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.searchQuery).toBe('');

      expect(store.pagination).toEqual({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 12,
      });

      expect(store.filters).toEqual({
        status: undefined,
        tags: undefined,
        dateRange: undefined,
        createdBy: undefined,
      });

      expect(store.sorting).toEqual({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(store.viewSettings).toEqual({
        viewMode: 'grid',
        groupBy: 'none',
        showPreview: true,
      });
    });

    test('initializes UI state correctly', () => {
      const store = useCollectionStore.getState();

      expect(store.ui.isLoading).toBe(false);
      expect(store.ui.isInitialized).toBe(false);
      expect(store.ui.retryCount).toBe(0);
    });

    test('initializes meta state correctly', () => {
      const store = useCollectionStore.getState();

      expect(store.meta.lastUpdated).toBeNull();
      expect(store.meta.availableTags).toEqual([]);
      expect(store.meta.dataSource).toBe('mock');
    });
  });

  describe('Data Loading', () => {
    test('loadCollections updates loading state correctly', async () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.actions.loadCollections();
      });

      // Should set loading to true initially
      expect(result.current.ui.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      // Wait for async operation to complete
      await waitFor(() => {
        expect(result.current.ui.isLoading).toBe(false);
      });

      expect(result.current.ui.isInitialized).toBe(true);
      expect(result.current.collections.length).toBe(3); // From mock data
      expect(result.current.error).toBeNull();
    });

    test('loadCollections handles pagination correctly', async () => {
      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.actions.loadCollections();
      });

      expect(result.current.pagination.totalItems).toBe(3);
      expect(result.current.pagination.totalPages).toBe(1); // 3 items, 12 per page
      expect(result.current.pagination.currentPage).toBe(1);
    });

    test('refreshCollections calls loadCollections', async () => {
      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.actions.refreshCollections();
      });

      expect(result.current.ui.isInitialized).toBe(true);
      expect(result.current.collections.length).toBe(3);
    });

    test('prevents duplicate loading requests', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Start first load
      act(() => {
        result.current.actions.loadCollections();
      });

      expect(result.current.ui.isLoading).toBe(true);

      // Try to start second load while first is in progress
      act(() => {
        result.current.actions.loadCollections();
      });

      // Should still be loading from first request
      expect(result.current.ui.isLoading).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    test('setSearchQuery updates search state and reloads data', async () => {
      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        result.current.actions.setSearchQuery('development');
      });

      expect(result.current.searchQuery).toBe('development');
      expect(result.current.pagination.currentPage).toBe(1); // Reset to page 1

      // Wait for auto-reload to complete
      await waitFor(() => {
        expect(result.current.ui.isLoading).toBe(false);
      });
    });

    test('clearSearch resets search query and reloads', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Set initial search
      act(() => {
        result.current.actions.setSearchQuery('test');
      });

      expect(result.current.searchQuery).toBe('test');

      // Clear search
      await act(async () => {
        result.current.actions.clearSearch();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.pagination.currentPage).toBe(1);
    });
  });

  describe('Pagination Management', () => {
    test('setCurrentPage updates page and validates bounds', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Load initial data to set up pagination
      await act(async () => {
        await result.current.actions.loadCollections();
      });

      // Test valid page change
      act(() => {
        result.current.actions.setCurrentPage(1);
      });

      expect(result.current.pagination.currentPage).toBe(1);

      // Test invalid page (too high)
      act(() => {
        result.current.actions.setCurrentPage(999);
      });

      // Should not change from valid page
      expect(result.current.pagination.currentPage).toBe(1);

      // Test invalid page (too low)
      act(() => {
        result.current.actions.setCurrentPage(0);
      });

      // Should not change from valid page
      expect(result.current.pagination.currentPage).toBe(1);
    });

    test('setItemsPerPage validates bounds and resets page', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Test valid items per page
      await act(async () => {
        result.current.actions.setItemsPerPage(24);
      });

      expect(result.current.pagination.itemsPerPage).toBe(24);
      expect(result.current.pagination.currentPage).toBe(1); // Reset to page 1

      // Test invalid (too low)
      act(() => {
        result.current.actions.setItemsPerPage(0);
      });

      expect(result.current.pagination.itemsPerPage).toBe(24); // Should not change

      // Test invalid (too high)
      act(() => {
        result.current.actions.setItemsPerPage(101);
      });

      expect(result.current.pagination.itemsPerPage).toBe(24); // Should not change
    });

    test('goToNextPage and goToPreviousPage work correctly', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Set up scenario with multiple pages
      await act(async () => {
        result.current.actions.setItemsPerPage(2); // 2 items per page
        await result.current.actions.loadCollections();
      });

      expect(result.current.pagination.totalPages).toBe(2); // 3 items, 2 per page = 2 pages

      // Test next page
      act(() => {
        result.current.actions.goToNextPage();
      });

      expect(result.current.pagination.currentPage).toBe(2);

      // Test next page at boundary
      act(() => {
        result.current.actions.goToNextPage();
      });

      expect(result.current.pagination.currentPage).toBe(2); // Should not exceed total pages

      // Test previous page
      act(() => {
        result.current.actions.goToPreviousPage();
      });

      expect(result.current.pagination.currentPage).toBe(1);

      // Test previous page at boundary
      act(() => {
        result.current.actions.goToPreviousPage();
      });

      expect(result.current.pagination.currentPage).toBe(1); // Should not go below 1
    });
  });

  describe('Filtering Operations', () => {
    test('setStatusFilter updates filter and resets pagination', async () => {
      const { result } = renderHook(() => useCollectionStore());

      const statusFilter: CollectionStatus[] = ['active', 'draft'];

      await act(async () => {
        result.current.actions.setStatusFilter(statusFilter);
      });

      expect(result.current.filters?.status).toEqual(statusFilter);
      expect(result.current.pagination.currentPage).toBe(1);

      // Test clearing filter with empty array
      await act(async () => {
        result.current.actions.setStatusFilter([]);
      });

      expect(result.current.filters?.status).toBeUndefined();
    });

    test('setTagsFilter updates tags filter correctly', async () => {
      const { result } = renderHook(() => useCollectionStore());

      const tagsFilter = ['development', 'frontend'];

      await act(async () => {
        result.current.actions.setTagsFilter(tagsFilter);
      });

      expect(result.current.filters?.tags).toEqual(tagsFilter);
      expect(result.current.pagination.currentPage).toBe(1);
    });

    test('setDateRangeFilter handles date range filtering', async () => {
      const { result } = renderHook(() => useCollectionStore());

      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';

      await act(async () => {
        result.current.actions.setDateRangeFilter(dateFrom, dateTo);
      });

      expect(result.current.filters?.dateRange).toEqual({
        from: dateFrom,
        to: dateTo
      });

      // Test clearing with empty dates
      await act(async () => {
        result.current.actions.setDateRangeFilter('', '');
      });

      expect(result.current.filters?.dateRange).toBeUndefined();
    });

    test('clearFilters resets all filters', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Set various filters
      act(() => {
        result.current.actions.setSearchQuery('test');
        result.current.actions.setStatusFilter(['active']);
        result.current.actions.setTagsFilter(['development']);
      });

      expect(result.current.searchQuery).toBe('test');
      expect(result.current.filters?.status).toEqual(['active']);
      expect(result.current.filters?.tags).toEqual(['development']);

      // Clear all filters
      await act(async () => {
        result.current.actions.clearFilters();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.filters?.status).toBeUndefined();
      expect(result.current.filters?.tags).toBeUndefined();
      expect(result.current.filters?.dateRange).toBeUndefined();
      expect(result.current.filters?.createdBy).toBeUndefined();
      expect(result.current.pagination.currentPage).toBe(1);
    });
  });

  describe('Sorting Operations', () => {
    test('setSorting updates sort configuration', async () => {
      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        result.current.actions.setSorting('title', 'asc');
      });

      expect(result.current.sorting).toEqual({
        sortBy: 'title',
        sortOrder: 'asc'
      });
      expect(result.current.pagination.currentPage).toBe(1);

      // Test different sort options
      await act(async () => {
        result.current.actions.setSorting('websiteCount', 'desc');
      });

      expect(result.current.sorting).toEqual({
        sortBy: 'websiteCount',
        sortOrder: 'desc'
      });
    });
  });

  describe('View Settings', () => {
    test('setViewMode updates view mode', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.actions.setViewMode('list');
      });

      expect(result.current.viewSettings?.viewMode).toBe('list');

      act(() => {
        result.current.actions.setViewMode('compact');
      });

      expect(result.current.viewSettings?.viewMode).toBe('compact');
    });

    test('setGroupBy updates grouping and reloads data', async () => {
      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        result.current.actions.setGroupBy('status');
      });

      expect(result.current.viewSettings?.groupBy).toBe('status');
      expect(result.current.pagination.currentPage).toBe(1);
    });

    test('setShowPreview toggles preview setting', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.actions.setShowPreview(false);
      });

      expect(result.current.viewSettings?.showPreview).toBe(false);

      act(() => {
        result.current.actions.setShowPreview(true);
      });

      expect(result.current.viewSettings?.showPreview).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('setError and clearError work correctly', () => {
      const { result } = renderHook(() => useCollectionStore());

      const errorMessage = 'Something went wrong';

      act(() => {
        result.current.actions.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);

      act(() => {
        result.current.actions.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    test('retryLoad increments retry count and reloads', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Simulate error state
      act(() => {
        result.current.actions.setError('Network error');
      });

      expect(result.current.ui.retryCount).toBe(0);

      await act(async () => {
        await result.current.actions.retryLoad();
      });

      // After successful retry, retry count should reset
      expect(result.current.ui.retryCount).toBe(0);
      expect(result.current.error).toBeNull();
    });

    test('retryLoad respects maximum retry limit', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Manually set high retry count
      act(() => {
        useCollectionStore.setState((state) => ({
          ui: { ...state.ui, retryCount: 3 }
        }));
      });

      await act(async () => {
        await result.current.actions.retryLoad();
      });

      // Should not attempt retry when count >= 3
      expect(result.current.ui.retryCount).toBe(3);
    });
  });

  describe('Reset Operations', () => {
    test('resetPagination resets pagination to default', () => {
      const { result } = renderHook(() => useCollectionStore());

      // Change pagination first
      act(() => {
        result.current.actions.setCurrentPage(2);
        result.current.actions.setItemsPerPage(24);
      });

      act(() => {
        result.current.actions.resetPagination();
      });

      expect(result.current.pagination).toEqual({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 12,
      });
    });

    test('resetFilters clears all filters', async () => {
      const { result } = renderHook(() => useCollectionStore());

      // Set filters first
      act(() => {
        result.current.actions.setSearchQuery('test');
        result.current.actions.setStatusFilter(['active']);
      });

      act(() => {
        result.current.actions.resetFilters();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.filters?.status).toBeUndefined();
      expect(result.current.pagination.currentPage).toBe(1);
    });

    test('resetViewSettings resets view to defaults', () => {
      const { result } = renderHook(() => useCollectionStore());

      // Change view settings first
      act(() => {
        result.current.actions.setViewMode('list');
        result.current.actions.setGroupBy('status');
        result.current.actions.setShowPreview(false);
      });

      act(() => {
        result.current.actions.resetViewSettings();
      });

      expect(result.current.viewSettings).toEqual({
        viewMode: 'grid',
        groupBy: 'none',
        showPreview: true,
      });
    });

    test('resetAll resets entire state', () => {
      const { result } = renderHook(() => useCollectionStore());

      // Change various state values
      act(() => {
        result.current.actions.setSearchQuery('test');
        result.current.actions.setCurrentPage(2);
        result.current.actions.setViewMode('list');
        result.current.actions.setError('test error');
      });

      act(() => {
        result.current.actions.resetAll();
      });

      // Check that all values are reset
      expect(result.current.searchQuery).toBe('');
      expect(result.current.pagination.currentPage).toBe(1);
      expect(result.current.viewSettings?.viewMode).toBe('grid');
      expect(result.current.error).toBeNull();
      expect(result.current.ui.isInitialized).toBe(false);
    });
  });

  describe('URL Sync Operations', () => {
    test('syncFromURL updates state from URL parameters', () => {
      const { result } = renderHook(() => useCollectionStore());

      const urlParams = {
        search: 'development',
        page: 2,
        limit: 24,
        status: 'active,draft',
        tags: 'frontend,backend',
        sortBy: 'title',
        sortOrder: 'asc',
        view: 'list',
        groupBy: 'status',
        showPreview: false,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        createdBy: 'user-1'
      };

      act(() => {
        result.current.actions.syncFromURL(urlParams);
      });

      expect(result.current.searchQuery).toBe('development');
      expect(result.current.pagination.currentPage).toBe(2);
      expect(result.current.pagination.itemsPerPage).toBe(24);
      expect(result.current.filters?.status).toEqual(['active', 'draft']);
      expect(result.current.filters?.tags).toEqual(['frontend', 'backend']);
      expect(result.current.sorting).toEqual({
        sortBy: 'title',
        sortOrder: 'asc'
      });
      expect(result.current.viewSettings).toEqual({
        viewMode: 'list',
        groupBy: 'status',
        showPreview: false
      });
    });

    test('syncFromURL handles empty and invalid values', () => {
      const { result } = renderHook(() => useCollectionStore());

      const urlParams = {
        search: '',
        page: 'invalid',
        limit: -5,
        status: ',,', // Empty status values
        tags: '  ,  ', // Whitespace only tags
      };

      act(() => {
        result.current.actions.syncFromURL(urlParams);
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.pagination.currentPage).toBe(1); // Fallback to 1
      expect(result.current.pagination.itemsPerPage).toBe(1); // After validation, Math.max(1, -5) becomes 1
      expect(result.current.filters?.status).toBeUndefined(); // Empty array becomes undefined
      expect(result.current.filters?.tags).toBeUndefined(); // Empty array becomes undefined
    });
  });

  describe('Utility Methods', () => {
    test('getFilteredCollections returns current collections', async () => {
      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.actions.loadCollections();
      });

      const filteredCollections = result.current.actions.getFilteredCollections();
      expect(filteredCollections).toEqual(result.current.collections);
      expect(filteredCollections.length).toBe(3);
    });

    test('getTotalFilteredCount returns total items count', async () => {
      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.actions.loadCollections();
      });

      const totalCount = result.current.actions.getTotalFilteredCount();
      expect(totalCount).toBe(result.current.pagination.totalItems);
      expect(totalCount).toBe(3);
    });
  });
});

describe('Collection Store Hook Utilities', () => {
  beforeEach(() => {
    useCollectionStore.getState().actions.resetAll();
    jest.clearAllMocks();
  });

  describe('useCollectionPagination', () => {
    test('provides pagination state and computed properties', async () => {
      const { result } = renderHook(() => useCollectionPagination());

      // Load data to set up pagination
      await act(async () => {
        await useCollectionStore.getState().actions.loadCollections();
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
        expect(result.current.isFirstPage).toBe(true);
        expect(result.current.isLastPage).toBe(true);
      });
    });

    test('provides pagination action methods', () => {
      const { result } = renderHook(() => useCollectionPagination());

      expect(typeof result.current.setPage).toBe('function');
      expect(typeof result.current.setItemsPerPage).toBe('function');
      expect(typeof result.current.goToNext).toBe('function');
      expect(typeof result.current.goToPrevious).toBe('function');
      expect(typeof result.current.resetPagination).toBe('function');
    });
  });

  describe('useCollectionFilters', () => {
    test('provides filter state and computed properties', async () => {
      const { result } = renderHook(() => useCollectionFilters());

      await act(async () => {
        useCollectionStore.getState().actions.loadCollections();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.statusFilter).toEqual([]);
      expect(result.current.tagsFilter).toEqual([]);
      expect(result.current.activeFiltersCount).toBe(0);
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.availableTags).toEqual(['development', 'frontend', 'design', 'ui', 'misc']);
    });

    test('calculates active filters count correctly', () => {
      const { result } = renderHook(() => useCollectionFilters());

      act(() => {
        useCollectionStore.getState().actions.setSearchQuery('test');
        useCollectionStore.getState().actions.setStatusFilter(['active']);
      });

      expect(result.current.activeFiltersCount).toBe(2);
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('useCollectionView', () => {
    test('provides view settings state and methods', () => {
      const { result } = renderHook(() => useCollectionView());

      expect(result.current.viewMode).toBe('grid');
      expect(result.current.groupBy).toBe('none');
      expect(result.current.showPreview).toBe(true);

      expect(typeof result.current.setViewMode).toBe('function');
      expect(typeof result.current.setGroupBy).toBe('function');
      expect(typeof result.current.setShowPreview).toBe('function');
      expect(typeof result.current.resetViewSettings).toBe('function');
    });
  });

  describe('useCollectionData', () => {
    test('provides data state and loading information', async () => {
      const { result } = renderHook(() => useCollectionData());

      expect(result.current.collections).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.loadCollections();
      });

      expect(result.current.collections.length).toBe(3);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });
});

describe('Collection Store Error Scenarios', () => {
  beforeEach(() => {
    useCollectionStore.getState().actions.resetAll();
    jest.clearAllMocks();
  });

  test('handles loading errors gracefully', async () => {
    // Mock console.error to avoid test noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock getMockCollections to throw error
    const mockGetCollections = require('../../data/mockCollections').getMockCollections;
    mockGetCollections.mockImplementationOnce(() => {
      throw new Error('Network failure');
    });

    const { result } = renderHook(() => useCollectionStore());

    await act(async () => {
      await result.current.actions.loadCollections();
    });

    expect(result.current.error).toBe('Network failure');
    expect(result.current.ui.isLoading).toBe(false);
    expect(result.current.ui.retryCount).toBe(1);

    consoleErrorSpy.mockRestore();
  });

  test('handles non-Error objects in catch block', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock to throw non-Error object
    const mockGetCollections = require('../../data/mockCollections').getMockCollections;
    mockGetCollections.mockImplementationOnce(() => {
      throw 'String error';
    });

    const { result } = renderHook(() => useCollectionStore());

    await act(async () => {
      await result.current.actions.loadCollections();
    });

    expect(result.current.error).toBe('加载集合数据失败，请稍后重试');
    expect(result.current.ui.retryCount).toBe(1);

    consoleErrorSpy.mockRestore();
  });
});