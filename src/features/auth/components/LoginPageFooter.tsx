/**
 * LoginPageFooter Component
 * 
 * 登录页面底部导航组件，提供注册导航和法律条款链接功能
 * 实现requirements.md中的Requirement 4：Registration Navigation
 * 
 * Requirements:
 * - 4.1: WHEN 用户点击'Sign up'链接 THEN 系统 SHALL 导航到注册页面
 * - 4.4: WHEN 底部导航文字显示时 THEN 系统 SHALL 显示"Don't have an account? Sign up"（完全匹配设计图）
 * - 4.5: WHEN "Sign up"链接显示时 THEN 系统 SHALL 使用蓝色文字突出显示
 * 
 * Key Features:
 * - 精确匹配设计图的注册导航文字
 * - 支持自定义注册页面URL和文案
 * - 集成法律条款链接（隐私政策、服务条款）
 * - 符合shadcn/ui设计系统的配色规范
 * - 完整的无障碍支持和键盘导航
 * - 响应式设计和主题系统集成
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 法律条款链接接口
 */
interface LegalLink {
  /** 链接文本 */
  text: string;
  /** 链接URL */
  href: string;
  /** 是否为外部链接 */
  external?: boolean;
}

/**
 * LoginPageFooter组件属性接口
 */
export interface LoginPageFooterProps {
  /**
   * 是否显示注册链接
   * @default true
   */
  showSignUp?: boolean;
  
  /**
   * 注册提示文字
   * @default "Don't have an account? Sign up"
   */
  signUpText?: string;
  
  /**
   * 注册页面URL
   * @default "/signup"
   */
  signUpUrl?: string;
  
  /**
   * 法律条款链接数组
   * @default 默认包含隐私政策和服务条款
   */
  legalLinks?: LegalLink[];
  
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 调试模式
   */
  debug?: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * 默认法律条款链接
 */
const DEFAULT_LEGAL_LINKS: LegalLink[] = [
  { text: "隐私政策", href: "/privacy" },
  { text: "服务条款", href: "/terms" }
];

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * LoginPageFooter - 登录页面底部导航组件
 * 
 * 提供注册导航和法律条款链接，完全匹配设计图要求
 * 支持自定义配置和主题系统集成
 */
export function LoginPageFooter({
  showSignUp = true,
  signUpText = "Don't have an account? Sign up",
  signUpUrl = "/signup",
  legalLinks = DEFAULT_LEGAL_LINKS,
  className,
  debug = false,
}: LoginPageFooterProps) {
  
  // ========================================================================
  // Debug Logging
  // ========================================================================
  
  if (debug) {
    console.log('[LoginPageFooter] Render:', {
      showSignUp,
      signUpText,
      signUpUrl,
      legalLinks: legalLinks.length,
    });
  }

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * 渲染注册导航文本
   * 将文本分解为前半部分和链接部分，确保样式精确匹配设计图
   */
  const renderSignUpNavigation = () => {
    if (!showSignUp) return null;

    // 解析注册文本，分离普通文本和链接文本
    const parts = signUpText.split('Sign up');
    const beforeText = parts[0] || "Don't have an account? ";
    const linkText = "Sign up";

    return (
      <p className="text-sm text-muted-foreground">
        <span className="text-card-foreground">
          {beforeText}
        </span>
        <Link 
          href={signUpUrl}
          className={cn(
            // 基础链接样式
            "text-secondary hover:text-secondary/80 font-medium",
            // 交互效果
            "hover:underline transition-colors duration-200",
            // 无障碍支持
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "rounded-sm"
          )}
          aria-label="导航到注册页面"
        >
          {linkText}
        </Link>
      </p>
    );
  };

  /**
   * 渲染法律条款链接
   */
  const renderLegalLinks = () => {
    if (!legalLinks || legalLinks.length === 0) return null;

    return (
      <div className="flex justify-center items-center space-x-4 text-xs text-muted-foreground">
        {legalLinks.map((link, index) => (
          <React.Fragment key={link.href}>
            <Link 
              href={link.href}
              className={cn(
                // 基础样式
                "hover:text-card-foreground transition-colors duration-200",
                // 无障碍支持
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "rounded-sm px-1 -mx-1"
              )}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              aria-label={link.external ? `${link.text}（在新窗口打开）` : link.text}
            >
              {link.text}
            </Link>
            {/* 分隔符 */}
            {index < legalLinks.length - 1 && (
              <span className="text-border select-none" aria-hidden="true">
                |
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ========================================================================
  // Component Render
  // ========================================================================

  return (
    <div 
      className={cn(
        // 基础布局
        "text-center space-y-4",
        // 调试边框（仅开发环境）
        debug && "border border-dashed border-amber-300 bg-amber-50/50",
        className
      )}
      role="contentinfo"
      aria-label="登录页面底部导航"
    >
      {/* 注册导航 - 完全匹配设计图文案 */}
      {renderSignUpNavigation()}
      
      {/* 法律条款链接 */}
      {renderLegalLinks()}
    </div>
  );
}

/**
 * LoginPageFooter组件默认导出
 */
export default LoginPageFooter;