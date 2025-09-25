import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { websiteDetailService } from '@/features/websites/services/websiteDetailService'
import { generateWebsiteMetadata } from '@/features/websites/utils/seoUtils'
import { WebsiteDetailData } from '@/features/websites/types/detail'
import { WebsiteDetailPage } from '@/features/websites/components/WebsiteDetailPage'

// 强制动态渲染，确保最新数据和访问权限检查
export const dynamic = 'force-dynamic'
// Cloudflare Pages 需要 Edge Runtime
export const runtime = 'edge'

/**
 * 网站详情页面路由参数类型
 */
interface WebsiteDetailPageParams {
  id: string
}

/**
 * 网站详情页面属性类型
 */
interface WebsiteDetailPageProps {
  params: Promise<WebsiteDetailPageParams>
}

/**
 * 动态生成网站详情页面的元数据
 * 
 * 根据网站内容生成SEO优化的元数据，包括：
 * - 动态标题和描述 (NFR-3.4.1 - 动态meta标签)
 * - OpenGraph和Twitter卡片支持
 * - 结构化数据标记
 * - 规范URL配置和社交分享预览
 * 
 * 本函数利用了 src/features/websites/utils/seoUtils.ts 中的工具函数，
 * 确保SEO元数据的一致性和最佳实践。
 * 
 * @param params - 路由参数，包含网站ID
 * @returns Promise<Metadata> - 生成的元数据对象
 */
export async function generateMetadata({ params }: WebsiteDetailPageProps): Promise<Metadata> {
  try {
    // 等待异步参数
    const { id } = await params

    // 获取网站详情数据
    let websiteData: WebsiteDetailData
    try {
      websiteData = await websiteDetailService.getWebsiteById(id)
    } catch (error) {
      console.warn(`Website not found for ID "${id}":`, error)
      // 如果网站不存在，返回默认元数据
      return {
        title: '网站未找到 - WebVault',
        description: '抱歉，您访问的网站不存在或已被删除。',
        robots: { index: false, follow: false }
      }
    }

    // 使用SEO工具生成完整的元数据
    const metadata = generateWebsiteMetadata(websiteData)
    
    return metadata

  } catch (error) {
    console.error('Failed to generate metadata for website:', error)
    
    // 返回备用元数据
    return {
      title: '网站详情 - WebVault',
      description: '浏览 WebVault 的精选网站资源，发现优质的在线工具和服务。',
      robots: { index: false, follow: true }
    }
  }
}

/**
 * 网站详情页面组件
 * 
 * Next.js 15 App Router 网站详情页面实现，具备以下特性：
 * - 动态路由支持 (/website/[id])
 * - 服务端渲染 (SSR) 确保 SEO 友好
 * - 完整的错误处理和 404 页面
 * - 动态元数据生成，包括结构化数据
 * - OpenGraph 和 Twitter 卡片支持
 * - 规范 URL 处理，避免重复内容
 * - 访问权限验证 (NFR-3.5.1, NFR-3.5.2)
 * - 动态渲染确保实时数据
 * 
 * SEO 优化特性：
 * - 基于网站内容的动态元数据 (NFR-3.4.1)
 * - 结构化数据标记 (WebPage + WebSite Schema)
 * - 面包屑导航支持
 * - 发布者信息和更新时间标记
 * - 社交媒体分享优化
 * - 图片SEO优化（alt标签、尺寸）
 * 
 * 权限控制：
 * - 只显示状态为'active'且'is_public'为true的网站 (NFR-3.5.1)
 * - 当网站不存在或无权访问时显示404错误页面 (NFR-3.5.2)
 * 
 * 需求满足：
 * - 网站信息展示 (AC-2.1.1)
 * - 动态元数据生成 (NFR-3.4.1)
 * - 访问权限控制 (NFR-3.5.1, NFR-3.5.2)
 * - 错误边界处理
 * 
 * @param params - 路由参数，包含网站 ID
 * @returns React.JSX.Element - 网站详情页面组件
 */
export default async function WebsiteDetailPageRoute({ params }: WebsiteDetailPageProps) {
  // 等待异步参数
  const { id } = await params

  // 验证 ID 参数
  if (!id || typeof id !== 'string') {
    console.warn('Invalid website ID parameter:', id)
    notFound()
  }

  // 获取网站详情数据
  let websiteData: WebsiteDetailData
  try {
    websiteData = await websiteDetailService.getWebsiteById(id)
  } catch (error) {
    console.warn(`Website not found for ID "${id}":`, error)
    notFound()
  }

  // 验证网站访问权限 (NFR-3.5.1, NFR-3.5.2)
  // 只显示状态为'active'且'is_public'为true的网站
  if (!websiteData.is_public || websiteData.status !== 'active') {
    console.warn(`Website "${id}" is not accessible or not active`)
    notFound()
  }

  // 渲染网站详情页面组件
  return <WebsiteDetailPage initialData={websiteData} />
}
