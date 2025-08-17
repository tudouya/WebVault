/**
 * RelatedWebsiteGrid 组件使用示例
 * 
 * 展示如何在网站详情页面中使用相关网站推荐组件
 */

import React from 'react';
import { RelatedWebsiteGrid } from './RelatedWebsiteGrid';
import type { WebsiteCardData } from '../types/website';

// 示例相关网站数据
const mockRelatedWebsites: WebsiteCardData[] = [
  {
    id: '1',
    title: 'GitHub',
    description: '全球最大的代码托管平台，支持Git版本控制系统',
    url: 'https://github.com',
    favicon_url: 'https://github.com/favicon.ico',
    tags: ['开发工具', 'Git', '代码托管'],
    category: '开发工具',
    visit_count: 15420,
    is_featured: true,
    created_at: '2023-01-01',
    updated_at: '2023-12-01'
  },
  {
    id: '2', 
    title: 'GitLab',
    description: 'DevOps平台，提供Git仓库管理、CI/CD、问题跟踪等功能',
    url: 'https://gitlab.com',
    favicon_url: 'https://gitlab.com/favicon.ico',
    tags: ['开发工具', 'DevOps', 'CI/CD'],
    category: '开发工具',
    visit_count: 8750,
    is_featured: false,
    created_at: '2023-01-15',
    updated_at: '2023-11-28'
  },
  {
    id: '3',
    title: 'Bitbucket',
    description: 'Atlassian提供的Git代码管理和协作工具',
    url: 'https://bitbucket.org',
    favicon_url: 'https://bitbucket.org/favicon.ico',
    tags: ['开发工具', 'Git', 'Atlassian'],
    category: '开发工具',
    visit_count: 3250,
    is_featured: false,
    created_at: '2023-02-01',
    updated_at: '2023-11-20'
  },
  {
    id: '4',
    title: 'SourceForge',
    description: '历史悠久的开源软件开发和托管平台',
    url: 'https://sourceforge.net',
    favicon_url: 'https://sourceforge.net/favicon.ico',
    tags: ['开源', '软件下载', '开发平台'],
    category: '开发工具',
    visit_count: 1890,
    is_featured: false,
    created_at: '2023-02-15',
    updated_at: '2023-10-30'
  },
  {
    id: '5',
    title: 'Codeberg',
    description: '非营利的Git托管平台，专注于自由和开源软件',
    url: 'https://codeberg.org',
    favicon_url: 'https://codeberg.org/favicon.ico',
    tags: ['开源', 'Git', '非营利'],
    category: '开发工具',
    visit_count: 980,
    is_featured: false,
    created_at: '2023-03-01',
    updated_at: '2023-11-10'
  },
  {
    id: '6',
    title: 'Azure DevOps',
    description: 'Microsoft提供的企业级DevOps解决方案',
    url: 'https://dev.azure.com',
    favicon_url: 'https://dev.azure.com/favicon.ico',
    tags: ['Microsoft', 'DevOps', '企业'],
    category: '开发工具',
    visit_count: 6780,
    is_featured: true,
    created_at: '2023-03-15',
    updated_at: '2023-12-05'
  }
];

// 基础使用示例
export function BasicExample() {
  const handleVisitWebsite = (website: WebsiteCardData) => {
    console.log('访问网站:', website.title);
    // 这里可以添加访问统计等逻辑
  };

  const handleTagClick = (tag: string) => {
    console.log('点击标签:', tag);
    // 这里可以导航到标签搜索页面
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">RelatedWebsiteGrid 示例</h1>
      
      {/* 基础用法 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">基础用法</h2>
        <RelatedWebsiteGrid
          relatedWebsites={mockRelatedWebsites}
          onVisitWebsite={handleVisitWebsite}
          onTagClick={handleTagClick}
        />
      </section>
    </div>
  );
}

// 自定义标题示例
export function CustomTitleExample() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">自定义标题</h2>
      <RelatedWebsiteGrid
        relatedWebsites={mockRelatedWebsites.slice(0, 4)}
        title="推荐工具"
        maxItems={4}
      />
    </div>
  );
}

// 限制数量示例
export function LimitedItemsExample() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">限制显示数量</h2>
      <RelatedWebsiteGrid
        relatedWebsites={mockRelatedWebsites}
        title="精选推荐"
        maxItems={3}
      />
    </div>
  );
}

// 无标题示例
export function NoTitleExample() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">无标题模式</h2>
      <RelatedWebsiteGrid
        relatedWebsites={mockRelatedWebsites.slice(0, 3)}
        showTitle={false}
      />
    </div>
  );
}

// 空状态示例
export function EmptyStateExample() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">空状态（不显示任何内容）</h2>
      <div className="border border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">当没有相关网站时，组件不会渲染</p>
        <RelatedWebsiteGrid
          relatedWebsites={[]}
          title="空的推荐列表"
        />
        <p className="text-muted-foreground text-sm mt-4">
          ↑ 上面应该看不到任何内容
        </p>
      </div>
    </div>
  );
}

// 在网站详情页面中的使用示例
export function WebsiteDetailPageExample() {
  const mockWebsiteDetail = {
    id: 'main-website',
    title: 'Vue.js',
    description: '渐进式 JavaScript 框架',
    url: 'https://vuejs.org',
    // ... 其他字段
    related_websites: mockRelatedWebsites.slice(0, 4)
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 模拟网站详情页面的主要内容 */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-4">{mockWebsiteDetail.title}</h1>
        <p className="text-muted-foreground mb-6">{mockWebsiteDetail.description}</p>
        <div className="flex items-center gap-4">
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">
            访问网站
          </button>
          <button className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg">
            分享
          </button>
        </div>
      </div>

      {/* 相关网站推荐 - 通常放在页面底部 */}
      <RelatedWebsiteGrid
        relatedWebsites={mockWebsiteDetail.related_websites || []}
        title="相关工具推荐"
        maxItems={6}
        className="mt-12"
      />
    </div>
  );
}

// 完整示例页面
export function RelatedWebsiteGridExamples() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <BasicExample />
        <div className="space-y-12">
          <CustomTitleExample />
          <LimitedItemsExample />
          <NoTitleExample />
          <EmptyStateExample />
          <WebsiteDetailPageExample />
        </div>
      </div>
    </div>
  );
}

export default RelatedWebsiteGridExamples;