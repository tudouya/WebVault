/**
 * SEO Utils for Blog Detail Pages
 * 
 * 博客详情页面的SEO元数据生成工具函数
 * 提供完整的SEO支持，包括Open Graph、Twitter Cards和结构化数据
 * 
 * Requirements: 8.1, 12.1, 12.2, 12.3
 * Leverage: src/features/blog/types/detail.ts
 */

import type { Metadata } from 'next';
import { BlogDetailData, BlogAuthorDetail } from '../types/detail';

// ========== 常量定义 ==========

/** WebVault品牌信息 */
const WEBVAULT_BRAND = {
  name: 'WebVault',
  description: '网站目录管理平台',
  fullDescription: '个人网站目录管理平台，用于收藏、分类和管理工作生活中发现的优质网站资源',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://webvault.com',
  logo: '/assets/images/logo.png',
  favicon: '/favicon.ico',
  author: 'WebVault Team',
  twitter: '@webvault',
  language: 'zh-CN',
  region: 'CN',
} as const;

/** SEO配置常量 */
const SEO_CONSTANTS = {
  /** 标题最大长度 */
  MAX_TITLE_LENGTH: 60,
  /** 描述最大长度 */
  MAX_DESCRIPTION_LENGTH: 160,
  /** 关键词最大数量 */
  MAX_KEYWORDS_COUNT: 10,
  /** 每分钟阅读字数（中文） */
  WORDS_PER_MINUTE_ZH: 300,
  /** 默认作者名称 */
  DEFAULT_AUTHOR: 'WebVault',
} as const;

// ========== 类型定义 ==========

/**
 * Open Graph数据接口
 */
export interface OpenGraphData {
  title: string;
  description: string;
  url: string;
  type: 'article';
  images: Array<{
    url: string;
    width?: number;
    height?: number;
    alt: string;
  }>;
  siteName: string;
  locale: string;
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    author: string;
    section: string;
    tags: string[];
  };
}

/**
 * Twitter Cards数据接口
 */
export interface TwitterCardData {
  card: 'summary_large_image';
  site: string;
  creator: string;
  title: string;
  description: string;
  images: string[];
}

/**
 * Schema.org BlogPosting结构化数据接口
 */
export interface BlogPostingStructuredData {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  image: string | string[];
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified?: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  keywords: string[];
  articleSection: string;
  wordCount: number;
  inLanguage: string;
}

/**
 * 完整的博客元数据接口
 */
export interface BlogMetadata {
  /** Next.js Metadata对象 */
  metadata: Metadata;
  /** 结构化数据 */
  structuredData: BlogPostingStructuredData;
  /** 规范URL */
  canonicalUrl: string;
}

// ========== 工具函数 ==========

/**
 * 截断文本到指定长度，保持单词完整性
 * @param text - 原始文本
 * @param maxLength - 最大长度
 * @param suffix - 截断后缀，默认为 '...'
 * @returns 截断后的文本
 */
export function truncateDescription(
  text: string, 
  maxLength: number, 
  suffix: string = '...'
): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  // 移除HTML标签
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // 截断到最大长度，但尝试在句号或空格处截断
  let truncated = cleanText.substring(0, maxLength - suffix.length);
  
  // 查找最后的句号或空格
  const lastPeriod = truncated.lastIndexOf('。');
  const lastSpace = truncated.lastIndexOf(' ');
  const lastBreakPoint = Math.max(lastPeriod, lastSpace);
  
  // 如果找到合适的断点，使用断点截断
  if (lastBreakPoint > maxLength * 0.5) {
    truncated = truncated.substring(0, lastBreakPoint);
  }
  
  return truncated.trim() + suffix;
}

/**
 * 从文章内容和标签生成关键词
 * @param blog - 博客详情数据
 * @returns 关键词数组
 */
export function generateKeywords(blog: BlogDetailData): string[] {
  const keywords = new Set<string>();
  
  // 添加明确的标签
  blog.tags?.forEach(tag => {
    if (tag.trim()) {
      keywords.add(tag.trim());
    }
  });
  
  // 添加分类
  if (blog.category) {
    keywords.add(blog.category);
  }
  
  // 添加作者名称
  if (blog.author?.name) {
    keywords.add(blog.author.name);
  }
  
  // 从标题中提取关键词（分词简化版）
  const titleWords = blog.title
    .split(/[\s,，。！？；、]+/)
    .filter(word => word.length > 1 && word.length < 10)
    .slice(0, 3);
  
  titleWords.forEach(word => keywords.add(word));
  
  // 添加通用关键词
  keywords.add('WebVault');
  keywords.add('博客');
  keywords.add('技术分享');
  
  return Array.from(keywords).slice(0, SEO_CONSTANTS.MAX_KEYWORDS_COUNT);
}

/**
 * 清理HTML标签，保留纯文本用于元数据
 * @param html - HTML内容
 * @returns 清理后的纯文本
 */
export function cleanHtmlForMeta(html: string): string {
  if (!html) return '';
  
  return html
    // 移除HTML标签，但在标签间添加空格
    .replace(/<[^>]*>/g, ' ')
    // 解码HTML实体
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // 清理多余空格和换行
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 计算文章字数（中英文混合）
 * @param content - 文章内容
 * @returns 字数统计
 */
export function calculateWordCount(content: string): number {
  const cleanContent = cleanHtmlForMeta(content);
  
  // 中文字符计数
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fff]/g) || []).length;
  
  // 英文单词计数
  const englishWords = cleanContent
    .replace(/[\u4e00-\u9fff]/g, ' ') // 替换中文字符为空格
    .split(/\s+/)
    .filter(word => word.length > 0 && /[a-zA-Z]/.test(word)).length; // 只计算包含字母的单词
  
  return chineseChars + englishWords;
}

/**
 * 生成文章URL
 * @param slug - 文章slug
 * @returns 完整的文章URL
 */
export function generateArticleUrl(slug: string): string {
  return `${WEBVAULT_BRAND.url}/blog/${slug}`;
}

/**
 * 生成作者URL（如果有社交链接）
 * @param author - 作者信息
 * @returns 作者URL或undefined
 */
export function generateAuthorUrl(author: BlogAuthorDetail): string | undefined {
  if (author.socialLinks?.website) {
    return author.socialLinks.website;
  }
  
  if (author.socialLinks?.github) {
    return author.socialLinks.github;
  }
  
  return undefined;
}

// ========== 主要生成函数 ==========

/**
 * 生成Open Graph数据
 * @param blog - 博客详情数据
 * @returns Open Graph数据对象
 */
export function generateOpenGraphData(blog: BlogDetailData): OpenGraphData {
  const articleUrl = generateArticleUrl(blog.slug);
  const title = blog.seoTitle || blog.title;
  const description = truncateDescription(
    blog.seoDescription || blog.excerpt,
    SEO_CONSTANTS.MAX_DESCRIPTION_LENGTH
  );

  return {
    title: truncateDescription(title, SEO_CONSTANTS.MAX_TITLE_LENGTH, ''),
    description,
    url: articleUrl,
    type: 'article',
    images: [
      {
        url: blog.coverImage,
        width: 1200,
        height: 630,
        alt: title,
      },
      ...(blog.featuredImages?.map(img => ({
        url: img,
        alt: title,
      })) || []),
    ],
    siteName: WEBVAULT_BRAND.name,
    locale: WEBVAULT_BRAND.language,
    article: {
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt,
      author: blog.author.name,
      section: blog.category,
      tags: blog.tags || [],
    },
  };
}

/**
 * 生成Twitter Cards数据
 * @param blog - 博客详情数据
 * @returns Twitter Cards数据对象
 */
export function generateTwitterCardData(blog: BlogDetailData): TwitterCardData {
  const title = blog.seoTitle || blog.title;
  const description = truncateDescription(
    blog.seoDescription || blog.excerpt,
    SEO_CONSTANTS.MAX_DESCRIPTION_LENGTH
  );

  return {
    card: 'summary_large_image',
    site: WEBVAULT_BRAND.twitter,
    creator: blog.author.socialLinks?.twitter || WEBVAULT_BRAND.twitter,
    title: truncateDescription(title, SEO_CONSTANTS.MAX_TITLE_LENGTH, ''),
    description,
    images: [blog.coverImage],
  };
}

/**
 * 生成Schema.org BlogPosting结构化数据
 * @param blog - 博客详情数据
 * @returns 结构化数据对象
 */
export function generateStructuredData(blog: BlogDetailData): BlogPostingStructuredData {
  const articleUrl = generateArticleUrl(blog.slug);
  const wordCount = calculateWordCount(blog.content);
  const authorUrl = generateAuthorUrl(blog.author);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: cleanHtmlForMeta(blog.excerpt),
    image: blog.featuredImages && blog.featuredImages.length > 0 
      ? blog.featuredImages 
      : blog.coverImage,
    author: {
      '@type': 'Person',
      name: blog.author.name,
      ...(authorUrl && { url: authorUrl }),
    },
    publisher: {
      '@type': 'Organization',
      name: WEBVAULT_BRAND.name,
      logo: {
        '@type': 'ImageObject',
        url: `${WEBVAULT_BRAND.url}${WEBVAULT_BRAND.logo}`,
      },
    },
    datePublished: blog.publishedAt,
    ...(blog.updatedAt && { dateModified: blog.updatedAt }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    keywords: generateKeywords(blog),
    articleSection: blog.category,
    wordCount,
    inLanguage: WEBVAULT_BRAND.language,
  };
}

/**
 * 生成完整的博客页面元数据
 * @param blog - 博客详情数据
 * @returns 完整的元数据对象
 */
export function generateBlogMetadata(blog: BlogDetailData): BlogMetadata {
  const title = blog.seoTitle || blog.title;
  const description = blog.seoDescription || blog.excerpt;
  const keywords = generateKeywords(blog);
  const canonicalUrl = generateArticleUrl(blog.slug);
  
  // 生成页面标题（包含品牌）
  const fullTitle = title.includes(WEBVAULT_BRAND.name) 
    ? title 
    : `${title} | ${WEBVAULT_BRAND.name}`;

  // 生成Open Graph和Twitter数据
  const openGraph = generateOpenGraphData(blog);
  const twitter = generateTwitterCardData(blog);
  const structuredData = generateStructuredData(blog);

  const metadata: Metadata = {
    // 基础元数据
    title: truncateDescription(fullTitle, SEO_CONSTANTS.MAX_TITLE_LENGTH, ''),
    description: truncateDescription(description, SEO_CONSTANTS.MAX_DESCRIPTION_LENGTH),
    keywords: keywords.join(', '),
    
    // 作者信息
    authors: [{ name: blog.author.name }],
    
    // 规范URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // 机器人索引
    robots: {
      index: blog.isPublished,
      follow: blog.isPublished,
      googleBot: {
        index: blog.isPublished,
        follow: blog.isPublished,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Open Graph
    openGraph: {
      type: 'article',
      title: openGraph.title,
      description: openGraph.description,
      url: openGraph.url,
      siteName: openGraph.siteName,
      locale: openGraph.locale,
      images: openGraph.images,
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.author.name],
      section: blog.category,
      tags: blog.tags,
    },
    
    // Twitter Cards
    twitter: {
      card: twitter.card,
      site: twitter.site,
      creator: twitter.creator,
      title: twitter.title,
      description: twitter.description,
      images: twitter.images,
    },
    
    // 其他元标签
    other: {
      'article:author': blog.author.name,
      'article:published_time': blog.publishedAt,
      ...(blog.updatedAt && { 'article:modified_time': blog.updatedAt }),
      'article:section': blog.category,
      'article:tag': blog.tags?.join(',') || '',
    },
  };

  return {
    metadata,
    structuredData,
    canonicalUrl,
  };
}

/**
 * 验证元数据完整性
 * @param blog - 博客详情数据
 * @returns 验证结果
 */
export function validateSeoData(blog: BlogDetailData): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 检查必需字段
  if (!blog.title) errors.push('标题不能为空');
  if (!blog.excerpt) errors.push('摘要不能为空');
  if (!blog.slug) errors.push('URL slug不能为空');
  if (!blog.coverImage) errors.push('封面图片不能为空');
  if (!blog.author?.name) errors.push('作者名称不能为空');
  if (!blog.category) errors.push('分类不能为空');
  if (!blog.publishedAt) errors.push('发布时间不能为空');

  // 检查长度限制
  if (blog.title?.length > SEO_CONSTANTS.MAX_TITLE_LENGTH) {
    warnings.push(`标题过长 (${blog.title.length}>${SEO_CONSTANTS.MAX_TITLE_LENGTH})`);
  }
  
  if (blog.excerpt?.length > SEO_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
    warnings.push(`摘要过长 (${blog.excerpt.length}>${SEO_CONSTANTS.MAX_DESCRIPTION_LENGTH})`);
  }

  // 检查图片URL
  if (blog.coverImage && !blog.coverImage.startsWith('http')) {
    warnings.push('封面图片应使用完整URL');
  }

  // 检查标签数量
  if (blog.tags && blog.tags.length > SEO_CONSTANTS.MAX_KEYWORDS_COUNT) {
    warnings.push(`标签过多 (${blog.tags.length}>${SEO_CONSTANTS.MAX_KEYWORDS_COUNT})`);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// ========== 导出工具对象 ==========

/**
 * SEO工具集合对象
 * 提供所有SEO相关的工具函数和常量
 */
export const SeoUtils = {
  // 常量
  WEBVAULT_BRAND,
  SEO_CONSTANTS,
  
  // 工具函数
  truncateDescription,
  generateKeywords,
  cleanHtmlForMeta,
  calculateWordCount,
  generateArticleUrl,
  generateAuthorUrl,
  
  // 生成函数
  generateOpenGraphData,
  generateTwitterCardData,
  generateStructuredData,
  generateBlogMetadata,
  
  // 验证函数
  validateSeoData,
} as const;

// 默认导出主要生成函数
export default generateBlogMetadata;