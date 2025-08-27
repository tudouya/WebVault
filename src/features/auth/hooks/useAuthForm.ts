/**
 * Authentication Form Management Hook
 * 
 * 实现React Hook Form集成的表单处理逻辑，封装登录表单业务逻辑。
 * 集成Zod验证、提交处理、错误管理和加载状态管理。
 * 
 * Requirements:
 * - 1.1: 邮箱认证 (邮箱格式验证、密码验证、表单提交处理)
 * - 集成React Hook Form v7.62.0
 * - 使用auth-schemas.ts验证规则
 * - 提供完整的表单状态管理
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useForm, UseFormReturn, SubmitHandler } from 'react-hook-form';
import { useAuthActions } from './useAuth';
import { 
  LoginFormData,
  PasswordResetData,
  NewPasswordData,
  RegisterFormData,
  loginFormSchema,
  passwordResetSchema,
  newPasswordSchema,
  registerFormSchema,
  loginFormResolver,
  passwordResetResolver,
  newPasswordResolver,
  registerFormResolver,
  loginFormDefaults,
  passwordResetDefaults,
  newPasswordDefaults,
  registerFormDefaults,
  AUTH_ERROR_MESSAGES,
  sanitizeAuthInput,
  isValidLoginEmail,
  checkPasswordSecurity
} from '../schemas/auth-schemas';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 表单类型枚举
 */
export type AuthFormType = 'login' | 'register' | 'password-reset' | 'new-password';

/**
 * 表单提交结果接口
 */
export interface AuthFormSubmitResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 需要重定向的URL */
  redirectUrl?: string;
  /** 额外数据 */
  data?: Record<string, any>;
}

/**
 * 表单配置选项
 */
export interface AuthFormOptions {
  /** 表单类型 */
  type: AuthFormType;
  /** 自动清理表单 */
  autoClear?: boolean;
  /** 提交成功后重定向URL */
  redirectUrl?: string;
  /** 自定义提交处理器 */
  onSubmitSuccess?: (result: AuthFormSubmitResult) => void;
  /** 自定义错误处理器 */
  onSubmitError?: (error: string) => void;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 通用表单数据类型
 */
type AuthFormDataType<T extends AuthFormType> = 
  T extends 'login' ? LoginFormData :
  T extends 'register' ? RegisterFormData :
  T extends 'password-reset' ? PasswordResetData :
  T extends 'new-password' ? NewPasswordData :
  never;

/**
 * 表单Hook返回值接口
 */
export interface UseAuthFormReturn<T extends AuthFormType> {
  // React Hook Form 实例
  form: UseFormReturn<AuthFormDataType<T>>;
  
  // 表单状态
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  hasErrors: boolean;
  submitError: string | null;
  
  // 表单操作
  handleSubmit: (data: AuthFormDataType<T>) => Promise<void>;
  clearForm: () => void;
  clearError: () => void;
  resetForm: () => void;
  
  // 验证工具
  validateField: (fieldName: keyof AuthFormDataType<T>, value: any) => Promise<boolean>;
  
  // 便捷方法 (仅登录表单)
  validateEmail?: (email: string) => boolean;
  checkPassword?: (password: string) => { isValid: boolean; issues: string[] };
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Authentication Form Hook
 * 
 * 通用的认证表单管理hook，支持多种表单类型。
 * 
 * @param options 表单配置选项
 * @returns 表单管理对象
 * 
 * Usage:
 * ```tsx
 * function LoginForm() {
 *   const { 
 *     form, 
 *     isSubmitting, 
 *     handleSubmit, 
 *     submitError 
 *   } = useAuthForm({ type: 'login' });
 *   
 *   return (
 *     <form onSubmit={form.handleSubmit(handleSubmit)}>
 *       // 表单字段
 *     </form>
 *   );
 * }
 * ```
 */
export function useAuthForm<T extends AuthFormType>(
  options: AuthFormOptions
): UseAuthFormReturn<T> {
  const {
    type,
    autoClear = true,
    redirectUrl,
    onSubmitSuccess,
    onSubmitError,
    debug = false,
  } = options;

  // ========================================================================
  // 认证操作集成
  // ========================================================================

  const {
    login,
    register,
    resetPassword,
    confirmPasswordReset,
    isLoading,
    error: authError,
    clearError: clearAuthError,
  } = useAuthActions();

  // ========================================================================
  // 表单配置
  // ========================================================================

  /**
   * 获取表单配置
   * 根据表单类型返回相应的resolver和默认值
   */
  const formConfig = useMemo(() => {
    switch (type) {
      case 'login':
        return {
          resolver: loginFormResolver,
          defaultValues: loginFormDefaults as any,
        };
      case 'register':
        return {
          resolver: registerFormResolver,
          defaultValues: registerFormDefaults as any,
        };
      case 'password-reset':
        return {
          resolver: passwordResetResolver,
          defaultValues: passwordResetDefaults as any,
        };
      case 'new-password':
        return {
          resolver: newPasswordResolver,
          defaultValues: newPasswordDefaults as any,
        };
      default:
        throw new Error(`不支持的表单类型: ${type}`);
    }
  }, [type]);

  // ========================================================================
  // React Hook Form 初始化
  // ========================================================================

  const form = useForm({
    resolver: formConfig.resolver as any,
    defaultValues: formConfig.defaultValues,
    mode: 'onSubmit', // 只在提交时验证，避免过早显示错误
    reValidateMode: 'onBlur', // 提交后在失去焦点时重新验证
    criteriaMode: 'firstError', // 显示第一个错误
  }) as UseFormReturn<AuthFormDataType<T>>;

  const {
    handleSubmit: hookFormHandleSubmit,
    reset,
    clearErrors,
    formState: { isSubmitting, isValid, isDirty, errors },
    trigger,
    getValues,
  } = form;

  // ========================================================================
  // 状态管理
  // ========================================================================

  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * 清理提交错误
   */
  const clearError = useCallback(() => {
    setSubmitError(null);
    clearAuthError();
  }, [clearAuthError]);

  /**
   * 清理表单
   */
  const clearForm = useCallback(() => {
    reset();
    clearError();
  }, [reset, clearError]);

  /**
   * 重置表单到初始状态
   */
  const resetForm = useCallback(() => {
    reset(formConfig.defaultValues);
    clearError();
  }, [reset, formConfig.defaultValues, clearError]);

  // ========================================================================
  // 表单提交处理
  // ========================================================================

  /**
   * 统一的错误处理
   */
  const handleError = useCallback((error: unknown) => {
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = '提交失败，请重试';
    }

    setSubmitError(errorMessage);
    
    if (debug) {
      console.error(`[useAuthForm:${type}] Submit error:`, error);
    }

    if (onSubmitError) {
      onSubmitError(errorMessage);
    }
  }, [type, debug, onSubmitError]);

  /**
   * 处理提交成功
   */
  const handleSuccess = useCallback((result: AuthFormSubmitResult) => {
    if (autoClear) {
      clearForm();
    }

    if (debug) {
      console.log(`[useAuthForm:${type}] Submit success:`, result);
    }

    if (onSubmitSuccess) {
      onSubmitSuccess(result);
    }
  }, [autoClear, clearForm, type, debug, onSubmitSuccess]);

  /**
   * 登录表单提交处理
   */
  const handleLoginSubmit = useCallback(async (data: LoginFormData) => {
    try {
      // 清理输入数据
      const sanitizedEmail = sanitizeAuthInput(data.email);
      const sanitizedPassword = sanitizeAuthInput(data.password);

      // 额外验证
      if (!isValidLoginEmail(sanitizedEmail)) {
        throw new Error(AUTH_ERROR_MESSAGES.LOGIN.EMAIL_INVALID);
      }

      // 调用登录操作
      await login(sanitizedEmail, sanitizedPassword, data.rememberMe);

      // 成功处理
      handleSuccess({
        success: true,
        redirectUrl: redirectUrl || '/admin/dashboard',
        data: { email: sanitizedEmail, rememberMe: data.rememberMe },
      });

    } catch (error) {
      handleError(error);
    }
  }, [login, redirectUrl, handleSuccess, handleError]);

  /**
   * 注册表单提交处理
   */
  const handleRegisterSubmit = useCallback(async (data: RegisterFormData) => {
    try {
      // 清理输入数据
      const sanitizedUsername = sanitizeAuthInput(data.username);
      const sanitizedEmail = sanitizeAuthInput(data.email);
      const sanitizedPassword = sanitizeAuthInput(data.password);

      // 密码安全检查
      const passwordCheck = checkPasswordSecurity(sanitizedPassword);
      if (!passwordCheck.isValid) {
        throw new Error(`密码安全检查失败: ${passwordCheck.issues.join(', ')}`);
      }

      // 调用注册操作 (当前为占位实现)
      // await register(sanitizedEmail, sanitizedPassword, {
      //   username: sanitizedUsername,
      //   agreeToTerms: data.agreeToTerms,
      // });
      throw new Error('注册功能正在开发中');

      // 成功处理
      handleSuccess({
        success: true,
        redirectUrl: redirectUrl || '/welcome',
        data: { email: sanitizedEmail, username: sanitizedUsername },
      });

    } catch (error) {
      handleError(error);
    }
  }, [register, redirectUrl, handleSuccess, handleError]);

  /**
   * 密码重置表单提交处理
   */
  const handlePasswordResetSubmit = useCallback(async (data: PasswordResetData) => {
    try {
      // 清理输入数据
      const sanitizedEmail = sanitizeAuthInput(data.email);

      // 调用密码重置操作
      await resetPassword(sanitizedEmail);

      // 成功处理
      handleSuccess({
        success: true,
        data: { email: sanitizedEmail },
      });

    } catch (error) {
      handleError(error);
    }
  }, [resetPassword, handleSuccess, handleError]);

  /**
   * 新密码设置表单提交处理
   */
  const handleNewPasswordSubmit = useCallback(async (data: NewPasswordData) => {
    try {
      // 清理输入数据
      const sanitizedPassword = sanitizeAuthInput(data.password);
      const sanitizedToken = sanitizeAuthInput(data.token);

      // 验证令牌
      if (!sanitizedToken) {
        throw new Error('重置令牌无效或缺失');
      }

      // 密码安全检查
      const passwordCheck = checkPasswordSecurity(sanitizedPassword);
      if (!passwordCheck.isValid) {
        throw new Error(`密码安全检查失败: ${passwordCheck.issues.join(', ')}`);
      }

      // 调用密码确认重置操作
      await confirmPasswordReset(sanitizedToken, sanitizedPassword);

      // 成功处理
      handleSuccess({
        success: true,
        redirectUrl: redirectUrl || '/login',
        data: { token: sanitizedToken },
      });

    } catch (error) {
      handleError(error);
    }
  }, [confirmPasswordReset, redirectUrl, handleSuccess, handleError]);

  /**
   * 主要的提交处理器
   */
  const handleSubmit = useCallback(async (data: AuthFormDataType<T>) => {
    clearError();

    try {
      switch (type) {
        case 'login':
          await handleLoginSubmit(data as LoginFormData);
          break;
        case 'register':
          await handleRegisterSubmit(data as RegisterFormData);
          break;
        case 'password-reset':
          await handlePasswordResetSubmit(data as PasswordResetData);
          break;
        case 'new-password':
          await handleNewPasswordSubmit(data as NewPasswordData);
          break;
        default:
          throw new Error(`不支持的表单类型: ${type}`);
      }
    } catch (error) {
      // 错误已经在具体的处理函数中处理
      if (debug) {
        console.error(`[useAuthForm:${type}] Unhandled submit error:`, error);
      }
    }
  }, [
    type,
    clearError,
    handleLoginSubmit,
    handleRegisterSubmit,
    handlePasswordResetSubmit,
    handleNewPasswordSubmit,
    debug,
  ]);

  // ========================================================================
  // 验证工具
  // ========================================================================

  /**
   * 验证单个字段
   */
  const validateField = useCallback(async (fieldName: keyof AuthFormDataType<T>, value: any): Promise<boolean> => {
    try {
      await trigger(fieldName as any);
      return !errors[fieldName as keyof typeof errors];
    } catch {
      return false;
    }
  }, [trigger, errors]);

  // ========================================================================
  // 副作用处理
  // ========================================================================

  /**
   * 监听认证错误状态变化
   */
  useEffect(() => {
    if (authError && !submitError) {
      setSubmitError(typeof authError === 'string' ? authError : authError.message || '认证失败');
    }
  }, [authError, submitError]);

  /**
   * 表单重置时清理错误
   */
  useEffect(() => {
    if (!isDirty && submitError) {
      setSubmitError(null);
    }
  }, [isDirty, submitError]);

  // ========================================================================
  // 返回值构建
  // ========================================================================

  const returnValue = useMemo((): UseAuthFormReturn<T> => {
    const baseReturn = {
      form,
      isSubmitting: isSubmitting || isLoading,
      isValid,
      isDirty,
      hasErrors: Object.keys(errors).length > 0 || !!submitError,
      submitError,
      handleSubmit,
      clearForm,
      clearError,
      resetForm,
      validateField,
    };

    // 为登录表单添加便捷方法
    if (type === 'login') {
      return {
        ...baseReturn,
        validateEmail: isValidLoginEmail,
        checkPassword: checkPasswordSecurity,
      };
    }

    return baseReturn;
  }, [
    form,
    isSubmitting,
    isLoading,
    isValid,
    isDirty,
    errors,
    submitError,
    handleSubmit,
    clearForm,
    clearError,
    resetForm,
    validateField,
    type,
  ]);

  return returnValue;
}

// ============================================================================
// 便捷Hook导出
// ============================================================================

/**
 * 登录表单Hook
 */
export function useLoginForm(options?: Omit<AuthFormOptions, 'type'>) {
  return useAuthForm<'login'>({ ...options, type: 'login' });
}

/**
 * 注册表单Hook
 */
export function useRegisterForm(options?: Omit<AuthFormOptions, 'type'>) {
  return useAuthForm<'register'>({ ...options, type: 'register' });
}

/**
 * 密码重置表单Hook
 */
export function usePasswordResetForm(options?: Omit<AuthFormOptions, 'type'>) {
  return useAuthForm<'password-reset'>({ ...options, type: 'password-reset' });
}

/**
 * 新密码设置表单Hook
 */
export function useNewPasswordForm(options?: Omit<AuthFormOptions, 'type'>) {
  return useAuthForm<'new-password'>({ ...options, type: 'new-password' });
}

// ============================================================================
// Default Export
// ============================================================================

export default useAuthForm;