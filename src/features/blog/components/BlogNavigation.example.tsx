/**
 * BlogNavigation组件使用示例
 * 
 * 展示BlogNavigation组件在不同场景下的使用方法
 * 包括基础用法、自定义回调和错误处理示例
 */

'use client';

import React, { useState } from 'react';
import { BlogNavigation } from './BlogNavigation';
import { Button } from '@/components/ui/button';

/**
 * 示例文章数据
 */
const sampleArticles = [
  {
    title: '深入理解React状态管理',
    category: 'Technologies',
    slug: 'react-state-management'
  },
  {
    title: '现代设计系统构建指南',
    category: 'Design',
    slug: 'design-system-guide'
  },
  {
    title: '个人成长的十个关键要素',
    category: 'Growth',
    slug: 'personal-growth-elements'
  },
  {
    title: '这是一个非常长的博客文章标题，用于测试文本截断功能是否能够正常工作在移动端和桌面端设备上',
    category: 'Lifestyle',
    slug: 'very-long-title-example'
  },
  {
    title: '数字游牧生活指南',
    category: 'Travel',
    slug: 'digital-nomad-guide'
  }
];

/**
 * BlogNavigation组件演示
 */
export function BlogNavigationExample() {
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [notifications, setNotifications] = useState<string[]>([]);

  const currentArticle = sampleArticles[currentArticleIndex];

  // 添加通知消息
  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 3000);
  };

  // 自定义返回按钮回调
  const handleBackClick = () => {
    addNotification('自定义返回按钮被点击 - 返回到博客列表');
  };

  // 自定义面包屑点击回调
  const handleBreadcrumbClick = (path: string) => {
    addNotification(`面包屑导航被点击 - 导航到: ${path}`);
  };

  // 切换文章
  const switchArticle = (index: number) => {
    setCurrentArticleIndex(index);
    addNotification(`切换到文章: ${sampleArticles[index].title.slice(0, 20)}...`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">BlogNavigation 组件演示</h1>
        <p className="text-muted-foreground">
          展示博客导航组件在不同场景下的使用效果
        </p>
      </div>

      {/* 通知消息 */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-right"
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      {/* 文章切换控制 */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">选择示例文章</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sampleArticles.map((article, index) => (
            <Button
              key={article.slug}
              variant={index === currentArticleIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchArticle(index)}
              className="text-left justify-start h-auto p-3"
            >
              <div className="space-y-1">
                <div className="font-medium text-sm leading-tight">
                  {article.title.length > 30 
                    ? `${article.title.slice(0, 30)}...` 
                    : article.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {article.category}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* 基础用法示例 */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">基础用法</h2>
        <BlogNavigation 
          article={currentArticle}
          className="border rounded-lg p-4 bg-background"
        />
      </div>

      {/* 自定义回调示例 */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">自定义回调处理</h2>
        <p className="text-sm text-muted-foreground mb-4">
          点击返回按钮和面包屑导航将触发自定义回调函数
        </p>
        <BlogNavigation 
          article={currentArticle}
          onBackClick={handleBackClick}
          onBreadcrumbClick={handleBreadcrumbClick}
          className="border rounded-lg p-4 bg-background"
        />
      </div>

      {/* 错误处理示例 */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">错误处理示例</h2>
        <p className="text-sm text-muted-foreground mb-4">
          组件能够优雅处理无效分类和空标题
        </p>
        <div className="space-y-4">
          {/* 无效分类示例 */}
          <div>
            <h3 className="text-sm font-medium mb-2">无效分类处理</h3>
            <BlogNavigation 
              article={{
                title: '无效分类测试文章',
                category: 'invalid-category',
                slug: 'invalid-category-test'
              }}
              className="border rounded-lg p-4 bg-background"
            />
          </div>

          {/* 空标题示例 */}
          <div>
            <h3 className="text-sm font-medium mb-2">空标题处理</h3>
            <BlogNavigation 
              article={{
                title: '',
                category: 'Technologies',
                slug: 'empty-title-test'
              }}
              className="border rounded-lg p-4 bg-background"
            />
          </div>
        </div>
      </div>

      {/* 响应式设计预览 */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">响应式设计预览</h2>
        <p className="text-sm text-muted-foreground mb-4">
          在不同屏幕尺寸下查看组件的响应式表现
        </p>
        
        {/* 模拟移动端视口 */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">移动端视图 (320px宽度)</h3>
            <div className="w-80 border rounded-lg overflow-hidden">
              <BlogNavigation 
                article={currentArticle}
                className="p-4 bg-background"
              />
            </div>
          </div>

          {/* 模拟平板视口 */}
          <div>
            <h3 className="text-sm font-medium mb-2">平板视图 (768px宽度)</h3>
            <div className="w-full max-w-2xl border rounded-lg overflow-hidden">
              <BlogNavigation 
                article={currentArticle}
                className="p-4 bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 组件API说明 */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">组件API</h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded border">
            <div className="font-mono text-blue-600">article</div>
            <div className="text-muted-foreground">必需</div>
            <div>文章信息对象，包含title、category、slug字段</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded border">
            <div className="font-mono text-blue-600">className</div>
            <div className="text-muted-foreground">可选</div>
            <div>自定义CSS类名</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded border">
            <div className="font-mono text-blue-600">onBackClick</div>
            <div className="text-muted-foreground">可选</div>
            <div>返回按钮点击回调函数</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded border">
            <div className="font-mono text-blue-600">onBreadcrumbClick</div>
            <div className="text-muted-foreground">可选</div>
            <div>面包屑导航点击回调函数</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogNavigationExample;