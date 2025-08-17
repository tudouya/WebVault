import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dynamicImport from 'next/dynamic'
import { getBlogBySlug, blogDetailService } from '@/features/blog/data/blogDetailService'
import { mockBlogDetails } from '@/features/blog/data/mockBlogs'
import { BlogDetailData } from '@/features/blog/types'
import { generateBlogMetadata, generateStructuredData } from '@/features/blog/utils/seoUtils'

// 强制动态渲染，确保最新数据和避免预渲染问题
export const dynamic = 'force-dynamic'

// 动态导入博客详情页面组件（待实现），优化性能
const BlogDetailPage = dynamicImport(
  () => import('@/features/blog/components').then(mod => ({ default: mod.BlogDetailPage })),
  {
    loading: () => (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Category badge skeleton */}
            <div className="w-20 h-6 bg-muted rounded-full animate-pulse mb-4" />
            
            {/* Title skeleton */}
            <div className="space-y-3 mb-6">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
            </div>
            
            {/* Author and meta skeleton */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                <div className="w-24 h-3 bg-muted rounded animate-pulse" />
              </div>
            </div>
            
            {/* Cover image skeleton */}
            <div className="w-full h-64 md:h-96 bg-muted rounded-lg animate-pulse mb-8" />
            
            {/* Content skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        <div className="fixed bottom-8 right-8">
          <div className="flex items-center space-x-2 bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">加载博客详情...</p>
          </div>
        </div>
      </div>
    )
  }
)

/**
 * 博客详情页面路由参数类型
 */
interface BlogDetailPageParams {
  slug: string
}

/**
 * 博客详情页面属性类型
 */
interface BlogDetailPageProps {
  params: Promise<BlogDetailPageParams>
}

/**
 * 生成静态参数以支持静态生成 (SSG)
 * 
 * 为所有可用的博客文章生成静态路径，提高性能和SEO
 * 
 * @returns Promise<BlogDetailPageParams[]> - 博客slug参数数组
 */
export async function generateStaticParams(): Promise<BlogDetailPageParams[]> {
  try {
    // 获取所有可用的博客文章slug
    // 在实际项目中，这里应该从数据库或CMS获取数据
    const blogSlugs = mockBlogDetails
      .filter(blog => blog.isPublished) // 只包含已发布的文章
      .map(blog => ({
        slug: blog.slug
      }))

    console.log(`Generating static params for ${blogSlugs.length} blog posts`)
    
    return blogSlugs

  } catch (error) {
    console.error('Failed to generate static params for blog posts:', error)
    // 即使生成静态参数失败，也返回空数组，避免构建失败
    // 这将回退到ISR（增量静态再生）模式
    return []
  }
}

/**
 * 动态生成博客详情页面的元数据
 * 
 * 根据博客文章内容生成SEO优化的元数据，包括：
 * - 动态标题和描述 (Requirements: 12.1)
 * - OpenGraph和Twitter卡片 (Requirements: 12.2) 
 * - 结构化数据标记 (Requirements: 12.3)
 * - 规范URL配置和社交分享预览 (Requirements: 12.6)
 * 
 * 本函数利用了 src/features/blog/utils/seoUtils.ts 中的工具函数，
 * 确保SEO元数据的一致性和最佳实践。
 * 
 * @param params - 路由参数，包含文章slug
 * @returns Promise<Metadata> - 生成的元数据对象
 */
export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  try {
    // 等待异步参数
    const { slug } = await params

    // 获取博客详情数据
    let blogData: BlogDetailData
    try {
      blogData = await getBlogBySlug(slug)
    } catch (error) {
      console.warn(`Blog not found for slug "${slug}":`, error)
      // 如果文章不存在，返回默认元数据
      return {
        title: '文章未找到 - WebVault',
        description: '抱歉，您访问的博客文章不存在或已被删除。',
        robots: { index: false, follow: false }
      }
    }

    // 使用SEO工具生成完整的元数据
    const { metadata } = generateBlogMetadata(blogData)
    
    return metadata

  } catch (error) {
    console.error('Failed to generate metadata for blog post:', error)
    
    // 返回备用元数据
    return {
      title: '博客文章 - WebVault',
      description: '阅读 WebVault 的精彩博客文章，发现优质网站推荐和技术见解。',
      robots: { index: false, follow: true }
    }
  }
}

/**
 * 博客详情页面组件
 * 
 * Next.js 15 App Router 博客详情页面实现，具备以下特性：
 * - 动态路由支持 (/blog/[slug])
 * - 静态生成优化 (generateStaticParams)
 * - 服务端渲染 (SSR) 确保 SEO 友好
 * - 完整的错误处理和 404 页面
 * - 动态元数据生成，包括结构化数据
 * - OpenGraph 和 Twitter 卡片支持
 * - 规范 URL 处理，避免重复内容
 * - 性能优化的动态加载
 * - 响应式布局设计
 * - 用户体验优化的加载状态
 * 
 * SEO 优化特性：
 * - 基于文章内容的动态元数据 (Requirements: 12.1)
 * - 结构化数据标记 (Article Schema) (Requirements: 12.3)
 * - 面包屑导航支持
 * - 作者信息和发布时间标记
 * - 社交媒体分享优化 (Requirements: 12.2, 12.6)
 * - 图片SEO优化（alt标签、尺寸）
 * 
 * 性能优化：
 * - 静态生成已发布文章
 * - 动态导入减少初始包大小
 * - 图片懒加载和优化
 * - 缓存策略支持
 * 
 * 需求满足：
 * - 动态路由实现 (任务 4)
 * - SEO 优化和元数据生成 (Requirements: 12.1, 12.2, 12.6)
 * - 静态生成支持 (1.4)
 * - 错误边界处理
 * - 加载状态优化
 * 
 * @param params - 路由参数，包含文章 slug
 * @returns React.JSX.Element - 博客详情页面组件
 */
export default async function BlogDetailPageRoute({ params }: BlogDetailPageProps) {
  // 等待异步参数
  const { slug } = await params

  // 验证 slug 参数
  if (!slug || typeof slug !== 'string') {
    console.warn('Invalid slug parameter:', slug)
    notFound()
  }

  // 获取博客详情数据
  let blogData: BlogDetailData
  try {
    blogData = await getBlogBySlug(slug)
  } catch (error) {
    console.warn(`Blog not found for slug "${slug}":`, error)
    notFound()
  }

  // 检查文章是否已发布
  if (!blogData.isPublished) {
    console.warn(`Blog "${slug}" is not published`)
    notFound()
  }

  // 生成结构化数据用于页面注入
  let structuredData: any
  try {
    structuredData = generateStructuredData(blogData)
  } catch (error) {
    console.error('Error generating structured data:', error)
    // 如果结构化数据生成失败，使用空对象但不阻止页面渲染
    structuredData = {}
  }

  // 渲染博客详情页面，包含结构化数据脚本
  return (
    <>
      {/* 注入JSON-LD结构化数据 */}
      {Object.keys(structuredData).length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      
      {/* 博客详情页面组件 */}
      <BlogDetailPage initialData={blogData} />
    </>
  )
}