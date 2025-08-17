/**
 * SEO utilities for website detail pages
 * 
 * Provides functions to generate metadata and structured data for
 * Next.js 15 App Router website detail pages with full SEO optimization.
 */

import type { Metadata } from 'next'
import type { WebsiteDetailData } from '../types/detail'

/**
 * Configuration for website detail SEO generation
 */
interface SEOConfig {
  /** Base URL for the application */
  baseUrl: string
  /** Default site name */
  siteName: string
  /** Default Twitter handle */
  twitterHandle?: string
  /** Default OG image URL */
  defaultOGImage?: string
}

/**
 * Default SEO configuration
 */
const DEFAULT_SEO_CONFIG: SEOConfig = {
  baseUrl: 'https://webvault.cn',
  siteName: 'WebVault',
  twitterHandle: '@WebVault',
  defaultOGImage: '/logo.svg',
}

/**
 * Generates Next.js Metadata for website detail pages
 * 
 * Creates comprehensive metadata including:
 * - Dynamic page title and description
 * - Open Graph tags for social sharing
 * - Twitter Cards support
 * - Canonical URLs
 * - Robots directives
 * - Keywords and authorship
 * 
 * @param website - Website detail data
 * @param config - Optional SEO configuration
 * @returns Next.js Metadata object
 */
export function generateWebsiteMetadata(
  website: WebsiteDetailData,
  config: Partial<SEOConfig> = {}
): Metadata {
  const seoConfig = { ...DEFAULT_SEO_CONFIG, ...config }
  
  try {
    // Generate dynamic title
    const title = website.meta_title || `${website.title} - ${seoConfig.siteName}`
    
    // Generate dynamic description
    const description = website.meta_description || 
      website.description || 
      `探索 ${website.title}，一个在 ${seoConfig.siteName} 上精选的优质网站资源。`
    
    // Truncate description to optimal length for SEO
    const truncatedDescription = description.length > 160 
      ? description.substring(0, 157) + '...' 
      : description
    
    // Build keywords array
    const keywords = [
      seoConfig.siteName,
      '网站推荐',
      '精选网站',
      website.title,
      ...(website.tags || [])
    ]
    
    // Add category to keywords if available
    if (website.category?.name) {
      keywords.push(website.category.name)
    }
    
    // Build canonical URL
    const canonicalUrl = new URL(`/website/${website.id}`, seoConfig.baseUrl)
    
    // Select OG image (prioritize website screenshot, fallback to favicon, then default)
    const ogImage = website.screenshot_url || 
      website.favicon_url || 
      seoConfig.defaultOGImage || 
      '/logo.svg'
    
    // Generate metadata object
    const metadata: Metadata = {
      title,
      description: truncatedDescription,
      keywords: keywords.join(', '),
      authors: [{ name: seoConfig.siteName + ' Team' }],
      creator: seoConfig.siteName,
      publisher: seoConfig.siteName,
      
      // Robots configuration
      robots: {
        index: website.is_public && website.status === 'active',
        follow: true,
        googleBot: {
          index: website.is_public && website.status === 'active',
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      
      // Open Graph tags
      openGraph: {
        title,
        description: truncatedDescription,
        type: 'website',
        url: canonicalUrl.toString(),
        siteName: seoConfig.siteName,
        locale: 'zh_CN',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${website.title} - ${seoConfig.siteName}`,
          },
        ],
      },
      
      // Twitter Cards
      twitter: {
        card: 'summary_large_image',
        title,
        description: truncatedDescription,
        creator: seoConfig.twitterHandle,
        images: [ogImage],
      },
      
      // Canonical URL
      alternates: {
        canonical: canonicalUrl.toString(),
      },
      
      // Additional metadata
      other: {
        'application/ld+json': JSON.stringify(generateWebsiteStructuredData(website, seoConfig)),
      },
    }
    
    return metadata
  } catch (error) {
    console.error('Error generating website metadata:', error)
    
    // Fallback metadata in case of errors
    return {
      title: `${website.title} - ${seoConfig.siteName}`,
      description: `探索 ${website.title}，在 ${seoConfig.siteName} 发现优质网站资源。`,
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: new URL(`/website/${website.id}`, seoConfig.baseUrl).toString(),
      },
    }
  }
}

/**
 * Generates Schema.org structured data for website detail pages
 * 
 * Creates JSON-LD structured data including:
 * - WebPage schema for the detail page
 * - WebSite schema for the referenced website
 * - Organization schema for the publisher
 * - BreadcrumbList for navigation
 * - Review schema if rating is available
 * 
 * @param website - Website detail data
 * @param config - Optional SEO configuration
 * @returns Schema.org JSON-LD object
 */
export function generateWebsiteStructuredData(
  website: WebsiteDetailData,
  config: Partial<SEOConfig> = {}
): object {
  const seoConfig = { ...DEFAULT_SEO_CONFIG, ...config }
  
  try {
    const canonicalUrl = new URL(`/website/${website.id}`, seoConfig.baseUrl)
    
    // Base WebPage schema
    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': canonicalUrl.toString(),
      url: canonicalUrl.toString(),
      name: website.meta_title || `${website.title} - ${seoConfig.siteName}`,
      description: website.meta_description || website.description,
      datePublished: website.created_at,
      dateModified: website.updated_at,
      inLanguage: website.language || 'zh-CN',
      
      // Main entity: the website being featured
      mainEntity: {
        '@type': 'WebSite',
        '@id': website.url,
        name: website.title,
        description: website.description,
        url: website.url,
        image: website.screenshot_url || website.favicon_url,
        ...(website.language && { inLanguage: website.language }),
        
        // Publisher information if available
        ...(website.publisher && {
          publisher: {
            '@type': 'Person',
            '@id': `${seoConfig.baseUrl}/user/${website.publisher.id}`,
            name: website.publisher.name,
            ...(website.publisher.avatar_url && { image: website.publisher.avatar_url }),
            ...(website.publisher.website_url && { url: website.publisher.website_url }),
          },
        }),
        
        // Rating/Review if available
        ...(website.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: website.rating,
            ratingCount: 1,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      },
      
      // Publisher organization
      publisher: {
        '@type': 'Organization',
        '@id': seoConfig.baseUrl,
        name: seoConfig.siteName,
        url: seoConfig.baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${seoConfig.baseUrl}/logo.svg`,
        },
      },
      
      // Breadcrumb navigation
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: seoConfig.siteName,
            item: seoConfig.baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '网站目录',
            item: `${seoConfig.baseUrl}/`,
          },
          ...(website.category ? [{
            '@type': 'ListItem',
            position: 3,
            name: website.category.name,
            item: `${seoConfig.baseUrl}/category/${website.category.id}`,
          }] : []),
          {
            '@type': 'ListItem',
            position: website.category ? 4 : 3,
            name: website.title,
            item: canonicalUrl.toString(),
          },
        ],
      },
      
      // Keywords/tags
      ...(website.tags && website.tags.length > 0 && {
        keywords: website.tags.join(', '),
      }),
      
      // Content features if available
      ...(website.features && website.features.length > 0 && {
        about: website.features.map(feature => ({
          '@type': 'Thing',
          name: feature,
        })),
      }),
    }
    
    return webPageSchema
  } catch (error) {
    console.error('Error generating website structured data:', error)
    
    // Fallback minimal structured data
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: website.title,
      description: website.description || `探索 ${website.title}`,
      url: new URL(`/website/${website.id}`, seoConfig.baseUrl).toString(),
      publisher: {
        '@type': 'Organization',
        name: seoConfig.siteName,
        url: seoConfig.baseUrl,
      },
    }
  }
}

/**
 * Validates website data for SEO requirements
 * 
 * Checks if website has minimum required data for effective SEO
 * 
 * @param website - Website detail data
 * @returns Validation result with issues if any
 */
export function validateWebsiteSEOData(website: WebsiteDetailData): {
  isValid: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Required fields validation
  if (!website.title || website.title.trim().length === 0) {
    issues.push('网站标题不能为空')
  } else if (website.title.length < 10) {
    recommendations.push('网站标题建议至少10个字符以提升SEO效果')
  } else if (website.title.length > 60) {
    recommendations.push('网站标题建议不超过60个字符以避免在搜索结果中被截断')
  }
  
  if (!website.description || website.description.trim().length === 0) {
    recommendations.push('建议添加网站描述以提升SEO效果')
  } else if (website.description.length < 50) {
    recommendations.push('网站描述建议至少50个字符以提供足够信息')
  } else if (website.description.length > 160) {
    recommendations.push('网站描述建议不超过160个字符以避免在搜索结果中被截断')
  }
  
  if (!website.url || !isValidUrl(website.url)) {
    issues.push('网站URL无效或缺失')
  }
  
  // SEO enhancement recommendations
  if (!website.meta_title) {
    recommendations.push('建议添加自定义SEO标题以优化搜索结果显示')
  }
  
  if (!website.meta_description) {
    recommendations.push('建议添加自定义SEO描述以优化搜索结果摘要')
  }
  
  if (!website.tags || website.tags.length === 0) {
    recommendations.push('建议添加标签以提升内容分类和发现性')
  }
  
  if (!website.screenshot_url && !website.favicon_url) {
    recommendations.push('建议添加网站截图或图标以提升社交分享效果')
  }
  
  if (!website.category) {
    recommendations.push('建议分配网站分类以提升内容组织和SEO结构')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  }
}

/**
 * Simple URL validation helper
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Generates social sharing URLs
 * 
 * Creates pre-populated sharing URLs for various social platforms
 * 
 * @param website - Website detail data
 * @param config - Optional SEO configuration
 * @returns Object with sharing URLs for different platforms
 */
export function generateSocialSharingUrls(
  website: WebsiteDetailData,
  config: Partial<SEOConfig> = {}
): {
  twitter: string
  facebook: string
  linkedin: string
  reddit: string
  telegram: string
} {
  const seoConfig = { ...DEFAULT_SEO_CONFIG, ...config }
  const websiteUrl = new URL(`/website/${website.id}`, seoConfig.baseUrl).toString()
  const title = encodeURIComponent(website.title)
  const description = encodeURIComponent(
    website.description || `在 ${seoConfig.siteName} 发现 ${website.title}`
  )
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(websiteUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(websiteUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(websiteUrl)}&title=${title}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(websiteUrl)}&text=${title}`,
  }
}