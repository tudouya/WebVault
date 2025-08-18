'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, LogIn, Wifi, Lock, User, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AuthError, 
  isAuthError
} from '../types';
import { useAuthStoreHook } from '../stores';

/**
 * 认证错误类型枚举
 * 基于design.md要求的错误场景
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  NETWORK_ERROR = 'network_error',
  ACCOUNT_LOCKED = 'account_locked',
  OAUTH_ERROR = 'oauth_error',
  SESSION_EXPIRED = 'session_expired',
  VALIDATION_ERROR = 'validation_error',
  AUTH_RENDER_ERROR = 'auth_render_error',
  UNKNOWN_AUTH_ERROR = 'unknown_auth_error'
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
 * 默认认证错误回退组件
 * 根据design.md错误处理要求提供用户友好的错误界面
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

  // 根据认证错误类型提供不同的展示内容
  const getAuthErrorDisplay = (errorType: AuthErrorType) => {
    switch (errorType) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return {
          icon: User,
          title: '登录凭据错误',
          description: '邮箱或密码错误，请检查后重试',
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
          title: '账户已被锁定',
          description: '由于多次登录失败，账户已被临时锁定。请15分钟后重试或联系客服',
          actionText: '返回登录',
          variant: 'outline' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      case AuthErrorType.OAUTH_ERROR:
        return {
          icon: Bug,
          title: '第三方登录失败',
          description: '第三方登录服务暂时不可用，请尝试邮箱登录或稍后重试',
          actionText: '返回登录',
          variant: 'default' as const,
          showRetry: false,
          showBackToLogin: true,
        };
      
      case AuthErrorType.SESSION_EXPIRED:
        return {
          icon: AlertCircle,
          title: '会话已过期',
          description: '您的登录会话已过期，请重新登录以继续使用',
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
          description: '认证页面遇到问题，请刷新页面重试',
          actionText: '刷新页面',
          variant: 'default' as const,
          showRetry: true,
          showBackToLogin: true,
        };
      
      default:
        return {
          icon: AlertCircle,
          title: '认证服务异常',
          description: '认证服务遇到未知问题，请稍后重试',
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
 * 认证错误类型检测工具
 * 基于design.md错误场景要求
 */
const detectAuthErrorType = (error: Error): AuthErrorType => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // 无效凭据 (Invalid Credentials)
  if (message.includes('邮箱或密码错误') || 
      message.includes('invalid credentials') ||
      message.includes('invalid_grant') ||
      message.includes('unauthorized')) {
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
   * 获取用户友好的错误消息
   */
  private getUserFriendlyMessage(errorType: AuthErrorType, originalMessage: string): string {
    switch (errorType) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return '邮箱或密码错误，请检查后重试';
      case AuthErrorType.NETWORK_ERROR:
        return '网络连接失败，请检查网络连接后重试';
      case AuthErrorType.ACCOUNT_LOCKED:
        return '账户已被临时锁定，请15分钟后重试或联系客服';
      case AuthErrorType.OAUTH_ERROR:
        return '第三方登录暂时不可用，请尝试邮箱登录';
      case AuthErrorType.SESSION_EXPIRED:
        return '登录会话已过期，请重新登录';
      case AuthErrorType.VALIDATION_ERROR:
        return '请检查输入信息格式是否正确';
      default:
        return '认证服务遇到问题，请稍后重试';
    }
  }

  /**
   * 检查错误是否可以重试
   */
  private canRetry(errorType: AuthErrorType): boolean {
    return ![
      AuthErrorType.INVALID_CREDENTIALS,
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.SESSION_EXPIRED
    ].includes(errorType);
  }

  /**
   * 检查错误是否需要重新认证
   */
  private requiresReauth(errorType: AuthErrorType): boolean {
    return [
      AuthErrorType.INVALID_CREDENTIALS,
      AuthErrorType.SESSION_EXPIRED,
      AuthErrorType.ACCOUNT_LOCKED
    ].includes(errorType);
  }

  /**
   * 处理认证错误的核心逻辑
   */
  private handleAuthError = (error: Error, errorInfo: AuthErrorInfo) => {
    // 清除会话（如果需要）
    if (this.props.clearSessionOnError !== false && errorInfo.requiresReauth) {
      this.clearAuthSession();
    }

    // 重定向处理（如果需要）
    if (errorInfo.requiresReauth && this.props.redirectOnError) {
      setTimeout(() => {
        this.redirectToLogin();
      }, 2000); // 延迟2秒显示错误后重定向
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
 * Hook - 手动触发认证错误边界
 */
export function useAuthErrorHandler() {
  const { logout, clearError } = useAuthStoreHook();
  
  return React.useCallback((error: Error | AuthError, clearSession = true) => {
    // 清除当前错误状态
    clearError();
    
    // 如果是会话相关错误，清除会话
    if (clearSession && isAuthError(error)) {
      logout();
    }
    
    // 在下一个事件循环中抛出错误，让错误边界捕获
    setTimeout(() => {
      throw error;
    });
  }, [logout, clearError]);
}

/**
 * 认证错误边界的 Hook 版本
 * 为函数式组件提供认证错误处理能力
 */
export function useAuthErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  const { logout, clearError } = useAuthStoreHook();
  
  const handleAuthError = React.useCallback((error: Error, clearSession = true) => {
    if (isAuthRelatedError(error)) {
      // 清除认证状态
      clearError();
      
      if (clearSession) {
        logout();
      }
      
      // 设置错误状态
      setError(error);
    } else {
      // 非认证错误，重新抛出
      throw error;
    }
  }, [logout, clearError]);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  // 如果有错误，抛出让ErrorBoundary捕获
  if (error) {
    throw error;
  }
  
  return {
    handleAuthError,
    resetError,
    hasError: !!error,
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

