/**
 * Admin-Only 认证错误边界组件
 * 
 * 为WebVault管理员专用认证系统提供错误边界处理，包括：
 * - 🔒 权限不足专用UI和错误处理
 * - 📞 管理员联系指导和问题解决帮助  
 * - 🛡️ 管理员身份验证失败的专门处理
 * - ⚡ 集成auth-store的admin权限检查功能
 * - 🎯 针对Admin-Only系统优化的错误恢复机制
 * 
 * Admin-Only系统特性：
 * - 权限不足错误使用专用UI组件(InsufficientPrivilegesUI)
 * - 所有错误信息都针对管理员用户优化
 * - 提供明确的管理员联系和支持指导
 * - 集成auth-store的isAdmin()和requireAdmin()检查
 * - 移除注册相关的错误提示和建议
 * 
 * Requirements Support:
 * - 5.3: 认证UI界面清理 - 显示具体的管理员专用错误信息
 * - 5.4: 错误信息和用户体验 - 提供"联系管理员"的明确指导
 * 
 * @version 1.1.0 (Admin-Only Enhanced)
 * @created 2025-08-17
 * @updated 2025-08-18 (Task 17: Admin-Only error handling optimization)
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, LogIn, Wifi, Lock, User, Bug, ShieldX, Contact, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AuthError, 
  isAuthError
} from '../types';
import { useAuthStoreHook } from '../stores';

/**
 * 管理员认证错误类型枚举
 * 基于Admin-Only系统的错误场景和design.md要求
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  NETWORK_ERROR = 'network_error',
  ACCOUNT_LOCKED = 'account_locked',
  OAUTH_ERROR = 'oauth_error',
  SESSION_EXPIRED = 'session_expired',
  VALIDATION_ERROR = 'validation_error',
  AUTH_RENDER_ERROR = 'auth_render_error',
  UNKNOWN_AUTH_ERROR = 'unknown_auth_error',
  // === Admin-Only 专用错误类型 ===
  UNAUTHORIZED = 'unauthorized',
  INSUFFICIENT_PRIVILEGES = 'insufficient_privileges',
  ADMIN_ACCOUNT_NOT_FOUND = 'admin_account_not_found',
  ADMIN_SESSION_INVALID = 'admin_session_invalid',
  ACCESS_DENIED = 'access_denied'
}

/**
 * 认证错误信息接口
 */
export interface AuthErrorInfo {
  type: AuthErrorType;
  message: string;
  userFriendlyMessage: string;
  canRetry: boolean;
  requiresReauth: boolean;
  componentStack?: string;
  errorId?: string;
  timestamp: string;
}

/**
 * AuthErrorBoundary 组件属性
 */
export interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<AuthErrorFallbackProps>;
  onAuthError?: (error: AuthError) => void;
  clearSessionOnError?: boolean;
  redirectOnError?: string;
  level?: 'page' | 'section' | 'component';
  showRetryButton?: boolean;
}

/**
 * 认证错误回退组件属性
 */
export interface AuthErrorFallbackProps {
  error: Error;
  errorInfo: AuthErrorInfo;
  resetError: () => void;
  level: 'page' | 'section' | 'component';
  onRetry?: () => void;
  onBackToLogin?: () => void;
}

/**
 * AuthErrorBoundary 组件状态
 */
interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: AuthErrorInfo | null;
  retryCount: number;
  maxRetries: number;
}

/**
 * 管理员联系指导组件
 * 为管理员专用系统提供明确的联系和问题解决指导
 */
function AdminContactGuidance({ errorType, compact = false }: { 
  errorType?: AuthErrorType;
  compact?: boolean;
}) {
  const getContactMessage = () => {
    switch (errorType) {
      case AuthErrorType.INSUFFICIENT_PRIVILEGES:
        return "需要管理员权限升级";
      case AuthErrorType.ACCOUNT_LOCKED:
        return "需要账户解锁服务";
      case AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND:
        return "需要管理员账户验证";
      case AuthErrorType.ADMIN_SESSION_INVALID:
        return "需要会话权限重置";
      default:
        return "需要技术支持帮助";
    }
  };

  if (compact) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Contact className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="text-blue-700 dark:text-blue-300">
              <span className="font-medium">{getContactMessage()}</span>
              <br />
              请联系系统管理员获取帮助
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <Contact className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">需要管理员帮助？</h3>
      </div>
      <p className="text-blue-800 dark:text-blue-200 mb-3">
        {getContactMessage()}，请联系系统管理员：
      </p>
      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
        <li>• 账户权限问题咨询</li>
        <li>• 密码重置申请</li>
        <li>• 账户解锁请求</li>
        <li>• 系统访问技术支持</li>
      </ul>
      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
        <p className="text-xs text-blue-600 dark:text-blue-400">
          WebVault Admin-Only 系统 - 仅限授权管理员访问
        </p>
      </div>
    </div>
  );
}

/**
 * 权限不足专用UI组件
 * 为非管理员用户或权限不足场景设计专门的用户界面
 */
function InsufficientPrivilegesUI({ 
  error, 
  errorInfo, 
  onRetry, 
  onBackToLogin,
  onGoHome 
}: {
  error: Error;
  errorInfo: AuthErrorInfo;
  onRetry?: () => void;
  onBackToLogin?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <ShieldX className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl text-amber-900 dark:text-amber-100">
            访问权限不足
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              此功能仅限管理员访问
            </p>
            <p className="text-xs text-muted-foreground">
              WebVault 采用管理员专用系统，确保内容质量和系统安全
            </p>
          </div>

          <AdminContactGuidance errorType={errorInfo.type} compact />

          {/* 错误详情 - 仅开发环境显示 */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                技术详情 (开发环境)
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                <div><strong>错误类型:</strong> {errorInfo.type}</div>
                <div><strong>错误ID:</strong> {errorInfo.errorId}</div>
                <div><strong>时间:</strong> {errorInfo.timestamp}</div>
                <div><strong>消息:</strong> {error?.message}</div>
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {onRetry && errorInfo.canRetry && (
              <Button 
                onClick={onRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </Button>
            )}
            
            {onBackToLogin && (
              <Button 
                onClick={onBackToLogin}
                variant="default"
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                返回登录
              </Button>
            )}
            
            {onGoHome && (
              <Button 
                onClick={onGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                返回首页
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 默认认证错误回退组件
 * 根据design.md错误处理要求和Admin-Only系统提供管理员友好的错误界面
 */
function DefaultAuthErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  level,
  onRetry,
  onBackToLogin 
}: AuthErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';

  // 权限不足错误使用专用UI组件
  if (errorInfo.type === AuthErrorType.INSUFFICIENT_PRIVILEGES || 
      errorInfo.type === AuthErrorType.ACCESS_DENIED ||
      errorInfo.type === AuthErrorType.UNAUTHORIZED) {
    return (
      <InsufficientPrivilegesUI
        error={error}
        errorInfo={errorInfo}
        onRetry={onRetry}
        onBackToLogin={onBackToLogin}
        onGoHome={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }}
      />
    );
  }

  // 根据管理员认证错误类型提供不同的展示内容
  const getAuthErrorDisplay = (errorType: AuthErrorType) => {
    switch (errorType) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return {
          icon: User,
          title: '管理员凭据错误',
          description: '邮箱或密码错误。如需帮助，请联系系统管理员重置密码',
          actionText: '重新登录',
          variant: 'default' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      case AuthErrorType.NETWORK_ERROR:
        return {
          icon: Wifi,
          title: '网络连接失败',
          description: '无法连接到服务器，请检查网络后重试',
          actionText: '重试连接',
          variant: 'default' as const,
          showRetry: true,
          showBackToLogin: false,
        };
      
      case AuthErrorType.ACCOUNT_LOCKED:
        return {
          icon: Lock,
          title: '管理员账户已被锁定',
          description: '由于多次登录失败，管理员账户已被临时锁定。请联系系统管理员解锁账户',
          actionText: '返回登录',
          variant: 'outline' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      case AuthErrorType.OAUTH_ERROR:
        return {
          icon: Bug,
          title: '第三方登录失败',
          description: 'Admin-Only系统当前仅支持邮箱密码登录，请使用管理员邮箱登录',
          actionText: '返回登录',
          variant: 'default' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      case AuthErrorType.SESSION_EXPIRED:
        return {
          icon: AlertCircle,
          title: '管理员会话已过期',
          description: '您的管理员登录会话已过期，请重新登录以继续管理系统',
          actionText: '重新登录',
          variant: 'default' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      case AuthErrorType.VALIDATION_ERROR:
        return {
          icon: AlertCircle,
          title: '表单验证错误',
          description: '请检查输入信息格式是否正确',
          actionText: '重试',
          variant: 'default' as const,
          showRetry: true,
          showBackToLogin: false,
        };
      
      case AuthErrorType.AUTH_RENDER_ERROR:
        return {
          icon: Bug,
          title: '页面加载异常',
          description: '管理员认证页面遇到问题，请刷新页面重试',
          actionText: '刷新页面',
          variant: 'default' as const,
          showRetry: true,
          showBackToLogin: true,
        };
      
      // === Admin-Only 专用错误类型处理 ===
      
      case AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND:
        return {
          icon: ShieldX,
          title: '管理员账户不存在',
          description: '输入的邮箱不是有效的管理员账户。请联系系统管理员验证您的访问权限',
          actionText: '返回登录',
          variant: 'outline' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      case AuthErrorType.ADMIN_SESSION_INVALID:
        return {
          icon: AlertCircle,
          title: '管理员会话无效',
          description: '检测到无效的管理员会话。为了系统安全，请重新登录',
          actionText: '重新登录',
          variant: 'default' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      default:
        return {
          icon: AlertCircle,
          title: '认证系统异常',
          description: '管理员认证系统遇到问题，请联系系统管理员获取帮助',
          actionText: '重试',
          variant: 'default' as const,
          showRetry: true,
          showBackToLogin: true,
        };
    }
  };

  const errorDisplay = getAuthErrorDisplay(errorInfo.type);
  const IconComponent = errorDisplay.icon;

  if (isPageLevel) {
    // 页面级认证错误 - 全屏显示
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <IconComponent className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-foreground">
              {errorDisplay.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorInfo.userFriendlyMessage || errorDisplay.description}
            </p>

            {/* 管理员专用错误类型显示联系指导 */}
            {(errorInfo.type === AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND ||
              errorInfo.type === AuthErrorType.ACCOUNT_LOCKED ||
              errorInfo.type === AuthErrorType.INVALID_CREDENTIALS) && (
              <AdminContactGuidance errorType={errorInfo.type} compact />
            )}
            
            {/* 错误详情 - 仅开发环境显示 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  技术详情
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  <div><strong>错误类型:</strong> {errorInfo.type}</div>
                  <div><strong>错误ID:</strong> {errorInfo.errorId}</div>
                  <div><strong>时间:</strong> {errorInfo.timestamp}</div>
                  <div><strong>消息:</strong> {error?.message}</div>
                  {errorInfo.componentStack && (
                    <div className="mt-2">
                      <div className="font-semibold">组件堆栈:</div>
                      {errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              {errorDisplay.showRetry && errorInfo.canRetry && (
                <Button 
                  variant={errorDisplay.variant}
                  onClick={onRetry || resetError}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {errorDisplay.actionText}
                </Button>
              )}
              
              {errorDisplay.showBackToLogin && (
                <Button 
                  variant={errorDisplay.showRetry ? "outline" : errorDisplay.variant}
                  onClick={onBackToLogin}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {errorDisplay.showRetry ? '返回登录' : errorDisplay.actionText}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSectionLevel) {
    // 区块级认证错误 - 卡片样式
    return (
      <Card className="w-full border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">
                {errorDisplay.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {errorInfo.userFriendlyMessage || errorDisplay.description}
              </p>
            </div>
            <div className="flex gap-2">
              {errorDisplay.showRetry && errorInfo.canRetry && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onRetry || resetError}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  重试
                </Button>
              )}
              {errorDisplay.showBackToLogin && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onBackToLogin}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-3 h-3" />
                  登录
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 组件级认证错误 - 最小化显示
  return (
    <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        <IconComponent className="w-4 h-4 text-destructive" />
        认证失败
      </div>
      <div className="flex gap-2 justify-center">
        {errorInfo.canRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry || resetError}
            className="text-xs"
          >
            重试
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBackToLogin}
          className="text-xs"
        >
          登录
        </Button>
      </div>
    </div>
  );
}

/**
 * 管理员认证错误类型检测工具
 * 基于Admin-Only系统的错误场景和design.md要求
 */
const detectAuthErrorType = (error: Error): AuthErrorType => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // === Admin-Only 专用错误类型检测 ===
  
  // 访问被拒绝 (Access Denied)
  if (message.includes('访问被拒绝') || 
      message.includes('access denied') ||
      message.includes('仅允许管理员') ||
      message.includes('admin only')) {
    return AuthErrorType.ACCESS_DENIED;
  }

  // 权限不足 (Insufficient Privileges)
  if (message.includes('权限不足') ||
      message.includes('insufficient privileges') ||
      message.includes('权限升级') ||
      message.includes('仅限管理员')) {
    return AuthErrorType.INSUFFICIENT_PRIVILEGES;
  }

  // 管理员账户不存在 (Admin Account Not Found)
  if (message.includes('管理员账户不存在') ||
      message.includes('admin account not found') ||
      message.includes('不是有效的管理员账户') ||
      message.includes('无效的管理员凭据')) {
    return AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND;
  }

  // 管理员会话无效 (Admin Session Invalid)
  if (message.includes('管理员会话无效') ||
      message.includes('admin session invalid') ||
      message.includes('管理员会话') ||
      message.includes('admin session')) {
    return AuthErrorType.ADMIN_SESSION_INVALID;
  }

  // 未认证 (Unauthorized)
  if (message.includes('未认证') ||
      message.includes('请先登录') ||
      message.includes('unauthenticated') ||
      message.includes('unauthorized')) {
    return AuthErrorType.UNAUTHORIZED;
  }

  // === 通用认证错误类型检测 ===

  // 无效凭据 (Invalid Credentials)
  if (message.includes('邮箱或密码错误') || 
      message.includes('invalid credentials') ||
      message.includes('invalid_grant') ||
      message.includes('凭据错误')) {
    return AuthErrorType.INVALID_CREDENTIALS;
  }

  // 网络连接失败 (Network Error)
  if (message.includes('network') || 
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('offline') ||
      name.includes('networkerror')) {
    return AuthErrorType.NETWORK_ERROR;
  }

  // 账户被锁定 (Account Locked)
  if (message.includes('账户已锁定') ||
      message.includes('account locked') ||
      message.includes('rate limit') ||
      message.includes('too many attempts')) {
    return AuthErrorType.ACCOUNT_LOCKED;
  }

  // OAuth提供商错误 (OAuth Provider Error)
  if (message.includes('oauth') ||
      message.includes('google') ||
      message.includes('github') ||
      message.includes('provider') ||
      name.includes('oautherror')) {
    return AuthErrorType.OAUTH_ERROR;
  }

  // 会话过期 (Session Expired)
  if (message.includes('session expired') ||
      message.includes('token expired') ||
      message.includes('会话已过期') ||
      message.includes('jwt expired')) {
    return AuthErrorType.SESSION_EXPIRED;
  }

  // 表单验证错误 (Validation Error)
  if (message.includes('validation') ||
      message.includes('invalid email') ||
      message.includes('password') ||
      message.includes('required') ||
      name.includes('validationerror')) {
    return AuthErrorType.VALIDATION_ERROR;
  }

  // 渲染错误
  if (message.includes('render') || 
      message.includes('component') ||
      name.includes('typeerror')) {
    return AuthErrorType.AUTH_RENDER_ERROR;
  }

  return AuthErrorType.UNKNOWN_AUTH_ERROR;
};

/**
 * 检查是否为认证相关错误
 */
const isAuthRelatedError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  // 检查错误消息和堆栈中的认证相关关键词
  const authKeywords = [
    'auth', 'login', 'signin', 'signout', 'logout',
    'session', 'token', 'jwt', 'oauth', 'credentials',
    'password', 'email', 'user', 'permission',
    '认证', '登录', '会话', '凭据', '密码'
  ];
  
  return authKeywords.some(keyword => 
    message.includes(keyword) || stack.includes(keyword)
  );
};

/**
 * React 认证错误边界组件
 * 专门处理认证相关的错误，提供会话清理和重定向功能
 */
export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  private router: any = null;
  private authActions: any = null;

  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      maxRetries: 3,
    };
  }

  componentDidMount() {
    // 在客户端获取路由和认证操作
    if (typeof window !== 'undefined') {
      import('next/navigation').then(({ useRouter }) => {
        // 注意：这里不能直接使用 useRouter，需要通过其他方式获取
        // 在类组件中，我们将通过 window.location 来处理重定向
      });
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isAuthRelated = isAuthRelatedError(error);
    
    if (!isAuthRelated) {
      // 非认证错误，使用父级错误边界处理
      throw error;
    }

    const authErrorType = detectAuthErrorType(error);
    const enhancedErrorInfo: AuthErrorInfo = {
      type: authErrorType,
      message: error.message,
      userFriendlyMessage: this.getUserFriendlyMessage(authErrorType, error.message),
      canRetry: this.canRetry(authErrorType),
      requiresReauth: this.requiresReauth(authErrorType),
      componentStack: errorInfo.componentStack || undefined,
      errorId: `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.setState({
      errorInfo: enhancedErrorInfo,
    });

    // 处理认证错误
    this.handleAuthError(error, enhancedErrorInfo);

    // 调用错误处理回调
    if (this.props.onAuthError && isAuthError(error)) {
      this.props.onAuthError(error);
    }

    // 在开发环境中输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🔐 AuthErrorBoundary 捕获到认证错误');
      console.error('错误:', error);
      console.error('认证错误信息:', enhancedErrorInfo);
      console.error('组件堆栈:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  /**
   * 获取管理员友好的错误消息
   * Admin-Only系统专用错误信息处理
   */
  private getUserFriendlyMessage(errorType: AuthErrorType, originalMessage: string): string {
    switch (errorType) {
      // === Admin-Only 专用错误消息 ===
      case AuthErrorType.ACCESS_DENIED:
        return '系统访问被拒绝：此系统仅允许授权管理员用户登录';
      case AuthErrorType.INSUFFICIENT_PRIVILEGES:
        return '权限不足：您的账户缺少管理员权限，请联系系统管理员';
      case AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND:
        return '管理员账户不存在：输入的邮箱不是有效的管理员账户';
      case AuthErrorType.ADMIN_SESSION_INVALID:
        return '管理员会话无效：检测到异常会话，请重新登录确保安全';
      case AuthErrorType.UNAUTHORIZED:
        return '未认证访问：请使用管理员账户登录后访问此功能';
        
      // === 通用错误消息（管理员版本） ===
      case AuthErrorType.INVALID_CREDENTIALS:
        return '管理员凭据错误：邮箱或密码不正确，请检查后重试';
      case AuthErrorType.NETWORK_ERROR:
        return '网络连接失败：无法连接到认证服务器，请检查网络后重试';
      case AuthErrorType.ACCOUNT_LOCKED:
        return '管理员账户已锁定：请联系系统管理员解锁账户';
      case AuthErrorType.OAUTH_ERROR:
        return 'Admin-Only系统仅支持邮箱密码登录，请使用管理员邮箱登录';
      case AuthErrorType.SESSION_EXPIRED:
        return '管理员会话已过期：请重新登录以继续管理系统';
      case AuthErrorType.VALIDATION_ERROR:
        return '输入验证失败：请检查管理员邮箱和密码格式是否正确';
      default:
        return '管理员认证系统遇到问题，请联系系统管理员获取帮助';
    }
  }

  /**
   * 检查错误是否可以重试
   * Admin-Only系统特定的重试策略
   */
  private canRetry(errorType: AuthErrorType): boolean {
    // 不可重试的管理员专用错误类型
    const nonRetryableAdminErrors = [
      AuthErrorType.INVALID_CREDENTIALS,
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.SESSION_EXPIRED,
      AuthErrorType.ACCESS_DENIED,
      AuthErrorType.INSUFFICIENT_PRIVILEGES,
      AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND,
      AuthErrorType.ADMIN_SESSION_INVALID,
      AuthErrorType.UNAUTHORIZED
    ];
    
    return !nonRetryableAdminErrors.includes(errorType);
  }

  /**
   * 检查错误是否需要重新认证
   * Admin-Only系统特定的重新认证策略
   */
  private requiresReauth(errorType: AuthErrorType): boolean {
    // 需要重新认证的管理员专用错误类型
    const reauthRequiredErrors = [
      AuthErrorType.INVALID_CREDENTIALS,
      AuthErrorType.SESSION_EXPIRED,
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.ACCESS_DENIED,
      AuthErrorType.INSUFFICIENT_PRIVILEGES,
      AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND,
      AuthErrorType.ADMIN_SESSION_INVALID,
      AuthErrorType.UNAUTHORIZED
    ];
    
    return reauthRequiredErrors.includes(errorType);
  }

  /**
   * 处理认证错误的核心逻辑
   * 集成Admin-Only系统的权限检查和会话管理
   */
  private handleAuthError = (error: Error, errorInfo: AuthErrorInfo) => {
    // Admin-Only系统特定错误处理
    if (errorInfo.type === AuthErrorType.INSUFFICIENT_PRIVILEGES ||
        errorInfo.type === AuthErrorType.ACCESS_DENIED ||
        errorInfo.type === AuthErrorType.UNAUTHORIZED) {
      // 权限不足错误需要立即清除会话并重定向
      this.clearAuthSession();
      setTimeout(() => {
        this.redirectToLogin();
      }, 3000); // 给用户更多时间阅读权限不足的说明
      return;
    }

    // 管理员账户相关错误处理
    if (errorInfo.type === AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND ||
        errorInfo.type === AuthErrorType.ADMIN_SESSION_INVALID) {
      // 管理员身份验证失败，立即清除可能的无效会话
      this.clearAuthSession();
    }

    // 常规认证错误处理
    if (this.props.clearSessionOnError !== false && errorInfo.requiresReauth) {
      this.clearAuthSession();
    }

    // 重定向处理（如果需要）
    if (errorInfo.requiresReauth && this.props.redirectOnError) {
      const redirectDelay = errorInfo.type === AuthErrorType.INSUFFICIENT_PRIVILEGES ? 3000 : 2000;
      setTimeout(() => {
        this.redirectToLogin();
      }, redirectDelay);
    }

    // 在开发环境记录管理员专用错误的额外信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🔐 Admin-Only 认证错误详情');
      console.error('错误类型:', errorInfo.type);
      console.error('是否为管理员专用错误:', [
        AuthErrorType.ACCESS_DENIED,
        AuthErrorType.INSUFFICIENT_PRIVILEGES,
        AuthErrorType.ADMIN_ACCOUNT_NOT_FOUND,
        AuthErrorType.ADMIN_SESSION_INVALID,
        AuthErrorType.UNAUTHORIZED
      ].includes(errorInfo.type));
      console.error('需要重新认证:', errorInfo.requiresReauth);
      console.error('可以重试:', errorInfo.canRetry);
      console.groupEnd();
    }
  };

  /**
   * 清除认证会话
   */
  private clearAuthSession = () => {
    try {
      // 清除localStorage中的认证数据
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-store');
        
        // 如果有access到auth store，也清除其状态
        // 这里我们通过window.location重载来强制清除状态
        // 在实际实现中，应该通过auth service来清除
      }
    } catch (error) {
      console.error('Failed to clear auth session:', error);
    }
  };

  /**
   * 重定向到登录页
   */
  private redirectToLogin = () => {
    if (typeof window !== 'undefined') {
      const redirectUrl = this.props.redirectOnError || '/login';
      const currentPath = window.location.pathname;
      
      // 保存当前路径作为登录后的回跳地址
      if (currentPath !== '/login' && currentPath !== '/') {
        const returnUrl = encodeURIComponent(currentPath + window.location.search);
        window.location.href = `${redirectUrl}?returnUrl=${returnUrl}`;
      } else {
        window.location.href = redirectUrl;
      }
    }
  };

  /**
   * 重置错误边界
   */
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  /**
   * 处理重试操作
   */
  handleRetry = () => {
    const { retryCount, maxRetries } = this.state;
    
    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1
      }));
      this.resetErrorBoundary();
    }
  };

  /**
   * 处理返回登录操作
   */
  handleBackToLogin = () => {
    this.clearAuthSession();
    this.redirectToLogin();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { 
      children, 
      fallback: FallbackComponent, 
      level = 'component',
      showRetryButton = true 
    } = this.props;

    if (hasError && error && errorInfo) {
      // 使用自定义回退组件或默认组件
      const FallbackToRender = FallbackComponent || DefaultAuthErrorFallback;
      
      return (
        <div 
          className={cn(
            "auth-error-boundary",
            level === 'page' && "auth-error-boundary-page",
            level === 'section' && "auth-error-boundary-section",
            level === 'component' && "auth-error-boundary-component"
          )}
          data-auth-error-boundary={level}
          data-auth-error-type={errorInfo.type}
          data-auth-error-id={errorInfo.errorId}
        >
          <FallbackToRender
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetErrorBoundary}
            level={level}
            onRetry={showRetryButton ? this.handleRetry : undefined}
            onBackToLogin={this.handleBackToLogin}
          />
        </div>
      );
    }

    return children;
  }
}

/**
 * 高阶组件 - 为认证组件添加错误边界
 */
export function withAuthErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  authErrorBoundaryProps?: Omit<AuthErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <AuthErrorBoundary {...authErrorBoundaryProps}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook - 手动触发认证错误边界 (Admin-Only系统增强版本)
 * 集成管理员权限检查和会话管理
 */
export function useAuthErrorHandler() {
  const { 
    logout, 
    clearError, 
    isAdmin, 
    hasValidAdminSession,
    requireAdmin 
  } = useAuthStoreHook();
  
  return React.useCallback((error: Error | AuthError, clearSession = true) => {
    // 清除当前错误状态
    clearError();
    
    // Admin-Only系统特定错误处理
    const errorMessage = error.message.toLowerCase();
    
    // 检查是否为权限相关错误
    if (errorMessage.includes('权限不足') || 
        errorMessage.includes('访问被拒绝') ||
        errorMessage.includes('仅限管理员') ||
        errorMessage.includes('insufficient privileges')) {
      // 权限不足错误，立即登出并清除会话
      logout();
      setTimeout(() => {
        throw new Error('权限不足：此操作仅限管理员执行');
      });
      return;
    }
    
    // 检查是否为管理员账户相关错误
    if (errorMessage.includes('管理员账户') ||
        errorMessage.includes('admin account') ||
        errorMessage.includes('无效的管理员')) {
      // 管理员身份验证失败，清除无效会话
      logout();
      setTimeout(() => {
        throw new Error('管理员账户验证失败：请确认您的管理员身份');
      });
      return;
    }
    
    // 常规认证错误处理
    if (clearSession && isAuthError(error)) {
      logout();
    }
    
    // 在下一个事件循环中抛出错误，让错误边界捕获
    setTimeout(() => {
      throw error;
    });
  }, [logout, clearError, isAdmin, hasValidAdminSession]);
}

/**
 * 认证错误边界的 Hook 版本 (Admin-Only系统增强版本)
 * 为函数式组件提供管理员专用的认证错误处理能力
 */
export function useAuthErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  const { 
    logout, 
    clearError, 
    isAdmin,
    hasValidAdminSession,
    requireAdmin 
  } = useAuthStoreHook();
  
  const handleAuthError = React.useCallback((error: Error, clearSession = true) => {
    if (isAuthRelatedError(error)) {
      // 清除认证状态
      clearError();
      
      // Admin-Only系统特定错误处理
      const errorMessage = error.message.toLowerCase();
      
      // 权限不足或访问被拒绝的错误
      if (errorMessage.includes('权限不足') || 
          errorMessage.includes('访问被拒绝') ||
          errorMessage.includes('仅限管理员')) {
        // 立即清除会话并设置权限专用错误
        logout();
        const adminError = new Error('权限不足：此功能仅限管理员访问，请联系系统管理员获取权限');
        adminError.name = 'InsufficientPrivilegesError';
        setError(adminError);
        return;
      }
      
      // 管理员身份验证失败
      if (errorMessage.includes('管理员账户') ||
          errorMessage.includes('无效的管理员') ||
          errorMessage.includes('admin account')) {
        logout();
        const adminError = new Error('管理员身份验证失败：请确认您具有有效的管理员账户');
        adminError.name = 'AdminAuthenticationError';
        setError(adminError);
        return;
      }
      
      // 常规认证错误处理
      if (clearSession) {
        logout();
      }
      
      // 设置错误状态
      setError(error);
    } else {
      // 非认证错误，重新抛出
      throw error;
    }
  }, [logout, clearError, isAdmin, hasValidAdminSession]);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  // Admin-Only系统增强：检查管理员权限的便捷方法
  const checkAdminAccess = React.useCallback(() => {
    try {
      requireAdmin();
      return true;
    } catch (error) {
      handleAuthError(error as Error, true);
      return false;
    }
  }, [requireAdmin, handleAuthError]);
  
  // 如果有错误，抛出让ErrorBoundary捕获
  if (error) {
    throw error;
  }
  
  return {
    handleAuthError,
    resetError,
    checkAdminAccess,
    hasError: !!error,
    isAdminUser: isAdmin(),
    hasValidSession: hasValidAdminSession(),
  };
}

/**
 * 导出常用类型和组件
 */
export default AuthErrorBoundary;
export { 
  DefaultAuthErrorFallback, 
  detectAuthErrorType, 
  isAuthRelatedError
};

