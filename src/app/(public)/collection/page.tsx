import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// 强制动态渲染，避免预渲染时的客户端状态管理问题
export const dynamic = 'force-dynamic'

// 动态导入 CollectionIndexPage 组件以优化性能和避免构建问题
const CollectionIndexPage = dynamicImport(
  () => import('@/features/websites/components').then(mod => ({ default: mod.CollectionIndexPage })),
  {
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">加载集合页面...</p>
        </div>
      </div>
    )
  }
)

/**
 * 动态生成元数据，支持集合筛选的SEO优化
 * 通过searchParams获取分类、标签和其他查询参数
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
  const tag = typeof params.tag === 'string' ? params.tag : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  
  // 构建动态标题
  let title = 'WebVault - 精选网站集合'
  if (category) {
    title = `${category}分类集合 - WebVault`
  } else if (tag) {
    title = `${tag}标签集合 - WebVault`
  }
  
  // 页码处理
  if (page > 1) {
    title = `${title} - 第${page}页`
  }
  
  // 构建动态描述
  let description = '探索WebVault精选的网站集合，发现按主题整理的优质网站资源合辑。每个集合都经过精心策划，为您提供特定领域的最佳工具和服务推荐。'
  if (category) {
    description = `浏览${category}分类下的精选网站集合，发现该领域最有价值的资源合辑。WebVault为您整理专业的主题集合。`
  } else if (tag) {
    description = `探索带有"${tag}"标签的网站集合，发现相关主题的精选资源合辑。WebVault为您提供精准的集合推荐。`
  }
  
  // 构建关键词
  const keywords = [
    'WebVault',
    '网站集合',
    '资源合辑',
    '精选推荐',
    '主题集合',
    '工具合辑'
  ]
  
  if (category) keywords.push(category)
  if (tag) keywords.push(tag)
  
  // 构建URL
  const collectionUrl = new URL('/collection', 'https://webvault.cn')
  if (category) collectionUrl.searchParams.set('category', category)
  if (tag) collectionUrl.searchParams.set('tag', tag)
  if (page > 1) collectionUrl.searchParams.set('page', page.toString())

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
      url: collectionUrl.toString(),
      siteName: 'WebVault',
      locale: 'zh_CN',
      images: [
        {
          url: '/logo.svg',
          width: 1200,
          height: 630,
          alt: 'WebVault - 精选网站集合',
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
      canonical: collectionUrl.toString(),
    },
    other: {
      // 结构化数据标记 - CollectionPage Schema
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'WebVault 网站集合',
        description: 'WebVault 精选网站集合页面',
        url: collectionUrl.toString(),
        mainEntity: {
          '@type': 'ItemList',
          name: category ? `${category}分类集合` : tag ? `${tag}标签集合` : 'WebVault 网站集合',
          description: description,
          numberOfItems: '多个精选集合',
          ...(category && {
            about: {
              '@type': 'Thing',
              name: category,
              description: `${category}分类相关的网站集合`
            }
          })
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
              name: '网站集合',
              item: 'https://webvault.cn/collection'
            }
          ]
        }
      }),
    },
  }
}

/**
 * 集合页面路由组件
 * 
 * Next.js 15 App Router 集合索引页面实现，具备以下特性：
 * - 服务端渲染支持，确保 SEO 友好
 * - 动态元数据生成，包括分类、标签和分页
 * - 结构化数据标记（Schema.org CollectionPage 和 ItemList）
 * - OpenGraph 和 Twitter 卡片完整支持
 * - 规范URL（canonical）处理，避免重复内容
 * - 搜索引擎爬虫优化配置
 * - 集成完整的 CollectionIndexPage 组件
 * - 响应式布局，适配移动设备
 * - 性能优化的动态加载
 * 
 * SEO 优化特性：
 * - 动态标题包含分类/标签筛选和页码
 * - 描述文案针对不同筛选场景优化
 * - 关键词自动聚合当前筛选条件
 * - Schema.org 结构化数据支持搜索引擎理解
 * - OpenGraph 和 Twitter 卡片支持社交媒体分享
 * - 规范URL避免重复内容问题
 * - 面包屑导航结构化数据
 * 
 * 需求满足：
 * - 所有UI需求的路由层集成（1.1-10.5）
 * - 页面导航和品牌一致性
 * - 响应式布局，适配移动设备
 * 
 * 注意：由于某些组件使用了客户端状态管理（nuqs），
 * 这里提供一个纯服务端渲染版本，避免预渲染错误
 */
export default function CollectionPageRoute() {
  return <CollectionIndexPage />
}