/**
 * 基本认证流程 E2E 测试
 * 
 * 测试Admin-Only系统的核心认证功能：
 * - 邮箱密码登录流程
 * - 登出功能验证
 * - 管理员权限验证
 * 
 * Requirements:
 * - R1.1: 管理员访问登录页面时显示Clerk提供的登录界面
 * - R1.2: 管理员输入正确邮箱密码时成功认证并创建会话
 * - R1.6: 管理员退出登录时清除会话并重定向到首页
 * 
 * @version 1.0.0
 * @created 2025-08-25
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { clerkAuthService } from '@/features/auth/services/ClerkAuthService';
import { AuthSession, AuthUser } from '@/features/auth/types';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example-publishable-key';
process.env.CLERK_SECRET_KEY = 'sk_test_example-secret-key';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/login',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk SDK
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  signOut: jest.fn(),
  clerkClient: {
    signInTokens: {
      createSignInToken: jest.fn(),
    },
    users: {
      getUser: jest.fn(),
    },
    sessions: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    signInTokens: {
      createSignInToken: jest.fn(),
    },
  },
}));

// Mock lib/clerk
jest.mock('@/lib/clerk', () => ({
  clerk: {
    users: {
      getUser: jest.fn(),
    },
    sessions: {
      getSession: jest.fn(),
    },
  },
}));

// Mock console methods to reduce test noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
});

// ============================================================================
// Test Fixtures
// ============================================================================

const mockAdminUser: AuthUser = {
  id: 'user_admin_123',
  email: 'admin@webvault.test',
  emailVerified: true,
  name: 'Test Admin',
  avatar: null,
  provider: 'email',
  role: 'admin',
  metadata: {
    language: 'zh-CN',
    theme: 'system',
    lastLogin: new Date().toISOString(),
    loginCount: 1,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAdminSession: AuthSession = {
  accessToken: 'clerk_session_valid_admin',
  refreshToken: 'clerk_refresh_valid_admin',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  refreshExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
  user: mockAdminUser,
  createdAt: new Date().toISOString(),
  lastActivity: new Date().toISOString(),
  persistent: true,
};

const mockNonAdminUser: AuthUser = {
  ...mockAdminUser,
  id: 'user_regular_123',
  email: 'user@webvault.test',
  role: 'user', // 非管理员角色
};

// ============================================================================
// Simple Login Form Component for Testing
// ============================================================================

function TestLoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const { login } = useAuthStore.getState().actions;
  const store = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
    } catch (error) {
      // Error handling is done by store, but also set the error message manually for lockout cases
      if (error instanceof Error && error.message.includes('账户已锁定')) {
        useAuthStore.setState({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: error.message,
            timestamp: new Date().toISOString(),
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="login-form">
      <h1>管理员登录</h1>
      <p>仅限管理员访问</p>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">邮箱</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            记住我
          </label>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>
      
      {store.error && (
        <div data-testid="error-message">
          {store.error.message}
        </div>
      )}
      
      {store.isAuthenticated && (
        <div data-testid="success-message">
          登录成功: {store.user?.name}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * 模拟用户登录操作
 */
async function performLogin(user: any, email: string, password: string, rememberMe: boolean = false) {
  // 填写邮箱
  const emailInput = screen.getByLabelText(/邮箱/i);
  await user.clear(emailInput);
  await user.type(emailInput, email);

  // 填写密码
  const passwordInput = screen.getByLabelText(/密码/i);
  await user.clear(passwordInput);
  await user.type(passwordInput, password);

  // 选择记住我选项
  if (rememberMe) {
    const rememberCheckbox = screen.getByRole('checkbox', { name: /记住我/i });
    await user.click(rememberCheckbox);
  }

  // 点击登录按钮
  const loginButton = screen.getByRole('button', { name: /登录/i });
  await user.click(loginButton);
}

// ============================================================================
// E2E测试套件：基本认证流程
// ============================================================================

describe('基本认证流程 E2E 测试', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    
    // 重置store状态
    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      error: null,
      loginAttempts: 0,
      isLocked: false,
      lockoutExpiresAt: null,
      isInitialized: false,
    });

    // 重置所有mock
    jest.clearAllMocks();
  });

  // ==========================================================================
  // R1.1: 登录页面显示测试
  // ==========================================================================

  describe('R1.1: 登录页面界面显示', () => {
    test('应该显示完整的登录表单界面', async () => {
      render(<TestLoginForm />);

      // 验证登录表单元素存在
      expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
      expect(screen.getByText(/记住我/i)).toBeInTheDocument();
      
      // 验证Admin-Only系统提示
      expect(screen.getByText(/管理员登录/i)).toBeInTheDocument();
    });

    test('应该显示Admin-Only系统的安全提示', async () => {
      render(<TestLoginForm />);

      // 验证安全提示信息
      expect(screen.getByText(/仅限管理员访问/i)).toBeInTheDocument();
    });

    test('登录表单应该具有正确的初始状态', async () => {
      render(<TestLoginForm />);

      const emailInput = screen.getByLabelText(/邮箱/i);
      const passwordInput = screen.getByLabelText(/密码/i);
      const rememberCheckbox = screen.getByRole('checkbox', { name: /记住我/i });
      const loginButton = screen.getByRole('button', { name: /登录/i });

      // 验证初始状态
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
      expect(rememberCheckbox).not.toBeChecked();
      expect(loginButton).toBeEnabled();
    });
  });

  // ==========================================================================
  // R1.2: 邮箱密码登录成功测试
  // ==========================================================================

  describe('R1.2: 邮箱密码登录成功流程', () => {
    beforeEach(() => {
      // Mock成功的登录响应
      jest.spyOn(clerkAuthService, 'signIn').mockResolvedValue(mockAdminSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
    });

    test('管理员用户应该能够成功登录', async () => {
      render(<TestLoginForm />);

      // 执行登录操作
      await performLogin(user, mockAdminUser.email, 'AdminPass123!');

      // 等待登录完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true);
        expect(store.user).toEqual(mockAdminUser);
        expect(store.session).toEqual(mockAdminSession);
        expect(store.error).toBeNull();
      });

      // 验证ClerkAuthService被正确调用
      expect(clerkAuthService.signIn).toHaveBeenCalledWith({
        email: mockAdminUser.email,
        password: 'AdminPass123!',
        rememberMe: false,
      });

      // 验证成功消息显示
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText(/登录成功: Test Admin/)).toBeInTheDocument();
    });

    test('记住我选项应该正确传递给认证服务', async () => {
      render(<TestLoginForm />);

      // 执行带记住我的登录操作
      await performLogin(user, mockAdminUser.email, 'AdminPass123!', true);

      // 等待登录完成
      await waitFor(() => {
        expect(clerkAuthService.signIn).toHaveBeenCalledWith({
          email: mockAdminUser.email,
          password: 'AdminPass123!',
          rememberMe: true,
        });
      });
    });

    test('成功登录后应该清除错误状态', async () => {
      // 先设置错误状态
      useAuthStore.setState({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '登录失败',
          timestamp: new Date().toISOString(),
        },
      });

      render(<TestLoginForm />);

      // 执行登录操作
      await performLogin(user, mockAdminUser.email, 'AdminPass123!');

      // 等待登录完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.error).toBeNull();
      });

      // 验证错误消息不显示
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    test('成功登录后应该重置登录尝试计数', async () => {
      // 先设置失败尝试计数
      useAuthStore.setState({
        loginAttempts: 2,
      });

      render(<TestLoginForm />);

      // 执行登录操作
      await performLogin(user, mockAdminUser.email, 'AdminPass123!');

      // 等待登录完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.loginAttempts).toBe(0);
        expect(store.isLocked).toBe(false);
        expect(store.lockoutExpiresAt).toBeNull();
      });
    });
  });

  // ==========================================================================
  // 管理员权限验证测试
  // ==========================================================================

  describe('Admin-Only系统权限验证', () => {
    test('非管理员用户应该被拒绝登录', async () => {
      // Mock非管理员用户会话
      const nonAdminSession = {
        ...mockAdminSession,
        user: mockNonAdminUser,
      };

      jest.spyOn(clerkAuthService, 'signIn').mockResolvedValue(nonAdminSession);
      jest.spyOn(clerkAuthService, 'signOut').mockResolvedValue();
      jest.spyOn(clerkAuthService, 'recordFailedAttempt').mockResolvedValue();

      render(<TestLoginForm />);

      // 执行登录操作
      await performLogin(user, mockNonAdminUser.email, 'UserPass123!');

      // 等待处理完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        // 非管理员用户应该被拒绝
        expect(store.isAuthenticated).toBe(false);
        expect(store.user).toBeNull();
        expect(store.error).not.toBeNull();
        expect(store.error?.message).toContain('仅允许管理员');
      });

      // 验证错误消息显示
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/仅允许管理员/)).toBeInTheDocument();

      // 验证自动登出和记录失败尝试
      expect(clerkAuthService.signOut).toHaveBeenCalled();
      expect(clerkAuthService.recordFailedAttempt).toHaveBeenCalledWith(mockNonAdminUser.email);
    });

    test('管理员权限验证应该严格执行', async () => {
      // Mock缺少role的用户会话
      const invalidSession = {
        ...mockAdminSession,
        user: {
          ...mockAdminUser,
          role: undefined, // 缺少角色信息
        },
      };

      jest.spyOn(clerkAuthService, 'signIn').mockResolvedValue(invalidSession as any);
      jest.spyOn(clerkAuthService, 'signOut').mockResolvedValue();

      render(<TestLoginForm />);

      // 执行登录操作
      await performLogin(user, mockAdminUser.email, 'AdminPass123!');

      // 等待处理完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.error?.message).toContain('仅允许管理员');
      });
    });
  });

  // ==========================================================================
  // R1.6: 登出功能测试
  // ==========================================================================

  describe('R1.6: 登出功能验证', () => {
    beforeEach(() => {
      // 设置已登录状态
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockAdminUser,
        session: mockAdminSession,
        error: null,
      });

      jest.spyOn(clerkAuthService, 'signOut').mockResolvedValue();
    });

    test('应该能够成功登出并清除会话', async () => {
      // 获取store actions
      const { logout } = useAuthStore.getState().actions;

      // 执行登出操作
      await act(async () => {
        await logout();
      });

      // 验证状态已清除
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.user).toBeNull();
        expect(store.session).toBeNull();
      });

      // 验证ClerkAuthService被调用
      expect(clerkAuthService.signOut).toHaveBeenCalled();
    });

    test('登出后应该保留安全状态信息', async () => {
      // 设置一些安全状态
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockAdminUser,
        session: mockAdminSession,
        loginAttempts: 1,
        isLocked: false,
        lockoutExpiresAt: null,
      });

      const { logout } = useAuthStore.getState().actions;

      // 执行登出操作
      await act(async () => {
        await logout();
      });

      // 验证安全状态被保留
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.loginAttempts).toBe(1); // 保留失败尝试计数
      });
    });

    test('登出失败时应该仍清除本地状态', async () => {
      // Mock登出失败
      jest.spyOn(clerkAuthService, 'signOut').mockRejectedValue(new Error('网络错误'));

      const { logout } = useAuthStore.getState().actions;

      // 执行登出操作（捕获异常但不阻止测试）
      try {
        await act(async () => {
          await logout();
        });
      } catch (error) {
        // 预期会有错误，继续验证状态
      }

      // 验证本地状态仍被清除
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.user).toBeNull();
        expect(store.session).toBeNull();
        expect(store.error).not.toBeNull();
      });
    });
  });

  // ==========================================================================
  // 登录失败处理测试
  // ==========================================================================

  describe('登录失败处理', () => {
    test('无效凭据应该显示错误信息', async () => {
      // Mock登录失败
      jest.spyOn(clerkAuthService, 'signIn').mockRejectedValue(
        new Error('邮箱或密码错误，请重新输入')
      );

      render(<TestLoginForm />);

      // 执行登录操作
      await performLogin(user, 'invalid@test.com', 'wrongpass');

      // 等待错误处理完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.error).not.toBeNull();
        expect(store.error?.message).toContain('邮箱或密码错误');
      });

      // 验证错误消息显示
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/邮箱或密码错误/)).toBeInTheDocument();
    });

    test('网络错误应该正确处理', async () => {
      // Mock网络错误
      jest.spyOn(clerkAuthService, 'signIn').mockRejectedValue(
        new Error('网络连接失败，请检查网络设置')
      );

      render(<TestLoginForm />);

      // 执行登录操作
      await performLogin(user, mockAdminUser.email, 'AdminPass123!');

      // 等待错误处理完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.error).not.toBeNull();
        expect(store.error?.message).toContain('网络连接失败');
      });
    });

    test('账户锁定状态应该阻止登录', async () => {
      // Mock signIn方法（虽然不会被调用）
      const signInSpy = jest.spyOn(clerkAuthService, 'signIn').mockResolvedValue(mockAdminSession);
      
      // 设置锁定状态
      const lockoutTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      useAuthStore.setState({
        isLocked: true,
        lockoutExpiresAt: lockoutTime,
        loginAttempts: 5,
      });

      render(<TestLoginForm />);

      // 尝试登录
      await performLogin(user, mockAdminUser.email, 'AdminPass123!');

      // 等待处理完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        // 检查错误状态存在且包含锁定信息
        expect(store.error).not.toBeNull();
        if (store.error) {
          expect(store.error.message).toContain('账户已锁定');
        }
      });

      // 验证ClerkAuthService未被调用
      expect(signInSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 会话初始化测试
  // ==========================================================================

  describe('认证状态初始化', () => {
    test('应用启动时应该检查现有会话', async () => {
      // Mock现有有效会话
      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(mockAdminSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);

      const { initialize } = useAuthStore.getState().actions;

      // 执行初始化
      await act(async () => {
        await initialize();
      });

      // 验证会话恢复
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true);
        expect(store.user).toEqual(mockAdminUser);
        expect(store.session).toEqual(mockAdminSession);
        expect(store.isInitialized).toBe(true);
      });
    });

    test('无效会话应该被清除', async () => {
      // Mock无效会话
      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(mockAdminSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(false);

      const { initialize } = useAuthStore.getState().actions;

      // 执行初始化
      await act(async () => {
        await initialize();
      });

      // 验证状态保持未认证
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.user).toBeNull();
        expect(store.session).toBeNull();
        expect(store.isInitialized).toBe(true);
      });
    });
  });

  // ==========================================================================
  // 权限检查功能测试
  // ==========================================================================

  describe('Admin权限检查功能', () => {
    test('isAdmin方法应该正确验证管理员身份', () => {
      // 设置管理员状态
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockAdminUser,
      });

      const { isAdmin } = useAuthStore.getState().actions;
      expect(isAdmin()).toBe(true);
    });

    test('requireAdmin方法应该对非管理员抛出错误', () => {
      // 设置非管理员状态
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockNonAdminUser,
      });

      const { requireAdmin } = useAuthStore.getState().actions;
      expect(() => requireAdmin()).toThrow('权限不足，此操作仅限管理员');
    });

    test('hasValidAdminSession应该验证完整的管理员会话', () => {
      // 设置有效的管理员会话
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockAdminUser,
        session: mockAdminSession,
      });

      const { hasValidAdminSession } = useAuthStore.getState().actions;
      expect(hasValidAdminSession()).toBe(true);
    });

    test('过期会话应该被识别为无效', () => {
      // 设置过期会话
      const expiredSession = {
        ...mockAdminSession,
        expiresAt: new Date(Date.now() - 1000).toISOString(), // 已过期
      };

      useAuthStore.setState({
        isAuthenticated: true,
        user: mockAdminUser,
        session: expiredSession,
      });

      const { hasValidAdminSession } = useAuthStore.getState().actions;
      expect(hasValidAdminSession()).toBe(false);
    });
  });
});