/**
 * ReadingProgress 组件使用示例
 * 
 * 展示如何在博客详情页面中集成和使用阅读进度组件
 * 包含基础用法、高级配置和自定义主题的示例
 */

'use client';

import React, { useState } from 'react';
import { ReadingProgress, useReadingProgress } from './ReadingProgress';
import { BlogDetailPage } from './BlogDetailPage';
import type { BlogDetailData } from '../types';

/**
 * 基础用法示例
 * 最简单的阅读进度条集成
 */
export function BasicReadingProgressExample() {
  return (
    <div className="relative">
      {/* 基础阅读进度条 */}
      <ReadingProgress />
      
      {/* 页面内容 */}
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">文章标题</h1>
        <div className="space-y-4">
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i} className="text-gray-700">
              这是第 {i + 1} 段内容。Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 高级配置示例
 * 包含百分比显示、自定义样式和回调函数
 */
export function AdvancedReadingProgressExample() {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [readingStats, setReadingStats] = useState({
    startTime: Date.now(),
    readingTime: 0
  });

  const handleProgressChange = (progress: number) => {
    setCurrentProgress(progress);
    
    // 计算阅读时间
    if (progress > 5) {
      setReadingStats(prev => ({
        ...prev,
        readingTime: Date.now() - prev.startTime
      }));
    }
  };

  return (
    <div className="relative">
      {/* 高级配置的阅读进度条 */}
      <ReadingProgress
        showPercentage={true}
        height={4}
        smooth={true}
        minThreshold={5}
        maxThreshold={95}
        onProgressChange={handleProgressChange}
        className="z-50"
      />
      
      {/* 阅读统计信息 */}
      <div className="fixed top-16 right-4 bg-white shadow-lg rounded-lg p-4 text-sm">
        <h3 className="font-semibold mb-2">阅读统计</h3>
        <div className="space-y-1">
          <div>进度: {Math.round(currentProgress)}%</div>
          <div>用时: {Math.round(readingStats.readingTime / 1000)}秒</div>
        </div>
      </div>
      
      {/* 页面内容 */}
      <div className="min-h-screen p-8 pt-20">
        <h1 className="text-3xl font-bold mb-6">高级阅读进度示例</h1>
        <div className="max-w-4xl mx-auto space-y-6">
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">章节 {i + 1}</h2>
              <p className="text-gray-700 leading-relaxed">
                这是第 {i + 1} 个章节的内容。在这个示例中，你可以看到阅读进度条的高级功能，
                包括百分比显示、自定义高度、进度回调等特性。当你滚动页面时，
                右上角会显示实时的阅读统计信息。
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 在 BlogDetailPage 中集成示例
 * 展示如何在实际的博客页面中使用阅读进度组件
 */
export function BlogDetailWithReadingProgressExample() {
  // 模拟博客数据
  const mockBlogData: BlogDetailData = {
    id: 'example-blog',
    title: '如何在React中实现阅读进度指示器',
    excerpt: '学习如何在React中实现优雅的阅读进度指示器，提升用户阅读体验。',
    slug: 'react-reading-progress-indicator',
    keywords: ['React', '阅读进度', '用户体验', 'TypeScript'],
    isPublished: true,
    content: `
      <h2>引言</h2>
      <p>阅读进度指示器是现代博客和文章网站的重要用户体验功能...</p>
      
      <h2>实现原理</h2>
      <p>阅读进度的计算基于页面的滚动位置和内容高度...</p>
      
      <h2>技术实现</h2>
      <p>我们使用React Hooks来管理状态和事件监听...</p>
      
      <h2>性能优化</h2>
      <p>为了确保良好的性能，我们需要对滚动事件进行节流处理...</p>
      
      <h2>主题适配</h2>
      <p>组件支持亮色和暗色主题的自动适配...</p>
      
      <h2>无障碍性支持</h2>
      <p>我们添加了完整的ARIA属性支持，确保屏幕阅读器用户也能获得良好体验...</p>
      
      <h2>总结</h2>
      <p>通过合理的设计和实现，阅读进度组件能够显著提升用户的阅读体验...</p>
    `,
    contentType: 'html',
    author: {
      name: '张开发',
      bio: '前端工程师，专注于用户体验设计',
      avatar: '/avatars/author-1.jpg'
    },
    category: '技术分享',
    tags: ['React', 'TypeScript', '用户体验', '前端开发'],
    publishedAt: '2024-01-15T10:00:00Z',
    readingTime: 8,
    coverImage: '/images/blog/reading-progress-cover.jpg',
    viewCount: 1250,
    likeCount: 89
  };

  return (
    <div className="relative">
      {/* 集成阅读进度条 */}
      <ReadingProgress
        showPercentage={true}
        height={3}
        targetSelector="#blog-detail-content"
        minThreshold={2}
      />
      
      {/* 博客详情页面 */}
      <div id="blog-detail-content">
        <BlogDetailPage
          initialData={mockBlogData}
          className="relative z-10"
        />
      </div>
    </div>
  );
}

/**
 * 使用 Hook 的自定义实现示例
 * 展示如何使用 useReadingProgress Hook 创建自定义进度显示
 */
export function CustomReadingProgressExample() {
  const { progress, isReading } = useReadingProgress();

  return (
    <div className="relative">
      {/* 自定义进度显示 */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white shadow-lg rounded-full px-6 py-2 flex items-center space-x-3">
          {/* 状态指示器 */}
          <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
            isReading ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          
          {/* 进度文字 */}
          <span className="text-sm font-medium text-gray-700">
            {isReading ? '正在阅读' : '未开始'} • {Math.round(progress)}%
          </span>
          
          {/* 圆形进度条 */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
                className="text-blue-500 transition-all duration-300"
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* 页面内容 */}
      <div className="min-h-screen p-8 pt-20">
        <h1 className="text-3xl font-bold mb-6">自定义阅读进度示例</h1>
        <div className="max-w-4xl mx-auto space-y-6">
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className="prose prose-lg">
              <h2>段落 {i + 1}</h2>
              <p>
                这是一个使用自定义 Hook 实现的阅读进度示例。
                顶部的进度指示器使用了不同的视觉设计，
                包括状态指示器、进度文字和圆形进度条。
                这展示了如何基于基础的 useReadingProgress Hook 
                创建完全自定义的进度显示组件。
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 响应式和主题适配示例
 * 展示在不同设备和主题下的表现
 */
export function ResponsiveReadingProgressExample() {
  const [showMobile, setShowMobile] = useState(false);

  return (
    <div className="relative">
      {/* 响应式阅读进度条 */}
      <ReadingProgress
        showPercentage={!showMobile}
        height={showMobile ? 2 : 3}
        className={showMobile ? 'lg:hidden' : ''}
      />
      
      {/* 移动端专用进度条 */}
      {showMobile && (
        <ReadingProgress
          showPercentage={false}
          height={2}
          className="hidden lg:block"
        />
      )}
      
      {/* 控制面板 */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4">
        <h3 className="font-semibold mb-2">设备模拟</h3>
        <button
          onClick={() => setShowMobile(!showMobile)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {showMobile ? '桌面视图' : '移动视图'}
        </button>
      </div>
      
      {/* 页面内容 */}
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">响应式阅读进度</h1>
          <div className="space-y-4 sm:space-y-6">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                  响应式设计要点 {i + 1}
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  在不同设备上，阅读进度组件会自动调整其表现形式。
                  移动设备上会隐藏百分比显示以节省空间，
                  而在桌面设备上则提供完整的功能体验。
                  这确保了在所有设备上都能获得最佳的用户体验。
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 导出所有示例组件
 */
export const ReadingProgressExamples = {
  Basic: BasicReadingProgressExample,
  Advanced: AdvancedReadingProgressExample,
  BlogDetail: BlogDetailWithReadingProgressExample,
  Custom: CustomReadingProgressExample,
  Responsive: ResponsiveReadingProgressExample,
};