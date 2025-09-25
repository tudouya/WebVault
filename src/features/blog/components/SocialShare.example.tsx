/**
 * SocialShare 组件使用示例
 *
 * 展示如何在博客详情页面中集成和使用社交分享组件
 * 包括不同配置选项和自定义回调处理
 */

import React from 'react';
import { SocialShare } from './SocialShare';

// Google Analytics gtag 类型定义
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function gtag(
  command: 'event',
  eventName: string,
  eventParameters?: {
    method?: string;
    content_type?: string;
    item_id?: string;
    [key: string]: string | number | undefined;
  }
): void;

/**
 * 基础使用示例
 */
export function BasicSocialShareExample() {
  return (
    <div className="space-y-8 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">基础社交分享</h2>
      
      <SocialShare
        title="WebVault: 个人网站目录管理平台"
        url="https://webvault.example.com/blog/introduction"
        description="一个功能完善的网站目录管理平台，支持用户提交、管理员审核、内容分类和博客推荐的完整工作流程"
      />
    </div>
  );
}

/**
 * 紧凑模式示例
 */
export function CompactSocialShareExample() {
  return (
    <div className="space-y-8 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">紧凑模式分享</h2>
      <p className="text-muted-foreground">适合在文章顶部或侧边栏使用</p>
      
      <SocialShare
        title="如何构建现代化的网站目录系统"
        url="https://webvault.example.com/blog/building-modern-directory"
        description="深入探讨如何使用 Next.js 和 Supabase 构建功能完整的网站目录管理系统"
        variant="compact"
        showTitle={false}
        className="bg-muted/50"
      />
    </div>
  );
}

/**
 * 带回调函数的示例
 */
export function SocialShareWithCallbacksExample() {
  const handleCopySuccess = () => {
    console.log('链接复制成功！');
    // 这里可以显示 toast 通知
    alert('链接已复制到剪贴板！');
  };

  const handleShare = (platform: string) => {
    const shareUrl = "https://webvault.example.com/blog/nextjs-15-features";
    console.log(`用户分享到 ${platform}:`, shareUrl);
    // 这里可以记录分析数据
  };

  return (
    <div className="space-y-8 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">带回调处理的分享</h2>
      
      <SocialShare
        title="Next.js 15 新特性详解"
        url="https://webvault.example.com/blog/nextjs-15-features"
        description="全面解析 Next.js 15 的新特性，包括 App Router 改进、性能优化和开发体验提升"
        onCopySuccess={handleCopySuccess}
        onShare={handleShare}
      />
    </div>
  );
}

/**
 * 不同尺寸示例
 */
export function SocialShareSizesExample() {
  const articleData = {
    title: "TypeScript 最佳实践指南",
    url: "https://webvault.example.com/blog/typescript-best-practices",
    description: "深入探讨 TypeScript 在大型项目中的最佳实践，包括类型设计、性能优化和团队协作"
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">不同尺寸的分享组件</h2>
      
      <div className="grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">小尺寸 (sm)</h3>
          <SocialShare
            {...articleData}
            size="sm"
            variant="compact"
            showTitle={false}
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">默认尺寸 (default)</h3>
          <SocialShare
            {...articleData}
            size="default"
            showTitle={false}
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">大尺寸 (lg)</h3>
          <SocialShare
            {...articleData}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 博客详情页集成示例
 */
export function BlogDetailPageIntegrationExample() {
  // 模拟博客文章数据
  const articleData = {
    title: "构建可扩展的 React 组件库",
    slug: "building-scalable-react-component-library",
    url: "https://webvault.example.com/blog/building-scalable-react-component-library",
    description: "学习如何从零开始构建一个可扩展、可维护的 React 组件库，包括设计系统、构建工具和文档化",
    author: {
      name: "张开发",
      bio: "前端架构师，专注于 React 生态系统和组件设计"
    },
    publishedAt: "2024-01-15",
    category: "前端开发",
    tags: ["React", "组件库", "设计系统", "TypeScript"]
  };

  const handleShare = (platform: string) => {
    // 发送分析事件
    if (typeof window !== 'undefined' && (window as Window & { gtag?: typeof gtag }).gtag) {
      (window as Window & { gtag?: typeof gtag }).gtag!('event', 'share', {
        method: platform,
        content_type: 'article',
        item_id: articleData.slug
      });
    }

    console.log(`文章分享: ${platform} - ${articleData.title}`);
  };

  const handleCopySuccess = () => {
    // 显示成功提示
    console.log('文章链接已复制');

    // 记录复制事件
    if (typeof window !== 'undefined' && (window as Window & { gtag?: typeof gtag }).gtag) {
      (window as Window & { gtag?: typeof gtag }).gtag!('event', 'copy_link', {
        content_type: 'article',
        item_id: articleData.slug
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 文章标题和基本信息 */}
      <header className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {articleData.title}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>作者: {articleData.author.name}</span>
          <span>•</span>
          <span>{new Date(articleData.publishedAt).toLocaleDateString('zh-CN')}</span>
          <span>•</span>
          <span>分类: {articleData.category}</span>
        </div>
      </header>

      {/* 文章内容区域 */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* 主要内容 */}
        <article className="lg:col-span-8 prose prose-lg max-w-none">
          <p>
            本文将深入探讨如何构建一个现代化的 React 组件库...
          </p>
          {/* 更多文章内容 */}
        </article>

        {/* 侧边栏 */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6">
            {/* 作者信息卡片 */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">关于作者</h3>
              <p className="text-sm text-muted-foreground">
                {articleData.author.bio}
              </p>
            </div>

            {/* 社交分享组件 */}
            <SocialShare
              title={articleData.title}
              url={articleData.url}
              description={articleData.description}
              onShare={handleShare}
              onCopySuccess={handleCopySuccess}
              className="sticky top-32"
            />

            {/* 标签云 */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">相关标签</h3>
              <div className="flex flex-wrap gap-2">
                {articleData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 底部分享区域 */}
      <footer className="border-t border-border pt-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">觉得这篇文章有用？</h3>
          <p className="text-muted-foreground">分享给更多的开发者朋友吧！</p>
        </div>
        
        <SocialShare
          title={articleData.title}
          url={articleData.url}
          description={articleData.description}
          onShare={handleShare}
          onCopySuccess={handleCopySuccess}
          className="max-w-2xl mx-auto"
        />
      </footer>
    </div>
  );
}

/**
 * 完整示例导出
 */
export default function SocialShareExamples() {
  return (
    <div className="space-y-16">
      <BasicSocialShareExample />
      <CompactSocialShareExample />
      <SocialShareWithCallbacksExample />
      <SocialShareSizesExample />
      <BlogDetailPageIntegrationExample />
    </div>
  );
}