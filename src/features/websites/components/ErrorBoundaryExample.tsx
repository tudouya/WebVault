/**
 * ErrorBoundary 使用示例组件
 * 
 * 此文件仅用于演示 ErrorBoundary 的使用方法
 * 在实际开发中可以删除
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';

// 故意会出错的组件
function BuggyComponent({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('这是一个测试错误 - ErrorBoundary 示例');
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-800">组件正常运行!</p>
    </div>
  );
}

// 使用 HOC 包装的组件
const BuggyComponentWithErrorBoundary = withErrorBoundary(BuggyComponent, {
  level: 'component',
  onError: (error, errorInfo) => {
    console.log('HOC ErrorBoundary 捕获到错误:', error.message);
  }
});

// 网络错误模拟组件
function NetworkErrorComponent({ shouldFail }: { shouldFail: boolean }) {
  if (shouldFail) {
    const networkError = new Error('Failed to fetch data from server');
    networkError.name = 'NetworkError';
    throw networkError;
  }
  
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-blue-800">网络请求成功!</p>
    </div>
  );
}

/**
 * ErrorBoundary 使用示例页面
 */
export function ErrorBoundaryExample() {
  const [crashApp, setCrashApp] = useState(false);
  const [crashComponent, setCrashComponent] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const errorHandler = useErrorHandler();

  const handleManualError = () => {
    const error = new Error('手动触发的错误');
    errorHandler(error);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ErrorBoundary 使用示例</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 页面级错误边界 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">页面级错误边界</h3>
            <ErrorBoundary
              level="page"
              onError={(error, errorInfo) => {
                console.log('页面级 ErrorBoundary:', error.message);
              }}
            >
              <BuggyComponent shouldCrash={crashApp} />
            </ErrorBoundary>
            <Button 
              onClick={() => setCrashApp(!crashApp)}
              variant="destructive"
              className="mt-2"
            >
              {crashApp ? '恢复页面' : '触发页面错误'}
            </Button>
          </div>

          {/* 区块级错误边界 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">区块级错误边界</h3>
            <ErrorBoundary
              level="section"
              onError={(error, errorInfo) => {
                console.log('区块级 ErrorBoundary:', error.message);
              }}
            >
              <NetworkErrorComponent shouldFail={networkError} />
            </ErrorBoundary>
            <Button 
              onClick={() => setNetworkError(!networkError)}
              variant="destructive"
              className="mt-2"
            >
              {networkError ? '恢复网络' : '触发网络错误'}
            </Button>
          </div>

          {/* 组件级错误边界 (使用 HOC) */}
          <div>
            <h3 className="text-lg font-semibold mb-3">组件级错误边界 (HOC)</h3>
            <BuggyComponentWithErrorBoundary shouldCrash={crashComponent} />
            <Button 
              onClick={() => setCrashComponent(!crashComponent)}
              variant="destructive"
              className="mt-2"
            >
              {crashComponent ? '恢复组件' : '触发组件错误'}
            </Button>
          </div>

          {/* 手动触发错误 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">手动触发错误</h3>
            <p className="text-sm text-muted-foreground mb-3">
              使用 useErrorHandler Hook 手动触发错误
            </p>
            <Button 
              onClick={handleManualError}
              variant="outline"
            >
              手动触发错误
            </Button>
          </div>

          {/* 使用说明 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">使用说明</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>页面级:</strong> 用于整个页面或路由的错误边界，显示全屏错误页面</p>
              <p>• <strong>区块级:</strong> 用于页面中的重要区块，显示卡片样式的错误信息</p>
              <p>• <strong>组件级:</strong> 用于小型组件，显示最小化的错误提示</p>
              <p>• <strong>HOC方式:</strong> 使用 withErrorBoundary 高阶组件包装</p>
              <p>• <strong>Hook方式:</strong> 使用 useErrorHandler 手动处理错误</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundaryExample;