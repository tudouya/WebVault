/**
 * Admin Login Page Route - (auth) Group
 * 
 * Next.js 15 App Router认证路由组的管理员专用登录页面实现
 * 集成LoginPage组件，提供管理员专用的认证体验和隐私保护
 * 
 * Route: /login
 * Group: (auth) - 认证相关页面的路由组
 * Access: 仅限授权管理员账户
 * 
 * Features:
 * - Next.js 15 App Router标准页面组件
 * - 管理员专用元数据配置，禁止搜索引擎索引
 * - LoginPage组件直接集成（管理员模式）
 * - 服务端渲染支持
 * - 隐私保护和安全性增强
 * 
 * Requirements:
 * - 架构对齐：确保路由与Next.js 15 App Router模式集成
 * - 利用现有代码：集成LoginPage组件
 * - 管理员专用：明确标识为管理员登录界面
 * - 隐私保护：避免搜索引擎索引管理员入口
 * 
 * @version 1.2.0
 * @created 2025-08-17
 * @updated 2025-08-19 - 移除Forgot password、Google、GitHub登录选项，仅保留脚本创建的管理员账户登录
 */

import { Metadata } from 'next'
import { LoginPage } from '@/features/auth/components/LoginPage'

// ============================================================================
// Metadata Configuration
// ============================================================================

/**
 * 管理员专用页面元数据配置
 * 仅允许管理员访问，禁止搜索引擎索引，提供专业的内容管理界面标识
 */
export const metadata: Metadata = {
  title: 'WebVault - 管理员登录',
  description: 'WebVault内容管理平台管理员登录页面。仅限授权管理员访问，用于网站资源管理和内容策展。',
  keywords: ['WebVault', '管理员登录', '内容管理', '网站管理', '管理员面板', 'admin login', 'content management'],
  authors: [{ name: 'WebVault Team' }],
  robots: {
    index: false, // 管理员登录页面禁止搜索引擎索引
    follow: false, // 禁止跟踪链接，保护管理员界面隐私
    googleBot: {
      index: false,
      follow: false
    }
  },
  openGraph: {
    title: 'WebVault - 管理员登录',
    description: 'WebVault内容管理平台管理员入口',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary',
    title: 'WebVault - 管理员登录',
    description: 'WebVault内容管理平台管理员入口',
  },
  alternates: {
    canonical: '/login'
  }
}

// ============================================================================
// Page Component
// ============================================================================

/**
 * 管理员专用登录页面路由组件
 * 
 * Next.js 15 App Router标准页面组件实现
 * 提供管理员专用的登录体验，集成SEO配置和隐私保护
 * 
 * Architecture:
 * - 支持服务端渲染的管理员专用元数据配置
 * - 直接集成现有LoginPage组件（管理员模式）
 * - 遵循Next.js 15 App Router最佳实践
 * - 禁止搜索引擎索引，保护管理员界面隐私
 * 
 * Route Structure:
 * - Group: (auth) - 认证相关页面的逻辑分组
 * - Path: /login - 管理员登录路径
 * - Layout: 继承根layout.tsx和可能的(auth)布局
 * - Access: 仅限授权管理员账户
 */
export default function LoginPageRoute() {
  return (
    <LoginPage 
      // 启用调试模式以便开发时查看详细日志
      debug={process.env.NODE_ENV === 'development'}
      // 管理员专用模式：隐藏页脚（注册相关UI）
      showFooter={false}
      // 管理员专用模式：禁用社交登录选项，仅允许脚本创建的账户登录
      showSocialAuth={false}
      // 登录成功后的默认重定向（可由查询参数覆盖）
      redirectUrl="/"
    />
  )
}

