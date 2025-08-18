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
import { useAuthStore } from '../stores/auth-store';
import { supabaseAuthService } from '../services/SupabaseAuthService';
import { supabase } from '@/lib/supabase';
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
  // Store Integration
  // ========================================================================
  
  const {
    // 状态
    isAuthenticated,
    isLoading,
    user,
    session,
    error,
    isInitialized,
    loginAttempts,
    isLocked,
    lockoutExpiresAt,
    
    // 操作方法
    actions: {
      login,
      loginWithProvider,
      register,
      logout,
      refreshSession,
      resetPassword,
      confirmPasswordReset,
      updateProfile,
      clearError,
      initialize,
      resetLoginAttempts,
    }
  } = useAuthStore();

  // ========================================================================
  // Session Management & Auto-refresh Logic
  // ========================================================================

  /**
   * 检查会话是否需要刷新
   * 
   * 基于refreshThreshold设置，在会话过期前自动刷新。
   * Requirements: 5.1 (自动刷新)
   */
  const shouldRefreshSession = useCallback((session: AuthSession): boolean => {
    if (!session || !session.expiresAt) {
      return false;
    }

    const now = new Date().getTime();
    const expiresAt = new Date(session.expiresAt).getTime();
    const refreshThreshold = DEFAULT_SESSION_CONFIG.refreshThreshold;
    
    // 在过期前15分钟触发刷新
    return (expiresAt - now) <= refreshThreshold;
  }, []);

  /**
   * 验证会话有效性
   * 
   * 检查会话是否过期，并触发相应的处理逻辑。
   * Requirements: 5.1 (会话验证)
   */
  const validateSession = useCallback(async (session: AuthSession): Promise<boolean> => {
    try {
      // 检查本地会话过期
      const now = new Date().getTime();
      const expiresAt = new Date(session.expiresAt).getTime();
      
      if (now >= expiresAt) {
        if (debug) {
          console.log('[AuthProvider] Session expired locally');
        }
        return false;
      }

      // 通过Supabase验证会话
      const isValid = await supabaseAuthService.validateSession(session);
      
      if (!isValid && debug) {
        console.log('[AuthProvider] Session validation failed with Supabase');
      }
      
      return isValid;
    } catch (error) {
      console.error('[AuthProvider] Session validation error:', error);
      return false;
    }
  }, [debug]);

  /**
   * 自动会话刷新逻辑
   * 
   * 定期检查会话状态，在需要时自动刷新或处理过期。
   * Requirements: 5.1 (自动刷新)
   */
  const handleAutoRefresh = useCallback(async () => {
    if (!isAuthenticated || !session || !autoRefresh) {
      return;
    }

    try {
      // 检查是否需要刷新
      if (shouldRefreshSession(session)) {
        if (debug) {
          console.log('[AuthProvider] Auto-refreshing session');
        }
        
        await refreshSession();
        
        if (debug) {
          console.log('[AuthProvider] Session refreshed successfully');
        }
      }
      // 验证会话有效性
      else {
        const isValid = await validateSession(session);
        
        if (!isValid) {
          if (debug) {
            console.log('[AuthProvider] Session invalid, logging out');
          }
          
          await logout();
        }
      }
    } catch (error) {
      console.error('[AuthProvider] Auto-refresh error:', error);
      
      // 刷新失败时自动登出
      try {
        await logout();
      } catch (logoutError) {
        console.error('[AuthProvider] Logout after refresh failure error:', logoutError);
      }
    }
  }, [isAuthenticated, session, autoRefresh, shouldRefreshSession, validateSession, refreshSession, logout, debug]);

  // ========================================================================
  // Supabase Auth Event Listeners
  // ========================================================================

  /**
   * 监听Supabase认证事件
   * 
   * 处理来自Supabase的认证状态变化事件，如登录、登出、令牌刷新等。
   * 确保Context状态与Supabase认证状态同步。
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // 仅在客户端运行
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      if (debug) {
        console.log('[AuthProvider] Supabase auth event:', event, supabaseSession);
      }

      switch (event) {
        case 'SIGNED_IN':
          // Supabase登录事件 - 同步到Context
          if (supabaseSession) {
            if (debug) {
              console.log('[AuthProvider] Syncing SIGNED_IN event');
            }
            // 注意：实际实现中需要将Supabase session转换为内部格式
            // 这里简化处理，实际应该调用相应的store action
          }
          break;

        case 'SIGNED_OUT':
          // Supabase登出事件 - 清理Context状态
          if (debug) {
            console.log('[AuthProvider] Syncing SIGNED_OUT event');
          }
          if (isAuthenticated) {
            await logout();
          }
          break;

        case 'TOKEN_REFRESHED':
          // 令牌刷新事件 - 更新Context会话
          if (supabaseSession && debug) {
            console.log('[AuthProvider] Token refreshed by Supabase');
          }
          break;

        case 'USER_UPDATED':
          // 用户更新事件 - 同步用户信息
          if (debug) {
            console.log('[AuthProvider] User updated by Supabase');
          }
          break;

        default:
          if (debug) {
            console.log(`[AuthProvider] Unhandled auth event: ${event}`);
          }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated, logout, debug]);

  // ========================================================================
  // Auto-refresh Timer
  // ========================================================================

  /**
   * 设置会话检查定时器
   * 
   * 定期执行会话验证和自动刷新逻辑。
   * Requirements: 5.1 (自动刷新)
   */
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) {
      return;
    }

    const interval = setInterval(() => {
      handleAutoRefresh();
    }, sessionCheckInterval);

    // 立即执行一次检查
    handleAutoRefresh();

    return () => {
      clearInterval(interval);
    };
  }, [autoRefresh, isAuthenticated, sessionCheckInterval, handleAutoRefresh]);

  // ========================================================================
  // Auto-initialization
  // ========================================================================

  /**
   * 自动初始化认证状态
   * 
   * 在Provider挂载时自动检查和恢复认证状态。
   */
  useEffect(() => {
    if (autoInitialize && !isInitialized && !isLoading) {
      if (debug) {
        console.log('[AuthProvider] Auto-initializing authentication');
      }
      
      initialize().catch((error: any) => {
        console.error('[AuthProvider] Auto-initialization failed:', error);
      });
    }
  }, [autoInitialize, isInitialized, isLoading, initialize, debug]);

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