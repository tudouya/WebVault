/**
 * BrowsablePageLayout 组件单元测试
 * 
 * 测试配置驱动的页面布局组件核心功能：
 * - 配置驱动的组件渲染逻辑
 * - 页面类型条件性渲染（collection、category、tag）
 * - Props传递和事件处理
 * - 错误场景和边界条件
 * - 响应式布局和状态管理
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { BrowsablePageLayout, type BrowsablePageLayoutProps } from '../BrowsablePageLayout';
import type { BrowsablePageConfig, BrowsablePageData } from '../../types';
import { useBrowsablePageStore } from '../../stores/browsable-page-store';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('nuqs', () => ({
  parseAsString: jest.fn(),
  parseAsInteger: jest.fn(),
  parseAsBoolean: jest.fn(),
  useQueryState: jest.fn(() => [null, jest.fn()]),
  useQueryStates: jest.fn(() => [{}, jest.fn()]),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock the store before importing the component
jest.mock('../../stores/browsable-page-store', () => ({
  useBrowsablePageStore: jest.fn(),
}));

// Mock子组件
jest.mock('../PageHeader', () => ({
  PageHeader: ({ pageType, title, description, isLoading, stats }: any) => (
    <div data-testid="page-header">
      <div data-testid="page-type">{pageType}</div>
      <div data-testid="page-title">{title}</div>
      {description && <div data-testid="page-description">{description}</div>}
      {stats && <div data-testid="page-stats">{stats.count} {stats.label}</div>}
      {isLoading && <div data-testid="page-loading">Loading...</div>}
    </div>
  ),
}));

jest.mock('../FilterTabs', () => ({
  FilterTabs: ({ items, selectedValue, onTabChange, loading, filterType }: any) => (
    <div data-testid="filter-tabs">
      <div data-testid="filter-type">{filterType}</div>
      {loading && <div data-testid="filter-loading">Loading filters...</div>}
      {items?.map((item: any) => (
        <button
          key={item.id}
          data-testid={`filter-tab-${item.id}`}
          className={selectedValue === item.value ? 'selected' : ''}
          onClick={() => onTabChange(item.value)}
        >
          {item.label}
          {item.count && <span data-testid="filter-count">({item.count})</span>}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../SortDropdown', () => ({
  SortDropdown: ({ options, value, onValueChange, loading, placeholder }: any) => (
    <div data-testid="sort-dropdown">
      {loading && <div data-testid="sort-loading">Loading sort...</div>}
      <select
        data-testid="sort-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options?.map((option: any) => (
          <option key={`${option.field}_${option.order}`} value={`${option.field}_${option.order}`}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

jest.mock('../AdBanner', () => ({
  AdBanner: ({ displayType, adSlot, showAdLabel, enabled, className }: any) => 
    enabled ? (
      <div data-testid={`ad-banner-${adSlot}`} className={className}>
        <div data-testid="ad-display-type">{displayType}</div>
        {showAdLabel && <div data-testid="ad-label">Advertisement</div>}
      </div>
    ) : null,
}));

jest.mock('../Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button 
        data-testid="prev-page"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </button>
      <span data-testid="current-page">{currentPage}</span>
      <span data-testid="total-pages">{totalPages}</span>
      <button 
        data-testid="next-page"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </button>
    </div>
  ),
}));

jest.mock('@/features/websites/components/WebsiteGrid', () => ({
  WebsiteGrid: ({ websites, isLoading, isError, error, onVisitWebsite, onTagClick, onLoadMore, hasMore, className }: any) => (
    <div data-testid="website-grid" className={className}>
      {isLoading && <div data-testid="grid-loading">Loading websites...</div>}
      {isError && <div data-testid="grid-error">{error}</div>}
      {websites?.map((website: any) => (
        <div key={website.id} data-testid={`website-${website.id}`}>
          <span>{website.title}</span>
          <button onClick={() => onVisitWebsite?.(website)}>Visit</button>
          {website.tags?.map((tag: string) => (
            <button key={tag} onClick={() => onTagClick?.(tag)}>
              {tag}
            </button>
          ))}
        </div>
      ))}
      {hasMore && (
        <button data-testid="load-more" onClick={onLoadMore}>
          Load More
        </button>
      )}
    </div>
  ),
}));

// Mock store
const mockStoreData = {
  data: null as BrowsablePageData | null,
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
  filters: {
    entityId: null,
    categoryId: null,
    selectedTags: [],
    searchQuery: '',
    sortBy: 'createdAt' as any,
    sortOrder: 'desc' as any,
    currentPage: 1,
    itemsPerPage: 12,
  },
  meta: {
    isInitialized: false,
    lastUpdated: null,
    dataSource: 'mock' as const,
    retryCount: 0,
    urlSyncEnabled: true,
    lastUrlSync: null,
    isSyncingUrl: false,
  },
  actions: {
    setConfig: jest.fn(),
    loadData: jest.fn(),
    setCategory: jest.fn(),
    setTags: jest.fn(),
    setSorting: jest.fn(),
    setPage: jest.fn(),
    goToNextPage: jest.fn(),
    retryLoad: jest.fn(),
  },
};

const mockUseBrowsablePageStore = jest.mocked(useBrowsablePageStore);

describe('BrowsablePageLayout', () => {
  const mockConfig: BrowsablePageConfig = {
    pageType: 'collection',
    hero: {
      enabled: true,
      showBreadcrumbs: true,
      showStats: true,
    },
    filters: {
      categoryEnabled: true,
      tagEnabled: true,
      sortEnabled: true,
      showFilterCounts: true,
      searchPlaceholder: 'Search websites...',
      availableSorts: [
        {
          field: 'createdAt',
          label: 'Latest',
          order: 'desc',
          description: 'Most recently added',
        },
        {
          field: 'title',
          label: 'Name',
          order: 'asc', 
          description: 'Alphabetical order',
        },
      ],
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
      },
      related: {
        showSimilar: true,
        showChildren: true,
      },
    },
  };

  const mockData: BrowsablePageData = {
    entity: {
      id: 'test-collection',
      name: 'Test Collection',
      slug: 'test-collection',
      description: 'A test collection for unit testing',
      stats: {
        websiteCount: 25,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-08-16T00:00:00Z',
      },
    },
    websites: {
      items: [
        {
          id: 'website-1',
          title: 'Example Website',
          url: 'https://example.com',
          description: 'An example website',
          tags: ['example', 'test'],
          rating: 5,
          featured: false,
          hasAds: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      totalCount: 25,
      pagination: {
        currentPage: 1,
        itemsPerPage: 12,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      },
    },
    filterOptions: {
      categories: [
        { id: 'cat1', name: 'Category 1', slug: 'category-1', websiteCount: 10 },
        { id: 'cat2', name: 'Category 2', slug: 'category-2', websiteCount: 15 },
      ],
      tags: [
        { id: 'tag1', name: 'Tag 1', slug: 'tag-1', websiteCount: 8 },
        { id: 'tag2', name: 'Tag 2', slug: 'tag-2', websiteCount: 12 },
      ],
    },
    breadcrumbs: [
      { label: 'Home', href: '/', current: false },
      { label: 'Collections', href: '/collections', current: false },
      { label: 'Test Collection', href: '/collections/test-collection', current: true },
    ],
  };

  const defaultProps: BrowsablePageLayoutProps = {
    config: mockConfig,
    entitySlug: 'test-collection',
    onVisitWebsite: jest.fn(),
    onTagClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBrowsablePageStore.mockReturnValue(mockStoreData);
  });

  describe('Basic Rendering', () => {
    test('renders layout with default configuration', () => {
      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(mockStoreData.actions.setConfig).toHaveBeenCalledWith(mockConfig);
      expect(mockStoreData.actions.loadData).toHaveBeenCalledWith('test-collection');
    });

    test('applies custom className', () => {
      const { container } = render(
        <BrowsablePageLayout {...defaultProps} className="custom-layout" />
      );

      const layoutContainer = container.firstChild as HTMLElement;
      expect(layoutContainer).toHaveClass('custom-layout');
    });

    test('renders without entitySlug', () => {
      const propsWithoutSlug = { ...defaultProps, entitySlug: undefined };
      render(<BrowsablePageLayout {...propsWithoutSlug} />);

      expect(mockStoreData.actions.setConfig).toHaveBeenCalledWith(mockConfig);
      expect(mockStoreData.actions.loadData).not.toHaveBeenCalled();
    });
  });

  describe('Configuration-driven Rendering', () => {
    test('renders PageHeader when hero is enabled', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('page-header')).toBeInTheDocument();
      expect(screen.getByTestId('page-type')).toHaveTextContent('collection');
      expect(screen.getByTestId('page-title')).toHaveTextContent('Test Collection');
      expect(screen.getByTestId('page-description')).toHaveTextContent('A test collection for unit testing');
      expect(screen.getByTestId('page-stats')).toHaveTextContent('25 个网站');
    });

    test('hides PageHeader when hero is disabled', () => {
      const configWithoutHero = {
        ...mockConfig,
        hero: { ...mockConfig.hero, enabled: false },
      };

      render(<BrowsablePageLayout {...defaultProps} config={configWithoutHero} />);

      expect(screen.queryByTestId('page-header')).not.toBeInTheDocument();
    });

    test('renders FilterTabs when filters are enabled', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('filter-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('filter-type')).toHaveTextContent('category');
    });

    test('renders SortDropdown when sorting is enabled', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    });

    test('hides filter controls when neither filtering nor sorting enabled', () => {
      const configWithoutFilters = {
        ...mockConfig,
        filters: {
          ...mockConfig.filters,
          categoryEnabled: false,
          tagEnabled: false,
          sortEnabled: false,
        },
        features: {
          ...mockConfig.features,
          enableSorting: false,
        },
      };

      render(<BrowsablePageLayout {...defaultProps} config={configWithoutFilters} />);

      expect(screen.queryByTestId('filter-tabs')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sort-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Page Type Conditional Rendering', () => {
    test('renders correctly for collection page type', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('page-type')).toHaveTextContent('collection');
    });

    test('renders correctly for category page type', () => {
      const categoryConfig = { ...mockConfig, pageType: 'category' as const };
      const categoryData = {
        ...mockData,
        entity: { ...mockData.entity, name: 'Development Category' },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: categoryData,
      });

      render(<BrowsablePageLayout {...defaultProps} config={categoryConfig} />);

      expect(screen.getByTestId('page-type')).toHaveTextContent('category');
      expect(screen.getByTestId('page-title')).toHaveTextContent('Development Category');
    });

    test('renders correctly for tag page type', () => {
      const tagConfig = { ...mockConfig, pageType: 'tag' as const };
      const tagData = {
        ...mockData,
        entity: { ...mockData.entity, name: 'React Tag' },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: tagData,
      });

      render(<BrowsablePageLayout {...defaultProps} config={tagConfig} />);

      expect(screen.getByTestId('page-type')).toHaveTextContent('tag');
      expect(screen.getByTestId('page-title')).toHaveTextContent('React Tag');
    });

    test('renders filter tabs with tag type when only tags enabled', () => {
      const tagOnlyConfig = {
        ...mockConfig,
        filters: {
          ...mockConfig.filters,
          categoryEnabled: false,
          tagEnabled: true,
        },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} config={tagOnlyConfig} />);

      expect(screen.getByTestId('filter-type')).toHaveTextContent('tag');
    });
  });

  describe('Props Passing and Event Handling', () => {
    test('passes onVisitWebsite to WebsiteGrid', async () => {
      const mockOnVisitWebsite = jest.fn();
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(
        <BrowsablePageLayout 
          {...defaultProps} 
          onVisitWebsite={mockOnVisitWebsite}
        />
      );

      const visitButton = screen.getByText('Visit');
      await userEvent.click(visitButton);

      expect(mockOnVisitWebsite).toHaveBeenCalledWith('website-1');
    });

    test('passes onTagClick to WebsiteGrid', async () => {
      const mockOnTagClick = jest.fn();
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(
        <BrowsablePageLayout 
          {...defaultProps} 
          onTagClick={mockOnTagClick}
        />
      );

      const tagButton = screen.getByText('example');
      await userEvent.click(tagButton);

      expect(mockOnTagClick).toHaveBeenCalledWith('example');
    });

    test('handles filter tab changes', async () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      const categoryFilter = screen.getByTestId('filter-tab-category-cat1');
      await userEvent.click(categoryFilter);

      expect(mockStoreData.actions.setCategory).toHaveBeenCalledWith('cat1');
      expect(mockStoreData.actions.setTags).toHaveBeenCalledWith([]);
    });

    test('handles sort changes', async () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      const sortSelect = screen.getByTestId('sort-select');
      await userEvent.selectOptions(sortSelect, 'title_asc');

      expect(mockStoreData.actions.setSorting).toHaveBeenCalledWith('title', 'asc');
    });

    test('handles pagination', async () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      const nextPageButton = screen.getByTestId('next-page');
      await userEvent.click(nextPageButton);

      expect(mockStoreData.actions.setPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Error Scenarios', () => {
    test('displays page-level error state', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        error: {
          ...mockStoreData.error,
          page: 'Failed to load collection data',
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByText('页面加载失败')).toBeInTheDocument();
      expect(screen.getByText('Failed to load collection data')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    test('handles retry on page error', async () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        error: {
          ...mockStoreData.error,
          page: 'Network error',
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      const retryButton = screen.getByText('重试');
      await userEvent.click(retryButton);

      expect(mockStoreData.actions.retryLoad).toHaveBeenCalled();
    });

    test('displays content error in WebsiteGrid', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
        error: {
          ...mockStoreData.error,
          content: 'Failed to load websites',
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('grid-error')).toHaveTextContent('Failed to load websites');
    });

    test('does not render PageHeader during page error', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        error: {
          ...mockStoreData.error,
          page: 'Page error',
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.queryByTestId('page-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('website-grid')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loading state in PageHeader', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
        loading: {
          ...mockStoreData.loading,
          page: true,
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('page-loading')).toHaveTextContent('Loading...');
    });

    test('shows loading state in FilterTabs', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
        loading: {
          ...mockStoreData.loading,
          filters: true,
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('filter-loading')).toHaveTextContent('Loading filters...');
    });

    test('shows loading state in SortDropdown', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
        loading: {
          ...mockStoreData.loading,
          page: true,
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('sort-loading')).toHaveTextContent('Loading sort...');
    });

    test('shows loading state in WebsiteGrid', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
        loading: {
          ...mockStoreData.loading,
          content: true,
        },
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('grid-loading')).toHaveTextContent('Loading websites...');
    });
  });

  describe('Ad Banner Rendering', () => {
    test('renders inline ad banners when enabled', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('ad-banner-above_content')).toBeInTheDocument();
      expect(screen.getByTestId('ad-banner-below_content')).toBeInTheDocument();
    });

    test('renders sidebar ad when sidebar enabled', () => {
      const configWithSidebar = {
        ...mockConfig,
        navigation: {
          ...mockConfig.navigation,
          sidebar: { enabled: true },
        },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} config={configWithSidebar} />);

      expect(screen.getByTestId('ad-banner-sidebar_primary')).toBeInTheDocument();
      
      // Inline ads should not be rendered when sidebar is enabled
      expect(screen.queryByTestId('ad-banner-above_content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ad-banner-below_content')).not.toBeInTheDocument();
    });

    test('hides ad banners when disabled', () => {
      const configWithoutAds = {
        ...mockConfig,
        features: { ...mockConfig.features, showAdBanner: false },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} config={configWithoutAds} />);

      expect(screen.queryByTestId('ad-banner-above_content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ad-banner-below_content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ad-banner-sidebar_primary')).not.toBeInTheDocument();
    });
  });

  describe('Pagination Rendering', () => {
    test('renders pagination when enabled', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      expect(screen.getByTestId('total-pages')).toHaveTextContent('3');
    });

    test('hides pagination when disabled', () => {
      const configWithoutPagination = {
        ...mockConfig,
        features: { ...mockConfig.features, enablePagination: false },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...defaultProps} config={configWithoutPagination} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    test('applies correct layout classes for sidebar layout', () => {
      const configWithSidebar = {
        ...mockConfig,
        navigation: {
          ...mockConfig.navigation,
          sidebar: { enabled: true },
        },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      const { container } = render(
        <BrowsablePageLayout {...defaultProps} config={configWithSidebar} />
      );

      const websiteGrid = screen.getByTestId('website-grid');
      expect(websiteGrid).toHaveClass('lg:grid-cols-2', 'xl:grid-cols-3');
    });

    test('applies correct spacing classes', () => {
      const { container } = render(<BrowsablePageLayout {...defaultProps} />);

      const layoutContainer = container.firstChild as HTMLElement;
      expect(layoutContainer).toHaveClass('space-y-8');
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('space-y-8');
    });
  });

  describe('Store Integration', () => {
    test('calls setConfig on mount', () => {
      render(<BrowsablePageLayout {...defaultProps} />);
      
      expect(mockStoreData.actions.setConfig).toHaveBeenCalledWith(mockConfig);
    });

    test('calls loadData when entitySlug provided and not initialized', () => {
      render(<BrowsablePageLayout {...defaultProps} />);
      
      expect(mockStoreData.actions.loadData).toHaveBeenCalledWith('test-collection');
    });

    test('does not call loadData when already initialized', () => {
      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        meta: { ...mockStoreData.meta, isInitialized: true },
      });

      render(<BrowsablePageLayout {...defaultProps} />);
      
      expect(mockStoreData.actions.loadData).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing entity data gracefully', () => {
      const dataWithoutEntity = {
        ...mockData,
        entity: {
          ...mockData.entity,
          name: '',
          description: undefined,
          stats: undefined,
        },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: dataWithoutEntity,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.getByTestId('page-title')).toHaveTextContent('');
      expect(screen.queryByTestId('page-description')).not.toBeInTheDocument();
      expect(screen.queryByTestId('page-stats')).not.toBeInTheDocument();
    });

    test('handles empty filter options', () => {
      const dataWithoutFilters = {
        ...mockData,
        filterOptions: {
          categories: [],
          tags: [],
        },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: dataWithoutFilters,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      // Should only show "All" filter tab
      expect(screen.getByTestId('filter-tab-all')).toBeInTheDocument();
      expect(screen.queryByTestId('filter-tab-category-cat1')).not.toBeInTheDocument();
    });

    test('handles missing pagination data', () => {
      const dataWithoutPagination = {
        ...mockData,
        websites: {
          ...mockData.websites,
          pagination: undefined as any,
        },
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: dataWithoutPagination,
      });

      render(<BrowsablePageLayout {...defaultProps} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    test('handles missing callback functions gracefully', () => {
      const propsWithoutCallbacks = {
        config: mockConfig,
        entitySlug: 'test-collection',
      };

      mockUseBrowsablePageStore.mockReturnValue({
        ...mockStoreData,
        data: mockData,
      });

      render(<BrowsablePageLayout {...propsWithoutCallbacks} />);

      // Should render without errors
      expect(screen.getByTestId('website-grid')).toBeInTheDocument();
    });
  });
});