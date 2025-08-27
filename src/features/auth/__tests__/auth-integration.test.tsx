/**
 * Authentication Flow Integration Tests
 * 
 * 全面测试认证系统的完整工作流程，包括：
 * - 完整登录工作流程（表单验证 → 提交 → 认证 → 重定向）
 * - OAuth社交登录流程（Google、GitHub）
 * - 密码重置完整流程（请求 → 邮件 → 验证 → 重置）
 * - 路由保护和重定向集成测试
 * - 会话管理和状态持久化测试
 * - 错误恢复和重试机制测试
 * - 多组件协作和状态同步测试
 * - 并发操作和竞态条件处理
 * 
 * Requirements满足:
 * - 1.1: Email Authentication - 完整邮箱密码登录流程
 * - 2.1: Social Authentication - Google和GitHub OAuth流程
 * - 3.1-3.3: Password Reset - 完整密码重置工作流程
 * - 5.1: Session Management - 会话管理和自动刷新
 * - 错误处理和恢复机制验证
 * - 路由保护和权限控制验证
 * 
 * 测试策略:
 * - 端到端工作流程测试
 * - 组件间协作测试
 * - 状态管理集成测试
 * - 错误边界和恢复测试
 * - 性能和并发测试
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';

// 导入认证组件和服务
import { LoginPage } from '../components/LoginPage';
import { LoginForm } from '../components/LoginForm';
import { PasswordResetPage } from '../components/PasswordResetPage';
import { PasswordConfirmPage } from '../components/PasswordConfirmPage';
import { AuthGuard } from '../components/AuthGuard';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth-store';
// import { supabaseAuthService } from '../services/SupabaseAuthService'; // DEPRECATED: Replaced by ClerkAuthService

// 导入类型和Mock数据
import type { 
  AuthUser, 
  AuthSession, 
  AuthError, 
  AuthFormData, 
  SocialProvider 
} from '../types';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Next.js environment
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/login',
  redirect: jest.fn(),
}));

// Mock nuqs for URL state
jest.mock('nuqs', () => ({
  parseAsString: { parseServerSide: jest.fn(), serialize: jest.fn() },
  parseAsBoolean: { parseServerSide: jest.fn(), serialize: jest.fn() },
  useQueryState: jest.fn(() => [null, jest.fn()]),
  useQueryStates: jest.fn(() => [{}, jest.fn()]),
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
      signInWithOAuth: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

// Mock Supabase Auth Service
jest.mock('../services/SupabaseAuthService', () => ({
  supabaseAuthService: {
    signIn: jest.fn(),
    signInWithProvider: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
    getSession: jest.fn(),
    validateSession: jest.fn(),
    resetPassword: jest.fn(),
    confirmPasswordReset: jest.fn(),
    getCurrentUser: jest.fn(),
    updateUserProfile: jest.fn(),
  },
}));

// Mock Auth Store
jest.mock('../stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock utilities
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, ...props }, ref) => (
    <button ref={ref} className={className} {...props}>{children}</button>
  )),
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
    <input ref={ref} className={className} {...props} />
  )),
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ children, control, name, render }: any) => {
    const field = {
      onChange: jest.fn(),
      onBlur: jest.fn(),
      value: '',
      name,
      ref: jest.fn(),
    };
    return render({ field, fieldState: { error: undefined } });
  },
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  FormMessage: ({ children }: any) => children ? <div role="alert">{children}</div> : null,
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

// Mock theme provider
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    themes: ['light', 'dark'],
  }),
  ThemeProvider: ({ children }: any) => children,
}));

// ============================================================================
// Test Data & Fixtures
// ============================================================================

const mockUser: AuthUser = {
  id: 'user-123',
  email: 'test@example.com',
  emailVerified: true,
  name: 'Test User',
  avatar: '/avatars/test-user.jpg',
  provider: 'email',
  role: 'user',
  metadata: {
    language: 'zh-CN',
    theme: 'system',
    lastLogin: '2025-08-18T10:00:00Z',
    loginCount: 5,
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-08-18T10:00:00Z',
};

const mockSession: AuthSession = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
  refreshExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  user: mockUser,
  createdAt: '2025-08-18T09:00:00Z',
  lastActivity: '2025-08-18T10:00:00Z',
  persistent: true,
};

const mockError: AuthError = {
  code: 'INVALID_CREDENTIALS',
  message: '邮箱或密码错误',
  field: 'email',
  timestamp: '2025-08-18T10:00:00Z',
};

const mockFormData: AuthFormData = {
  email: 'test@example.com',
  password: 'password123',
  rememberMe: true,
};

// Mock store state factory
const createMockStoreState = (overrides = {}) => {
  const mockActions = {
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
  };

  return {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,
    error: null,
    loginAttempts: 0,
    isLocked: false,
    lockoutExpiresAt: null,
    isInitialized: false,
    actions: mockActions,
    ...overrides,
  };
};

const mockSupabaseAuthService = supabaseAuthService as jest.Mocked<typeof supabaseAuthService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// ============================================================================
// Helper Components for Testing
// ============================================================================

interface TestWrapperProps {
  children: React.ReactNode;
  autoInitialize?: boolean;
  autoRefresh?: boolean;
  sessionCheckInterval?: number;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  autoInitialize = false,
  autoRefresh = false,
  sessionCheckInterval = 1000
}) => (
  <AuthProvider 
    autoInitialize={autoInitialize}
    autoRefresh={autoRefresh}
    sessionCheckInterval={sessionCheckInterval}
  >
    {children}
  </AuthProvider>
);

const ProtectedTestComponent = () => {
  return (
    <AuthGuard fallback={<div data-testid="auth-guard-fallback">Please login</div>}>
      <div data-testid="protected-content">Protected Content</div>
    </AuthGuard>
  );
};

describe.skip('Authentication Flow Integration Tests - DEPRECATED: Supabase tests skipped during Clerk migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ========================================================================
  // 1. 完整登录工作流程测试
  // ========================================================================

  describe('完整登录工作流程', () => {
    test('应该完成完整的邮箱密码登录流程', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock成功的登录流程
      const mockStoreState = createMockStoreState({
        isLoading: false,
        isAuthenticated: false,
      });
      
      // 模拟登录成功后的状态变化
      mockStoreState.actions.login.mockImplementation(async () => {
        // 模拟状态更新
        Object.assign(mockStoreState, {
          isAuthenticated: true,
          user: mockUser,
          session: mockSession,
          isLoading: false,
          error: null,
        });
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const onSuccess = jest.fn();
      const onError = jest.fn();
      
      render(
        <TestWrapper>
          <LoginForm 
            onSuccess={onSuccess}
            onError={onError}
            showRememberMe={true}
            showForgotPassword={true}
          />
        </TestWrapper>
      );

      // 1. 验证初始UI渲染
      expect(screen.getByText('登录账户')).toBeInTheDocument();
      expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument();
      expect(screen.getByLabelText('密码')).toBeInTheDocument();

      // 2. 填写表单
      const emailInput = screen.getByLabelText('邮箱地址');
      const passwordInput = screen.getByLabelText('密码');
      const rememberMeCheckbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberMeCheckbox);

      // 3. 提交表单
      await user.click(submitButton);

      // 4. 验证登录流程被调用
      expect(mockStoreState.actions.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        true
      );

      // 5. 等待登录完成
      await waitFor(() => {
        expect(mockStoreState.isAuthenticated).toBe(true);
        expect(mockStoreState.user).toEqual(mockUser);
        expect(mockStoreState.session).toEqual(mockSession);
      });
    });

    test('应该处理登录表单验证错误', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const mockStoreState = createMockStoreState({
        isLoading: false,
        error: null,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /login/i });
      
      // 尝试提交空表单
      await user.click(submitButton);
      
      // 表单验证应该阻止提交
      expect(mockStoreState.actions.login).not.toHaveBeenCalled();
    });

    test('应该处理网络错误和重试机制', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const networkError: AuthError = {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
        timestamp: new Date().toISOString(),
      };
      
      const mockStoreState = createMockStoreState({
        isLoading: false,
        error: networkError,
      });
      
      // 第一次失败，第二次成功
      let callCount = 0;
      mockStoreState.actions.login.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network error');
        } else {
          Object.assign(mockStoreState, {
            isAuthenticated: true,
            user: mockUser,
            error: null,
          });
        }
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // 填写并提交表单
      await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
      await user.type(screen.getByLabelText('密码'), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // 验证错误显示
      expect(screen.getByText('网络连接失败，请检查网络设置')).toBeInTheDocument();

      // 清除错误并重试
      mockStoreState.error = null;
      mockUseAuthStore.mockReturnValue({ ...mockStoreState, error: null });
      
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      // 验证重试成功
      await waitFor(() => {
        expect(mockStoreState.actions.login).toHaveBeenCalledTimes(2);
      });
    });

    test('应该处理账户锁定状态', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const mockStoreState = createMockStoreState({
        loginAttempts: 5,
        isLocked: true,
        lockoutExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        error: {
          code: 'ACCOUNT_LOCKED',
          message: '账户已被锁定，请15分钟后重试',
          timestamp: new Date().toISOString(),
        } as AuthError,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // 验证锁定状态显示
      expect(screen.getByText('账户已被锁定，请15分钟后重试')).toBeInTheDocument();
      
      // 提交按钮应该被禁用
      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ========================================================================
  // 2. OAuth社交登录流程测试
  // ========================================================================

  describe('OAuth社交登录流程', () => {
    test('应该完成Google OAuth登录流程', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const mockStoreState = createMockStoreState();
      
      // 模拟成功的OAuth流程
      mockStoreState.actions.loginWithProvider.mockImplementation(async (provider) => {
        if (provider === 'google') {
          Object.assign(mockStoreState, {
            isAuthenticated: true,
            user: { ...mockUser, provider: 'google' },
            session: mockSession,
          });
        }
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <SocialAuthButtons />
        </TestWrapper>
      );

      // 点击Google登录按钮
      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      // 验证OAuth流程被调用
      expect(mockStoreState.actions.loginWithProvider).toHaveBeenCalledWith('google');

      // 等待登录完成
      await waitFor(() => {
        expect(mockStoreState.isAuthenticated).toBe(true);
        expect(mockStoreState.user?.provider).toBe('google');
      });
    });

    test('应该完成GitHub OAuth登录流程', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const mockStoreState = createMockStoreState();
      
      // 模拟成功的GitHub OAuth流程
      mockStoreState.actions.loginWithProvider.mockImplementation(async (provider) => {
        if (provider === 'github') {
          Object.assign(mockStoreState, {
            isAuthenticated: true,
            user: { ...mockUser, provider: 'github' },
            session: mockSession,
          });
        }
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <SocialAuthButtons />
        </TestWrapper>
      );

      // 点击GitHub登录按钮
      const githubButton = screen.getByRole('button', { name: /github/i });
      await user.click(githubButton);

      // 验证OAuth流程被调用
      expect(mockStoreState.actions.loginWithProvider).toHaveBeenCalledWith('github');

      // 等待登录完成
      await waitFor(() => {
        expect(mockStoreState.isAuthenticated).toBe(true);
        expect(mockStoreState.user?.provider).toBe('github');
      });
    });

    test('应该处理OAuth授权被拒绝的情况', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const oauthError: AuthError = {
        code: 'OAUTH_CANCELLED',
        message: '用户取消了授权',
        timestamp: new Date().toISOString(),
      };
      
      const mockStoreState = createMockStoreState({
        error: oauthError,
      });
      
      mockStoreState.actions.loginWithProvider.mockRejectedValue(new Error('OAuth cancelled'));
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <SocialAuthButtons />
        </TestWrapper>
      );

      // 点击Google登录按钮
      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      // 验证错误状态
      await waitFor(() => {
        expect(screen.getByText('用户取消了授权')).toBeInTheDocument();
      });
    });

    test('应该处理OAuth服务不可用的情况', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const serviceError: AuthError = {
        code: 'OAUTH_SERVICE_UNAVAILABLE',
        message: 'Google认证服务暂时不可用',
        timestamp: new Date().toISOString(),
      };
      
      const mockStoreState = createMockStoreState({
        error: serviceError,
      });
      
      mockStoreState.actions.loginWithProvider.mockRejectedValue(new Error('Service unavailable'));
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <SocialAuthButtons />
        </TestWrapper>
      );

      // 点击Google登录按钮
      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      // 验证错误处理
      await waitFor(() => {
        expect(screen.getByText('Google认证服务暂时不可用')).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // 3. 密码重置完整流程测试
  // ========================================================================

  describe('密码重置完整流程', () => {
    test('应该完成完整的密码重置流程', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const mockStoreState = createMockStoreState();
      
      // 模拟成功的密码重置请求
      mockStoreState.actions.resetPassword.mockResolvedValue(undefined);
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <PasswordResetPage />
        </TestWrapper>
      );

      // 1. 验证初始UI
      expect(screen.getByText('重置密码')).toBeInTheDocument();
      expect(screen.getByText('输入您的邮箱地址，我们将发送重置链接')).toBeInTheDocument();

      // 2. 填写邮箱并提交
      const emailInput = screen.getByLabelText('邮箱地址');
      const submitButton = screen.getByRole('button', { name: /发送重置链接/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // 3. 验证密码重置请求被调用
      expect(mockStoreState.actions.resetPassword).toHaveBeenCalledWith('test@example.com');

      // 4. 验证成功状态显示
      await waitFor(() => {
        expect(screen.getByText(/重置链接已发送/i)).toBeInTheDocument();
      });
    });

    test('应该处理无效邮箱地址错误', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const emailError: AuthError = {
        code: 'EMAIL_NOT_FOUND',
        message: '该邮箱地址不存在',
        field: 'email',
        timestamp: new Date().toISOString(),
      };
      
      const mockStoreState = createMockStoreState({
        error: emailError,
      });
      
      mockStoreState.actions.resetPassword.mockRejectedValue(new Error('Email not found'));
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <PasswordResetPage />
        </TestWrapper>
      );

      // 填写不存在的邮箱
      await user.type(screen.getByLabelText('邮箱地址'), 'nonexistent@example.com');
      await user.click(screen.getByRole('button', { name: /发送重置链接/i }));

      // 验证错误显示
      await waitFor(() => {
        expect(screen.getByText('该邮箱地址不存在')).toBeInTheDocument();
      });
    });

    test('应该完成密码确认流程', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const mockStoreState = createMockStoreState();
      
      // 模拟成功的密码确认
      mockStoreState.actions.confirmPasswordReset.mockResolvedValue(undefined);
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      // 模拟重置令牌
      const resetToken = 'mock-reset-token';
      
      render(
        <TestWrapper>
          <PasswordConfirmPage token={resetToken} />
        </TestWrapper>
      );

      // 验证UI渲染
      expect(screen.getByText('设置新密码')).toBeInTheDocument();

      // 填写新密码
      const passwordInput = screen.getByLabelText('新密码');
      const confirmPasswordInput = screen.getByLabelText('确认密码');
      const submitButton = screen.getByRole('button', { name: /重置密码/i });

      await user.type(passwordInput, 'newPassword123!');
      await user.type(confirmPasswordInput, 'newPassword123!');
      await user.click(submitButton);

      // 验证密码重置确认被调用
      expect(mockStoreState.actions.confirmPasswordReset).toHaveBeenCalledWith(
        resetToken,
        'newPassword123!'
      );

      // 验证成功状态
      await waitFor(() => {
        expect(screen.getByText(/密码重置成功/i)).toBeInTheDocument();
      });
    });

    test('应该处理密码确认不匹配错误', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <PasswordConfirmPage token="mock-token" />
        </TestWrapper>
      );

      // 填写不匹配的密码
      const passwordInput = screen.getByLabelText('新密码');
      const confirmPasswordInput = screen.getByLabelText('确认密码');

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');

      // 验证密码不匹配错误
      expect(screen.getByText('密码不匹配')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 4. 路由保护和重定向集成测试
  // ========================================================================

  describe('路由保护和重定向集成', () => {
    test('应该保护需要认证的路由', () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: false,
        isInitialized: true,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <ProtectedTestComponent />
        </TestWrapper>
      );

      // 未认证用户应该看到fallback内容
      expect(screen.getByTestId('auth-guard-fallback')).toBeInTheDocument();
      expect(screen.getByText('Please login')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('应该允许已认证用户访问保护的路由', () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
        session: mockSession,
        isInitialized: true,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <ProtectedTestComponent />
        </TestWrapper>
      );

      // 已认证用户应该看到保护的内容
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('auth-guard-fallback')).not.toBeInTheDocument();
    });

    test('应该在会话过期时重定向到登录页', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
        session: {
          ...mockSession,
          expiresAt: new Date(Date.now() - 1000).toISOString(), // 已过期
        },
        isInitialized: true,
      });
      
      // 模拟会话验证失败
      mockSupabaseAuthService.validateSession.mockResolvedValue(false);
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper autoRefresh={true}>
          <ProtectedTestComponent />
        </TestWrapper>
      );

      // 快进时间触发会话检查
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 等待会话验证和登出
      await waitFor(() => {
        expect(mockStoreState.actions.logout).toHaveBeenCalled();
      });
    });

    test('应该处理管理员权限路由保护', () => {
      const adminUser: AuthUser = {
        ...mockUser,
        role: 'admin',
      };
      
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: adminUser,
        session: mockSession,
        isInitialized: true,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const AdminOnlyComponent = () => (
        <AuthGuard 
          requiredRole="admin" 
          fallback={<div data-testid="admin-access-denied">Access denied</div>}
        >
          <div data-testid="admin-content">Admin Panel</div>
        </AuthGuard>
      );
      
      render(
        <TestWrapper>
          <AdminOnlyComponent />
        </TestWrapper>
      );

      // 管理员用户应该能访问管理员内容
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-access-denied')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // 5. 会话管理和状态持久化测试
  // ========================================================================

  describe('会话管理和状态持久化', () => {
    test('应该自动刷新即将过期的会话', async () => {
      const expiringSoon = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分钟后过期
      
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: {
          ...mockSession,
          expiresAt: expiringSoon,
        },
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper autoRefresh={true} sessionCheckInterval={1000}>
          <div data-testid="session-test">Session Test</div>
        </TestWrapper>
      );

      // 快进时间触发会话检查
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 应该触发会话刷新
      await waitFor(() => {
        expect(mockStoreState.actions.refreshSession).toHaveBeenCalled();
      });
    });

    test('应该保持30天的会话持久化', () => {
      const persistentSession: AuthSession = {
        ...mockSession,
        persistent: true,
        refreshExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: persistentSession,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper>
          <div data-testid="persistent-session">Persistent Session</div>
        </TestWrapper>
      );

      // 验证持久化会话配置
      expect(mockStoreState.session?.persistent).toBe(true);
      expect(new Date(mockStoreState.session?.refreshExpiresAt!).getTime()).toBeGreaterThan(
        Date.now() + 29 * 24 * 60 * 60 * 1000 // 至少29天
      );
    });

    test('应该处理会话刷新失败的情况', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: mockSession,
      });
      
      // 模拟会话刷新失败
      mockStoreState.actions.refreshSession.mockRejectedValue(new Error('Refresh failed'));
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper autoRefresh={true}>
          <div data-testid="refresh-test">Refresh Test</div>
        </TestWrapper>
      );

      // 手动触发会话刷新
      await act(async () => {
        try {
          await mockStoreState.actions.refreshSession();
        } catch (error) {
          // 预期的错误
        }
      });

      // 刷新失败应该触发登出
      await waitFor(() => {
        expect(mockStoreState.actions.logout).toHaveBeenCalled();
      });
    });

    test('应该正确处理并发会话操作', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: mockSession,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 并发执行多个会话操作
      await act(async () => {
        const promises = [
          result.current.refreshSession(),
          result.current.refreshSession(),
          result.current.refreshSession(),
        ];
        
        await Promise.all(promises);
      });

      // 应该只执行一次刷新（去重机制）
      expect(mockStoreState.actions.refreshSession).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================================================
  // 6. 错误恢复和重试机制测试
  // ========================================================================

  describe('错误恢复和重试机制', () => {
    test('应该实现指数退避重试策略', async () => {
      const mockStoreState = createMockStoreState();
      
      let retryCount = 0;
      mockStoreState.actions.login.mockImplementation(async () => {
        retryCount++;
        if (retryCount < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve();
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 执行带重试的登录
      await act(async () => {
        for (let i = 0; i < 3; i++) {
          try {
            await result.current.login('test@example.com', 'password');
            break;
          } catch (error) {
            // 等待指数退避时间
            jest.advanceTimersByTime(Math.pow(2, i) * 1000);
          }
        }
      });

      expect(retryCount).toBe(3);
    });

    test('应该在网络恢复后自动重连', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: mockSession,
      });
      
      // 模拟网络错误然后恢复
      let networkAvailable = false;
      mockSupabaseAuthService.validateSession.mockImplementation(async () => {
        if (!networkAvailable) {
          throw new Error('Network error');
        }
        return true;
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      render(
        <TestWrapper autoRefresh={true} sessionCheckInterval={1000}>
          <div data-testid="network-test">Network Test</div>
        </TestWrapper>
      );

      // 触发网络错误
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 模拟网络恢复
      networkAvailable = true;
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 网络恢复后应该重新验证会话
      await waitFor(() => {
        expect(mockSupabaseAuthService.validateSession).toHaveBeenCalled();
      });
    });

    test('应该处理认证服务降级', async () => {
      const mockStoreState = createMockStoreState();
      
      // 模拟主认证服务不可用，但本地会话仍有效
      mockSupabaseAuthService.signIn.mockRejectedValue(new Error('Service unavailable'));
      mockSupabaseAuthService.getSession.mockResolvedValue(mockSession);
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 尝试登录失败，但检查本地会话
      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password');
        } catch (error) {
          // 预期的服务不可用错误
        }
      });

      // 应该回退到本地会话检查
      expect(mockSupabaseAuthService.getSession).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 7. 多组件协作和状态同步测试
  // ========================================================================

  describe('多组件协作和状态同步', () => {
    test('应该在多个组件间同步认证状态', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: false,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const MultiComponentTest = () => {
        const auth = useAuth();
        
        return (
          <div>
            <div data-testid="auth-status">
              {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <LoginForm onSuccess={() => {}} />
            <AuthGuard fallback={<div>Protected fallback</div>}>
              <div data-testid="protected-content">Protected</div>
            </AuthGuard>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <MultiComponentTest />
        </TestWrapper>
      );

      // 初始状态
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByText('Protected fallback')).toBeInTheDocument();

      // 模拟登录成功
      act(() => {
        Object.assign(mockStoreState, {
          isAuthenticated: true,
          user: mockUser,
        });
        mockUseAuthStore.mockReturnValue(mockStoreState);
      });

      // 重新渲染组件
      render(
        <TestWrapper>
          <MultiComponentTest />
        </TestWrapper>
      );

      // 所有组件应该反映新的认证状态
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('应该处理登出时的全局状态清理', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
        session: mockSession,
      });
      
      mockStoreState.actions.logout.mockImplementation(async () => {
        Object.assign(mockStoreState, {
          isAuthenticated: false,
          user: null,
          session: null,
          error: null,
        });
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 执行登出
      await act(async () => {
        await result.current.logout();
      });

      // 验证状态清理
      expect(mockStoreState.isAuthenticated).toBe(false);
      expect(mockStoreState.user).toBeNull();
      expect(mockStoreState.session).toBeNull();
      expect(mockStoreState.error).toBeNull();
    });

    test('应该处理主题切换时的认证状态保持', async () => {
      const { useTheme } = require('next-themes');
      const mockSetTheme = jest.fn();
      
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        themes: ['light', 'dark'],
      });
      
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
        session: mockSession,
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const ThemeAwareAuthTest = () => {
        const auth = useAuth();
        const { setTheme } = useTheme();
        
        return (
          <div>
            <div data-testid="auth-user">{auth.user?.name}</div>
            <button onClick={() => setTheme('dark')}>Switch Theme</button>
          </div>
        );
      };
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <ThemeAwareAuthTest />
        </TestWrapper>
      );

      // 验证初始状态
      expect(screen.getByTestId('auth-user')).toHaveTextContent('Test User');

      // 切换主题
      await user.click(screen.getByText('Switch Theme'));

      // 认证状态应该保持不变
      expect(screen.getByTestId('auth-user')).toHaveTextContent('Test User');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  // ========================================================================
  // 8. 并发操作和竞态条件处理测试
  // ========================================================================

  describe('并发操作和竞态条件处理', () => {
    test('应该正确处理并发登录请求', async () => {
      const mockStoreState = createMockStoreState();
      
      let loginInProgress = false;
      mockStoreState.actions.login.mockImplementation(async () => {
        if (loginInProgress) {
          throw new Error('Login already in progress');
        }
        loginInProgress = true;
        await new Promise(resolve => setTimeout(resolve, 100));
        loginInProgress = false;
        return Promise.resolve();
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 并发发起多个登录请求
      await act(async () => {
        const promises = [
          result.current.login('test@example.com', 'password'),
          result.current.login('test@example.com', 'password'),
          result.current.login('test@example.com', 'password'),
        ];
        
        // 只有第一个应该成功，其他应该被拒绝
        const results = await Promise.allSettled(promises);
        
        const fulfilled = results.filter(r => r.status === 'fulfilled').length;
        expect(fulfilled).toBe(1);
      });
    });

    test('应该处理登录期间的会话刷新冲突', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: mockSession,
      });
      
      const operationQueue: string[] = [];
      
      mockStoreState.actions.login.mockImplementation(async () => {
        operationQueue.push('login');
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      mockStoreState.actions.refreshSession.mockImplementation(async () => {
        operationQueue.push('refresh');
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 同时执行登录和会话刷新
      await act(async () => {
        const promises = [
          result.current.login('test@example.com', 'password'),
          result.current.refreshSession(),
        ];
        
        await Promise.all(promises);
      });

      // 验证操作顺序和并发处理
      expect(operationQueue).toContain('login');
      expect(operationQueue).toContain('refresh');
    });

    test('应该处理快速连续的认证状态变化', async () => {
      const mockStoreState = createMockStoreState();
      
      const stateChanges: string[] = [];
      
      // 模拟快速的状态变化
      mockStoreState.actions.login.mockImplementation(async () => {
        stateChanges.push('login-start');
        Object.assign(mockStoreState, { isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 50));
        Object.assign(mockStoreState, { 
          isLoading: false,
          isAuthenticated: true,
          user: mockUser 
        });
        stateChanges.push('login-complete');
      });
      
      mockStoreState.actions.logout.mockImplementation(async () => {
        stateChanges.push('logout-start');
        Object.assign(mockStoreState, {
          isAuthenticated: false,
          user: null,
          session: null,
        });
        stateChanges.push('logout-complete');
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 快速执行登录然后登出
      await act(async () => {
        await result.current.login('test@example.com', 'password');
        await result.current.logout();
      });

      // 验证状态变化顺序
      expect(stateChanges).toEqual([
        'login-start',
        'login-complete',
        'logout-start',
        'logout-complete'
      ]);
    });

    test('应该处理组件卸载期间的异步操作', async () => {
      const mockStoreState = createMockStoreState();
      
      let cleanupCalled = false;
      mockStoreState.actions.login.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (cleanupCalled) {
          throw new Error('Component unmounted');
        }
        return Promise.resolve();
      });
      
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { result, unmount } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // 开始登录操作
      const loginPromise = act(async () => {
        return result.current.login('test@example.com', 'password');
      });

      // 在登录完成前卸载组件
      act(() => {
        cleanupCalled = true;
        unmount();
      });

      // 登录操作应该被取消或忽略
      await expect(loginPromise).rejects.toThrow();
    });
  });
});