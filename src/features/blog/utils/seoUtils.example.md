# SEO Utils 使用示例

## 基本用法

### 1. 在博客详情页面生成元数据

```typescript
// src/app/(public)/blog/[slug]/page.tsx
import { generateBlogMetadata } from '@/features/blog/utils/seoUtils';
import { BlogDetailData } from '@/features/blog/types/detail';

interface BlogPageProps {
  params: { slug: string };
}

// 生成页面元数据 (Next.js 15 generateMetadata)
export async function generateMetadata({ params }: BlogPageProps) {
  // 从API或数据库获取博客数据
  const blogData: BlogDetailData = await fetchBlogBySlug(params.slug);
  
  if (!blogData) {
    return {
      title: '文章未找到 | WebVault',
      description: '您请求的文章不存在或已被删除',
    };
  }

  // 生成完整的SEO元数据
  const { metadata } = generateBlogMetadata(blogData);
  
  return metadata;
}

export default function BlogDetailPage({ params }: BlogPageProps) {
  // 页面组件实现...
}
```

### 2. 添加结构化数据

```typescript
// src/app/(public)/blog/[slug]/page.tsx
import { generateStructuredData } from '@/features/blog/utils/seoUtils';

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const blogData = await fetchBlogBySlug(params.slug);
  const structuredData = generateStructuredData(blogData);

  return (
    <>
      {/* 结构化数据 Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      {/* 页面内容 */}
      <BlogDetailPage blog={blogData} />
    </>
  );
}
```

### 3. 验证SEO数据

```typescript
// 在数据保存前验证SEO数据
import { validateSeoData } from '@/features/blog/utils/seoUtils';

async function saveBlogPost(blogData: BlogDetailData) {
  // 验证SEO数据
  const validation = validateSeoData(blogData);
  
  if (!validation.isValid) {
    throw new Error(`SEO数据验证失败: ${validation.errors.join(', ')}`);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('SEO警告:', validation.warnings);
  }
  
  // 保存数据...
}
```

## 高级用法

### 1. 自定义品牌信息

```typescript
// 如果需要覆盖默认的WebVault品牌信息
import { SeoUtils } from '@/features/blog/utils/seoUtils';

const customBrandInfo = {
  ...SeoUtils.WEBVAULT_BRAND,
  name: '自定义网站名称',
  description: '自定义网站描述',
  url: 'https://custom-domain.com',
};

// 使用自定义品牌信息生成元数据
const metadata = generateBlogMetadata(blogData, customBrandInfo);
```

### 2. 批量处理SEO数据

```typescript
import { 
  generateKeywords, 
  cleanHtmlForMeta, 
  calculateWordCount 
} from '@/features/blog/utils/seoUtils';

// 批量处理博客文章的SEO优化
function optimizeBlogSeoData(blogs: BlogDetailData[]) {
  return blogs.map(blog => ({
    ...blog,
    // 自动生成关键词
    keywords: generateKeywords(blog),
    
    // 清理并优化描述
    excerpt: cleanHtmlForMeta(blog.excerpt).substring(0, 160),
    
    // 计算阅读时间
    readingTime: Math.ceil(calculateWordCount(blog.content) / 300),
  }));
}
```

### 3. 社交媒体分享组件集成

```typescript
// src/components/SocialShareButton.tsx
import { generateOpenGraphData, generateTwitterCardData } from '@/features/blog/utils/seoUtils';

interface SocialShareButtonProps {
  blog: BlogDetailData;
  platform: 'twitter' | 'facebook' | 'linkedin';
}

export function SocialShareButton({ blog, platform }: SocialShareButtonProps) {
  const openGraphData = generateOpenGraphData(blog);
  const twitterData = generateTwitterCardData(blog);
  
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterData.title)}&url=${encodeURIComponent(openGraphData.url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(openGraphData.url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(openGraphData.url)}`,
  };
  
  return (
    <a 
      href={shareUrls[platform]} 
      target="_blank" 
      rel="noopener noreferrer"
      className="social-share-button"
    >
      分享到 {platform}
    </a>
  );
}
```

## 最佳实践

### 1. SEO数据预检查

```typescript
// 在发布前检查SEO数据质量
function preBlogPublishCheck(blog: BlogDetailData) {
  const validation = validateSeoData(blog);
  
  // 必须通过基础验证
  if (!validation.isValid) {
    throw new Error('博客数据不完整，无法发布');
  }
  
  // 警告处理
  const criticalWarnings = validation.warnings.filter(w => 
    w.includes('标题过长') || w.includes('摘要过长')
  );
  
  if (criticalWarnings.length > 0) {
    console.warn('建议优化以下SEO问题:', criticalWarnings);
  }
  
  return {
    canPublish: validation.isValid,
    suggestions: validation.warnings,
  };
}
```

### 2. 多语言SEO支持

```typescript
// 为不同语言生成适配的SEO数据
interface MultiLanguageBlog extends BlogDetailData {
  language: 'zh-CN' | 'en-US';
  translations?: {
    [lang: string]: {
      title: string;
      excerpt: string;
      content: string;
    };
  };
}

function generateMultiLanguageMetadata(blog: MultiLanguageBlog) {
  const currentLanguage = blog.language;
  
  // 根据语言调整SEO常量
  const seoConstants = {
    ...SeoUtils.SEO_CONSTANTS,
    WORDS_PER_MINUTE_ZH: currentLanguage === 'zh-CN' ? 300 : 200,
  };
  
  return generateBlogMetadata(blog);
}
```

### 3. 动态图片优化

```typescript
// 为不同平台优化图片尺寸
function optimizeImageForSeo(blog: BlogDetailData) {
  const optimizedImages = {
    // Open Graph (1200x630)
    og: blog.coverImage + '?w=1200&h=630&fit=crop',
    
    // Twitter Card (1200x600)
    twitter: blog.coverImage + '?w=1200&h=600&fit=crop',
    
    // Schema.org (推荐正方形或16:9)
    schema: blog.coverImage + '?w=800&h=450&fit=crop',
  };
  
  return {
    ...blog,
    coverImage: optimizedImages.og,
    featuredImages: [
      optimizedImages.og,
      optimizedImages.twitter,
      optimizedImages.schema,
    ],
  };
}
```

## 性能优化

### 1. 缓存SEO数据

```typescript
// 缓存生成的SEO元数据
import { cache } from 'react';

const cachedGenerateMetadata = cache(async (slug: string) => {
  const blog = await fetchBlogBySlug(slug);
  return generateBlogMetadata(blog);
});
```

### 2. 异步SEO数据生成

```typescript
// 大批量处理时使用异步处理
async function batchGenerateSeoData(blogs: BlogDetailData[]) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < blogs.length; i += batchSize) {
    const batch = blogs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(blog => Promise.resolve(generateBlogMetadata(blog)))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## 调试技巧

### 1. SEO数据可视化

```typescript
// 开发环境下可视化SEO数据
function debugSeoData(blog: BlogDetailData) {
  if (process.env.NODE_ENV === 'development') {
    const { metadata, structuredData } = generateBlogMetadata(blog);
    
    console.group('🔍 SEO Debug Information');
    console.log('📄 Title:', metadata.title);
    console.log('📝 Description:', metadata.description);
    console.log('🏷️ Keywords:', metadata.keywords);
    console.log('🖼️ OG Image:', metadata.openGraph?.images?.[0]);
    console.log('📊 Structured Data:', structuredData);
    console.groupEnd();
  }
}
```

### 2. SEO分数计算

```typescript
// 计算SEO优化分数
function calculateSeoScore(blog: BlogDetailData): number {
  let score = 0;
  
  // 标题优化 (30分)
  if (blog.title && blog.title.length >= 10 && blog.title.length <= 60) {
    score += 30;
  } else if (blog.title) {
    score += 15;
  }
  
  // 描述优化 (25分)
  if (blog.excerpt && blog.excerpt.length >= 50 && blog.excerpt.length <= 160) {
    score += 25;
  } else if (blog.excerpt) {
    score += 12;
  }
  
  // 关键词优化 (20分)
  if (blog.tags && blog.tags.length >= 3 && blog.tags.length <= 8) {
    score += 20;
  } else if (blog.tags && blog.tags.length > 0) {
    score += 10;
  }
  
  // 内容长度 (15分)
  const wordCount = calculateWordCount(blog.content);
  if (wordCount >= 300) {
    score += 15;
  } else if (wordCount >= 100) {
    score += 8;
  }
  
  // 图片优化 (10分)
  if (blog.coverImage && blog.featuredImages?.length) {
    score += 10;
  } else if (blog.coverImage) {
    score += 5;
  }
  
  return score;
}
```