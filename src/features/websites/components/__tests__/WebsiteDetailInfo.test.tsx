import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WebsiteDetailInfo } from '../WebsiteDetailInfo';
import type { WebsiteDetailData } from '../../types/detail';

// Mock data for testing
const mockWebsiteDetail: WebsiteDetailData = {
  id: '1',
  title: 'Test Website',
  description: 'A test website for demonstration',
  url: 'https://example.com',
  favicon_url: 'https://example.com/favicon.ico',
  tags: ['Technology', 'Web Development', 'Tools'],
  category_id: 'cat-1',
  status: 'active',
  visitCount: 1250,
  rating: 4.5,
  is_featured: false,
  is_public: true,
  isAd: false,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-20T14:45:00Z',
  language: 'English',
  popularity_score: 8.5,
  last_checked_at: '2024-01-20T08:00:00Z',
  is_accessible: true,
  publisher: {
    id: 'pub-1',
    name: 'John Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Web developer and technology enthusiast',
    website_url: 'https://johndoe.com',
    published_count: 15,
    joined_at: '2023-06-01T00:00:00Z'
  },
  category: {
    id: 'cat-1',
    name: 'Technology',
    description: 'Technology related websites',
    slug: 'technology',
    parentId: null,
    icon_url: '',
    color: '#3b82f6',
    status: 'active',
    sort_order: 1,
    website_count: 50,
    is_expanded: false,
    is_visible: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  stats: {
    total_visits: 1250,
    monthly_visits: 350,
    weekly_visits: 85,
    daily_visits: 12,
    bounce_rate: 35.5,
    avg_session_duration: 180
  },
  features: ['Real-time collaboration', 'API integration', 'Mobile responsive'],
  pricing: {
    is_free: false,
    has_paid_plans: true,
    starting_price: '9.99',
    currency: '$'
  }
};

const mockWebsiteDetailMinimal: WebsiteDetailData = {
  id: '2',
  title: 'Minimal Website',
  description: 'A minimal test website',
  url: 'https://minimal.example.com',
  tags: [],
  category_id: 'cat-2',
  status: 'active',
  visitCount: 0,
  rating: 0,
  is_featured: false,
  is_public: true,
  isAd: false,
  created_at: '2024-01-10T00:00:00Z',
  updated_at: '2024-01-10T00:00:00Z',
  is_accessible: false
};

describe('WebsiteDetailInfo', () => {
  it('renders publisher information correctly', () => {
    render(<WebsiteDetailInfo website={mockWebsiteDetail} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Web developer and technology enthusiast')).toBeInTheDocument();
    expect(screen.getByText(/Published on/)).toBeInTheDocument();
  });

  it('displays website information correctly', () => {
    render(<WebsiteDetailInfo website={mockWebsiteDetail} />);
    
    expect(screen.getByText('Website Information')).toBeInTheDocument();
    expect(screen.getAllByText('Technology')).toHaveLength(2); // In category and tags
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Accessible')).toBeInTheDocument();
    expect(screen.getByText('8.5/10')).toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(<WebsiteDetailInfo website={mockWebsiteDetail} />);
    
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getAllByText('Technology')).toHaveLength(2); // In category and tags
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('displays statistics correctly', () => {
    render(<WebsiteDetailInfo website={mockWebsiteDetail} />);
    
    expect(screen.getByText('Visit Statistics')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument(); // total visits formatted
    expect(screen.getByText('350')).toBeInTheDocument(); // monthly visits
    expect(screen.getByText('3m')).toBeInTheDocument(); // avg session duration
    expect(screen.getByText('35.5%')).toBeInTheDocument(); // bounce rate
  });

  it('shows features when available', () => {
    render(<WebsiteDetailInfo website={mockWebsiteDetail} />);
    
    expect(screen.getByText('Key Features')).toBeInTheDocument();
    expect(screen.getByText('Real-time collaboration')).toBeInTheDocument();
    expect(screen.getByText('API integration')).toBeInTheDocument();
    expect(screen.getByText('Mobile responsive')).toBeInTheDocument();
  });

  it('displays pricing information correctly', () => {
    render(<WebsiteDetailInfo website={mockWebsiteDetail} />);
    
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Premium Plans Available')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    render(<WebsiteDetailInfo website={mockWebsiteDetailMinimal} />);
    
    // Should still render basic structure
    expect(screen.getByText('Website Information')).toBeInTheDocument();
    expect(screen.getByText('Not Accessible')).toBeInTheDocument();
    
    // Should not render optional sections
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    expect(screen.queryByText('Visit Statistics')).not.toBeInTheDocument();
    expect(screen.queryByText('Key Features')).not.toBeInTheDocument();
    expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
  });

  it('calls tag click handler when tag is clicked', () => {
    const mockTagClick = jest.fn();
    render(<WebsiteDetailInfo website={mockWebsiteDetail} onTagClick={mockTagClick} />);
    
    // Find the tag in the tags section (has tag-pill class)
    const technologyTags = screen.getAllByText('Technology');
    const technologyTagPill = technologyTags.find(el => el.classList.contains('tag-pill'));
    fireEvent.click(technologyTagPill!);
    
    expect(mockTagClick).toHaveBeenCalledWith('Technology');
  });

  it('calls category click handler when category is clicked', () => {
    const mockCategoryClick = jest.fn();
    render(<WebsiteDetailInfo website={mockWebsiteDetail} onCategoryClick={mockCategoryClick} />);
    
    // Find the category tag (has category-tag class)
    const technologyTags = screen.getAllByText('Technology');
    const categoryTag = technologyTags.find(el => el.classList.contains('category-tag'));
    fireEvent.click(categoryTag!);
    
    expect(mockCategoryClick).toHaveBeenCalledWith(mockWebsiteDetail.category);
  });

  it('applies custom className', () => {
    const { container } = render(
      <WebsiteDetailInfo website={mockWebsiteDetail} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('formats large numbers correctly', () => {
    const websiteWithLargeStats = {
      ...mockWebsiteDetail,
      stats: {
        ...mockWebsiteDetail.stats!,
        total_visits: 1500000,
        monthly_visits: 250000
      }
    };
    
    render(<WebsiteDetailInfo website={websiteWithLargeStats} />);
    
    expect(screen.getByText('1.5M')).toBeInTheDocument();
    expect(screen.getByText('250.0K')).toBeInTheDocument();
  });

  it('renders with default publisher when publisher is missing', () => {
    const websiteWithoutPublisher = {
      ...mockWebsiteDetailMinimal,
      publisher: undefined
    };
    
    render(<WebsiteDetailInfo website={websiteWithoutPublisher} />);
    
    expect(screen.getByText('WebVault')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });
});