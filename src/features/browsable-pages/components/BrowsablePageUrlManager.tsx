/**
 * Browsable Page URL Manager Component
 * 
 * 负责在浏览页面中集成URL状态同步功能的组件
 * 自动处理URL参数与store状态的双向同步，支持浏览器前进后退和错误恢复
 * 
 * 使用方式：
 * ```tsx
 * function CollectionPage() {
 *   return (
 *     <div>
 *       <BrowsablePageUrlManager />
 *       {/* 其他页面内容 *\/}
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useBrowsablePageUrlSyncWithRecovery, useBrowsablePageStore } from '../stores/browsable-page-store';

interface BrowsablePageUrlManagerProps {
  /** 是否在组件挂载时自动初始化 */
  autoInitialize?: boolean;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 自定义错误处理回调 */
  onError?: (error: string) => void;
  /** 初始化完成回调 */
  onInitialized?: () => void;
}

/**
 * URL状态管理器组件
 * 
 * 这是一个无UI组件，专门负责处理URL状态同步逻辑
 * 通常应该放在页面组件的顶层，确保在其他组件渲染前初始化URL状态
 */
export function BrowsablePageUrlManager({
  autoInitialize = true,
  debug = false,
  onError,
  onInitialized,
}: BrowsablePageUrlManagerProps) {
  const urlSync = useBrowsablePageUrlSyncWithRecovery();
  const store = useBrowsablePageStore();
  
  const {
    smartInitialize,
    syncWithRecovery,
    errorCount,
    canRetry,
    resetErrors,
  } = urlSync;
  
  // 从store直接获取状态
  const isUrlSyncEnabled = store.meta.urlSyncEnabled;
  const isSyncingUrl = store.meta.isSyncingUrl;
  const lastUrlSync = store.meta.lastUrlSync;
  const debugInfo = useMemo(() => ({
    lastUrlState: 'N/A',
    lastStoreState: 'N/A',
    hasPendingSync: false,
  }), []);

  // 组件挂载时初始化URL状态
  useEffect(() => {
    if (autoInitialize) {
      smartInitialize();
      onInitialized?.();
    }
  }, [autoInitialize, smartInitialize, onInitialized]);

  // 监控错误状态并调用错误处理回调
  useEffect(() => {
    if (errorCount > 0 && onError) {
      onError(`URL状态同步错误，已重试 ${errorCount} 次`);
    }
  }, [errorCount, onError]);

  // 调试信息输出
  useEffect(() => {
    if (debug) {
      console.group('🔗 BrowsablePageUrlManager Debug Info');
      console.log('URL Sync Enabled:', isUrlSyncEnabled);
      console.log('Is Syncing:', isSyncingUrl);
      console.log('Last Sync:', lastUrlSync);
      console.log('Error Count:', errorCount);
      console.log('Can Retry:', canRetry);
      console.log('Debug Info:', debugInfo);
      console.groupEnd();
    }
  }, [debug, isUrlSyncEnabled, isSyncingUrl, lastUrlSync, errorCount, canRetry, debugInfo]);

  // 当发生错误且可以重试时，提供重试机制
  useEffect(() => {
    if (errorCount > 0 && canRetry) {
      // 提供自动重试机制（可选）
      const retryTimeout = setTimeout(() => {
        console.log('🔄 Attempting to recover URL sync...');
        resetErrors();
        syncWithRecovery('fromUrl');
      }, 5000); // 5秒后自动重试

      return () => clearTimeout(retryTimeout);
    }
  }, [errorCount, canRetry, resetErrors, syncWithRecovery]);

  // 这是一个无UI组件，不渲染任何内容
  return null;
}

/**
 * 高阶组件：为页面组件自动添加URL状态管理
 * 
 * @param WrappedComponent 要包装的页面组件
 * @param options URL管理选项
 * @returns 包装后的组件
 */
export function withBrowsablePageUrlSync<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options: Omit<BrowsablePageUrlManagerProps, 'children'> = {}
) {
  const WithUrlSync = (props: T) => {
    return (
      <>
        <BrowsablePageUrlManager {...options} />
        <WrappedComponent {...props} />
      </>
    );
  };

  WithUrlSync.displayName = `withBrowsablePageUrlSync(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithUrlSync;
}

export default BrowsablePageUrlManager;