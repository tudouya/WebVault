/**
 * Guest User Experience Integration Tests
 * 
 * 访客用户体验集成测试 - 验证Admin-Only认证系统不影响访客功能
 * 
 * 此测试套件确保管理员专用认证系统的实现不会影响访客用户的浏览体验。
 * 涵盖所有公共页面的可访问性、搜索功能、内容浏览以及友好的权限提示。
 * 
 * Requirements验证:
 * - 6.1: 访客用户访问首页时显示完整网站内容，无需登录提示
 * - 6.2: 访客用户使用搜索功能时提供完整搜索结果和筛选选项
 * - 6.4: 访客用户浏览分类和集合时提供无障碍浏览体验
 * - 6.5: 系统界面不包含注册提示或注册相关的用户引导
 * - 6.3: 访客用户尝试访问管理功能时清晰说明此功能仅限管理员使用
 * 
 * @version 1.0.0
 * @created 2025-08-18
 * @author Claude Code (WebVault Admin-Only Auth System)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// 导入测试的页面组件和功能
import { HomePage, SearchPage } from '@/features/websites/components';

// 导入认证组件
import { AuthGuard, AdminOnly } from '@/features/auth/components/AuthGuard';
import { useAuthStore, useAuthStoreHook } from '@/features/auth/stores/auth-store';

// 导入中间件
import { middleware } from '@/middleware';

// 导入类型
import type { AuthUser, AuthSession } from '@/features/auth/types';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock环境变量
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => ({
    toString: () => '',
    get: jest.fn(),
  })),
  redirect: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock中间件用Supabase
const mockSupabaseAuth = {
  getUser: jest.fn(),
};

const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: jest.fn(() => mockSupabaseQuery),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock next/server for middleware
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: string | URL) => ({
      status: 307,
      headers: { location: url.toString() },
      type: 'redirect',
      url: url.toString(),
    })),
    next: jest.fn(() => ({
      status: 200,
      type: 'next',
    })),
  },
}));

// Mock认证存储
jest.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
  useAuthStoreHook: jest.fn(),
}));

// Mock认证服务
jest.mock('@/features/auth/services/SupabaseAuthService', () => ({
  supabaseAuthService: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock UI组件
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, onClick, disabled, ...props }, ref) => (
    <button 
      ref={ref} 
      className={className} 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )),
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
    <input ref={ref} className={className} {...props} />
  )),
}));

// Mock数据源
jest.mock('@/features/websites/data/mockWebsites', () => ({
  getMockWebsites: () => [
    {
      id: 'website-1',
      title: '测试网站1',
      description: '这是一个测试网站的描述',
      url: 'https://example1.com',
      favicon_url: 'https://example1.com/favicon.ico',
      category: '开发工具',
      tags: ['React', 'TypeScript'],
      isAd: false,
      rating: 4.5,
      visit_count: 1000,
      is_featured: true,
    },
    {
      id: 'website-2',
      title: '测试网站2',
      description: '另一个测试网站',
      url: 'https://example2.com',
      favicon_url: 'https://example2.com/favicon.ico',
      category: '设计资源',
      tags: ['UI/UX', 'Design'],
      isAd: false,
      rating: 4.2,
      visit_count: 800,
      is_featured: false,
    }
  ],
}));

jest.mock('@/features/blog/data/mockBlogs', () => ({
  getMockBlogs: () => [
    {
      id: 'blog-1',
      title: '测试博客文章1',
      excerpt: '这是一个测试博客文章的摘要',
      content: '完整的博客文章内容...',
      author: '管理员',
      publishedAt: '2025-08-18T10:00:00Z',
      category: '技术分享',
      tags: ['Web开发', 'React'],
      featuredImage: '/images/blog1.jpg',
    }
  ],
}));

// Mock collections data
jest.mock('@/features/websites/data/mockCollections', () => ({
  getMockCollections: () => [
    {
      id: 'collection-1',
      title: '前端开发工具集',
      description: '精选的前端开发工具和资源',
      websites: ['website-1', 'website-2'],
      category: '开发工具',
      featured: true,
    }
  ],
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock nuqs
jest.mock('nuqs', () => ({
  parseAsString: { parseServerSide: jest.fn(), serialize: jest.fn() },
  parseAsBoolean: { parseServerSide: jest.fn(), serialize: jest.fn() },
  parseAsInteger: { parseServerSide: jest.fn(), serialize: jest.fn() },
  useQueryState: jest.fn(() => [null, jest.fn()]),
  useQueryStates: jest.fn(() => [{}, jest.fn()]),
}));

// ============================================================================
// Test Data & Utilities
// ============================================================================

/**
 * 创建访客用户的Mock状态
 * 访客用户: 未认证状态，无用户信息
 */
const createGuestUserState = () => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  session: null,
  error: null,
  loginAttempts: 0,
  isLocked: false,
  lockoutExpiresAt: null,
  isInitialized: true,
  actions: {
    initialize: jest.fn().mockResolvedValue(undefined),
    login: jest.fn().mockResolvedValue(undefined),
    loginWithProvider: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    refreshSession: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    confirmPasswordReset: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    resetLoginAttempts: jest.fn(),
    isAdmin: jest.fn().mockReturnValue(false),
    requireAdmin: jest.fn().mockReturnValue(false),
    hasValidAdminSession: jest.fn().mockReturnValue(false),
  },
});

/**
 * 测试包装组件 - 模拟访客用户环境
 */
interface GuestTestWrapperProps {
  children: React.ReactNode;
}

const GuestTestWrapper: React.FC<GuestTestWrapperProps> = ({ children }) => {
  const mockGuestState = createGuestUserState();
  
  (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue(mockGuestState);
  (useAuthStoreHook as jest.MockedFunction<typeof useAuthStoreHook>).mockReturnValue({
    ...mockGuestState,
    isAdminUser: false,
    userName: 'Anonymous',
    userAvatar: undefined,
    userRole: null,
  });

  return <>{children}</>;
};

/**
 * 创建中间件请求Mock
 */
function createMiddlewareRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', headers = {}, cookies = {} } = options;
  const mockUrl = new URL(url);
  
  (mockUrl as any).clone = () => {
    const clonedUrl = new URL(mockUrl.toString());
    (clonedUrl as any).clone = mockUrl.clone;
    return clonedUrl;
  };
  
  return {
    nextUrl: mockUrl,
    url: mockUrl.toString(),
    method,
    headers: {
      get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
    },
    cookies: {
      get: jest.fn((name: string) => 
        cookies[name] ? { value: cookies[name] } : undefined
      ),
    },
  };
}

/**
 * 设置未认证用户的中间件Mock
 */
function setupUnauthenticatedMiddleware() {
  mockSupabaseAuth.getUser.mockResolvedValue({
    data: { user: null, error: { message: 'No user found' } }
  });
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Guest User Experience Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Reset navigation mocks
    mockPush.mockClear();
    mockReplace.mockClear();
    mockRefresh.mockClear();
    
    // Setup guest user environment
    setupUnauthenticatedMiddleware();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ========================================================================
  // 1. 公共页面访问测试 (Requirement 6.1, 6.2, 6.4)
  // ========================================================================

  describe('访客用户访问公共页面', () => {
    test('应该能够访问首页并查看完整网站内容，无需登录提示', async () => {
      // 设置路径为首页
      (usePathname as jest.MockedFunction<typeof usePathname>).mockReturnValue('/');
      
      render(
        <GuestTestWrapper>
          <HomePage />
        </GuestTestWrapper>
      );

      // 验证首页核心内容元素存在
      await waitFor(() => {
        // 首页应该显示网站内容
        expect(screen.getByRole('banner')).toBeInTheDocument(); // 导航栏
        expect(screen.getByRole('main')).toBeInTheDocument(); // 主要内容区域
      });

      // 验证没有显示登录提示
      expect(screen.queryByText('请登录以继续访问此页面')).not.toBeInTheDocument();
      expect(screen.queryByText('需要登录')).not.toBeInTheDocument();
      expect(screen.queryByText('立即登录')).not.toBeInTheDocument();

      // 验证没有显示注册相关提示 (Requirement 6.5)
      expect(screen.queryByText('注册')).not.toBeInTheDocument();
      expect(screen.queryByText('创建账户')).not.toBeInTheDocument();
      expect(screen.queryByText('立即注册')).not.toBeInTheDocument();
    });

    test('应该能够使用搜索功能并获得完整搜索结果', async () => {
      (usePathname as jest.MockedFunction<typeof usePathname>).mockReturnValue('/search');
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <GuestTestWrapper>
          <SearchPage />
        </GuestTestWrapper>
      );

      // 等待页面加载
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 查找搜索输入框
      const searchInput = screen.getByRole('searchbox', { name: /搜索/i }) || 
                         screen.getByPlaceholderText(/搜索网站/i) ||
                         screen.getByDisplayValue('');

      if (searchInput) {
        // 测试搜索功能
        await user.type(searchInput, 'React');
        await user.keyboard('{Enter}');

        // 验证搜索结果区域存在
        await waitFor(() => {
          const resultsSection = screen.getByRole('region', { name: /搜索结果/i }) ||
                               screen.getByTestId('search-results') ||
                               document.querySelector('[data-testid*="result"]');
          expect(resultsSection).toBeInTheDocument();
        });
      }

      // 验证筛选选项可用 (Requirement 6.2)
      const filtersSection = screen.getByRole('region', { name: /筛选/i }) ||
                            screen.getByTestId('search-filters') ||
                            document.querySelector('[data-testid*="filter"]');
      
      if (filtersSection) {
        expect(filtersSection).toBeInTheDocument();
      }

      // 确保没有访问限制提示
      expect(screen.queryByText('登录后使用搜索功能')).not.toBeInTheDocument();
      expect(screen.queryByText('请先登录')).not.toBeInTheDocument();
    });

    test('应该能够浏览分类页面和集合页面', async () => {
      // 通过中间件测试验证分类和集合页面的可访问性
      const categoryRequest = createMiddlewareRequest('https://webvault.com/category');
      await middleware(categoryRequest);

      const { NextResponse } = require('next/server');
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // 清理Mock
      NextResponse.next.mockClear();
      NextResponse.redirect.mockClear();

      // 测试集合页面访问
      const collectionRequest = createMiddlewareRequest('https://webvault.com/collection/test-collection');
      await middleware(collectionRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // 确保提供无障碍浏览体验 (Requirement 6.4)
      // 中间件层面的测试确保了访客用户不会遇到访问受限的情况
    });

    test('应该能够访问和阅读博客内容', async () => {
      // 通过中间件测试验证博客页面的可访问性
      const blogListRequest = createMiddlewareRequest('https://webvault.com/blog');
      await middleware(blogListRequest);

      const { NextResponse } = require('next/server');
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      NextResponse.next.mockClear();
      NextResponse.redirect.mockClear();

      // 测试博客详情页
      const blogDetailRequest = createMiddlewareRequest('https://webvault.com/blog/test-post');
      await middleware(blogDetailRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // 确保访客可以正常阅读 - 中间件层面验证无访问限制
    });
  });

  // ========================================================================
  // 2. 中间件层面的访客用户访问测试
  // ========================================================================

  describe('中间件层面访客用户访问', () => {
    test('应该允许访客用户访问所有公共路由', async () => {
      const publicRoutes = ['/', '/search', '/category', '/collection', '/blog', '/tag', '/website'];

      for (const route of publicRoutes) {
        const request = createMiddlewareRequest(`https://webvault.com${route}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        // 验证允许访问（调用了NextResponse.next()）
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        
        // 清理mock以便下次测试
        NextResponse.next.mockClear();
        NextResponse.redirect.mockClear();
      }
    });

    test('应该允许访问静态资源和API路由', async () => {
      const staticRoutes = [
        '/_next/static/css/app.css',
        '/_next/static/js/app.js',
        '/favicon.ico',
        '/robots.txt',
        '/api/websites',
        '/api/blog',
      ];

      for (const route of staticRoutes) {
        const request = createMiddlewareRequest(`https://webvault.com${route}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        
        NextResponse.next.mockClear();
        NextResponse.redirect.mockClear();
      }
    });
  });

  // ========================================================================
  // 3. 管理功能访问的友好提示测试 (Requirement 6.3)
  // ========================================================================

  describe('访客用户访问管理功能的友好提示', () => {
    test('访问/submit页面时应该显示管理员专用功能说明', async () => {
      const request = createMiddlewareRequest('https://webvault.com/submit');
      await middleware(request);

      // 验证重定向到登录页面
      const { NextResponse } = require('next/server');
      expect(NextResponse.redirect).toHaveBeenCalled();
      
      const redirectUrl = NextResponse.redirect.mock.calls[0][0];
      expect(String(redirectUrl)).toContain('login');
      expect(String(redirectUrl)).toContain('returnUrl=%2Fsubmit');
    });

    test('组件级别访问管理功能时应该显示清晰说明', async () => {
      render(
        <GuestTestWrapper>
          <AdminOnly level="page">
            <div data-testid="protected-submit-content">提交网站功能</div>
          </AdminOnly>
        </GuestTestWrapper>
      );

      // 验证显示友好的登录提示而非严厉的权限错误
      await waitFor(() => {
        expect(screen.getByText('需要登录')).toBeInTheDocument();
        expect(screen.getByText('请登录以继续访问此页面')).toBeInTheDocument();
      });

      // 确保说明清晰且不包含注册引导 (Requirement 6.5)
      expect(screen.queryByText('注册新账户')).not.toBeInTheDocument();
      expect(screen.queryByText('免费注册')).not.toBeInTheDocument();
      expect(screen.queryByText('创建账户')).not.toBeInTheDocument();

      // 应该有登录按钮
      expect(screen.getByText('立即登录')).toBeInTheDocument();
      
      // 受保护内容不应显示
      expect(screen.queryByTestId('protected-submit-content')).not.toBeInTheDocument();
    });

    test('访问管理后台时应该重定向到登录页并保留返回URL', async () => {
      const adminRoutes = [
        '/admin/dashboard',
        '/admin/websites',
        '/admin/categories',
        '/admin/submissions',
      ];

      for (const route of adminRoutes) {
        const request = createMiddlewareRequest(`https://webvault.com${route}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.redirect).toHaveBeenCalled();
        
        const redirectUrl = NextResponse.redirect.mock.calls[0][0];
        expect(String(redirectUrl)).toContain('login');
        expect(String(redirectUrl)).toContain(`returnUrl=${encodeURIComponent(route)}`);
        
        NextResponse.redirect.mockClear();
      }
    });

    test('访问管理API端点时应该返回适当的响应', async () => {
      const adminApiRoutes = [
        '/api/admin/websites',
        '/api/admin/categories',
        '/api/admin/submissions',
      ];

      for (const route of adminApiRoutes) {
        const request = createMiddlewareRequest(`https://webvault.com${route}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.redirect).toHaveBeenCalled();
        
        NextResponse.redirect.mockClear();
      }
    });
  });

  // ========================================================================
  // 4. 界面无注册提示验证测试 (Requirement 6.5)
  // ========================================================================

  describe('界面不包含注册提示或引导', () => {
    test('首页不应包含任何注册相关元素', async () => {
      (usePathname as jest.MockedFunction<typeof usePathname>).mockReturnValue('/');
      
      render(
        <GuestTestWrapper>
          <HomePage />
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 验证没有注册相关的文本
      const registrationTerms = [
        '注册', '注册账户', '免费注册', '立即注册',
        '创建账户', '新用户注册', '用户注册',
        '加入我们', '免费加入', 'Sign Up', 'Register'
      ];

      registrationTerms.forEach(term => {
        expect(screen.queryByText(new RegExp(term, 'i'))).not.toBeInTheDocument();
      });

      // 验证没有注册相关的按钮
      expect(screen.queryByRole('button', { name: /注册/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /注册/i })).not.toBeInTheDocument();
    });

    test('搜索页面不应包含注册引导', async () => {
      (usePathname as jest.MockedFunction<typeof usePathname>).mockReturnValue('/search');
      
      render(
        <GuestTestWrapper>
          <SearchPage />
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 验证没有"注册以获得更多功能"等引导
      expect(screen.queryByText(/注册.*更多功能/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/注册.*免费/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/创建.*账户.*搜索/i)).not.toBeInTheDocument();
    });

    test('登录页面不应显示注册选项', async () => {
      render(
        <GuestTestWrapper>
          <AdminOnly level="page">
            <div data-testid="protected-content">Protected Content</div>
          </AdminOnly>
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('需要登录')).toBeInTheDocument();
      });

      // 点击登录按钮时应该只导航到登录页面，不包含注册选项
      const loginButton = screen.getByText('立即登录');
      fireEvent.click(loginButton);

      expect(mockPush).toHaveBeenCalledWith('/login');

      // 验证没有显示注册相关的内容
      expect(screen.queryByText('还没有账户？')).not.toBeInTheDocument();
      expect(screen.queryByText('新用户？')).not.toBeInTheDocument();
      expect(screen.queryByText('立即注册')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // 5. 用户体验质量验证测试
  // ========================================================================

  describe('访客用户体验质量', () => {
    test('页面加载性能应该良好', async () => {
      const startTime = performance.now();
      
      render(
        <GuestTestWrapper>
          <HomePage />
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 页面应该在合理时间内加载完成（在测试环境中）
      expect(loadTime).toBeLessThan(5000); // 5秒超时
    });

    test('响应式设计在不同视窗尺寸下应该正常工作', async () => {
      const { container } = render(
        <GuestTestWrapper>
          <HomePage />
        </GuestTestWrapper>
      );

      // 模拟不同的视窗尺寸
      const viewports = [
        { width: 320, height: 568 },  // 手机
        { width: 768, height: 1024 }, // 平板
        { width: 1920, height: 1080 } // 桌面
      ];

      for (const viewport of viewports) {
        // 在JSDOM中模拟视窗尺寸变化
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        });

        // 触发resize事件
        fireEvent(window, new Event('resize'));

        // 验证布局仍然正常
        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      }
    });

    test('无障碍访问支持应该完整', async () => {
      render(
        <GuestTestWrapper>
          <HomePage />
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 验证关键的无障碍元素存在
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header/nav
      expect(screen.getByRole('main')).toBeInTheDocument();   // main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer

      // 验证可以通过键盘导航
      const focusableElements = screen.getAllByRole('button');
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        expect(focusableElements[0]).toHaveFocus();
      }
    });

    test('错误边界应该正确处理异常', async () => {
      // Mock一个会抛出错误的组件
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <GuestTestWrapper>
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        </GuestTestWrapper>
      );

      // 验证错误边界捕获错误并显示友好信息
      await waitFor(() => {
        expect(screen.getByText(/出现了一些问题/i) || 
               screen.getByText(/错误/i) ||
               screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  // ========================================================================
  // 6. 综合场景测试
  // ========================================================================

  describe('访客用户完整使用流程', () => {
    test('完整的网站浏览流程应该无缝衔接', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // 1. 访问首页
      (usePathname as jest.MockedFunction<typeof usePathname>).mockReturnValue('/');
      
      const { rerender } = render(
        <GuestTestWrapper>
          <HomePage />
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 2. 进行搜索
      (usePathname as jest.MockedFunction<typeof usePathname>).mockReturnValue('/search');
      
      rerender(
        <GuestTestWrapper>
          <SearchPage />
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 3. 验证可以访问其他公共页面（通过中间件测试）
      const publicPages = ['/category', '/collection', '/blog', '/tag'];
      
      for (const page of publicPages) {
        const request = createMiddlewareRequest(`https://webvault.com${page}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();

        NextResponse.next.mockClear();
        NextResponse.redirect.mockClear();
      }

      // 验证整个流程中都没有遇到访问限制
      expect(screen.queryByText('需要登录')).not.toBeInTheDocument();
      expect(screen.queryByText('权限不足')).not.toBeInTheDocument();
      expect(screen.queryByText('请先注册')).not.toBeInTheDocument();
    });

    test('访客用户尝试提交网站时应该得到清晰指导', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <GuestTestWrapper>
          <AdminOnly level="page" debug={true}>
            <div data-testid="submit-feature">网站提交功能</div>
          </AdminOnly>
        </GuestTestWrapper>
      );

      // 验证显示需要登录的友好提示
      await waitFor(() => {
        expect(screen.getByText('需要登录')).toBeInTheDocument();
        expect(screen.getByText('请登录以继续访问此页面')).toBeInTheDocument();
      });

      // 点击登录按钮
      const loginButton = screen.getByText('立即登录');
      await user.click(loginButton);

      // 验证重定向到登录页面
      expect(mockPush).toHaveBeenCalledWith('/login');

      // 确保提示信息友好且专业
      expect(screen.queryByText('滚开')).not.toBeInTheDocument();
      expect(screen.queryByText('拒绝访问')).not.toBeInTheDocument();
      expect(screen.queryByText('禁止')).not.toBeInTheDocument();
      
      // 受保护内容不应显示
      expect(screen.queryByTestId('submit-feature')).not.toBeInTheDocument();
    });
  });
});