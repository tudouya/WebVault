import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// 强制动态渲染，避免预渲染时的客户端状态管理问题
export const dynamic = 'force-dynamic'
// Cloudflare Pages 需要 Edge Runtime
export const runtime = 'edge'

// 动态导入 BlogIndexPage 组件以优化性能和避免构建问题
const BlogIndexPage = dynamicImport(
  () => import('@/features/blog/components').then(mod => ({ default: mod.BlogIndexPage })),
  {
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">加载博客页面...</p>
        </div>
      </div>
    )
  }
)

/**
 * 动态生成元数据，支持博客筛选的SEO优化
 * 通过searchParams获取分类、分页和其他查询参数
 */
export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  // 等待异步 searchParams
  const params = await searchParams
  
  // 从URL参数中获取筛选条件
  const category = typeof params.category === 'string' ? params.category : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  
  // 构建动态标题
  let title = 'WebVault - 博客文章'
  if (category && category !== 'All') {
    title = `${category} 博客文章 - WebVault`
  }
  
  // 页码处理
  if (page > 1) {
    title = `${title} - 第${page}页`
  }
  
  // 构建动态描述
  let description = '阅读WebVault的最新博客文章，发现优质网站推荐、技术见解和行业趋势。我们为您精选最有价值的内容和资源分享。'
  if (category && category !== 'All') {
    description = `浏览${category}分类下的博客文章，发现该领域的专业见解和推荐资源。WebVault为您提供高质量的内容分享。`
  }
  
  // 构建关键词
  const keywords = [
    'WebVault',
    '博客文章',
    '网站推荐',
    '技术见解',
    '行业资讯',
    '资源分享'
  ]
  
  if (category && category !== 'All') keywords.push(category)
  
  // 构建URL
  const blogUrl = new URL('/blog', 'https://webvault.cn')
  if (category && category !== 'All') blogUrl.searchParams.set('category', category)
  if (page > 1) blogUrl.searchParams.set('page', page.toString())

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'WebVault Team', url: 'https://webvault.cn' }],
    creator: 'WebVault',
    publisher: 'WebVault',
    category: 'Technology',
    classification: 'Blog',
    referrer: 'origin-when-cross-origin',
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // 可以在这里添加Google Search Console验证码
      // google: 'your-google-verification-code',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: blogUrl.toString(),
      siteName: 'WebVault',
      locale: 'zh_CN',
      alternateLocale: ['en_US'],
      countryName: 'China',
      emails: ['contact@webvault.cn'],
      phoneNumbers: [],
      faxNumbers: [],
      ttl: 604800, // 7 days
      images: [
        {
          url: 'https://webvault.cn/logo.svg',
          secureUrl: 'https://webvault.cn/logo.svg',
          width: 1200,
          height: 630,
          alt: 'WebVault - 博客文章',
          type: 'image/svg+xml',
        },
      ],
      videos: [],
      audio: [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@WebVault',
      creator: '@WebVault',
      title,
      description,
      images: {
        url: 'https://webvault.cn/logo.svg',
        alt: 'WebVault - 博客文章',
        width: 1200,
        height: 630,
      },
    },
    alternates: {
      canonical: blogUrl.toString(),
      languages: {
        'zh-CN': blogUrl.toString(),
        'x-default': blogUrl.toString(),
      },
      media: {
        'only screen and (max-width: 600px)': blogUrl.toString(),
      },
      types: {
        'application/rss+xml': 'https://webvault.cn/blog/rss.xml',
        'application/atom+xml': 'https://webvault.cn/blog/atom.xml',
      },
    },
    other: {
      // 结构化数据标记 - 完整的 Blog 和 WebPage Schema
      'application/ld+json': JSON.stringify([
        // Blog Schema
        {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': 'https://webvault.cn/blog#blog',
          name: 'WebVault 博客',
          description: 'WebVault 官方博客，分享网站推荐和技术见解',
          url: blogUrl.toString(),
          inLanguage: 'zh-CN',
          author: {
            '@type': 'Organization',
            name: 'WebVault Team',
            url: 'https://webvault.cn'
          },
          publisher: {
            '@type': 'Organization',
            name: 'WebVault',
            url: 'https://webvault.cn',
            logo: {
              '@type': 'ImageObject',
              url: 'https://webvault.cn/logo.svg',
              width: 400,
              height: 400
            }
          },
          mainEntity: {
            '@type': 'ItemList',
            name: category && category !== 'All' ? `${category}分类博客` : 'WebVault 博客文章',
            description: description,
            numberOfItems: '多篇精选文章',
            ...(category && category !== 'All' && {
              about: {
                '@type': 'Thing',
                name: category,
                description: `${category}分类相关的博客文章`
              }
            })
          }
        },
        // WebPage Schema
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': blogUrl.toString(),
          name: title,
          description: description,
          url: blogUrl.toString(),
          inLanguage: 'zh-CN',
          isPartOf: {
            '@type': 'WebSite',
            '@id': 'https://webvault.cn#website',
            name: 'WebVault',
            description: '个人网站目录管理平台，用于收藏、分类和管理工作生活中发现的优质网站资源',
            url: 'https://webvault.cn'
          },
          mainEntity: {
            '@id': 'https://webvault.cn/blog#blog'
          },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'WebVault',
                item: 'https://webvault.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '博客',
                item: 'https://webvault.cn/blog'
              },
              ...(category && category !== 'All' ? [{
                '@type': 'ListItem',
                position: 3,
                name: category,
                item: `https://webvault.cn/blog?category=${encodeURIComponent(category)}`
              }] : [])
            ]
          }
        },
        // CollectionPage Schema (if category filter is applied)
        ...(category && category !== 'All' ? [{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `https://webvault.cn/blog?category=${encodeURIComponent(category)}`,
          name: `${category} 博客文章`,
          description: `浏览${category}分类下的博客文章，发现该领域的专业见解和推荐资源。`,
          url: blogUrl.toString(),
          inLanguage: 'zh-CN',
          about: {
            '@type': 'Thing',
            name: category,
            description: `${category}分类相关的内容和资源`
          }
        }] : [])
      ]),
    },
  }
}

/**
 * 博客页面路由组件
 * 
 * Next.js 15 App Router 博客索引页面实现，具备以下特性：
 * - 服务端渲染支持，确保 SEO 友好
 * - 动态元数据生成，包括分类筛选和分页
 * - 结构化数据标记（Schema.org Blog 和 ItemList）
 * - OpenGraph 和 Twitter 卡片完整支持
 * - 规范URL（canonical）处理，避免重复内容
 * - 搜索引擎爬虫优化配置
 * - 集成完整的 BlogIndexPage 组件
 * - 响应式布局，适配移动设备
 * - 性能优化的动态加载
 * 
 * SEO 优化特性：
 * - 动态标题包含分类筛选和页码
 * - 描述文案针对不同筛选场景优化
 * - 关键词自动聚合当前筛选条件
 * - Schema.org 结构化数据支持搜索引擎理解
 * - OpenGraph 和 Twitter 卡片支持社交媒体分享
 * - 规范URL避免重复内容问题
 * - 面包屑导航结构化数据
 * 
 * 需求满足：
 * - 所有UI需求的路由层集成（1.1-6.5）
 * - 页面导航和品牌一致性
 * - 博客列表展示界面 (1.1-1.5)
 * - 文章分类筛选系统 (2.1-2.5)
 * - 分页导航系统 (3.1-3.7)
 * - 博客文章卡片设计 (4.1-4.5)
 * - 响应式布局设计 (5.1-5.5)
 * - Newsletter订阅组件 (6.1-6.5)
 * - 页面性能和加载 (7.1-7.5)
 * 
 * 注意：由于某些组件使用了客户端状态管理（zustand + nuqs），
 * 这里使用动态导入并设置force-dynamic避免预渲染错误
 */
export default function BlogPageRoute() {
  return <BlogIndexPage />
}