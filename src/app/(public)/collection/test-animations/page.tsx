'use client';

import React from 'react';
import { CollectionCard } from '@/features/websites/components/CollectionCard';
import { CollectionGrid } from '@/features/websites/components/CollectionGrid';
import { mockCollections } from '@/features/websites/data/mockCollections';

/**
 * 动画效果测试页面
 * 用于验证集合卡片的悬停效果和交互动画
 */
export default function CollectionAnimationTestPage() {
  // 取前6个mock数据进行测试
  const testCollections = mockCollections.slice(0, 6);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          集合卡片动画效果测试
        </h1>
        
        {/* 单个卡片测试 */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">单个卡片悬停效果</h2>
          <div className="max-w-md">
            <CollectionCard 
              collection={testCollections[0]}
              onClick={(collection) => console.log('Clicked:', collection.title)}
              onTagClick={(tag) => console.log('Tag clicked:', tag)}
            />
          </div>
        </section>

        {/* 网格布局测试 */}
        <section>
          <h2 className="text-xl font-semibold mb-6">网格布局加载动画</h2>
          <CollectionGrid
            collections={testCollections}
            onCollectionClick={(collection) => console.log('Collection clicked:', collection.title)}
            onTagClick={(tag) => console.log('Tag clicked:', tag)}
          />
        </section>

        {/* 加载状态测试 */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-6">加载状态动画</h2>
          <CollectionGrid
            collections={[]}
            isLoading={true}
          />
        </section>
      </div>
    </div>
  );
}