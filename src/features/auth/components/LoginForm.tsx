/**
 * LoginForm Component
 * 
 * 实现基于设计图8_Login.png的精确登录界面，提供邮箱密码登录功能
 * 集成React Hook Form + Zod验证，支持加载状态和错误处理
 * 
 * Requirements:
 * - 1.1: Email Authentication - 邮箱密码登录功能
 * - 6.1: 精确配色系统和品牌展示  
 * - 7.1: 表单设计和视觉层次
 * - 8.1: 按钮设计和交互效果
 * 
 * Key Features:
 * - 精确匹配设计图的视觉规范
 * - 邮箱格式验证和实时反馈
 * - 密码强度提示（可选）
 * - 加载状态和禁用状态管理
 * - 错误信息展示和用户友好提示
 * - "Forgot password?"链接
 * - "Remember me"选项
 * - 完整的无障碍支持
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

'use client';

import React, { useCallback } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
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

// 认证hooks和类型导入
import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema } from '../schemas/auth-schemas';
import type { LoginFormData } from '../schemas/auth-schemas';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * LoginForm组件属性接口
 */
export interface LoginFormProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 登录成功回调
   */
  onSuccess?: (result: { success: boolean; redirectUrl?: string; data?: Record<string, any> }) => void;
  
  /**
   * 登录失败回调
   */
  onError?: (error: string) => void;
  
  /**
   * 忘记密码点击回调
   */
  onForgotPassword?: () => void;
  
  /**
   * 是否自动聚焦邮箱输入框
   * @default true
   */
  autoFocus?: boolean;
  
  /**
   * 是否显示"记住我"选项
   * @default true
   */
  showRememberMe?: boolean;
  
  /**
   * 是否显示"忘记密码"链接
   * @default true
   */
  showForgotPassword?: boolean;
  
  /**
   * 自定义重定向URL
   */
  redirectUrl?: string;
  
  /**
   * 调试模式
   */
  debug?: boolean;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * LoginForm - 登录表单组件
 * 
 * 提供完整的邮箱密码登录功能，遵循设计图的精确视觉规范
 * 集成表单验证、加载状态管理和用户体验优化
 */
export function LoginForm({
  className,
  onSuccess,
  onError,
  onForgotPassword,
  autoFocus = true,
  showRememberMe = true,
  showForgotPassword = true,
  redirectUrl,
  debug = false,
}: LoginFormProps) {
  
  // ========================================================================
  // Clerk Authentication Hooks
  // ========================================================================
  
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();

  // ========================================================================  
  // Form State Management
  // ========================================================================
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string>('');

  const clearError = () => setSubmitError('');

  // 如果已经登录，直接跳转
  React.useEffect(() => {
    if (isLoaded && isSignedIn && redirectUrl) {
      if (debug) console.log('[LoginForm] Already signed in, redirecting...');
      router.push(redirectUrl);
    }
  }, [isLoaded, isSignedIn, router, redirectUrl, debug]);

  // 表单提交处理
  const handleSubmit = async (data: LoginFormData) => {
    if (!signIn || !signInLoaded) {
      setSubmitError('登录系统未就绪，请稍后重试');
      return;
    }

    if (isSignedIn) {
      if (debug) console.log('[LoginForm] Already signed in');
      if (redirectUrl) router.push(redirectUrl);
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      if (debug) console.log('[LoginForm] Starting sign in with:', data.email);
      
      // 使用 Clerk 官方认证方法
      const signInAttempt = await signIn.create({
        identifier: data.email,
      });

      const result = await signInAttempt.attemptFirstFactor({
        strategy: 'password',
        password: data.password,
      });

      if (result.status === 'complete') {
        if (debug) console.log('[LoginForm] Sign in successful, activating session');
        
        // 确保会话完全激活 - 关键步骤！
        await clerk.setActive({ session: result.createdSessionId });
        
        // 调用成功回调
        onSuccess?.({ 
          success: true, 
          redirectUrl: redirectUrl || '/admin/dashboard',
          data: { email: data.email, rememberMe: data.rememberMe }
        });
        
        // 等待一个tick确保状态完全同步后再跳转
        if (redirectUrl) {
          await new Promise(resolve => setTimeout(resolve, 50));
          router.push(redirectUrl);
        }
      } else {
        if (debug) console.log('[LoginForm] Sign in incomplete:', result.status);
        setSubmitError(`登录状态异常: ${result.status}`);
      }
    } catch (err: any) {
      if (debug) console.error('[LoginForm] Sign in error:', err);
      
      // Clerk 错误处理
      if (err.errors && err.errors.length > 0) {
        const firstError = err.errors[0];
        switch (firstError.code) {
          case 'form_identifier_not_found':
            setSubmitError('未找到此邮箱对应的账户，请检查邮箱地址');
            break;
          case 'form_password_incorrect':
            setSubmitError('密码错误，请重新输入');
            break;
          case 'form_identifier_invalid':
            setSubmitError('邮箱格式不正确');
            break;
          default:
            setSubmitError(firstError.longMessage || firstError.message || '登录失败');
        }
      } else {
        setSubmitError(err.message || '登录失败，请稍后重试');
      }
      
      // 调用错误回调
      onError?.(submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = form.formState.isValid;
  const isDirty = form.formState.isDirty;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  // Email validation helper (simplified)
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ========================================================================
  // Local State for UI Enhancement
  // ========================================================================
  
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailValidationStatus, setEmailValidationStatus] = React.useState<'idle' | 'valid' | 'invalid'>('idle');

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * 切换密码可见性
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

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
    setEmailValidationStatus('idle');
  }, [clearError]);

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
   * 渲染密码输入框图标
   */
  const renderPasswordIcon = () => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-4 w-4 p-0 hover:bg-transparent"
      onClick={togglePasswordVisibility}
      tabIndex={-1}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Eye className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );

  // ========================================================================
  // Component Render
  // ========================================================================

  return (
    <div className={cn("space-y-6", className)}>
      {/* 表单标题 */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className={cn(
          "text-2xl font-bold tracking-tight text-foreground",
          "sm:text-3xl"
        )}>
          登录账户
        </h1>
        <p className="text-sm text-muted-foreground">
          输入您的邮箱和密码来登录账户
        </p>
      </div>

      {/* 错误提示区域 */}
      {submitError && (
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

      {/* 登录表单 */}
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

          {/* 密码输入字段 */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-card-foreground">
                  密码
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      onChange={(e) => {
                        field.onChange(e);
                        if (submitError) clearError();
                      }}
                      className={cn(
                        // 基础样式 - 44px高度，匹配设计图
                        "h-11 pl-10 pr-10 bg-muted border-input",
                        "placeholder:text-placeholder",
                        "focus:ring-2 focus:ring-ring focus:border-ring",
                        // 禁用状态
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    />
                    {/* 密码图标 */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {/* 密码可见性切换按钮 */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {renderPasswordIcon()}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 记住我和忘记密码 */}
          <div className="flex items-center justify-between">
            {/* 记住我选项 */}
            {showRememberMe && (
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={field.value || false}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        className={cn(
                          "h-4 w-4 rounded border-input",
                          "text-primary focus:ring-2 focus:ring-ring",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      />
                      <Label 
                        htmlFor="rememberMe"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        30天内免登录
                      </Label>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* 忘记密码链接 */}
            {showForgotPassword && (
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={isSubmitting}
                onClick={onForgotPassword}
                className="h-auto p-0 text-sm text-secondary hover:text-secondary/80"
              >
                Forgot password?
              </Button>
            )}
          </div>

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

          {/* 登录按钮 */}
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
                登录中...
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </Form>

    </div>
  );
}

/**
 * LoginForm组件默认导出
 */
export default LoginForm;