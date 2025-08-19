/**
 * LoginPageFooter Component
 * 
 * 登录页面底部导航组件，为管理员专用认证系统提供帮助信息和法律条款链接
 * 实现admin-only-auth-system规范中的Requirement 5.2和5.4
 * 
 * Requirements:
 * - 5.2: WHEN 登录界面加载时 THEN 不 SHALL 显示注册链接、注册按钮或相关提示文本
 * - 5.4: WHEN 用户忘记密码时 THEN 界面 SHALL 显示"请联系系统管理员重置密码"说明
 * 
 * Key Features:
 * - 管理员专用帮助提示和联系指导
 * - 移除所有注册相关UI元素（默认模式）
 * - 集成法律条款链接（隐私政策、服务条款）
 * - 符合shadcn/ui设计系统的配色规范
 * - 完整的无障碍支持和键盘导航
 * - 响应式设计和主题系统集成
 * 
 * @version 2.0.0
 * @updated 2025-08-18
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
   * @default false (管理员专用系统默认不显示注册功能)
   */
  showSignUp?: boolean;
  
  /**
   * 注册提示文字
   * @deprecated 管理员专用系统不再推荐使用注册功能
   * @default "Don't have an account? Sign up"
   */
  signUpText?: string;
  
  /**
   * 注册页面URL
   * @deprecated 管理员专用系统不再推荐使用注册功能
   * @default "/signup"
   */
  signUpUrl?: string;
  
  /**
   * 是否启用管理员模式，显示管理员专用帮助信息
   * @default true
   */
  adminMode?: boolean;
  
  /**
   * 管理员帮助提示文字
   * @default "需要账户访问权限？请联系系统管理员"
   */
  adminHelpText?: string;
  
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
 * 为管理员专用认证系统提供帮助信息和法律条款链接
 * 默认不显示注册功能，提供管理员专用的帮助指导
 */
export function LoginPageFooter({
  showSignUp = false,
  signUpText = "Don't have an account? Sign up",
  signUpUrl = "/signup",
  adminMode = true,
  adminHelpText = "需要账户访问权限？请联系系统管理员",
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
      adminMode,
      adminHelpText,
      signUpText,
      signUpUrl,
      legalLinks: legalLinks.length,
    });
  }

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * 渲染管理员专用帮助信息
   * 提供管理员联系指导，替代注册链接
   */
  const renderAdminHelpText = () => {
    if (!adminMode) return null;

    return (
      <p className="text-sm text-muted-foreground">
        <span className="text-card-foreground">
          {adminHelpText}
        </span>
      </p>
    );
  };

  /**
   * 渲染注册导航文本（向后兼容性保留）
   * @deprecated 管理员专用系统推荐使用 renderAdminHelpText()
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
      {/* 管理员专用帮助信息（优先显示）*/}
      {adminMode && renderAdminHelpText()}
      
      {/* 注册导航（向后兼容性保留，默认情况下不显示）*/}
      {!adminMode && renderSignUpNavigation()}
      
      {/* 法律条款链接 */}
      {renderLegalLinks()}
    </div>
  );
}

/**
 * LoginPageFooter组件默认导出
 */
export default LoginPageFooter;