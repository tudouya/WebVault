/**
 * SEO验证脚本
 * 
 * 用于验证网站详情页面的SEO实现是否符合以下需求：
 * - NFR-3.4.1: 动态meta标签生成
 * - NFR-3.4.2: Open Graph和Twitter Cards支持
 * - NFR-3.4.3: Schema.org结构化数据标记
 * 
 * 使用方法: npm run validate-seo
 */

import { validateAndReport } from '../src/features/websites/utils/seoValidation';
import { WebsiteDetailData } from '../src/features/websites/types/detail';

// 测试数据 - React 官方文档
const testWebsiteData: WebsiteDetailData = {
  id: 'react-docs',
  title: 'React 官方文档',
  description: 'React 是一个用于构建用户界面的 JavaScript 库。学习如何在 React 应用中声明性地描述 UI，并通过组件构建交互式界面。包含完整的API参考和教程指南。',
  url: 'https://react.dev/',
  favicon_url: 'https://react.dev/favicon-32x32.png',
  screenshot_url: 'https://example.com/screenshots/react-dev.jpg',
  meta_title: 'React 官方文档 - 构建用户界面的 JavaScript 库',
  meta_description: '学习 React，一个用于构建用户界面的 JavaScript 库。包含最新的 Hooks、组件设计模式和最佳实践指南。适合前端开发者学习现代 React 开发技术。',
  category: {
    id: 'frontend',
    name: '前端开发',
    slug: 'frontend',
    description: '前端开发相关技术和工具',
    parentId: null,
    status: 'active' as const,
    sort_order: 1,
    website_count: 150,
    is_expanded: false,
    is_visible: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  tags: ['React', 'JavaScript', '前端', 'UI库', '官方文档', 'Web开发'],
  features: ['组件化开发', 'Virtual DOM', 'Hooks', 'JSX语法', 'React Router'],
  language: 'zh-CN',
  status: 'active',
  isAd: false,
  visitCount: 250000,
  is_featured: true,
  is_public: true,
  is_accessible: true,
  publisher: {
    id: 'react-team',
    name: 'React 团队',
    avatar_url: 'https://avatars.githubusercontent.com/u/6412038',
    website_url: 'https://github.com/facebook/react',
    published_count: 1,
    joined_at: '2023-03-01T00:00:00Z',
  },
  rating: 4.9,
  stats: {
    total_visits: 250000,
    monthly_visits: 85000,
    weekly_visits: 22000,
    daily_visits: 4500,
  },
  created_at: '2023-03-15T10:00:00Z',
  updated_at: '2024-01-15T14:30:00Z',
};

// 运行验证
console.log('🎯 Task 8.3: SEO和元数据验证');
console.log('📝 验证网站详情页面的SEO实现是否符合要求\n');

validateAndReport(testWebsiteData);

// 额外的验证测试
console.log('\n🧪 额外验证测试:');

// 测试最小化数据的SEO表现
const minimalWebsiteData: WebsiteDetailData = {
  id: 'minimal-test',
  title: 'Simple Tool',
  description: 'A simple online tool for testing.',
  url: 'https://example.com',
  tags: [],
  status: 'active',
  isAd: false,
  visitCount: 100,
  is_featured: false,
  is_public: true,
  is_accessible: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

console.log('\n--- 最小化数据测试 ---');
validateAndReport(minimalWebsiteData);

// 测试非公开网站的SEO表现
const privateWebsiteData: WebsiteDetailData = {
  ...testWebsiteData,
  id: 'private-test',
  is_public: false,
  status: 'inactive',
};

console.log('\n--- 非公开网站测试 ---');
validateAndReport(privateWebsiteData);