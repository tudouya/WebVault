/**
 * SocialAuthButtons Component
 * 
 * 实现社交认证按钮组，支持Google和GitHub OAuth登录
 * 集成useSocialAuth hook提供完整的OAuth流程处理
 * 
 * Requirements:
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 8.1: 按钮设计和交互效果
 * 
 * Key Features:
 * - Google和GitHub登录按钮
 * - 加载状态管理和视觉反馈
 * - OAuth流程集成
 * - 错误处理和用户友好提示
 * - 响应式布局支持
 * - 完整的无障碍支持
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

// UI组件导入
import { Button } from '@/components/ui/button';

// 认证hooks导入
import { useSocialAuth } from '../hooks/useSocialAuth';
import type { SocialProvider } from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * SocialAuthButtons组件属性接口
 */
export interface SocialAuthButtonsProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 登录成功回调
   */
  onSuccess?: (provider: SocialProvider, result: { success: boolean; redirectUrl?: string; data?: Record<string, any> }) => void;
  
  /**
   * 登录失败回调
   */
  onError?: (provider: SocialProvider, error: string) => void;
  
  /**
   * 按钮大小
   * @default 'lg'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * 按钮布局方式
   * @default 'grid'
   */
  layout?: 'grid' | 'stack' | 'inline';
  
  /**
   * 是否禁用所有按钮
   * @default false
   */
  disabled?: boolean;
  
  /**
   * 自定义重定向URL
   */
  redirectUrl?: string;
  
  /**
   * 启用的社交提供商
   * @default ['google', 'github']
   */
  enabledProviders?: SocialProvider[];
  
  /**
   * 按钮变体样式
   * @default 'outline'
   */
  variant?: 'default' | 'outline' | 'ghost';
  
  /**
   * 调试模式
   */
  debug?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 社交提供商配置
 */
const SOCIAL_PROVIDERS = {
  google: {
    name: 'Google',
    icon: GoogleIcon,
    colorClass: 'hover:text-blue-600 dark:hover:text-blue-400',
  },
  github: {
    name: 'GitHub', 
    icon: GitHubIcon,
    colorClass: 'hover:text-gray-900 dark:hover:text-white',
  },
} as const;

// ============================================================================
// Icon Components
// ============================================================================

/**
 * Google图标组件
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"  
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * GitHub图标组件
 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
      />
    </svg>
  );
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * SocialAuthButtons - 社交认证按钮组件
 * 
 * 提供Google和GitHub OAuth登录功能，集成useSocialAuth hook
 * 支持多种布局方式和交互状态管理
 */
export function SocialAuthButtons({
  className,
  onSuccess,
  onError,
  size = 'lg',
  layout = 'grid',
  disabled = false,
  redirectUrl,
  enabledProviders = ['google', 'github'],
  variant = 'outline',
  debug = false,
}: SocialAuthButtonsProps) {
  
  // ========================================================================
  // Social Auth Integration
  // ========================================================================
  
  const {
    signInWithGoogle,
    signInWithGitHub,
    state: { isLoading, activeProvider, error },
    isGoogleLoading,
    isGitHubLoading,
    clearError,
  } = useSocialAuth({
    redirectTo: redirectUrl,
    debug,
    onSuccess: (session) => {
      if (onSuccess && activeProvider) {
        onSuccess(activeProvider, {
          success: true,
          data: { session },
        });
      }
    },
    onError: (error, provider) => {
      if (onError) {
        onError(provider, error.message);
      }
    },
  });

  // ========================================================================
  // Event Handlers
  // ========================================================================

  /**
   * 处理Google登录
   */
  const handleGoogleLogin = useCallback(async () => {
    try {
      clearError();
      await signInWithGoogle();
    } catch (error) {
      if (onError) {
        onError('google', error instanceof Error ? error.message : 'Google登录失败');
      }
    }
  }, [signInWithGoogle, clearError, onError]);

  /**
   * 处理GitHub登录
   */
  const handleGitHubLogin = useCallback(async () => {
    try {
      clearError();
      await signInWithGitHub();
    } catch (error) {
      if (onError) {
        onError('github', error instanceof Error ? error.message : 'GitHub登录失败');
      }
    }
  }, [signInWithGitHub, clearError, onError]);

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * 获取按钮高度样式
   */
  const getButtonHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-9';
      case 'lg':
        return 'h-11';
      default:
        return 'h-10';
    }
  };

  /**
   * 获取容器布局样式
   */
  const getContainerClasses = () => {
    const baseClasses = 'w-full';
    
    switch (layout) {
      case 'stack':
        return `${baseClasses} space-y-3`;
      case 'inline':
        return `${baseClasses} flex gap-3`;
      case 'grid':
      default:
        return `${baseClasses} grid grid-cols-2 gap-3`;
    }
  };

  /**
   * 渲染社交登录按钮
   */
  const renderSocialButton = (provider: SocialProvider) => {
    const config = SOCIAL_PROVIDERS[provider];
    const isProviderLoading = provider === 'google' ? isGoogleLoading : isGitHubLoading;
    const handleClick = provider === 'google' ? handleGoogleLogin : handleGitHubLogin;
    
    const IconComponent = config.icon;

    return (
      <Button
        key={provider}
        type="button"
        variant={variant}
        size={size}
        disabled={disabled || isLoading || isProviderLoading}
        onClick={handleClick}
        className={cn(
          getButtonHeight(),
          'text-sm font-medium transition-all duration-200',
          variant === 'outline' && 'border-border hover:bg-accent hover:text-accent-foreground',
          variant === 'default' && 'bg-primary hover:bg-primary/90 text-primary-foreground',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          config.colorClass,
          // 加载状态
          isProviderLoading && 'cursor-wait',
          // 禁用状态
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          // 布局特定样式
          layout === 'inline' && 'flex-1'
        )}
      >
        {isProviderLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="hidden sm:inline">登录中...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            <span>{config.name}</span>
          </div>
        )}
      </Button>
    );
  };

  // ========================================================================
  // Component Render
  // ========================================================================

  // 过滤启用的提供商
  const providersToRender = enabledProviders.filter(provider => 
    SOCIAL_PROVIDERS.hasOwnProperty(provider)
  );

  if (providersToRender.length === 0) {
    if (debug) {
      console.warn('[SocialAuthButtons] No enabled providers found');
    }
    return null;
  }

  return (
    <div className={cn(getContainerClasses(), className)}>
      {providersToRender.map(renderSocialButton)}
    </div>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * 紧凑型社交登录按钮组 - 仅图标
 */
export function CompactSocialAuthButtons(props: Omit<SocialAuthButtonsProps, 'layout' | 'size'>) {
  return (
    <SocialAuthButtons
      {...props}
      layout="inline"
      size="sm"
      className={cn("max-w-[200px]", props.className)}
    />
  );
}

/**
 * 堆叠式社交登录按钮组 - 垂直排列
 */
export function StackedSocialAuthButtons(props: Omit<SocialAuthButtonsProps, 'layout'>) {
  return (
    <SocialAuthButtons
      {...props}
      layout="stack"
    />
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default SocialAuthButtons;