'use client'

/**
 * Website Submission Page - /submit
 * 
 * 网站提交页面，允许用户提交优质网站资源到WebVault目录。
 * 使用新的SubmitPage组件提供完整的提交体验。
 * 
 * Features:
 * - 三步骤提交流程：Details → Payment → Publish
 * - 完整的表单验证和错误处理
 * - 响应式设计，支持移动端和桌面端
 * - 文件上传支持（图标和主图）
 * - 无障碍访问和键盘导航
 * 
 * Route: /(public)/submit
 * Layout: 使用公共布局，包含导航栏和页脚
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import { Suspense } from 'react';

// 导入新的SubmitPage组件
import { SubmitPage } from '@/features/submissions/components/SubmitPage';

// ============================================================================
// Page Metadata (moved to layout.tsx since this is now a client component)
// ============================================================================

// ============================================================================
// Loading Component
// ============================================================================

/**
 * 提交页面加载状态组件
 */
function SubmitPageSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* 页面标题骨架 */}
        <div className="text-center space-y-4">
          <div className="h-12 w-48 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-6 w-96 bg-muted animate-pulse rounded-md mx-auto" />
        </div>

        {/* 步骤指示器骨架 */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                {step < 3 && <div className="w-24 h-1 bg-muted animate-pulse ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* 表单骨架 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            {/* 表单字段骨架 */}
            {[1, 2, 3, 4, 5, 6].map((field) => (
              <div key={field} className="space-y-2">
                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                <div className="h-11 w-full bg-muted animate-pulse rounded-md" />
              </div>
            ))}
            
            {/* 提交按钮骨架 */}
            <div className="flex justify-start pt-4">
              <div className="h-11 w-32 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * 提交页面错误处理组件
 */
function SubmitPageError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">提交页面加载失败</h1>
          <p className="text-muted-foreground">
            抱歉，提交页面暂时无法访问。请稍后再试。
          </p>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive-foreground">
            错误信息: {error.message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            刷新页面
          </button>
          <a
            href="/"
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * Website Submission Page
 * 
 * 网站提交页面主组件，集成新的SubmitPage组件提供完整的提交体验。
 * 包含Suspense包装器和错误处理，确保良好的用户体验。
 * 
 * Features:
 * - 集成SubmitPage组件
 * - Suspense加载状态
 * - 错误边界处理
 * - SEO优化元数据
 * - 响应式设计
 */
export default function SubmitRoute() {
  // 处理提交成功
  const handleSubmitSuccess = (result: any) => {
    console.log('[SubmitRoute] Submission successful:', result);
    // 可以添加成功后的导航逻辑，如跳转到支付页面
    // router.push('/submit/payment');
  };

  // 处理提交失败
  const handleSubmitError = (error: string) => {
    console.error('[SubmitRoute] Submission failed:', error);
    // 可以添加错误处理逻辑，如显示Toast通知
  };

  return (
    <Suspense fallback={<SubmitPageSkeleton />}>
      <SubmitPage
        title="Submit Your Website"
        description="Share quality websites with the WebVault community. Help others discover valuable resources across Finance, Travel, Education, and more."
        onSubmitSuccess={handleSubmitSuccess}
        onSubmitError={handleSubmitError}
        className="min-h-screen"
      />
    </Suspense>
  );
}

// ============================================================================
// Export Types (for development)
// ============================================================================