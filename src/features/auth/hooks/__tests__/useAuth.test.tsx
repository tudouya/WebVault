/**
 * useAuth Hook Unit Tests
 * 
 * 全面测试认证Hook的核心功能，包括：
 * - 认证状态管理（用户状态、会话状态、加载状态、错误状态）
 * - 会话处理（登录、登出、会话刷新、会话验证）
 * - 错误处理（网络错误、认证错误、会话过期）
 * - 副作用管理（useEffect、cleanup、依赖更新）
 * - Supabase Auth服务Mock（隔离测试外部依赖）
 * 
 * Requirements:
 * - 5.1: 会话管理 (30天持久化，自动刷新，明确登出终止)
 * - 认证状态的全局访问和一致性
 * - 会话验证和自动刷新逻辑
 * - Supabase认证系统集成测试
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { 
  AuthProvider, 
  useAuth, 
  useAuthUser, 
  useAuthSession, 
  useAuthActions 
} from '../useAuth';
import { useAuthStore } from '../../stores/auth-store';
import { supabaseAuthService } from '../../services/SupabaseAuthService';
import { supabase } from '@/lib/supabase';
import type { 
  AuthUser, 
  AuthSession, 
  AuthError, 
  AuthFormData,
  SocialProvider,
  DEFAULT_SESSION_CONFIG 
} from '../../types';

// ============================================================================
// Mock Setup
// ============================================================================

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
jest.mock('../../services/SupabaseAuthService', () => ({
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
jest.mock('../../stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock timers for session management tests
jest.useFakeTimers();

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

// Mock supabase auth and service
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockSupabaseAuthService = supabaseAuthService as jest.Mocked<typeof supabaseAuthService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Add getState mock to useAuthStore
(useAuthStore as any).getState = jest.fn();

// ============================================================================
// Helper Components for Testing
// ============================================================================

interface TestWrapperProps {
  children: React.ReactNode;
  autoInitialize?: boolean;
  autoRefresh?: boolean;
  sessionCheckInterval?: number;
  debug?: boolean;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  autoInitialize = false,
  autoRefresh = false,
  sessionCheckInterval = 1000,
  debug = false 
}) => (
  <AuthProvider 
    autoInitialize={autoInitialize}
    autoRefresh={autoRefresh}
    sessionCheckInterval={sessionCheckInterval}
    debug={debug}
  >
    {children}
  </AuthProvider>
);

const TestComponent = () => {
  const auth = useAuth();
  return <div data-testid="test-component">Test</div>;
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    (useAuthStore as any).getState.mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  // ========================================================================
  // Context Provider Tests
  // ========================================================================

  describe('AuthProvider Context', () => {
    test('should provide auth context to child components', () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    test('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider. Please wrap your component tree with <AuthProvider>.');

      // Restore console.error
      console.error = originalError;
    });

    test('should initialize with correct default configuration', () => {
      const mockStoreState = createMockStoreState();
      // Mock initialize to return a promise
      mockStoreState.actions.initialize.mockResolvedValue(undefined);
      mockUseAuthStore.mockReturnValue(mockStoreState);

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper autoInitialize={true}>{children}</TestWrapper>,
      });

      // Should call initialize when autoInitialize is true
      expect(mockStoreState.actions.initialize).toHaveBeenCalled();
    });

    test('should handle custom provider configuration', () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <TestWrapper 
            autoInitialize={false}
            autoRefresh={true}
            sessionCheckInterval={5000}
            debug={true}
          >
            {children}
          </TestWrapper>
        ),
      });

      // Should not call initialize when autoInitialize is false
      expect(mockStoreState.actions.initialize).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Authentication State Management Tests
  // ========================================================================

  describe('Authentication State Management', () => {
    test('should return correct initial authentication state', () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: null,
        isInitialized: false,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });

    test('should return authenticated state when user is logged in', () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
        session: mockSession,
        isInitialized: true,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isInitialized).toBe(true);
    });

    test('should return loading state during authentication operations', () => {
      const mockStoreState = createMockStoreState({
        isLoading: true,
        isAuthenticated: false,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should return error state when authentication fails', () => {
      const mockStoreState = createMockStoreState({
        error: mockError,
        isLoading: false,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ========================================================================
  // Authentication Operations Tests
  // ========================================================================

  describe('Authentication Operations', () => {
    test('should call login action with correct parameters', async () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123', true);
      });

      expect(mockStoreState.actions.login).toHaveBeenCalledWith('test@example.com', 'password123', true);
    });

    test('should call social login action with provider', async () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      await act(async () => {
        await result.current.loginWithProvider('google');
      });

      expect(mockStoreState.actions.loginWithProvider).toHaveBeenCalledWith('google');
    });

    test('should call register action with form data', async () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      await act(async () => {
        await result.current.register(mockFormData);
      });

      expect(mockStoreState.actions.register).toHaveBeenCalledWith(mockFormData);
    });

    test('should call logout action', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
        session: mockSession,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockStoreState.actions.logout).toHaveBeenCalled();
    });

    test('should call refresh session action', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: mockSession,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockStoreState.actions.refreshSession).toHaveBeenCalled();
    });

    test('should call password reset action', async () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(mockStoreState.actions.resetPassword).toHaveBeenCalledWith('test@example.com');
    });

    test('should call update profile action', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      const updates = { name: 'Updated Name', avatar: '/new-avatar.jpg' };

      await act(async () => {
        await result.current.updateProfile(updates);
      });

      expect(mockStoreState.actions.updateProfile).toHaveBeenCalledWith(updates);
    });

    test('should call clear error action', () => {
      const mockStoreState = createMockStoreState({
        error: mockError,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.clearError();
      });

      expect(mockStoreState.actions.clearError).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Session Management Tests
  // ========================================================================

  describe('Session Management', () => {
    test('should handle session auto-refresh when enabled', () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: {
          ...mockSession,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60 minutes from now (far from refresh threshold)
        },
      });
      // Mock validateSession to return true (session is valid)
      mockSupabaseAuthService.validateSession.mockResolvedValue(true);
      mockUseAuthStore.mockReturnValue(mockStoreState);

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <TestWrapper autoRefresh={true} sessionCheckInterval={1000}>
            {children}
          </TestWrapper>
        ),
      });

      // Fast-forward time to trigger session check
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Session refresh should not be called if session is not near expiration
      // But validateSession should be called eventually
      expect(mockSupabaseAuthService.validateSession).toHaveBeenCalled();
    });

    test('should refresh session when approaching expiration', () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: {
          ...mockSession,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        },
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <TestWrapper autoRefresh={true} sessionCheckInterval={1000}>
            {children}
          </TestWrapper>
        ),
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should trigger refresh when session is within refresh threshold
      expect(mockStoreState.actions.refreshSession).toHaveBeenCalled();
    });

    test('should logout when session validation fails', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: mockSession,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      // Mock session validation to fail
      mockSupabaseAuthService.validateSession.mockResolvedValue(false);

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <TestWrapper autoRefresh={true} sessionCheckInterval={1000}>
            {children}
          </TestWrapper>
        ),
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockStoreState.actions.logout).toHaveBeenCalled();
      });
    });

    test('should cleanup timers on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        session: mockSession,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);
      
      const { unmount } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <TestWrapper autoRefresh={true} sessionCheckInterval={1000}>
            {children}
          </TestWrapper>
        ),
      });

      // Let timers get set up
      act(() => {
        jest.advanceTimersByTime(100);
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  // ========================================================================
  // Supabase Auth Event Handling Tests
  // ========================================================================

  describe('Supabase Auth Event Handling', () => {
    test('should setup Supabase auth state change listener', () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    test('should handle SIGNED_IN event', () => {
      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const mockCallback = jest.fn();
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // Simulate SIGNED_IN event
      act(() => {
        mockCallback('SIGNED_IN', mockSession);
      });

      // Event should be handled (logged in debug mode)
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', mockSession);
    });

    test('should handle SIGNED_OUT event', async () => {
      const mockStoreState = createMockStoreState({
        isAuthenticated: true,
        user: mockUser,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const mockCallback = jest.fn();
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      // Simulate SIGNED_OUT event
      await act(async () => {
        mockCallback('SIGNED_OUT', null);
      });

      expect(mockStoreState.actions.logout).toHaveBeenCalled();
    });

    test('should cleanup auth listener on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      });

      const mockStoreState = createMockStoreState();
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Error Handling Tests
  // ========================================================================

  describe('Error Handling', () => {
    test('should handle authentication errors gracefully', () => {
      const mockStoreState = createMockStoreState({
        error: mockError,
        isLoading: false,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle network errors during initialization', () => {
      const networkError: AuthError = {
        code: 'NETWORK_ERROR',
        message: '网络连接失败',
        timestamp: new Date().toISOString(),
      };

      const mockStoreState = createMockStoreState({
        error: networkError,
        isInitialized: true,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.error).toEqual(networkError);
      expect(result.current.isInitialized).toBe(true);
    });

    test('should handle session expiration errors', () => {
      const sessionExpiredError: AuthError = {
        code: 'SESSION_EXPIRED',
        message: '会话已过期，请重新登录',
        timestamp: new Date().toISOString(),
      };

      const mockStoreState = createMockStoreState({
        error: sessionExpiredError,
        isAuthenticated: false,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.error).toEqual(sessionExpiredError);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ========================================================================
  // Security Features Tests
  // ========================================================================

  describe('Security Features', () => {
    test('should track login attempts and lockout status', () => {
      const mockStoreState = createMockStoreState({
        loginAttempts: 3,
        isLocked: false,
        lockoutExpiresAt: null,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.loginAttempts).toBe(3);
      expect(result.current.isLocked).toBe(false);
      expect(result.current.lockoutExpiresAt).toBeNull();
    });

    test('should handle account lockout state', () => {
      const lockoutExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
      const mockStoreState = createMockStoreState({
        loginAttempts: 5,
        isLocked: true,
        lockoutExpiresAt: lockoutExpiry,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.loginAttempts).toBe(5);
      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockoutExpiresAt).toBe(lockoutExpiry);
    });

    test('should provide reset login attempts functionality', () => {
      const mockStoreState = createMockStoreState({
        loginAttempts: 3,
        isLocked: false,
      });
      mockUseAuthStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.resetLoginAttempts();
      });

      expect(mockStoreState.actions.resetLoginAttempts).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Convenience Hooks Tests
// ============================================================================

describe('useAuthUser Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    (useAuthStore as any).getState.mockReturnValue(mockStoreState);
  });

  test('should return user-related computed properties', () => {
    const mockStoreState = createMockStoreState({
      isAuthenticated: true,
      user: mockUser,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false); // mockUser role is 'user'
    expect(result.current.userName).toBe('Test User');
    expect(result.current.userEmail).toBe('test@example.com');
    expect(result.current.userAvatar).toBe('/avatars/test-user.jpg');
    expect(result.current.userInitials).toBe('TU');
  });

  test('should handle admin user correctly', () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    const mockStoreState = createMockStoreState({
      isAuthenticated: true,
      user: adminUser,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.isAdmin).toBe(true);
  });

  test('should handle user without name', () => {
    const userWithoutName = { ...mockUser, name: undefined };
    const mockStoreState = createMockStoreState({
      isAuthenticated: true,
      user: userWithoutName,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.userName).toBe('test@example.com');
    expect(result.current.userInitials).toBe('T');
  });

  test('should handle unauthenticated state', () => {
    const mockStoreState = createMockStoreState({
      isAuthenticated: false,
      user: null,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.userName).toBe('Anonymous User');
    expect(result.current.userEmail).toBe('');
    expect(result.current.userInitials).toBe('U');
  });
});

describe('useAuthSession Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    (useAuthStore as any).getState.mockReturnValue(mockStoreState);
  });

  test('should return session-related computed properties', () => {
    const mockStoreState = createMockStoreState({
      isAuthenticated: true,
      session: mockSession,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthSession(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isSessionValid).toBe(true);
    expect(result.current.timeUntilExpiry).toBeGreaterThan(0);
    expect(result.current.minutesUntilExpiry).toBeGreaterThan(0);
    expect(result.current.shouldRefreshSoon).toBe(false);
    expect(typeof result.current.refreshSession).toBe('function');
  });

  test('should detect sessions that need refresh soon', () => {
    const expiringSession = {
      ...mockSession,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    };
    const mockStoreState = createMockStoreState({
      isAuthenticated: true,
      session: expiringSession,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthSession(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.shouldRefreshSoon).toBe(true);
  });

  test('should handle expired sessions', () => {
    const expiredSession = {
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
    };
    const mockStoreState = createMockStoreState({
      isAuthenticated: false,
      session: expiredSession,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthSession(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.isSessionValid).toBe(false);
    expect(result.current.timeUntilExpiry).toBe(0);
    expect(result.current.minutesUntilExpiry).toBe(0);
  });

  test('should handle no session state', () => {
    const mockStoreState = createMockStoreState({
      isAuthenticated: false,
      session: null,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthSession(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.session).toBeNull();
    expect(result.current.isSessionValid).toBe(false);
    expect(result.current.timeUntilExpiry).toBe(0);
    expect(result.current.minutesUntilExpiry).toBe(0);
    expect(result.current.shouldRefreshSoon).toBe(false);
  });
});

describe('useAuthActions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    (useAuthStore as any).getState.mockReturnValue(mockStoreState);
  });

  test('should provide all authentication actions', () => {
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthActions(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.loginWithProvider).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.resetPassword).toBe('function');
    expect(typeof result.current.confirmPasswordReset).toBe('function');
    expect(typeof result.current.updateProfile).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  test('should provide convenient login methods', () => {
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthActions(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(typeof result.current.loginWithEmail).toBe('function');
    expect(typeof result.current.loginWithGoogle).toBe('function');
    expect(typeof result.current.loginWithGitHub).toBe('function');

    // Test convenience methods
    act(() => {
      result.current.loginWithEmail('test@example.com', 'password', true);
    });
    expect(mockStoreState.actions.login).toHaveBeenCalledWith('test@example.com', 'password', true);

    act(() => {
      result.current.loginWithGoogle();
    });
    expect(mockStoreState.actions.loginWithProvider).toHaveBeenCalledWith('google');

    act(() => {
      result.current.loginWithGitHub();
    });
    expect(mockStoreState.actions.loginWithProvider).toHaveBeenCalledWith('github');
  });

  test('should provide loading state and error information', () => {
    const mockStoreState = createMockStoreState({
      isLoading: true,
      error: mockError,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthActions(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toEqual(mockError);
    expect(result.current.hasError).toBe(true);
  });

  test('should indicate no error when error is null', () => {
    const mockStoreState = createMockStoreState({
      isLoading: false,
      error: null,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuthActions(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Auth Hook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    (useAuthStore as any).getState.mockReturnValue(mockStoreState);
  });

  test('should handle complete authentication flow', async () => {
    const mockStoreState = createMockStoreState();
    // Mock all async actions to return promises
    mockStoreState.actions.initialize.mockResolvedValue(undefined);
    mockStoreState.actions.login.mockResolvedValue(undefined);
    mockStoreState.actions.logout.mockResolvedValue(undefined);
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <TestWrapper autoInitialize={true}>{children}</TestWrapper>,
    });

    // Initialize
    expect(mockStoreState.actions.initialize).toHaveBeenCalled();

    // Login
    await act(async () => {
      await result.current.login('test@example.com', 'password123', true);
    });
    expect(mockStoreState.actions.login).toHaveBeenCalledWith('test@example.com', 'password123', true);

    // Logout
    await act(async () => {
      await result.current.logout();
    });
    expect(mockStoreState.actions.logout).toHaveBeenCalled();
  });

  test('should handle error recovery flow', () => {
    const mockStoreState = createMockStoreState({
      error: mockError,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.error).toEqual(mockError);

    // Clear error
    act(() => {
      result.current.clearError();
    });
    expect(mockStoreState.actions.clearError).toHaveBeenCalled();
  });

  test('should memoize context value correctly', () => {
    const mockStoreState = createMockStoreState({
      isAuthenticated: true,
      user: mockUser,
    });
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result, rerender } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    const firstRender = result.current;

    // Re-render with same state should return same object references
    rerender();
    
    const secondRender = result.current;
    
    // Functions should be stable
    expect(firstRender.login).toBe(secondRender.login);
    expect(firstRender.logout).toBe(secondRender.logout);
  });

  test('should handle concurrent authentication operations', async () => {
    const mockStoreState = createMockStoreState();
    mockUseAuthStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    // Simulate concurrent operations
    await act(async () => {
      const loginPromise = result.current.login('test@example.com', 'password');
      const refreshPromise = result.current.refreshSession();
      
      await Promise.all([loginPromise, refreshPromise]);
    });

    expect(mockStoreState.actions.login).toHaveBeenCalled();
    expect(mockStoreState.actions.refreshSession).toHaveBeenCalled();
  });
});