/**
 * Toast Utility Functions
 * 
 * Provides convenient helper functions for displaying toast notifications
 * throughout the application. Wraps Sonner's toast functions with consistent
 * styling and behavior patterns.
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import { toast as sonnerToast } from 'sonner';

// ============================================================================
// Toast Configuration
// ============================================================================

/**
 * Default toast configuration
 */
const DEFAULT_TOAST_OPTIONS = {
  duration: 4000, // 4 seconds
  position: 'top-right' as const,
};

const SUCCESS_OPTIONS = {
  ...DEFAULT_TOAST_OPTIONS,
  duration: 3000,
};

const ERROR_OPTIONS = {
  ...DEFAULT_TOAST_OPTIONS,
  duration: 6000, // Longer duration for errors
};

const WARNING_OPTIONS = {
  ...DEFAULT_TOAST_OPTIONS,
  duration: 5000,
};

// ============================================================================
// Core Toast Functions
// ============================================================================

/**
 * Display success toast
 * @param message Success message to display
 * @param options Optional configuration
 */
export function showSuccessToast(message: string, options?: { duration?: number; action?: any }) {
  return sonnerToast.success(message, {
    ...SUCCESS_OPTIONS,
    ...options,
  });
}

/**
 * Display error toast
 * @param message Error message to display
 * @param options Optional configuration
 */
export function showErrorToast(message: string, options?: { duration?: number; action?: any }) {
  return sonnerToast.error(message, {
    ...ERROR_OPTIONS,
    ...options,
  });
}

/**
 * Display warning toast
 * @param message Warning message to display
 * @param options Optional configuration
 */
export function showWarningToast(message: string, options?: { duration?: number; action?: any }) {
  return sonnerToast.warning(message, {
    ...WARNING_OPTIONS,
    ...options,
  });
}

/**
 * Display info toast
 * @param message Info message to display
 * @param options Optional configuration
 */
export function showInfoToast(message: string, options?: { duration?: number; action?: any }) {
  return sonnerToast.info(message, {
    ...DEFAULT_TOAST_OPTIONS,
    ...options,
  });
}

/**
 * Display loading toast
 * @param message Loading message to display
 * @returns Toast ID for later updates
 */
export function showLoadingToast(message: string) {
  return sonnerToast.loading(message, {
    duration: Infinity, // Loading toasts don't auto-dismiss
  });
}

/**
 * Display promise toast (loading -> success/error)
 * @param promise Promise to track
 * @param messages Messages for different states
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  return sonnerToast.promise(promise, messages);
}

// ============================================================================
// Specialized Toast Functions for Application
// ============================================================================

/**
 * Form submission success toast
 */
export function showFormSuccessToast(message = '提交成功！') {
  return showSuccessToast(message, {
    duration: 3000,
  });
}

/**
 * Form validation error toast
 */
export function showFormErrorToast(message = '表单提交失败，请检查输入并重试') {
  return showErrorToast(message, {
    duration: 5000,
  });
}

/**
 * Network error toast with retry action
 */
export function showNetworkErrorToast(
  message = '网络请求失败',
  retryFn?: () => void
) {
  const action = retryFn ? {
    label: '重试',
    onClick: retryFn,
  } : undefined;

  return showErrorToast(message, {
    duration: 8000,
    action,
  });
}

/**
 * Copy to clipboard success toast
 */
export function showCopySuccessToast(message = '已复制到剪贴板') {
  return showSuccessToast(message, {
    duration: 2000,
  });
}

/**
 * Auto-save success toast (less intrusive)
 */
export function showAutoSaveToast(message = '草稿已保存') {
  return showInfoToast(message, {
    duration: 2000,
  });
}

/**
 * Update an existing toast
 */
export function updateToast(
  toastId: string | number,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) {
  const toastFn = {
    success: sonnerToast.success,
    error: sonnerToast.error,
    warning: sonnerToast.warning,
    info: sonnerToast.info,
  }[type];

  return toastFn(message, { id: toastId });
}

/**
 * Dismiss toast by ID
 */
export function dismissToast(toastId?: string | number) {
  return sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  return sonnerToast.dismiss();
}

// ============================================================================
// Re-export sonner toast for advanced usage
// ============================================================================

export { sonnerToast as toast };

// ============================================================================
// Default Export (most commonly used functions)
// ============================================================================

export default {
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
  info: showInfoToast,
  loading: showLoadingToast,
  promise: showPromiseToast,
  
  // Specialized functions
  formSuccess: showFormSuccessToast,
  formError: showFormErrorToast,
  networkError: showNetworkErrorToast,
  copySuccess: showCopySuccessToast,
  autoSave: showAutoSaveToast,
  
  // Control functions
  update: updateToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
};