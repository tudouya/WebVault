import { Metadata } from 'next'
import dynamic from 'next/dynamic'

// 动态导入 HomePage 组件以避免构建时的客户端问题
const HomePage = dynamic(
  () => import('@/features/websites/components').then(mod => ({ default: mod.HomePage })),
  {
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }
)

export const metadata: Metadata = {
  title: 'WebVault - 首页',
  description: '发现和收藏优质网站资源',
}

/**
 * 主页面路由组件
 * 
 * 集成完整的 HomePage 组件，提供 WebVault 网站目录的完整首页体验
 * 保持 Next.js 15 App Router 的 SSR 特性和 metadata 配置
 * 
 * 使用 Next.js 动态导入避免构建时客户端组件问题
 */
export default function HomePageRoute() {
  return <HomePage />
}