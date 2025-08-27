/**
 * Authentication Context and Hook Implementation
 * 
 * 实现认证上下文提供者和消费者hook，为整个应用提供认证状态访问。
 * 集成Zustand store、Supabase认证服务和会话管理功能。
 * 
 * Requirements:
 * - 5.1: 会话管理 (30天持久化，自动刷新，明确登出终止)
 * - 提供整个应用的认证状态访问
 * - 实现会话验证和自动刷新逻辑
 * - 集成Supabase认证系统
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { createContext, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useClerkAuth } from './useClerkAuth';
import { 
  AuthUser, 
  AuthSession, 
  AuthError, 
  AuthContextType,
  DEFAULT_SESSION_CONFIG 
} from '../types';

// ============================================================================
// Authentication Context Definition
// ============================================================================

/**
 * React Context for authentication state
 * 
 * 提供认证状态的全局访问，包括用户信息、会话数据和相关操作方法。
 * 通过Context API确保状态在整个应用中的一致性。
 */
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// Authentication Provider Component
// ============================================================================

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** 是否启用自动初始化 */
  autoInitialize?: boolean;
  /** 是否启用会话自动刷新 */
  autoRefresh?: boolean;
  /** 会话检查间隔 (毫秒) */
  sessionCheckInterval?: number;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * Authentication Provider Component
 * 
 * 认证上下文提供者，管理全局认证状态和会话生命周期。
 * 
 * Features:
 * - 自动初始化认证状态
 * - 会话验证和自动刷新
 * - Supabase认证事件监听
 * - 会话过期检测和处理
 * 
 * Requirements: 5.1 (会话管理)
 */
export function AuthProvider({
  children,
  autoInitialize = true,
  autoRefresh = true,
  sessionCheckInterval = 5 * 60 * 1000, // 5分钟
  debug = false,
}: AuthProviderProps) {
  // ========================================================================
  // Clerk Integration
  // ========================================================================
  
  const clerkAuth = useClerkAuth();
  
  // 映射到我们的接口
  const isAuthenticated = clerkAuth.isAuthenticated;
  const isLoading = clerkAuth.isLoading;
  const user = clerkAuth.user;
  const session = clerkAuth.session;
  const error = clerkAuth.error;
  const isInitialized = !clerkAuth.isLoading;
  
  // 简化的操作方法
  const login = async (email: string, password: string, rememberMe?: boolean) => {
    await clerkAuth.signInWithEmail(email, password);
  };
  
  const loginWithProvider = async (provider: 'google' | 'github') => {
    if (provider === 'google') {
      await clerkAuth.signInWithGoogle();
    } else if (provider === 'github') {
      await clerkAuth.signInWithGitHub();
    }
  };
  
  const logout = async () => {
    await clerkAuth.signOut();
  };
  
  // 占位方法
  const register = async () => {
    throw new Error('系统不支持用户注册，请联系管理员获取访问权限');
  };
  
  const refreshSession = async () => {
    // Clerk 自动处理会话刷新
    return session!;
  };
  
  const resetPassword = async (email: string) => {
    throw new Error('请使用 Clerk 的密码重置界面');
  };
  
  const confirmPasswordReset = async (token: string, newPassword: string) => {
    throw new Error('请使用 Clerk 的密码重置界面');
  };
  
  const updateProfile = async (updates: Partial<Pick<AuthUser, 'name' | 'avatar'>>) => {
    throw new Error('请使用 Clerk 的用户资料界面');
  };
  
  const clearError = () => {
    // 错误由 Clerk hooks 处理
  };
  
  const initialize = async () => {
    // Clerk 自动初始化
  };
  
  const resetLoginAttempts = () => {
    // 由 Clerk 处理
  };
  
  // 简化的安全状态
  const loginAttempts = 0;
  const isLocked = false;
  const lockoutExpiresAt = null;

  // ========================================================================
  // Admin Role Validation for Admin-Only System
  // ========================================================================

  /**
   * 验证用户是否为管理员
   * Admin-Only系统的核心权限检查
   */
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'admin') {
      console.warn('[AuthProvider] 非管理员用户尝试登录，自动登出');
      logout().catch(console.error);
    }
  }, [isAuthenticated, user, logout]);

  // ========================================================================
  // Context Value Memoization
  // ========================================================================

  /**
   * 构建Context值
   * 
   * 合并认证状态和操作方法，提供完整的认证Context。
   * 使用useMemo优化性能，避免不必要的重新渲染。
   */
  const contextValue = useMemo<AuthContextType>(() => ({
    // 基础认证状态
    isAuthenticated,
    isLoading,
    user,
    session,
    error,
    isInitialized,
    
    // 安全状态  
    loginAttempts,
    isLocked,
    lockoutExpiresAt,
    
    // 基础操作方法
    initialize,
    login,
    loginWithProvider,
    register,
    logout,
    refreshSession,
    resetPassword,
    confirmPasswordReset,
    updateProfile,
    clearError,
    resetLoginAttempts,
  }), [
    isAuthenticated,
    isLoading,
    user,
    session,
    error,
    isInitialized,
    loginAttempts,
    isLocked,
    lockoutExpiresAt,
  ]);

  // ========================================================================
  // Provider Render
  // ========================================================================

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Authentication Hook
// ============================================================================

/**
 * Authentication Hook
 * 
 * 消费者hook，提供对认证Context的便捷访问。
 * 包含错误处理和使用验证逻辑。
 * 
 * @returns 认证状态和操作方法
 * @throws Error 如果在AuthProvider外部使用
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, user, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginForm onLogin={login} />;
 *   }
 *   
 *   return <UserDashboard user={user} onLogout={logout} />;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Please wrap your component tree with <AuthProvider>.'
    );
  }
  
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * 用户状态Hook
 * 
 * 提供用户相关状态的便捷访问，包含常用的计算属性。
 */
export function useAuthUser() {
  const { user, isAuthenticated } = useAuth();
  
  return useMemo(() => ({
    user,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    userName: user?.name || user?.email || 'Anonymous User',
    userEmail: user?.email || '',
    userAvatar: user?.avatar,
    userInitials: user?.name
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : user?.email?.[0]?.toUpperCase() || 'U',
  }), [user, isAuthenticated]);
}

/**
 * 会话状态Hook
 * 
 * 提供会话相关状态的便捷访问，包含过期时间计算。
 * Requirements: 5.1 (会话管理)
 */
export function useAuthSession() {
  const { session, isAuthenticated, refreshSession } = useAuth();
  
  return useMemo(() => {
    if (!session || !isAuthenticated) {
      return {
        session: null,
        isSessionValid: false,
        timeUntilExpiry: 0,
        minutesUntilExpiry: 0,
        shouldRefreshSoon: false,
        refreshSession,
      };
    }

    const now = new Date().getTime();
    const expiresAt = new Date(session.expiresAt).getTime();
    const timeUntilExpiry = Math.max(0, expiresAt - now);
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
    const shouldRefreshSoon = timeUntilExpiry <= DEFAULT_SESSION_CONFIG.refreshThreshold;

    return {
      session,
      isSessionValid: timeUntilExpiry > 0,
      timeUntilExpiry,
      minutesUntilExpiry,
      shouldRefreshSoon,
      refreshSession,
    };
  }, [session, isAuthenticated, refreshSession]);
}

/**
 * 认证操作Hook
 * 
 * 提供认证操作方法的便捷访问，包含加载状态处理。
 */
export function useAuthActions() {
  const { 
    login, 
    loginWithProvider, 
    register, 
    logout, 
    resetPassword, 
    confirmPasswordReset,
    updateProfile,
    clearError,
    isLoading,
    error 
  } = useAuth();
  
  return useMemo(() => ({
    // 操作方法
    login,
    loginWithProvider,
    register,
    logout,
    resetPassword,
    confirmPasswordReset,
    updateProfile,
    clearError,
    
    // 状态
    isLoading,
    error,
    hasError: !!error,
    
    // 便捷方法
    loginWithEmail: (email: string, password: string, rememberMe?: boolean) =>
      login(email, password, rememberMe),
    
    loginWithGoogle: () => loginWithProvider('google'),
    loginWithGitHub: () => loginWithProvider('github'),
  }), [
    login,
    loginWithProvider,
    register,
    logout,
    resetPassword,
    confirmPasswordReset,
    updateProfile,
    clearError,
    isLoading,
    error,
  ]);
}

// ============================================================================
// Default Exports
// ============================================================================

export default useAuth;