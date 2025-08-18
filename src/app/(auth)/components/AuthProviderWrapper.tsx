/**
 * Auth Provider Wrapper - Client Component
 * 
 * 客户端组件包装器，用于在认证路由组中提供认证上下文和布局
 * 解决Next.js 15 App Router中服务端组件无法使用客户端hooks的限制
 * 
 * Requirements:
 * - 任务17: 认证上下文提供者和全局认证状态集成
 * - 客户端渲染: 支持React hooks和上下文
 * - 架构对齐: 复用现有的AuthProvider和AuthLayout组件
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

'use client';

import React from 'react';
import { AuthProvider } from '@/features/auth/hooks';
import { AuthLayout } from '@/features/auth/components';

// ============================================================================
// Props Interface
// ============================================================================

/**
 * 认证提供者包装器属性接口
 */
interface AuthProviderWrapperProps {
  /**
   * 子组件内容（认证页面）
   */
  children: React.ReactNode;
}

// ============================================================================
// Auth Provider Wrapper Component
// ============================================================================

/**
 * 认证提供者包装器组件
 * 
 * 为认证路由组提供客户端渲染的认证上下文和统一布局
 * 集成AuthProvider和AuthLayout，确保在Next.js App Router中正确工作
 * 
 * Features:
 * - 客户端渲染支持
 * - 认证上下文提供（全局状态管理）
 * - 统一的认证页面布局
 * - 自动会话管理和刷新
 * - 开发环境调试支持
 * 
 * Requirements Implementation:
 * - ✅ 认证上下文提供者集成
 * - ✅ 全局认证状态管理
 * - ✅ AuthLayout组件复用
 * - ✅ 客户端组件兼容性
 */
export function AuthProviderWrapper({
  children,
}: AuthProviderWrapperProps) {
  return (
    <AuthProvider
      autoInitialize={true}
      autoRefresh={true}
      sessionCheckInterval={5 * 60 * 1000} // 5分钟检查间隔
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </AuthProvider>
  );
}

/**
 * 默认导出，提供向后兼容性
 */
export default AuthProviderWrapper;