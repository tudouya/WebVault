/**
 * Middleware Route Protection Tests
 * 
 * 测试Next.js中间件的路由保护和权限检查功能，专门针对admin-only-auth-system规范。
 * 验证非认证用户访问受保护路径时的重定向行为、admin角色用户的访问权限以及
 * 公共路由不受影响的正常功能。
 * 
 * Requirements满足:
 * - 3.1: 非认证用户访问/submit页面时重定向到登录页面
 * - 3.2: 认证用户访问/submit页面但角色不是admin时重定向到首页
 * - 3.3: admin角色用户访问/submit页面时允许正常访问
 * - 3.4: 用户会话过期时重定向到登录页面保留returnUrl参数
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

/**
 * @jest-environment jsdom
 */

// ============================================================================
// Mock Setup
// ============================================================================

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock Next.js NextResponse
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

// Import NextResponse after mocking
import { NextResponse } from 'next/server';
const mockRedirect = NextResponse.redirect as jest.MockedFunction<typeof NextResponse.redirect>;
const mockNext = NextResponse.next as jest.MockedFunction<typeof NextResponse.next>;

// Mock Supabase client
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

// Import after mocks are set up
import { middleware } from '@/middleware';

// ============================================================================
// Test Data & Fixtures
// ============================================================================

const mockAdminUser = {
  id: 'admin-user-123',
  email: 'admin@webvault.com',
  email_confirmed_at: '2025-08-18T10:00:00Z',
};

const mockRegularUser = {
  id: 'user-123',
  email: 'user@example.com',
  email_confirmed_at: '2025-08-18T10:00:00Z',
};

const mockAdminProfile = {
  id: 'admin-user-123',
  role: 'admin',
  name: 'Admin User',
};

const mockUserProfile = {
  id: 'user-123',
  role: 'user',
  name: 'Regular User',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 创建模拟的NextRequest对象
 */
function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', headers = {}, cookies = {} } = options;
  const mockUrl = new URL(url);
  
  // 添加clone方法到URL对象
  (mockUrl as any).clone = () => {
    const clonedUrl = new URL(mockUrl.toString());
    // 复制搜索参数
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
 * 设置认证用户Mock
 */
function setupAuthenticatedUser(user: any, profile: any) {
  mockSupabaseAuth.getUser.mockResolvedValue({
    data: { user, error: null }
  });
  mockSupabaseQuery.single.mockResolvedValue({
    data: profile,
    error: null
  });
}

/**
 * 设置未认证用户Mock
 */
function setupUnauthenticatedUser(error = 'No user found') {
  mockSupabaseAuth.getUser.mockResolvedValue({
    data: { user: null, error: { message: error } }
  });
  mockSupabaseQuery.single.mockResolvedValue({
    data: null,
    error: { message: 'No profile found' }
  });
}

/**
 * 设置认证错误Mock
 */
function setupAuthError(error: Error) {
  mockSupabaseAuth.getUser.mockRejectedValue(error);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Middleware Route Protection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  // ========================================================================
  // 1. 非认证用户访问受保护路径测试 (Requirement 3.1)
  // ========================================================================

  describe('非认证用户访问受保护路径', () => {
    test('应该重定向非认证用户访问/submit到登录页面', async () => {
      setupUnauthenticatedUser();

      const request = createMockRequest('https://webvault.com/submit');
      await middleware(request);

      // 验证重定向到登录页面并保留returnUrl
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(String(redirectCall)).toContain('/login');
      expect(String(redirectCall)).toContain('returnUrl=%2Fsubmit');
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('应该重定向非认证用户访问/admin到登录页面', async () => {
      setupUnauthenticatedUser();

      const request = createMockRequest('https://webvault.com/admin/dashboard');
      await middleware(request);

      // 验证重定向到登录页面
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(String(redirectCall)).toContain('/login');
      expect(String(redirectCall)).toContain('returnUrl=%2Fadmin%2Fdashboard');
    });

    test('应该重定向非认证用户访问API管理员路由', async () => {
      setupUnauthenticatedUser();

      const request = createMockRequest('https://webvault.com/api/admin/websites');
      await middleware(request);

      // 验证重定向到登录页面
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(String(redirectCall)).toContain('/login');
      expect(String(redirectCall)).toContain('returnUrl=%2Fapi%2Fadmin%2Fwebsites');
    });

    test('应该处理认证验证时的网络错误', async () => {
      setupAuthError(new Error('Network error'));

      const request = createMockRequest('https://webvault.com/submit');
      await middleware(request);

      // 网络错误时也应该重定向到登录页面
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(String(redirectCall)).toContain('/login');
      
      // 应该记录错误日志
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[Middleware] Session validation error:'),
        expect.any(Error)
      );
    });
  });

  // ========================================================================
  // 2. 认证用户角色权限测试 (Requirement 3.2)
  // ========================================================================

  describe('认证用户角色权限检查', () => {
    test('应该重定向非admin用户访问/submit到首页', async () => {
      setupAuthenticatedUser(mockRegularUser, mockUserProfile);

      const request = createMockRequest('https://webvault.com/submit');
      await middleware(request);

      // 验证重定向到首页
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(String(redirectCall)).toContain('https://webvault.com/');
    });

    test('应该重定向非admin用户访问admin区域到首页', async () => {
      setupAuthenticatedUser(mockRegularUser, mockUserProfile);

      const request = createMockRequest('https://webvault.com/admin/websites');
      await middleware(request);

      // 验证重定向到首页
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(String(redirectCall)).toContain('https://webvault.com/');
    });

    test('应该处理用户档案不存在的情况', async () => {
      // 认证用户但没有档案记录，默认为user角色
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockRegularUser, error: null }
      });
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      });

      const request = createMockRequest('https://webvault.com/submit');
      await middleware(request);

      // 没有档案记录的用户默认为user角色，应该被重定向到首页
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(String(redirectCall)).toContain('https://webvault.com/');
    });

    test('应该记录权限不足的访问日志', async () => {
      setupAuthenticatedUser(mockRegularUser, mockUserProfile);

      const request = createMockRequest('https://webvault.com/admin/dashboard');
      await middleware(request);

      // 验证记录了访问拒绝日志
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[Middleware] Access denied for /admin/dashboard: insufficient role (required: admin, actual: user)')
      );
    });
  });

  // ========================================================================
  // 3. Admin用户正常访问测试 (Requirement 3.3)
  // ========================================================================

  describe('Admin用户正常访问', () => {
    test('应该允许admin用户访问/submit页面', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const request = createMockRequest('https://webvault.com/submit');
      await middleware(request);

      // 验证允许正常访问
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许admin用户访问管理员区域', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const request = createMockRequest('https://webvault.com/admin/dashboard');
      await middleware(request);

      // 验证允许正常访问
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许admin用户访问API管理员路由', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const request = createMockRequest('https://webvault.com/api/admin/websites');
      await middleware(request);

      // 验证允许正常访问
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该验证admin用户会话有效性', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const request = createMockRequest('https://webvault.com/submit');
      await middleware(request);

      // 验证调用了认证验证
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    });
  });

  // ========================================================================
  // 4. 公共路由不受影响测试
  // ========================================================================

  describe('公共路由正常访问', () => {
    test('应该允许访问首页', async () => {
      const request = createMockRequest('https://webvault.com/');
      await middleware(request);

      // 不应该执行认证检查
      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许访问搜索页面', async () => {
      const request = createMockRequest('https://webvault.com/search');
      await middleware(request);

      // 不应该执行认证检查
      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许访问分类页面', async () => {
      const request = createMockRequest('https://webvault.com/category');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许访问集合页面', async () => {
      const request = createMockRequest('https://webvault.com/collection/web-design');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许访问博客页面', async () => {
      const request = createMockRequest('https://webvault.com/blog');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许访问网站详情页面', async () => {
      const request = createMockRequest('https://webvault.com/website/123');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 5. 静态资源和白名单路径测试
  // ========================================================================

  describe('静态资源和白名单路径', () => {
    test('应该跳过Next.js静态资源', async () => {
      const request = createMockRequest('https://webvault.com/_next/static/chunks/main.js');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('应该跳过favicon请求', async () => {
      const request = createMockRequest('https://webvault.com/favicon.ico');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('应该跳过动态图标API', async () => {
      const request = createMockRequest('https://webvault.com/api/favicon');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('应该跳过robots.txt', async () => {
      const request = createMockRequest('https://webvault.com/robots.txt');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 6. 认证路径特殊处理测试
  // ========================================================================

  describe('认证路径特殊处理', () => {
    test('应该重定向已认证用户从/login到管理员仪表盘', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const request = createMockRequest('https://webvault.com/login');
      await middleware(request);

      // 验证重定向到管理员仪表盘
      expect(mockRedirect).toHaveBeenCalledWith(
        'https://webvault.com/admin/dashboard'
      );
    });

    test('应该允许未认证用户访问/login页面', async () => {
      setupUnauthenticatedUser();

      const request = createMockRequest('https://webvault.com/login');
      await middleware(request);

      // 验证允许访问登录页面
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许访问认证回调路径', async () => {
      const request = createMockRequest('https://webvault.com/auth/callback?code=abc123');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('应该允许访问认证API路由', async () => {
      const request = createMockRequest('https://webvault.com/api/auth/login');
      await middleware(request);

      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 7. 会话过期和错误处理测试 (Requirement 3.4)
  // ========================================================================

  describe('会话过期和错误处理', () => {
    test('应该处理会话过期并保留returnUrl参数', async () => {
      setupUnauthenticatedUser('Session expired');

      const request = createMockRequest('https://webvault.com/submit?tab=websites');
      await middleware(request);

      // 验证重定向到登录页面并保留returnUrl（忽略原始查询参数的重复）
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('returnUrl=%2Fsubmit%3Ftab%3Dwebsites')
      );
    });

    test('应该处理Supabase服务不可用错误', async () => {
      setupAuthError(new Error('Service unavailable'));

      const request = createMockRequest('https://webvault.com/admin');
      await middleware(request);

      // 服务不可用时应该重定向到登录页面
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/login')
      );

      // 应该记录错误
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[Middleware] Session validation error:'),
        expect.any(Error)
      );
    });

    test('应该处理档案查询错误', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockRegularUser, error: null }
      });
      mockSupabaseQuery.single.mockRejectedValue(new Error('Database error'));
      
      const request = createMockRequest('https://webvault.com/submit');
      await middleware(request);

      // 档案查询失败应该重定向到登录页面
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/login')
      );
    });
  });

  // ========================================================================
  // 8. 令牌提取和处理测试
  // ========================================================================

  describe('认证令牌提取和处理', () => {
    test('应该从Authorization header提取Bearer token', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const request = createMockRequest('https://webvault.com/submit', {
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      });

      await middleware(request);

      // 验证调用了认证验证
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    });

    test('应该从cookie提取认证token', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const request = createMockRequest('https://webvault.com/submit', {
        cookies: {
          'webvault-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      });

      await middleware(request);

      // 验证调用了认证验证
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    });

    test('应该处理无效的认证token', async () => {
      setupUnauthenticatedUser('Invalid token');

      const request = createMockRequest('https://webvault.com/submit', {
        headers: {
          'authorization': 'Bearer invalid-token',
        },
      });

      await middleware(request);

      // 无效token应该重定向到登录页面
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/login')
      );
    });
  });

  // ========================================================================
  // 9. 路由配置匹配测试
  // ========================================================================

  describe('路由配置匹配', () => {
    test('应该正确匹配/submit路径', async () => {
      const paths = [
        'https://webvault.com/submit',
        'https://webvault.com/submit/',
        'https://webvault.com/submit?tab=websites',
        'https://webvault.com/submit#section',
      ];

      for (const path of paths) {
        setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

        const request = createMockRequest(path);
        await middleware(request);

        // 所有变体都应该触发认证检查
        expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
        
        // 重置mock以便下次测试
        jest.clearAllMocks();
      }
    });

    test('应该正确匹配admin路径模式', async () => {
      const adminPaths = [
        'https://webvault.com/admin',
        'https://webvault.com/admin/',
        'https://webvault.com/admin/dashboard',
        'https://webvault.com/admin/websites',
        'https://webvault.com/admin/categories/123',
      ];

      for (const path of adminPaths) {
        setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

        const request = createMockRequest(path);
        await middleware(request);

        // 所有admin路径都应该触发认证检查
        expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
        
        // 重置mock以便下次测试
        jest.clearAllMocks();
      }
    });

    test('应该处理不匹配任何配置的路径', async () => {
      const request = createMockRequest('https://webvault.com/unknown-path');
      await middleware(request);

      // 不匹配的路径应该被允许访问
      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 10. 边界条件和错误恢复测试
  // ========================================================================

  describe('边界条件和错误恢复', () => {
    test('应该处理并发请求', async () => {
      setupAuthenticatedUser(mockAdminUser, mockAdminProfile);

      const requests = [
        createMockRequest('https://webvault.com/submit'),
        createMockRequest('https://webvault.com/admin/websites'),
        createMockRequest('https://webvault.com/api/admin/categories'),
      ];

      // 并发执行中间件
      const responses = await Promise.all(
        requests.map(req => middleware(req))
      );

      // 所有请求都应该成功处理
      expect(responses).toHaveLength(3);
      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    test('应该处理环境变量缺失错误', async () => {
      // 临时删除环境变量
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const request = createMockRequest('https://webvault.com/submit');

      // 缺少环境变量时应该抛出错误或重定向
      // 在实际测试中，中间件可能会在Supabase客户端创建时失败，或在会话验证时失败
      try {
        await middleware(request);
        // 如果没有抛出错误，应该至少重定向到登录页面
        expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('/login'));
      } catch (error) {
        // 或者抛出环境变量缺失错误
        expect(error.message).toContain('Missing Supabase environment variables');
      }
      
      // 恢复环境变量
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    test('应该正确处理复杂的查询参数', async () => {
      setupUnauthenticatedUser();

      const request = createMockRequest('https://webvault.com/submit?category=web-design&page=2&sort=newest#top');
      await middleware(request);

      // 验证重定向保留了完整的原始路径（忽略原始查询参数的重复）
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('returnUrl=%2Fsubmit%3Fcategory%3Dweb-design%26page%3D2%26sort%3Dnewest')
      );
    });
  });
});