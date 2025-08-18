/**
 * LoginPage Component
 * 
 * 登录页面的主布局组件，集成所有登录相关的UI组件
 * 基于设计规范实现居中单列布局，最大宽度400px
 * 
 * Requirements:
 * - 6.1: 精确配色系统和品牌展示
 * - 7.1: 表单设计和视觉层次
 * - 8.1: 按钮设计和交互效果
 * - 9.1: 布局和间距系统 - 居中的单列布局，最大宽度400px
 * - 11.1: 响应式设计 - 移动设备隐藏右侧装饰图形，专注表单展示
 * 
 * Key Features:
 * - 完整的登录UI组合：LoginForm + SocialAuthButtons + LoginPageFooter
 * - 组件间事件处理协调和数据流管理
 * - 响应式网格布局，集成主容器组件
 * - 主题提供者集成和基础响应式断点支持  
 * - AuthLayout组件集成，利用现有布局模式
 * - 移动优先的响应式设计
 * - 精确的CSS变量和响应式模式
 * 
 * @version 1.1.0
 * @created 2025-08-17
 * @updated 2025-08-18 - 集成SocialAuthButtons和完整事件处理
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// 引入认证相关组件
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';
import { SocialAuthButtons } from './SocialAuthButtons';
import { LoginPageFooter } from './LoginPageFooter';

// 引入类型定义
import type { SocialProvider } from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * LoginPage组件属性接口
 */
export interface LoginPageProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 登录成功回调
   */
  onLoginSuccess?: (result: { success: boolean; redirectUrl?: string; data?: Record<string, any> }) => void;
  
  /**
   * 登录失败回调
   */
  onLoginError?: (error: string) => void;
  
  /**
   * 自定义重定向URL
   */
  redirectUrl?: string;
  
  /**
   * 是否显示页脚
   * @default true
   */
  showFooter?: boolean;
  
  /**
   * 是否显示社交登录
   * @default true
   */
  showSocialAuth?: boolean;
  
  /**
   * 调试模式
   */
  debug?: boolean;
}

/**
 * 主题提供者包装组件
 * 确保登录页面支持亮色/暗色主题切换
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      // 主题变量支持
      "theme-provider",
      // 确保主题颜色正确应用
      "bg-background text-foreground",
      // 平滑的主题切换动画
      "transition-colors duration-300"
    )}>
      {children}
    </div>
  );
}


// ============================================================================
// Component Implementation
// ============================================================================

/**
 * LoginPage - 登录页面主布局组件
 * 
 * 提供完整的登录页面布局，集成AuthLayout、响应式设计和主题支持
 * 遵循设计规范实现居中单列布局和移动端优化
 */
export function LoginPage({
  className,
  onLoginSuccess,
  onLoginError,
  redirectUrl,
  showFooter = true,
  showSocialAuth = true,
  debug = false,
}: LoginPageProps) {
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * 处理登录成功（表单登录）
   */
  const handleLoginSuccess = React.useCallback((result: { success: boolean; redirectUrl?: string; data?: Record<string, any> }) => {
    if (debug) {
      console.log('[LoginPage] Form login success:', result);
    }
    onLoginSuccess?.(result);
  }, [onLoginSuccess, debug]);

  /**
   * 处理登录错误（表单登录）
   */
  const handleLoginError = React.useCallback((error: string) => {
    if (debug) {
      console.error('[LoginPage] Form login error:', error);
    }
    onLoginError?.(error);
  }, [onLoginError, debug]);

  /**
   * 处理社交登录成功
   */
  const handleSocialLoginSuccess = React.useCallback((provider: SocialProvider, result: { success: boolean; redirectUrl?: string; data?: Record<string, any> }) => {
    if (debug) {
      console.log(`[LoginPage] Social login success (${provider}):`, result);
    }
    onLoginSuccess?.(result);
  }, [onLoginSuccess, debug]);

  /**
   * 处理社交登录错误
   */
  const handleSocialLoginError = React.useCallback((provider: SocialProvider, error: string) => {
    if (debug) {
      console.error(`[LoginPage] Social login error (${provider}):`, error);
    }
    onLoginError?.(error);
  }, [onLoginError, debug]);

  // ========================================================================
  // Component Render
  // ========================================================================

  return (
    /* AuthLayout集成 - 利用现有布局模式 */
    <AuthLayout
      title="欢迎回到 WebVault"
      description="登录您的账户，继续管理您的网站收藏"
      showLogo={true}
      showBackground={true}
      variant="default"
      className={className}
    >
      {/* 登录表单内容区域 */}
      <div className="space-y-6">
        {/* 登录表单组件 */}
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          redirectUrl={redirectUrl}
          showRememberMe={true}
          showForgotPassword={true}
          autoFocus={true}
          debug={debug}
        />
        
        {/* 社交登录分隔线和按钮 */}
        {showSocialAuth && (
          <div className="space-y-4">
            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  或使用以下方式
                </span>
              </div>
            </div>
            
            {/* 社交登录按钮组 */}
            <SocialAuthButtons
              onSuccess={handleSocialLoginSuccess}
              onError={handleSocialLoginError}
              redirectUrl={redirectUrl}
              size="lg"
              layout="grid"
              variant="outline"
              enabledProviders={['google', 'github']}
              debug={debug}
              className="w-full"
            />
          </div>
        )}
        
        {/* 页脚组件（可选） */}
        {showFooter && (
          <div className="mt-6">
            <LoginPageFooter 
              showSignUp={true}
              debug={debug}
            />
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

/**
 * LoginPage组件默认导出
 */
export default LoginPage;