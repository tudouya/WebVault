/**
 * 网站详情页面 SEO 工具函数测试套件
 * 
 * 验证网站详情页面的SEO元数据生成功能是否符合以下需求：
 * - NFR-3.4.1: 动态meta标签生成
 * - NFR-3.4.2: Open Graph和Twitter Cards支持
 * - NFR-3.4.3: Schema.org结构化数据标记
 */

import {
  generateWebsiteMetadata,
  generateWebsiteStructuredData,
  validateWebsiteSEOData,
  generateSocialSharingUrls,
} from '../seoUtils';
import { WebsiteDetailData } from '../../types/detail';

// ========== 测试数据 ==========

const mockWebsiteData: WebsiteDetailData = {
  id: 'test-website-123',
  title: 'React 官方文档',
  description: 'React 是一个用于构建用户界面的 JavaScript 库。学习如何在 React 应用中声明性地描述 UI，并通过组件构建交互式界面。',
  url: 'https://react.dev/',
  favicon_url: 'https://react.dev/favicon-32x32.png',
  screenshot_url: 'https://example.com/screenshots/react-dev.jpg',
  meta_title: 'React 官方文档 - 构建用户界面的 JavaScript 库',
  meta_description: '学习 React，一个用于构建用户界面的 JavaScript 库。包含最新的 Hooks、组件设计模式和最佳实践指南。',
  category: {
    id: 'frontend',
    name: '前端开发',
    slug: 'frontend',
    description: '前端开发相关技术和工具',
  },
  tags: ['React', 'JavaScript', '前端', 'UI库', '官方文档'],
  features: ['组件化开发', 'Virtual DOM', 'Hooks', 'JSX语法'],
  language: 'zh-CN',
  status: 'active',
  is_public: true,
  is_accessible: true,
  publisher: {
    id: 'react-team',
    name: 'React 团队',
    avatar_url: 'https://avatars.githubusercontent.com/u/6412038',
    website_url: 'https://github.com/facebook/react',
  },
  rating: 4.8,
  stats: {
    total_visits: 125000,
    monthly_visits: 45000,
    weekly_visits: 12000,
    daily_visits: 2500,
  },
  created_at: '2023-03-15T10:00:00Z',
  updated_at: '2024-01-15T14:30:00Z',
};

const mockWebsiteDataMinimal: WebsiteDetailData = {
  id: 'minimal-website',
  title: 'Simple Tool',
  description: 'A simple online tool.',
  url: 'https://example.com',
  status: 'active',
  is_public: true,
  is_accessible: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ========== NFR-3.4.1: 动态 Meta 标签测试 ==========

describe('网站详情页面 SEO - 动态 Meta 标签生成 (NFR-3.4.1)', () => {
  describe('generateWebsiteMetadata', () => {
    it('应该生成包含动态标题和描述的完整元数据', () => {
      const metadata = generateWebsiteMetadata(mockWebsiteData);
      
      // 验证动态标题生成
      expect(metadata.title).toBe('React 官方文档 - 构建用户界面的 JavaScript 库');
      
      // 验证动态描述生成
      expect(metadata.description).toBe('学习 React，一个用于构建用户界面的 JavaScript 库。包含最新的 Hooks、组件设计模式和最佳实践指南。');
      
      // 验证关键词生成
      expect(metadata.keywords).toContain('React');
      expect(metadata.keywords).toContain('JavaScript');
      expect(metadata.keywords).toContain('前端开发');
      expect(metadata.keywords).toContain('WebVault');
      
      // 验证作者和发布者信息
      expect(metadata.authors).toEqual([{ name: 'WebVault Team' }]);
      expect(metadata.creator).toBe('WebVault');
      expect(metadata.publisher).toBe('WebVault');
    });

    it('应该在缺少自定义SEO标题时使用默认格式', () => {
      const websiteWithoutSEOTitle = {
        ...mockWebsiteData,
        meta_title: undefined,
      };
      
      const metadata = generateWebsiteMetadata(websiteWithoutSEOTitle);
      
      expect(metadata.title).toBe('React 官方文档 - WebVault');
    });

    it('应该在缺少自定义SEO描述时使用默认格式', () => {
      const websiteWithoutSEODescription = {
        ...mockWebsiteData,
        meta_description: undefined,
      };
      
      const metadata = generateWebsiteMetadata(websiteWithoutSEODescription);
      
      expect(metadata.description).toBe('React 是一个用于构建用户界面的 JavaScript 库。学习如何在 React 应用中声明性地描述 UI，并通过组件构建交互式界面。');
    });

    it('应该截断过长的描述至160字符', () => {
      const longDescription = '这是一个非常长的描述，'.repeat(20); // 约200字符
      const websiteWithLongDescription = {
        ...mockWebsiteData,
        meta_description: longDescription,
      };
      
      const metadata = generateWebsiteMetadata(websiteWithLongDescription);
      
      expect((metadata.description as string).length).toBeLessThanOrEqual(160);
      expect((metadata.description as string)).toMatch(/\.{3}$/); // 以...结尾
    });

    it('应该正确配置robots指令', () => {
      const metadata = generateWebsiteMetadata(mockWebsiteData);
      
      expect(metadata.robots?.index).toBe(true);
      expect(metadata.robots?.follow).toBe(true);
      expect(metadata.robots?.googleBot?.index).toBe(true);
      expect(metadata.robots?.googleBot?.follow).toBe(true);
      expect(metadata.robots?.googleBot?.['max-video-preview']).toBe(-1);
      expect(metadata.robots?.googleBot?.['max-image-preview']).toBe('large');
      expect(metadata.robots?.googleBot?.['max-snippet']).toBe(-1);
    });

    it('应该拒绝索引非公开或非活跃网站', () => {
      const inactiveWebsite = {
        ...mockWebsiteData,
        status: 'inactive' as const,
      };
      
      const metadata = generateWebsiteMetadata(inactiveWebsite);
      
      expect(metadata.robots?.index).toBe(false);
      expect(metadata.robots?.googleBot?.index).toBe(false);
    });

    it('应该生成正确的规范URL', () => {
      const metadata = generateWebsiteMetadata(mockWebsiteData);
      
      expect(metadata.alternates?.canonical).toBe('https://webvault.cn/website/test-website-123');
    });
  });
});

// ========== NFR-3.4.2: Open Graph 和 Twitter Cards 测试 ==========

describe('网站详情页面 SEO - Open Graph 和 Twitter Cards (NFR-3.4.2)', () => {
  describe('Open Graph 标签', () => {
    it('应该生成完整的 Open Graph 元数据', () => {
      const metadata = generateWebsiteMetadata(mockWebsiteData);
      
      expect(metadata.openGraph?.title).toBe('React 官方文档 - 构建用户界面的 JavaScript 库');
      expect(metadata.openGraph?.description).toBe('学习 React，一个用于构建用户界面的 JavaScript 库。包含最新的 Hooks、组件设计模式和最佳实践指南。');
      expect(metadata.openGraph?.type).toBe('website');
      expect(metadata.openGraph?.url).toBe('https://webvault.cn/website/test-website-123');
      expect(metadata.openGraph?.siteName).toBe('WebVault');
      expect(metadata.openGraph?.locale).toBe('zh_CN');
    });

    it('应该正确选择 Open Graph 图片', () => {
      const metadata = generateWebsiteMetadata(mockWebsiteData);
      
      expect(metadata.openGraph?.images).toHaveLength(1);
      expect(metadata.openGraph?.images?.[0]).toEqual({
        url: 'https://example.com/screenshots/react-dev.jpg',
        width: 1200,
        height: 630,
        alt: 'React 官方文档 - WebVault',
      });
    });

    it('应该在没有截图时使用网站图标', () => {
      const websiteWithoutScreenshot = {
        ...mockWebsiteData,
        screenshot_url: undefined,
      };
      
      const metadata = generateWebsiteMetadata(websiteWithoutScreenshot);
      
      expect(metadata.openGraph?.images?.[0]?.url).toBe('https://react.dev/favicon-32x32.png');
    });

    it('应该在没有图片时使用默认logo', () => {
      const websiteWithoutImages = {
        ...mockWebsiteData,
        screenshot_url: undefined,
        favicon_url: undefined,
      };
      
      const metadata = generateWebsiteMetadata(websiteWithoutImages);
      
      expect(metadata.openGraph?.images?.[0]?.url).toBe('/logo.svg');
    });
  });

  describe('Twitter Cards', () => {
    it('应该生成正确的 Twitter Card 元数据', () => {
      const metadata = generateWebsiteMetadata(mockWebsiteData);
      
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('React 官方文档 - 构建用户界面的 JavaScript 库');
      expect(metadata.twitter?.description).toBe('学习 React，一个用于构建用户界面的 JavaScript 库。包含最新的 Hooks、组件设计模式和最佳实践指南。');
      expect(metadata.twitter?.creator).toBe('@WebVault');
      expect(metadata.twitter?.images).toEqual(['https://example.com/screenshots/react-dev.jpg']);
    });
  });

  describe('社交分享URL生成', () => {
    it('应该生成所有平台的分享链接', () => {
      const shareUrls = generateSocialSharingUrls(mockWebsiteData);
      
      expect(shareUrls.twitter).toContain('https://twitter.com/intent/tweet');
      expect(shareUrls.twitter).toContain(encodeURIComponent('React 官方文档'));
      expect(shareUrls.twitter).toContain(encodeURIComponent('https://webvault.cn/website/test-website-123'));
      
      expect(shareUrls.facebook).toContain('https://www.facebook.com/sharer/sharer.php');
      expect(shareUrls.facebook).toContain(encodeURIComponent('https://webvault.cn/website/test-website-123'));
      
      expect(shareUrls.linkedin).toContain('https://www.linkedin.com/sharing/share-offsite/');
      expect(shareUrls.linkedin).toContain(encodeURIComponent('https://webvault.cn/website/test-website-123'));
      
      expect(shareUrls.reddit).toContain('https://reddit.com/submit');
      expect(shareUrls.reddit).toContain(encodeURIComponent('React 官方文档'));
      
      expect(shareUrls.telegram).toContain('https://t.me/share/url');
      expect(shareUrls.telegram).toContain(encodeURIComponent('React 官方文档'));
    });
  });
});

// ========== NFR-3.4.3: Schema.org 结构化数据测试 ==========

describe('网站详情页面 SEO - Schema.org 结构化数据 (NFR-3.4.3)', () => {
  describe('generateWebsiteStructuredData', () => {
    it('应该生成符合 Schema.org 标准的 WebPage 结构化数据', () => {
      const structuredData = generateWebsiteStructuredData(mockWebsiteData);
      
      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('WebPage');
      expect(structuredData['@id']).toBe('https://webvault.cn/website/test-website-123');
      expect(structuredData.url).toBe('https://webvault.cn/website/test-website-123');
      expect(structuredData.name).toBe('React 官方文档 - 构建用户界面的 JavaScript 库');
      expect(structuredData.description).toBe('学习 React，一个用于构建用户界面的 JavaScript 库。包含最新的 Hooks、组件设计模式和最佳实践指南。');
      expect(structuredData.datePublished).toBe('2023-03-15T10:00:00Z');
      expect(structuredData.dateModified).toBe('2024-01-15T14:30:00Z');
      expect(structuredData.inLanguage).toBe('zh-CN');
    });

    it('应该包含正确的主实体 WebSite 信息', () => {
      const structuredData = generateWebsiteStructuredData(mockWebsiteData);
      
      expect(structuredData.mainEntity['@type']).toBe('WebSite');
      expect(structuredData.mainEntity['@id']).toBe('https://react.dev/');
      expect(structuredData.mainEntity.name).toBe('React 官方文档');
      expect(structuredData.mainEntity.description).toBe('React 是一个用于构建用户界面的 JavaScript 库。学习如何在 React 应用中声明性地描述 UI，并通过组件构建交互式界面。');
      expect(structuredData.mainEntity.url).toBe('https://react.dev/');
      expect(structuredData.mainEntity.image).toBe('https://example.com/screenshots/react-dev.jpg');
      expect(structuredData.mainEntity.inLanguage).toBe('zh-CN');
    });

    it('应该包含发布者信息', () => {
      const structuredData = generateWebsiteStructuredData(mockWebsiteData);
      
      expect(structuredData.mainEntity.publisher['@type']).toBe('Person');
      expect(structuredData.mainEntity.publisher['@id']).toBe('https://webvault.cn/user/react-team');
      expect(structuredData.mainEntity.publisher.name).toBe('React 团队');
      expect(structuredData.mainEntity.publisher.image).toBe('https://avatars.githubusercontent.com/u/6412038');
      expect(structuredData.mainEntity.publisher.url).toBe('https://github.com/facebook/react');
    });

    it('应该包含评分信息', () => {
      const structuredData = generateWebsiteStructuredData(mockWebsiteData);
      
      expect(structuredData.mainEntity.aggregateRating['@type']).toBe('AggregateRating');
      expect(structuredData.mainEntity.aggregateRating.ratingValue).toBe(4.8);
      expect(structuredData.mainEntity.aggregateRating.ratingCount).toBe(1);
      expect(structuredData.mainEntity.aggregateRating.bestRating).toBe(5);
      expect(structuredData.mainEntity.aggregateRating.worstRating).toBe(1);
    });

    it('应该包含组织发布者信息', () => {
      const structuredData = generateWebsiteStructuredData(mockWebsiteData);
      
      expect(structuredData.publisher['@type']).toBe('Organization');
      expect(structuredData.publisher['@id']).toBe('https://webvault.cn');
      expect(structuredData.publisher.name).toBe('WebVault');
      expect(structuredData.publisher.url).toBe('https://webvault.cn');
      expect(structuredData.publisher.logo['@type']).toBe('ImageObject');
      expect(structuredData.publisher.logo.url).toBe('https://webvault.cn/logo.svg');
    });

    it('应该生成正确的面包屑导航', () => {
      const structuredData = generateWebsiteStructuredData(mockWebsiteData);
      
      expect(structuredData.breadcrumb['@type']).toBe('BreadcrumbList');
      expect(structuredData.breadcrumb.itemListElement).toHaveLength(4);
      
      // 检查面包屑项目
      const breadcrumbItems = structuredData.breadcrumb.itemListElement;
      expect(breadcrumbItems[0].position).toBe(1);
      expect(breadcrumbItems[0].name).toBe('WebVault');
      expect(breadcrumbItems[0].item).toBe('https://webvault.cn');
      
      expect(breadcrumbItems[1].position).toBe(2);
      expect(breadcrumbItems[1].name).toBe('网站目录');
      expect(breadcrumbItems[1].item).toBe('https://webvault.cn/');
      
      expect(breadcrumbItems[2].position).toBe(3);
      expect(breadcrumbItems[2].name).toBe('前端开发');
      expect(breadcrumbItems[2].item).toBe('https://webvault.cn/category/frontend');
      
      expect(breadcrumbItems[3].position).toBe(4);
      expect(breadcrumbItems[3].name).toBe('React 官方文档');
      expect(breadcrumbItems[3].item).toBe('https://webvault.cn/website/test-website-123');
    });

    it('应该包含标签和特性信息', () => {
      const structuredData = generateWebsiteStructuredData(mockWebsiteData);
      
      expect(structuredData.keywords).toBe('React, JavaScript, 前端, UI库, 官方文档');
      expect(structuredData.about).toHaveLength(4);
      expect(structuredData.about[0]['@type']).toBe('Thing');
      expect(structuredData.about[0].name).toBe('组件化开发');
    });

    it('应该处理没有分类的情况', () => {
      const websiteWithoutCategory = {
        ...mockWebsiteData,
        category: undefined,
      };
      
      const structuredData = generateWebsiteStructuredData(websiteWithoutCategory);
      
      expect(structuredData.breadcrumb.itemListElement).toHaveLength(3);
      expect(structuredData.breadcrumb.itemListElement[2].position).toBe(3);
      expect(structuredData.breadcrumb.itemListElement[2].name).toBe('React 官方文档');
    });

    it('应该处理错误情况并返回备用数据', () => {
      const invalidWebsite = {
        ...mockWebsiteData,
        id: null, // 故意设置无效数据
      } as any;
      
      const structuredData = generateWebsiteStructuredData(invalidWebsite);
      
      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('WebPage');
      expect(structuredData.name).toBe('React 官方文档 - 构建用户界面的 JavaScript 库');
    });
  });

  describe('元数据中的结构化数据注入', () => {
    it('应该在元数据other字段中包含结构化数据', () => {
      const metadata = generateWebsiteMetadata(mockWebsiteData);
      
      expect(metadata.other?.['application/ld+json']).toBeDefined();
      
      const structuredDataString = metadata.other?.['application/ld+json'] as string;
      const structuredData = JSON.parse(structuredDataString);
      
      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('WebPage');
    });
  });
});

// ========== SEO 数据验证测试 ==========

describe('网站详情页面 SEO - 数据验证', () => {
  describe('validateWebsiteSEOData', () => {
    it('应该验证完整的网站数据', () => {
      const validation = validateWebsiteSEOData(mockWebsiteData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.recommendations).toHaveLength(0);
    });

    it('应该识别必需字段缺失', () => {
      const invalidWebsite = {
        ...mockWebsiteData,
        title: '',
        url: 'invalid-url',
      };
      
      const validation = validateWebsiteSEOData(invalidWebsite);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('网站标题不能为空');
      expect(validation.issues).toContain('网站URL无效或缺失');
    });

    it('应该提供SEO改进建议', () => {
      const basicWebsite = {
        ...mockWebsiteDataMinimal,
        meta_title: undefined,
        meta_description: undefined,
        tags: undefined,
        screenshot_url: undefined,
        favicon_url: undefined,
        category: undefined,
      };
      
      const validation = validateWebsiteSEOData(basicWebsite);
      
      expect(validation.recommendations).toContain('建议添加自定义SEO标题以优化搜索结果显示');
      expect(validation.recommendations).toContain('建议添加自定义SEO描述以优化搜索结果摘要');
      expect(validation.recommendations).toContain('建议添加标签以提升内容分类和发现性');
      expect(validation.recommendations).toContain('建议添加网站截图或图标以提升社交分享效果');
      expect(validation.recommendations).toContain('建议分配网站分类以提升内容组织和SEO结构');
    });

    it('应该警告内容长度问题', () => {
      const problematicWebsite = {
        ...mockWebsiteData,
        title: '短',
        description: '很短的描述',
      };
      
      const validation = validateWebsiteSEOData(problematicWebsite);
      
      expect(validation.recommendations).toContain('网站标题建议至少10个字符以提升SEO效果');
      expect(validation.recommendations).toContain('网站描述建议至少50个字符以提供足够信息');
    });

    it('应该警告内容过长问题', () => {
      // 创建确保超过60字符的标题
      const longTitle = '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的标题';
      // 创建确保超过160字符的描述
      const longDescription = '这是一个非常长的描述内容，专门用来测试长度验证功能。'.repeat(8);
      
      const longContentWebsite = {
        ...mockWebsiteData,
        title: longTitle,
        description: longDescription,
      };
      
      const validation = validateWebsiteSEOData(longContentWebsite);
      
      expect(validation.recommendations).toContain('网站标题建议不超过60个字符以避免在搜索结果中被截断');
      expect(validation.recommendations).toContain('网站描述建议不超过160个字符以避免在搜索结果中被截断');
    });
  });
});

// ========== 错误处理和边界情况测试 ==========

describe('网站详情页面 SEO - 错误处理', () => {
  it('应该在数据无效时返回备用元数据', () => {
    const invalidWebsite = {
      id: 'test',
      title: 'Test',
      url: 'https://test.com',
      status: 'active' as const,
      is_public: true,
      is_accessible: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    // 模拟生成过程中的错误 - 通过删除必需字段
    const corruptedWebsite = { ...invalidWebsite };
    delete (corruptedWebsite as any).id;
    
    expect(() => {
      const metadata = generateWebsiteMetadata(corruptedWebsite as any);
      expect(metadata).toBeDefined();
      expect(metadata.title).toContain('Test');
    }).not.toThrow();
  });

  it('应该在结构化数据生成失败时返回备用数据', () => {
    const websiteWithoutId = {
      ...mockWebsiteData,
    };
    delete (websiteWithoutId as any).id;
    
    expect(() => {
      const structuredData = generateWebsiteStructuredData(websiteWithoutId as any);
      expect(structuredData).toBeDefined();
      expect(structuredData['@context']).toBe('https://schema.org');
    }).not.toThrow();
  });
});

// ========== 集成测试 ==========

describe('网站详情页面 SEO - 集成测试', () => {
  it('应该生成完整且一致的SEO数据', () => {
    // 验证输入数据
    const validation = validateWebsiteSEOData(mockWebsiteData);
    expect(validation.isValid).toBe(true);
    
    // 生成元数据
    const metadata = generateWebsiteMetadata(mockWebsiteData);
    
    // 生成结构化数据
    const structuredData = generateWebsiteStructuredData(mockWebsiteData);
    
    // 生成社交分享链接
    const shareUrls = generateSocialSharingUrls(mockWebsiteData);
    
    // 验证数据一致性
    const canonicalUrl = 'https://webvault.cn/website/test-website-123';
    
    expect(metadata.alternates?.canonical).toBe(canonicalUrl);
    expect(metadata.openGraph?.url).toBe(canonicalUrl);
    expect(structuredData.url).toBe(canonicalUrl);
    expect(shareUrls.twitter).toContain(encodeURIComponent(canonicalUrl));
    
    // 验证标题一致性
    const expectedTitle = 'React 官方文档 - 构建用户界面的 JavaScript 库';
    expect(metadata.title).toBe(expectedTitle);
    expect(metadata.openGraph?.title).toBe(expectedTitle);
    expect(metadata.twitter?.title).toBe(expectedTitle);
    expect(structuredData.name).toBe(expectedTitle);
    
    // 验证描述一致性
    const expectedDescription = '学习 React，一个用于构建用户界面的 JavaScript 库。包含最新的 Hooks、组件设计模式和最佳实践指南。';
    expect(metadata.description).toBe(expectedDescription);
    expect(metadata.openGraph?.description).toBe(expectedDescription);
    expect(metadata.twitter?.description).toBe(expectedDescription);
    expect(structuredData.description).toBe(expectedDescription);
  });

  it('应该满足所有SEO需求', () => {
    const metadata = generateWebsiteMetadata(mockWebsiteData);
    const structuredData = generateWebsiteStructuredData(mockWebsiteData);
    
    // NFR-3.4.1: 动态meta标签
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.keywords).toBeDefined();
    expect(metadata.robots).toBeDefined();
    expect(metadata.alternates?.canonical).toBeDefined();
    
    // NFR-3.4.2: Open Graph和Twitter Cards
    expect(metadata.openGraph?.title).toBeDefined();
    expect(metadata.openGraph?.description).toBeDefined();
    expect(metadata.openGraph?.type).toBe('website');
    expect(metadata.openGraph?.images).toBeDefined();
    expect(metadata.twitter?.card).toBe('summary_large_image');
    expect(metadata.twitter?.title).toBeDefined();
    expect(metadata.twitter?.description).toBeDefined();
    expect(metadata.twitter?.images).toBeDefined();
    
    // NFR-3.4.3: Schema.org结构化数据
    expect(structuredData['@context']).toBe('https://schema.org');
    expect(structuredData['@type']).toBe('WebPage');
    expect(structuredData.mainEntity['@type']).toBe('WebSite');
    expect(structuredData.publisher['@type']).toBe('Organization');
    expect(structuredData.breadcrumb['@type']).toBe('BreadcrumbList');
  });
});