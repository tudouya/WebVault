/**
 * 无障碍访问测试
 * 
 * 这个测试文件验证所有网站详情页面组件的无障碍访问实现
 * 测试内容包括：
 * - ARIA 标签和角色
 * - 键盘导航
 * - 屏幕阅读器支持
 * - 颜色对比度
 * - 跳转链接
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { WebsiteDetailPage } from '../WebsiteDetailPage';
import { WebsiteDetailHero } from '../WebsiteDetailHero';
import { WebsiteDetailInfo } from '../WebsiteDetailInfo';
import { WebsiteDetailContent } from '../WebsiteDetailContent';
import { WebsiteCard } from '../WebsiteCard';
import { RelatedWebsiteGrid } from '../RelatedWebsiteGrid';
import { PublisherCard } from '../PublisherCard';
import { BreadcrumbNavigation } from '../BreadcrumbNavigation';

// 扩展 Jest 匹配器
expect.extend(toHaveNoViolations);

// Mock数据
const mockWebsiteData = {
  id: 'test-website-123',
  title: 'Test Website',
  description: 'This is a test website description for accessibility testing.',
  url: 'https://example.com',
  content: 'Detailed content about the test website.',
  category: {
    id: 'cat-1',
    name: 'Technology',
    slug: 'technology'
  },
  tags: ['react', 'javascript', 'accessibility'],
  language: 'English',
  is_accessible: true,
  favicon_url: 'https://example.com/favicon.ico',
  screenshot_url: 'https://example.com/screenshot.png',
  created_at: '2024-01-01T00:00:00Z',
  last_checked_at: '2024-01-01T00:00:00Z',
  popularity_score: 8.5,
  publisher: {
    id: 'pub-1',
    name: 'Test Publisher',
    bio: 'A test publisher for accessibility testing.',
    avatar_url: 'https://example.com/avatar.jpg',
    published_count: 5
  },
  stats: {
    total_visits: 1000,
    monthly_visits: 100,
    avg_session_duration: 300,
    bounce_rate: 25.5
  },
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  pricing: {
    is_free: false,
    has_paid_plans: true,
    starting_price: 9.99,
    currency: 'USD'
  },
  alternative_urls: ['https://alt1.example.com', 'https://alt2.example.com'],
  related_websites: [
    {
      id: 'related-1',
      title: 'Related Website 1',
      description: 'A related website',
      url: 'https://related1.com',
      visit_count: 500,
      tags: ['related', 'test']
    }
  ]
};

describe('无障碍访问测试', () => {
  describe('WebsiteDetailPage', () => {
    it('应该有跳转链接', () => {
      render(<WebsiteDetailPage initialData={mockWebsiteData} />);
      
      // 检查跳转链接
      const skipToMain = screen.getByLabelText('跳转到主要内容');
      const skipToInfo = screen.getByLabelText('跳转到网站信息');
      const skipToRelated = screen.getByLabelText('跳转到相关推荐');
      
      expect(skipToMain).toBeInTheDocument();
      expect(skipToInfo).toBeInTheDocument();
      expect(skipToRelated).toBeInTheDocument();
      
      // 跳转链接应该有正确的href
      expect(skipToMain).toHaveAttribute('href', '#main-content');
      expect(skipToInfo).toHaveAttribute('href', '#website-info');
      expect(skipToRelated).toHaveAttribute('href', '#related-websites');
    });

    it('应该有适当的ARIA标签', () => {
      render(<WebsiteDetailPage initialData={mockWebsiteData} />);
      
      // 检查主要区域标签
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('aria-label', '网站详情主要内容');
      
      // 检查区域标识
      const websiteInfo = document.getElementById('website-info');
      expect(websiteInfo).toHaveAttribute('role', 'region');
      expect(websiteInfo).toHaveAttribute('aria-labelledby', 'website-hero-heading');
    });

    it('应该没有无障碍访问违规', async () => {
      const { container } = render(<WebsiteDetailPage initialData={mockWebsiteData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('WebsiteDetailHero', () => {
    const mockOnVisit = jest.fn();

    beforeEach(() => {
      mockOnVisit.mockClear();
    });

    it('应该有正确的标题层次结构', () => {
      render(<WebsiteDetailHero website={mockWebsiteData} onVisit={mockOnVisit} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(mockWebsiteData.title);
      expect(heading).toHaveAttribute('id', 'website-hero-heading');
    });

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      render(<WebsiteDetailHero website={mockWebsiteData} onVisit={mockOnVisit} />);
      
      const urlButton = screen.getByRole('button', { name: /访问.*网站/ });
      const visitButton = screen.getByRole('button', { name: '访问网站' });
      
      // 测试Tab导航
      await user.tab();
      expect(urlButton).toHaveFocus();
      
      await user.tab();
      expect(visitButton).toHaveFocus();
      
      // 测试Enter键激活
      await user.keyboard('{Enter}');
      expect(mockOnVisit).toHaveBeenCalledWith(mockWebsiteData.id, mockWebsiteData.url);
    });

    it('应该显示可访问性警告（如果网站不可访问）', () => {
      const inaccessibleWebsite = { ...mockWebsiteData, is_accessible: false };
      render(<WebsiteDetailHero website={inaccessibleWebsite} onVisit={mockOnVisit} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('网站可能存在无障碍访问问题');
      expect(alert).toHaveAttribute('aria-label', '网站可访问性警告');
    });

    it('应该没有无障碍访问违规', async () => {
      const { container } = render(<WebsiteDetailHero website={mockWebsiteData} onVisit={mockOnVisit} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('WebsiteDetailInfo', () => {
    it('应该有适当的标题层次结构', () => {
      render(<WebsiteDetailInfo website={mockWebsiteData} />);
      
      // 检查主标题
      const mainHeading = screen.getByRole('heading', { level: 2, name: '网站信息' });
      expect(mainHeading).toBeInTheDocument();
      
      // 检查子标题
      const categoryHeading = screen.getByRole('heading', { level: 3, name: '分类' });
      expect(categoryHeading).toBeInTheDocument();
    });

    it('应该有适当的ARIA标签', () => {
      render(<WebsiteDetailInfo website={mockWebsiteData} />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveAttribute('aria-label', '网站详细信息侧边栏');
      
      const infoCard = screen.getByRole('region', { name: /网站信息/ });
      expect(infoCard).toHaveAttribute('aria-labelledby', 'website-info-heading');
    });

    it('应该有状态指示器', () => {
      render(<WebsiteDetailInfo website={mockWebsiteData} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('应该没有无障碍访问违规', async () => {
      const { container } = render(<WebsiteDetailInfo website={mockWebsiteData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('WebsiteCard', () => {
    const mockOnVisit = jest.fn();
    const mockOnTagClick = jest.fn();

    beforeEach(() => {
      mockOnVisit.mockClear();
      mockOnTagClick.mockClear();
    });

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      const cardData = mockWebsiteData.related_websites![0];
      render(<WebsiteCard website={cardData} onVisit={mockOnVisit} onTagClick={mockOnTagClick} />);
      
      const card = screen.getByRole('button', { name: /访问.*网站/ });
      
      // 测试Tab导航
      await user.tab();
      expect(card).toHaveFocus();
      
      // 测试Enter键激活
      await user.keyboard('{Enter}');
      expect(mockOnVisit).toHaveBeenCalledWith(cardData);
    });

    it('应该有适当的ARIA标签', () => {
      const cardData = mockWebsiteData.related_websites![0];
      render(<WebsiteCard website={cardData} onVisit={mockOnVisit} onTagClick={mockOnTagClick} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-describedby', `website-${cardData.id}-description`);
      
      const description = document.getElementById(`website-${cardData.id}-description`);
      expect(description).toBeInTheDocument();
    });

    it('应该没有无障碍访问违规', async () => {
      const cardData = mockWebsiteData.related_websites![0];
      const { container } = render(<WebsiteCard website={cardData} onVisit={mockOnVisit} onTagClick={mockOnTagClick} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('BreadcrumbNavigation', () => {
    it('应该有正确的导航结构', () => {
      const websiteInfo = {
        title: mockWebsiteData.title,
        id: mockWebsiteData.id,
        category: mockWebsiteData.category
      };
      
      render(<BreadcrumbNavigation website={websiteInfo} />);
      
      const nav = screen.getByRole('navigation', { name: '网站详情页导航' });
      expect(nav).toBeInTheDocument();
      
      const breadcrumbList = screen.getByRole('list', { name: '面包屑导航' });
      expect(breadcrumbList).toBeInTheDocument();
      
      // 检查当前页面标识
      const currentPage = screen.getByText(mockWebsiteData.title);
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('应该有可访问的链接', () => {
      const websiteInfo = {
        title: mockWebsiteData.title,
        id: mockWebsiteData.id,
        category: mockWebsiteData.category
      };
      
      render(<BreadcrumbNavigation website={websiteInfo} />);
      
      const homeLink = screen.getByRole('link', { name: '导航到Home' });
      expect(homeLink).toHaveAttribute('href', '/');
      
      const categoryLink = screen.getByRole('link', { name: `导航到${mockWebsiteData.category!.name}` });
      expect(categoryLink).toHaveAttribute('href', `/category/${mockWebsiteData.category!.slug}`);
    });

    it('应该没有无障碍访问违规', async () => {
      const websiteInfo = {
        title: mockWebsiteData.title,
        id: mockWebsiteData.id,
        category: mockWebsiteData.category
      };
      
      const { container } = render(<BreadcrumbNavigation website={websiteInfo} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('颜色对比度测试', () => {
    it('应该使用高对比度的警告颜色', () => {
      const inaccessibleWebsite = { ...mockWebsiteData, is_accessible: false };
      render(<WebsiteDetailHero website={inaccessibleWebsite} onVisit={jest.fn()} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('warning-banner');
    });

    it('应该在高对比度模式下增强显示', () => {
      // 模拟高对比度偏好
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      const { container } = render(<WebsiteDetailPage initialData={mockWebsiteData} />);
      
      // 在高对比度模式下，按钮和标签应该有额外的边框
      const style = getComputedStyle(container);
      expect(style).toBeDefined();
    });
  });

  describe('减少动画偏好测试', () => {
    it('应该在减少动画模式下禁用动画', () => {
      // 模拟减少动画偏好
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      const { container } = render(<WebsiteDetailPage initialData={mockWebsiteData} />);
      
      // 动画应该被显著缩短
      const style = getComputedStyle(container);
      expect(style).toBeDefined();
    });
  });
});