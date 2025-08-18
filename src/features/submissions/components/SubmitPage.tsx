/**
 * SubmitPage Component
 * 
 * 完整的网站提交页面组件，组合StepIndicator和SubmissionForm提供完整的提交体验。
 * 实现清晰的页面结构、步骤指示和响应式布局，支持键盘导航和无障碍访问。
 * 
 * Requirements:
 * - Requirement 1: 页面布局和导航 - 清晰的页面结构和步骤指示
 * - Requirement 8: 响应式设计和可访问性 - 多设备适配和无障碍支持
 * 
 * Features:
 * - 页面标题和描述展示
 * - 三步骤进度指示器集成
 * - 完整的提交表单界面
 * - 响应式布局（移动端单列，桌面端适当布局）
 * - 键盘导航和屏幕阅读器支持
 * - 与项目布局模式保持一致
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// 导入现有组件
import { StepIndicator } from './StepIndicator';
import { SubmissionForm } from './SubmissionForm';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * SubmitPage组件属性接口
 */
export interface SubmitPageProps {
  /** 自定义类名 */
  className?: string;
  /** 页面标题（可选，默认为"Submit"） */
  title?: string;
  /** 页面描述（可选） */
  description?: string;
  /** 提交成功回调 */
  onSubmitSuccess?: (result: any) => void;
  /** 提交失败回调 */
  onSubmitError?: (error: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SubmitPage - 网站提交完整页面组件
 * 
 * 组合StepIndicator和SubmissionForm组件，提供完整的网站提交体验。
 * 实现清晰的页面布局、步骤指示和响应式设计。
 * 
 * Usage:
 * ```tsx
 * // 基础用法
 * <SubmitPage />
 * 
 * // 自定义标题和回调
 * <SubmitPage 
 *   title="提交网站"
 *   description="分享您发现的优质网站资源"
 *   onSubmitSuccess={(result) => handleSuccess(result)}
 *   onSubmitError={(error) => handleError(error)}
 * />
 * ```
 */
export function SubmitPage({
  className,
  title = "Submit",
  description,
  onSubmitSuccess,
  onSubmitError,
}: SubmitPageProps) {
  
  // ========================================================================
  // Event Handlers
  // ========================================================================

  /**
   * 处理提交成功
   */
  const handleSubmitSuccess = (result: any) => {
    console.log('[SubmitPage] Submission successful:', result);
    onSubmitSuccess?.(result);
  };

  /**
   * 处理提交失败
   */
  const handleSubmitError = (error: string) => {
    console.error('[SubmitPage] Submission failed:', error);
    onSubmitError?.(error);
  };

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * 渲染页面头部
   */
  const renderPageHeader = () => (
    <div className="space-y-4 mb-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className={cn(
          "text-3xl font-bold tracking-tight text-foreground",
          "sm:text-4xl md:text-5xl"
        )}>
          {title}
        </h1>
        {description && (
          <p className={cn(
            "mt-3 text-base text-muted-foreground max-w-2xl mx-auto",
            "sm:text-lg md:text-xl"
          )}>
            {description}
          </p>
        )}
      </div>

      {/* 步骤指示器 */}
      <div className="max-w-4xl mx-auto">
        <StepIndicator
          currentStep="details"
          completedSteps={[]}
          className="w-full"
          aria-label="网站提交步骤进度"
        />
      </div>
    </div>
  );

  /**
   * 渲染主要内容区域
   */
  const renderMainContent = () => (
    <main 
      className="flex-1"
      role="main" 
      aria-label="网站提交表单"
    >
      <SubmissionForm
        title="提交网站"
        description="分享优质网站资源，让更多人发现有价值的内容"
        onSubmitSuccess={handleSubmitSuccess}
        onSubmitError={handleSubmitError}
        showStepIndicator={false} // 已在页面头部显示
        currentStep={1} // 当前在第一步Details
        className="w-full"
      />
    </main>
  );

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={cn(
      // 基础容器样式
      "min-h-screen bg-background",
      // 布局和间距
      "flex flex-col",
      // 响应式内边距
      "px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12",
      // 最大宽度约束
      "max-w-7xl mx-auto w-full",
      className
    )}>
      {/* Skip to main content link - 无障碍功能 */}
      <a 
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
          "z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md",
          "text-sm font-medium transition-all duration-200",
          "focus:ring-2 focus:ring-primary/20 focus:outline-none"
        )}
      >
        跳转到主要内容
      </a>

      {/* 页面头部 */}
      <header 
        className="flex-shrink-0"
        role="banner"
      >
        {renderPageHeader()}
      </header>

      {/* 主要内容区域 */}
      <div id="main-content" className="flex-1">
        {renderMainContent()}
      </div>

      {/* 页面底部（如需要可添加） */}
      <footer 
        className="flex-shrink-0 mt-12 pt-8 border-t border-border/50"
        role="contentinfo"
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            提交的网站将经过人工审核，通过后会发布在WebVault目录中
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default SubmitPage;