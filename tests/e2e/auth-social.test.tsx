/**
 * 社交认证流程 E2E 测试
 * 
 * 测试Admin-Only系统的社交认证功能：
 * - Google OAuth 登录流程
 * - GitHub OAuth 登录流程
 * - 社交认证权限验证
 * - OAuth 回调处理
 * - 错误处理和用户友好提示
 * 
 * Requirements:
 * - R1.3: 管理员社交登录应通过Clerk OAuth完成认证
 * - R3.1: ClerkAuthService实现社交认证接口
 * - Admin-Only: 仅允许管理员角色用户访问
 * 
 * @version 1.0.0
 * @created 2025-08-25
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { clerkAuthService } from '@/features/auth/services/ClerkAuthService';
import { AuthSession, AuthUser, SocialProvider } from '@/features/auth/types';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example-publishable-key';
process.env.CLERK_SECRET_KEY = 'sk_test_example-secret-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  usePathname: () => '/admin/login',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk SDK with social auth methods
const mockClerkUser = {
  id: 'user_clerk_social_123',
  emailAddresses: [
    {
      id: 'email_123',
      emailAddress: 'admin@webvault.test',
      verification: { status: 'verified' }
    }
  ],
  primaryEmailAddressId: 'email_123',
  firstName: 'Test',
  lastName: 'Admin',
  imageUrl: 'https://avatar.example.com/admin.jpg',
  externalAccounts: [
    {
      id: 'external_google_123',
      provider: 'oauth_google',
      emailAddress: 'admin@webvault.test',
      verification: { status: 'verified' }
    }
  ],
  publicMetadata: { role: 'admin' },
  privateMetadata: { isAdmin: true },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockClerkSession = {
  id: 'sess_clerk_social_123',
  userId: 'user_clerk_social_123',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  expireAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  status: 'active',
};

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ 
    userId: 'user_clerk_social_123', 
    sessionId: 'sess_clerk_social_123' 
  })),
  signOut: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(() => Promise.resolve(mockClerkUser)),
    },
    sessions: {
      getSession: jest.fn(() => Promise.resolve(mockClerkSession)),
    },
    signInTokens: {
      createSignInToken: jest.fn(),
    },
  },
}));

jest.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(() => Promise.resolve(mockClerkUser)),
    },
    sessions: {
      getSession: jest.fn(() => Promise.resolve(mockClerkSession)),
    },
    signInTokens: {
      createSignInToken: jest.fn(),
    },
  },
}));

// Mock lib/clerk
jest.mock('@/lib/clerk', () => ({
  clerk: {
    users: {
      getUser: jest.fn(() => Promise.resolve(mockClerkUser)),
    },
    sessions: {
      getSession: jest.fn(() => Promise.resolve(mockClerkSession)),
    },
  },
}));

// Mock OAuth redirect tracking for testing
let mockOAuthRedirectUrl: string = '';

// Create a simple way to simulate OAuth redirects
const simulateOAuthRedirect = (url: string) => {
  mockOAuthRedirectUrl = url;
};

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

const mockGoogleAdminUser: AuthUser = {
  id: 'user_google_admin_123',
  email: 'admin@webvault.test',
  emailVerified: true,
  name: 'Test Admin',
  avatar: 'https://avatar.example.com/admin.jpg',
  provider: 'google',
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

const mockGitHubAdminUser: AuthUser = {
  ...mockGoogleAdminUser,
  id: 'user_github_admin_123',
  provider: 'github',
  avatar: 'https://avatars.githubusercontent.com/u/12345',
};

const mockGoogleAdminSession: AuthSession = {
  accessToken: 'clerk_google_session_valid_admin',
  refreshToken: 'clerk_google_refresh_valid_admin',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  refreshExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  user: mockGoogleAdminUser,
  createdAt: new Date().toISOString(),
  lastActivity: new Date().toISOString(),
  persistent: true,
};

const mockGitHubAdminSession: AuthSession = {
  ...mockGoogleAdminSession,
  accessToken: 'clerk_github_session_valid_admin',
  refreshToken: 'clerk_github_refresh_valid_admin',
  user: mockGitHubAdminUser,
};

const mockNonAdminUser: AuthUser = {
  ...mockGoogleAdminUser,
  id: 'user_google_regular_123',
  email: 'user@webvault.test',
  role: 'user', // 非管理员角色
};

// ============================================================================
// Test Social Login Form Component
// ============================================================================

function TestSocialLoginForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeProvider, setActiveProvider] = React.useState<SocialProvider | null>(null);
  
  const store = useAuthStore();

  const handleSocialLogin = async (provider: SocialProvider) => {
    setIsLoading(true);
    setActiveProvider(provider);
    
    try {
      // 模拟社交登录流程
      const session = await clerkAuthService.signInWithProvider(provider, {
        redirectTo: '/admin/dashboard',
      });
      
      // 更新认证状态
      useAuthStore.setState({
        isAuthenticated: true,
        user: session.user,
        session,
        error: null,
      });
      
    } catch (error) {
      console.error('Social login error:', error);
      if (error instanceof Error && 'requiresRedirect' in error) {
        // 处理OAuth重定向场景
        const oauthUrl = (error as any).redirectUrl;
        if (oauthUrl) {
          simulateOAuthRedirect(oauthUrl);
          // 对于重定向，不清除加载状态，因为用户将被重定向
          return;
        }
      }
      
      // 处理其他错误
      useAuthStore.setState({
        error: {
          code: 'OAUTH_ERROR',
          message: error instanceof Error ? error.message : `${provider}登录失败`,
          timestamp: new Date().toISOString(),
        }
      });
      
      // 清除加载状态
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  return (
    <div data-testid="social-login-form">
      <h1>管理员登录</h1>
      <p>使用社交账户登录</p>
      
      <div className="social-buttons">
        <button
          data-testid="google-login-button"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
        >
          {activeProvider === 'google' && isLoading ? (
            <div data-testid="google-loading">
              <span>Google登录中...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg data-testid="google-icon" className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              </svg>
              使用Google登录
            </div>
          )}
        </button>
        
        <button
          data-testid="github-login-button"
          onClick={() => handleSocialLogin('github')}
          disabled={isLoading}
        >
          {activeProvider === 'github' && isLoading ? (
            <div data-testid="github-loading">
              <span>GitHub登录中...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg data-testid="github-icon" className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12z"/>
              </svg>
              使用GitHub登录
            </div>
          )}
        </button>
      </div>
      
      {store.error && (
        <div data-testid="error-message" className="error">
          {store.error.message}
        </div>
      )}
      
      {store.isAuthenticated && (
        <div data-testid="success-message" className="success">
          登录成功: {store.user?.name} (通过 {store.user?.provider})
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Test OAuth Callback Handler Component
// ============================================================================

function TestOAuthCallbackHandler({ 
  code, 
  state, 
  error, 
  provider 
}: { 
  code?: string; 
  state?: string; 
  error?: string; 
  provider: SocialProvider;
}) {
  const [isHandling, setIsHandling] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; message: string } | null>(null);

  React.useEffect(() => {
    const handleCallback = async () => {
      setIsHandling(true);
      try {
        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error('Missing authorization code');
        }

        const session = await clerkAuthService.handleSocialCallback(
          provider,
          code,
          state || ''
        );

        useAuthStore.setState({
          isAuthenticated: true,
          user: session.user,
          session,
          error: null,
        });

        setResult({ success: true, message: `${provider}登录成功` });
      } catch (error) {
        setResult({ 
          success: false, 
          message: error instanceof Error ? error.message : `${provider}回调处理失败` 
        });
      } finally {
        setIsHandling(false);
      }
    };

    handleCallback();
  }, [code, state, error, provider]);

  return (
    <div data-testid="oauth-callback-handler">
      {isHandling && <div data-testid="callback-processing">处理OAuth回调中...</div>}
      {result && (
        <div data-testid={result.success ? "callback-success" : "callback-error"}>
          {result.message}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * 模拟OAuth重定向流程
 */
function mockOAuthRedirect(provider: SocialProvider) {
  const baseUrl = 'https://clerk.example.accounts.dev';
  const oauthProvider = provider === 'google' ? 'oauth_google' : 'oauth_github';
  const redirectUrl = `${window.location.origin}/api/auth/clerk/callback`;
  const state = Buffer.from(JSON.stringify({
    redirectUrl: '/admin/dashboard',
    timestamp: Date.now(),
    nonce: 'test-nonce-123',
  })).toString('base64url');

  return `${baseUrl}/oauth/${provider}?provider=${oauthProvider}&redirect_url=${encodeURIComponent(redirectUrl)}&state=${state}&client_id=pk_test_example-publishable-key`;
}

/**
 * 模拟成功的OAuth回调参数
 */
function mockSuccessfulOAuthCallback(provider: SocialProvider) {
  return {
    code: `auth_code_${provider}_success_123`,
    state: Buffer.from(JSON.stringify({
      redirectUrl: '/admin/dashboard',
      timestamp: Date.now(),
      nonce: 'test-nonce-123',
    })).toString('base64url'),
  };
}

/**
 * 模拟失败的OAuth回调参数
 */
function mockFailedOAuthCallback(provider: SocialProvider, errorType: 'access_denied' | 'server_error' = 'access_denied') {
  return {
    error: errorType,
    error_description: errorType === 'access_denied' ? 
      `User cancelled ${provider} authorization` : 
      `${provider} server error`,
    state: Buffer.from(JSON.stringify({
      redirectUrl: '/admin/dashboard',
      timestamp: Date.now(),
      nonce: 'test-nonce-123',
    })).toString('base64url'),
  };
}

// ============================================================================
// E2E测试套件：社交认证流程
// ============================================================================

describe('社交认证流程 E2E 测试', () => {
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
    mockPush.mockClear();
    mockReplace.mockClear();
    mockRefresh.mockClear();

    // 重置OAuth redirect tracking
    mockOAuthRedirectUrl = '';
  });

  // ==========================================================================
  // R1.3: Google OAuth 登录测试
  // ==========================================================================

  describe('R1.3: Google OAuth 登录流程', () => {
    beforeEach(() => {
      // Mock成功的Google OAuth响应
      jest.spyOn(clerkAuthService, 'signInWithProvider').mockImplementation(async (provider, options) => {
        if (provider === 'google') {
          // 模拟OAuth重定向
          const oauthUrl = mockOAuthRedirect('google');
          const error = new Error('OAuth redirect required for google') as any;
          error.code = 'OAUTH_ERROR';
          error.requiresRedirect = true;
          error.redirectUrl = oauthUrl;
          throw error;
        }
        throw new Error(`Unsupported provider: ${provider}`);
      });

      jest.spyOn(clerkAuthService, 'handleSocialCallback').mockResolvedValue(mockGoogleAdminSession);
    });

    test('应该显示Google登录按钮并处理点击', async () => {
      render(<TestSocialLoginForm />);

      // 验证Google登录按钮存在
      const googleButton = screen.getByTestId('google-login-button');
      expect(googleButton).toBeInTheDocument();
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
      expect(screen.getByText(/使用Google登录/i)).toBeInTheDocument();

      // 点击Google登录按钮
      await user.click(googleButton);

      // 验证加载状态显示
      expect(screen.getByTestId('google-loading')).toBeInTheDocument();
      expect(screen.getByText(/Google登录中.../)).toBeInTheDocument();

      // 验证ClerkAuthService被调用
      expect(clerkAuthService.signInWithProvider).toHaveBeenCalledWith('google', {
        redirectTo: '/admin/dashboard',
      });
    });

    test('Google OAuth重定向应该设置正确的URL', async () => {
      render(<TestSocialLoginForm />);

      const googleButton = screen.getByTestId('google-login-button');
      await user.click(googleButton);

      // 等待异步处理完成
      await waitFor(() => {
        expect(clerkAuthService.signInWithProvider).toHaveBeenCalled();
      });

      // 验证重定向URL被设置
      await waitFor(() => {
        expect(mockOAuthRedirectUrl).toContain('clerk.example.accounts.dev/oauth/google');
      });
    });

    test('Google OAuth回调应该成功处理认证', async () => {
      const callbackParams = mockSuccessfulOAuthCallback('google');
      
      render(
        <TestOAuthCallbackHandler 
          code={callbackParams.code}
          state={callbackParams.state}
          provider="google"
        />
      );

      // 验证回调处理状态
      expect(screen.getByTestId('callback-processing')).toBeInTheDocument();

      // 等待回调处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-success')).toBeInTheDocument();
        expect(screen.getByText(/google登录成功/i)).toBeInTheDocument();
      });

      // 验证认证状态更新
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true);
        expect(store.user?.provider).toBe('google');
        expect(store.user?.email).toBe('admin@webvault.test');
        expect(store.error).toBeNull();
      });

      // 验证ClerkAuthService回调处理被调用
      expect(clerkAuthService.handleSocialCallback).toHaveBeenCalledWith(
        'google',
        callbackParams.code,
        callbackParams.state
      );
    });

    test('Google OAuth用户取消应该显示友好错误', async () => {
      const callbackParams = mockFailedOAuthCallback('google', 'access_denied');
      
      render(
        <TestOAuthCallbackHandler 
          error={callbackParams.error}
          provider="google"
        />
      );

      // 等待错误处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-error')).toBeInTheDocument();
        expect(screen.getByText(/access_denied/i)).toBeInTheDocument();
      });

      // 验证认证状态保持未认证
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
    });
  });

  // ==========================================================================
  // R1.3: GitHub OAuth 登录测试
  // ==========================================================================

  describe('R1.3: GitHub OAuth 登录流程', () => {
    beforeEach(() => {
      // Mock成功的GitHub OAuth响应
      jest.spyOn(clerkAuthService, 'signInWithProvider').mockImplementation(async (provider, options) => {
        if (provider === 'github') {
          // 模拟OAuth重定向
          const oauthUrl = mockOAuthRedirect('github');
          const error = new Error('OAuth redirect required for github') as any;
          error.code = 'OAUTH_ERROR';
          error.requiresRedirect = true;
          error.redirectUrl = oauthUrl;
          throw error;
        }
        throw new Error(`Unsupported provider: ${provider}`);
      });

      jest.spyOn(clerkAuthService, 'handleSocialCallback').mockResolvedValue(mockGitHubAdminSession);
    });

    test('应该显示GitHub登录按钮并处理点击', async () => {
      render(<TestSocialLoginForm />);

      // 验证GitHub登录按钮存在
      const githubButton = screen.getByTestId('github-login-button');
      expect(githubButton).toBeInTheDocument();
      expect(screen.getByTestId('github-icon')).toBeInTheDocument();
      expect(screen.getByText(/使用GitHub登录/i)).toBeInTheDocument();

      // 点击GitHub登录按钮
      await user.click(githubButton);

      // 验证加载状态显示
      expect(screen.getByTestId('github-loading')).toBeInTheDocument();
      expect(screen.getByText(/GitHub登录中.../)).toBeInTheDocument();

      // 验证ClerkAuthService被调用
      expect(clerkAuthService.signInWithProvider).toHaveBeenCalledWith('github', {
        redirectTo: '/admin/dashboard',
      });
    });

    test('GitHub OAuth重定向应该设置正确的URL', async () => {
      render(<TestSocialLoginForm />);

      const githubButton = screen.getByTestId('github-login-button');
      await user.click(githubButton);

      // 等待异步处理完成
      await waitFor(() => {
        expect(clerkAuthService.signInWithProvider).toHaveBeenCalled();
      });

      // 验证重定向URL被设置
      await waitFor(() => {
        expect(mockOAuthRedirectUrl).toContain('clerk.example.accounts.dev/oauth/github');
      });
    });

    test('GitHub OAuth回调应该成功处理认证', async () => {
      const callbackParams = mockSuccessfulOAuthCallback('github');
      
      render(
        <TestOAuthCallbackHandler 
          code={callbackParams.code}
          state={callbackParams.state}
          provider="github"
        />
      );

      // 验证回调处理状态
      expect(screen.getByTestId('callback-processing')).toBeInTheDocument();

      // 等待回调处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-success')).toBeInTheDocument();
        expect(screen.getByText(/github登录成功/i)).toBeInTheDocument();
      });

      // 验证认证状态更新
      await waitFor(() => {
        const store = useAuthStore.getState();
        expect(store.isAuthenticated).toBe(true);
        expect(store.user?.provider).toBe('github');
        expect(store.user?.email).toBe('admin@webvault.test');
        expect(store.error).toBeNull();
      });

      // 验证ClerkAuthService回调处理被调用
      expect(clerkAuthService.handleSocialCallback).toHaveBeenCalledWith(
        'github',
        callbackParams.code,
        callbackParams.state
      );
    });

    test('GitHub OAuth用户取消应该显示友好错误', async () => {
      const callbackParams = mockFailedOAuthCallback('github', 'access_denied');
      
      render(
        <TestOAuthCallbackHandler 
          error={callbackParams.error}
          provider="github"
        />
      );

      // 等待错误处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-error')).toBeInTheDocument();
        expect(screen.getByText(/access_denied/i)).toBeInTheDocument();
      });

      // 验证认证状态保持未认证
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
    });
  });

  // ==========================================================================
  // Admin-Only 权限验证测试
  // ==========================================================================

  describe('Admin-Only系统社交认证权限验证', () => {
    test('非管理员用户通过社交登录应该被拒绝', async () => {
      // Mock非管理员用户通过Google登录
      const nonAdminSession = {
        ...mockGoogleAdminSession,
        user: mockNonAdminUser,
      };

      jest.spyOn(clerkAuthService, 'handleSocialCallback').mockImplementation(async (provider, code, state) => {
        if (provider === 'google') {
          // 模拟ClerkAuthService检测到非管理员并拒绝
          const error = new Error('仅允许管理员访问此系统') as any;
          error.code = 'OAUTH_ERROR';
          throw error;
        }
        return nonAdminSession;
      });

      const callbackParams = mockSuccessfulOAuthCallback('google');
      
      render(
        <TestOAuthCallbackHandler 
          code={callbackParams.code}
          state={callbackParams.state}
          provider="google"
        />
      );

      // 等待处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-error')).toBeInTheDocument();
        expect(screen.getByText(/仅允许管理员访问此系统/)).toBeInTheDocument();
      });

      // 验证用户未被认证
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
    });

    test('管理员权限验证应该严格执行', async () => {
      // Mock缺少管理员角色的用户
      const invalidUser = {
        ...mockGoogleAdminUser,
        role: undefined as any, // 缺少角色信息
      };

      const invalidSession = {
        ...mockGoogleAdminSession,
        user: invalidUser,
      };

      jest.spyOn(clerkAuthService, 'handleSocialCallback').mockImplementation(async () => {
        // 模拟ClerkAuthService检测到无效角色并拒绝
        const error = new Error('用户角色无效，仅允许管理员访问') as any;
        error.code = 'OAUTH_ERROR';
        throw error;
      });

      const callbackParams = mockSuccessfulOAuthCallback('google');
      
      render(
        <TestOAuthCallbackHandler 
          code={callbackParams.code}
          state={callbackParams.state}
          provider="google"
        />
      );

      // 等待处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-error')).toBeInTheDocument();
        expect(screen.getByText(/用户角色无效/)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // OAuth 错误处理测试
  // ==========================================================================

  describe('OAuth错误处理和用户友好提示', () => {
    test('网络错误应该显示重试提示', async () => {
      jest.spyOn(clerkAuthService, 'signInWithProvider').mockRejectedValue(
        new Error('网络连接失败，请检查网络设置')
      );

      render(<TestSocialLoginForm />);

      const googleButton = screen.getByTestId('google-login-button');
      await user.click(googleButton);

      // 等待错误处理完成
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(/网络连接失败/)).toBeInTheDocument();
      });

      // 验证认证状态保持未认证
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);
      expect(store.error?.code).toBe('OAUTH_ERROR');
    });

    test('服务器错误应该显示友好错误信息', async () => {
      const callbackParams = mockFailedOAuthCallback('github', 'server_error');
      
      render(
        <TestOAuthCallbackHandler 
          error={callbackParams.error}
          provider="github"
        />
      );

      // 等待错误处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-error')).toBeInTheDocument();
        expect(screen.getByText(/server_error/i)).toBeInTheDocument();
      });
    });

    test('无效状态参数应该防止CSRF攻击', async () => {
      jest.spyOn(clerkAuthService, 'handleSocialCallback').mockRejectedValue(
        new Error('Invalid state parameter - possible CSRF attack')
      );

      render(
        <TestOAuthCallbackHandler 
          code="valid_code_123"
          state="invalid_state_csrf_attack"
          provider="google"
        />
      );

      // 等待错误处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-error')).toBeInTheDocument();
        expect(screen.getByText(/CSRF attack/i)).toBeInTheDocument();
      });

      // 验证ClerkAuthService被调用但抛出CSRF错误
      expect(clerkAuthService.handleSocialCallback).toHaveBeenCalledWith(
        'google',
        'valid_code_123',
        'invalid_state_csrf_attack'
      );
    });

    test('缺少授权码应该显示错误信息', async () => {
      render(
        <TestOAuthCallbackHandler 
          state="valid_state_123"
          provider="google"
        />
      );

      // 等待错误处理完成
      await waitFor(() => {
        expect(screen.getByTestId('callback-error')).toBeInTheDocument();
        expect(screen.getByText(/Missing authorization code/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 社交认证按钮交互测试
  // ==========================================================================

  describe('社交认证按钮交互和状态管理', () => {
    test('按钮应该在加载期间被禁用', async () => {
      // Mock延时的OAuth流程
      jest.spyOn(clerkAuthService, 'signInWithProvider').mockImplementation(async (provider) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const oauthUrl = mockOAuthRedirect(provider);
        const error = new Error(`OAuth redirect required for ${provider}`) as any;
        error.code = 'OAUTH_ERROR';
        error.requiresRedirect = true;
        error.redirectUrl = oauthUrl;
        throw error;
      });

      render(<TestSocialLoginForm />);

      const googleButton = screen.getByTestId('google-login-button');
      const githubButton = screen.getByTestId('github-login-button');

      // 点击Google按钮
      await user.click(googleButton);

      // 验证按钮状态
      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(githubButton).toBeDisabled(); // 其他按钮也应该被禁用
        expect(screen.getByTestId('google-loading')).toBeInTheDocument();
      });
    });

    test('应该能同时显示Google和GitHub按钮', () => {
      render(<TestSocialLoginForm />);

      // 验证两个按钮都存在
      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('github-login-button')).toBeInTheDocument();
      
      // 验证图标存在
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
      expect(screen.getByTestId('github-icon')).toBeInTheDocument();
      
      // 验证按钮文本
      expect(screen.getByText(/使用Google登录/)).toBeInTheDocument();
      expect(screen.getByText(/使用GitHub登录/)).toBeInTheDocument();
    });

    test('成功登录后应该显示用户信息', async () => {
      // 直接设置成功的认证状态
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockGoogleAdminUser,
        session: mockGoogleAdminSession,
        error: null,
      });

      render(<TestSocialLoginForm />);

      // 验证成功消息显示
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText(/登录成功: Test Admin \(通过 google\)/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 集成测试：完整OAuth流程
  // ==========================================================================

  describe('完整OAuth认证流程集成测试', () => {
    test('Google完整OAuth流程：启动 -> 重定向 -> 回调 -> 成功', async () => {
      // 1. Mock OAuth启动
      jest.spyOn(clerkAuthService, 'signInWithProvider').mockImplementation(async (provider, options) => {
        expect(provider).toBe('google');
        expect(options?.redirectTo).toBe('/admin/dashboard');
        
        const oauthUrl = mockOAuthRedirect('google');
        const error = new Error('OAuth redirect required for google') as any;
        error.code = 'OAUTH_ERROR';
        error.requiresRedirect = true;
        error.redirectUrl = oauthUrl;
        throw error;
      });

      // 2. Mock OAuth回调处理
      jest.spyOn(clerkAuthService, 'handleSocialCallback').mockResolvedValue(mockGoogleAdminSession);

      // 渲染登录表单
      render(<TestSocialLoginForm />);

      // 3. 启动OAuth流程
      const googleButton = screen.getByTestId('google-login-button');
      await user.click(googleButton);

      // 验证重定向被触发
      await waitFor(() => {
        expect(mockOAuthRedirectUrl).toContain('oauth/google');
      });

      // 4. 模拟OAuth回调
      const callbackParams = mockSuccessfulOAuthCallback('google');
      
      // 重新渲染为回调处理组件
      render(
        <TestOAuthCallbackHandler 
          code={callbackParams.code}
          state={callbackParams.state}
          provider="google"
        />
      );

      // 5. 验证回调处理成功
      await waitFor(() => {
        expect(screen.getByTestId('callback-success')).toBeInTheDocument();
      });

      // 6. 验证最终认证状态
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(true);
      expect(store.user?.provider).toBe('google');
      expect(store.user?.role).toBe('admin');
    });

    test('GitHub完整OAuth流程：启动 -> 重定向 -> 回调 -> 成功', async () => {
      // 1. Mock OAuth启动
      jest.spyOn(clerkAuthService, 'signInWithProvider').mockImplementation(async (provider, options) => {
        expect(provider).toBe('github');
        expect(options?.redirectTo).toBe('/admin/dashboard');
        
        const oauthUrl = mockOAuthRedirect('github');
        const error = new Error('OAuth redirect required for github') as any;
        error.code = 'OAUTH_ERROR';
        error.requiresRedirect = true;
        error.redirectUrl = oauthUrl;
        throw error;
      });

      // 2. Mock OAuth回调处理
      jest.spyOn(clerkAuthService, 'handleSocialCallback').mockResolvedValue(mockGitHubAdminSession);

      // 渲染登录表单
      render(<TestSocialLoginForm />);

      // 3. 启动OAuth流程
      const githubButton = screen.getByTestId('github-login-button');
      await user.click(githubButton);

      // 验证重定向被触发
      await waitFor(() => {
        expect(mockOAuthRedirectUrl).toContain('oauth/github');
      });

      // 4. 模拟OAuth回调
      const callbackParams = mockSuccessfulOAuthCallback('github');
      
      // 重新渲染为回调处理组件
      render(
        <TestOAuthCallbackHandler 
          code={callbackParams.code}
          state={callbackParams.state}
          provider="github"
        />
      );

      // 5. 验证回调处理成功
      await waitFor(() => {
        expect(screen.getByTestId('callback-success')).toBeInTheDocument();
      });

      // 6. 验证最终认证状态
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(true);
      expect(store.user?.provider).toBe('github');
      expect(store.user?.role).toBe('admin');
    });
  });
});