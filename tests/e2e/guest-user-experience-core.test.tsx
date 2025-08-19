/**
 * Guest User Experience Core Tests
 * 
 * 访客用户体验核心测试 - 专注于Admin-Only认证系统的核心需求验证
 * 
 * 此测试套件验证管理员专用认证系统不会影响访客用户的基本体验：
 * - 中间件层面确保公共页面可访问
 * - 管理功能的友好权限提示
 * - 无注册引导的界面设计
 * 
 * Requirements验证:
 * - 6.1: 访客用户访问首页时显示完整网站内容，无需登录提示
 * - 6.2: 访客用户使用搜索功能时提供完整搜索结果和筛选选项
 * - 6.3: 访客用户尝试访问管理功能时清晰说明此功能仅限管理员使用
 * - 6.4: 访客用户浏览分类和集合时提供无障碍浏览体验
 * - 6.5: 系统界面不包含注册提示或注册相关的用户引导
 * 
 * @version 1.0.0
 * @created 2025-08-18
 * @author Claude Code (WebVault Admin-Only Auth System)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// 导入认证组件
import { AdminOnly } from '@/features/auth/components/AuthGuard';
import { useAuthStore, useAuthStoreHook } from '@/features/auth/stores/auth-store';

// 导入中间件
import { middleware } from '@/middleware';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock环境变量
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock Supabase client before any imports
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => ({ toString: () => '', get: jest.fn() })),
  redirect: jest.fn(),
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
    next: jest.fn(() => ({ status: 200, type: 'next' })),
  },
}));

// Mock Supabase client for middleware
const mockSupabaseAuth = { getUser: jest.fn() };
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

// Mock认证存储
jest.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
  useAuthStoreHook: jest.fn(),
}));

// Mock UI组件
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, ...props }, ref) => (
    <button ref={ref} onClick={onClick} {...props}>
      {children}
    </button>
  )),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// Test Data & Utilities
// ============================================================================

/**
 * 创建访客用户的Mock状态
 */
const createGuestUserState = () => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  session: null,
  error: null,
  isInitialized: true,
  actions: {
    initialize: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    isAdmin: jest.fn().mockReturnValue(false),
    hasValidAdminSession: jest.fn().mockReturnValue(false),
  },
});

/**
 * 测试包装组件
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
function createMiddlewareRequest(url: string) {
  const mockUrl = new URL(url);
  (mockUrl as any).clone = () => {
    const clonedUrl = new URL(mockUrl.toString());
    (clonedUrl as any).clone = mockUrl.clone;
    return clonedUrl;
  };
  
  return {
    nextUrl: mockUrl,
    url: mockUrl.toString(),
    method: 'GET',
    headers: { get: jest.fn(() => null) },
    cookies: { get: jest.fn(() => undefined) },
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

describe('Guest User Experience Core Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUnauthenticatedMiddleware();
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================================================
  // 1. 核心需求验证: 公共页面无障碍访问 (Requirements 6.1, 6.2, 6.4)
  // ========================================================================

  describe('公共页面访问权限验证', () => {
    test('访客用户应该能够访问所有公共路由 (Requirement 6.1, 6.4)', async () => {
      const publicRoutes = [
        '/',           // 首页 - 完整网站内容
        '/search',     // 搜索功能
        '/category',   // 分类浏览 
        '/collection', // 集合浏览
        '/blog',       // 博客内容
        '/tag',        // 标签页面
        '/website',    // 网站详情
      ];

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

    test('访客用户应该能够访问静态资源和API (Requirement 6.2)', async () => {
      const staticAndApiRoutes = [
        '/_next/static/css/app.css',  // 静态资源
        '/_next/static/js/app.js',
        '/favicon.ico',
        '/robots.txt',
        '/api/websites',              // 公共API - 搜索功能支持
        '/api/blog',
        '/api/categories',
        '/api/tags',
      ];

      for (const route of staticAndApiRoutes) {
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
  // 2. 核心需求验证: 管理功能的友好权限提示 (Requirement 6.3)
  // ========================================================================

  describe('管理功能访问的友好提示', () => {
    test('访问/submit页面时应该友好地重定向到登录页面 (Requirement 6.3)', async () => {
      const request = createMiddlewareRequest('https://webvault.com/submit');
      await middleware(request);

      const { NextResponse } = require('next/server');
      
      // 验证重定向到登录页面
      expect(NextResponse.redirect).toHaveBeenCalled();
      
      const redirectUrl = NextResponse.redirect.mock.calls[0][0];
      expect(String(redirectUrl)).toContain('login');
      expect(String(redirectUrl)).toContain('returnUrl=%2Fsubmit');
    });

    test('访问管理后台时应该保留完整的返回URL参数', async () => {
      const adminRoutes = [
        '/admin/dashboard',
        '/admin/websites', 
        '/admin/categories',
        '/admin/submissions',
      ];

      for (const route of adminRoutes) {
        const request = createMiddlewareRequest(`https://webvault.com${route}?tab=new&filter=active`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.redirect).toHaveBeenCalled();
        
        const redirectUrl = NextResponse.redirect.mock.calls[0][0];
        expect(String(redirectUrl)).toContain('login');
        expect(String(redirectUrl)).toContain('returnUrl=');
        
        NextResponse.redirect.mockClear();
      }
    });

    test('访问管理API时应该正确处理未认证请求', async () => {
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

    test('组件级别的管理功能应该显示友好的登录提示 (Requirement 6.3)', async () => {
      const user = userEvent.setup();
      
      render(
        <GuestTestWrapper>
          <AdminOnly level="page">
            <div data-testid="protected-content">管理功能内容</div>
          </AdminOnly>
        </GuestTestWrapper>
      );

      // 验证显示友好的登录提示
      await waitFor(() => {
        expect(screen.getByText('需要登录')).toBeInTheDocument();
        expect(screen.getByText('请登录以继续访问此页面')).toBeInTheDocument();
      });

      // 应该有登录按钮
      const loginButton = screen.getByText('立即登录');
      expect(loginButton).toBeInTheDocument();

      // 点击登录按钮应该导航到登录页
      await user.click(loginButton);
      expect(mockPush).toHaveBeenCalledWith('/login');

      // 受保护的内容不应该显示
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // 3. 核心需求验证: 界面不包含注册引导 (Requirement 6.5)
  // ========================================================================

  describe('界面不包含注册提示或引导', () => {
    test('访客用户访问管理功能时不应看到任何注册相关引导 (Requirement 6.5)', async () => {
      render(
        <GuestTestWrapper>
          <AdminOnly level="page">
            <div data-testid="admin-feature">管理员专用功能</div>
          </AdminOnly>
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('需要登录')).toBeInTheDocument();
      });

      // 验证没有注册相关的文本或按钮
      const registrationTerms = [
        '注册', '注册账户', '免费注册', '立即注册',
        '创建账户', '新用户注册', '用户注册',
        '加入我们', '免费加入', 'Sign Up', 'Register',
        '还没有账户', '新用户？', '没有账号？'
      ];

      registrationTerms.forEach(term => {
        expect(screen.queryByText(new RegExp(term, 'i'))).not.toBeInTheDocument();
      });

      // 验证没有注册相关的按钮或链接
      expect(screen.queryByRole('button', { name: /注册/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /注册/i })).not.toBeInTheDocument();

      // 确保只显示登录选项
      expect(screen.getByText('立即登录')).toBeInTheDocument();
      expect(screen.queryByText('或注册新账户')).not.toBeInTheDocument();
    });

    test('组件级权限提示应该专注于管理员专用系统说明而非注册引导', async () => {
      render(
        <GuestTestWrapper>
          <AdminOnly level="section">
            <div data-testid="admin-section">管理员工具</div>
          </AdminOnly>
        </GuestTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('管理员权限不足')).toBeInTheDocument();
      });

      // 验证显示Admin-Only系统的说明
      expect(screen.getByText('Admin-Only功能')).toBeInTheDocument();
      expect(screen.getByText(/此功能仅限管理员使用/)).toBeInTheDocument();

      // 确保没有引导用户注册的内容
      expect(screen.queryByText(/注册成为/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/申请账户/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/成为会员/i)).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // 4. 边界条件和错误处理测试
  // ========================================================================

  describe('边界条件和错误处理', () => {
    test('中间件应该正确处理带查询参数的公共路由', async () => {
      const routesWithParams = [
        '/search?q=react&category=tools',
        '/category?type=development&sort=popular', 
        '/blog?tag=tutorial&page=2',
        '/collection?featured=true',
      ];

      for (const route of routesWithParams) {
        const request = createMiddlewareRequest(`https://webvault.com${route}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        
        NextResponse.next.mockClear();
        NextResponse.redirect.mockClear();
      }
    });

    test('中间件应该正确处理网络错误的情况', async () => {
      // Mock网络错误
      mockSupabaseAuth.getUser.mockRejectedValue(new Error('Network error'));

      const request = createMiddlewareRequest('https://webvault.com/submit');
      await middleware(request);

      // 网络错误应该导致重定向到登录页面（安全默认行为）
      const { NextResponse } = require('next/server');
      expect(NextResponse.redirect).toHaveBeenCalled();
      
      const redirectUrl = NextResponse.redirect.mock.calls[0][0];
      expect(String(redirectUrl)).toContain('login');
    });

    test('组件级权限检查应该处理初始化状态', async () => {
      // Mock初始化中的状态
      const initializingState = {
        ...createGuestUserState(),
        isInitialized: false,
        isLoading: true,
      };

      (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue(initializingState);
      (useAuthStoreHook as jest.MockedFunction<typeof useAuthStoreHook>).mockReturnValue({
        ...initializingState,
        isAdminUser: false,
        userName: 'Anonymous',
        userRole: null,
      });

      render(
        <GuestTestWrapper>
          <AdminOnly level="page" showLoading={true}>
            <div data-testid="protected-content">受保护内容</div>
          </AdminOnly>
        </GuestTestWrapper>
      );

      // 应该显示加载状态而不是错误
      expect(screen.getByText('验证身份中')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // 5. 综合场景测试
  // ========================================================================

  describe('访客用户完整体验流程', () => {
    test('访客用户完整的公共内容浏览流程应该无缝', async () => {
      // 模拟访客用户浏览公共内容的完整流程
      const publicContentFlow = [
        '/',              // 1. 访问首页
        '/search',        // 2. 使用搜索功能
        '/category',      // 3. 浏览分类
        '/collection',    // 4. 查看集合
        '/blog',          // 5. 阅读博客
        '/website/123',   // 6. 查看网站详情
      ];

      // 验证每个步骤都能正常访问
      for (const route of publicContentFlow) {
        const request = createMiddlewareRequest(`https://webvault.com${route}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();

        NextResponse.next.mockClear();
        NextResponse.redirect.mockClear();
      }
    });

    test('访客用户偶然访问管理功能时应该得到一致的体验', async () => {
      const managementAttempts = [
        '/submit',
        '/admin/dashboard',
        '/admin/websites',
        '/api/admin/categories',
      ];

      // 每次尝试访问管理功能都应该得到一致的重定向体验
      for (const route of managementAttempts) {
        const request = createMiddlewareRequest(`https://webvault.com${route}`);
        await middleware(request);

        const { NextResponse } = require('next/server');
        expect(NextResponse.redirect).toHaveBeenCalled();
        
        const redirectUrl = NextResponse.redirect.mock.calls[0][0];
        expect(String(redirectUrl)).toContain('login');

        NextResponse.redirect.mockClear();
      }
    });
  });
});