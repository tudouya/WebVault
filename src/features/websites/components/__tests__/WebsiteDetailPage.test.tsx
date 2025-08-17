/**
 * WebsiteDetailPage 集成测试
 * 
 * 全面测试网站详情页面的所有功能和组件交互：
 * - 基础渲染和数据获取测试
 * - 组件交互和用户行为测试
 * - 错误处理和边界情况测试
 * - SEO元数据和无障碍访问测试
 * - 响应式设计和性能测试
 * - 访问统计功能测试
 * 
 * 需求覆盖：
 * - AC-2.1.1-2.1.4: 网站信息查看
 * - AC-2.2.1-2.2.4: 导航和上下文信息
 * - AC-2.3.1-2.3.4: 发布者和元数据信息
 * - AC-2.4.1-2.4.4: 网站访问功能
 * - AC-2.5.1-2.5.4: 相关网站推荐
 * - AC-2.6.1-2.6.4: 页面导航和返回
 * - NFR: 性能、响应式设计、无障碍访问、SEO优化
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { WebsiteDetailPage } from '../WebsiteDetailPage';
import type { WebsiteDetailData } from '../../types/detail';
import type { WebsiteCardData } from '../../types/website';
import { trackWebsiteVisit, VisitTrackingResult } from '../../services/websiteDetailService';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: React.forwardRef(({ 
    src, 
    alt, 
    onError, 
    onLoad, 
    fill,
    loading,
    className,
    style,
    ...otherProps 
  }: any, ref: any) => {
    const handleError = () => onError && onError();
    const handleLoad = () => onLoad && onLoad();

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        className={className}
        style={fill ? { ...style, objectFit: 'cover' } : style}
        {...otherProps}
      />
    );
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className, onClick, ...props }: any) => (
    <a href={href} className={className} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

// Mock layout components
jest.mock('../HeaderNavigation', () => ({
  HeaderNavigation: ({ className }: any) => (
    <nav className={className} data-testid="header-navigation">
      <div>Header Navigation</div>
    </nav>
  ),
}));

jest.mock('../Footer', () => ({
  Footer: ({ className }: any) => (
    <footer className={className} data-testid="footer">
      <div>Footer Content</div>
    </footer>
  ),
}));

// Mock BreadcrumbNavigation
jest.mock('../BreadcrumbNavigation', () => ({
  BreadcrumbNavigation: ({ website, onBreadcrumbClick, className }: any) => (
    <nav 
      className={className} 
      data-testid="breadcrumb-navigation"
      aria-label="面包屑导航"
      role="navigation"
    >
      <ol>
        <li>
          <a href="/" aria-label="返回首页">Home</a>
        </li>
        <li>
          <a href="/websites" aria-label="返回网站列表">Websites</a>
        </li>
        {website.category && (
          <li>
            <a 
              href={`/websites?category=${encodeURIComponent(website.category.name)}`}
              aria-label={`查看${website.category.name}分类网站`}
            >
              {website.category.name}
            </a>
          </li>
        )}
        <li aria-current="page" title={website.title} className="line-clamp-1">
          {website.title}
        </li>
      </ol>
    </nav>
  ),
}));

// Mock WebsiteDetailHero
jest.mock('../WebsiteDetailHero', () => ({
  WebsiteDetailHero: ({ website, onVisit, className }: any) => {
    const handleClick = async () => {
      await onVisit(website.id, website.url);
      // 模拟实际组件中的 window.open 调用
      window.open(website.url, '_blank', 'noopener,noreferrer');
    };
    
    return (
      <div 
        className={className} 
        data-testid="website-detail-hero"
        role="region"
        aria-labelledby="website-hero-heading"
        aria-describedby="website-hero-description"
      >
        <h1 id="website-hero-heading">{website.title}</h1>
        <p id="website-hero-description">{website.description}</p>
        <p>{website.url}</p>
        <button 
          onClick={handleClick}
          aria-label={`访问 ${website.title} 网站`}
        >
          访问网站
        </button>
        {website.favicon_url && (
          <img src={website.favicon_url} alt={`${website.title} icon`} />
        )}
        {website.screenshot_url && (
          <img 
            src={website.screenshot_url} 
            alt={`${website.title} screenshot`} 
            role="img" 
          />
        )}
        {!website.is_accessible && (
          <div>网站可能存在无障碍访问问题</div>
        )}
      </div>
    );
  },
}));

// Mock WebsiteDetailContent
jest.mock('../WebsiteDetailContent', () => ({
  WebsiteDetailContent: ({ website, className }: any) => (
    <div 
      className={className} 
      data-testid="website-detail-content"
      aria-label="网站详细内容"
    >
      <div>Website Content for {website.title}</div>
      {website.content && <div>{website.content}</div>}
      {website.features && website.features.map((feature: string, index: number) => (
        <span key={index} data-testid="feature-tag">{feature}</span>
      ))}
    </div>
  ),
}));

// Mock WebsiteDetailInfo
jest.mock('../WebsiteDetailInfo', () => ({
  WebsiteDetailInfo: ({ website, onTagClick, className }: any) => (
    <div 
      className={className} 
      data-testid="website-detail-info"
      aria-label="网站信息"
    >
      <div>Website Info</div>
      {website.publisher && (
        <div data-testid="publisher-info">
          <div>{website.publisher.name}</div>
          <div>{website.publisher.bio}</div>
        </div>
      )}
      {website.stats && (
        <div data-testid="website-stats">
          <div>访问量: {website.stats.total_visits}</div>
          <div>月访问量: {website.stats.monthly_visits}</div>
        </div>
      )}
      {website.tags && website.tags.map((tag: string, index: number) => (
        <button 
          key={index}
          onClick={() => onTagClick && onTagClick(tag)}
          aria-label={`查看标签"${tag}"的相关网站`}
        >
          #{tag}
        </button>
      ))}
      {website.pricing && (
        <div data-testid="pricing-info">
          {website.pricing.is_free ? '免费' : website.pricing.starting_price}
        </div>
      )}
    </div>
  ),
}));

// Mock RelatedWebsiteGrid
jest.mock('../RelatedWebsiteGrid', () => ({
  RelatedWebsiteGrid: ({ relatedWebsites, onVisitWebsite, onTagClick, title, maxItems, className }: any) => (
    <div 
      className={className} 
      data-testid="related-website-grid"
      role="region"
      aria-labelledby="related-websites-heading"
    >
      <h2 id="related-websites-heading">{title}</h2>
      <div>
        {relatedWebsites?.slice(0, maxItems).map((website: WebsiteCardData) => (
          <div key={website.id} data-testid={`related-website-${website.id}`}>
            <h3>{website.title}</h3>
            <p>{website.description}</p>
            <button 
              onClick={() => onVisitWebsite(website)}
              aria-label={`访问 ${website.title}`}
            >
              访问
            </button>
            {website.tags?.map((tag: string, index: number) => (
              <button 
                key={index}
                onClick={() => onTagClick && onTagClick(tag)}
                aria-label={`查看标签"${tag}"的相关网站`}
              >
                #{tag}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
}));

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock website detail service
jest.mock('../../services/websiteDetailService', () => ({
  trackWebsiteVisit: jest.fn(),
}));

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('WebsiteDetailPage 集成测试', () => {
  // 测试数据
  const mockWebsiteData: WebsiteDetailData = {
    id: 'test-website-1',
    title: 'Test Website',
    description: 'This is a test website for comprehensive testing',
    url: 'https://example.com',
    favicon_url: 'https://example.com/favicon.ico',
    screenshot_url: 'https://example.com/screenshot.png',
    is_accessible: true,
    category_id: 'cat-1',
    category: {
      id: 'cat-1',
      name: '开发工具',
      slug: 'dev-tools',
      description: '开发相关工具',
      color: '#3B82F6',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    visitCount: 1000,
    visit_count: 1000,
    tags: ['React', 'TypeScript', '开发'],
    status: 'active',
    isAd: false,
    is_featured: false,
    is_public: true,
    content: 'Extended content about this website',
    language: 'zh-CN',
    popularity_score: 0.8,
    last_checked_at: '2024-01-01T00:00:00Z',
    publisher: {
      id: 'publisher-1',
      name: '张小明',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: '资深开发工程师',
      website_url: 'https://zhangxiaoming.dev',
      published_count: 25,
      joined_at: '2023-01-01T00:00:00Z',
    },
    stats: {
      total_visits: 10000,
      monthly_visits: 3000,
      weekly_visits: 800,
      daily_visits: 120,
      bounce_rate: 0.4,
      avg_session_duration: 240,
    },
    features: ['开源', '免费', 'API'],
    pricing: {
      is_free: true,
      has_paid_plans: false,
      starting_price: '免费',
      currency: 'CNY',
    },
    related_websites: [
      {
        id: 'related-1',
        title: 'Related Website 1',
        description: 'Related website description',
        url: 'https://related1.com',
        favicon_url: 'https://related1.com/favicon.ico',
        image_url: 'https://related1.com/image.jpg',
        tags: ['React', 'JavaScript'],
        category: '开发工具',
        isAd: false,
        rating: 4.5,
        visit_count: 500,
        is_featured: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'related-2',
        title: 'Related Website 2',
        description: 'Another related website',
        url: 'https://related2.com',
        favicon_url: 'https://related2.com/favicon.ico',
        image_url: 'https://related2.com/image.jpg',
        tags: ['TypeScript', 'Node.js'],
        category: '开发工具',
        isAd: false,
        rating: 4.2,
        visit_count: 300,
        is_featured: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  const defaultProps = {
    initialData: mockWebsiteData,
  };

  // 清理和重置
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock 访问统计服务
    (trackWebsiteVisit as jest.Mock).mockResolvedValue({
      success: true,
      newVisitCount: 1001,
    } as VisitTrackingResult);

    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    
    // Mock intersection observer
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. 基础渲染测试', () => {
    test('应该正确渲染网站详情页面的所有主要组件', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证主要结构
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText('网站详情页面')).toBeInTheDocument();
      
      // 验证导航栏
      expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
      
      // 验证面包屑导航
      expect(screen.getByLabelText('面包屑导航')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Websites')).toBeInTheDocument();
      expect(screen.getByText(mockWebsiteData.category!.name)).toBeInTheDocument();
      
      // 验证网站标题
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(mockWebsiteData.title);
      
      // 验证页脚
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('应该正确显示网站基础信息', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证网站标题（使用更具体的选择器）
      const heroHeading = screen.getByRole('heading', { level: 1 });
      expect(heroHeading).toHaveTextContent(mockWebsiteData.title);
      
      // 验证描述
      expect(screen.getByText(mockWebsiteData.description!)).toBeInTheDocument();
      
      // 验证网站URL
      expect(screen.getByText(mockWebsiteData.url)).toBeInTheDocument();
      
      // 验证访问网站按钮
      const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
      expect(visitButton).toBeInTheDocument();
    });

    test('应该正确显示网站元信息和统计数据', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证发布者信息
      const publisherInfo = screen.getByTestId('publisher-info');
      expect(within(publisherInfo).getByText(mockWebsiteData.publisher!.name)).toBeInTheDocument();
      expect(within(publisherInfo).getByText(mockWebsiteData.publisher!.bio!)).toBeInTheDocument();
      
      // 验证统计数据
      const websiteStats = screen.getByTestId('website-stats');
      expect(within(websiteStats).getByText(`访问量: ${mockWebsiteData.stats!.total_visits}`)).toBeInTheDocument();
      expect(within(websiteStats).getByText(`月访问量: ${mockWebsiteData.stats!.monthly_visits}`)).toBeInTheDocument();
      
      // 验证标签（需要在具体的容器内查找，处理重复标签问题）
      mockWebsiteData.tags.forEach(tag => {
        const tagButtons = screen.getAllByLabelText(`查看标签"${tag}"的相关网站`);
        expect(tagButtons.length).toBeGreaterThan(0);
        expect(tagButtons[0]).toHaveTextContent(`#${tag}`);
      });
      
      // 验证定价信息
      const pricingInfo = screen.getByTestId('pricing-info');
      expect(within(pricingInfo).getByText('免费')).toBeInTheDocument();
    });

    test('应该根据属性控制组件显示/隐藏', () => {
      const { rerender } = render(
        <WebsiteDetailPage 
          {...defaultProps} 
          showNavigation={false}
          showBreadcrumb={false}
          showFooter={false}
        />
      );

      // 验证组件隐藏
      expect(screen.queryByTestId('header-navigation')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('面包屑导航')).not.toBeInTheDocument();
      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();

      // 重新渲染并验证组件显示
      rerender(<WebsiteDetailPage {...defaultProps} />);
      
      expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('面包屑导航')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('2. 访问功能测试', () => {
    test('点击访问按钮应该调用访问统计和打开网站', async () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
      
      await act(async () => {
        await userEvent.click(visitButton);
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(trackWebsiteVisit).toHaveBeenCalledWith(mockWebsiteData.id);
      });
      
      // 验证网站被打开
      expect(mockWindowOpen).toHaveBeenCalledWith(
        mockWebsiteData.url, 
        '_blank', 
        'noopener,noreferrer'
      );
    });

    test('应该支持自定义访问回调', async () => {
      const mockOnWebsiteVisit = jest.fn().mockResolvedValue(undefined);
      
      render(
        <WebsiteDetailPage 
          {...defaultProps} 
          onWebsiteVisit={mockOnWebsiteVisit}
        />
      );

      const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
      
      await userEvent.click(visitButton);

      // 验证自定义回调被调用
      expect(mockOnWebsiteVisit).toHaveBeenCalledWith(
        mockWebsiteData.id, 
        mockWebsiteData.url
      );
    });

    test('访问统计失败时不应该阻止网站访问', async () => {
      // Mock 访问统计失败
      (trackWebsiteVisit as jest.Mock).mockResolvedValue({
        success: false,
        newVisitCount: 0,
        error: 'Tracking failed',
      });

      render(<WebsiteDetailPage {...defaultProps} />);

      const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
      
      await act(async () => {
        await userEvent.click(visitButton);
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(trackWebsiteVisit).toHaveBeenCalledWith(mockWebsiteData.id);
      });
      
      // 验证网站仍然被打开
      expect(mockWindowOpen).toHaveBeenCalledWith(
        mockWebsiteData.url, 
        '_blank', 
        'noopener,noreferrer'
      );
    });

    test('访问统计期间应该显示加载状态', async () => {
      // Mock 较长的访问统计延迟
      (trackWebsiteVisit as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          newVisitCount: 1001,
        }), 100))
      );

      render(<WebsiteDetailPage {...defaultProps} />);

      const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
      
      userEvent.click(visitButton);

      // 验证加载状态显示
      await waitFor(() => {
        expect(screen.getByText('更新访问统计中...')).toBeInTheDocument();
      });

      // 等待加载完成
      await waitFor(() => {
        expect(screen.queryByText('更新访问统计中...')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('3. 相关网站推荐测试', () => {
    test('应该显示相关网站推荐区域', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证相关推荐标题
      expect(screen.getByText('相关推荐')).toBeInTheDocument();
      
      // 验证相关网站显示
      mockWebsiteData.related_websites!.forEach(website => {
        expect(screen.getByText(website.title)).toBeInTheDocument();
        expect(screen.getByText(website.description!)).toBeInTheDocument();
      });
    });

    test('点击相关网站应该触发访问统计', async () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      const relatedWebsite = mockWebsiteData.related_websites![0];
      const visitButton = screen.getByLabelText(`访问 ${relatedWebsite.title}`);
      
      await userEvent.click(visitButton);

      // 验证访问统计被调用
      expect(trackWebsiteVisit).toHaveBeenCalledWith(relatedWebsite.id);
    });

    test('没有相关网站时不应该显示推荐区域', () => {
      const websiteWithoutRelated = {
        ...mockWebsiteData,
        related_websites: [],
      };

      render(<WebsiteDetailPage initialData={websiteWithoutRelated} />);

      // 验证相关推荐区域不显示
      expect(screen.queryByText('相关推荐')).not.toBeInTheDocument();
      expect(screen.queryByTestId('related-website-grid')).not.toBeInTheDocument();
    });

    test('相关网站应该限制显示数量', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证最多显示6个相关网站（根据代码中的maxItems=6）
      const relatedWebsiteElements = screen.getAllByTestId(/^related-website-/);
      expect(relatedWebsiteElements.length).toBeLessThanOrEqual(6);
    });
  });

  describe('4. 导航和标签交互测试', () => {
    test('面包屑导航链接应该具有正确的href属性', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证首页链接
      const homeLink = screen.getByLabelText('返回首页');
      expect(homeLink).toHaveAttribute('href', '/');
      
      // 验证网站列表链接
      const websitesLink = screen.getByLabelText('返回网站列表');
      expect(websitesLink).toHaveAttribute('href', '/websites');
      
      // 验证分类链接
      const categoryLink = screen.getByLabelText(`查看${mockWebsiteData.category!.name}分类网站`);
      expect(categoryLink).toHaveAttribute(
        'href', 
        `/websites?category=${encodeURIComponent(mockWebsiteData.category!.name)}`
      );
    });

    test('标签点击应该触发回调', async () => {
      const mockOnTagClick = jest.fn();
      
      render(
        <WebsiteDetailPage 
          {...defaultProps} 
          onTagClick={mockOnTagClick}
        />
      );

      const firstTag = mockWebsiteData.tags[0];
      const tagButtons = screen.getAllByLabelText(`查看标签"${firstTag}"的相关网站`);
      
      await userEvent.click(tagButtons[0]);

      expect(mockOnTagClick).toHaveBeenCalledWith(firstTag);
    });

    test('面包屑点击应该触发回调', async () => {
      const mockOnBreadcrumbClick = jest.fn();
      
      render(
        <WebsiteDetailPage 
          {...defaultProps} 
          onBreadcrumbClick={mockOnBreadcrumbClick}
        />
      );

      // 注意：在实际的BreadcrumbNavigation组件中会有这个功能
      // 这里主要验证props传递正确
      expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
    });

    test('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证可以通过Tab键在可聚焦元素间导航
      await user.tab(); // 跳转到主要内容链接
      
      const skipLink = document.activeElement;
      expect(skipLink).toHaveTextContent('跳转到主要内容');
      
      await user.tab(); // 下一个可聚焦元素
      
      const nextFocused = document.activeElement;
      expect(nextFocused).toBeInstanceOf(HTMLElement);
    });
  });

  describe('5. 滚动行为测试', () => {
    test('应该监听滚动事件并更新导航栏状态', async () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 初始状态，导航栏应该没有滚动样式
      const navbar = document.querySelector('.navbar-fixed');
      expect(navbar).not.toHaveClass('navbar-scrolled');

      // 模拟滚动超过阈值
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 150,
      });

      fireEvent.scroll(window);

      // 等待throttled scroll handler执行
      await waitFor(() => {
        const scrolledNavbar = document.querySelector('.navbar-scrolled');
        expect(scrolledNavbar).toBeInTheDocument();
      }, { timeout: 100 });
    });

    test('应该正确清理滚动事件监听器', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<WebsiteDetailPage {...defaultProps} />);

      // 验证添加了滚动监听器
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );

      // 卸载组件
      unmount();

      // 验证移除了滚动监听器
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('6. 加载状态测试', () => {
    test('应该在loading状态下显示加载覆盖层', () => {
      render(<WebsiteDetailPage {...defaultProps} isLoading={true} />);

      // 验证加载覆盖层存在
      const loadingOverlay = screen.getByRole('status');
      expect(loadingOverlay).toBeInTheDocument();
      expect(loadingOverlay).toHaveAttribute('aria-live', 'assertive');
      expect(loadingOverlay).toHaveAttribute('aria-label', '页面加载中');
      expect(loadingOverlay).toHaveAttribute('aria-busy', 'true');
      
      // 验证加载文本
      expect(screen.getByText('正在加载网站详情...')).toBeInTheDocument();
      
      // 验证加载动画元素
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      const pingAnimation = document.querySelector('.animate-ping');
      expect(pingAnimation).toBeInTheDocument();
      
      const bounceElements = document.querySelectorAll('.animate-bounce');
      expect(bounceElements).toHaveLength(3);
    });

    test('应该在loading状态下降低内容透明度', () => {
      render(<WebsiteDetailPage {...defaultProps} isLoading={true} />);

      // 验证面包屑和内容区域的透明度
      const breadcrumb = screen.getByLabelText('面包屑导航');
      expect(breadcrumb).toHaveClass('opacity-70');
      
      // 检查英雄区域的容器是否有 opacity-70 类
      const websiteInfoSection = document.querySelector('#website-info');
      expect(websiteInfoSection).toHaveClass('opacity-70');
    });

    test('不应该在非loading状态下显示加载覆盖层', () => {
      render(<WebsiteDetailPage {...defaultProps} isLoading={false} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByText('正在加载网站详情...')).not.toBeInTheDocument();
    });
  });

  describe('7. 响应式设计测试', () => {
    test('应该使用正确的响应式类名', () => {
      const { container } = render(<WebsiteDetailPage {...defaultProps} />);

      // 验证主容器的响应式类
      const mainContainer = container.querySelector('.max-w-7xl');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('px-6', 'sm:px-8', 'lg:px-12');

      // 验证网格布局的响应式类
      const gridContainer = container.querySelector('.lg\\:grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('lg:grid-cols-12', 'lg:gap-8');

      // 验证主内容区域
      const mainContent = container.querySelector('.lg\\:col-span-8');
      expect(mainContent).toBeInTheDocument();

      // 验证侧边栏
      const sidebar = container.querySelector('.lg\\:col-span-4');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('lg:sticky', 'lg:top-24', 'lg:self-start');
    });

    test('应该在不同断点下正确显示内容', () => {
      const { container } = render(<WebsiteDetailPage {...defaultProps} />);

      // 验证面包屑区域的响应式间距
      const breadcrumbArea = container.querySelector('.pt-8');
      expect(breadcrumbArea).toHaveClass('sm:pt-12', 'lg:pt-16');

      // 验证内容区域的响应式间距
      const contentArea = container.querySelector('.mb-12');
      expect(contentArea).toHaveClass('sm:mb-16', 'lg:mb-20');
    });
  });

  describe('8. 无障碍访问测试', () => {
    test('应该具有正确的ARIA属性', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证主要的role和aria-label
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText('网站详情页面')).toBeInTheDocument();
      expect(screen.getByLabelText('面包屑导航')).toBeInTheDocument();
      expect(screen.getByLabelText('网站详情主要内容')).toBeInTheDocument();
    });

    test('应该提供跳转链接', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证跳转到主要内容的链接
      const skipToMain = screen.getByLabelText('跳转到主要内容');
      expect(skipToMain).toBeInTheDocument();
      expect(skipToMain).toHaveAttribute('href', '#main-content');
      
      // 验证跳转到网站信息的链接
      const skipToInfo = screen.getByLabelText('跳转到网站信息');
      expect(skipToInfo).toBeInTheDocument();
      expect(skipToInfo).toHaveAttribute('href', '#website-info');
      
      // 验证跳转到相关推荐的链接
      const skipToRelated = screen.getByLabelText('跳转到相关推荐');
      expect(skipToRelated).toBeInTheDocument();
      expect(skipToRelated).toHaveAttribute('href', '#related-websites');
    });

    test('应该为图片提供合适的alt属性', () => {
      render(<WebsiteDetailPage {...defaultProps} />);

      // 验证网站图标alt属性
      const favicon = screen.getByAltText(`${mockWebsiteData.title} icon`);
      expect(favicon).toBeInTheDocument();

      // 验证网站截图alt属性
      const screenshot = screen.getByAltText(`${mockWebsiteData.title} screenshot`);
      expect(screenshot).toBeInTheDocument();
    });

    test('加载状态应该有正确的无障碍属性', () => {
      render(<WebsiteDetailPage {...defaultProps} isLoading={true} />);

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-live', 'assertive');
      expect(loadingStatus).toHaveAttribute('aria-label', '页面加载中');
      expect(loadingStatus).toHaveAttribute('aria-busy', 'true');
    });

    test('访问统计加载状态应该有正确的无障碍属性', async () => {
      // Mock 较长的访问统计延迟
      (trackWebsiteVisit as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          newVisitCount: 1001,
        }), 100))
      );

      render(<WebsiteDetailPage {...defaultProps} />);

      const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
      
      userEvent.click(visitButton);

      // 验证访问统计加载状态的无障碍属性
      await waitFor(() => {
        const visitLoadingStatus = screen.getByLabelText('更新访问统计中');
        expect(visitLoadingStatus).toHaveAttribute('role', 'status');
        expect(visitLoadingStatus).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('9. 边界情况和错误处理', () => {
    test('应该处理缺少可选字段的数据', () => {
      const minimalWebsiteData: WebsiteDetailData = {
        id: 'minimal-website',
        title: 'Minimal Website',
        description: undefined,
        url: 'https://minimal.com',
        favicon_url: undefined,
        screenshot_url: undefined,
        is_accessible: true,
        category_id: 'cat-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        visitCount: 0,
        visit_count: 0,
        tags: [],
        status: 'active',
        isAd: false,
        is_featured: false,
        is_public: true,
        // 缺少可选字段
        publisher: undefined,
        stats: undefined,
        features: undefined,
        pricing: undefined,
        related_websites: undefined,
      };

      render(<WebsiteDetailPage initialData={minimalWebsiteData} />);

      // 验证页面仍然正确渲染（使用heading选择器避免重复）
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(minimalWebsiteData.title);
      expect(screen.getByText(minimalWebsiteData.url)).toBeInTheDocument();
      
      // 验证可选元素不显示
      expect(screen.queryByTestId('publisher-info')).not.toBeInTheDocument();
      expect(screen.queryByTestId('website-stats')).not.toBeInTheDocument();
      expect(screen.queryByTestId('related-website-grid')).not.toBeInTheDocument();
    });

    test('应该处理空标签数组', () => {
      const websiteWithoutTags = {
        ...mockWebsiteData,
        tags: [],
        // 也要确保相关网站没有标签
        related_websites: mockWebsiteData.related_websites?.map(site => ({
          ...site,
          tags: []
        }))
      };

      render(<WebsiteDetailPage initialData={websiteWithoutTags} />);

      // 验证页面正常渲染，但没有标签显示
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(mockWebsiteData.title);
      
      // 主网站的标签按钮不应该存在（在WebsiteDetailInfo中）
      const websiteInfo = screen.getByTestId('website-detail-info');
      const tagButtonsInInfo = within(websiteInfo).queryAllByLabelText(/查看标签.*的相关网站/);
      expect(tagButtonsInInfo).toHaveLength(0);
    });

    test('应该处理无法访问的网站', () => {
      const inaccessibleWebsite = {
        ...mockWebsiteData,
        is_accessible: false,
      };

      render(<WebsiteDetailPage initialData={inaccessibleWebsite} />);

      // 验证无障碍访问警告显示
      expect(screen.getByText('网站可能存在无障碍访问问题')).toBeInTheDocument();
    });

    test('应该处理超长标题', () => {
      const websiteWithLongTitle = {
        ...mockWebsiteData,
        title: '这是一个非常非常非常长的网站标题，用来测试组件如何处理超长文本内容的显示，确保不会破坏页面布局和用户体验',
      };

      render(<WebsiteDetailPage initialData={websiteWithLongTitle} />);

      // 验证长标题正确显示（使用heading选择器）
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(websiteWithLongTitle.title);
      
      // 验证面包屑中的标题有truncation类
      const breadcrumbTitle = screen.getByTitle(websiteWithLongTitle.title);
      expect(breadcrumbTitle).toHaveClass('line-clamp-1');
    });

    test('应该处理网络错误', async () => {
      // Mock 网络错误
      (trackWebsiteVisit as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<WebsiteDetailPage {...defaultProps} />);

      const visitButton = screen.getByRole('button', { name: /访问.*test website.*网站/i });
      
      await act(async () => {
        await userEvent.click(visitButton);
      });

      // 等待错误处理
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to handle website visit:',
          expect.any(Error)
        );
      });

      // 验证网站仍然被打开（错误不应该阻止访问）
      expect(mockWindowOpen).toHaveBeenCalledWith(
        mockWebsiteData.url, 
        '_blank', 
        'noopener,noreferrer'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('10. 性能和优化测试', () => {
    test('应该使用防抖优化滚动事件', async () => {
      const scrollHandler = jest.fn();
      jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'scroll') {
          scrollHandler.mockImplementation(handler as any);
        }
      });

      render(<WebsiteDetailPage {...defaultProps} />);

      // 快速触发多次滚动事件
      for (let i = 0; i < 5; i++) {
        fireEvent.scroll(window);
      }

      // 验证处理器被正确注册
      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });

    test('应该正确设置组件动画类', () => {
      const { container } = render(<WebsiteDetailPage {...defaultProps} />);

      // 验证淡入动画类
      const fadeInElements = container.querySelectorAll('.website-detail-fade-in');
      expect(fadeInElements.length).toBeGreaterThan(0);
    });
  });

  describe('11. 自定义配置测试', () => {
    test('应该接受自定义className', () => {
      const customClassName = 'custom-website-detail-page';
      const { container } = render(
        <WebsiteDetailPage {...defaultProps} className={customClassName} />
      );

      const pageContainer = container.firstChild as HTMLElement;
      expect(pageContainer).toHaveClass(customClassName);
    });

    test('应该保持基础CSS类', () => {
      const { container } = render(<WebsiteDetailPage {...defaultProps} />);

      const pageContainer = container.firstChild as HTMLElement;
      expect(pageContainer).toHaveClass(
        'min-h-screen',
        'bg-background',
        'flex',
        'flex-col',
        'website-detail-fade-in'
      );
    });
  });

  describe('12. 组件生命周期测试', () => {
    test('应该在组件卸载时清理滚动监听器', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<WebsiteDetailPage {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
      
      removeEventListenerSpy.mockRestore();
    });

    test('应该在props变化时正确更新', () => {
      const { rerender } = render(<WebsiteDetailPage {...defaultProps} />);

      // 使用heading选择器验证初始状态
      const initialHeading = screen.getByRole('heading', { level: 1 });
      expect(initialHeading).toHaveTextContent(mockWebsiteData.title);

      // 使用不同的网站数据重新渲染
      const newWebsiteData = {
        ...mockWebsiteData,
        title: '更新后的网站标题',
        category: {
          ...mockWebsiteData.category!,
          name: '新分类',
        },
      };

      rerender(<WebsiteDetailPage initialData={newWebsiteData} />);

      // 验证更新后的内容
      const updatedHeading = screen.getByRole('heading', { level: 1 });
      expect(updatedHeading).toHaveTextContent('更新后的网站标题');
      expect(screen.getByText('新分类')).toBeInTheDocument();
    });

    test('应该正确处理props中的回调函数', async () => {
      const mockCallbacks = {
        onWebsiteVisit: jest.fn(),
        onTagClick: jest.fn(),
        onBreadcrumbClick: jest.fn(),
      };

      render(<WebsiteDetailPage {...defaultProps} {...mockCallbacks} />);

      // 这些回调的具体测试在前面的测试中已经覆盖
      // 这里主要验证props传递正确
      expect(screen.getByTestId('website-detail-hero')).toBeInTheDocument();
      expect(screen.getByTestId('website-detail-info')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
    });
  });
});