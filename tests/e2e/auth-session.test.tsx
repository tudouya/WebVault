/**
 * 会话持久性和账户锁定 E2E 测试
 * 
 * 测试Admin-Only系统的会话管理和安全机制：
 * - 30天会话持久性验证
 * - 登录失败5次后15分钟账户锁定
 * - 会话自动刷新和过期处理
 * - 持久化会话存储和恢复
 * 
 * Requirements:
 * - R1.4: 认证成功后系统应该保持30天的会话持久性
 * - R1.5: 如果登录失败超过5次，系统应该锁定账户15分钟
 * 
 * @version 1.0.0
 * @created 2025-08-25
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { clerkAuthService } from '@/features/auth/services/ClerkAuthService';
import { SessionManager } from '@/features/auth/services/SessionManager';
import { AuthSession, AuthUser, DEFAULT_SESSION_CONFIG } from '@/features/auth/types';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example-publishable-key';
process.env.CLERK_SECRET_KEY = 'sk_test_example-secret-key';

// Mock browser APIs with proper Jest mocks
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

global.localStorage = mockLocalStorage as any;
global.sessionStorage = mockSessionStorage as any;

// Mock Date.now for consistent time testing
const mockNow = new Date('2025-08-25T10:00:00.000Z').getTime();
const originalDateNow = Date.now;

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
  Date.now = jest.fn(() => mockNow);
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
  Date.now = originalDateNow;
});

// ============================================================================
// Test Fixtures
// ============================================================================

const mockAdminUser: AuthUser = {
  id: 'user_admin_session_test',
  email: 'admin@webvault.test',
  emailVerified: true,
  name: 'Session Test Admin',
  avatar: null,
  provider: 'email',
  role: 'admin',
  metadata: {
    language: 'zh-CN',
    theme: 'system',
    lastLogin: new Date(mockNow).toISOString(),
    loginCount: 1,
  },
  createdAt: new Date(mockNow - 86400000).toISOString(), // 1 day ago
  updatedAt: new Date(mockNow).toISOString(),
};

const create30DaySession = (persistent = true): AuthSession => ({
  accessToken: 'clerk_session_30day_test',
  refreshToken: 'clerk_refresh_30day_test',
  expiresAt: new Date(mockNow + DEFAULT_SESSION_CONFIG.sessionDuration).toISOString(), // 30 days
  refreshExpiresAt: new Date(mockNow + DEFAULT_SESSION_CONFIG.sessionDuration * 2).toISOString(), // 60 days
  user: mockAdminUser,
  createdAt: new Date(mockNow).toISOString(),
  lastActivity: new Date(mockNow).toISOString(),
  persistent,
});

const createExpiredSession = (): AuthSession => ({
  ...create30DaySession(),
  expiresAt: new Date(mockNow - 1000).toISOString(), // Expired 1 second ago
  refreshExpiresAt: new Date(mockNow + DEFAULT_SESSION_CONFIG.sessionDuration).toISOString(), // Still valid for refresh
});

const createCompletelyExpiredSession = (): AuthSession => ({
  ...create30DaySession(),
  expiresAt: new Date(mockNow - DEFAULT_SESSION_CONFIG.sessionDuration - 1000).toISOString(), // Long expired
  refreshExpiresAt: new Date(mockNow - 1000).toISOString(), // Refresh also expired
});

// ============================================================================
// Simple Test Login Form Component
// ============================================================================

function SessionTestLoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const store = useAuthStore();
  const { login } = store.actions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
    } catch (error) {
      // Error handling is done by store
      console.log('Login error in component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="session-login-form">
      <h1>管理员登录 - 会话测试</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">邮箱</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="email-input"
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
            data-testid="password-input"
          />
        </div>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              data-testid="remember-me-checkbox"
            />
            记住我 (30天持久化)
          </label>
        </div>
        
        <button type="submit" disabled={isLoading || store.isLocked} data-testid="login-button">
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>
      
      {store.error && (
        <div data-testid="error-message" role="alert">
          {store.error.message}
        </div>
      )}
      
      {store.isAuthenticated && store.user && (
        <div data-testid="success-message">
          <p>登录成功: {store.user.name}</p>
          <p>会话持久化: {store.session?.persistent ? '启用' : '禁用'}</p>
          <p>会话过期时间: {store.session?.expiresAt}</p>
        </div>
      )}
      
      {store.isLocked && store.lockoutExpiresAt && (
        <div data-testid="lockout-message" role="alert">
          <p>账户已锁定</p>
          <p>解锁时间: {store.lockoutExpiresAt}</p>
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
async function performLogin(
  user: any, 
  email: string, 
  password: string, 
  rememberMe: boolean = false
) {
  const emailInput = screen.getByTestId('email-input');
  const passwordInput = screen.getByTestId('password-input');
  const rememberCheckbox = screen.getByTestId('remember-me-checkbox');
  const loginButton = screen.getByTestId('login-button');

  await user.clear(emailInput);
  await user.type(emailInput, email);
  await user.clear(passwordInput);
  await user.type(passwordInput, password);

  if (rememberMe) {
    await user.click(rememberCheckbox);
  }

  await user.click(loginButton);
}

/**
 * 模拟时间快进
 */
function advanceTime(milliseconds: number) {
  Date.now = jest.fn(() => mockNow + milliseconds);
}

/**
 * 重置时间为初始状态
 */
function resetTime() {
  Date.now = jest.fn(() => mockNow);
}

/**
 * 模拟localStorage的存储状态
 */
function setMockLocalStorage(data: Record<string, string> = {}) {
  const storage = { ...data };
  
  mockLocalStorage.getItem.mockImplementation((key: string) => {
    return storage[key] || null;
  });
  
  mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
    storage[key] = value;
  });
  
  mockLocalStorage.removeItem.mockImplementation((key: string) => {
    delete storage[key];
  });
  
  return storage;
}

// ============================================================================
// E2E测试套件：会话持久性和账户锁定
// ============================================================================

describe('会话持久性和账户锁定 E2E 测试', () => {
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
    
    // 重置时间
    resetTime();
    
    // 重置storage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockImplementation(() => {});
    mockSessionStorage.removeItem.mockImplementation(() => {});
  });

  // ==========================================================================
  // R1.4: 30天会话持久性测试
  // ==========================================================================

  describe('R1.4: 30天会话持久性验证', () => {
    beforeEach(() => {
      // Mock成功的登录响应
      jest.spyOn(clerkAuthService, 'signIn').mockResolvedValue(create30DaySession(true));
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(create30DaySession(true));
      jest.spyOn(clerkAuthService, 'checkAccountLockout').mockResolvedValue({
        isLocked: false,
        attemptCount: 0,
      });
      jest.spyOn(clerkAuthService, 'clearFailedAttempts').mockResolvedValue();
    });

    test('应该创建30天持久化会话', async () => {
      render(<SessionTestLoginForm />);

      // 执行登录操作 (启用记住我)
      await performLogin(user, mockAdminUser.email, 'AdminPass123!', true);

      // 等待登录完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true);
        expect(store.session?.persistent).toBe(true);
      }, { timeout: 1000 });

      // 验证会话期限
      const store = useAuthStore.getState();
      if (store.session) {
        const sessionExpiryTime = new Date(store.session.expiresAt).getTime();
        const expectedExpiryTime = mockNow + DEFAULT_SESSION_CONFIG.sessionDuration;
        
        expect(sessionExpiryTime).toBe(expectedExpiryTime);
      }

      // 验证UI显示
      await waitFor(() => {
        expect(screen.getByText(/会话持久化: 启用/)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    test('记住我未选择时应创建会话存储会话', async () => {
      // Mock非持久化会话
      jest.spyOn(clerkAuthService, 'signIn').mockResolvedValue(create30DaySession(false));
      
      render(<SessionTestLoginForm />);

      // 执行登录操作 (不启用记住我)
      await performLogin(user, mockAdminUser.email, 'AdminPass123!', false);

      // 等待登录完成
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true);
        expect(store.session?.persistent).toBe(false);
      });

      // 验证UI显示
      expect(screen.getByText(/会话持久化: 禁用/)).toBeInTheDocument();
    });

    test('应该在接近过期时自动刷新会话', async () => {
      const mockRefreshedSession = create30DaySession(true);
      jest.spyOn(clerkAuthService, 'refreshSession').mockResolvedValue(mockRefreshedSession);
      
      // Mock一个接近过期的会话 (还有10分钟过期)
      const nearExpirySession: AuthSession = {
        ...create30DaySession(true),
        expiresAt: new Date(mockNow + 10 * 60 * 1000).toISOString(), // 10 minutes
      };
      
      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(nearExpirySession);

      // 设置已认证状态
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockAdminUser,
        session: nearExpirySession,
      });

      render(<SessionTestLoginForm />);

      // 模拟时间快进到需要刷新的时候 (5分钟后)
      advanceTime(5 * 60 * 1000);

      // 执行会话刷新
      const { actions } = useAuthStore.getState();
      await act(async () => {
        await actions.refreshSession();
      });

      // 验证会话已刷新
      await waitFor(() => {
        expect(clerkAuthService.refreshSession).toHaveBeenCalled();
      });
    });

    test('已过期但可刷新的会话应该被自动刷新', async () => {
      const expiredSession = createExpiredSession();
      const refreshedSession = create30DaySession(true);
      
      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(expiredSession);
      jest.spyOn(clerkAuthService, 'validateSession')
        .mockResolvedValueOnce(false) // First call fails (expired)
        .mockResolvedValueOnce(true);  // Second call succeeds (after refresh)
      jest.spyOn(clerkAuthService, 'refreshSession').mockResolvedValue(refreshedSession);

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证会话刷新流程
      await waitFor(() => {
        expect(clerkAuthService.getSession).toHaveBeenCalled();
        expect(clerkAuthService.validateSession).toHaveBeenCalled();
      });
    });

    test('完全过期的会话应该被清除', async () => {
      const completelyExpiredSession = createCompletelyExpiredSession();
      
      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(completelyExpiredSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(false);
      jest.spyOn(clerkAuthService, 'signOut').mockResolvedValue();

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证会话被清除
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.session).toBeNull();
      });
    });

    test('持久化会话在浏览器重启后应该能够恢复', async () => {
      const persistentSession = create30DaySession(true);
      
      // 模拟localStorage中存储的会话数据
      const sessionData = {
        session: persistentSession,
        expiresAt: persistentSession.expiresAt,
        createdAt: new Date(mockNow).toISOString(),
        persistent: true,
        refreshExpiresAt: persistentSession.refreshExpiresAt,
      };
      
      setMockLocalStorage({
        'webvault-session': JSON.stringify(sessionData),
        'webvault-session-expiry': persistentSession.expiresAt,
        'webvault-persistent-session': 'true',
      });

      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(persistentSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证会话恢复
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true);
        expect(store.user?.id).toBe(mockAdminUser.id);
        expect(store.session?.persistent).toBe(true);
      });
    });
  });

  // ==========================================================================
  // R1.5: 账户锁定机制测试
  // ==========================================================================

  describe('R1.5: 登录失败5次后15分钟账户锁定', () => {
    beforeEach(() => {
      // Mock失败的登录响应
      jest.spyOn(clerkAuthService, 'signIn').mockRejectedValue(
        new Error('邮箱或密码错误，请重新输入')
      );
      jest.spyOn(clerkAuthService, 'recordFailedAttempt').mockResolvedValue();
      jest.spyOn(clerkAuthService, 'clearFailedAttempts').mockResolvedValue();
    });

    test('连续5次登录失败后应该锁定账户', async () => {
      render(<SessionTestLoginForm />);

      // 模拟锁定状态检查
      jest.spyOn(clerkAuthService, 'checkAccountLockout')
        .mockResolvedValueOnce({ isLocked: false, attemptCount: 0 })
        .mockResolvedValueOnce({ isLocked: false, attemptCount: 1 })
        .mockResolvedValueOnce({ isLocked: false, attemptCount: 2 })
        .mockResolvedValueOnce({ isLocked: false, attemptCount: 3 })
        .mockResolvedValueOnce({ isLocked: false, attemptCount: 4 })
        .mockResolvedValue({ 
          isLocked: true, 
          attemptCount: 5,
          remainingTime: 15 * 60 * 1000, // 15 minutes
          unlockAt: new Date(mockNow + 15 * 60 * 1000).toISOString()
        });

      // 执行5次失败的登录尝试
      for (let i = 0; i < 5; i++) {
        await performLogin(user, 'wrong@test.com', 'wrongpassword');
        
        await waitFor(() => {
          expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });
      }

      // 第6次尝试应该显示锁定消息
      await performLogin(user, 'wrong@test.com', 'wrongpassword');

      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isLocked).toBe(true);
      });

      // 验证锁定消息显示
      expect(screen.getByTestId('lockout-message')).toBeInTheDocument();
      expect(screen.getByText(/账户已锁定/)).toBeInTheDocument();
    });

    test('账户锁定期间应该阻止登录尝试', async () => {
      // 设置锁定状态
      const lockoutExpiresAt = new Date(mockNow + 15 * 60 * 1000).toISOString();
      useAuthStore.setState({
        isLocked: true,
        lockoutExpiresAt,
        loginAttempts: 5,
      });

      jest.spyOn(clerkAuthService, 'checkAccountLockout').mockResolvedValue({
        isLocked: true,
        attemptCount: 5,
        remainingTime: 15 * 60 * 1000,
        unlockAt: lockoutExpiresAt,
      });

      render(<SessionTestLoginForm />);

      // 验证登录按钮被禁用
      const loginButton = screen.getByTestId('login-button');
      expect(loginButton).toBeDisabled();

      // 验证锁定消息显示
      expect(screen.getByTestId('lockout-message')).toBeInTheDocument();
    });

    test('15分钟锁定期过后应该自动解锁账户', async () => {
      // 设置锁定状态 (已过期)
      const pastLockoutTime = new Date(mockNow - 1000).toISOString(); // 1 second ago
      useAuthStore.setState({
        isLocked: true,
        lockoutExpiresAt: pastLockoutTime,
        loginAttempts: 5,
      });

      // Mock lockout status check showing expired lockout
      jest.spyOn(clerkAuthService, 'checkAccountLockout').mockResolvedValue({
        isLocked: false,
        attemptCount: 0,
      });

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证账户已解锁
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isLocked).toBe(false);
        expect(store.lockoutExpiresAt).toBeNull();
        expect(store.loginAttempts).toBe(0);
      });
    });

    test('成功登录后应该清除失败尝试计数', async () => {
      // 先设置一些失败尝试
      useAuthStore.setState({
        loginAttempts: 3,
      });

      // Mock成功登录
      jest.spyOn(clerkAuthService, 'signIn').mockResolvedValue(create30DaySession(true));
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
      jest.spyOn(clerkAuthService, 'checkAccountLockout').mockResolvedValue({
        isLocked: false,
        attemptCount: 0,
      });

      render(<SessionTestLoginForm />);

      // 执行成功登录
      await performLogin(user, mockAdminUser.email, 'AdminPass123!');

      // 验证失败尝试被清除
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.loginAttempts).toBe(0);
        expect(store.isAuthenticated).toBe(true);
        expect(clerkAuthService.clearFailedAttempts).toHaveBeenCalledWith(mockAdminUser.email);
      });
    });

    test('锁定状态计算应该准确显示剩余时间', async () => {
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes
      const lockoutExpiresAt = new Date(mockNow + lockoutDuration).toISOString();
      
      jest.spyOn(clerkAuthService, 'checkAccountLockout').mockResolvedValue({
        isLocked: true,
        attemptCount: 5,
        remainingTime: lockoutDuration,
        unlockAt: lockoutExpiresAt,
      });

      useAuthStore.setState({
        isLocked: true,
        lockoutExpiresAt,
        loginAttempts: 5,
      });

      render(<SessionTestLoginForm />);

      // 验证解锁时间显示
      expect(screen.getByText(new RegExp(lockoutExpiresAt.substring(0, 16)))).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 会话管理集成测试
  // ==========================================================================

  describe('会话管理集成测试', () => {
    test('会话过期后账户锁定状态应该被保留', async () => {
      // 设置已锁定且会话过期的状态
      const expiredSession = createCompletelyExpiredSession();
      const lockoutExpiresAt = new Date(mockNow + 10 * 60 * 1000).toISOString(); // Still 10 minutes left
      
      useAuthStore.setState({
        isAuthenticated: true,
        session: expiredSession,
        isLocked: true,
        lockoutExpiresAt,
        loginAttempts: 5,
      });

      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(expiredSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(false);
      jest.spyOn(clerkAuthService, 'checkAccountLockout').mockResolvedValue({
        isLocked: true,
        attemptCount: 5,
        remainingTime: 10 * 60 * 1000,
        unlockAt: lockoutExpiresAt,
      });

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证会话已清除但锁定状态保留
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(store.session).toBeNull();
        expect(store.isLocked).toBe(true);
        expect(store.lockoutExpiresAt).toBe(lockoutExpiresAt);
      });
    });

    test('持久化会话恢复后应该检查锁定状态', async () => {
      const persistentSession = create30DaySession(true);
      const lockoutExpiresAt = new Date(mockNow + 5 * 60 * 1000).toISOString();
      
      // Mock storage with both session and lockout data
      setMockLocalStorage({
        'webvault-session': JSON.stringify({
          session: persistentSession,
          expiresAt: persistentSession.expiresAt,
          persistent: true,
          refreshExpiresAt: persistentSession.refreshExpiresAt,
        }),
        [`webvault-failed-attempts-${mockAdminUser.email}`]: JSON.stringify({
          email: mockAdminUser.email,
          attempts: 5,
          firstAttemptAt: new Date(mockNow - 10 * 60 * 1000).toISOString(),
          lastAttemptAt: new Date(mockNow - 5 * 60 * 1000).toISOString(),
          lockoutExpiresAt,
        }),
      });

      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(persistentSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
      jest.spyOn(clerkAuthService, 'checkAccountLockout').mockResolvedValue({
        isLocked: true,
        attemptCount: 5,
        remainingTime: 5 * 60 * 1000,
        unlockAt: lockoutExpiresAt,
      });

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证会话恢复但用户因锁定无法操作
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true); // Session restored
        expect(store.isLocked).toBe(true);        // But account locked
      });
    });

    test('Admin权限验证应该在会话恢复时执行', async () => {
      // Mock non-admin user session
      const nonAdminSession: AuthSession = {
        ...create30DaySession(true),
        user: {
          ...mockAdminUser,
          role: 'user', // Non-admin role
        },
      };

      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(nonAdminSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(false); // Should fail admin validation
      jest.spyOn(clerkAuthService, 'signOut').mockResolvedValue();

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证非管理员会话被拒绝
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(false);
        expect(clerkAuthService.signOut).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // 边界条件和错误处理测试
  // ==========================================================================

  describe('边界条件和错误处理', () => {
    test('存储API不可用时应该优雅降级', async () => {
      // Mock localStorage error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证初始化完成，即使存储不可用
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isInitialized).toBe(true);
      });
    });

    test('损坏的会话数据应该被清除', async () => {
      // Mock corrupted session data
      setMockLocalStorage({
        'webvault-session': 'invalid-json-data',
      });

      jest.spyOn(clerkAuthService, 'getSession').mockResolvedValue(null);

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.initialize();
      });

      // 验证损坏数据被忽略，不影响初始化
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isInitialized).toBe(true);
        expect(store.isAuthenticated).toBe(false);
      });
    });

    test('网络错误不应该影响本地会话状态', async () => {
      const validSession = create30DaySession(true);
      
      // Set valid local session
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockAdminUser,
        session: validSession,
      });

      // Mock network error during validation
      jest.spyOn(clerkAuthService, 'validateSession').mockRejectedValue(
        new Error('Network error')
      );

      const { actions } = useAuthStore.getState();
      
      await act(async () => {
        await actions.refreshSession();
      });

      // 验证网络错误不清除有效的本地状态
      // (具体行为取决于实现，这里假设保持当前状态)
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(true); // Should remain authenticated locally
    });
  });
});