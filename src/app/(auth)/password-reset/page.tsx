/**
 * Password Reset Page Route
 * 
 * Next.js页面路由，用于密码重置功能。
 * 集成PasswordResetPage组件，提供完整的密码重置流程。
 * 
 * Requirements:
 * - 3.1: 密码重置请求 - 导航到密码重置页面
 * - 3.2: 密码重置流程完整性 - 完整的用户体验流程
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

'use client';

import { PasswordResetPage } from '@/features/auth';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Password Reset Page
 * 
 * 密码重置页面路由组件，提供完整的密码重置请求功能。
 */
export default function PasswordResetRoute() {
  return (
    <PasswordResetPage
      onSuccess={(result) => {
        // 密码重置邮件发送成功的处理
        console.log('Password reset email sent successfully:', result);
      }}
      onError={(error) => {
        // 密码重置请求失败的处理
        console.error('Password reset request failed:', error);
      }}
      onBackToLogin={() => {
        // 返回登录页面的处理
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }}
    />
  );
}