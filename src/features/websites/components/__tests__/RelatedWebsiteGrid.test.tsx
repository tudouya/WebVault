import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RelatedWebsiteGrid } from '../RelatedWebsiteGrid';
import type { WebsiteCardData } from '../../types/website';

// Mock the WebsiteCard component
jest.mock('../WebsiteCard', () => ({
  WebsiteCard: ({ website, onVisit, onTagClick, className, style }: any) => (
    <div 
      data-testid={`website-card-${website.id}`}
      className={className}
      style={style}
      role="gridcell"
    >
      <div data-testid="website-title">{website.title}</div>
      <div data-testid="website-url">{website.url}</div>
      {website.tags?.map((tag: string, index: number) => (
        <button
          key={index}
          data-testid={`tag-${tag}`}
          onClick={() => onTagClick?.(tag)}
        >
          {tag}
        </button>
      ))}
      <button
        data-testid="visit-button"
        onClick={() => onVisit?.(website)}
      >
        Visit
      </button>
    </div>
  )
}));

// 创建测试用的网站数据
const createMockWebsite = (overrides: Partial<WebsiteCardData> = {}): WebsiteCardData => ({
  id: 'test-website-1',
  title: 'Test Website',
  url: 'https://example.com',
  description: 'This is a test website description',
  favicon_url: 'https://example.com/favicon.ico',
  screenshot_url: 'https://example.com/screenshot.png',
  is_accessible: true,
  category_id: 'cat-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  visitCount: 1000,
  tags: ['test', 'example'],
  status: 'active',
  isAd: false,
  is_featured: false,
  is_public: true,
  ...overrides
});

// 创建多个测试网站数据
const createMockWebsiteList = (count: number): WebsiteCardData[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockWebsite({
      id: `website-${index + 1}`,
      title: `Website ${index + 1}`,
      url: `https://example${index + 1}.com`,
      tags: [`tag${index + 1}`, 'common-tag']
    })
  );
};

describe('RelatedWebsiteGrid', () => {
  const mockOnVisitWebsite = jest.fn();
  const mockOnTagClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders related websites correctly', () => {
    const relatedWebsites = createMockWebsiteList(3);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(screen.getByRole('heading', { name: '更多产品' })).toBeInTheDocument();
    expect(screen.getByTestId('website-card-website-1')).toBeInTheDocument();
    expect(screen.getByTestId('website-card-website-2')).toBeInTheDocument();
    expect(screen.getByTestId('website-card-website-3')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    const relatedWebsites = createMockWebsiteList(2);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        title="推荐网站"
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(screen.getByRole('heading', { name: '推荐网站' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '更多产品' })).not.toBeInTheDocument();
  });

  it('hides title when showTitle is false', () => {
    const relatedWebsites = createMockWebsiteList(2);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        showTitle={false}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(screen.queryByRole('heading', { name: '更多产品' })).not.toBeInTheDocument();
    expect(screen.getByTestId('website-card-website-1')).toBeInTheDocument();
  });

  it('limits display to maxItems count', () => {
    const relatedWebsites = createMockWebsiteList(10);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        maxItems={3}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    // Should only display first 3 websites
    expect(screen.getByTestId('website-card-website-1')).toBeInTheDocument();
    expect(screen.getByTestId('website-card-website-2')).toBeInTheDocument();
    expect(screen.getByTestId('website-card-website-3')).toBeInTheDocument();
    expect(screen.queryByTestId('website-card-website-4')).not.toBeInTheDocument();

    // Should show count indicator
    expect(screen.getByText('显示 3 / 10')).toBeInTheDocument();
    
    // Should show "more items" message
    expect(screen.getByText('还有 7 个相关网站...')).toBeInTheDocument();
  });

  it('uses default maxItems when not specified', () => {
    const relatedWebsites = createMockWebsiteList(8);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    // Default maxItems is 6
    expect(screen.getByTestId('website-card-website-1')).toBeInTheDocument();
    expect(screen.getByTestId('website-card-website-6')).toBeInTheDocument();
    expect(screen.queryByTestId('website-card-website-7')).not.toBeInTheDocument();
    
    expect(screen.getByText('显示 6 / 8')).toBeInTheDocument();
    expect(screen.getByText('还有 2 个相关网站...')).toBeInTheDocument();
  });

  it('does not show count indicator when all items are displayed', () => {
    const relatedWebsites = createMockWebsiteList(3);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        maxItems={6}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(screen.queryByText(/显示.*\//)).not.toBeInTheDocument();
    expect(screen.queryByText(/还有.*个相关网站/)).not.toBeInTheDocument();
  });

  it('returns null when no related websites provided', () => {
    const { container } = render(
      <RelatedWebsiteGrid
        relatedWebsites={[]}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when relatedWebsites is null or undefined', () => {
    const { container: container1 } = render(
      <RelatedWebsiteGrid
        relatedWebsites={null as any}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const { container: container2 } = render(
      <RelatedWebsiteGrid
        relatedWebsites={undefined as any}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(container1.firstChild).toBeNull();
    expect(container2.firstChild).toBeNull();
  });

  it('calls onVisitWebsite when website card visit button is clicked', () => {
    const relatedWebsites = createMockWebsiteList(2);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const visitButton = screen.getAllByTestId('visit-button')[0];
    fireEvent.click(visitButton);

    expect(mockOnVisitWebsite).toHaveBeenCalledWith(relatedWebsites[0]);
  });

  it('calls onTagClick when tag is clicked', () => {
    const relatedWebsites = createMockWebsiteList(2);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const tagButton = screen.getByTestId('tag-tag1');
    fireEvent.click(tagButton);

    expect(mockOnTagClick).toHaveBeenCalledWith('tag1');
  });

  it('handles missing onVisitWebsite callback gracefully', () => {
    const relatedWebsites = createMockWebsiteList(1);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onTagClick={mockOnTagClick}
      />
    );

    const visitButton = screen.getByTestId('visit-button');
    expect(() => fireEvent.click(visitButton)).not.toThrow();
  });

  it('handles missing onTagClick callback gracefully', () => {
    const relatedWebsites = createMockWebsiteList(1);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
      />
    );

    const tagButton = screen.getByTestId('tag-tag1');
    expect(() => fireEvent.click(tagButton)).not.toThrow();
  });

  it('applies custom className', () => {
    const relatedWebsites = createMockWebsiteList(1);
    const { container } = render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        className="custom-class"
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with proper ARIA attributes', () => {
    const relatedWebsites = createMockWebsiteList(3);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'related-websites-heading');

    const heading = screen.getByRole('heading', { name: '更多产品' });
    expect(heading).toHaveAttribute('id', 'related-websites-heading');
    expect(heading).toHaveAttribute('aria-level', '2');

    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-label', '相关网站推荐');
  });

  it('applies staggered animation delay to website cards', () => {
    const relatedWebsites = createMockWebsiteList(3);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const card1 = screen.getByTestId('website-card-website-1');
    const card2 = screen.getByTestId('website-card-website-2');
    const card3 = screen.getByTestId('website-card-website-3');

    expect(card1).toHaveStyle('animation-delay: 0ms');
    expect(card2).toHaveStyle('animation-delay: 100ms');
    expect(card3).toHaveStyle('animation-delay: 200ms');
  });

  it('limits animation delay to maximum of 500ms', () => {
    const relatedWebsites = createMockWebsiteList(10);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const card6 = screen.getByTestId('website-card-website-6');
    expect(card6).toHaveStyle('animation-delay: 500ms');
  });

  it('renders proper grid layout classes', () => {
    const relatedWebsites = createMockWebsiteList(2);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const grid = screen.getByRole('grid');
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
  });

  it('shows status indicators with proper ARIA attributes', () => {
    const relatedWebsites = createMockWebsiteList(10);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        maxItems={3}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const countStatus = screen.getByRole('status', { name: '显示 3 个，共 10 个相关网站' });
    expect(countStatus).toHaveAttribute('aria-live', 'polite');

    const allStatuses = screen.getAllByRole('status');
    const moreItemsStatus = allStatuses.find(el => 
      el.textContent?.includes('还有') && el.textContent?.includes('个相关网站')
    );
    expect(moreItemsStatus).toHaveAttribute('aria-live', 'polite');
  });

  it('handles websites without tags gracefully', () => {
    const relatedWebsites = [
      createMockWebsite({
        id: 'website-no-tags',
        title: 'Website Without Tags',
        tags: undefined
      })
    ];
    
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(screen.getByTestId('website-card-website-no-tags')).toBeInTheDocument();
  });

  it('renders contentinfo footer when more items exist', () => {
    const relatedWebsites = createMockWebsiteList(8);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        maxItems={5}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveAttribute('aria-label', '更多相关网站提示');
    expect(footer).toBeInTheDocument();
  });

  it('does not render footer when all items are displayed', () => {
    const relatedWebsites = createMockWebsiteList(3);
    render(
      <RelatedWebsiteGrid
        relatedWebsites={relatedWebsites}
        maxItems={6}
        onVisitWebsite={mockOnVisitWebsite}
        onTagClick={mockOnTagClick}
      />
    );

    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});