/**
 * WebsiteDetailPage 使用示例
 * 
 * 展示 WebsiteDetailPage 组件的不同使用场景
 * 包括基础用法、自定义回调、加载状态等
 */

import React from 'react';
import { WebsiteDetailPage } from './WebsiteDetailPage';
import type { WebsiteDetailData } from '../types/detail';

// 模拟网站详情数据
const mockWebsiteData: WebsiteDetailData = {
  id: 'github-001',
  title: 'GitHub - Where the world builds software',
  description: 'GitHub is the world\'s largest software development platform. Collaborate, review code, manage projects, and build software alongside 73 million developers.',
  url: 'https://github.com',
  favicon_url: 'https://github.com/favicon.ico',
  screenshot_url: 'https://example.com/github-screenshot.jpg',
  tags: ['开发工具', '版本控制', '代码托管', '协作'],
  category: {
    id: 'dev-tools',
    name: '开发工具',
    slug: 'dev-tools',
    description: '开发工具分类',
    icon: '⚙️',
    color: '#3B82F6',
    website_count: 156,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-17T00:00:00Z'
  },
  status: 'active',
  rating: 4.8,
  visit_count: 15000,
  is_featured: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-08-17T00:00:00Z',
  
  // 详情页专有字段
  content: 'GitHub是一个基于Git的代码托管平台，为开发者提供代码存储、版本控制、协作开发等功能。支持公开和私有仓库，内置问题追踪、代码审查、项目管理等工具。',
  language: 'zh-CN',
  popularity_score: 0.95,
  last_checked_at: '2024-08-17T00:00:00Z',
  is_accessible: true,
  
  // 发布者信息
  publisher: {
    id: 'github-team',
    name: 'GitHub Team',
    avatar_url: 'https://github.com/github.png',
    bio: 'GitHub is how people build software.',
    website_url: 'https://github.com/about',
    published_count: 1,
    joined_at: '2008-04-10T00:00:00Z'
  },
  
  // SEO 元数据
  meta_title: 'GitHub - 全球最大的代码托管平台',
  meta_description: 'GitHub是全球最大的软件开发平台，为7300万开发者提供协作、代码审查、项目管理和软件构建服务。',
  
  // 统计数据
  stats: {
    total_visits: 15000,
    monthly_visits: 4500,
    weekly_visits: 1500,
    daily_visits: 300,
    bounce_rate: 0.25,
    avg_session_duration: 420
  },
  
  // 功能特性
  features: [
    '无限公开仓库',
    '强大的代码审查工具',
    '内置CI/CD（GitHub Actions）',
    '项目管理和问题追踪',
    '团队协作功能',
    'API和集成支持'
  ],
  
  // 定价信息
  pricing: {
    is_free: true,
    has_paid_plans: true,
    starting_price: '免费',
    currency: 'USD'
  },
  
  // 相关网站
  related_websites: [
    {
      id: 'gitlab-001',
      title: 'GitLab - DevOps Platform',
      description: 'GitLab是一个完整的DevOps平台，提供源码管理、CI/CD、监控等功能。',
      url: 'https://gitlab.com',
      favicon_url: 'https://gitlab.com/favicon.ico',
      image_url: 'https://example.com/gitlab-screenshot.jpg',
      tags: ['开发工具', '版本控制', 'DevOps'],
      category: '开发工具',
      isAd: false,
      rating: 4.6,
      visit_count: 8500,
      is_featured: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-08-17T00:00:00Z'
    },
    {
      id: 'bitbucket-001',
      title: 'Bitbucket - Git solution for teams',
      description: 'Bitbucket是Atlassian的Git代码托管服务，与Jira和Confluence深度集成。',
      url: 'https://bitbucket.org',
      favicon_url: 'https://bitbucket.org/favicon.ico',
      image_url: 'https://example.com/bitbucket-screenshot.jpg',
      tags: ['开发工具', '版本控制', '团队协作'],
      category: '开发工具',
      isAd: false,
      rating: 4.3,
      visit_count: 5200,
      is_featured: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-08-17T00:00:00Z'
    },
    {
      id: 'codeberg-001',
      title: 'Codeberg - 开源代码托管平台',
      description: 'Codeberg是一个基于Gitea的开源代码托管平台，致力于为开源项目提供免费服务。',
      url: 'https://codeberg.org',
      favicon_url: 'https://codeberg.org/favicon.ico',
      image_url: 'https://example.com/codeberg-screenshot.jpg',
      tags: ['开发工具', '开源', '代码托管'],
      category: '开发工具',
      isAd: false,
      rating: 4.1,
      visit_count: 1800,
      is_featured: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-08-17T00:00:00Z'
    }
  ]
};

/**
 * 基础使用示例
 */
export function BasicWebsiteDetailExample() {
  return (
    <div className="min-h-screen">
      <WebsiteDetailPage
        initialData={mockWebsiteData}
        showNavigation={true}
        showBreadcrumb={true}
        showFooter={true}
      />
    </div>
  );
}

/**
 * 自定义回调示例
 */
export function CustomCallbacksExample() {
  const handleWebsiteVisit = async (websiteId: string, url: string) => {
    console.log('访问网站:', { websiteId, url });
    // 这里可以添加自定义的访问统计逻辑
    // 比如发送到自定义分析服务
  };
  
  const handleTagClick = (tag: string) => {
    console.log('点击标签:', tag);
    // 这里可以添加标签点击处理逻辑
    // 比如导航到标签搜索页面
  };
  
  const handleBreadcrumbClick = (path: string) => {
    console.log('面包屑导航:', path);
    // 这里可以添加自定义导航逻辑
  };

  return (
    <div className="min-h-screen">
      <WebsiteDetailPage
        initialData={mockWebsiteData}
        onWebsiteVisit={handleWebsiteVisit}
        onTagClick={handleTagClick}
        onBreadcrumbClick={handleBreadcrumbClick}
      />
    </div>
  );
}

/**
 * 加载状态示例
 */
export function LoadingStateExample() {
  const [isLoading, setIsLoading] = React.useState(true);
  
  // 模拟加载过程
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      <WebsiteDetailPage
        initialData={mockWebsiteData}
        isLoading={isLoading}
      />
    </div>
  );
}

/**
 * 最小配置示例
 */
export function MinimalExample() {
  return (
    <div className="min-h-screen">
      <WebsiteDetailPage
        initialData={mockWebsiteData}
        showNavigation={false}
        showBreadcrumb={false}
        showFooter={false}
        className="bg-gray-50"
      />
    </div>
  );
}

/**
 * 无相关网站推荐示例
 */
export function NoRelatedWebsitesExample() {
  const dataWithoutRelated = {
    ...mockWebsiteData,
    related_websites: []
  };

  return (
    <div className="min-h-screen">
      <WebsiteDetailPage
        initialData={dataWithoutRelated}
      />
    </div>
  );
}

/**
 * 无发布者信息示例
 */
export function NoPublisherExample() {
  const dataWithoutPublisher = {
    ...mockWebsiteData,
    publisher: undefined
  };

  return (
    <div className="min-h-screen">
      <WebsiteDetailPage
        initialData={dataWithoutPublisher}
      />
    </div>
  );
}

/**
 * 组件演示容器
 */
export function WebsiteDetailPageExamples() {
  const [currentExample, setCurrentExample] = React.useState('basic');
  
  const examples = [
    { key: 'basic', label: '基础用法', component: BasicWebsiteDetailExample },
    { key: 'callbacks', label: '自定义回调', component: CustomCallbacksExample },
    { key: 'loading', label: '加载状态', component: LoadingStateExample },
    { key: 'minimal', label: '最小配置', component: MinimalExample },
    { key: 'no-related', label: '无相关推荐', component: NoRelatedWebsitesExample },
    { key: 'no-publisher', label: '无发布者', component: NoPublisherExample },
  ];
  
  const CurrentComponent = examples.find(ex => ex.key === currentExample)?.component || BasicWebsiteDetailExample;

  return (
    <div className="w-full">
      {/* 示例选择器 */}
      <div className="sticky top-0 z-50 bg-white border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">WebsiteDetailPage 组件示例</h2>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.key}
                onClick={() => setCurrentExample(example.key)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentExample === example.key
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 当前示例 */}
      <div className="w-full">
        <CurrentComponent />
      </div>
    </div>
  );
}

export default WebsiteDetailPageExamples;