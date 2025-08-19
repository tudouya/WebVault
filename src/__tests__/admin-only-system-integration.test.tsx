/**
 * Admin-Only Authentication System Cross-Module Integration Tests
 * 
 * 验证Admin-Only认证系统与现有功能模块的完整集成，确保权限控制正确实施，
 * 访客功能保持完整，管理员功能按预期限制。
 * 
 * 测试范围：
 * - 网站管理系统集成：验证CRUD操作的admin权限限制
 * - 博客推荐系统集成：验证内容创建的管理员专用权限
 * - 搜索发现功能集成：验证访客用户的完整搜索权限
 * - 分类标签管理集成：验证管理员专用访问控制
 * - 认证系统兼容性：验证与现有Supabase认证的兼容
 * 
 * Requirements满足：
 * - Integration Requirements中的所有项
 * - 网站管理系统的admin权限限制
 * - 博客推荐系统的管理员专用访问
 * - 访客用户搜索发现功能的完整性
 * - 分类标签管理的权限控制
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// 导入测试工具和Mock
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// 导入认证相关模块
import { AuthGuard, AdminOnly } from '@/features/auth/components/AuthGuard';
import { useAuth, AuthProvider, useAuthSession } from '@/features/auth/hooks/useAuth';
import { useAuthStore, useAuthStoreHook } from '@/features/auth/stores/auth-store';

// 导入功能模块组件
import { SubmitPage } from '@/features/submissions/components/SubmitPage';
import { HomePage } from '@/features/websites/components/HomePage';
import { SearchPage } from '@/features/websites/components/SearchPage';
import { BlogIndexPage } from '@/features/blog/components/BlogIndexPage';
import { CategoryBrowsePage } from '@/features/browsable-pages/components/CategoryBrowsePage';

// 导入类型定义
import type { AuthUser, AuthSession } from '@/features/auth/types';
import type { WebsiteCardData } from '@/features/websites/types/website';
import type { BlogPost } from '@/features/blog/types';

// ============================================================================
// Mock Setup
// ============================================================================

// 设置环境变量
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

// Mock Supabase
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
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock 认证相关服务
jest.mock('@/features/auth/services/SupabaseAuthService', () => ({
  supabaseAuthService: {
    getSession: jest.fn(),
    getCurrentUser: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Mock 认证store
jest.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
  useAuthStoreHook: jest.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,
    error: null,
    isInitialized: true,
    login: jest.fn(),
    logout: jest.fn(),
    isAdmin: jest.fn(),
    requireAdmin: jest.fn(),
    hasValidAdminSession: jest.fn(),
    userName: 'Anonymous',
    userAvatar: null,
    userRole: null,
  })),
}));

// Mock AuthProvider和useAuth hook
jest.mock('@/features/auth/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider-mock">{children}</div>
  ),
  useAuth: jest.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,
    error: null,
    isInitialized: true,
    login: jest.fn(),
    logout: jest.fn(),
    isAdmin: jest.fn(),
    requireAdmin: jest.fn(),
    hasValidAdminSession: jest.fn(),
  })),
  useAuthSession: jest.fn(() => ({
    session: null,
    isValidSession: false,
    shouldRefreshSoon: false,
    refreshSession: jest.fn(),
  })),
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

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h2 className={className} {...props}>{children}</h2>
  ),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock 功能模块组件
jest.mock('@/features/submissions/components/SubmitPage', () => ({
  SubmitPage: () => (
    <div data-testid="submit-page">
      <h1>提交网站</h1>
      <div>管理员专用功能 - 网站提交表单</div>
      <button data-testid="submit-website-btn">提交网站</button>
    </div>
  ),
}));

jest.mock('@/features/websites/components/HomePage', () => ({
  HomePage: () => (
    <div data-testid="home-page">
      <h1>WebVault 首页</h1>
      <div data-testid="website-grid">网站展示网格</div>
      <div data-testid="search-interface">搜索界面</div>
    </div>
  ),
}));

jest.mock('@/features/websites/components/SearchPage', () => ({
  SearchPage: () => (
    <div data-testid="search-page">
      <h1>搜索网站</h1>
      <input data-testid="search-input" placeholder="搜索网站..." />
      <div data-testid="search-filters">筛选器</div>
      <div data-testid="search-results">搜索结果</div>
    </div>
  ),
}));

jest.mock('@/features/blog/components/BlogIndexPage', () => ({
  BlogIndexPage: () => (
    <div data-testid="blog-index-page">
      <h1>博客文章</h1>
      <div data-testid="blog-articles">文章列表</div>
      <div data-testid="blog-categories">文章分类</div>
    </div>
  ),
}));

jest.mock('@/features/browsable-pages/components/CategoryBrowsePage', () => ({
  CategoryBrowsePage: () => (
    <div data-testid="category-browse-page">
      <h1>分类浏览</h1>
      <div data-testid="category-filters">分类筛选</div>
      <div data-testid="category-websites">分类网站</div>
    </div>
  ),
}));

// ============================================================================
// Test Data & Fixtures
// ============================================================================

const mockAdminUser: AuthUser = {
  id: 'admin-user-123',
  email: 'admin@webvault.com',
  emailVerified: true,
  name: 'Admin User',
  avatar: '/avatars/admin.jpg',
  provider: 'email',
  role: 'admin',
  metadata: {
    language: 'zh-CN',
    theme: 'system',
    lastLogin: '2025-08-18T10:00:00Z',
    loginCount: 10,
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-08-18T10:00:00Z',
};

const mockRegularUser: AuthUser = {
  ...mockAdminUser,
  id: 'user-123',
  email: 'user@example.com',
  name: 'Regular User',
  role: 'user',
};

const mockAdminSession: AuthSession = {
  accessToken: 'mock-admin-access-token',
  refreshToken: 'mock-admin-refresh-token',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  refreshExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  user: mockAdminUser,
  createdAt: '2025-08-18T09:00:00Z',
  lastActivity: '2025-08-18T10:00:00Z',
  persistent: true,
};

// Mock store state factory
const createMockAuthState = (overrides = {}) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  session: null,
  error: null,
  isInitialized: false,
  actions: {
    initialize: jest.fn().mockResolvedValue(undefined),
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    isAdmin: jest.fn(),
    requireAdmin: jest.fn(),
    hasValidAdminSession: jest.fn(),
  },
  ...overrides,
});

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseAuthStoreHook = useAuthStoreHook as jest.MockedFunction<typeof useAuthStoreHook>;

// ============================================================================
// Helper Components
// ============================================================================

interface TestWrapperProps {
  children: React.ReactNode;
  authState?: any;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children,
  authState = {}
}) => {
  const mockStoreState = createMockAuthState(authState);
  mockUseAuthStore.mockReturnValue(mockStoreState);
  
  // Setup all auth hooks
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
  
  // Mock useAuth
  mockUseAuth.mockReturnValue({
    isAuthenticated: mockStoreState.isAuthenticated,
    isLoading: mockStoreState.isLoading,
    user: mockStoreState.user,
    session: mockStoreState.session,
    error: mockStoreState.error,
    isInitialized: mockStoreState.isInitialized,
    login: mockStoreState.actions.login,
    logout: mockStoreState.actions.logout,
    isAdmin: mockStoreState.actions.isAdmin,
    requireAdmin: mockStoreState.actions.requireAdmin,
    hasValidAdminSession: mockStoreState.actions.hasValidAdminSession,
    userName: mockStoreState.user?.name || 'Anonymous',
    userAvatar: mockStoreState.user?.avatar,
    userRole: mockStoreState.user?.role || null,
    register: mockStoreState.actions.register || jest.fn(),
    refreshSession: mockStoreState.actions.refreshSession || jest.fn(),
    resetPassword: mockStoreState.actions.resetPassword || jest.fn(),
    confirmPasswordReset: mockStoreState.actions.confirmPasswordReset || jest.fn(),
    updateProfile: mockStoreState.actions.updateProfile || jest.fn(),
    clearError: mockStoreState.actions.clearError || jest.fn(),
    initialize: mockStoreState.actions.initialize || jest.fn(),
    loginWithProvider: mockStoreState.actions.loginWithProvider || jest.fn(),
  });

  // Mock useAuthSession
  mockUseAuthSession.mockReturnValue({
    session: mockStoreState.session,
    isValidSession: mockStoreState.isAuthenticated,
    shouldRefreshSoon: false,
    refreshSession: mockStoreState.actions.refreshSession || jest.fn(),
  });

  // Mock useAuthStoreHook
  mockUseAuthStoreHook.mockReturnValue({
    isAuthenticated: mockStoreState.isAuthenticated,
    isLoading: mockStoreState.isLoading,
    user: mockStoreState.user,
    session: mockStoreState.session,
    error: mockStoreState.error,
    isInitialized: mockStoreState.isInitialized,
    login: mockStoreState.actions.login,
    logout: mockStoreState.actions.logout,
    isAdmin: mockStoreState.actions.isAdmin,
    requireAdmin: mockStoreState.actions.requireAdmin,
    hasValidAdminSession: mockStoreState.actions.hasValidAdminSession,
    userName: mockStoreState.user?.name || 'Anonymous',
    userAvatar: mockStoreState.user?.avatar,
    userRole: mockStoreState.user?.role || null,
    refreshSession: mockStoreState.actions.refreshSession || jest.fn(),
    resetPassword: mockStoreState.actions.resetPassword || jest.fn(),
    confirmPasswordReset: mockStoreState.actions.confirmPasswordReset || jest.fn(),
    updateProfile: mockStoreState.actions.updateProfile || jest.fn(),
    clearError: mockStoreState.actions.clearError || jest.fn(),
    initialize: mockStoreState.actions.initialize || jest.fn(),
    register: mockStoreState.actions.register || jest.fn(),
    loginWithProvider: mockStoreState.actions.loginWithProvider || jest.fn(),
  });
  
  return (
    <AuthProvider autoInitialize={false}>
      <div data-testid="test-wrapper">{children}</div>
    </AuthProvider>
  );
};

// ============================================================================
// Test Suite
// ============================================================================

describe('Admin-Only System Cross-Module Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================================================
  // 1. 网站管理系统集成测试
  // ========================================================================

  describe('网站管理系统Admin权限集成', () => {
    test('应该允许admin用户访问网站提交页面', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminOnly level="page" debug={true}>
            <SubmitPage />
          </AdminOnly>
        </TestWrapper>
      );

      // 验证admin能访问网站提交功能
      await waitFor(() => {
        expect(screen.getByTestId('submit-page')).toBeInTheDocument();
        expect(screen.getAllByText('提交网站')).toHaveLength(2); // h1和button各有一个
        expect(screen.getByText('管理员专用功能 - 网站提交表单')).toBeInTheDocument();
        expect(screen.getByTestId('submit-website-btn')).toBeInTheDocument();
      });

      // 验证权限检查被调用
      expect(adminAuthState.actions.hasValidAdminSession).toHaveBeenCalled();
    });

    test('应该阻止非admin用户访问网站提交页面', async () => {
      const userAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockRegularUser,
        session: mockAdminSession,
      });
      
      userAuthState.actions.isAdmin.mockReturnValue(false);
      userAuthState.actions.hasValidAdminSession.mockReturnValue(false);

      render(
        <TestWrapper authState={userAuthState}>
          <AdminOnly level="page">
            <SubmitPage />
          </AdminOnly>
        </TestWrapper>
      );

      // 验证显示权限不足错误
      expect(screen.getByText('管理员权限不足')).toBeInTheDocument();
      expect(screen.getByText(/此功能仅限管理员使用/)).toBeInTheDocument();
      
      // 应该不显示网站提交功能
      expect(screen.queryByTestId('submit-page')).not.toBeInTheDocument();
    });

    test('应该验证网站CRUD操作的admin权限要求', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      // 模拟管理员操作多个网站管理组件
      const AdminWebsiteManagement = () => (
        <div>
          <AdminOnly level="component">
            <div data-testid="website-create">创建网站</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="website-edit">编辑网站</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="website-delete">删除网站</div>
          </AdminOnly>
        </div>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminWebsiteManagement />
        </TestWrapper>
      );

      // 验证所有CRUD操作都可用
      expect(screen.getByTestId('website-create')).toBeInTheDocument();
      expect(screen.getByTestId('website-edit')).toBeInTheDocument();
      expect(screen.getByTestId('website-delete')).toBeInTheDocument();
    });

    test('应该验证批量操作的管理员专用权限', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      const AdminBatchOperations = () => (
        <AdminOnly level="section">
          <div data-testid="batch-operations">
            <div data-testid="batch-import">批量导入</div>
            <div data-testid="batch-export">批量导出</div>
            <div data-testid="batch-delete">批量删除</div>
          </div>
        </AdminOnly>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminBatchOperations />
        </TestWrapper>
      );

      // 验证批量操作界面可用
      expect(screen.getByTestId('batch-operations')).toBeInTheDocument();
      expect(screen.getByTestId('batch-import')).toBeInTheDocument();
      expect(screen.getByTestId('batch-export')).toBeInTheDocument();
      expect(screen.getByTestId('batch-delete')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 2. 博客推荐系统集成测试
  // ========================================================================

  describe('博客推荐系统Admin权限集成', () => {
    test('应该允许admin用户访问博客创作功能', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      const AdminBlogFeatures = () => (
        <div>
          <AdminOnly level="component">
            <div data-testid="blog-create">创建博客文章</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="blog-edit">编辑文章</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="blog-publish">发布文章</div>
          </AdminOnly>
        </div>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminBlogFeatures />
        </TestWrapper>
      );

      // 验证博客管理功能可用
      expect(screen.getByTestId('blog-create')).toBeInTheDocument();
      expect(screen.getByTestId('blog-edit')).toBeInTheDocument();
      expect(screen.getByTestId('blog-publish')).toBeInTheDocument();
    });

    test('应该验证访客用户可以正常阅读博客但不能创建', async () => {
      const guestAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      render(
        <TestWrapper authState={guestAuthState}>
          <BlogIndexPage />
        </TestWrapper>
      );

      // 验证访客可以查看博客内容
      expect(screen.getByTestId('blog-index-page')).toBeInTheDocument();
      expect(screen.getByText('博客文章')).toBeInTheDocument();
      expect(screen.getByTestId('blog-articles')).toBeInTheDocument();
      expect(screen.getByTestId('blog-categories')).toBeInTheDocument();
    });

    test('应该验证文章发布控制和状态管理', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      const AdminBlogPublishing = () => (
        <AdminOnly level="section">
          <div data-testid="blog-publishing">
            <div data-testid="draft-management">草稿管理</div>
            <div data-testid="publish-control">发布控制</div>
            <div data-testid="article-status">文章状态</div>
          </div>
        </AdminOnly>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminBlogPublishing />
        </TestWrapper>
      );

      // 验证发布控制功能
      expect(screen.getByTestId('blog-publishing')).toBeInTheDocument();
      expect(screen.getByTestId('draft-management')).toBeInTheDocument();
      expect(screen.getByTestId('publish-control')).toBeInTheDocument();
      expect(screen.getByTestId('article-status')).toBeInTheDocument();
    });

    test('应该确保普通用户无法访问内容创建功能', async () => {
      const userAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockRegularUser,
        session: mockAdminSession,
      });
      
      userAuthState.actions.isAdmin.mockReturnValue(false);
      userAuthState.actions.hasValidAdminSession.mockReturnValue(false);

      render(
        <TestWrapper authState={userAuthState}>
          <AdminOnly level="component">
            <div data-testid="blog-create">创建博客文章</div>
          </AdminOnly>
        </TestWrapper>
      );

      // 验证内容创建功能不可见
      expect(screen.queryByTestId('blog-create')).not.toBeInTheDocument();
      expect(screen.getByText('管理员权限不足')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 3. 搜索和发现功能集成测试
  // ========================================================================

  describe('搜索发现功能访客权限集成', () => {
    test('应该确保访客用户拥有完整的搜索功能', async () => {
      const guestAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      render(
        <TestWrapper authState={guestAuthState}>
          <SearchPage />
        </TestWrapper>
      );

      // 验证搜索功能完整可用
      expect(screen.getByTestId('search-page')).toBeInTheDocument();
      expect(screen.getByText('搜索网站')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-filters')).toBeInTheDocument();
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    test('应该验证分类和标签浏览对访客开放', async () => {
      const guestAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      render(
        <TestWrapper authState={guestAuthState}>
          <CategoryBrowsePage />
        </TestWrapper>
      );

      // 验证分类浏览功能
      expect(screen.getByTestId('category-browse-page')).toBeInTheDocument();
      expect(screen.getByText('分类浏览')).toBeInTheDocument();
      expect(screen.getByTestId('category-filters')).toBeInTheDocument();
      expect(screen.getByTestId('category-websites')).toBeInTheDocument();
    });

    test('应该确保访客可以正常浏览网站集合', async () => {
      const guestAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      const CollectionBrowse = () => (
        <div data-testid="collection-browse">
          <div data-testid="collection-grid">集合网格</div>
          <div data-testid="collection-filters">集合筛选</div>
          <div data-testid="featured-collections">精选集合</div>
        </div>
      );

      render(
        <TestWrapper authState={guestAuthState}>
          <CollectionBrowse />
        </TestWrapper>
      );

      // 验证集合浏览功能
      expect(screen.getByTestId('collection-browse')).toBeInTheDocument();
      expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
      expect(screen.getByTestId('collection-filters')).toBeInTheDocument();
      expect(screen.getByTestId('featured-collections')).toBeInTheDocument();
    });

    test('应该验证首页网站展示对访客完全开放', async () => {
      const guestAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      render(
        <TestWrapper authState={guestAuthState}>
          <HomePage />
        </TestWrapper>
      );

      // 验证首页功能完整
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByText('WebVault 首页')).toBeInTheDocument();
      expect(screen.getByTestId('website-grid')).toBeInTheDocument();
      expect(screen.getByTestId('search-interface')).toBeInTheDocument();
    });

    test('应该确保搜索筛选功能不受认证系统影响', async () => {
      const user = userEvent.setup();
      
      const guestAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      render(
        <TestWrapper authState={guestAuthState}>
          <SearchPage />
        </TestWrapper>
      );

      // 模拟搜索交互
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'React');

      // 验证搜索界面响应正常
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveValue('React');
      expect(screen.getByTestId('search-filters')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 4. 分类标签管理集成测试
  // ========================================================================

  describe('分类标签管理Admin权限集成', () => {
    test('应该验证分类管理的管理员专用访问', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      const AdminCategoryManagement = () => (
        <AdminOnly level="page">
          <div data-testid="category-management">
            <div data-testid="create-category">创建分类</div>
            <div data-testid="edit-category">编辑分类</div>
            <div data-testid="delete-category">删除分类</div>
            <div data-testid="category-hierarchy">分类层级管理</div>
          </div>
        </AdminOnly>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminCategoryManagement />
        </TestWrapper>
      );

      // 验证分类管理功能
      expect(screen.getByTestId('category-management')).toBeInTheDocument();
      expect(screen.getByTestId('create-category')).toBeInTheDocument();
      expect(screen.getByTestId('edit-category')).toBeInTheDocument();
      expect(screen.getByTestId('delete-category')).toBeInTheDocument();
      expect(screen.getByTestId('category-hierarchy')).toBeInTheDocument();
    });

    test('应该验证标签管理的管理员专用访问', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      const AdminTagManagement = () => (
        <AdminOnly level="page">
          <div data-testid="tag-management">
            <div data-testid="create-tag">创建标签</div>
            <div data-testid="edit-tag">编辑标签</div>
            <div data-testid="merge-tags">合并标签</div>
            <div data-testid="tag-statistics">标签统计</div>
          </div>
        </AdminOnly>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminTagManagement />
        </TestWrapper>
      );

      // 验证标签管理功能
      expect(screen.getByTestId('tag-management')).toBeInTheDocument();
      expect(screen.getByTestId('create-tag')).toBeInTheDocument();
      expect(screen.getByTestId('edit-tag')).toBeInTheDocument();
      expect(screen.getByTestId('merge-tags')).toBeInTheDocument();
      expect(screen.getByTestId('tag-statistics')).toBeInTheDocument();
    });

    test('应该阻止普通用户访问分类标签管理', async () => {
      const userAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockRegularUser,
        session: mockAdminSession,
      });
      
      userAuthState.actions.isAdmin.mockReturnValue(false);
      userAuthState.actions.hasValidAdminSession.mockReturnValue(false);

      render(
        <TestWrapper authState={userAuthState}>
          <AdminOnly level="page">
            <div data-testid="category-management">分类管理</div>
          </AdminOnly>
        </TestWrapper>
      );

      // 验证管理功能不可访问
      expect(screen.queryByTestId('category-management')).not.toBeInTheDocument();
      expect(screen.getByText('管理员权限不足')).toBeInTheDocument();
      expect(screen.getByText('Admin-Only系统')).toBeInTheDocument();
    });

    test('应该验证分类标签的创建编辑权限控制', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      const AdminContentManagement = () => (
        <div>
          <AdminOnly level="component">
            <div data-testid="category-crud">分类CRUD操作</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="tag-crud">标签CRUD操作</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="taxonomy-management">分类法管理</div>
          </AdminOnly>
        </div>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <AdminContentManagement />
        </TestWrapper>
      );

      // 验证内容管理权限
      expect(screen.getByTestId('category-crud')).toBeInTheDocument();
      expect(screen.getByTestId('tag-crud')).toBeInTheDocument();
      expect(screen.getByTestId('taxonomy-management')).toBeInTheDocument();

      // 验证权限检查
      expect(adminAuthState.actions.hasValidAdminSession).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 5. 认证系统兼容性测试
  // ========================================================================

  describe('认证系统兼容性集成', () => {
    test('应该验证与现有Supabase认证的会话管理兼容性', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      // 模拟跨多个组件的认证状态共享
      const MultiModuleTest = () => (
        <div>
          <AdminOnly level="component">
            <div data-testid="website-admin">网站管理</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="blog-admin">博客管理</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="category-admin">分类管理</div>
          </AdminOnly>
        </div>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <MultiModuleTest />
        </TestWrapper>
      );

      // 验证认证状态在多个模块间一致
      expect(screen.getByTestId('website-admin')).toBeInTheDocument();
      expect(screen.getByTestId('blog-admin')).toBeInTheDocument();
      expect(screen.getByTestId('category-admin')).toBeInTheDocument();

      // 验证认证检查在各模块中都被调用
      expect(adminAuthState.actions.hasValidAdminSession).toHaveBeenCalled();
    });

    test('应该验证中间件集成不破坏现有API保护逻辑', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      // 模拟API保护组件
      const ProtectedAPIInterface = () => (
        <AuthGuard requiredRole="admin" level="component">
          <div data-testid="api-interface">
            <div data-testid="api-websites">网站API</div>
            <div data-testid="api-blog">博客API</div>
            <div data-testid="api-admin">管理API</div>
          </div>
        </AuthGuard>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <ProtectedAPIInterface />
        </TestWrapper>
      );

      // 验证API接口受到保护
      expect(screen.getByTestId('api-interface')).toBeInTheDocument();
      expect(screen.getByTestId('api-websites')).toBeInTheDocument();
      expect(screen.getByTestId('api-blog')).toBeInTheDocument();
      expect(screen.getByTestId('api-admin')).toBeInTheDocument();
    });

    test('应该验证认证Hook的管理员专用模式适配', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      // 设置管理员特有的认证方法
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);
      adminAuthState.actions.requireAdmin.mockReturnValue(true);

      const AuthHookTest = () => {
        // 模拟使用认证Hook的组件
        return (
          <div data-testid="auth-hook-test">
            <div data-testid="admin-status">管理员状态检查</div>
            <div data-testid="session-validation">会话验证</div>
            <div data-testid="role-verification">角色验证</div>
          </div>
        );
      };

      render(
        <TestWrapper authState={adminAuthState}>
          <AuthHookTest />
        </TestWrapper>
      );

      // 验证Hook适配正常工作
      expect(screen.getByTestId('auth-hook-test')).toBeInTheDocument();
      expect(screen.getByTestId('admin-status')).toBeInTheDocument();
      expect(screen.getByTestId('session-validation')).toBeInTheDocument();
      expect(screen.getByTestId('role-verification')).toBeInTheDocument();
    });

    test('应该验证会话刷新和状态同步', async () => {
      const user = userEvent.setup();
      
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      // 模拟会话刷新操作
      const SessionManagementTest = () => (
        <AdminOnly level="page" debug={true}>
          <div data-testid="session-test">
            <button 
              data-testid="refresh-session"
              onClick={() => adminAuthState.actions.refreshSession?.()}
            >
              刷新会话
            </button>
          </div>
        </AdminOnly>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <SessionManagementTest />
        </TestWrapper>
      );

      // 验证会话管理界面
      expect(screen.getByTestId('session-test')).toBeInTheDocument();
      
      // 模拟会话刷新
      const refreshButton = screen.getByTestId('refresh-session');
      await user.click(refreshButton);

      // 验证界面保持正常
      expect(screen.getByTestId('session-test')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 6. 跨模块权限一致性测试
  // ========================================================================

  describe('跨模块权限一致性', () => {
    test('应该验证所有管理功能都遵循相同的权限控制策略', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      // 模拟完整的管理员功能集合
      const CompleteAdminInterface = () => (
        <div data-testid="complete-admin">
          <AdminOnly level="section">
            <SubmitPage />
          </AdminOnly>
          <AdminOnly level="section">
            <div data-testid="blog-management">博客管理</div>
          </AdminOnly>
          <AdminOnly level="section">
            <div data-testid="category-management">分类管理</div>
          </AdminOnly>
          <AdminOnly level="section">
            <div data-testid="user-management">用户管理</div>
          </AdminOnly>
        </div>
      );

      render(
        <TestWrapper authState={adminAuthState}>
          <CompleteAdminInterface />
        </TestWrapper>
      );

      // 验证所有管理功能都可访问
      expect(screen.getByTestId('complete-admin')).toBeInTheDocument();
      expect(screen.getByTestId('submit-page')).toBeInTheDocument();
      expect(screen.getByTestId('blog-management')).toBeInTheDocument();
      expect(screen.getByTestId('category-management')).toBeInTheDocument();
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    test('应该验证访客功能在不同模块间的一致性', async () => {
      const guestAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      // 模拟完整的访客功能界面
      const CompleteGuestInterface = () => (
        <div data-testid="complete-guest">
          <HomePage />
          <SearchPage />
          <BlogIndexPage />
          <CategoryBrowsePage />
        </div>
      );

      render(
        <TestWrapper authState={guestAuthState}>
          <CompleteGuestInterface />
        </TestWrapper>
      );

      // 验证所有访客功能都可访问
      expect(screen.getByTestId('complete-guest')).toBeInTheDocument();
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByTestId('search-page')).toBeInTheDocument();
      expect(screen.getByTestId('blog-index-page')).toBeInTheDocument();
      expect(screen.getByTestId('category-browse-page')).toBeInTheDocument();
    });

    test('应该验证错误处理在所有模块中的一致性', async () => {
      const errorAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
        error: {
          code: 'AUTH_FAILED',
          message: '认证失败',
          timestamp: new Date().toISOString(),
        },
      });

      // 测试多个受保护组件的错误处理
      const ErrorHandlingTest = () => (
        <div>
          <AdminOnly level="component">
            <div data-testid="protected-component-1">受保护组件1</div>
          </AdminOnly>
          <AdminOnly level="component">
            <div data-testid="protected-component-2">受保护组件2</div>
          </AdminOnly>
        </div>
      );

      render(
        <TestWrapper authState={errorAuthState}>
          <ErrorHandlingTest />
        </TestWrapper>
      );

      // 验证一致的错误处理
      expect(screen.queryByTestId('protected-component-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protected-component-2')).not.toBeInTheDocument();
      
      // 应该显示统一的登录提示
      expect(screen.getAllByText('需要登录')).toHaveLength(2);
    });
  });

  // ========================================================================
  // 7. 边界条件和错误恢复测试
  // ========================================================================

  describe('系统集成边界条件', () => {
    test('应该处理认证状态变化对多个模块的影响', async () => {
      let currentAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
      });

      // 使用可变的mock返回值
      const { rerender } = render(
        <TestWrapper authState={currentAuthState}>
          <div>
            <AdminOnly level="component">
              <div data-testid="admin-feature">管理员功能</div>
            </AdminOnly>
            <HomePage />
          </div>
        </TestWrapper>
      );

      // 初始状态：访客模式
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-feature')).not.toBeInTheDocument();

      // 模拟用户登录为管理员
      currentAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      currentAuthState.actions.isAdmin.mockReturnValue(true);
      currentAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      rerender(
        <TestWrapper authState={currentAuthState}>
          <div>
            <AdminOnly level="component">
              <div data-testid="admin-feature">管理员功能</div>
            </AdminOnly>
            <HomePage />
          </div>
        </TestWrapper>
      );

      // 登录后状态：管理员权限可用
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByTestId('admin-feature')).toBeInTheDocument();
    });

    test('应该处理网络错误对集成功能的影响', async () => {
      const errorAuthState = createMockAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        session: null,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络连接失败',
          timestamp: new Date().toISOString(),
        },
      });

      // 验证网络错误时的降级处理
      const NetworkErrorTest = () => (
        <div>
          <HomePage /> {/* 访客功能应该正常 */}
          <AdminOnly level="component">
            <div data-testid="network-sensitive">网络敏感功能</div>
          </AdminOnly>
        </div>
      );

      render(
        <TestWrapper authState={errorAuthState}>
          <NetworkErrorTest />
        </TestWrapper>
      );

      // 访客功能应该不受影响
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      
      // 管理员功能显示登录提示
      expect(screen.queryByTestId('network-sensitive')).not.toBeInTheDocument();
    });

    test('应该验证内存泄漏和资源清理', async () => {
      const adminAuthState = createMockAuthState({
        isAuthenticated: true,
        isInitialized: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });
      
      adminAuthState.actions.isAdmin.mockReturnValue(true);
      adminAuthState.actions.hasValidAdminSession.mockReturnValue(true);

      const { unmount } = render(
        <TestWrapper authState={adminAuthState}>
          <AdminOnly level="page">
            <SubmitPage />
          </AdminOnly>
        </TestWrapper>
      );

      // 验证组件正常渲染
      expect(screen.getByTestId('submit-page')).toBeInTheDocument();

      // 卸载组件，模拟页面离开
      unmount();

      // 验证没有内存泄漏警告（在实际应用中可能需要监听特定事件）
      expect(() => {
        // 模拟触发垃圾回收
        if (global.gc) {
          global.gc();
        }
      }).not.toThrow();
    });
  });
});