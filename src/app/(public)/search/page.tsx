import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// 强制动态渲染，避免预渲染时的客户端状态管理问题
export const dynamic = 'force-dynamic'

// 动态导入 SearchPage 组件以优化性能和避免构建问题
const SearchPage = dynamicImport(
  () => import('@/features/websites/components').then(mod => ({ default: mod.SearchPage })),
  {
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">加载搜索页面...</p>
        </div>
      </div>
    )
  }
)

/**
 * 动态生成元数据，支持搜索关键词的SEO优化
 * 通过searchParams获取搜索关键词和其他查询参数
 */
export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  // 等待异步 searchParams
  const params = await searchParams
  
  // 从URL参数中获取搜索关键词和其他筛选条件
  const query = typeof params.q === 'string' ? params.q : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const tag = typeof params.tag === 'string' ? params.tag : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  
  // 构建动态标题
  let title = 'WebVault - 搜索优质网站资源'
  if (query) {
    title = `搜索 "${query}" - WebVault`
  } else if (category) {
    title = `分类：${category} - WebVault`
  } else if (tag) {
    title = `标签：${tag} - WebVault`
  }
  
  // 页码处理
  if (page > 1) {
    title = `${title} - 第${page}页`
  }
  
  // 构建动态描述
  let description = '在WebVault中搜索优质网站资源，发现符合需求的精选工具和服务。涵盖开发工具、设计资源、AI工具等多个分类，助力提升工作效率。'
  if (query) {
    description = `搜索"${query}"相关的优质网站资源，在WebVault网站目录中发现最佳的工具和服务。精选高质量网站，满足您的专业需求。`
  } else if (category) {
    description = `浏览${category}分类下的优质网站资源，发现专业的工具和服务。WebVault为您精选该领域的最佳网站推荐。`
  } else if (tag) {
    description = `探索带有"${tag}"标签的网站资源，发现相关的优质工具和服务。WebVault为您提供精准的网站推荐。`
  }
  
  // 构建关键词
  const keywords = [
    'WebVault',
    '网站目录',
    '工具推荐', 
    '网站搜索',
    '优质资源'
  ]
  
  if (query) keywords.unshift(query)
  if (category) keywords.push(category)
  if (tag) keywords.push(tag)
  
  // 构建URL
  const searchUrl = new URL('/search', 'https://webvault.cn')
  if (query) searchUrl.searchParams.set('q', query)
  if (category) searchUrl.searchParams.set('category', category)
  if (tag) searchUrl.searchParams.set('tag', tag)
  if (page > 1) searchUrl.searchParams.set('page', page.toString())

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'WebVault Team' }],
    creator: 'WebVault',
    publisher: 'WebVault',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: searchUrl.toString(),
      siteName: 'WebVault',
      locale: 'zh_CN',
      images: [
        {
          url: '/logo.svg',
          width: 1200,
          height: 630,
          alt: 'WebVault - 优质网站资源目录',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@WebVault',
      images: ['/logo.svg'],
    },
    alternates: {
      canonical: searchUrl.toString(),
    },
    other: {
      // 结构化数据标记 - WebSite Schema
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'WebVault',
        description: 'WebVault 优质网站资源目录',
        url: 'https://webvault.cn',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://webvault.cn/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        ...(query && {
          mainEntity: {
            '@type': 'SearchResultsPage',
            name: `${query} - 搜索结果`,
            description: `WebVault中关于"${query}"的搜索结果页面`,
            url: searchUrl.toString(),
          },
        }),
      }),
    },
  }
}

/**
 * 搜索页面路由组件
 * 
 * Next.js 15 App Router 搜索页面实现，具备以下特性：
 * - 服务端渲染支持，确保 SEO 友好
 * - 动态元数据生成，包括搜索关键词、分类、标签和分页
 * - 结构化数据标记（Schema.org WebSite 和 SearchResultsPage）
 * - OpenGraph 和 Twitter 卡片完整支持
 * - 规范URL（canonical）处理，避免重复内容
 * - 搜索引擎爬虫优化配置
 * - 集成完整的 SearchPage 组件
 * - 响应式布局，适配移动设备
 * - 性能优化的动态加载
 * 
 * SEO 优化特性：
 * - 动态标题包含搜索关键词和页码
 * - 描述文案针对不同搜索场景优化
 * - 关键词自动聚合当前搜索条件
 * - Schema.org 结构化数据支持搜索引擎理解
 * - OpenGraph 和 Twitter 卡片支持社交媒体分享
 * - 规范URL避免重复内容问题
 * 
 * 需求满足：
 * - 1.1: 完整的搜索页面布局展示
 * - 1.5: 响应式布局，适配小屏幕显示
 * 
 * 注意：由于某些组件使用了客户端状态管理（nuqs），
 * 这里提供一个纯服务端渲染版本，避免预渲染错误
 */
export default function SearchPageRoute() {
  return <SearchPage />
}