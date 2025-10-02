import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { BlogCard } from '@/features/blog/components/BlogCard'
import { getMockBlogs } from '@/features/blog/data'
import { Search, ArrowLeft, FileX, TrendingUp } from 'lucide-react'

/**
 * 生成404页面的元数据
 */
export const metadata: Metadata = {
  title: '博客文章未找到 - WebVault',
  description: '抱歉，您访问的博客文章不存在或已被删除。浏览我们的热门文章或返回博客首页。',
  robots: { index: false, follow: false }
}

/**
 * 博客详情页面404错误处理组件
 * 
 * 当用户访问不存在的博客文章时显示的自定义404页面
 * 
 * 功能特性：
 * - 友好的错误提示信息
 * - 返回博客列表的导航链接
 * - 推荐热门文章展示（最新3篇）
 * - 搜索建议和快速导航
 * - 响应式布局设计
 * - 用户体验优化的视觉反馈
 * 
 * UI组件：
 * - 使用 shadcn/ui Button 组件
 * - 复用 BlogCard 组件展示推荐文章
 * - 使用 Lucide 图标增强视觉效果
 * 
 * 数据源：
 * - 复用 mockBlogs 数据获取推荐文章
 * - 展示最新发布的3篇文章作为推荐
 * 
 * SEO优化：
 * - 设置 noindex 避免影响SEO
 * - 提供友好的404状态码
 * - 包含结构化导航链接
 * 
 * 需求满足：
 * - 任务6：创建博客详情页面404错误处理
 * - 1.4：性能要求 - 友好的错误页面
 * - 用户体验优化
 */
export default function BlogNotFound() {
  // Mock data has been removed - use empty array
  const recommendedBlogs = getMockBlogs()

  return (
    <div className="min-h-screen bg-background">
      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* 404错误图标和标题 */}
          <div className="mb-8">
            <div className="relative mx-auto w-32 h-32 mb-6">
              {/* 404图标背景 */}
              <div className="absolute inset-0 bg-muted/30 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-full h-full">
                <FileX className="w-16 h-16 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              文章未找到
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              抱歉，您访问的博客文章不存在或已被删除。
              <br />
              请检查URL是否正确，或浏览我们的其他精彩内容。
            </p>
          </div>

          {/* 主要操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/blog">
              <Button size="lg" className="min-w-40 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回博客列表
              </Button>
            </Link>
            
            <Link href="/search">
              <Button variant="outline" size="lg" className="min-w-40 flex items-center gap-2">
                <Search className="w-4 h-4" />
                搜索文章
              </Button>
            </Link>
          </div>

          {/* 推荐文章部分 */}
          {recommendedBlogs.length > 0 && (
            <div className="text-left">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  推荐阅读
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recommendedBlogs.map((blog, index) => (
                  <Link 
                    key={blog.id} 
                    href={`/blog/${blog.slug}`}
                    className="block transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
                  >
                    <BlogCard 
                      blog={blog} 
                      animationIndex={index}
                      className="h-full"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 搜索建议 */}
          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-3">
              寻找特定内容？
            </h3>
            <p className="text-muted-foreground mb-4">
              尝试使用搜索功能查找您感兴趣的文章，或浏览以下分类：
            </p>
            
            {/* 分类快速导航 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['Technologies', 'Design', 'Lifestyle', 'Travel', 'Growth'].map((category) => (
                <Link key={category} href={`/blog?category=${encodeURIComponent(category)}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                  >
                    {category}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* 底部帮助信息 */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              如果您认为这是一个错误，请{' '}
              <Link 
                href="/contact" 
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
              >
                联系我们
              </Link>
              {' '}或{' '}
              <Link 
                href="/" 
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
              >
                返回首页
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
