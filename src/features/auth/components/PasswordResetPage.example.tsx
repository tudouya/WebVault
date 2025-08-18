/**
 * PasswordResetPage Component Usage Example
 * 
 * 展示如何在不同场景下使用PasswordResetPage组件
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

'use client';

import React from 'react';
import { PasswordResetPage } from './PasswordResetPage';

// ============================================================================
// Example 1: 基础用法 - 在独立页面中使用
// ============================================================================

export function BasicPasswordResetExample() {
  return (
    <PasswordResetPage
      onSuccess={(result) => {
        console.log('密码重置邮件发送成功:', result);
        // 可以在这里添加成功提示或页面跳转逻辑
      }}
      onError={(error) => {
        console.error('密码重置请求失败:', error);
        // 可以在这里添加错误处理逻辑
      }}
      onBackToLogin={() => {
        // 返回登录页面的逻辑
        window.location.href = '/login';
      }}
    />
  );
}

// ============================================================================
// Example 2: 集成到路由中 - 与Next.js router集成
// ============================================================================

export function RouterIntegratedExample() {
  // 注意：在实际使用中，应该使用 useRouter from 'next/navigation'
  const handleBackToLogin = () => {
    // router.push('/login');
    console.log('导航到登录页面');
  };

  const handleSuccess = (result: { success: boolean; email: string }) => {
    console.log(`重置邮件已发送到 ${result.email}`);
    // 可以保存成功状态到本地存储或状态管理器
    localStorage.setItem('passwordResetSent', 'true');
    localStorage.setItem('passwordResetEmail', result.email);
  };

  const handleError = (error: string) => {
    console.error('密码重置失败:', error);
    // 可以显示全局错误提示
  };

  return (
    <PasswordResetPage
      onSuccess={handleSuccess}
      onError={handleError}
      onBackToLogin={handleBackToLogin}
      returnUrl="/dashboard" // 设置成功后的返回URL
      autoFocus={true} // 自动聚焦邮箱输入框
      debug={process.env.NODE_ENV === 'development'} // 开发模式下启用调试
    />
  );
}

// ============================================================================
// Example 3: 自定义样式和配置
// ============================================================================

export function CustomizedPasswordResetExample() {
  return (
    <PasswordResetPage
      className="custom-reset-page" // 自定义CSS类名
      onSuccess={(result) => {
        // 自定义成功处理逻辑
        alert(`重置邮件已发送到 ${result.email}`);
      }}
      onError={(error) => {
        // 自定义错误处理
        alert(`密码重置失败: ${error}`);
      }}
      onBackToLogin={() => {
        // 自定义返回逻辑
        if (confirm('确定要返回登录页面吗？')) {
          window.history.back();
        }
      }}
      autoFocus={false} // 禁用自动聚焦
    />
  );
}

// ============================================================================
// Example 4: 集成到模态框中使用
// ============================================================================

export function ModalPasswordResetExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        忘记密码？
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-md w-full max-h-[90vh] overflow-auto">
            <PasswordResetPage
              onSuccess={(result) => {
                console.log('密码重置成功:', result);
                setIsOpen(false); // 关闭模态框
              }}
              onError={(error) => {
                console.error('密码重置失败:', error);
                // 可以选择是否关闭模态框
              }}
              onBackToLogin={() => {
                setIsOpen(false); // 关闭模态框
                // 可以触发其他导航逻辑
              }}
            />
            
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: 状态管理集成示例
// ============================================================================

export function StateManagementExample() {
  const [resetState, setResetState] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [email, setEmail] = React.useState('');

  return (
    <div>
      {/* 状态指示器 */}
      <div className="mb-4 text-sm text-gray-600">
        状态: {resetState === 'idle' && '等待输入'}
        {resetState === 'sending' && '发送中...'}
        {resetState === 'sent' && `重置邮件已发送到 ${email}`}
        {resetState === 'error' && '发送失败，请重试'}
      </div>

      <PasswordResetPage
        onSuccess={(result) => {
          setResetState('sent');
          setEmail(result.email);
        }}
        onError={() => {
          setResetState('error');
        }}
        onBackToLogin={() => {
          setResetState('idle');
          // 执行导航逻辑
        }}
      />
    </div>
  );
}

// ============================================================================
// 导出所有示例
// ============================================================================

export default {
  BasicPasswordResetExample,
  RouterIntegratedExample,
  CustomizedPasswordResetExample,
  ModalPasswordResetExample,
  StateManagementExample,
};