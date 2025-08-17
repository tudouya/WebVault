# ReadingProgress 组件实现文档

## 概述

ReadingProgress 是一个专为博客详情页面设计的阅读进度指示器组件，提供优雅的阅读体验。该组件固定在页面顶部，实时显示当前文章的阅读进度百分比。

## 功能特性

### 核心功能
- ✅ 实时计算页面阅读进度（0-100%）
- ✅ 固定在页面顶部的进度条显示
- ✅ 平滑的CSS动画过渡效果
- ✅ 支持可选的百分比数字显示

### 主题系统
- ✅ 支持亮色和暗色主题自动适配
- ✅ 基于项目主题色彩系统 (theme.ts)
- ✅ 自动检测系统主题偏好
- ✅ 响应主题切换事件

### 性能优化
- ✅ 滚动事件节流处理（16ms，约60fps）
- ✅ 使用CSS硬件加速 (transform3d)
- ✅ 条件渲染优化（低于阈值时不渲染）
- ✅ 内存泄漏防护（组件卸载时清理事件）

### 响应式设计
- ✅ 移动端优化（隐藏百分比显示节省空间）
- ✅ 桌面端完整功能体验
- ✅ 平板设备适配
- ✅ 支持不同屏幕密度

### 无障碍性支持
- ✅ 完整的ARIA属性支持
- ✅ 屏幕阅读器友好
- ✅ 键盘导航支持
- ✅ 遵循 prefers-reduced-motion 偏好

## 技术实现

### 依赖关系
```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getBlogTheme, type BlogThemeVariant } from '../styles/theme';
```

### 核心算法
```typescript
function calculateReadingProgress(targetSelector: string): number {
  const target = targetSelector === 'body' 
    ? document.body 
    : document.querySelector(targetSelector);
    
  if (!target) return 0;

  const scrollTop = window.scrollY;
  const docHeight = target.scrollHeight;
  const winHeight = window.innerHeight;
  const scrollableHeight = docHeight - winHeight;

  if (scrollableHeight <= 0) return 0;
  
  const progress = (scrollTop / scrollableHeight) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
```

### 性能优化策略
```typescript
function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}
```

## 使用方法

### 基础用法
```tsx
import { ReadingProgress } from '@/features/blog/components';

function BlogPage() {
  return (
    <div>
      <ReadingProgress />
      {/* 页面内容 */}
    </div>
  );
}
```

### 高级配置
```tsx
<ReadingProgress
  showPercentage={true}
  height={4}
  targetSelector="#blog-content"
  minThreshold={5}
  maxThreshold={95}
  onProgressChange={(progress) => {
    console.log(`阅读进度: ${progress}%`);
  }}
/>
```

### 使用自定义Hook
```tsx
import { useReadingProgress } from '@/features/blog/components';

function CustomProgressComponent() {
  const { progress, isReading } = useReadingProgress();
  
  return (
    <div>
      进度: {Math.round(progress)}%
      状态: {isReading ? '正在阅读' : '未开始'}
    </div>
  );
}
```

## 配置选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `className` | `string` | - | 自定义CSS类名 |
| `showPercentage` | `boolean` | `false` | 是否显示百分比文字 |
| `visible` | `boolean` | `true` | 是否显示组件 |
| `targetSelector` | `string` | `'body'` | 目标容器选择器 |
| `height` | `number` | `3` | 进度条高度（像素） |
| `smooth` | `boolean` | `true` | 是否启用平滑动画 |
| `throttleDelay` | `number` | `16` | 滚动事件节流延迟（毫秒） |
| `onProgressChange` | `function` | - | 进度更新回调函数 |
| `minThreshold` | `number` | `0` | 最小显示阈值 |
| `maxThreshold` | `number` | `100` | 最大显示阈值 |

## 测试覆盖

### 单元测试
- ✅ 基础渲染测试
- ✅ 进度计算逻辑测试
- ✅ 配置选项测试
- ✅ 性能优化测试
- ✅ 主题适配测试
- ✅ 响应式行为测试
- ✅ 清理逻辑测试
- ✅ Hook功能测试

### 测试命令
```bash
npm run test src/features/blog/components/__tests__/ReadingProgress.test.tsx
```

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 16+
- ✅ iOS Safari 12+
- ✅ Chrome Android 60+

## 集成到BlogDetailPage

在 BlogDetailPage 中集成 ReadingProgress 组件：

```tsx
import { ReadingProgress } from '../ReadingProgress';

export function BlogDetailPage(props) {
  return (
    <div>
      {/* 阅读进度条 */}
      <ReadingProgress
        showPercentage={true}
        targetSelector="#blog-detail-content"
        minThreshold={2}
      />
      
      {/* 页面内容 */}
      <div id="blog-detail-content">
        {/* 博客内容 */}
      </div>
    </div>
  );
}
```

## 文件结构

```
src/features/blog/components/
├── ReadingProgress.tsx           # 主组件
├── ReadingProgress.example.tsx   # 使用示例
├── ReadingProgress.md           # 说明文档
├── __tests__/
│   └── ReadingProgress.test.tsx # 单元测试
└── index.ts                     # 导出配置
```

## 样式设计

### CSS变量支持
组件使用 theme.ts 中定义的颜色变量，确保与项目主题系统保持一致：

```css
/* 进度条背景 */
background: var(--blog-bg-page);

/* 进度指示器 */
background: linear-gradient(90deg, var(--blog-primary) 0%, var(--blog-primary-hover) 100%);

/* 发光效果 */
box-shadow: 0 0 8px var(--blog-primary)20;
```

### 响应式适配
```css
/* 移动端优化 */
@media (max-width: 640px) {
  .reading-progress-percentage {
    display: none; /* 隐藏百分比显示 */
  }
}
```

## 未来优化方向

1. **智能预测**：基于阅读速度预测剩余阅读时间
2. **章节导航**：结合文章标题提供章节跳转功能
3. **阅读统计**：记录用户阅读行为数据
4. **个性化**：支持用户自定义进度条样式
5. **社交分享**：集成阅读进度到社交分享功能

## 维护注意事项

1. 保持与项目主题系统的同步
2. 定期检查性能指标和内存使用
3. 测试不同设备和浏览器的兼容性
4. 关注无障碍性标准的更新
5. 监控用户反馈和使用数据