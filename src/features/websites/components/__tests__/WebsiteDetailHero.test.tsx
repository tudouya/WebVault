import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebsiteDetailHero } from '../WebsiteDetailHero';
import type { WebsiteDetailData } from '../../types/detail';

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

// 创建测试用的网站数据
const createMockWebsite = (overrides: Partial<WebsiteDetailData> = {}): WebsiteDetailData => ({
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

describe('WebsiteDetailHero', () => {
  const mockOnVisit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders website title correctly', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Website');
  });

  it('renders website description', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    expect(screen.getByText('This is a test website description')).toBeInTheDocument();
  });

  it('renders clickable website URL', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const urlButton = screen.getByRole('button', { name: /访问.*https:\/\/example\.com/i });
    expect(urlButton).toBeInTheDocument();
    expect(urlButton).toHaveTextContent('https://example.com');
  });

  it('renders visit website button', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
    expect(visitButton).toBeInTheDocument();
    expect(visitButton).toHaveTextContent('访问网站');
  });

  it('calls onVisit and opens window when visit button is clicked', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
    fireEvent.click(visitButton);
    
    expect(mockOnVisit).toHaveBeenCalledWith('test-website-1', 'https://example.com');
    expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('calls onVisit and opens window when URL is clicked', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const urlButton = screen.getByRole('button', { name: /访问.*https:\/\/example\.com/i });
    fireEvent.click(urlButton);
    
    expect(mockOnVisit).toHaveBeenCalledWith('test-website-1', 'https://example.com');
    expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('renders website favicon when available', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const favicon = screen.getByAltText('Test Website icon');
    expect(favicon).toBeInTheDocument();
    expect(favicon).toHaveAttribute('src', 'https://example.com/favicon.ico');
  });

  it('renders cover image when available', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const coverImage = screen.getByRole('img', { name: /test website screenshot/i });
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'https://example.com/screenshot.png');
  });

  it('handles missing favicon gracefully', () => {
    const website = createMockWebsite({ favicon_url: undefined });
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    // Should show Globe icon instead
    const iconContainer = screen.getByRole('img', { name: /test website icon/i });
    expect(iconContainer).toBeInTheDocument();
  });

  it('handles missing cover image gracefully', () => {
    const website = createMockWebsite({ screenshot_url: undefined });
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    // Cover image should not be rendered
    expect(screen.queryByRole('img', { name: /test website screenshot/i })).not.toBeInTheDocument();
  });

  it('shows accessibility warning when website is not accessible', () => {
    const website = createMockWebsite({ is_accessible: false });
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    expect(screen.getByText('网站可能存在无障碍访问问题')).toBeInTheDocument();
  });

  it('does not show accessibility warning when website is accessible', () => {
    const website = createMockWebsite({ is_accessible: true });
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    expect(screen.queryByText('网站可能存在无障碍访问问题')).not.toBeInTheDocument();
  });

  it('renders extended content when available', () => {
    const website = createMockWebsite({ 
      content: 'This is extended content about the website' 
    });
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    expect(screen.getByText('This is extended content about the website')).toBeInTheDocument();
  });

  it('handles missing description gracefully', () => {
    const website = createMockWebsite({ description: undefined });
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    // Should still render other elements
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Website');
    expect(screen.getByRole('button', { name: /访问.*test website.*网站/i })).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const website = createMockWebsite();
    const { container } = render(
      <WebsiteDetailHero website={website} onVisit={mockOnVisit} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles favicon loading error gracefully', async () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const favicon = screen.getByAltText('Test Website icon');
    
    // Simulate image load error
    fireEvent.error(favicon);
    
    await waitFor(() => {
      // Should still show the icon container
      const iconContainer = screen.getByRole('img', { name: /test website icon/i });
      expect(iconContainer).toBeInTheDocument();
    });
  });

  it('handles cover image loading error gracefully', async () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    const coverImage = screen.getByRole('img', { name: /test website screenshot/i });
    
    // Simulate image load error
    fireEvent.error(coverImage);
    
    await waitFor(() => {
      // Cover image should be replaced with placeholder
      expect(screen.queryByRole('img', { name: /test website screenshot/i })).not.toBeInTheDocument();
      expect(screen.getByText('Screenshot not available')).toBeInTheDocument();
      expect(screen.getByText('Visit the website to see the current content')).toBeInTheDocument();
    });
  });

  it('shows loading indicator for cover image', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    // Cover image should initially show loading state
    const coverImage = screen.getByRole('img', { name: /test website screenshot/i });
    expect(coverImage).toHaveClass('opacity-0'); // Initially hidden while loading
  });

  it('shows loading indicator for favicon', () => {
    const website = createMockWebsite();
    render(<WebsiteDetailHero website={website} onVisit={mockOnVisit} />);
    
    // Favicon should initially show loading state
    const favicon = screen.getByRole('img', { name: /test website icon/i }).querySelector('img');
    expect(favicon).toHaveClass('opacity-0'); // Initially hidden while loading
  });
});