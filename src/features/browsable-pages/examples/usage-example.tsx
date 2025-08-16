/**
 * URL状态同步使用示例
 * 
 * 展示如何在不同类型的浏览页面中集成URL状态管理功能
 */

'use client';

import { useEffect } from 'react';
import { 
  useBrowsablePageUrlSync,
  useBrowsablePageStore,
} from '../stores/browsable-page-store';
import type { BrowsablePageConfig } from '../types';
import { DEFAULT_PAGE_CONFIG } from '../types';
import { BrowsablePageUrlManager } from '../components/BrowsablePageUrlManager';

// 示例1：集合详情页 URL同步
export function CollectionPageExample({ collectionSlug }: { collectionSlug: string }) {
  const store = useBrowsablePageStore();
  const { actions } = store;
  
  // 配置集合页面
  const collectionConfig: BrowsablePageConfig = {
    ...DEFAULT_PAGE_CONFIG,
    pageType: 'collection',
    filters: {
      ...DEFAULT_PAGE_CONFIG.filters,
      searchEnabled: true,
      categoryEnabled: true,
      tagEnabled: true,
    },
  };

  useEffect(() => {
    // 设置页面配置
    actions.setConfig(collectionConfig);
  }, [actions]);

  return (
    <div>
      {/* URL状态管理器 - 放在页面顶层 */}
      <BrowsablePageUrlManager autoInitialize debug />
      
      <h1>集合页面: {collectionSlug}</h1>
      <p>URL参数会自动同步到store状态，支持浏览器前进后退</p>
      
      {/* 页面内容组件会从store读取状态 */}
      <CollectionContent />
    </div>
  );
}

// 示例2：分类浏览页 URL同步
export function CategoryPageExample() {
  const urlSync = useBrowsablePageUrlSync();
  const store = useBrowsablePageStore();
  
  // 手动同步URL到store (如果不使用BrowsablePageUrlManager组件)
  useEffect(() => {
    urlSync.syncStoreFromUrl();
  }, []);

  // 监听筛选条件变化，自动更新URL
  useEffect(() => {
    if (store.meta.isInitialized) {
      urlSync.syncUrlFromStore();
    }
  }, [store.filters, store.meta.isInitialized]);

  return (
    <div>
      <h1>分类浏览页</h1>
      
      {/* 手动同步状态的示例 */}
      <button onClick={() => urlSync.syncUrlFromStore()}>
        强制同步到URL
      </button>
      
      <button onClick={() => urlSync.syncStoreFromUrl()}>
        从URL强制同步
      </button>
      
      <CategoryContent />
    </div>
  );
}

// 示例3：标签页面的URL状态管理
export function TagPageExample() {
  const store = useBrowsablePageStore();
  const { actions } = store;

  // 标签页面配置
  const tagConfig: BrowsablePageConfig = {
    ...DEFAULT_PAGE_CONFIG,
    pageType: 'tag',
    filters: {
      ...DEFAULT_PAGE_CONFIG.filters,
      searchEnabled: true,
      categoryEnabled: true, // 标签页面可以按分类筛选
    },
  };

  useEffect(() => {
    actions.setConfig(tagConfig);
  }, []);

  return (
    <div>
      {/* 带错误处理的URL管理器 */}
      <BrowsablePageUrlManager 
        autoInitialize
        onError={(error) => console.error('URL同步错误:', error)}
        onInitialized={() => console.log('URL状态已初始化')}
      />
      
      <h1>标签页面</h1>
      <TagContent />
    </div>
  );
}

// 示例4：复杂URL操作
export function AdvancedUrlExample() {
  const urlSync = useBrowsablePageUrlSync();
  const store = useBrowsablePageStore();

  // 展示当前URL状态
  const currentUrlParams = urlSync.urlState;
  
  // 展示当前store状态
  const currentFilters = store.filters;

  const handleComplexFilter = () => {
    // 复杂的筛选操作
    store.actions.updateFilters({
      search: 'react',
      categoryId: 'frontend',
      selectedTags: ['javascript', 'typescript'],
      sortBy: 'rating',
      sortOrder: 'desc',
      featuredOnly: true,
    });
  };

  const handleResetWithUrl = () => {
    // 重置所有筛选并清空URL
    store.actions.resetFilters();
    urlSync.setUrlState({});
  };

  return (
    <div className="space-y-4">
      <h2>高级URL操作示例</h2>
      
      {/* 当前状态显示 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3>当前URL参数:</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(currentUrlParams, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3>当前Store状态:</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify({
              search: currentFilters.search,
              categoryId: currentFilters.categoryId,
              selectedTags: currentFilters.selectedTags,
              sortBy: currentFilters.sortBy,
              sortOrder: currentFilters.sortOrder,
              currentPage: currentFilters.currentPage,
            }, null, 2)}
          </pre>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button 
          onClick={handleComplexFilter}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          应用复杂筛选
        </button>
        
        <button 
          onClick={handleResetWithUrl}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          重置并清空URL
        </button>
        
        <button 
          onClick={() => urlSync.syncUrlFromStore()}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          强制同步到URL
        </button>
      </div>

      {/* 同步状态指示器 */}
      <div className="text-sm text-gray-600">
        <p>URL同步状态: {store.meta.urlSyncEnabled ? '启用' : '禁用'}</p>
        <p>正在同步: {store.meta.isSyncingUrl ? '是' : '否'}</p>
        <p>上次同步: {store.meta.lastUrlSync || '未知'}</p>
      </div>
    </div>
  );
}

// 模拟内容组件
function CollectionContent() {
  const store = useBrowsablePageStore();
  return (
    <div>
      <p>集合内容组件</p>
      <p>当前搜索: {store.filters.search || '无'}</p>
      <p>当前分类: {store.filters.categoryId || '无'}</p>
      <p>当前页面: {store.filters.currentPage || 1}</p>
    </div>
  );
}

function CategoryContent() {
  const store = useBrowsablePageStore();
  return (
    <div>
      <p>分类内容组件</p>
      <p>活跃筛选器数量: {store.actions.getActiveFiltersCount()}</p>
    </div>
  );
}

function TagContent() {
  const store = useBrowsablePageStore();
  return (
    <div>
      <p>标签内容组件</p>
      <p>选中的标签: {store.filters.selectedTags?.join(', ') || '无'}</p>
    </div>
  );
}