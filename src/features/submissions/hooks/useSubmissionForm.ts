/**
 * Submission Form Management Hook
 * 
 * 实现React Hook Form集成的网站提交表单处理逻辑，封装提交表单业务逻辑。
 * 集成Zod验证、提交处理、错误管理和加载状态管理。
 * 
 * Requirements:
 * - 7: 表单提交和验证 (表单状态管理、验证、提交处理)
 * - 集成React Hook Form v7.62.0
 * - 使用submission-schemas.ts验证规则
 * - 提供完整的表单状态管理
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useForm, UseFormReturn, SubmitHandler } from 'react-hook-form';
import { 
  SubmissionFormData,
  submissionFormSchema,
  submissionFormResolver,
  submissionFormDefaults,
  SUBMISSION_ERROR_MESSAGES,
  sanitizeSubmissionInput,
  validateSubmissionField,
  validateSubmissionForm,
  validateWebsiteUrlInput,
  validateFileUpload,
  VALIDATION_CONSTANTS
} from '../schemas/submission-schemas';
import { 
  showFormSuccessToast, 
  showFormErrorToast, 
  showNetworkErrorToast,
  showLoadingToast,
  updateToast,
  dismissToast
} from '@/lib/utils/toast';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 表单提交结果接口
 */
export interface SubmissionFormSubmitResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 提交的数据ID */
  submissionId?: string;
  /** 需要重定向的URL */
  redirectUrl?: string;
  /** 额外数据 */
  data?: Record<string, any>;
}

/**
 * 表单配置选项
 */
export interface SubmissionFormOptions {
  /** 自动清理表单 */
  autoClear?: boolean;
  /** 提交成功后重定向URL */
  redirectUrl?: string;
  /** 自定义提交处理器 */
  onSubmitSuccess?: (result: SubmissionFormSubmitResult) => void;
  /** 自定义错误处理器 */
  onSubmitError?: (error: string) => void;
  /** 调试模式 */
  debug?: boolean;
  /** 自动保存草稿 */
  autoSaveDraft?: boolean;
  /** 草稿保存间隔（毫秒） */
  draftSaveInterval?: number;
  /** 启用Toast通知 */
  enableToast?: boolean;
  /** Toast消息配置 */
  toastMessages?: {
    success?: string;
    error?: string;
    loading?: string;
  };
}

/**
 * 表单Hook返回值接口
 */
export interface UseSubmissionFormReturn {
  // React Hook Form 实例
  form: UseFormReturn<SubmissionFormData>;
  
  // 表单状态
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  hasErrors: boolean;
  submitError: string | null;
  
  // 表单操作
  handleSubmit: (data: SubmissionFormData) => Promise<void>;
  clearForm: () => void;
  clearError: () => void;
  resetForm: () => void;
  
  // 验证工具
  validateField: (fieldName: keyof SubmissionFormData, value: any) => Promise<boolean>;
  
  // 便捷验证方法
  validateUrl: (url: string) => { isValid: boolean; error?: string };
  validateFile: (file: File) => { isValid: boolean; error?: string };
  
  // 数据处理
  sanitizeData: (data: Partial<SubmissionFormData>) => Partial<SubmissionFormData>;
  
  // 草稿功能 (预留)
  saveDraft?: () => Promise<void>;
  loadDraft?: () => Promise<void>;
  hasDraft?: boolean;
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Submission Form Hook
 * 
 * 通用的网站提交表单管理hook，支持完整的表单生命周期管理。
 * 
 * @param options 表单配置选项
 * @returns 表单管理对象
 * 
 * Usage:
 * ```tsx
 * function SubmissionForm() {
 *   const { 
 *     form, 
 *     isSubmitting, 
 *     handleSubmit, 
 *     submitError 
 *   } = useSubmissionForm({ 
 *     onSubmitSuccess: (result) => {
 *       router.push('/submit/payment');
 *     }
 *   });
 *   
 *   return (
 *     <form onSubmit={form.handleSubmit(handleSubmit)}>
 *       // 表单字段
 *     </form>
 *   );
 * }
 * ```
 */
export function useSubmissionForm(
  options: SubmissionFormOptions = {}
): UseSubmissionFormReturn {
  const {
    autoClear = false, // 默认不清理，保持用户输入
    redirectUrl,
    onSubmitSuccess,
    onSubmitError,
    debug = false,
    autoSaveDraft = false, // 默认关闭自动保存草稿
    draftSaveInterval = 30000, // 30秒
    enableToast = true, // 默认启用Toast通知
    toastMessages = {
      success: '提交成功！正在跳转到下一步...',
      error: '提交失败，请检查表单内容并重试',
      loading: '正在提交表单，请稍候...'
    },
  } = options;

  // ========================================================================
  // React Hook Form 初始化
  // ========================================================================

  const form = useForm<SubmissionFormData>({
    resolver: submissionFormResolver,
    defaultValues: submissionFormDefaults,
    mode: 'onSubmit', // 只在提交时验证，避免过早显示错误
    reValidateMode: 'onBlur', // 提交后在失去焦点时重新验证
    criteriaMode: 'firstError', // 显示第一个错误
  });

  const {
    handleSubmit: hookFormHandleSubmit,
    reset,
    clearErrors,
    formState: { isSubmitting, isValid, isDirty, errors },
    trigger,
    getValues,
    watch,
  } = form;

  // ========================================================================
  // 状态管理
  // ========================================================================

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentToastId, setCurrentToastId] = useState<string | number | null>(null);

  /**
   * 清理提交错误
   */
  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

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
    reset(submissionFormDefaults);
    clearError();
  }, [reset, clearError]);

  // ========================================================================
  // 表单提交处理
  // ========================================================================

  /**
   * 统一的错误处理
   * 
   * 参考useAuthForm错误处理模式，提供一致的错误处理逻辑
   * 增强了Toast通知和用户友好的错误处理
   */
  const handleError = useCallback((error: unknown) => {
    let errorMessage: string;

    // 错误类型判断和消息提取
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = SUBMISSION_ERROR_MESSAGES.SUBMISSION.SUBMIT_FAILED || '提交失败，请重试';
    }

    // 友好化错误消息
    const friendlyMessage = getFriendlyErrorMessage(errorMessage);

    // 设置错误状态
    setSubmitError(friendlyMessage);
    
    // 清除当前的loading toast并显示错误toast
    if (currentToastId) {
      dismissToast(currentToastId);
      setCurrentToastId(null);
    }

    // 显示错误Toast通知
    if (enableToast) {
      if (isNetworkError(error)) {
        showNetworkErrorToast(friendlyMessage, () => {
          // 重试逻辑可以在这里实现
          if (debug) {
            console.log('[useSubmissionForm] Retry requested from toast');
          }
        });
      } else {
        showFormErrorToast(friendlyMessage);
      }
    }
    
    // 调试日志
    if (debug) {
      console.error('[useSubmissionForm] Submit error:', {
        error,
        message: errorMessage,
        friendlyMessage,
        timestamp: new Date().toISOString()
      });
    }

    // 触发自定义错误处理器
    if (onSubmitError) {
      onSubmitError(friendlyMessage);
    }
  }, [debug, onSubmitError, currentToastId, enableToast]);

  /**
   * 处理提交成功
   */
  const handleSuccess = useCallback((result: SubmissionFormSubmitResult) => {
    // 清除当前的loading toast
    if (currentToastId) {
      dismissToast(currentToastId);
      setCurrentToastId(null);
    }

    // 显示成功Toast通知
    if (enableToast) {
      showFormSuccessToast(toastMessages.success);
    }

    if (autoClear) {
      clearForm();
    }

    if (debug) {
      console.log('[useSubmissionForm] Submit success:', result);
    }

    if (onSubmitSuccess) {
      onSubmitSuccess(result);
    }
  }, [autoClear, clearForm, debug, onSubmitSuccess, currentToastId, enableToast, toastMessages.success]);

  /**
   * 提交表单处理器
   */
  const handleSubmitForm = useCallback(async (data: SubmissionFormData) => {
    let toastId: string | number | null = null;
    
    try {
      setIsLoading(true);
      clearError();

      // 显示加载Toast通知
      if (enableToast) {
        toastId = showLoadingToast(toastMessages.loading);
        setCurrentToastId(toastId);
      }

      // 清理和验证输入数据
      const sanitizedData = sanitizeSubmissionInput(data);
      
      // 执行完整验证
      const validationResult = validateSubmissionForm(sanitizedData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors[0] || '表单验证失败');
      }

      // 蜜罐检查（反机器人）
      if (data.honeypot && data.honeypot !== '') {
        throw new Error(SUBMISSION_ERROR_MESSAGES.SUBMISSION.BOT_DETECTED);
      }

      if (debug) {
        console.log('[useSubmissionForm] Submitting data:', sanitizedData);
      }

      // TODO: 实际的提交逻辑将在后续任务中实现
      // 这里是占位实现，模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000)); // 增加延时以展示toast效果
      
      // 模拟成功提交
      const mockSubmissionId = `sub_${Date.now()}`;
      
      // 成功处理
      handleSuccess({
        success: true,
        submissionId: mockSubmissionId,
        redirectUrl: redirectUrl || '/submit/payment',
        data: { 
          ...sanitizedData,
          id: mockSubmissionId,
          status: 'submitted',
          current_step: 'payment'
        },
      });

    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
      // 如果有loading toast但没有被其他地方清理，这里清理
      if (toastId && currentToastId === toastId) {
        setCurrentToastId(null);
      }
    }
  }, [clearError, debug, redirectUrl, handleSuccess, handleError, enableToast, toastMessages.loading, currentToastId]);

  /**
   * 主要的提交处理器
   */
  const handleSubmit = useCallback(async (data: SubmissionFormData) => {
    await handleSubmitForm(data);
  }, [handleSubmitForm]);

  // ========================================================================
  // 验证工具
  // ========================================================================

  /**
   * 验证单个字段
   */
  const validateField = useCallback(async (fieldName: keyof SubmissionFormData, value: any): Promise<boolean> => {
    try {
      await trigger(fieldName);
      return !errors[fieldName];
    } catch {
      return false;
    }
  }, [trigger, errors]);

  /**
   * URL验证便捷方法
   */
  const validateUrl = useCallback((url: string) => {
    return validateWebsiteUrlInput(url);
  }, []);

  /**
   * 文件验证便捷方法
   */
  const validateFile = useCallback((file: File) => {
    return validateFileUpload(file);
  }, []);

  /**
   * 数据清理便捷方法
   */
  const sanitizeData = useCallback((data: Partial<SubmissionFormData>) => {
    return sanitizeSubmissionInput(data);
  }, []);

  // ========================================================================
  // 草稿功能 (预留实现)
  // ========================================================================

  /**
   * 保存草稿 (预留)
   */
  const saveDraft = useCallback(async () => {
    if (debug) {
      console.log('[useSubmissionForm] Save draft not implemented yet');
    }
    // TODO: 实现草稿保存逻辑
  }, [debug]);

  /**
   * 加载草稿 (预留)
   */
  const loadDraft = useCallback(async () => {
    if (debug) {
      console.log('[useSubmissionForm] Load draft not implemented yet');
    }
    // TODO: 实现草稿加载逻辑
  }, [debug]);

  // ========================================================================
  // 副作用处理
  // ========================================================================

  /**
   * 表单重置时清理错误
   */
  useEffect(() => {
    if (!isDirty && submitError) {
      setSubmitError(null);
    }
  }, [isDirty, submitError]);

  /**
   * 自动保存草稿 (预留)
   */
  useEffect(() => {
    let draftTimer: NodeJS.Timeout;

    if (autoSaveDraft && isDirty) {
      draftTimer = setInterval(() => {
        if (isDirty) {
          saveDraft();
        }
      }, draftSaveInterval);
    }

    return () => {
      if (draftTimer) {
        clearInterval(draftTimer);
      }
    };
  }, [autoSaveDraft, isDirty, draftSaveInterval, saveDraft]);

  // ========================================================================
  // 返回值构建
  // ========================================================================

  const returnValue = useMemo((): UseSubmissionFormReturn => {
    return {
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
      validateUrl,
      validateFile,
      sanitizeData,
      // 草稿功能 (预留)
      saveDraft: autoSaveDraft ? saveDraft : undefined,
      loadDraft: autoSaveDraft ? loadDraft : undefined,
      hasDraft: false, // TODO: 实现草稿检测逻辑
    };
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
    validateUrl,
    validateFile,
    sanitizeData,
    autoSaveDraft,
    saveDraft,
    loadDraft,
  ]);

  return returnValue;
}

// ============================================================================
// 便捷Hook导出
// ============================================================================

/**
 * 基础网站提交表单Hook
 */
export function useBasicSubmissionForm(options?: Omit<SubmissionFormOptions, 'autoSaveDraft'>) {
  return useSubmissionForm({ ...options, autoSaveDraft: false });
}

/**
 * 带草稿功能的网站提交表单Hook
 */
export function useSubmissionFormWithDraft(options?: SubmissionFormOptions) {
  return useSubmissionForm({ ...options, autoSaveDraft: true });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 检测是否为网络错误
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    );
  }
  return false;
}

/**
 * 将技术性错误消息转换为用户友好的消息
 */
function getFriendlyErrorMessage(errorMessage: string): string {
  const message = errorMessage.toLowerCase();
  
  // 网络相关错误
  if (message.includes('network') || message.includes('fetch')) {
    return '网络连接出现问题，请检查网络后重试';
  }
  
  if (message.includes('timeout')) {
    return '请求超时，请稍后重试';
  }
  
  // 验证相关错误
  if (message.includes('validation') || message.includes('invalid')) {
    return '表单内容不符合要求，请检查输入内容';
  }
  
  // 文件上传错误
  if (message.includes('file') && (message.includes('size') || message.includes('type'))) {
    return '文件格式或大小不符合要求，请重新选择文件';
  }
  
  // 服务器错误
  if (message.includes('server error') || message.includes('500')) {
    return '服务器暂时无法处理请求，请稍后重试';
  }
  
  // 权限错误
  if (message.includes('unauthorized') || message.includes('403')) {
    return '没有权限执行此操作';
  }
  
  // 限流错误
  if (message.includes('rate limit') || message.includes('too many')) {
    return '请求过于频繁，请稍后重试';
  }
  
  // 如果是已经友好化的消息，直接返回
  if (!message.includes('error:') && !message.includes('exception:')) {
    return errorMessage;
  }
  
  // 默认友好消息
  return '提交失败，请检查网络连接和表单内容后重试';
}

// ============================================================================
// Default Export
// ============================================================================

export default useSubmissionForm;