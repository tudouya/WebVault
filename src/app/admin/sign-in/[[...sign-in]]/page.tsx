/**
 * Admin Sign In Page
 * 
 * 管理员登录页面 - 使用 Clerk 认证组件
 * 
 * @version 1.0.0
 * @created 2025-08-25
 */

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            WebVault 管理员登录
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            请使用管理员账号登录系统
          </p>
        </div>
        
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 
                  'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors',
                card: 'shadow-lg border border-gray-200 dark:border-gray-700',
                headerTitle: 'text-gray-900 dark:text-white',
                headerSubtitle: 'text-gray-600 dark:text-gray-400',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}