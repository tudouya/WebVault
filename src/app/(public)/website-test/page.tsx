'use client'

import React from 'react'
import { WebsiteDetailPage } from '@/features/websites/components/WebsiteDetailPage'
import { mockWebsites } from '@/features/websites/data/mockWebsites'
import { WebsiteDetailData } from '@/features/websites/types/detail'
import type { WebsiteCardData } from '@/features/websites/types/website'

// 将第一个网站数据转换为详情格式进行测试
function convertToDetailData(website: WebsiteCardData): WebsiteDetailData {
  return {
    ...website,
    content: website.description || '',
    language: 'zh-CN',
    popularity_score: 0.8,
    last_checked_at: new Date().toISOString(),
    is_accessible: true,
    status: 'active',
    is_public: true,

    // Missing properties
    tags: [],
    isAd: false,
    visitCount: (typeof website.visit_count === 'number' ? website.visit_count : 0),
    is_featured: false,
    category: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // SEO 元数据
    meta_title: website.title,
    meta_description: website.description || '',
    
    // 模拟统计数据
    stats: {
      total_visits: (typeof website.visit_count === 'number' ? website.visit_count : 0),
      monthly_visits: Math.floor((typeof website.visit_count === 'number' ? website.visit_count : 0) * 0.3),
      weekly_visits: Math.floor((typeof website.visit_count === 'number' ? website.visit_count : 0) * 0.1),
      daily_visits: Math.floor((typeof website.visit_count === 'number' ? website.visit_count : 0) * 0.02),
      bounce_rate: 0.4 + Math.random() * 0.4,
      avg_session_duration: 120 + Math.random() * 300
    },
    
    // 相关网站推荐
    related_websites: mockWebsites.slice(1, 4),
    
    // 功能特性
    features: ['开源', '免费'],
    
    // 定价信息
    pricing: {
      is_free: true,
      has_paid_plans: false,
      starting_price: '免费',
      currency: 'CNY'
    }
  }
}

export default function WebsiteTestPage() {
  const testWebsite = convertToDetailData(mockWebsites[0]) // GitHub

  return (
    <WebsiteDetailPage 
      initialData={testWebsite}
      onWebsiteVisit={(id, url) => {
        console.log('访问网站:', id, url)
      }}
      onTagClick={(tag) => {
        console.log('点击标签:', tag)
      }}
    />
  )
}
