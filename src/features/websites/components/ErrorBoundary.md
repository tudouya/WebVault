# ErrorBoundary 组件使用指南

## 概述

ErrorBoundary 是一个 React 错误边界组件，用于捕获组件树中的 JavaScript 错误，记录错误信息并显示优雅的降级 UI，防止整个应用崩溃。

## 功能特性

- ✅ **多层级支持**: 页面级、区块级、组件级三种错误处理级别
- ✅ **智能错误类型检测**: 自动识别网络、数据、权限、渲染等错误类型
- ✅ **友好的用户界面**: 根据错误类型和级别显示不同的降级 UI
- ✅ **重试功能**: 提供重试按钮和自动恢复机制
- ✅ **开发调试支持**: 开发环境显示详细错误信息和组件堆栈
- ✅ **灵活的错误处理**: 支持自定义错误回调和回退组件
- ✅ **状态重置**: 支持基于 props 变化或重置键的自动重置

## 基本使用

### 1. 直接使用组件

```tsx
import { ErrorBoundary } from '@/features/websites/components';

function App() {
  return (
    <ErrorBoundary 
      level="page"
      onError={(error, errorInfo) => {
        console.log('错误捕获:', error);
        // 发送错误报告到监控服务
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### 2. 使用高阶组件 (HOC)

```tsx
import { withErrorBoundary } from '@/features/websites/components';

const SafeComponent = withErrorBoundary(YourComponent, {
  level: 'component',
  onError: (error) => console.log('HOC 错误:', error)
});
```

### 3. 使用 Hook 手动处理

```tsx
import { useErrorHandler } from '@/features/websites/components';

function YourComponent() {
  const errorHandler = useErrorHandler();
  
  const handleAsyncError = async () => {
    try {
      await riskyAsyncOperation();
    } catch (error) {
      errorHandler(error); // 触发错误边界
    }
  };
}
```

## 错误级别说明

### Page Level (页面级)
- **使用场景**: 整个页面或路由的错误边界
- **显示效果**: 全屏错误页面，包含完整的错误信息和操作按钮
- **推荐位置**: App Router 的 layout.tsx 或页面根组件

```tsx
<ErrorBoundary level="page">
  <EntirePage />
</ErrorBoundary>
```

### Section Level (区块级)
- **使用场景**: 页面中的重要功能区块
- **显示效果**: 卡片样式的错误提示，不影响页面其他部分
- **推荐位置**: 数据列表、表单区域、内容区块

```tsx
<ErrorBoundary level="section">
  <WebsiteGrid />
</ErrorBoundary>
```

### Component Level (组件级)
- **使用场景**: 小型独立组件
- **显示效果**: 最小化的错误提示和重试按钮
- **推荐位置**: 单个卡片、按钮、输入框等

```tsx
<ErrorBoundary level="component">
  <WebsiteCard />
</ErrorBoundary>
```

## 错误类型处理

组件会自动检测以下错误类型并提供相应的用户体验：

| 错误类型 | 检测条件 | 用户提示 | 建议操作 |
|---------|---------|---------|---------|
| `NETWORK` | 网络请求失败 | "网络连接问题" | 重试加载 |
| `DATA` | 数据解析失败 | "数据加载失败" | 重新加载 |
| `PERMISSION` | 权限不足 | "访问权限不足" | 返回首页 |
| `RENDER` | 组件渲染错误 | "渲染出错" | 重新加载 |
| `UNKNOWN` | 其他未知错误 | "出现了一些问题" | 重新加载 |

## 高级配置

### 自定义回退组件

```tsx
import { ErrorFallbackProps } from '@/features/websites/components';

function CustomErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="custom-error-ui">
      <h2>自定义错误页面</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>重试</button>
    </div>
  );
}

<ErrorBoundary fallback={CustomErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

### 基于状态重置

```tsx
function ParentComponent() {
  const [userId, setUserId] = useState('user1');
  
  return (
    <ErrorBoundary
      resetKeys={[userId]} // 当 userId 变化时自动重置错误状态
      resetOnPropsChange={true}
    >
      <UserProfile userId={userId} />
    </ErrorBoundary>
  );
}
```

### 错误隔离

```tsx
<ErrorBoundary isolate={true}>
  <CriticalComponent />
</ErrorBoundary>
```

## 实际应用示例

### 网站列表页面

```tsx
// src/app/(public)/page.tsx
import { ErrorBoundary } from '@/features/websites/components';

export default function HomePage() {
  return (
    <ErrorBoundary level="page">
      <div className="homepage">
        <ErrorBoundary level="section">
          <HeaderNavigation />
        </ErrorBoundary>
        
        <ErrorBoundary level="section">
          <WebsiteGrid />
        </ErrorBoundary>
        
        <ErrorBoundary level="section">
          <Pagination />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
```

### 网站卡片组件

```tsx
// src/features/websites/components/WebsiteCard.tsx
import { withErrorBoundary } from './ErrorBoundary';

function WebsiteCard({ website }: WebsiteCardProps) {
  // 组件实现
}

export default withErrorBoundary(WebsiteCard, {
  level: 'component',
  onError: (error, errorInfo) => {
    // 记录卡片渲染错误
    analytics.track('website_card_error', {
      websiteId: website.id,
      error: error.message
    });
  }
});
```

## 开发调试

在开发环境中，ErrorBoundary 会显示详细的错误信息：

- 错误消息和堆栈跟踪
- 组件堆栈信息
- 错误发生的确切位置

这些信息有助于快速定位和修复问题。

## 注意事项

1. **错误边界无法捕获以下错误**：
   - 事件处理器中的错误
   - 异步代码中的错误（setTimeout、Promise 等）
   - 服务端渲染期间的错误
   - 错误边界组件本身的错误

2. **对于异步错误**，请使用 `useErrorHandler` Hook 手动处理

3. **错误边界是 React 的单向数据流**，只能捕获其子组件树中的错误

4. **在生产环境中**，避免向用户显示技术细节，保持错误信息的用户友好性

## TypeScript 支持

组件提供完整的 TypeScript 类型定义：

```tsx
import type { 
  ErrorBoundaryProps, 
  ErrorFallbackProps, 
  ErrorInfo,
  ErrorType 
} from '@/features/websites/components';
```

## 与监控服务集成

```tsx
import * as Sentry from '@sentry/nextjs';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // 发送到 Sentry
    Sentry.captureException(error, {
      tags: {
        component: errorInfo.errorBoundary,
        errorType: errorInfo.type
      },
      extra: {
        componentStack: errorInfo.componentStack
      }
    });
  }}
>
  <YourApp />
</ErrorBoundary>
```