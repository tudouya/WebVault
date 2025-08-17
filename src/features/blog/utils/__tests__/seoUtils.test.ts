/**
 * SEO Utils Test Suite
 * 
 * 测试博客SEO元数据生成功能的完整性和正确性
 */

import {
  generateBlogMetadata,
  generateOpenGraphData,
  generateTwitterCardData,
  generateStructuredData,
  truncateDescription,
  generateKeywords,
  cleanHtmlForMeta,
  calculateWordCount,
  generateArticleUrl,
  generateAuthorUrl,
  validateSeoData,
  SeoUtils,
} from '../seoUtils';
import { BlogDetailData } from '../../types/detail';

// ========== 测试数据 ==========

const mockBlogData: BlogDetailData = {
  id: 'test-blog-1',
  title: '深入理解React Hooks的最佳实践指南',
  excerpt: '本文详细介绍了React Hooks的核心概念、使用场景和最佳实践，帮助开发者更好地掌握现代React开发技术。',
  slug: 'react-hooks-best-practices',
  coverImage: 'https://example.com/covers/react-hooks.jpg',
  content: `
    <h1>React Hooks 最佳实践</h1>
    <p>React Hooks 是 React 16.8 引入的新特性，它让你在函数组件中使用状态和其他 React 特性。</p>
    <h2>为什么使用 Hooks？</h2>
    <p>Hooks 解决了类组件的许多问题，让代码更加简洁和易于测试。</p>
    <ul>
      <li>更好的状态复用</li>
      <li>更简洁的代码</li>
      <li>更容易测试</li>
    </ul>
    <p>总的来说，Hooks 让 React 开发变得更加愉悦和高效。</p>
  `,
  contentType: 'html',
  readingTime: 5,
  tags: ['React', 'Hooks', '前端开发', 'JavaScript', '最佳实践'],
  seoTitle: 'React Hooks最佳实践完整指南 - 提升前端开发效率',
  seoDescription: '全面学习React Hooks核心概念、使用技巧和最佳实践。包含useState、useEffect等常用Hook的详细使用指南，助力前端开发者掌握现代React技术。',
  keywords: ['React', 'Hooks', '前端', 'JavaScript', 'Web开发'],
  author: {
    name: '张三',
    avatar: 'https://example.com/avatars/zhangsan.jpg',
    bio: '资深前端开发工程师，专注于React生态系统',
    socialLinks: {
      twitter: '@zhangsan_dev',
      github: 'https://github.com/zhangsan',
      website: 'https://zhangsan.dev',
      email: 'zhangsan@example.com',
    },
    stats: {
      postsCount: 42,
      totalLikes: 1250,
      followersCount: 888,
    },
  },
  category: '前端技术',
  publishedAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-20T10:30:00Z',
  viewCount: 1520,
  likeCount: 89,
  shareCount: 23,
  featuredImages: [
    'https://example.com/images/react-hooks-diagram.png',
    'https://example.com/images/hooks-comparison.jpg',
  ],
  relatedPostIds: ['react-state-management', 'modern-react-patterns'],
  isPublished: true,
  isFeatured: true,
};

const mockBlogDataMinimal: BlogDetailData = {
  id: 'minimal-blog',
  title: 'Simple Blog Post',
  excerpt: 'A simple blog post for testing.',
  slug: 'simple-blog-post',
  coverImage: 'https://example.com/simple.jpg',
  content: 'This is a simple blog post content.',
  contentType: 'html',
  readingTime: 1,
  tags: ['Test'],
  keywords: ['Test', 'Simple'],
  author: {
    name: 'Test Author',
  },
  category: 'Test',
  publishedAt: '2024-01-01T00:00:00Z',
  isPublished: true,
};

// ========== 工具函数测试 ==========

describe('SEO Utils - 工具函数', () => {
  describe('truncateDescription', () => {
    it('应该正确截断过长的描述', () => {
      const longText = '这是一个非常长的描述文本，用于测试截断功能。它包含了很多内容，需要被适当地截断以符合SEO要求。';
      const result = truncateDescription(longText, 50);
      
      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(result.length).toBeGreaterThan(47); // 应该被截断了
      expect(result.includes('这是一个非常长的描述文本')).toBe(true);
    });

    it('应该保持短文本不变', () => {
      const shortText = '短文本测试';
      const result = truncateDescription(shortText, 50);
      
      expect(result).toBe(shortText);
    });

    it('应该正确处理HTML标签', () => {
      const htmlText = '<p>这是一个<strong>包含HTML标签</strong>的文本</p>';
      const result = truncateDescription(htmlText, 20);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('应该在合适的位置截断（句号或空格）', () => {
      const text = '第一句话。第二句话很长很长很长。第三句话。';
      const result = truncateDescription(text, 15);
      
      // 由于截断逻辑调整为50%阈值，这里应该包含第一句话
      expect(result).toContain('第一句话。');
      expect(result).toMatch(/\.{3}$/); // 以...结尾
    });
  });

  describe('generateKeywords', () => {
    it('应该生成正确的关键词列表', () => {
      const keywords = generateKeywords(mockBlogData);
      
      expect(keywords).toContain('React');
      expect(keywords).toContain('Hooks');
      expect(keywords).toContain('前端技术');
      expect(keywords).toContain('张三');
      expect(keywords).toContain('WebVault');
      expect(keywords.length).toBeLessThanOrEqual(10);
    });

    it('应该去重关键词', () => {
      const blogWithDuplicates = {
        ...mockBlogData,
        tags: ['React', 'React', 'Hooks'],
        category: 'React',
      };
      
      const keywords = generateKeywords(blogWithDuplicates);
      const reactCount = keywords.filter(k => k === 'React').length;
      
      expect(reactCount).toBe(1);
    });
  });

  describe('cleanHtmlForMeta', () => {
    it('应该移除所有HTML标签', () => {
      const htmlContent = '<h1>标题</h1><p>段落<strong>加粗</strong></p>';
      const result = cleanHtmlForMeta(htmlContent);
      
      expect(result).toBe('标题 段落 加粗');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('应该解码HTML实体', () => {
      const htmlContent = '&quot;引号&quot; &amp; &lt;标签&gt;';
      const result = cleanHtmlForMeta(htmlContent);
      
      expect(result).toBe('"引号" & <标签>');
    });

    it('应该清理多余空格', () => {
      const htmlContent = '   多个    空格   测试   ';
      const result = cleanHtmlForMeta(htmlContent);
      
      expect(result).toBe('多个 空格 测试');
    });
  });

  describe('calculateWordCount', () => {
    it('应该正确计算中英文混合文本的字数', () => {
      const content = '这是中文测试 with English words 123';
      const count = calculateWordCount(content);
      
      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    it('应该正确处理HTML内容', () => {
      const htmlContent = '<p>测试<strong>字数</strong>计算</p>';
      const count = calculateWordCount(htmlContent);
      
      // 应该只计算中文字符，忽略HTML标签产生的空格或数字
      expect(count).toBeGreaterThan(4);
      expect(count).toBeLessThan(7);
    });
  });

  describe('generateArticleUrl', () => {
    it('应该生成正确的文章URL', () => {
      const url = generateArticleUrl('test-slug');
      
      expect(url).toMatch(/\/blog\/test-slug$/);
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('generateAuthorUrl', () => {
    it('应该优先返回作者网站链接', () => {
      const url = generateAuthorUrl(mockBlogData.author);
      
      expect(url).toBe('https://zhangsan.dev');
    });

    it('应该在没有网站时返回GitHub链接', () => {
      const authorWithoutWebsite = {
        ...mockBlogData.author,
        socialLinks: {
          github: 'https://github.com/test',
        },
      };
      
      const url = generateAuthorUrl(authorWithoutWebsite);
      
      expect(url).toBe('https://github.com/test');
    });

    it('应该在没有社交链接时返回undefined', () => {
      const authorWithoutLinks = {
        name: 'Test Author',
      };
      
      const url = generateAuthorUrl(authorWithoutLinks);
      
      expect(url).toBeUndefined();
    });
  });
});

// ========== 元数据生成测试 ==========

describe('SEO Utils - 元数据生成', () => {
  describe('generateOpenGraphData', () => {
    it('应该生成完整的OpenGraph数据', () => {
      const ogData = generateOpenGraphData(mockBlogData);
      
      expect(ogData.title).toBe('React Hooks最佳实践完整指南 - 提升前端开发效率');
      expect(ogData.description).toContain('全面学习React Hooks核心概念');
      expect(ogData.url).toContain('/blog/react-hooks-best-practices');
      expect(ogData.type).toBe('article');
      expect(ogData.siteName).toBe('WebVault');
      expect(ogData.locale).toBe('zh-CN');
      expect(ogData.images).toHaveLength(3); // coverImage + 2 featuredImages
      expect(ogData.article?.author).toBe('张三');
      expect(ogData.article?.section).toBe('前端技术');
      expect(ogData.article?.tags).toEqual(['React', 'Hooks', '前端开发', 'JavaScript', '最佳实践']);
    });

    it('应该处理缺少可选字段的情况', () => {
      const ogData = generateOpenGraphData(mockBlogDataMinimal);
      
      expect(ogData.title).toBe('Simple Blog Post');
      expect(ogData.images).toHaveLength(1);
      expect(ogData.article?.modifiedTime).toBeUndefined();
    });
  });

  describe('generateTwitterCardData', () => {
    it('应该生成正确的Twitter Card数据', () => {
      const twitterData = generateTwitterCardData(mockBlogData);
      
      expect(twitterData.card).toBe('summary_large_image');
      expect(twitterData.site).toBe('@webvault');
      expect(twitterData.creator).toBe('@zhangsan_dev');
      expect(twitterData.title).toBe('React Hooks最佳实践完整指南 - 提升前端开发效率');
      expect(twitterData.images).toContain('https://example.com/covers/react-hooks.jpg');
    });

    it('应该使用默认Twitter账号当作者没有Twitter时', () => {
      const twitterData = generateTwitterCardData(mockBlogDataMinimal);
      
      expect(twitterData.creator).toBe('@webvault');
    });
  });

  describe('generateStructuredData', () => {
    it('应该生成符合Schema.org标准的结构化数据', () => {
      const structuredData = generateStructuredData(mockBlogData);
      
      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('BlogPosting');
      expect(structuredData.headline).toBe('深入理解React Hooks的最佳实践指南');
      expect(structuredData.description).toContain('React Hooks的核心概念');
      expect(structuredData.author.name).toBe('张三');
      expect(structuredData.author.url).toBe('https://zhangsan.dev');
      expect(structuredData.publisher.name).toBe('WebVault');
      expect(structuredData.datePublished).toBe('2024-01-15T08:00:00Z');
      expect(structuredData.dateModified).toBe('2024-01-20T10:30:00Z');
      expect(structuredData.keywords).toContain('React');
      expect(structuredData.articleSection).toBe('前端技术');
      expect(structuredData.wordCount).toBeGreaterThan(0);
      expect(structuredData.inLanguage).toBe('zh-CN');
    });

    it('应该正确处理多个特色图片', () => {
      const structuredData = generateStructuredData(mockBlogData);
      
      expect(Array.isArray(structuredData.image)).toBe(true);
      expect(structuredData.image).toHaveLength(2);
    });

    it('应该在没有特色图片时使用封面图片', () => {
      const blogWithoutFeaturedImages = {
        ...mockBlogDataMinimal,
        featuredImages: undefined,
      };
      
      const structuredData = generateStructuredData(blogWithoutFeaturedImages);
      
      expect(structuredData.image).toBe('https://example.com/simple.jpg');
    });
  });

  describe('generateBlogMetadata', () => {
    it('应该生成完整的Next.js Metadata对象', () => {
      const { metadata, structuredData, canonicalUrl } = generateBlogMetadata(mockBlogData);
      
      // 检查基础元数据
      expect(metadata.title).toContain('React Hooks最佳实践完整指南');
      expect(metadata.title).toContain('WebVault');
      expect(metadata.description).toContain('全面学习React Hooks核心概念');
      expect(metadata.keywords).toContain('React');
      
      // 检查作者信息
      expect(metadata.authors).toEqual([{ name: '张三' }]);
      
      // 检查规范URL
      expect(metadata.alternates?.canonical).toBe(canonicalUrl);
      expect(canonicalUrl).toContain('/blog/react-hooks-best-practices');
      
      // 检查机器人指令
      expect(metadata.robots?.index).toBe(true);
      expect(metadata.robots?.follow).toBe(true);
      
      // 检查OpenGraph
      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.openGraph?.title).toBe('React Hooks最佳实践完整指南 - 提升前端开发效率');
      expect(metadata.openGraph?.siteName).toBe('WebVault');
      expect(metadata.openGraph?.locale).toBe('zh-CN');
      expect(metadata.openGraph?.images).toHaveLength(3);
      expect(metadata.openGraph?.publishedTime).toBe('2024-01-15T08:00:00Z');
      expect(metadata.openGraph?.modifiedTime).toBe('2024-01-20T10:30:00Z');
      expect(metadata.openGraph?.authors).toEqual(['张三']);
      expect(metadata.openGraph?.section).toBe('前端技术');
      expect(metadata.openGraph?.tags).toEqual(['React', 'Hooks', '前端开发', 'JavaScript', '最佳实践']);
      
      // 检查Twitter Cards
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.site).toBe('@webvault');
      expect(metadata.twitter?.creator).toBe('@zhangsan_dev');
      
      // 检查其他元标签
      expect(metadata.other?.['article:author']).toBe('张三');
      expect(metadata.other?.['article:published_time']).toBe('2024-01-15T08:00:00Z');
      expect(metadata.other?.['article:modified_time']).toBe('2024-01-20T10:30:00Z');
      expect(metadata.other?.['article:section']).toBe('前端技术');
      expect(metadata.other?.['article:tag']).toBe('React,Hooks,前端开发,JavaScript,最佳实践');
      
      // 检查结构化数据
      expect(structuredData['@type']).toBe('BlogPosting');
      expect(structuredData.headline).toBe('深入理解React Hooks的最佳实践指南');
    });

    it('应该正确处理未发布的文章', () => {
      const unpublishedBlog = {
        ...mockBlogData,
        isPublished: false,
      };
      
      const { metadata } = generateBlogMetadata(unpublishedBlog);
      
      expect(metadata.robots?.index).toBe(false);
      expect(metadata.robots?.follow).toBe(false);
      expect(metadata.robots?.googleBot?.index).toBe(false);
      expect(metadata.robots?.googleBot?.follow).toBe(false);
    });

    it('应该处理标题长度限制', () => {
      const longTitleBlog = {
        ...mockBlogData,
        title: '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的标题用于测试截断功能',
      };
      
      const { metadata } = generateBlogMetadata(longTitleBlog);
      
      expect((metadata.title as string).length).toBeLessThanOrEqual(60);
    });
  });
});

// ========== 验证功能测试 ==========

describe('SEO Utils - 验证功能', () => {
  describe('validateSeoData', () => {
    it('应该验证完整的博客数据', () => {
      const validation = validateSeoData(mockBlogData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该识别缺失的必需字段', () => {
      const incompleteBlog = {
        ...mockBlogData,
        title: '',
        excerpt: '',
        author: { name: '' },
      } as BlogDetailData;
      
      const validation = validateSeoData(incompleteBlog);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('标题不能为空');
      expect(validation.errors).toContain('摘要不能为空');
      expect(validation.errors).toContain('作者名称不能为空');
    });

    it('应该警告长度超限的字段', () => {
      // 确保标题超过60字符
      const longTitle = '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的标题';
      // 确保摘要超过160字符
      const longExcerpt = '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的摘要';
      
      const longContentBlog = {
        ...mockBlogData,
        title: longTitle,
        excerpt: longExcerpt,
      };
      
      const validation = validateSeoData(longContentBlog);
      
      expect(validation.warnings.some(w => w.includes('标题过长'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('摘要过长'))).toBe(true);
    });

    it('应该警告图片URL格式问题', () => {
      const relativImageBlog = {
        ...mockBlogData,
        coverImage: '/images/cover.jpg',
      };
      
      const validation = validateSeoData(relativImageBlog);
      
      expect(validation.warnings).toContain('封面图片应使用完整URL');
    });

    it('应该警告标签数量过多', () => {
      const manyTagsBlog = {
        ...mockBlogData,
        tags: Array(15).fill(0).map((_, i) => `tag${i}`),
      };
      
      const validation = validateSeoData(manyTagsBlog);
      
      expect(validation.warnings.some(w => w.includes('标签过多'))).toBe(true);
    });
  });
});

// ========== SeoUtils对象测试 ==========

describe('SEO Utils - 导出对象', () => {
  it('应该导出所有必要的常量', () => {
    expect(SeoUtils.WEBVAULT_BRAND).toBeDefined();
    expect(SeoUtils.SEO_CONSTANTS).toBeDefined();
    expect(SeoUtils.WEBVAULT_BRAND.name).toBe('WebVault');
    expect(SeoUtils.SEO_CONSTANTS.MAX_TITLE_LENGTH).toBe(60);
  });

  it('应该导出所有工具函数', () => {
    expect(typeof SeoUtils.truncateDescription).toBe('function');
    expect(typeof SeoUtils.generateKeywords).toBe('function');
    expect(typeof SeoUtils.cleanHtmlForMeta).toBe('function');
    expect(typeof SeoUtils.calculateWordCount).toBe('function');
    expect(typeof SeoUtils.generateArticleUrl).toBe('function');
    expect(typeof SeoUtils.generateAuthorUrl).toBe('function');
  });

  it('应该导出所有生成函数', () => {
    expect(typeof SeoUtils.generateOpenGraphData).toBe('function');
    expect(typeof SeoUtils.generateTwitterCardData).toBe('function');
    expect(typeof SeoUtils.generateStructuredData).toBe('function');
    expect(typeof SeoUtils.generateBlogMetadata).toBe('function');
  });

  it('应该导出验证函数', () => {
    expect(typeof SeoUtils.validateSeoData).toBe('function');
  });
});

// ========== 集成测试 ==========

describe('SEO Utils - 集成测试', () => {
  it('应该生成有效的完整SEO数据流', () => {
    // 验证输入数据
    const validation = validateSeoData(mockBlogData);
    expect(validation.isValid).toBe(true);
    
    // 生成完整元数据
    const { metadata, structuredData, canonicalUrl } = generateBlogMetadata(mockBlogData);
    
    // 验证元数据结构
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
    
    // 验证结构化数据
    expect(structuredData).toBeDefined();
    expect(structuredData['@context']).toBe('https://schema.org');
    expect(structuredData['@type']).toBe('BlogPosting');
    
    // 验证URL一致性
    expect(canonicalUrl).toBeDefined();
    expect(metadata.alternates?.canonical).toBe(canonicalUrl);
    expect(metadata.openGraph?.url).toBe(canonicalUrl);
  });

  it('应该在真实使用场景下正常工作', () => {
    // 模拟从API获取的博客数据
    const apiBlogData = {
      ...mockBlogData,
      content: `
        <article>
          <h1>实际的博客内容</h1>
          <p>这是从API返回的真实内容，包含<strong>HTML标签</strong>和<em>格式化</em>。</p>
          <blockquote>重要的引用内容</blockquote>
          <code>const example = "代码示例";</code>
        </article>
      `,
    };
    
    expect(() => {
      const result = generateBlogMetadata(apiBlogData);
      expect(result.metadata.title).toBeDefined();
      expect(result.structuredData.wordCount).toBeGreaterThan(0);
    }).not.toThrow();
  });
});