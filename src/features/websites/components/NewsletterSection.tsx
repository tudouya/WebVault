/**
 * NewsletterSection 组件
 * 
 * 首页底部的社区订阅区域，包含订阅表单和隐私政策确认
 * 集成React Hook Form处理邮箱订阅，支持XSS防护、邮箱验证和反机器人措施
 * 
 * 需求引用:
 * - 7.0: 社区订阅功能 - 邮箱订阅和隐私政策确认
 * - 安全要求: 订阅邮箱应验证防止恶意提交
 * 
 * 设计参考: 1_homepage.png - 页面底部灰色背景的Newsletter区域
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Send, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  subscriptionFormSchema,
  subscriptionFormResolver,
  subscriptionFormDefaults,
  type SubscriptionFormData,
  FORM_ERROR_MESSAGES
} from '../schemas';

/**
 * NewsletterSection组件属性
 */
interface NewsletterSectionProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 是否显示在加载状态
   */
  isLoading?: boolean;
  
  /**
   * 订阅成功回调
   */
  onSubscribeSuccess?: (email: string) => void;
  
  /**
   * 订阅失败回调
   */
  onSubscribeError?: (error: string) => void;
}

/**
 * 订阅状态枚举
 */
type SubscriptionStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * NewsletterSection 社区订阅组件
 * 
 * 提供邮箱订阅功能，包含表单验证、安全防护和用户反馈
 * 符合GDPR要求，包含隐私政策确认和反机器人措施
 */
export function NewsletterSection({ 
  className = '',
  isLoading = false,
  onSubscribeSuccess,
  onSubscribeError
}: NewsletterSectionProps) {
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  
  // React Hook Form设置
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
    reset
  } = useForm({
    resolver: subscriptionFormResolver,
    defaultValues: subscriptionFormDefaults,
    mode: 'onChange',
  });
  
  // 监听邮箱输入变化以清除错误
  const emailValue = watch('email');
  React.useEffect(() => {
    if (emailValue && errors.email) {
      clearErrors('email');
    }
    if (emailValue && subscriptionStatus === 'error') {
      setSubscriptionStatus('idle');
      setErrorMessage('');
    }
  }, [emailValue, errors.email, clearErrors, subscriptionStatus]);

  /**
   * 处理订阅表单提交
   * 验证输入、提交订阅请求并处理响应
   */
  const onSubmit = async (data: any) => {
    try {
      setSubscriptionStatus('submitting');
      setErrorMessage('');
      
      // 检查蜜罐字段（反机器人）
      if (data.honeypot && data.honeypot !== '') {
        setError('honeypot', {
          type: 'manual',
          message: FORM_ERROR_MESSAGES.SUBSCRIPTION.BOT_DETECTED,
        });
        setSubscriptionStatus('error');
        setErrorMessage('检测到异常提交，请重试');
        onSubscribeError?.('检测到异常提交，请重试');
        return;
      }

      // 验证隐私政策同意
      if (!data.agreeToPrivacy) {
        setError('agreeToPrivacy', {
          type: 'manual',
          message: FORM_ERROR_MESSAGES.SUBSCRIPTION.PRIVACY_REQUIRED,
        });
        setSubscriptionStatus('error');
        setErrorMessage('请同意隐私政策后继续');
        return;
      }

      // 模拟API调用（实际项目中替换为真实的订阅API）
      const response = await simulateSubscriptionAPI(data.email);
      
      if (response.success) {
        setSubscriptionStatus('success');
        onSubscribeSuccess?.(data.email);
        
        // 3秒后重置表单状态
        setTimeout(() => {
          setSubscriptionStatus('idle');
          reset();
        }, 3000);
      } else {
        throw new Error(response.error || '订阅失败，请重试');
      }
      
    } catch (error) {
      console.error('订阅提交错误:', error);
      
      const errorMsg = error instanceof Error ? error.message : '订阅时发生错误，请重试';
      setSubscriptionStatus('error');
      setErrorMessage(errorMsg);
      onSubscribeError?.(errorMsg);
      
      setError('email', {
        type: 'manual',
        message: errorMsg,
      });
    }
  };

  /**
   * 模拟订阅API调用
   * 在实际项目中，这应该调用真实的订阅服务
   */
  const simulateSubscriptionAPI = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟一些错误情况
    if (email.includes('test-error')) {
      return { success: false, error: '该邮箱地址无效' };
    }
    
    if (email.includes('test-duplicate')) {
      return { success: false, error: '该邮箱已订阅，无需重复订阅' };
    }
    
    // 模拟成功响应
    return { success: true };
  };

  /**
   * 处理键盘事件
   * Enter键触发提交
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <section 
      className={`relative bg-muted py-16 px-4 sm:py-20 sm:px-6 lg:px-8 ${className}`}
      aria-label="社区订阅"
    >
      <div className="mx-auto max-w-4xl text-center">
        {/* NEWSLETTER 标签 */}
        <div className="mb-6">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            NEWSLETTER
          </span>
        </div>

        {/* 订阅成功状态 */}
        {subscriptionStatus === 'success' && (
          <div className="mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              订阅成功！
            </h2>
            <p className="mt-4 text-lg leading-8 text-card-foreground">
              感谢您的订阅！我们会定期向您发送最新的网站推荐和更新信息。
            </p>
          </div>
        )}

        {/* 默认订阅界面 */}
        {subscriptionStatus !== 'success' && (
          <>
            {/* 标题区域 */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Join the Community
              </h2>
              <p className="mt-4 text-lg leading-8 text-card-foreground">
                Subscribe to our newsletter for the latest news and updates
              </p>
            </div>

            {/* 订阅表单 */}
            <div className="mx-auto max-w-lg">
              <form 
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
                role="form"
                aria-label="邮箱订阅表单"
              >
                {/* 邮箱输入区域 */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <div className="relative">
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="Enter your email"
                        className={`
                          h-12 w-full pl-4 pr-12 text-base bg-background
                          ${errors.email ? 'border-destructive ring-destructive' : ''}
                          focus:ring-primary focus:border-primary
                        `}
                        disabled={isLoading || isSubmitting}
                        onKeyDown={handleKeyDown}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      
                      {/* 邮箱图标 */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Mail 
                          className="h-5 w-5 text-muted-foreground" 
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 订阅按钮 */}
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                    disabled={isLoading || isSubmitting || subscriptionStatus === 'submitting'}
                    aria-label="订阅邮箱通讯"
                  >
                    {subscriptionStatus === 'submitting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        订阅中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        订阅
                      </>
                    )}
                  </Button>
                </div>

                {/* 隐私政策确认 */}
                <div className="flex items-start gap-2">
                  <div className="flex items-center h-5">
                    <input
                      {...register('agreeToPrivacy')}
                      id="agreeToPrivacy"
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-2"
                      disabled={isLoading || isSubmitting}
                    />
                  </div>
                  <label 
                    htmlFor="agreeToPrivacy" 
                    className="text-sm text-card-foreground leading-5 cursor-pointer"
                  >
                    我同意接收邮箱通讯，并已阅读{' '}
                    <a 
                      href="/privacy" 
                      className="text-primary hover:text-primary/80 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      隐私政策
                    </a>
                  </label>
                </div>

                {/* 蜜罐字段（对用户隐藏，用于反机器人） */}
                <input
                  {...register('honeypot')}
                  type="text"
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    opacity: 0,
                    pointerEvents: 'none'
                  }}
                  aria-hidden="true"
                />

                {/* 错误消息显示 */}
                {(errors.email || errors.agreeToPrivacy || errorMessage) && (
                  <div className="space-y-2">
                    {errors.email && (
                      <p 
                        id="email-error"
                        className="flex items-center gap-2 text-sm text-destructive"
                        role="alert"
                        aria-live="polite"
                      >
                        <XCircle className="h-4 w-4" />
                        {errors.email.message}
                      </p>
                    )}
                    {errors.agreeToPrivacy && (
                      <p 
                        className="flex items-center gap-2 text-sm text-destructive"
                        role="alert"
                        aria-live="polite"
                      >
                        <XCircle className="h-4 w-4" />
                        {errors.agreeToPrivacy.message}
                      </p>
                    )}
                    {errorMessage && !errors.email && !errors.agreeToPrivacy && (
                      <p 
                        className="flex items-center gap-2 text-sm text-destructive"
                        role="alert"
                        aria-live="polite"
                      >
                        <XCircle className="h-4 w-4" />
                        {errorMessage}
                      </p>
                    )}
                  </div>
                )}
              </form>

              {/* 订阅提示信息 */}
              <div className="mt-6 text-xs text-muted-foreground">
                <p>
                  我们承诺保护您的隐私，不会与第三方分享您的邮箱地址。
                  您可以随时取消订阅。
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default NewsletterSection;