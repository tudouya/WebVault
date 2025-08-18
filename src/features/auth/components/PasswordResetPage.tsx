/**
 * PasswordResetPage Component
 * 
 * 实现密码重置请求页面，处理邮箱输入和重置邮件发送。
 * 基于Requirements 3.1和3.2，提供完整的密码重置流程启动功能。
 * 
 * Requirements:
 * - 3.1: 密码重置请求 - 5分钟内发送重置邮件，隐私保护
 * - 3.2: 密码重置流程完整性 - 清晰表单、实时验证、友好错误处理
 * 
 * Key Features:
 * - 邮箱输入表单和验证
 * - 密码重置请求提交逻辑
 * - 加载状态和错误处理
 * - 成功状态和用户反馈
 * - 返回登录页面的导航
 * - 使用AuthLayout保持一致的布局
 * - 集成现有的认证样式和主题
 * - 支持响应式设计
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

'use client';

import React, { useCallback, useState } from 'react';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

// UI组件导入
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// 认证组件和hooks导入
import { AuthLayout } from './AuthLayout';
import { usePasswordResetForm } from '../hooks/useAuthForm';
import type { PasswordResetData } from '../schemas/auth-schemas';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * PasswordResetPage组件属性接口
 */
export interface PasswordResetPageProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 密码重置成功回调
   */
  onSuccess?: (result: { success: boolean; email: string }) => void;
  
  /**
   * 密码重置失败回调
   */
  onError?: (error: string) => void;
  
  /**
   * 返回登录页面回调
   */
  onBackToLogin?: () => void;
  
  /**
   * 完成后的返回URL
   */
  returnUrl?: string;
  
  /**
   * 是否自动聚焦邮箱输入框
   * @default true
   */
  autoFocus?: boolean;
  
  /**
   * 调试模式
   */
  debug?: boolean;
}

/**
 * 重置状态枚举
 */
type ResetState = 'idle' | 'submitting' | 'success' | 'error';

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * PasswordResetPage - 密码重置请求页面组件
 * 
 * 提供完整的密码重置请求功能，集成表单验证、错误处理和用户反馈
 */
export function PasswordResetPage({
  className,
  onSuccess,
  onError,
  onBackToLogin,
  returnUrl,
  autoFocus = true,
  debug = false,
}: PasswordResetPageProps) {
  
  // ========================================================================
  // Form State Management
  // ========================================================================
  
  const {
    form,
    isSubmitting,
    isValid,
    hasErrors,
    submitError,
    handleSubmit,
    clearError,
    validateEmail,
  } = usePasswordResetForm({
    onSubmitSuccess: (result) => {
      setResetState('success');
      setSuccessEmail(form.getValues('email'));
      if (onSuccess) {
        onSuccess({
          success: result.success,
          email: result.data?.email || form.getValues('email'),
        });
      }
    },
    onSubmitError: (error) => {
      setResetState('error');
      if (onError) {
        onError(error);
      }
    },
    debug,
  });

  // ========================================================================
  // Local State for UI Enhancement
  // ========================================================================
  
  const [resetState, setResetState] = useState<ResetState>('idle');
  const [successEmail, setSuccessEmail] = useState<string>('');
  const [emailValidationStatus, setEmailValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * 邮箱字段实时验证
   */
  const handleEmailBlur = useCallback((email: string) => {
    if (!email.trim()) {
      setEmailValidationStatus('idle');
      return;
    }
    
    if (validateEmail && validateEmail(email)) {
      setEmailValidationStatus('valid');
    } else {
      setEmailValidationStatus('invalid');
    }
  }, [validateEmail]);

  /**
   * 清理错误状态
   */
  const handleClearError = useCallback(() => {
    clearError();
    setResetState('idle');
    setEmailValidationStatus('idle');
  }, [clearError]);

  /**
   * 返回登录页面
   */
  const handleBackToLogin = useCallback(() => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      // 默认行为：刷新页面或导航到登录页
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    }
  }, [onBackToLogin]);

  /**
   * 重新尝试重置
   */
  const handleRetryReset = useCallback(() => {
    setResetState('idle');
    setSuccessEmail('');
    clearError();
    form.reset();
  }, [clearError, form]);

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * 渲染邮箱输入框图标
   */
  const renderEmailIcon = () => {
    switch (emailValidationStatus) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  /**
   * 渲染成功状态内容
   */
  const renderSuccessContent = () => (
    <div className="space-y-6 text-center">
      {/* 成功图标 */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          "bg-emerald-100 dark:bg-emerald-900/20"
        )}>
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* 标题和描述 */}
      <div className="space-y-2">
        <h1 className={cn(
          "text-2xl font-bold tracking-tight text-foreground",
          "sm:text-3xl"
        )}>
          重置邮件已发送
        </h1>
        <p className="text-sm text-muted-foreground">
          我们已向 <span className="font-medium text-foreground">{successEmail}</span> 发送了密码重置邮件
        </p>
      </div>

      {/* 说明信息 */}
      <div className={cn(
        "rounded-lg border border-border/50 bg-muted/50 p-4",
        "text-left space-y-3"
      )}>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">接下来该怎么做：</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              检查您的邮箱收件箱（包括垃圾邮件文件夹）
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              点击邮件中的重置链接
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              按照页面提示设置新密码
            </li>
          </ul>
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            重置链接将在 <span className="font-medium">1小时</span> 后过期。如果您没有收到邮件，请检查邮箱地址是否正确。
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={handleBackToLogin}
          variant="default"
          size="lg"
          className="h-11"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回登录
        </Button>
        
        <Button
          onClick={handleRetryReset}
          variant="outline"
          size="lg"
          className="h-11"
        >
          重新发送邮件
        </Button>
      </div>
    </div>
  );

  /**
   * 渲染重置表单内容
   */
  const renderFormContent = () => (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className={cn(
          "text-2xl font-bold tracking-tight text-foreground",
          "sm:text-3xl"
        )}>
          重置密码
        </h1>
        <p className="text-sm text-muted-foreground">
          输入您的邮箱地址，我们将发送密码重置链接给您
        </p>
      </div>

      {/* 错误提示区域 */}
      {submitError && resetState === 'error' && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-lg",
          "bg-destructive/10 border border-destructive/20",
          "text-destructive"
        )}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-medium">{submitError}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearError}
            className="ml-auto text-destructive hover:text-destructive/80"
          >
            ×
          </Button>
        </div>
      )}

      {/* 重置表单 */}
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* 邮箱输入字段 */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-card-foreground">
                  邮箱地址
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      autoFocus={autoFocus}
                      disabled={isSubmitting}
                      onBlur={(e) => {
                        field.onBlur();
                        handleEmailBlur(e.target.value);
                      }}
                      onChange={(e) => {
                        field.onChange(e);
                        if (submitError) clearError();
                        setEmailValidationStatus('idle');
                      }}
                      className={cn(
                        // 基础样式 - 44px高度，匹配设计图
                        "h-11 pl-10 pr-4 bg-muted border-input",
                        "placeholder:text-placeholder",
                        "focus:ring-2 focus:ring-ring focus:border-ring",
                        // 验证状态样式
                        emailValidationStatus === 'valid' && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20",
                        emailValidationStatus === 'invalid' && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        // 禁用状态
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    />
                    {/* 邮箱图标 */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {renderEmailIcon()}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 蜜罐字段 - 反机器人 */}
          <FormField
            control={form.control}
            name="honeypot"
            render={({ field }) => (
              <input
                {...field}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="sr-only"
                aria-hidden="true"
              />
            )}
          />

          {/* 发送重置邮件按钮 */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !isValid}
            className={cn(
              // 基础样式 - 44px高度，匹配设计图
              "w-full h-11 text-sm font-medium",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-all duration-200",
              "shadow-lg shadow-primary/25",
              // 禁用状态
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
              // 加载状态
              isSubmitting && "cursor-wait"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                发送中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                发送重置邮件
              </div>
            )}
          </Button>
        </form>
      </Form>

      {/* 返回登录链接 */}
      <div className="flex items-center justify-center">
        <Button
          type="button"
          variant="link"
          size="sm"
          disabled={isSubmitting}
          onClick={handleBackToLogin}
          className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-3 w-3" />
          返回登录页面
        </Button>
      </div>

      {/* 提示信息 */}
      <div className={cn(
        "text-center text-xs text-muted-foreground",
        "border-t border-border/50 pt-4"
      )}>
        <p>
          如果该邮箱地址已注册，您将在 5 分钟内收到重置邮件。
          出于安全考虑，我们不会透露邮箱是否存在。
        </p>
      </div>
    </div>
  );

  // ========================================================================
  // Component Render
  // ========================================================================

  return (
    <AuthLayout
      className={className}
      title="密码重置"
      description="安全便捷的密码重置服务，快速恢复账户访问权限。"
      isLoading={isSubmitting}
    >
      {resetState === 'success' ? renderSuccessContent() : renderFormContent()}
    </AuthLayout>
  );
}

/**
 * PasswordResetPage组件默认导出
 */
export default PasswordResetPage;