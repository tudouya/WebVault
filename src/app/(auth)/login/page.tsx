/**
 * Login Page Route - (auth) Group
 * 
 * Next.js 15 App Router认证路由组的登录页面实现
 * 集成LoginPage组件，提供完整的SEO配置和元数据支持
 * 
 * Route: /login
 * Group: (auth) - 认证相关页面的路由组
 * 
 * Features:
 * - Next.js 15 App Router标准页面组件
 * - 完整的元数据和SEO配置
 * - LoginPage组件直接集成
 * - 服务端渲染支持
 * 
 * Requirements:
 * - 架构对齐：确保路由与Next.js 15 App Router模式集成
 * - 利用现有代码：集成LoginPage组件
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { Metadata } from 'next'
import { LoginPage } from '@/features/auth/components/LoginPage'

// ============================================================================
// Metadata Configuration
// ============================================================================

/**
 * 页面元数据配置
 * 提供完整的SEO支持和社交媒体优化
 */
export const metadata: Metadata = {
  title: 'WebVault - 用户登录',
  description: '登录WebVault账户，继续管理您的网站收藏。安全便捷的登录体验。',
  keywords: ['WebVault', '登录', '网站管理', '用户认证'],
  authors: [{ name: 'WebVault Team' }],
  robots: {
    index: false, // 登录页面不需要被搜索引擎索引
    follow: true
  },
  openGraph: {
    title: 'WebVault - 用户登录',
    description: '登录WebVault账户，继续管理您的网站收藏',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary',
    title: 'WebVault - 用户登录',
    description: '登录WebVault账户，继续管理您的网站收藏',
  },
  alternates: {
    canonical: '/login'
  }
}

// ============================================================================
// Page Component
// ============================================================================

/**
 * 登录页面路由组件
 * 
 * Next.js 15 App Router标准页面组件实现
 * 提供完整的登录用户体验，集成SEO配置和性能优化
 * 
 * Architecture:
 * - 支持服务端渲染的元数据配置
 * - 直接集成现有LoginPage组件
 * - 遵循Next.js 15 App Router最佳实践
 * 
 * Route Structure:
 * - Group: (auth) - 认证相关页面的逻辑分组
 * - Path: /login - 标准登录路径
 * - Layout: 继承根layout.tsx和可能的(auth)布局
 */
export default function LoginPageRoute() {
  return (
    <LoginPage 
      // 启用调试模式以便开发时查看详细日志
      debug={process.env.NODE_ENV === 'development'}
      // 显示页脚以提供完整的页面体验
      showFooter={true}
      // 显示社交登录选项
      showSocialAuth={true}
      // 登录成功后的默认重定向（可由查询参数覆盖）
      redirectUrl="/"
    />
  )
}

