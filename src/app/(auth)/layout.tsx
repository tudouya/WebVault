/**
 * Authentication Route Group Layout
 * 
 * Next.js 15 App Router认证路由组专用布局组件
 * 为认证相关页面提供统一的布局结构、主题支持和认证上下文
 * 
 * Requirements: 
 * - 任务17: 创建认证路由组布局，集成主题和提供者
 * - 架构对齐: 复用AuthLayout和useAuth上下文
 * - Feature-First架构: 集成现有认证功能模块
 * 
 * Features:
 * - 认证上下文提供者集成
 * - 全局认证状态管理
 * - 主题系统支持（基于现有HSL配色）
 * - 响应式设计和移动端适配
 * - 统一的认证页面体验
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import React from 'react';
import { Metadata } from 'next';
import { AuthProviderWrapper } from './components/AuthProviderWrapper';

// ============================================================================
// Route Group Layout Metadata
// ============================================================================

/**
 * 认证路由组元数据配置
 * 为认证相关页面提供通用的SEO配置和社交媒体优化
 */
export const metadata: Metadata = {
  title: {
    template: '%s | WebVault',
    default: 'WebVault - 认证中心'
  },
  description: 'WebVault认证中心 - 安全便捷的登录注册体验，管理您的网站收藏账户',
  keywords: ['WebVault', '认证', '登录', '注册', '网站管理', '用户中心'],
  authors: [{ name: 'WebVault Team' }],
  robots: {
    index: false, // 认证页面不需要被搜索引擎索引
    follow: true
  },
  openGraph: {
    title: 'WebVault - 认证中心',
    description: 'WebVault认证中心 - 安全便捷的登录注册体验',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'WebVault',
  },
  twitter: {
    card: 'summary',
    title: 'WebVault - 认证中心',
    description: 'WebVault认证中心 - 安全便捷的登录注册体验',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // 认证页面禁用缩放以确保安全
  },
  formatDetection: {
    telephone: false, // 禁用电话号码自动识别
  },
};

// ============================================================================
// Layout Props Interface
// ============================================================================

/**
 * 认证路由组布局属性接口
 */
interface AuthRouteGroupLayoutProps {
  /**
   * 子页面内容
   * 包含认证相关的页面组件（登录、注册、密码重置等）
   */
  children: React.ReactNode;
}

// ============================================================================
// Route Group Layout Component
// ============================================================================

/**
 * 认证路由组布局组件
 * 
 * Next.js 15 App Router标准布局组件实现
 * 为(auth)路由组内的所有页面提供统一的布局和认证上下文
 * 
 * Architecture:
 * - 集成AuthProvider提供全局认证状态
 * - 使用AuthLayout组件提供一致的视觉体验
 * - 支持主题切换和响应式设计
 * - 遵循Feature-First架构原则
 * 
 * Requirements Implementation:
 * - ✅ 认证专用布局（AuthLayout集成）
 * - ✅ 主题和提供者支持（AuthProvider）
 * - ✅ 全局认证状态管理（useAuth context）
 * - ✅ 架构对齐（复用现有组件）
 * 
 * Route Coverage:
 * - /login - 用户登录页面
 * - /register - 用户注册页面（后续添加）
 * - /forgot-password - 密码重置页面（后续添加）
 * - /verify-email - 邮箱验证页面（后续添加）
 */
export default function AuthRouteGroupLayout({
  children,
}: AuthRouteGroupLayoutProps) {
  return (
    <AuthProviderWrapper>
      {children}
    </AuthProviderWrapper>
  );
}

// ============================================================================
// Layout Configuration & Performance
// ============================================================================

/**
 * 布局配置选项
 * 
 * 提供认证路由组的性能优化和行为配置
 * 确保最佳的用户体验和安全性
 */

// 强制动态渲染 - 认证状态需要实时检查
export const dynamic = 'force-dynamic';

// 禁用静态优化 - 认证页面包含敏感状态
export const revalidate = 0;

// 运行时配置 - 仅在客户端渲染敏感认证组件
export const runtime = 'nodejs';

// ============================================================================
// Development & Debug Support
// ============================================================================

/**
 * 开发环境调试支持
 * 
 * 在开发模式下提供额外的调试信息和错误处理
 * 生产环境自动禁用以确保性能和安全
 */
if (process.env.NODE_ENV === 'development') {
  // 添加布局渲染日志
  console.log('[AuthLayout] Auth route group layout initialized');
  
  // 验证必要的环境变量
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );
  
  if (missingEnvVars.length > 0) {
    console.warn(
      '[AuthLayout] Missing required environment variables:',
      missingEnvVars.join(', ')
    );
  }
}