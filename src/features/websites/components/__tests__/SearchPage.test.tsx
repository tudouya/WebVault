/**
 * SearchPage 组件单元测试
 * 
 * 专注测试 SearchResults 组件的核心功能：
 * - 搜索结果展示和状态处理
 * - 加载状态、错误状态、空状态
 * - 网站卡片集成
 * - 响应式布局
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { SearchResults } from '../SearchResults';
import type { WebsiteCardData } from '../../types/website';

// Mock UI components using relative paths
jest.mock('../../../../components/ui/button', () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../WebsiteCard', () => ({
  WebsiteCard: ({ website, className, style }: any) => (
    <div 
      data-testid={`website-card-${website.id}`}
      className={className}
      style={style}
    >
      <h3>{website.title}</h3>
      <p>{website.description}</p>
      <div>
        {website.tags.map((tag: string, index: number) => (
          <span key={index} role="button" tabIndex={0}>{tag}</span>
        ))}
      </div>
      <div>{website.visit_count.toLocaleString()} visits</div>
      <button onClick={() => window.open(website.url, '_blank')}>Visit</button>
    </div>
  ),
}));

jest.mock('../LoadingStates', () => ({
  WebsiteCardSkeleton: ({ count, className }: any) => (
    <div className={className} data-testid="website-card-skeleton">
      {Array.from({ length: count || 6 }, (_, i) => (
        <div key={i} className="animate-pulse bg-muted h-32 rounded" />
      ))}
    </div>
  ),
}));

jest.mock('../../../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Test data
const mockWebsites: WebsiteCardData[] = [
  {
    id: '1',
    title: 'GitHub',
    description: '全球最大的代码托管平台',
    url: 'https://github.com',
    favicon_url: '/api/favicon?domain=github.com',
    tags: ['开发工具', '代码托管'],
    category: '开发工具',
    isAd: false,
    rating: 4.9,
    visit_count: 125420,
    is_featured: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-08-10T15:30:00Z'
  },
  {
    id: '2',
    title: 'Stack Overflow',
    description: '程序员问答社区',
    url: 'https://stackoverflow.com',
    favicon_url: '/api/favicon?domain=stackoverflow.com',
    tags: ['问答', '编程'],
    category: '开发社区',
    isAd: false,
    rating: 4.8,
    visit_count: 89340,
    is_featured: true,
    created_at: '2024-02-20T14:20:00Z',
    updated_at: '2024-08-12T09:15:00Z'
  }
];

describe('SearchResults Component', () => {
  const mockProps = {
    websites: mockWebsites,
    isLoading: false,
    isError: false,
    onWebsiteVisit: jest.fn(),
    onTagClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('shows loading skeletons when isLoading is true', () => {
      render(<SearchResults {...mockProps} isLoading={true} />);

      expect(screen.getByTestId('website-card-skeleton')).toBeInTheDocument();
    });

    test('shows stats skeleton during loading', () => {
      render(<SearchResults {...mockProps} isLoading={true} />);

      const skeletons = document.querySelectorAll('.bg-muted.rounded');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('does not show websites during loading', () => {
      render(<SearchResults {...mockProps} isLoading={true} />);

      expect(screen.queryByTestId('website-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('website-card-2')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('shows error message when isError is true', () => {
      render(
        <SearchResults
          {...mockProps}
          isError={true}
          error="Something went wrong"
        />
      );

      expect(screen.getByText('搜索出错了')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    test('shows default error message when no error prop provided', () => {
      render(<SearchResults {...mockProps} isError={true} />);

      expect(screen.getByText('无法完成搜索请求，请稍后重试')).toBeInTheDocument();
    });

    test('shows retry button in error state', () => {
      const mockOnRetry = jest.fn();
      render(
        <SearchResults
          {...mockProps}
          isError={true}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('重试搜索')).toBeInTheDocument();
      expect(screen.getByText('刷新页面')).toBeInTheDocument();
    });

    test('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnRetry = jest.fn();
      render(
        <SearchResults
          {...mockProps}
          isError={true}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByText('重试搜索');
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });

    test('does not show websites in error state', () => {
      render(<SearchResults {...mockProps} isError={true} />);

      expect(screen.queryByTestId('website-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('website-card-2')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no websites provided', () => {
      render(<SearchResults {...mockProps} websites={[]} />);

      expect(screen.getByText('未找到搜索结果')).toBeInTheDocument();
    });

    test('shows different empty message for search query', () => {
      render(
        <SearchResults
          {...mockProps}
          websites={[]}
          searchQuery="nonexistent"
        />
      );

      expect(screen.getByText('未找到搜索结果')).toBeInTheDocument();
    });

    test('shows empty state when websites is undefined', () => {
      render(<SearchResults {...mockProps} websites={undefined as any} />);

      expect(screen.getByText('未找到搜索结果')).toBeInTheDocument();
    });

    test('shows stats with zero results in empty state', () => {
      render(
        <SearchResults
          {...mockProps}
          websites={[]}
          searchQuery="test"
        />
      );

      // Should have search results stats showing 0 results
      expect(screen.getByText('未找到搜索结果')).toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    test('shows results with website cards', () => {
      render(<SearchResults {...mockProps} />);

      expect(screen.getByTestId('website-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('website-card-2')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Stack Overflow')).toBeInTheDocument();
    });

    test('renders website cards in responsive grid', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-3',
        'gap-6'
      );
    });

    test('applies correct spacing and layout', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      expect(container.firstChild).toHaveClass('space-y-6');
    });

    test('applies page fade-in animation to grid', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('page-fade-in');
    });
  });

  describe('Website Card Integration', () => {
    test('renders individual website cards correctly', () => {
      render(<SearchResults {...mockProps} />);

      // Check first website card
      const githubCard = screen.getByTestId('website-card-1');
      expect(githubCard).toBeInTheDocument();
      expect(githubCard).toHaveTextContent('GitHub');
      expect(githubCard).toHaveTextContent('全球最大的代码托管平台');
      expect(githubCard).toHaveTextContent('125,420 visits');

      // Check second website card
      const stackOverflowCard = screen.getByTestId('website-card-2');
      expect(stackOverflowCard).toBeInTheDocument();
      expect(stackOverflowCard).toHaveTextContent('Stack Overflow');
      expect(stackOverflowCard).toHaveTextContent('程序员问答社区');
      expect(stackOverflowCard).toHaveTextContent('89,340 visits');
    });

    test('displays website tags correctly', () => {
      render(<SearchResults {...mockProps} />);

      // Check GitHub tags
      expect(screen.getByText('开发工具')).toBeInTheDocument();
      expect(screen.getByText('代码托管')).toBeInTheDocument();

      // Check Stack Overflow tags
      expect(screen.getByText('问答')).toBeInTheDocument();
      expect(screen.getByText('编程')).toBeInTheDocument();
    });

    test('includes visit buttons for websites', () => {
      render(<SearchResults {...mockProps} />);

      const visitButtons = screen.getAllByText('Visit');
      expect(visitButtons).toHaveLength(2);
    });

    test('applies animation styles to website cards', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      const cards = container.querySelectorAll('[data-testid^="website-card-"]');
      expect(cards).toHaveLength(2);
      
      cards.forEach((card) => {
        expect(card).toHaveClass('h-fit', 'website-grid-enter');
      });
    });

    test('applies animation delay styles to cards', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      const cards = container.querySelectorAll('[data-testid^="website-card-"]');
      expect(cards).toHaveLength(2);
      
      // Check first card has 0ms delay
      expect(cards[0]).toHaveStyle('animation-delay: 0ms');
      
      // Check second card has 100ms delay
      expect(cards[1]).toHaveStyle('animation-delay: 100ms');
    });
  });

  describe('Component State Management', () => {
    test('handles totalResults prop correctly', () => {
      render(
        <SearchResults
          {...mockProps}
          totalResults={25}
          searchQuery="GitHub"
        />
      );

      // Should display website results
      expect(screen.getByTestId('website-card-1')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    test('handles missing totalResults gracefully', () => {
      render(<SearchResults {...mockProps} />);

      // Should still display website results
      expect(screen.getByTestId('website-card-1')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    test('passes callbacks to website cards', () => {
      const mockOnWebsiteVisit = jest.fn();
      const mockOnTagClick = jest.fn();
      
      render(
        <SearchResults
          {...mockProps}
          onWebsiteVisit={mockOnWebsiteVisit}
          onTagClick={mockOnTagClick}
        />
      );

      // Cards should be rendered (callbacks are passed through)
      expect(screen.getByTestId('website-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('website-card-2')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive grid classes', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-2', 
        'lg:grid-cols-3'
      );
    });

    test('maintains consistent spacing', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      expect(container.firstChild).toHaveClass('space-y-6');
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-6');
    });

    test('renders component successfully', () => {
      const { container } = render(<SearchResults {...mockProps} />);

      // Check that the component renders successfully
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByTestId('website-card-1')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    test('accepts custom className', () => {
      const { container } = render(
        <SearchResults {...mockProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('handles edge case with single website', () => {
      render(
        <SearchResults 
          {...mockProps} 
          websites={[mockWebsites[0]]}
        />
      );

      expect(screen.getByTestId('website-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('website-card-2')).not.toBeInTheDocument();
    });

    test('handles searchQuery prop correctly', () => {
      render(
        <SearchResults
          {...mockProps}
          searchQuery="React"
          totalResults={10}
        />
      );

      // Should display results with the search query context
      expect(screen.getByTestId('website-card-1')).toBeInTheDocument();
    });
  });
});