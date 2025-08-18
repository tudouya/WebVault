/**
 * AuthLayout 组件
 * 
 * 为认证页面提供一致的布局，包含品牌logo、主题支持和响应式设计
 * 基于设计图8_Login.png实现精确的视觉规范和用户体验
 * 
 * 需求引用:
 * - 9.1: 响应式设计和主题支持
 * - 11.1: 响应式设计和主题支持
 * 
 * 功能特性:
 * - 品牌展示和视觉识别
 * - 亮色/暗色主题支持
 * - 移动端响应式布局
 * - 一致的认证页面体验
 * - 精确配色系统集成
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

/**
 * AuthLayout组件属性接口
 */
export interface AuthLayoutProps {
  /**
   * 子组件内容
   */
  children: React.ReactNode;
  
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 页面标题
   */
  title?: string;
  
  /**
   * 页面描述
   */
  description?: string;
  
  /**
   * 是否显示品牌logo
   * @default true
   */
  showLogo?: boolean;
  
  /**
   * 是否显示背景装饰
   * @default true
   */
  showBackground?: boolean;
  
  /**
   * 布局变体
   * @default 'default'
   */
  variant?: 'default' | 'minimal' | 'centered';
  
  /**
   * 加载状态
   */
  isLoading?: boolean;
}

/**
 * 品牌Logo组件
 * 基于设计图实现的品牌标识展示
 */
function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-3",
      className
    )}>
      {/* Logo图标 */}
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        "bg-gradient-to-br from-primary to-primary/80",
        "shadow-lg shadow-primary/25",
        "transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6 text-primary-foreground"
          aria-hidden="true"
        >
          <path
            d="M12 2L2 7l10 5 10-5-10-5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m2 17 10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m2 12 10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* 品牌名称 */}
      <div className="flex flex-col">
        <span className={cn(
          "text-xl font-bold text-foreground",
          "tracking-tight"
        )}>
          WebVault
        </span>
        <span className={cn(
          "text-xs text-muted-foreground",
          "tracking-wide uppercase font-medium"
        )}>
          网站目录管理
        </span>
      </div>
    </div>
  );
}

/**
 * 背景装饰组件
 * 创建现代化的背景效果，增强视觉层次
 */
function BackgroundDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 渐变背景 */}
      <div className={cn(
        "absolute inset-0",
        "bg-gradient-to-br from-background via-background to-muted/20"
      )} />
      
      {/* 几何装饰元素 */}
      <div className={cn(
        "absolute -top-40 -right-32 h-80 w-80 rounded-full",
        "bg-gradient-to-br from-primary/10 to-transparent",
        "blur-3xl opacity-50"
      )} />
      
      <div className={cn(
        "absolute -bottom-40 -left-32 h-80 w-80 rounded-full",
        "bg-gradient-to-tr from-secondary/10 to-transparent",
        "blur-3xl opacity-50"
      )} />
      
      {/* 网格背景 - 仅在大屏幕显示 */}
      <div className={cn(
        "hidden lg:block absolute inset-0",
        "bg-[linear-gradient(rgba(var(--border)_/_0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--border)_/_0.1)_1px,transparent_1px)]",
        "bg-[size:4rem_4rem]",
        "[mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
      )} />
    </div>
  );
}

/**
 * AuthLayout 认证页面布局组件
 * 
 * 提供一致的认证页面布局，集成品牌展示、主题系统和响应式设计
 * 支持多种布局变体，适配不同认证场景的需求
 */
export function AuthLayout({
  children,
  className,
  title,
  description,
  showLogo = true,
  showBackground = true,
  variant = 'default',
  isLoading = false,
}: AuthLayoutProps) {
  return (
    <div className={cn(
      // 基础布局
      "min-h-screen bg-background",
      "flex flex-col lg:flex-row",
      // 确保内容居中
      "relative",
      className
    )}>
      {/* 背景装饰 */}
      {showBackground && <BackgroundDecorations />}
      
      {/* 左侧品牌区域 - 桌面端显示，缩小比例 */}
      <div className={cn(
        // 基础布局 - 减少宽度比例
        "relative z-10",
        // 桌面端样式 - 从flex-1改为固定宽度
        "hidden lg:flex lg:w-[35%] lg:flex-col lg:justify-center lg:px-6",
        // 背景和装饰
        "bg-muted/30 border-r border-border"
      )}>
        <div className="mx-auto max-w-md">
          {/* 品牌logo */}
          {showLogo && (
            <div className="mb-8">
              <BrandLogo />
            </div>
          )}
          
          {/* 品牌描述 - 固定内容，不使用传入的title/description */}
          <div className="space-y-4">
            <h1 className={cn(
              "text-3xl font-bold tracking-tight text-foreground",
              "lg:text-4xl"
            )}>
              欢迎使用 WebVault
            </h1>
            <p className={cn(
              "text-lg text-muted-foreground leading-relaxed"
            )}>
              专业的网站目录管理平台，帮助您收藏、分类和管理优质网站资源。
            </p>
          </div>
          
          {/* 简化的特性列表 */}
          <div className="mt-6 space-y-2">
            {[
              "智能分类管理",
              "高效搜索筛选"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={cn(
                  "flex h-1.5 w-1.5 rounded-full bg-primary",
                  "shadow-sm shadow-primary/40"
                )} />
                <span className="text-xs text-muted-foreground">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 右侧认证表单区域 - 扩大比例突出表单 */}
      <div className={cn(
        // 基础布局 - 占据更多空间
        "relative z-10 flex flex-1 flex-col justify-center",
        "px-4 py-12 sm:px-6 lg:px-8",
        // 最大宽度控制 - 增加表单区域最大宽度
        "lg:max-w-lg lg:mx-auto lg:w-full"
      )}>
        {/* 移动端品牌logo */}
        {showLogo && (
          <div className="mb-8 lg:hidden">
            <div className="flex justify-center">
              <BrandLogo />
            </div>
          </div>
        )}
        
        {/* 移动端标题和描述 - 使用页面特定的内容 */}
        <div className="mb-6 text-center lg:hidden space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {title || "欢迎回到 WebVault"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {description || "登录您的账户，继续管理您的网站收藏"}
          </p>
        </div>
        
        {/* 表单卡片 */}
        <Card className={cn(
          // 基础样式
          "border-border/50 bg-card/50 backdrop-blur-sm",
          "shadow-xl shadow-black/5",
          // 响应式内边距
          "p-6 sm:p-8",
          // 过渡动画
          "transition-all duration-300",
          // 悬停效果
          "hover:shadow-2xl hover:shadow-black/10",
          // 加载状态
          isLoading && "opacity-75 pointer-events-none"
        )}>
          <CardContent className="p-0">
            {children}
          </CardContent>
        </Card>
      </div>
      
      {/* 全局加载覆盖层 */}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 z-50",
          "bg-background/80 backdrop-blur-sm",
          "flex items-center justify-center",
          "transition-all duration-300"
        )}>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full border border-primary/20" />
            </div>
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AuthLayout组件默认导出
 * 提供向后兼容性
 */
export default AuthLayout;