/**
 * Social Authentication Hook
 * 
 * 管理社交认证流程的专用Hook，支持Google和GitHub OAuth集成。
 * 提供OAuth流程处理、提供商特定错误处理和状态管理功能。
 * 
 * Requirements:
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 集成SupabaseAuthService.ts的OAuth方法
 * - 提供商特定的错误处理和状态管理
 * - OAuth流程管理（启动、回调处理、错误恢复）
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthActions } from './useAuth';
// import { supabaseAuthService } from '../services/SupabaseAuthService'; // DEPRECATED: Replaced by ClerkAuthService
import { 
  SocialProvider, 
  AuthError, 
  AuthSession,
  AuthUser
} from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 社交认证状态接口
 */
export interface SocialAuthState {
  /** 当前正在处理的提供商 */
  activeProvider: SocialProvider | null;
  /** OAuth流程是否正在进行 */
  isLoading: boolean;
  /** 是否正在处理回调 */
  isHandlingCallback: boolean;
  /** 社交认证错误 */
  error: ProviderError | null;
  /** 最后使用的提供商 */
  lastUsedProvider: SocialProvider | null;
  /** OAuth重定向URL */
  redirectUrl: string | null;
}

/**
 * 社交认证配置选项
 */
export interface SocialAuthOptions {
  /** 认证成功后的重定向URL */
  redirectTo?: string;
  /** 自动处理回调 */
  autoHandleCallback?: boolean;
  /** 调试模式 */
  debug?: boolean;
  /** 自定义成功处理器 */
  onSuccess?: (session: AuthSession) => void;
  /** 自定义错误处理器 */
  onError?: (error: AuthError, provider: SocialProvider) => void;
  /** 自定义流程开始处理器 */
  onStart?: (provider: SocialProvider) => void;
}

/**
 * 提供商特定错误类型
 */
export interface ProviderError extends AuthError {
  /** 提供商名称 */
  provider: SocialProvider;
  /** OAuth特定错误代码 */
  oauthError?: string;
  /** 是否可重试 */
  retryable: boolean;
}

/**
 * OAuth回调参数
 */
export interface OAuthCallbackParams {
  /** 授权码 */
  code?: string;
  /** 状态参数 */
  state?: string;
  /** 错误代码 */
  error?: string;
  /** 错误描述 */
  error_description?: string;
}

/**
 * Hook返回值接口
 */
export interface UseSocialAuthReturn {
  // 状态
  state: SocialAuthState;
  
  // 操作方法
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithProvider: (provider: SocialProvider) => Promise<void>;
  handleOAuthCallback: (params: OAuthCallbackParams) => Promise<AuthSession | null>;
  
  // 工具方法
  clearError: () => void;
  retry: () => Promise<void>;
  cancel: () => void;
  
  // 便捷属性
  isGoogleLoading: boolean;
  isGitHubLoading: boolean;
  canRetry: boolean;
  errorMessage: string | null;
}

// ============================================================================
// Provider Error Mapping
// ============================================================================

/**
 * 提供商特定错误映射
 */
const PROVIDER_ERROR_MAP: Record<SocialProvider, Record<string, string>> = {
  google: {
    'access_denied': '用户取消了Google登录',
    'invalid_request': 'Google登录请求无效，请重试',
    'unauthorized_client': 'Google认证配置错误',
    'unsupported_response_type': 'Google认证不支持此响应类型',
    'invalid_scope': 'Google认证权限范围无效',
    'server_error': 'Google服务器错误，请稍后重试',
    'temporarily_unavailable': 'Google认证服务暂时不可用',
  },
  github: {
    'access_denied': '用户取消了GitHub登录',
    'application_suspended': 'GitHub应用已被暂停',
    'redirect_uri_mismatch': 'GitHub重定向URL不匹配',
    'incorrect_client_credentials': 'GitHub客户端凭据无效',
    'bad_verification_code': 'GitHub验证码无效',
    'unverified_email': 'GitHub邮箱未验证，请先验证邮箱',
  },
};

/**
 * 通用OAuth错误映射
 */
const OAUTH_ERROR_MAP: Record<string, string> = {
  'popup_blocked': '弹窗被阻止，请允许弹窗或使用重定向登录',
  'popup_closed': '登录窗口被关闭，请重试',
  'network_error': '网络连接错误，请检查网络后重试',
  'timeout': '登录超时，请重试',
  'invalid_state': '登录状态无效，可能是CSRF攻击',
  'email_conflict': '该邮箱已使用其他方式注册，请使用相应的登录方式',
  'account_exists': '账户已存在，请使用已有的登录方式',
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Social Authentication Hook
 * 
 * 管理社交认证流程的核心Hook，支持Google和GitHub OAuth。
 * 
 * @param options 配置选项
 * @returns 社交认证管理对象
 * 
 * Usage:
 * ```tsx
 * function SocialLoginButtons() {
 *   const { 
 *     signInWithGoogle, 
 *     signInWithGitHub, 
 *     state: { isLoading, error },
 *     clearError 
 *   } = useSocialAuth();
 *   
 *   return (
 *     <>
 *       <button 
 *         onClick={signInWithGoogle}
 *         disabled={isLoading}
 *       >
 *         使用Google登录
 *       </button>
 *       <button 
 *         onClick={signInWithGitHub}
 *         disabled={isLoading}
 *       >
 *         使用GitHub登录
 *       </button>
 *       {error && (
 *         <div className="error">
 *           {error.message}
 *           <button onClick={clearError}>关闭</button>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useSocialAuth(options: SocialAuthOptions = {}): UseSocialAuthReturn {
  const {
    redirectTo,
    autoHandleCallback = true,
    debug = false,
    onSuccess,
    onError,
    onStart,
  } = options;

  // ========================================================================
  // 集成认证操作
  // ========================================================================

  const {
    loginWithProvider,
    isLoading: authIsLoading,
    error: authError,
    clearError: clearAuthError,
  } = useAuthActions();

  // ========================================================================
  // 内部状态管理
  // ========================================================================

  const [state, setState] = useState<SocialAuthState>({
    activeProvider: null,
    isLoading: false,
    isHandlingCallback: false,
    error: null,
    lastUsedProvider: null,
    redirectUrl: null,
  });

  // ========================================================================
  // 错误处理工具
  // ========================================================================

  /**
   * 创建提供商特定错误
   */
  const createProviderError = useCallback((
    provider: SocialProvider,
    errorCode: string,
    originalError?: Error | null
  ): ProviderError => {
    const providerErrors = PROVIDER_ERROR_MAP[provider];
    const oauthErrors = OAUTH_ERROR_MAP;
    
    let message = providerErrors[errorCode] || oauthErrors[errorCode];
    
    if (!message) {
      message = `${provider === 'google' ? 'Google' : 'GitHub'}登录失败，请重试`;
    }

    return {
      code: 'OAUTH_ERROR',
      message,
      provider,
      oauthError: errorCode,
      retryable: !['access_denied', 'invalid_state'].includes(errorCode),
      timestamp: new Date().toISOString(),
      details: originalError?.message,
      metadata: {
        provider,
        errorCode,
        originalError: originalError?.toString(),
      },
    };
  }, []);

  /**
   * 处理OAuth错误
   */
  const handleOAuthError = useCallback((
    provider: SocialProvider,
    error: Error | string,
    errorCode?: string
  ) => {
    const providerError = createProviderError(
      provider,
      errorCode || 'unknown_error',
      error instanceof Error ? error : new Error(error.toString())
    );

    setState(prev => ({
      ...prev,
      error: providerError,
      isLoading: false,
      activeProvider: null,
    }));

    if (debug) {
      console.error(`[useSocialAuth] ${provider} OAuth error:`, providerError);
    }

    if (onError) {
      onError(providerError, provider);
    }
  }, [createProviderError, debug, onError]);

  // ========================================================================
  // OAuth流程处理
  // ========================================================================

  /**
   * 启动OAuth流程
   */
  const startOAuthFlow = useCallback(async (provider: SocialProvider) => {
    try {
      // 清理之前的错误
      setState(prev => ({
        ...prev,
        error: null,
        activeProvider: provider,
        isLoading: true,
        lastUsedProvider: provider,
      }));

      if (debug) {
        console.log(`[useSocialAuth] Starting ${provider} OAuth flow`);
      }

      if (onStart) {
        onStart(provider);
      }

      // TODO: Replace with ClerkAuthService social auth
      // await supabaseAuthService.signInWithProvider(provider, {
      //   redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      // });
      throw new Error('Social authentication is temporarily disabled during migration to Clerk');

      // OAuth流程已启动，用户被重定向
      // 状态将在回调中更新
      if (debug) {
        console.log(`[useSocialAuth] ${provider} OAuth flow initiated`);
      }

    } catch (error) {
      handleOAuthError(provider, error as Error);
    }
  }, [debug, onStart, redirectTo, handleOAuthError]);

  /**
   * 处理OAuth回调
   */
  const handleOAuthCallback = useCallback(async (
    params: OAuthCallbackParams
  ): Promise<AuthSession | null> => {
    const { code, state: stateParam, error, error_description } = params;
    
    setState(prev => ({
      ...prev,
      isHandlingCallback: true,
      error: null,
    }));

    try {
      // 检查是否有错误参数
      if (error) {
        throw new Error(error_description || error);
      }

      if (!code) {
        throw new Error('授权码缺失');
      }

      if (debug) {
        console.log('[useSocialAuth] Processing OAuth callback with code:', code);
      }

      // TODO: Replace with ClerkAuthService callback handling
      // const session = await supabaseAuthService.handleSocialCallback(
      //   state.lastUsedProvider || 'google', // 默认使用Google
      //   code,
      //   stateParam || ''
      // );
      throw new Error('Social authentication callback is temporarily disabled during migration to Clerk');

      if (debug) {
        console.log('[useSocialAuth] OAuth callback successful:', session);
      }

      // 更新状态
      setState(prev => ({
        ...prev,
        isLoading: false,
        isHandlingCallback: false,
        activeProvider: null,
        error: null,
      }));

      if (onSuccess) {
        onSuccess(session);
      }

      return session;

    } catch (error) {
      const provider = state.lastUsedProvider || 'google';
      handleOAuthError(provider, error as Error, 'callback_error');
      
      setState(prev => ({
        ...prev,
        isHandlingCallback: false,
      }));

      return null;
    }
  }, [state.lastUsedProvider, debug, onSuccess, handleOAuthError]);

  // ========================================================================
  // 提供商特定方法
  // ========================================================================

  /**
   * Google登录
   */
  const signInWithGoogle = useCallback(async () => {
    await startOAuthFlow('google');
  }, [startOAuthFlow]);

  /**
   * GitHub登录
   */
  const signInWithGitHub = useCallback(async () => {
    await startOAuthFlow('github');
  }, [startOAuthFlow]);

  /**
   * 通用提供商登录
   */
  const signInWithProvider = useCallback(async (provider: SocialProvider) => {
    await startOAuthFlow(provider);
  }, [startOAuthFlow]);

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 清理错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
    clearAuthError();
  }, [clearAuthError]);

  /**
   * 重试上次失败的操作
   */
  const retry = useCallback(async () => {
    if (state.lastUsedProvider && state.error?.retryable) {
      await startOAuthFlow(state.lastUsedProvider);
    }
  }, [state.lastUsedProvider, state.error, startOAuthFlow]);

  /**
   * 取消当前操作
   */
  const cancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      isHandlingCallback: false,
      activeProvider: null,
      error: null,
    }));
  }, []);

  // ========================================================================
  // 副作用处理
  // ========================================================================

  /**
   * 监听全局认证错误
   */
  useEffect(() => {
    if (authError && state.activeProvider) {
      handleOAuthError(state.activeProvider, authError.toString());
    }
  }, [authError, state.activeProvider, handleOAuthError]);

  /**
   * 自动处理URL回调参数
   */
  useEffect(() => {
    if (!autoHandleCallback || typeof window === 'undefined') {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');
    const errorDescription = urlParams.get('error_description');

    // 如果URL中有OAuth相关参数，自动处理回调
    if (code || error) {
      handleOAuthCallback({
        code: code || undefined,
        state: state || undefined,
        error: error || undefined,
        error_description: errorDescription || undefined,
      });

      // 清理URL参数
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [autoHandleCallback, handleOAuthCallback]);

  // ========================================================================
  // 计算属性
  // ========================================================================

  const computedValues = useMemo(() => ({
    isGoogleLoading: state.activeProvider === 'google' && (state.isLoading || authIsLoading),
    isGitHubLoading: state.activeProvider === 'github' && (state.isLoading || authIsLoading),
    canRetry: !!state.lastUsedProvider && !!state.error?.retryable,
    errorMessage: state.error?.message || null,
  }), [state, authIsLoading]);

  // ========================================================================
  // 返回值构建
  // ========================================================================

  return {
    // 状态
    state: {
      ...state,
      isLoading: state.isLoading || authIsLoading,
    },
    
    // 操作方法
    signInWithGoogle,
    signInWithGitHub,
    signInWithProvider,
    handleOAuthCallback,
    
    // 工具方法
    clearError,
    retry,
    cancel,
    
    // 便捷属性
    ...computedValues,
  };
}

// ============================================================================
// 便捷Hook导出
// ============================================================================

/**
 * Google认证专用Hook
 */
export function useGoogleAuth(options?: Omit<SocialAuthOptions, 'onStart'>) {
  const socialAuth = useSocialAuth({
    ...options,
    onStart: (provider) => {
      if (provider === 'google' && options?.onSuccess) {
        // 只处理Google相关回调
      }
    },
  });

  return {
    signIn: socialAuth.signInWithGoogle,
    isLoading: socialAuth.isGoogleLoading,
    error: socialAuth.state.error,
    clearError: socialAuth.clearError,
    retry: socialAuth.canRetry ? socialAuth.retry : undefined,
  };
}

/**
 * GitHub认证专用Hook
 */
export function useGitHubAuth(options?: Omit<SocialAuthOptions, 'onStart'>) {
  const socialAuth = useSocialAuth({
    ...options,
    onStart: (provider) => {
      if (provider === 'github' && options?.onSuccess) {
        // 只处理GitHub相关回调
      }
    },
  });

  return {
    signIn: socialAuth.signInWithGitHub,
    isLoading: socialAuth.isGitHubLoading,
    error: socialAuth.state.error,
    clearError: socialAuth.clearError,
    retry: socialAuth.canRetry ? socialAuth.retry : undefined,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useSocialAuth;