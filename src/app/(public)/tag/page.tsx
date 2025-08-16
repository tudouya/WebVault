import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// 强制动态渲染，支持CSR策略和多标签筛选操作
export const dynamic = 'force-dynamic'

// 动态导入 TagBrowsePage 组件以优化性能和避免构建问题
const TagBrowsePage = dynamicImport(
  () => import('@/features/browsable-pages/components').then(mod => ({ default: mod.TagBrowsePage })),
  {
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">加载标签页面...</p>
        </div>
      </div>
    )
  }
)

/**
 * 动态生成元数据，支持标签筛选的SEO优化
 * 通过searchParams获取标签、分类和其他查询参数
 */
export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  // 等待异步 searchParams
  const params = await searchParams
  
  // 从URL参数中获取筛选条件
  const tags = typeof params.tags === 'string' ? params.tags : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const query = typeof params.q === 'string' ? params.q : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  
  // 构建动态标题
  let title = 'TAG - Explore by tags - WebVault'
  if (tags) {
    const tagList = tags.split(',').slice(0, 3).join('、')
    title = `标签：${tagList} - WebVault`
  } else if (category) {
    title = `分类：${category} - 标签浏览 - WebVault`
  } else if (query) {
    title = `搜索"${query}" - 标签浏览 - WebVault`
  }
  
  // 页码处理
  if (page > 1) {
    title = `${title} - 第${page}页`
  }
  
  // 构建动态描述
  let description = 'Browse and discover websites organized by tags. WebVault为您提供按标签整理的优质网站资源，通过技术栈和平台筛选找到最适合的工具和服务。'
  if (tags) {
    const tagList = tags.split(',').slice(0, 3).join('、')
    description = `浏览带有"${tagList}"标签的优质网站资源，发现该技术栈相关的专业工具和服务。WebVault为您精选该标签的最佳网站推荐。`
  } else if (category) {
    description = `在${category}分类中通过标签筛选网站资源，发现该领域最相关的优质工具和服务。`
  } else if (query) {
    description = `在标签浏览中搜索"${query}"相关的优质网站资源，发现最佳的技术工具和服务。`
  }
  
  // 构建关键词
  const keywords = [
    'WebVault',
    '标签浏览',
    '网站标签', 
    '技术栈筛选',
    '工具推荐',
    '资源目录',
    '按标签筛选',
    '多标签筛选'
  ]
  
  if (tags) keywords.push(...tags.split(',').slice(0, 5))
  if (category) keywords.push(category)
  if (query) keywords.push(query)
  
  // 构建URL
  const tagUrl = new URL('/tag', 'https://webvault.cn')
  if (tags) tagUrl.searchParams.set('tags', tags)
  if (category) tagUrl.searchParams.set('category', category)
  if (query) tagUrl.searchParams.set('q', query)
  if (page > 1) tagUrl.searchParams.set('page', page.toString())

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
      url: tagUrl.toString(),
      siteName: 'WebVault',
      locale: 'zh_CN',
      images: [
        {
          url: '/logo.svg',
          width: 1200,
          height: 630,
          alt: 'WebVault - 标签浏览优质网站资源',
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
      canonical: tagUrl.toString(),
    },
    other: {
      // 结构化数据标记 - TagPage Schema
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'WebVault 标签浏览',
        description: 'WebVault 网站标签浏览页面',
        url: tagUrl.toString(),
        mainEntity: {
          '@type': 'ItemList',
          name: tags ? `${tags.split(',').slice(0, 3).join('、')}标签网站` : category ? `${category}分类标签网站` : 'WebVault 标签网站',
          description: description,
          numberOfItems: '多个优质网站',
          ...(tags && {
            about: tags.split(',').map(tag => ({
              '@type': 'Thing',
              name: tag.trim(),
              description: `${tag.trim()}标签相关的网站资源`
            }))
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
              name: '标签浏览',
              item: 'https://webvault.cn/tag'
            },
            ...(tags ? [{
              '@type': 'ListItem',
              position: 3,
              name: tags.split(',').slice(0, 3).join('、'),
              item: `https://webvault.cn/tag?tags=${encodeURIComponent(tags)}`
            }] : [])
          ]
        }
      }),
    },
  }
}

/**
 * 标签浏览页面路由组件
 * 
 * Next.js 15 App Router 标签浏览页面实现，具备以下特性：
 * - 客户端渲染(CSR)策略，支持多标签筛选和实时交互
 * - 动态元数据生成，包括标签、分类、搜索和分页
 * - 结构化数据标记（Schema.org CollectionPage 和 ItemList）
 * - OpenGraph 和 Twitter 卡片完整支持
 * - 规范URL（canonical）处理，避免重复内容
 * - 搜索引擎爬虫优化配置
 * - 集成完整的 TagBrowsePage 组件
 * - 响应式布局，适配移动设备
 * - 性能优化的动态加载
 * 
 * SEO 优化特性：
 * - 动态标题包含标签筛选、分类筛选、搜索关键词和页码
 * - 描述文案针对不同筛选场景优化
 * - 关键词自动聚合当前筛选条件
 * - Schema.org 结构化数据支持搜索引擎理解
 * - OpenGraph 和 Twitter 卡片支持社交媒体分享
 * - 规范URL避免重复内容问题
 * - 面包屑导航结构化数据
 * 
 * URL 参数支持：
 * - tags: 标签筛选，多个标签用逗号分隔 (例如: react,nextjs,typescript)
 * - category: 分类筛选条件 (例如: development, business)
 * - q: 搜索查询关键词
 * - sort: 排序方式 (created_at, updated_at, title, rating, visit_count)
 * - order: 排序顺序 (asc, desc)
 * - page: 分页参数
 * - limit: 每页显示数量
 * - view: 视图模式 (grid, list)
 * - featured: 仅显示推荐 (true, false)
 * - rating: 最低评分筛选
 * - ads: 包含广告 (true, false)
 * 
 * 需求满足：
 * - 3.1: 标签页面显示"TAG"标识和"Explore by tags"标题
 * - 3.2: 页面加载筛选控件，提供标签筛选栏和排序下拉菜单
 * - 3.5: 用户导航翻页时保持当前筛选条件并同步URL状态
 * - 4.1: 显示网站卡片时复用现有的WebsiteCard组件设计
 * - 5.1: 桌面端使用3列网格布局展示网站卡片
 * - 7.1: 页面URL能够反映筛选条件，方便分享链接和收藏页面
 * 
 * 技术实现：
 * - 使用force-dynamic确保CSR渲染，支持多标签筛选操作
 * - 通过TagBrowsePage组件处理所有业务逻辑
 * - URL参数自动解析和验证（支持多标签逗号分隔格式）
 * - 完整的错误处理和加载状态管理
 * - 支持浏览器前进后退和URL状态同步
 * 
 * URL格式示例:
 * - `/tag` - 默认标签浏览页
 * - `/tag?tags=react,nextjs,typescript&sort=created_at&page=1` - 多标签筛选
 * - `/tag?tags=react&category=development&q=framework` - 标签+分类+搜索组合筛选
 */
export default function TagPageRoute() {
  return <TagBrowsePage />
}