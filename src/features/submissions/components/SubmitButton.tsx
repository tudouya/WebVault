/**
 * Submit Button Component
 * 
 * 实现表单提交按钮，支持加载状态、禁用状态和紫色样式。
 * 与useSubmissionForm hook集成，提供完整的表单提交体验。
 * 
 * Requirements:
 * - 7: 表单提交和验证 (提交按钮控制、状态显示、用户反馈)
 * - 支持提交状态显示："Submit" -> "Submitting..."
 * - 支持禁用状态：表单验证失败或提交中时禁用
 * - 紫色样式设计，符合表单设计要求
 * - 位于表单左下角，包含免责声明
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * SubmitButton组件属性接口
 */
export interface SubmitButtonProps {
  /** 是否正在提交 */
  isSubmitting?: boolean;
  
  /** 是否禁用按钮 */
  disabled?: boolean;
  
  /** 表单是否有效 */
  isFormValid?: boolean;
  
  /** 点击事件处理器 */
  onClick?: () => void;
  
  /** 自定义类名 */
  className?: string;
  
  /** 提交中显示的文本 */
  submittingText?: string;
  
  /** 正常状态显示的文本 */
  submitText?: string;
  
  /** 是否显示免责声明 */
  showDisclaimer?: boolean;
  
  /** 自定义免责声明文本 */
  disclaimerText?: string;
  
  /** 按钮类型 */
  type?: 'button' | 'submit';
  
  /** 测试ID */
  'data-testid'?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * SubmitButton Component
 * 
 * 网站提交表单的提交按钮组件，提供完整的用户体验：
 * - 清晰的状态反馈（正常/提交中/禁用）
 * - 紫色主题样式设计
 * - 免责声明显示
 * - 无障碍访问支持
 * 
 * @param props 组件属性
 * @returns SubmitButton组件
 * 
 * Usage:
 * ```tsx
 * // 基础使用
 * <SubmitButton 
 *   isSubmitting={isSubmitting}
 *   disabled={!isFormValid}
 *   onClick={handleSubmit}
 * />
 * 
 * // 与useSubmissionForm集成
 * function SubmissionForm() {
 *   const { form, isSubmitting, isValid, hasErrors } = useSubmissionForm();
 *   
 *   return (
 *     <form onSubmit={form.handleSubmit(handleSubmit)}>
 *       // 表单字段
 *       <SubmitButton
 *         isSubmitting={isSubmitting}
 *         isFormValid={isValid && !hasErrors}
 *         type="submit"
 *       />
 *     </form>
 *   );
 * }
 * ```
 */
export function SubmitButton({
  isSubmitting = false,
  disabled = false,
  isFormValid = true,
  onClick,
  className,
  submittingText = "Submitting...",
  submitText = "Submit",
  showDisclaimer = true,
  disclaimerText = "No worries, you can change these information later",
  type = 'button',
  'data-testid': testId = 'submit-button',
  ...props
}: SubmitButtonProps) {
  
  // ========================================================================
  // 状态计算
  // ========================================================================
  
  // 计算是否应该禁用按钮
  const isButtonDisabled = disabled || isSubmitting || !isFormValid;
  
  // 计算显示的文本
  const displayText = isSubmitting ? submittingText : submitText;
  
  // ========================================================================
  // 事件处理
  // ========================================================================
  
  /**
   * 处理按钮点击事件
   */
  const handleClick = () => {
    // 如果按钮被禁用，不执行任何操作
    if (isButtonDisabled) {
      return;
    }
    
    // 触发点击事件处理器
    if (onClick) {
      onClick();
    }
  };
  
  // ========================================================================
  // 样式计算
  // ========================================================================
  
  // 紫色主题按钮样式
  const buttonStyles = cn(
    // 基础按钮样式
    "relative inline-flex items-center justify-center",
    "px-6 py-3 min-w-[120px] min-h-[44px]",
    "rounded-md text-sm font-medium",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    
    // 紫色主题样式 - 使用主题变量 #8B5CF6
    "bg-primary text-primary-foreground",
    "hover:bg-primary/90",
    "focus-visible:ring-primary",
    "active:bg-primary/80",
    
    // 禁用状态样式
    "disabled:bg-primary/50",
    "disabled:text-primary-foreground/50",
    "disabled:cursor-not-allowed",
    "disabled:hover:bg-primary/50",
    
    // 提交状态样式
    isSubmitting && [
      "bg-primary/90",
      "cursor-wait",
    ],
    
    // 自定义样式
    className
  );
  
  // 容器样式
  const containerStyles = cn(
    "flex flex-col items-start space-y-3",
    "mt-6" // 与表单内容的间距
  );
  
  // 免责声明样式
  const disclaimerStyles = cn(
    "text-sm text-muted-foreground",
    "mt-2"
  );
  
  // ========================================================================
  // 渲染
  // ========================================================================
  
  return (
    <div className={containerStyles}>
      {/* 提交按钮 */}
      <Button
        type={type}
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={buttonStyles}
        data-testid={testId}
        aria-label={`${displayText}表单`}
        aria-disabled={isButtonDisabled}
        {...props}
      >
        {/* 加载状态指示器 */}
        {isSubmitting && (
          <svg
            className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* 按钮文本 */}
        <span>{displayText}</span>
      </Button>
      
      {/* 免责声明 */}
      {showDisclaimer && (
        <p className={disclaimerStyles} data-testid="submit-disclaimer">
          {disclaimerText}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// 便捷组件导出
// ============================================================================

/**
 * 基础提交按钮 - 仅包含核心功能
 */
export function BasicSubmitButton(props: Omit<SubmitButtonProps, 'showDisclaimer'>) {
  return (
    <SubmitButton
      {...props}
      showDisclaimer={false}
    />
  );
}

/**
 * 表单提交按钮 - 包含完整功能和免责声明
 */
export function FormSubmitButton(props: SubmitButtonProps) {
  return (
    <SubmitButton
      {...props}
      showDisclaimer={true}
      type="submit"
    />
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default SubmitButton;