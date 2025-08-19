/**
 * Authentication State Management Store (Admin-Only System)
 * 
 * 基于Zustand创建认证状态管理，专为管理员身份验证设计的封闭式系统。
 * 
 * 核心特性：
 * - 🔒 Admin-Only访问：仅允许管理员角色用户登录系统
 * - 🚫 禁用用户注册：移除所有用户自主注册功能和入口
 * - ⏰ 会话管理：支持30天持久化会话和15分钟锁定机制
 * - 🛡️ 安全存储：敏感信息不存储在localStorage，确保数据安全
 * - 🎯 权限验证：提供细粒度的admin权限检查和验证方法
 * 
 * Admin-Only安全策略：
 * - 严格的角色验证：每次登录都验证用户必须具有admin角色
 * - 拒绝非admin访问：非管理员用户无法通过任何方式访问系统
 * - 社交登录限制：当前仅支持邮箱密码登录，确保管理员身份可控
 * - 注册功能禁用：register方法始终抛出错误，拒绝用户注册请求
 * 
 * Requirements:
 * - 4.5: 禁用用户注册功能 - 系统运行时不存在任何用户自主注册入口
 * - 5.1: 会话管理 - 30天持久化会话，15分钟锁定机制
 * - Admin-Only: 仅允许预定义管理员账户访问系统
 * 
 * @version 1.2.0
 * @created 2025-08-17
 * @updated 2025-08-18 (Admin-only authentication with enhanced role validation)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  AuthUser, 
  AuthSession, 
  AuthError, 
  AuthState, 
  AuthActions,
  DEFAULT_SESSION_CONFIG 
} from '../types';

// ============================================================================
// Auth Store State Interface
// ============================================================================

/**
 * 完整的认证Store状态接口
 * 结合AuthState和AuthActions，提供统一的状态管理结构
 */
export interface AuthStoreState extends AuthState {
  /** 操作方法集合 */
  actions: AuthActions;
}

// ============================================================================
// Auth Store 实现
// ============================================================================

/**
 * 创建认证状态管理Store
 * 
 * 使用Zustand中间件配置:
 * - devtools: 开发工具支持
 * - persist: 持久化存储 (仅非敏感数据)
 * 
 * 安全策略:
 * - 敏感数据(tokens)不存储在localStorage
 * - 仅持久化用户基本信息和偏好设置
 * - Session数据仅在内存中维护
 */
export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // ====================================================================
        // 基础认证状态初始化
        // ====================================================================
        
        /** 当前认证状态 */
        isAuthenticated: false,
        
        /** 认证加载状态 */
        isLoading: false,
        
        /** 当前认证用户 */
        user: null,
        
        /** 当前会话信息 (不持久化) */
        session: null,
        
        /** 当前认证错误 */
        error: null,
        
        /** 登录尝试计数 */
        loginAttempts: 0,
        
        /** 账户锁定状态 */
        isLocked: false,
        
        /** 锁定过期时间 */
        lockoutExpiresAt: null,
        
        /** 会话初始化状态 */
        isInitialized: false,
        
        // ====================================================================
        // 操作方法实现
        // ====================================================================
        
        actions: {
          /**
           * 初始化认证状态
           * 检查现有会话和用户状态，恢复认证信息
           */
          initialize: async () => {
            const state = get();
            
            // 防止重复初始化
            if (state.isInitialized || state.isLoading) {
              return;
            }
            
            set(
              (current) => ({
                isLoading: true,
                error: null,
              }),
              false,
              'auth:initialize:start'
            );
            
            try {
              // TODO: 实际实现中会调用AuthService检查现有会话
              // const authService = getAuthService();
              // const session = await authService.getSession();
              
              // 模拟初始化延迟
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // 检查锁定状态是否过期
              if (state.lockoutExpiresAt && new Date() > new Date(state.lockoutExpiresAt)) {
                set(
                  {
                    isLocked: false,
                    lockoutExpiresAt: null,
                    loginAttempts: 0,
                  },
                  false,
                  'auth:lockout:expired'
                );
              }
              
              set(
                {
                  isLoading: false,
                  isInitialized: true,
                },
                false,
                'auth:initialize:success'
              );
              
            } catch (error) {
              console.error('Failed to initialize auth:', error);
              
              set(
                {
                  isLoading: false,
                  isInitialized: true,
                  error: {
                    code: 'UNKNOWN_ERROR',
                    message: '认证系统初始化失败',
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:initialize:error'
              );
            }
          },
          
          /**
           * 邮箱密码登录
           * 
           * @param email - 用户邮箱
           * @param password - 用户密码
           * @param rememberMe - 是否记住登录状态
           */
          login: async (email: string, password: string, rememberMe?: boolean) => {
            const state = get();
            
            // 检查账户锁定状态
            if (state.isLocked && state.lockoutExpiresAt) {
              const lockoutExpiry = new Date(state.lockoutExpiresAt);
              if (new Date() < lockoutExpiry) {
                const remainingMinutes = Math.ceil((lockoutExpiry.getTime() - Date.now()) / 60000);
                throw new Error(`账户已锁定，请在 ${remainingMinutes} 分钟后重试`);
              } else {
                // 锁定已过期，清除锁定状态
                set(
                  {
                    isLocked: false,
                    lockoutExpiresAt: null,
                    loginAttempts: 0,
                  },
                  false,
                  'auth:lockout:expired'
                );
              }
            }
            
            set(
              {
                isLoading: true,
                error: null,
              },
              false,
              'auth:login:start'
            );
            
            try {
              // TODO: 实际实现中调用AuthService
              // const authService = getAuthService();
              // const session = await authService.signIn({ email, password, rememberMe });
              
              // 模拟登录延迟
              await new Promise(resolve => setTimeout(resolve, 800));
              
              // TODO: 实际实现中会调用AuthService验证管理员身份
              // const authService = getAuthService();
              // const authResult = await authService.signIn({ email, password, rememberMe });
              // 
              // 严格的admin角色验证 - 系统核心安全要求
              // if (!authResult.user || authResult.user.role !== 'admin') {
              //   // 记录非admin用户的登录尝试
              //   await authService.recordFailedAttempt(email);
              //   throw new Error('访问被拒绝：此系统仅允许管理员用户登录');
              // }
              
              // 模拟管理员身份验证 (实际环境中移除)
              // Admin-Only系统：只允许预定义的管理员账户登录
              const isValidAdminCredentials = email === 'admin@webvault.com' && password === 'password123';
              
              if (!isValidAdminCredentials) {
                // 记录失败尝试
                const currentState = get();
                const newAttemptCount = currentState.loginAttempts + 1;
                
                // 检查是否达到最大尝试次数
                if (newAttemptCount >= DEFAULT_SESSION_CONFIG.maxLoginAttempts) {
                  const lockoutExpiry = new Date(Date.now() + DEFAULT_SESSION_CONFIG.lockoutDuration);
                  
                  set(
                    {
                      loginAttempts: newAttemptCount,
                      isLocked: true,
                      lockoutExpiresAt: lockoutExpiry.toISOString(),
                    },
                    false,
                    'auth:account-locked'
                  );
                } else {
                  set(
                    {
                      loginAttempts: newAttemptCount,
                    },
                    false,
                    'auth:failed-attempt'
                  );
                }
                
                throw new Error('访问被拒绝：无效的管理员凭据');
              }
              
              // 模拟成功登录的用户和会话数据
              const mockUser: AuthUser = {
                id: 'user-1',
                email,
                emailVerified: true,
                name: 'Admin User',
                avatar: '/assets/images/avatar-1.jpg',
                provider: 'email',
                role: 'admin',
                metadata: {
                  language: 'zh-CN',
                  theme: 'system',
                  lastLogin: new Date().toISOString(),
                  loginCount: (state.user?.metadata.loginCount || 0) + 1,
                },
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: new Date().toISOString(),
              };
              
              const mockSession: AuthSession = {
                accessToken: 'mock-jwt-token',
                refreshToken: 'mock-refresh-token',
                expiresAt: new Date(Date.now() + (rememberMe ? DEFAULT_SESSION_CONFIG.sessionDuration : 24 * 60 * 60 * 1000)).toISOString(),
                refreshExpiresAt: new Date(Date.now() + DEFAULT_SESSION_CONFIG.sessionDuration).toISOString(),
                user: mockUser,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                persistent: rememberMe || false,
              };
              
              set(
                {
                  isAuthenticated: true,
                  isLoading: false,
                  user: mockUser,
                  session: mockSession,
                  error: null,
                  loginAttempts: 0,
                  isLocked: false,
                  lockoutExpiresAt: null,
                },
                false,
                'auth:login:success'
              );
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : '登录失败，请稍后重试';
              
              set(
                {
                  isLoading: false,
                  error: {
                    code: 'INVALID_CREDENTIALS',
                    message: errorMessage,
                    field: 'general',
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:login:error'
              );
              
              // 重新抛出错误供UI处理
              throw error;
            }
          },
          
          /**
           * 社交提供商登录 (Admin-Only)
           * 
           * @param provider - 社交提供商 (google | github)
           */
          loginWithProvider: async (provider) => {
            set(
              {
                isLoading: true,
                error: null,
              },
              false,
              'auth:social-login:start'
            );
            
            try {
              // TODO: 实际实现中调用AuthService
              // const authService = getAuthService();
              // const session = await authService.signInWithProvider(provider);
              // 
              // 严格的admin角色验证 - 社交登录也必须验证admin权限
              // if (!session.user || session.user.role !== 'admin') {
              //   // 立即注销非admin用户的社交登录会话
              //   await authService.signOut();
              //   throw new Error('访问被拒绝：此系统仅允许管理员用户通过社交账户登录');
              // }
              
              // 模拟社交登录流程
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              throw new Error(`访问被拒绝：Admin-Only系统当前仅支持邮箱密码登录`);
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : '社交登录失败';
              
              set(
                {
                  isLoading: false,
                  error: {
                    code: 'OAUTH_ERROR',
                    message: errorMessage,
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:social-login:error'
              );
              
              throw error;
            }
          },
          
          // ====================================================================
          // 注册功能已移除 (Admin-Only 系统)
          // 根据需求4.5: 系统运行时不存在任何用户自主注册入口
          // ====================================================================
          
          /**
           * 用户注册 - 已禁用
           * 
           * Admin-Only系统不允许用户自主注册
           * @throws {Error} 始终抛出错误，拒绝注册请求
           */
          register: async () => {
            throw new Error('系统不支持用户注册，请联系管理员获取访问权限');
          },
          
          /**
           * 用户登出
           * 清除所有认证状态和会话数据
           */
          logout: async () => {
            set(
              {
                isLoading: true,
              },
              false,
              'auth:logout:start'
            );
            
            try {
              // TODO: 实际实现中调用AuthService
              // const authService = getAuthService();
              // await authService.signOut();
              
              await new Promise(resolve => setTimeout(resolve, 200));
              
              set(
                {
                  isAuthenticated: false,
                  isLoading: false,
                  user: null,
                  session: null,
                  error: null,
                  // 保留安全相关状态
                  loginAttempts: get().loginAttempts,
                  isLocked: get().isLocked,
                  lockoutExpiresAt: get().lockoutExpiresAt,
                },
                false,
                'auth:logout:success'
              );
              
            } catch (error) {
              console.error('Logout error:', error);
              
              // 即使登出失败也清除本地状态
              set(
                {
                  isAuthenticated: false,
                  isLoading: false,
                  user: null,
                  session: null,
                  error: {
                    code: 'UNKNOWN_ERROR',
                    message: '登出过程中发生错误',
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:logout:error'
              );
            }
          },
          
          /**
           * 刷新会话
           * 使用refresh token延长会话有效期
           */
          refreshSession: async () => {
            const state = get();
            
            if (!state.session || !state.isAuthenticated) {
              throw new Error('无效的会话状态');
            }
            
            set(
              {
                isLoading: true,
              },
              false,
              'auth:refresh:start'
            );
            
            try {
              // TODO: 实际实现中调用AuthService
              // const authService = getAuthService();
              // const newSession = await authService.refreshSession();
              
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const updatedSession: AuthSession = {
                ...state.session,
                expiresAt: new Date(Date.now() + (state.session.persistent ? DEFAULT_SESSION_CONFIG.sessionDuration : 24 * 60 * 60 * 1000)).toISOString(),
                lastActivity: new Date().toISOString(),
              };
              
              set(
                {
                  isLoading: false,
                  session: updatedSession,
                  error: null,
                },
                false,
                'auth:refresh:success'
              );
              
            } catch (error) {
              console.error('Session refresh error:', error);
              
              set(
                {
                  isLoading: false,
                  error: {
                    code: 'SESSION_EXPIRED',
                    message: '会话已过期，请重新登录',
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:refresh:error'
              );
              
              // 会话刷新失败时自动登出
              setTimeout(() => get().actions.logout(), 100);
              
              throw error;
            }
          },
          
          /**
           * 重置密码
           * 发送密码重置邮件
           * 
           * @param email - 用户邮箱
           */
          resetPassword: async (email) => {
            set(
              {
                isLoading: true,
                error: null,
              },
              false,
              'auth:reset-password:start'
            );
            
            try {
              // TODO: 实际实现中调用AuthService
              // const authService = getAuthService();
              // await authService.resetPassword(email);
              
              // 模拟密码重置延迟
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              set(
                {
                  isLoading: false,
                },
                false,
                'auth:reset-password:success'
              );
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : '密码重置失败';
              
              set(
                {
                  isLoading: false,
                  error: {
                    code: 'UNKNOWN_ERROR',
                    message: errorMessage,
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:reset-password:error'
              );
              
              throw error;
            }
          },
          
          /**
           * 确认密码重置
           * 使用重置令牌设置新密码
           * 
           * @param token - 密码重置令牌
           * @param newPassword - 新密码
           */
          confirmPasswordReset: async (token, newPassword) => {
            set(
              {
                isLoading: true,
                error: null,
              },
              false,
              'auth:confirm-password-reset:start'
            );
            
            try {
              // TODO: 实际实现中调用AuthService
              // const authService = getAuthService();
              // await authService.confirmPasswordReset(token, newPassword);
              
              // 模拟密码重置确认延迟
              await new Promise(resolve => setTimeout(resolve, 800));
              
              set(
                {
                  isLoading: false,
                },
                false,
                'auth:confirm-password-reset:success'
              );
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : '密码重置确认失败';
              
              set(
                {
                  isLoading: false,
                  error: {
                    code: 'UNKNOWN_ERROR',
                    message: errorMessage,
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:confirm-password-reset:error'
              );
              
              throw error;
            }
          },
          
          /**
           * 更新用户资料
           * 
           * @param updates - 要更新的用户数据
           */
          updateProfile: async (updates) => {
            const state = get();
            
            if (!state.user || !state.isAuthenticated) {
              throw new Error('用户未登录');
            }
            
            set(
              {
                isLoading: true,
                error: null,
              },
              false,
              'auth:update-profile:start'
            );
            
            try {
              // TODO: 实际实现中调用AuthService
              // const authService = getAuthService();
              // const updatedUser = await authService.updateUserProfile(updates);
              
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const updatedUser: AuthUser = {
                ...state.user,
                ...updates,
                updatedAt: new Date().toISOString(),
              };
              
              set(
                {
                  isLoading: false,
                  user: updatedUser,
                  session: state.session ? {
                    ...state.session,
                    user: updatedUser,
                  } : null,
                },
                false,
                'auth:update-profile:success'
              );
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : '更新资料失败';
              
              set(
                {
                  isLoading: false,
                  error: {
                    code: 'UNKNOWN_ERROR',
                    message: errorMessage,
                    timestamp: new Date().toISOString(),
                  },
                },
                false,
                'auth:update-profile:error'
              );
              
              throw error;
            }
          },
          
          /**
           * 清除认证错误
           */
          clearError: () => {
            set(
              {
                error: null,
              },
              false,
              'auth:clear-error'
            );
          },
          
          /**
           * 重置登录尝试计数
           */
          resetLoginAttempts: () => {
            set(
              {
                loginAttempts: 0,
                isLocked: false,
                lockoutExpiresAt: null,
              },
              false,
              'auth:reset-attempts'
            );
          },
          
          /**
           * 验证当前用户是否为管理员
           * Admin-Only系统的核心权限检查
           * 
           * @returns 是否为管理员用户
           */
          isAdmin: () => {
            const state = get();
            return state.isAuthenticated && state.user?.role === 'admin';
          },
          
          /**
           * 验证用户访问权限
           * 确保只有管理员能够执行管理操作
           * 
           * @throws Error 如果用户未认证或非管理员
           */
          requireAdmin: () => {
            const state = get();
            
            if (!state.isAuthenticated) {
              throw new Error('用户未认证，请先登录');
            }
            
            if (state.user?.role !== 'admin') {
              throw new Error('权限不足，此操作仅限管理员');
            }
          },
          
          /**
           * 检查用户会话有效性并验证管理员权限
           * 
           * @returns 是否为有效的管理员会话
           */
          hasValidAdminSession: () => {
            const state = get();
            
            // 基础认证检查
            if (!state.isAuthenticated || !state.user || !state.session) {
              return false;
            }
            
            // 管理员角色检查
            if (state.user.role !== 'admin') {
              return false;
            }
            
            // 会话过期检查
            if (state.session.expiresAt && new Date() >= new Date(state.session.expiresAt)) {
              return false;
            }
            
            return true;
          },
          
        },
      }),
      {
        name: 'auth-store',
        storage: createJSONStorage(() => localStorage),
        /**
         * 持久化策略 - 安全存储要求
         * 
         * 仅持久化非敏感数据:
         * - 用户基本信息 (不包含敏感字段)
         * - 安全状态 (登录尝试、锁定信息)
         * - UI偏好设置
         * 
         * 不持久化敏感数据:
         * - session (包含tokens)
         * - 密码或凭据
         * - 详细错误信息
         */
        partialize: (state) => ({
          // 用户基本信息 (移除敏感字段)
          user: state.user ? {
            id: state.user.id,
            email: state.user.email,
            emailVerified: state.user.emailVerified,
            name: state.user.name,
            avatar: state.user.avatar,
            provider: state.user.provider,
            role: state.user.role,
            metadata: {
              language: state.user.metadata.language,
              theme: state.user.metadata.theme,
              // 不存储lastLogin和loginCount等敏感信息
            },
            createdAt: state.user.createdAt,
            updatedAt: state.user.updatedAt,
          } : null,
          
          // 安全状态信息 (用于锁定机制)
          loginAttempts: state.loginAttempts,
          isLocked: state.isLocked,
          lockoutExpiresAt: state.lockoutExpiresAt,
          
          // UI状态
          isInitialized: state.isInitialized,
          
          // 不持久化的敏感数据:
          // - isAuthenticated (通过session检查)
          // - session (包含tokens)
          // - error (可能包含敏感信息)
          // - isLoading (UI临时状态)
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// ============================================================================
// 便捷Hooks导出
// ============================================================================

/**
 * 认证状态Store Hook (Direct Zustand Access)
 * 提供认证相关的状态和操作方法的直接Zustand访问
 * 注意：推荐使用hooks/useAuth.tsx中的Context版本
 */
export function useAuthStoreHook() {
  const {
    isAuthenticated,
    isLoading,
    user,
    session,
    error,
    isInitialized,
    actions
  } = useAuthStore();
  
  return {
    // 状态
    isAuthenticated,
    isLoading,
    user,
    session,
    error,
    isInitialized,
    
    // 基础操作方法
    login: actions.login,
    loginWithProvider: actions.loginWithProvider,
    logout: actions.logout,
    refreshSession: actions.refreshSession,
    resetPassword: actions.resetPassword,
    confirmPasswordReset: actions.confirmPasswordReset,
    updateProfile: actions.updateProfile,
    clearError: actions.clearError,
    initialize: actions.initialize,
    
    // Admin-Only 权限检查方法
    isAdmin: actions.isAdmin,
    requireAdmin: actions.requireAdmin,
    hasValidAdminSession: actions.hasValidAdminSession,
    
    // 注册功能已移除 (Admin-Only 系统不支持用户自主注册)
    register: actions.register, // 仅保留以抛出错误，确保调用时明确拒绝
    
    // 便捷计算属性 - 增强admin角色检查
    isAdminUser: user?.role === 'admin' && isAuthenticated,
    userName: user?.name || user?.email || 'Anonymous',
    userAvatar: user?.avatar,
    userRole: user?.role || null,
  };
}

/**
 * 账户安全状态Hook (Admin-Only系统)
 * 提供锁定和安全相关的状态信息，以及admin权限验证
 */
export function useAuthSecurity() {
  const {
    loginAttempts,
    isLocked,
    lockoutExpiresAt,
    user,
    isAuthenticated,
    actions
  } = useAuthStore();
  
  // 计算剩余锁定时间
  const remainingLockoutTime = lockoutExpiresAt 
    ? Math.max(0, new Date(lockoutExpiresAt).getTime() - Date.now())
    : 0;
  
  const remainingLockoutMinutes = Math.ceil(remainingLockoutTime / 60000);
  
  return {
    // 基础安全状态
    loginAttempts,
    isLocked,
    lockoutExpiresAt,
    remainingLockoutTime,
    remainingLockoutMinutes,
    
    // 计算属性
    maxAttempts: DEFAULT_SESSION_CONFIG.maxLoginAttempts,
    attemptsRemaining: Math.max(0, DEFAULT_SESSION_CONFIG.maxLoginAttempts - loginAttempts),
    isNearLockout: loginAttempts >= DEFAULT_SESSION_CONFIG.maxLoginAttempts - 1,
    
    // Admin-Only 权限状态
    isAdminUser: user?.role === 'admin' && isAuthenticated,
    hasValidAdminSession: actions.hasValidAdminSession(),
    canAccessSystem: actions.isAdmin(),
    
    // 操作方法
    resetLoginAttempts: actions.resetLoginAttempts,
    requireAdmin: actions.requireAdmin,
  };
}

// 默认导出
export default useAuthStore;