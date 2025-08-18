/**
 * PasswordConfirmPage Component
 * 
 * 实现密码重置确认页面，处理新密码设置和重置令牌验证。
 * 基于Requirements 3.3，提供完整的密码重置工作流程的最后步骤。
 * 
 * Requirements:
 * - 3.3: 密码重置确认 - 验证重置令牌，设置新密码，双重确认，密码强度验证
 * 
 * Key Features:
 * - 重置令牌验证和错误处理
 * - 新密码和确认密码输入表单
 * - 密码强度实时验证和反馈
 * - 密码重置提交和成功处理
 * - 错误状态和用户友好的错误消息
 * - 成功后重定向到登录页面
 * - 使用AuthLayout保持一致的布局
 * - 集成现有的认证样式和主题
 * - 支持响应式设计和加载状态
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

'use client';

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Save } from 'lucide-react';
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
import { useNewPasswordForm } from '../hooks/useAuthForm';
import { useAuthActions } from '../hooks/useAuth';
import type { NewPasswordData } from '../schemas/auth-schemas';
import { checkPasswordSecurity } from '../schemas/auth-schemas';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * PasswordConfirmPage组件属性接口
 */
export interface PasswordConfirmPageProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 重置令牌
   * 从邮件链接中获取的验证令牌
   */
  resetToken: string;
  
  /**
   * 用户邮箱（可选）
   * 用于显示确认信息
   */
  email?: string;
  
  /**
   * 密码重置成功回调
   */
  onPasswordReset?: (result: { success: boolean; email?: string }) => void;
  
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
   * 是否自动聚焦密码输入框
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
type ResetState = 'idle' | 'submitting' | 'success' | 'error' | 'invalid-token';

/**
 * 密码验证状态
 */
type PasswordValidationState = {
  isValid: boolean;
  issues: string[];
  strength: 'weak' | 'medium' | 'strong';
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * PasswordConfirmPage - 密码重置确认页面组件
 * 
 * 提供完整的密码重置确认功能，集成表单验证、密码强度检测和错误处理
 */
export function PasswordConfirmPage({
  className,
  resetToken,
  email,
  onPasswordReset,
  onError,
  onBackToLogin,
  returnUrl,
  autoFocus = true,
  debug = false,
}: PasswordConfirmPageProps) {
  
  // ========================================================================
  // 认证服务集成
  // ========================================================================
  
  const { confirmPasswordReset } = useAuthActions();
  
  // ========================================================================
  // Form State Management
  // ========================================================================
  
  const {
    form,
    isSubmitting,
    isValid,
    hasErrors,
    submitError,
    handleSubmit: formHandleSubmit,
    clearError,
  } = useNewPasswordForm({
    onSubmitSuccess: (result) => {
      setResetState('success');
      if (onPasswordReset) {
        onPasswordReset({
          success: result.success,
          email: email,
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationState>({
    isValid: false,
    issues: [],
    strength: 'weak',
  });
  const [confirmPasswordMatch, setConfirmPasswordMatch] = useState<boolean>(false);

  // ========================================================================
  // 表单初始化
  // ========================================================================
  
  useEffect(() => {
    // 设置重置令牌到表单
    if (resetToken) {
      form.setValue('token', resetToken);
    }
  }, [resetToken, form]);

  // ========================================================================
  // 密码强度验证
  // ========================================================================
  
  /**
   * 计算密码强度
   */
  const calculatePasswordStrength = useCallback((password: string): PasswordValidationState => {
    if (!password) {
      return {
        isValid: false,
        issues: ['请输入密码'],
        strength: 'weak',
      };
    }

    const securityCheck = checkPasswordSecurity(password);
    
    // 计算强度分数
    let strengthScore = 0;
    if (password.length >= 8) strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
    if (/[a-z]/.test(password)) strengthScore += 1;
    if (/[A-Z]/.test(password)) strengthScore += 1;
    if (/\d/.test(password)) strengthScore += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore += 1;

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (strengthScore >= 5) strength = 'strong';
    else if (strengthScore >= 3) strength = 'medium';

    return {
      isValid: securityCheck.isValid,
      issues: securityCheck.issues,
      strength,
    };
  }, []);

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * 密码字段实时验证
   */
  const handlePasswordChange = useCallback((password: string) => {
    const validation = calculatePasswordStrength(password);
    setPasswordValidation(validation);
    
    // 检查密码确认匹配
    const confirmPassword = form.getValues('confirmPassword');
    if (confirmPassword) {
      setConfirmPasswordMatch(password === confirmPassword);
    }
  }, [calculatePasswordStrength, form]);

  /**
   * 确认密码字段实时验证
   */
  const handleConfirmPasswordChange = useCallback((confirmPassword: string) => {
    const password = form.getValues('password');
    setConfirmPasswordMatch(password === confirmPassword && !!password);
  }, [form]);

  /**
   * 自定义表单提交处理
   */
  const handleSubmit = useCallback(async (data: NewPasswordData) => {
    try {
      setResetState('submitting');
      clearError();

      // 验证令牌有效性
      if (!resetToken) {
        throw new Error('重置令牌无效');
      }

      // 使用认证服务确认密码重置
      await confirmPasswordReset(resetToken, data.password);

      // 成功处理
      setResetState('success');
      if (onPasswordReset) {
        onPasswordReset({
          success: true,
          email: email,
        });
      }

    } catch (error) {
      setResetState('error');
      const errorMessage = error instanceof Error ? error.message : '密码重置失败，请重试';
      
      if (onError) {
        onError(errorMessage);
      }
      
      // 如果是令牌无效错误，更新状态
      if (errorMessage.includes('令牌') || errorMessage.includes('token') || errorMessage.includes('过期')) {
        setResetState('invalid-token');
      }
    }
  }, [resetToken, confirmPasswordReset, clearError, onPasswordReset, onError, email]);

  /**
   * 清理错误状态
   */
  const handleClearError = useCallback(() => {
    clearError();
    setResetState('idle');
  }, [clearError]);

  /**
   * 返回登录页面
   */
  const handleBackToLogin = useCallback(() => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      // 默认行为：导航到登录页
      if (typeof window !== 'undefined') {
        window.location.href = returnUrl || '/login';
      }
    }
  }, [onBackToLogin, returnUrl]);

  /**
   * 重新尝试重置
   */
  const handleRetryReset = useCallback(() => {
    setResetState('idle');
    clearError();
    form.reset();
    setPasswordValidation({
      isValid: false,
      issues: [],
      strength: 'weak',
    });
    setConfirmPasswordMatch(false);
  }, [clearError, form]);

  // ========================================================================
  // Computed Values
  // ========================================================================

  /**
   * 密码强度颜色
   */
  const passwordStrengthColor = useMemo(() => {
    switch (passwordValidation.strength) {
      case 'strong':
        return 'text-emerald-600';
      case 'medium':
        return 'text-amber-600';
      default:
        return 'text-red-600';
    }
  }, [passwordValidation.strength]);

  /**
   * 密码强度标签
   */
  const passwordStrengthLabel = useMemo(() => {
    switch (passwordValidation.strength) {
      case 'strong':
        return '强';
      case 'medium':
        return '中等';
      default:
        return '弱';
    }
  }, [passwordValidation.strength]);

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * 渲染密码强度指示器
   */
  const renderPasswordStrength = () => {
    const password = form.watch('password');
    if (!password) return null;

    return (
      <div className="space-y-2">
        {/* 强度条 */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1 rounded-full transition-all duration-200",
                level <= (passwordValidation.strength === 'weak' ? 1 : passwordValidation.strength === 'medium' ? 2 : 4)
                  ? passwordStrengthColor.replace('text-', 'bg-')
                  : 'bg-muted'
              )}
              style={{ flex: 1 }}
            />
          ))}
        </div>
        
        {/* 强度标签和问题列表 */}
        <div className="space-y-1">
          <p className={cn("text-xs font-medium", passwordStrengthColor)}>
            密码强度：{passwordStrengthLabel}
          </p>
          {passwordValidation.issues.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {passwordValidation.issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-destructive">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  /**
   * 渲染密码输入框图标
   */
  const renderPasswordIcon = (isValid: boolean, isEmpty: boolean) => {
    if (isEmpty) {
      return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
    
    return isValid ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-destructive" />
    );
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
          密码重置成功
        </h1>
        <p className="text-sm text-muted-foreground">
          您的密码已成功更新{email ? `，邮箱：${email}` : ''}
        </p>
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
          前往登录
        </Button>
      </div>

      {/* 安全提示 */}
      <div className={cn(
        "rounded-lg border border-border/50 bg-muted/50 p-4",
        "text-left space-y-2"
      )}>
        <h3 className="text-sm font-medium text-foreground">安全提示：</h3>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            为了账户安全，请妥善保管您的新密码
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            建议您定期更换密码，避免在其他网站使用相同密码
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            如果您怀疑账户安全存在问题，请及时联系我们
          </li>
        </ul>
      </div>
    </div>
  );

  /**
   * 渲染令牌无效状态内容
   */
  const renderInvalidTokenContent = () => (
    <div className="space-y-6 text-center">
      {/* 错误图标 */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          "bg-destructive/10 dark:bg-destructive/20"
        )}>
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
      </div>

      {/* 标题和描述 */}
      <div className="space-y-2">
        <h1 className={cn(
          "text-2xl font-bold tracking-tight text-foreground",
          "sm:text-3xl"
        )}>
          重置链接无效
        </h1>
        <p className="text-sm text-muted-foreground">
          重置链接已过期或无效，请重新申请密码重置
        </p>
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
      </div>
    </div>
  );

  /**
   * 渲染密码重置表单内容
   */
  const renderFormContent = () => (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className={cn(
          "text-2xl font-bold tracking-tight text-foreground",
          "sm:text-3xl"
        )}>
          设置新密码
        </h1>
        <p className="text-sm text-muted-foreground">
          请输入新密码{email ? `，邮箱：${email}` : ''}
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

      {/* 密码重置表单 */}
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* 新密码输入字段 */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-card-foreground">
                  新密码
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入新密码"
                      autoComplete="new-password"
                      autoFocus={autoFocus}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        field.onChange(e);
                        handlePasswordChange(e.target.value);
                        if (submitError) clearError();
                      }}
                      className={cn(
                        // 基础样式 - 44px高度，匹配设计图
                        "h-11 pl-10 pr-10 bg-muted border-input",
                        "placeholder:text-placeholder",
                        "focus:ring-2 focus:ring-ring focus:border-ring",
                        // 验证状态样式
                        field.value && passwordValidation.isValid && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20",
                        field.value && !passwordValidation.isValid && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        // 禁用状态
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    />
                    {/* 密码图标 */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {renderPasswordIcon(passwordValidation.isValid, !field.value)}
                    </div>
                    {/* 显示/隐藏密码按钮 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                {/* 密码强度指示器 */}
                {renderPasswordStrength()}
              </FormItem>
            )}
          />

          {/* 确认密码输入字段 */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-card-foreground">
                  确认新密码
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="请再次输入新密码"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      onChange={(e) => {
                        field.onChange(e);
                        handleConfirmPasswordChange(e.target.value);
                        if (submitError) clearError();
                      }}
                      className={cn(
                        // 基础样式 - 44px高度，匹配设计图
                        "h-11 pl-10 pr-10 bg-muted border-input",
                        "placeholder:text-placeholder",
                        "focus:ring-2 focus:ring-ring focus:border-ring",
                        // 验证状态样式
                        field.value && confirmPasswordMatch && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20",
                        field.value && !confirmPasswordMatch && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        // 禁用状态
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    />
                    {/* 确认图标 */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {renderPasswordIcon(confirmPasswordMatch, !field.value)}
                    </div>
                    {/* 显示/隐藏密码按钮 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                {/* 匹配状态提示 */}
                {field.value && (
                  <p className={cn(
                    "text-xs mt-1",
                    confirmPasswordMatch ? "text-emerald-600" : "text-destructive"
                  )}>
                    {confirmPasswordMatch ? "✓ 密码匹配" : "✗ 密码不匹配"}
                  </p>
                )}
              </FormItem>
            )}
          />

          {/* 重置令牌隐藏字段 */}
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <input
                {...field}
                type="hidden"
                value={resetToken}
              />
            )}
          />

          {/* 更新密码按钮 */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !isValid || !passwordValidation.isValid || !confirmPasswordMatch}
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
                更新中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                更新密码
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

      {/* 安全提示 */}
      <div className={cn(
        "text-center text-xs text-muted-foreground",
        "border-t border-border/50 pt-4"
      )}>
        <p>
          为了账户安全，请设置包含大小写字母、数字和特殊字符的强密码。
          密码长度建议至少8个字符。
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
      title="密码重置确认"
      description="安全便捷的密码重置确认，完成新密码设置。"
      isLoading={isSubmitting}
    >
      {resetState === 'success' && renderSuccessContent()}
      {resetState === 'invalid-token' && renderInvalidTokenContent()}
      {(resetState === 'idle' || resetState === 'submitting' || resetState === 'error') && renderFormContent()}
    </AuthLayout>
  );
}

/**
 * PasswordConfirmPage组件默认导出
 */
export default PasswordConfirmPage;