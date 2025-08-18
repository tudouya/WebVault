'use client';

/**
 * AuthGuard Component
 * 
 * 路由级别的认证保护组件，提供完整的认证检查、重定向逻辑和用户体验优化。
 * 支持条件渲染、嵌套保护、权限检查和会话管理。
 * 
 * Requirements:
 * - 5.1: 会话管理和路由保护
 * - 认证状态检查和验证
 * - 会话有效性和令牌刷新
 * - 未认证用户的重定向逻辑
 * - 原始URL保存和恢复
 * 
 * Features:
 * - 完整的认证状态检查
 * - 会话有效性验证
 * - 自动重定向到登录页
 * - 原始URL保存和登录后恢复
 * - 权限级别检查（可选）
 * - 加载状态和过渡动画
 * - 错误处理和回退UI
 * - 与AuthErrorBoundary集成
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import React, { useEffect, useMemo, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Loader2, Shield, Lock, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth, useAuthSession } from '../hooks/useAuth';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { AuthUser } from '../types';

// ============================================================================
// AuthGuard Types & Interfaces
// ============================================================================

/**
 * AuthGuard 组件属性接口
 */
export interface AuthGuardProps {
  /** 子组件内容 */
  children: ReactNode;
  
  /** 是否需要认证（默认: true） */
  requireAuth?: boolean;
  
  /** 需要的用户角色 */
  requiredRole?: AuthUser['role'];
  
  /** 认证失败时的回退组件 */
  fallback?: ReactNode;
  
  /** 加载状态时的回退组件 */
  loadingFallback?: ReactNode;
  
  /** 权限不足时的回退组件 */
  permissionDeniedFallback?: ReactNode;
  
  /** 自定义重定向URL */
  redirectTo?: string;
  
  /** 是否保存当前路径用于登录后重定向 */
  saveReturnUrl?: boolean;
  
  /** 保护级别 */
  level?: 'page' | 'section' | 'component';
  
  /** 是否显示加载动画 */
  showLoading?: boolean;
  
  /** 会话验证模式 */
  sessionMode?: 'strict' | 'lenient';
  
  /** 调试模式 */
  debug?: boolean;
}

/**
 * useAuthGuard Hook 属性接口
 */
export interface UseAuthGuardOptions {
  /** 是否需要认证 */
  requireAuth?: boolean;
  
  /** 需要的用户角色 */
  requiredRole?: AuthUser['role'];
  
  /** 会话验证模式 */
  sessionMode?: 'strict' | 'lenient';
  
  /** 自定义重定向路径 */
  redirectTo?: string;
  
  /** 是否保存返回URL */
  saveReturnUrl?: boolean;
  
  /** 调试模式 */
  debug?: boolean;
}

/**
 * useAuthGuard Hook 返回值接口
 */
export interface UseAuthGuardResult {
  /** 是否已授权访问 */
  isAuthorized: boolean;
  
  /** 是否正在加载 */
  isLoading: boolean;
  
  /** 认证状态 */
  isAuthenticated: boolean;
  
  /** 权限检查结果 */
  hasPermission: boolean;
  
  /** 会话是否有效 */
  isSessionValid: boolean;
  
  /** 当前用户 */
  user: AuthUser | null;
  
  /** 手动重定向到登录页 */
  redirectToLogin: () => void;
  
  /** 刷新认证状态 */
  refreshAuth: () => Promise<void>;
  
  /** 授权失败原因 */
  authFailureReason?: 'unauthenticated' | 'insufficient_permissions' | 'session_expired' | 'session_invalid';
}

// ============================================================================
// AuthGuard Hook Implementation
// ============================================================================

/**
 * useAuthGuard Hook
 * 
 * 提供组件级别的认证状态检查和权限控制逻辑。
 * 处理认证验证、权限检查、会话管理和重定向逻辑。
 * 
 * Requirements: 5.1 (会话管理和路由保护)
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardResult {
  const {
    requireAuth = true,
    requiredRole,
    sessionMode = 'lenient',
    redirectTo = '/login',
    saveReturnUrl = true,
    debug = false,
  } = options;

  // ========================================================================
  // 核心 Hooks
  // ========================================================================
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    refreshSession,
    isInitialized,
  } = useAuth();
  
  const {
    session,
    isSessionValid,
    shouldRefreshSoon,
    refreshSession: refreshSessionFromHook,
  } = useAuthSession();

  // ========================================================================
  // 状态计算和权限检查
  // ========================================================================

  /**
   * 权限检查逻辑
   * 检查用户是否具有所需的角色权限
   */
  const hasPermission = useMemo(() => {
    if (!requireAuth || !requiredRole || !user) {
      return true;
    }
    
    // Admin 用户拥有所有权限
    if (user.role === 'admin') {
      return true;
    }
    
    // 检查用户角色是否匹配
    return user.role === requiredRole;
  }, [requireAuth, requiredRole, user]);

  /**
   * 会话有效性检查
   * 根据sessionMode进行严格或宽松的会话验证
   */
  const sessionValidation = useMemo(() => {
    if (!requireAuth || !isAuthenticated) {
      return { isValid: true, needsRefresh: false };
    }

    if (sessionMode === 'strict') {
      // 严格模式：必须有有效会话且未过期
      const isValid = isSessionValid && session != null;
      const needsRefresh = shouldRefreshSoon;
      
      if (debug) {
        console.log('[AuthGuard] Strict session validation:', {
          isValid,
          needsRefresh,
          session: !!session,
          isSessionValid,
        });
      }
      
      return { isValid, needsRefresh };
    } else {
      // 宽松模式：认证状态为真即可
      return { isValid: true, needsRefresh: shouldRefreshSoon };
    }
  }, [
    requireAuth,
    isAuthenticated,
    sessionMode,
    isSessionValid,
    session,
    shouldRefreshSoon,
    debug,
  ]);

  /**
   * 授权状态计算
   * 综合认证状态、权限检查和会话验证的结果
   */
  const authorizationResult = useMemo(() => {
    if (!requireAuth) {
      return {
        isAuthorized: true,
        isLoading: false,
        authFailureReason: undefined,
      };
    }

    // 如果认证系统还在初始化中
    if (!isInitialized || authLoading) {
      return {
        isAuthorized: false,
        isLoading: true,
        authFailureReason: undefined,
      };
    }

    // 检查认证状态
    if (!isAuthenticated) {
      return {
        isAuthorized: false,
        isLoading: false,
        authFailureReason: 'unauthenticated' as const,
      };
    }

    // 检查会话有效性
    if (!sessionValidation.isValid) {
      return {
        isAuthorized: false,
        isLoading: false,
        authFailureReason: 'session_invalid' as const,
      };
    }

    // 检查权限
    if (!hasPermission) {
      return {
        isAuthorized: false,
        isLoading: false,
        authFailureReason: 'insufficient_permissions' as const,
      };
    }

    return {
      isAuthorized: true,
      isLoading: false,
      authFailureReason: undefined,
    };
  }, [
    requireAuth,
    isInitialized,
    authLoading,
    isAuthenticated,
    sessionValidation.isValid,
    hasPermission,
  ]);

  // ========================================================================
  // 重定向和会话管理
  // ========================================================================

  /**
   * 重定向到登录页面
   * 保存当前路径用于登录后返回
   */
  const redirectToLogin = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    let loginUrl = redirectTo;

    // 保存返回URL
    if (saveReturnUrl && pathname !== '/login') {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const returnUrl = encodeURIComponent(currentUrl);
      loginUrl = `${redirectTo}?returnUrl=${returnUrl}`;
    }

    if (debug) {
      console.log('[AuthGuard] Redirecting to login:', {
        from: pathname,
        to: loginUrl,
        reason: authorizationResult.authFailureReason,
      });
    }

    router.push(loginUrl);
  }, [
    redirectTo,
    saveReturnUrl,
    pathname,
    searchParams,
    router,
    debug,
    authorizationResult.authFailureReason,
  ]);

  /**
   * 刷新认证状态
   * 尝试刷新会话或重新初始化认证
   */
  const refreshAuth = React.useCallback(async () => {
    try {
      if (sessionValidation.needsRefresh) {
        if (debug) {
          console.log('[AuthGuard] Refreshing session');
        }
        await refreshSessionFromHook();
      } else {
        if (debug) {
          console.log('[AuthGuard] Refreshing auth session');
        }
        await refreshSession();
      }
    } catch (error) {
      console.error('[AuthGuard] Failed to refresh auth:', error);
      
      // 刷新失败，重定向到登录页
      if (requireAuth) {
        redirectToLogin();
      }
    }
  }, [
    sessionValidation.needsRefresh,
    refreshSessionFromHook,
    refreshSession,
    requireAuth,
    redirectToLogin,
    debug,
  ]);

  // ========================================================================
  // 自动重定向效果
  // ========================================================================

  /**
   * 自动重定向处理
   * 当授权失败时自动重定向到登录页
   */
  useEffect(() => {
    if (
      requireAuth &&
      !authorizationResult.isLoading &&
      !authorizationResult.isAuthorized &&
      authorizationResult.authFailureReason === 'unauthenticated'
    ) {
      if (debug) {
        console.log('[AuthGuard] Auto-redirecting due to unauthenticated state');
      }
      redirectToLogin();
    }
  }, [
    requireAuth,
    authorizationResult.isLoading,
    authorizationResult.isAuthorized,
    authorizationResult.authFailureReason,
    redirectToLogin,
    debug,
  ]);

  /**
   * 会话自动刷新
   * 当会话即将过期时自动刷新
   */
  useEffect(() => {
    if (
      requireAuth &&
      isAuthenticated &&
      sessionValidation.needsRefresh &&
      sessionValidation.isValid
    ) {
      if (debug) {
        console.log('[AuthGuard] Auto-refreshing session due to upcoming expiry');
      }
      refreshAuth();
    }
  }, [
    requireAuth,
    isAuthenticated,
    sessionValidation.needsRefresh,
    sessionValidation.isValid,
    refreshAuth,
    debug,
  ]);

  // ========================================================================
  // 返回结果
  // ========================================================================

  return {
    isAuthorized: authorizationResult.isAuthorized,
    isLoading: authorizationResult.isLoading,
    isAuthenticated,
    hasPermission,
    isSessionValid: sessionValidation.isValid,
    user,
    redirectToLogin,
    refreshAuth,
    authFailureReason: authorizationResult.authFailureReason,
  };
}

// ============================================================================
// Loading Components
// ============================================================================

/**
 * 默认加载状态组件
 */
function DefaultLoadingFallback({ level = 'component' }: { level?: 'page' | 'section' | 'component' }) {
  if (level === 'page') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">验证身份中</h3>
            <p className="text-sm text-muted-foreground">正在检查您的登录状态...</p>
          </div>
        </div>
      </div>
    );
  }

  if (level === 'section') {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">加载中</h4>
              <p className="text-sm text-muted-foreground">验证访问权限...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>验证中...</span>
      </div>
    </div>
  );
}

/**
 * 权限不足回退组件
 */
function DefaultPermissionDeniedFallback({ 
  level = 'component',
  requiredRole,
  user,
  onBackToHome,
}: { 
  level?: 'page' | 'section' | 'component';
  requiredRole?: AuthUser['role'];
  user?: AuthUser | null;
  onBackToHome?: () => void;
}) {
  const router = useRouter();

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      router.push('/');
    }
  };

  if (level === 'page') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <CardTitle className="text-xl text-foreground">
              访问受限
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {requiredRole === 'admin' 
                ? '此页面仅限管理员访问' 
                : '您没有足够的权限访问此页面'
              }
            </p>
            
            {user && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                当前角色: {user.role === 'admin' ? '管理员' : '普通用户'}
                {requiredRole && (
                  <div>需要角色: {requiredRole === 'admin' ? '管理员' : '普通用户'}</div>
                )}
              </div>
            )}

            <Button 
              variant="default"
              onClick={handleBackToHome}
              className="w-full"
            >
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (level === 'section') {
    return (
      <Card className="w-full border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">访问受限</h3>
              <p className="text-sm text-muted-foreground">
                权限不足，无法访问此内容
              </p>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleBackToHome}
            >
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        <Lock className="w-4 h-4 text-amber-500" />
        权限不足
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleBackToHome}
        className="text-xs"
      >
        返回
      </Button>
    </div>
  );
}

/**
 * 未认证回退组件
 */
function DefaultAuthRequiredFallback({ 
  level = 'component',
  onLogin,
}: { 
  level?: 'page' | 'section' | 'component';
  onLogin?: () => void;
}) {
  const router = useRouter();

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      router.push('/login');
    }
  };

  if (level === 'page') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl text-foreground">
              需要登录
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              请登录以继续访问此页面
            </p>
            <Button 
              variant="default"
              onClick={handleLogin}
              className="w-full"
            >
              立即登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (level === 'section') {
    return (
      <Card className="w-full border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">需要登录</h3>
              <p className="text-sm text-muted-foreground">
                请先登录以查看此内容
              </p>
            </div>
            <Button 
              variant="default"
              size="sm"
              onClick={handleLogin}
            >
              立即登录
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        <Shield className="w-4 h-4 text-primary" />
        需要登录
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogin}
        className="text-xs"
      >
        登录
      </Button>
    </div>
  );
}

// ============================================================================
// AuthGuard Component Implementation
// ============================================================================

/**
 * AuthGuard Component
 * 
 * 路由级别的认证保护组件，提供完整的认证检查、重定向逻辑和用户体验优化。
 * 
 * 核心功能：
 * - 认证状态检查和验证
 * - 会话有效性和令牌刷新
 * - 未认证用户的重定向逻辑
 * - 原始URL保存和恢复
 * - 权限级别检查（可选）
 * - 加载状态和过渡动画
 * - 错误处理和回退UI
 * 
 * Requirements: 5.1 (会话管理和路由保护)
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requiredRole,
  fallback,
  loadingFallback,
  permissionDeniedFallback,
  redirectTo = '/login',
  saveReturnUrl = true,
  level = 'component',
  showLoading = true,
  sessionMode = 'lenient',
  debug = false,
}: AuthGuardProps) {
  // ========================================================================
  // 核心认证逻辑
  // ========================================================================
  
  const {
    isAuthorized,
    isLoading,
    isAuthenticated,
    hasPermission,
    user,
    redirectToLogin,
    authFailureReason,
  } = useAuthGuard({
    requireAuth,
    requiredRole,
    sessionMode,
    redirectTo,
    saveReturnUrl,
    debug,
  });

  // ========================================================================
  // 条件渲染逻辑
  // ========================================================================

  // 如果不需要认证，直接渲染子组件
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 显示加载状态
  if (isLoading) {
    if (!showLoading) {
      return null;
    }
    
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    
    return <DefaultLoadingFallback level={level} />;
  }

  // 已授权，渲染子组件
  if (isAuthorized) {
    return <>{children}</>;
  }

  // 处理不同的授权失败情况
  switch (authFailureReason) {
    case 'unauthenticated':
    case 'session_expired':
    case 'session_invalid':
      // 未认证或会话问题 - 显示登录提示或自定义回退
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return (
        <DefaultAuthRequiredFallback 
          level={level}
          onLogin={redirectToLogin}
        />
      );

    case 'insufficient_permissions':
      // 权限不足 - 显示权限拒绝提示
      if (permissionDeniedFallback) {
        return <>{permissionDeniedFallback}</>;
      }
      
      return (
        <DefaultPermissionDeniedFallback 
          level={level}
          requiredRole={requiredRole}
          user={user}
        />
      );

    default:
      // 未知错误 - 显示通用错误提示
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return (
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            访问验证失败
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={redirectToLogin}
            className="text-xs"
          >
            重新登录
          </Button>
        </div>
      );
  }
}

// ============================================================================
// Higher-Order Component
// ============================================================================

/**
 * withAuthGuard HOC
 * 
 * 为组件添加认证保护的高阶组件
 */
export function withAuthGuard<T extends object>(
  Component: React.ComponentType<T>,
  authGuardProps?: Omit<AuthGuardProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <AuthGuard {...authGuardProps}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// ============================================================================
// Specialized Components
// ============================================================================

/**
 * AdminOnly Component
 * 仅限管理员访问的专用组件
 */
export function AdminOnly({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard 
      {...props}
      requiredRole="admin"
      level={props.level || 'section'}
    >
      {children}
    </AuthGuard>
  );
}

/**
 * AuthRequired Component  
 * 需要认证的专用组件（任何角色）
 */
export function AuthRequired({ children, ...props }: AuthGuardProps) {
  return (
    <AuthGuard 
      {...props}
      requireAuth={true}
    >
      {children}
    </AuthGuard>
  );
}

/**
 * AuthOptional Component
 * 可选认证的专用组件
 */
export function AuthOptional({ children, ...props }: AuthGuardProps) {
  return (
    <AuthGuard 
      {...props}
      requireAuth={false}
    >
      {children}
    </AuthGuard>
  );
}

// ============================================================================
// AuthGuard with Error Boundary
// ============================================================================

/**
 * AuthGuardWithErrorBoundary Component
 * 
 * 集成错误边界的 AuthGuard 组件，提供完整的错误处理
 */
export function AuthGuardWithErrorBoundary(props: AuthGuardProps) {
  return (
    <AuthErrorBoundary 
      level={props.level || 'component'}
      clearSessionOnError={true}
      redirectOnError="/login"
    >
      <AuthGuard {...props} />
    </AuthErrorBoundary>
  );
}

// ============================================================================
// Default Exports
// ============================================================================

export default AuthGuard;
export {
  DefaultLoadingFallback,
  DefaultPermissionDeniedFallback,
  DefaultAuthRequiredFallback,
};