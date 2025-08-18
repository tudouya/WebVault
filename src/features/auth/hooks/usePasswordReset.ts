/**
 * Password Reset Hook
 * 
 * 实现密码重置流程的状态管理和业务逻辑封装，支持邮件发送、令牌验证和密码更新。
 * 提供完整的密码重置用户体验，包含错误处理、重试机制和状态流转管理。
 * 
 * Requirements:
 * - 3.1: 密码重置请求 (邮件发送，5分钟内送达，隐私保护)
 * - 3.2: 密码重置流程完整性 (表单验证，加载状态，错误处理)
 * - 3.3: 密码重置确认 (令牌验证，新密码设置，重置完成)
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAuthActions } from './useAuth';
import { supabaseAuthService } from '../services/SupabaseAuthService';
import { 
  PasswordResetData,
  NewPasswordData,
  AuthError,
  passwordResetSchema,
  newPasswordSchema,
  sanitizeAuthInput,
  isValidLoginEmail,
  checkPasswordSecurity,
  AUTH_ERROR_MESSAGES
} from '../schemas/auth-schemas';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 密码重置流程步骤
 */
export type PasswordResetStep = 
  | 'request'          // 请求重置 - 输入邮箱
  | 'email-sent'       // 邮件已发送 - 等待用户点击
  | 'token-validation' // 令牌验证 - 验证邮件链接
  | 'password-update'  // 密码更新 - 设置新密码
  | 'completed';       // 重置完成 - 成功提示

/**
 * 密码重置状态接口
 */
export interface PasswordResetState {
  /** 当前流程步骤 */
  step: PasswordResetStep;
  /** 用户邮箱 */
  email?: string;
  /** 重置令牌 */
  resetToken?: string;
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error?: AuthError;
  /** 尝试次数 */
  attempts: number;
  /** 最后尝试时间 */
  lastAttemptTime?: Date;
  /** 是否可以重试 */
  canRetry: boolean;
  /** 下次重试时间 */
  nextRetryTime?: Date;
}

/**
 * 密码重置配置选项
 */
export interface PasswordResetOptions {
  /** 成功回调 */
  onSuccess?: (result: { step: PasswordResetStep; email?: string }) => void;
  /** 错误回调 */
  onError?: (error: AuthError) => void;
  /** 步骤变化回调 */
  onStepChange?: (step: PasswordResetStep, previousStep: PasswordResetStep) => void;
  /** 自动清理错误时间 (毫秒) */
  autoClearErrorDelay?: number;
  /** 重试冷却时间 (毫秒) */
  retryCooldown?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * Hook返回值接口
 */
export interface UsePasswordResetReturn {
  // 状态
  state: PasswordResetState;
  
  // 主要操作
  requestReset: (data: PasswordResetData) => Promise<void>;
  confirmReset: (data: NewPasswordData) => Promise<void>;
  verifyToken: (token: string) => Promise<boolean>;
  
  // 流程控制
  goToStep: (step: PasswordResetStep) => void;
  restart: () => void;
  retry: () => Promise<void>;
  
  // 状态管理
  clearError: () => void;
  setEmail: (email: string) => void;
  setToken: (token: string) => void;
  
  // 便捷属性
  isRequestStep: boolean;
  isEmailSentStep: boolean;
  isTokenValidationStep: boolean;
  isPasswordUpdateStep: boolean;
  isCompletedStep: boolean;
  canProceed: boolean;
  errorMessage: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<PasswordResetOptions> = {
  onSuccess: () => {},
  onError: () => {},
  onStepChange: () => {},
  autoClearErrorDelay: 5000,
  retryCooldown: 60000, // 1分钟
  maxRetries: 3,
  debug: false,
};

const INITIAL_STATE: PasswordResetState = {
  step: 'request',
  isLoading: false,
  attempts: 0,
  canRetry: true,
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Password Reset Hook
 * 
 * 封装密码重置流程的完整状态管理和业务逻辑。
 * 支持多步骤流程、错误处理、重试机制和用户体验优化。
 * 
 * @param options 配置选项
 * @returns 密码重置状态和操作方法
 * 
 * Usage:
 * ```tsx
 * function PasswordResetPage() {
 *   const {
 *     state,
 *     requestReset,
 *     confirmReset,
 *     verifyToken,
 *     isRequestStep,
 *     isPasswordUpdateStep,
 *     errorMessage
 *   } = usePasswordReset({
 *     onSuccess: (result) => {
 *       if (result.step === 'completed') {
 *         router.push('/login?message=password-reset-success');
 *       }
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   });
 * 
 *   if (isRequestStep) {
 *     return <RequestResetForm onSubmit={requestReset} />;
 *   }
 * 
 *   if (isPasswordUpdateStep) {
 *     return <NewPasswordForm onSubmit={confirmReset} />;
 *   }
 * 
 *   return <div>Processing...</div>;
 * }
 * ```
 */
export function usePasswordReset(
  options: PasswordResetOptions = {}
): UsePasswordResetReturn {
  const {
    onSuccess,
    onError,
    onStepChange,
    autoClearErrorDelay,
    retryCooldown,
    maxRetries,
    debug,
  } = { ...DEFAULT_OPTIONS, ...options };

  // ========================================================================
  // State Management
  // ========================================================================

  const [state, setState] = useState<PasswordResetState>(INITIAL_STATE);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef<'request' | 'confirm' | null>(null);

  // ========================================================================
  // Authentication Integration
  // ========================================================================

  const { resetPassword, confirmPasswordReset, isLoading: authLoading, error: authError } = useAuthActions();

  // ========================================================================
  // Utility Functions
  // ========================================================================

  /**
   * 安全的状态更新函数
   */
  const updateState = useCallback((updates: Partial<PasswordResetState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      
      if (debug && updates.step && updates.step !== prevState.step) {
        console.log(`[usePasswordReset] Step change: ${prevState.step} -> ${updates.step}`);
      }
      
      return newState;
    });
  }, [debug]);

  /**
   * 设置错误状态
   */
  const setError = useCallback((error: AuthError) => {
    updateState({ 
      error, 
      isLoading: false 
    });

    // 触发错误回调
    onError(error);

    // 自动清理错误
    if (autoClearErrorDelay > 0) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      errorTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, error: undefined }));
      }, autoClearErrorDelay);
    }

    if (debug) {
      console.error('[usePasswordReset] Error:', error);
    }
  }, [updateState, onError, autoClearErrorDelay, debug]);

  /**
   * 创建标准化错误对象
   */
  const createError = useCallback((
    code: AuthError['code'],
    message: string,
    field?: AuthError['field']
  ): AuthError => ({
    code,
    message,
    field,
    timestamp: new Date().toISOString(),
  }), []);

  /**
   * 检查重试冷却时间
   */
  const checkRetryCooldown = useCallback((): boolean => {
    if (!state.lastAttemptTime) return true;
    
    const timeSinceLastAttempt = Date.now() - state.lastAttemptTime.getTime();
    return timeSinceLastAttempt >= retryCooldown;
  }, [state.lastAttemptTime, retryCooldown]);

  /**
   * 更新重试状态
   */
  const updateRetryState = useCallback(() => {
    const attempts = state.attempts + 1;
    const canRetry = attempts < maxRetries && checkRetryCooldown();
    const nextRetryTime = canRetry ? undefined : new Date(Date.now() + retryCooldown);

    updateState({
      attempts,
      lastAttemptTime: new Date(),
      canRetry,
      nextRetryTime,
    });
  }, [state.attempts, maxRetries, checkRetryCooldown, retryCooldown, updateState]);

  // ========================================================================
  // Core Business Logic
  // ========================================================================

  /**
   * 请求密码重置
   * 
   * 发送密码重置邮件，处理邮箱验证和错误情况。
   * Requirements: 3.1 (密码重置请求)
   */
  const requestReset = useCallback(async (data: PasswordResetData): Promise<void> => {
    try {
      // 清理之前的错误
      updateState({ error: undefined });

      // 验证输入数据
      const validationResult = passwordResetSchema.safeParse(data);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw createError(
          'INVALID_EMAIL',
          firstError.message,
          firstError.path[0] as AuthError['field']
        );
      }

      // 检查蜜罐字段
      if (data.honeypot) {
        throw createError('RATE_LIMIT_EXCEEDED', AUTH_ERROR_MESSAGES.LOGIN.BOT_DETECTED);
      }

      // 清理邮箱输入
      const sanitizedEmail = sanitizeAuthInput(data.email);
      
      // 额外邮箱验证
      if (!isValidLoginEmail(sanitizedEmail)) {
        throw createError(
          'INVALID_EMAIL',
          AUTH_ERROR_MESSAGES.PASSWORD_RESET.EMAIL_INVALID,
          'email'
        );
      }

      // 检查重试限制
      if (!checkRetryCooldown()) {
        const waitTime = Math.ceil((state.nextRetryTime!.getTime() - Date.now()) / 1000);
        throw createError(
          'RATE_LIMIT_EXCEEDED',
          `请等待 ${waitTime} 秒后再试`
        );
      }

      // 设置加载状态
      updateState({ isLoading: true });
      lastActionRef.current = 'request';

      if (debug) {
        console.log('[usePasswordReset] Requesting password reset for:', sanitizedEmail);
      }

      // 调用认证服务
      await resetPassword(sanitizedEmail);

      // 更新状态 - 成功
      const previousStep = state.step;
      updateState({
        step: 'email-sent',
        email: sanitizedEmail,
        isLoading: false,
        error: undefined,
      });

      // 触发回调
      onStepChange('email-sent', previousStep);
      onSuccess({ step: 'email-sent', email: sanitizedEmail });

      if (debug) {
        console.log('[usePasswordReset] Password reset email sent successfully');
      }

    } catch (error) {
      updateRetryState();

      if (error instanceof Error && 'code' in error) {
        setError(error as AuthError);
      } else if (error instanceof Error) {
        setError(createError('SERVER_ERROR', error.message));
      } else {
        setError(createError('UNKNOWN_ERROR', AUTH_ERROR_MESSAGES.PASSWORD_RESET.EMAIL_INVALID));
      }
    }
  }, [
    state.step,
    updateState,
    resetPassword,
    checkRetryCooldown,
    updateRetryState,
    setError,
    createError,
    onStepChange,
    onSuccess,
    debug,
  ]);

  /**
   * 验证重置令牌
   * 
   * 验证从邮件链接获取的重置令牌有效性。
   * Requirements: 3.3 (令牌验证)
   */
  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      if (!token || typeof token !== 'string') {
        if (debug) {
          console.log('[usePasswordReset] Invalid token format');
        }
        return false;
      }

      // 清理令牌
      const sanitizedToken = sanitizeAuthInput(token);
      
      if (debug) {
        console.log('[usePasswordReset] Verifying reset token');
      }

      // 设置加载状态
      updateState({ isLoading: true });

      // 通过认证服务验证令牌
      const isValid = await supabaseAuthService.verifyResetToken(sanitizedToken);

      if (isValid) {
        // 令牌有效 - 进入密码更新步骤
        const previousStep = state.step;
        updateState({
          step: 'password-update',
          resetToken: sanitizedToken,
          isLoading: false,
          error: undefined,
        });

        onStepChange('password-update', previousStep);
        
        if (debug) {
          console.log('[usePasswordReset] Token verified successfully');
        }
      } else {
        // 令牌无效
        setError(createError(
          'INVALID_CREDENTIALS', 
          AUTH_ERROR_MESSAGES.PASSWORD_RESET.TOKEN_INVALID
        ));
        
        if (debug) {
          console.log('[usePasswordReset] Token verification failed');
        }
      }

      return isValid;

    } catch (error) {
      setError(createError(
        'SERVER_ERROR',
        AUTH_ERROR_MESSAGES.PASSWORD_RESET.TOKEN_INVALID
      ));
      
      if (debug) {
        console.error('[usePasswordReset] Token verification error:', error);
      }
      
      return false;
    }
  }, [state.step, updateState, setError, createError, onStepChange, debug]);

  /**
   * 确认密码重置
   * 
   * 使用验证过的令牌设置新密码，完成重置流程。
   * Requirements: 3.3 (密码重置确认)
   */
  const confirmReset = useCallback(async (data: NewPasswordData): Promise<void> => {
    try {
      // 清理之前的错误
      updateState({ error: undefined });

      // 验证输入数据
      const validationResult = newPasswordSchema.safeParse(data);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw createError(
          'WEAK_PASSWORD',
          firstError.message,
          firstError.path[0] as AuthError['field']
        );
      }

      // 验证令牌存在
      const token = data.token || state.resetToken;
      if (!token) {
        throw createError(
          'INVALID_CREDENTIALS',
          AUTH_ERROR_MESSAGES.PASSWORD_RESET.TOKEN_INVALID
        );
      }

      // 清理输入数据
      const sanitizedPassword = sanitizeAuthInput(data.password);
      const sanitizedToken = sanitizeAuthInput(token);

      // 额外密码安全检查
      const passwordCheck = checkPasswordSecurity(sanitizedPassword);
      if (!passwordCheck.isValid) {
        throw createError(
          'WEAK_PASSWORD',
          `密码安全检查失败: ${passwordCheck.issues.join(', ')}`,
          'password'
        );
      }

      // 设置加载状态
      updateState({ isLoading: true });
      lastActionRef.current = 'confirm';

      if (debug) {
        console.log('[usePasswordReset] Confirming password reset');
      }

      // 调用认证服务
      await confirmPasswordReset(sanitizedToken, sanitizedPassword);

      // 更新状态 - 重置完成
      const previousStep = state.step;
      updateState({
        step: 'completed',
        isLoading: false,
        error: undefined,
      });

      // 触发回调
      onStepChange('completed', previousStep);
      onSuccess({ step: 'completed', email: state.email });

      if (debug) {
        console.log('[usePasswordReset] Password reset completed successfully');
      }

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        setError(error as AuthError);
      } else if (error instanceof Error) {
        setError(createError('SERVER_ERROR', error.message));
      } else {
        setError(createError('UNKNOWN_ERROR', '密码重置失败，请重试'));
      }
    }
  }, [
    state.step,
    state.resetToken,
    state.email,
    updateState,
    confirmPasswordReset,
    setError,
    createError,
    onStepChange,
    onSuccess,
    debug,
  ]);

  // ========================================================================
  // Flow Control Functions
  // ========================================================================

  /**
   * 跳转到指定步骤
   */
  const goToStep = useCallback((step: PasswordResetStep) => {
    const previousStep = state.step;
    updateState({ 
      step, 
      error: undefined,
      isLoading: false,
    });
    onStepChange(step, previousStep);
    
    if (debug) {
      console.log(`[usePasswordReset] Manual step change: ${previousStep} -> ${step}`);
    }
  }, [state.step, updateState, onStepChange, debug]);

  /**
   * 重新开始流程
   */
  const restart = useCallback(() => {
    setState(INITIAL_STATE);
    lastActionRef.current = null;
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    if (debug) {
      console.log('[usePasswordReset] Flow restarted');
    }
  }, [debug]);

  /**
   * 重试上次操作
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!state.canRetry) {
      setError(createError(
        'RATE_LIMIT_EXCEEDED',
        '请等待冷却时间后再试'
      ));
      return;
    }

    // 清理错误状态
    updateState({ error: undefined });

    // 根据上次操作重试
    if (lastActionRef.current === 'request' && state.email) {
      await requestReset({ email: state.email });
    } else if (lastActionRef.current === 'confirm' && state.resetToken) {
      // 重试确认需要用户重新输入密码，这里只清理状态
      goToStep('password-update');
    }
  }, [state.canRetry, state.email, state.resetToken, requestReset, goToStep, setError, createError, updateState]);

  // ========================================================================
  // State Management Functions
  // ========================================================================

  /**
   * 清理错误
   */
  const clearError = useCallback(() => {
    updateState({ error: undefined });
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [updateState]);

  /**
   * 设置邮箱
   */
  const setEmail = useCallback((email: string) => {
    updateState({ email: sanitizeAuthInput(email) });
  }, [updateState]);

  /**
   * 设置令牌
   */
  const setToken = useCallback((token: string) => {
    updateState({ resetToken: sanitizeAuthInput(token) });
  }, [updateState]);

  // ========================================================================
  // Effect Hooks
  // ========================================================================

  /**
   * 监听认证服务的错误状态
   */
  useEffect(() => {
    if (authError && !state.error) {
      setError(authError as AuthError);
    }
  }, [authError, state.error, setError]);

  /**
   * 清理定时器
   */
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // ========================================================================
  // Computed Properties
  // ========================================================================

  const computedProps = useMemo(() => ({
    isRequestStep: state.step === 'request',
    isEmailSentStep: state.step === 'email-sent',
    isTokenValidationStep: state.step === 'token-validation',
    isPasswordUpdateStep: state.step === 'password-update',
    isCompletedStep: state.step === 'completed',
    canProceed: !state.isLoading && !state.error,
    errorMessage: state.error?.message || null,
  }), [state.step, state.isLoading, state.error]);

  // ========================================================================
  // Return Value
  // ========================================================================

  return {
    // State
    state: {
      ...state,
      isLoading: state.isLoading || authLoading,
    },
    
    // Main operations
    requestReset,
    confirmReset,
    verifyToken,
    
    // Flow control
    goToStep,
    restart,
    retry,
    
    // State management
    clearError,
    setEmail,
    setToken,
    
    // Computed properties
    ...computedProps,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * 密码重置请求Hook
 * 
 * 简化的Hook，专门用于密码重置请求步骤。
 */
export function usePasswordResetRequest(options?: Omit<PasswordResetOptions, 'onStepChange'>) {
  const { requestReset, state, isRequestStep, errorMessage, clearError } = usePasswordReset({
    ...options,
    onStepChange: (step) => {
      if (step === 'email-sent' && options?.onSuccess) {
        options.onSuccess({ step, email: state.email });
      }
    },
  });

  return {
    requestReset,
    isLoading: state.isLoading,
    error: errorMessage,
    clearError,
    canRetry: state.canRetry,
    isRequestStep,
  };
}

/**
 * 密码重置确认Hook
 * 
 * 简化的Hook，专门用于密码重置确认步骤。
 */
export function usePasswordResetConfirm(
  token: string,
  options?: Omit<PasswordResetOptions, 'onStepChange'>
) {
  const { confirmReset, verifyToken, state, isPasswordUpdateStep, errorMessage, clearError } = usePasswordReset({
    ...options,
    onStepChange: (step) => {
      if (step === 'completed' && options?.onSuccess) {
        options.onSuccess({ step });
      }
    },
  });

  // 自动验证令牌
  useEffect(() => {
    if (token && state.step === 'request') {
      verifyToken(token);
    }
  }, [token, state.step, verifyToken]);

  return {
    confirmReset,
    isLoading: state.isLoading,
    error: errorMessage,
    clearError,
    isPasswordUpdateStep,
    isTokenValid: state.step === 'password-update',
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default usePasswordReset;