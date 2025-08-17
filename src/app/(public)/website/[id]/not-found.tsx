'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WebsiteCard } from '@/features/websites/components/WebsiteCard'
import { getMockWebsitesList, getAllMockCategories } from '@/features/websites/data/mockWebsites'
import { Search, ArrowLeft, Globe, TrendingUp } from 'lucide-react'

/**
 * 网站详情页面404错误处理组件
 * 
 * 当用户访问不存在的网站时显示的自定义404页面
 * 
 * 功能特性：
 * - 友好的错误提示信息
 * - 返回首页和搜索页面的导航链接
 * - 推荐精选网站展示（最新3个）
 * - 分类快速导航和网站发现
 * - 响应式布局设计
 * - 用户体验优化的视觉反馈
 * 
 * UI组件：
 * - 使用 shadcn/ui Button 组件
 * - 复用 WebsiteCard 组件展示推荐网站
 * - 使用 Lucide 图标增强视觉效果
 * 
 * 数据源：
 * - 复用 mockWebsites 数据获取推荐网站
 * - 展示特色和高评分的3个网站作为推荐
 * 
 * SEO优化：
 * - 设置 noindex 避免影响SEO
 * - 提供友好的404状态码
 * - 包含结构化导航链接
 * 
 * 需求满足：
 * - 任务2.3：创建网站详情页面404错误处理
 * - NFR-3.5.2：404错误处理
 * - 用户体验优化
 */
export default function WebsiteNotFound() {
  // 获取推荐网站（特色或高评分的3个）
  const allWebsites = getMockWebsitesList(50) // 获取足够多的数据用于筛选
  const recommendedWebsites = allWebsites
    .filter(website => website.is_featured || (website.rating && website.rating >= 4.5))
    .slice(0, 3)
  
  // 获取分类列表
  const categories = getAllMockCategories().slice(0, 6) // 显示前6个分类

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
                <Globe className="w-16 h-16 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              网站未找到
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              抱歉，您访问的网站不存在或已被删除。
              <br />
              请检查URL是否正确，或浏览我们的精选网站资源。
            </p>
          </div>

          {/* 主要操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/">
              <Button size="lg" className="min-w-40 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Button>
            </Link>
            
            <Link href="/search">
              <Button variant="outline" size="lg" className="min-w-40 flex items-center gap-2">
                <Search className="w-4 h-4" />
                搜索网站
              </Button>
            </Link>
          </div>

          {/* 推荐网站部分 */}
          {recommendedWebsites.length > 0 && (
            <div className="text-left">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  精选推荐
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recommendedWebsites.map((website, index) => (
                  <Link 
                    key={website.id} 
                    href={`/website/${website.id}`}
                    className="block transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
                  >
                    <WebsiteCard 
                      website={website} 
                      className="h-full"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 分类导航 */}
          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-3">
              寻找特定类型的网站？
            </h3>
            <p className="text-muted-foreground mb-4">
              尝试使用搜索功能查找您感兴趣的网站，或浏览以下分类：
            </p>
            
            {/* 分类快速导航 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Link key={category} href={`/category?type=${encodeURIComponent(category)}`}>
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
                href="/submit" 
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
              >
                提交网站
              </Link>
              {' '}或{' '}
              <Link 
                href="/" 
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
              >
                返回首页
              </Link>
              {' '}继续探索更多优质网站资源。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}