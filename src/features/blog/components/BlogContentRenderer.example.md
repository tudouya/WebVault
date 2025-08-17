# BlogContentRenderer 组件使用示例

## 组件功能特性

### 1. Markdown 解析支持
- ✅ 标题解析 (H1-H6)
- ✅ 段落和换行
- ✅ 粗体和斜体格式
- ✅ 链接（内部链接和外部链接）
- ✅ 图片（支持懒加载和响应式）
- ✅ 代码块（支持语法高亮和复制功能）
- ✅ 行内代码
- ✅ 引用块
- ✅ 列表（有序和无序）

### 2. 安全特性
- ✅ XSS 防护
- ✅ 危险 HTML 标签过滤
- ✅ 安全的内容渲染

### 3. 用户体验增强
- ✅ 代码块复制功能
- ✅ 图片懒加载
- ✅ 响应式设计
- ✅ 暗色模式支持

### 4. 可配置选项
- ✅ 启用/禁用代码复制
- ✅ 启用/禁用图片懒加载
- ✅ 自定义图片最大宽度
- ✅ 代码块主题选择

## 基础使用

```tsx
import { BlogContentRenderer } from '@/features/blog/components/BlogContentRenderer';

// 基础 Markdown 渲染
<BlogContentRenderer 
  content={markdownContent}
  contentType="markdown"
/>

// HTML 内容渲染
<BlogContentRenderer 
  content={htmlContent}
  contentType="html"
/>
```

## 高级配置

```tsx
// 自定义配置
<BlogContentRenderer 
  content={content}
  contentType="markdown"
  config={{
    enableSyntaxHighlighting: true,
    enableImageLazyLoading: true,
    enableCodeCopy: true,
    maxImageWidth: '800px',
    codeTheme: 'dark',
  }}
  className="custom-blog-content"
  articleTitle="我的博客文章"
/>
```

## 示例内容

```markdown
# 示例博客文章

这是一个**粗体文本**和*斜体文本*的示例。

## 代码示例

```javascript
const greet = (name) => {
  console.log(`Hello, ${name}!`);
};

greet('World');
```

## 图片示例

![示例图片](https://example.com/image.jpg)

## 链接示例

[内部链接](/about) | [外部链接](https://example.com)

## 引用示例

> 这是一个引用块的示例，展示了重要的信息。

## 列表示例

### 无序列表
- 项目 1
- 项目 2
- 项目 3

### 有序列表
1. 第一项
2. 第二项
3. 第三项
```

## 集成说明

该组件已集成到博客功能模块中，可与以下组件配合使用：

- `BlogDetailPage` - 博客详情页面
- `BlogCard` - 博客卡片组件
- `BlogGrid` - 博客网格布局

## Requirements 满足情况

- ✅ **Requirements 2.1**: 适合长文本阅读的排版样式
- ✅ **Requirements 2.2**: 图片响应式显示和代码块语法高亮
- ✅ **Requirements 10.1**: 代码块设计要求
- ✅ **Requirements 10.2**: 多媒体内容设计要求

## 测试覆盖

- ✅ 基础渲染功能
- ✅ Markdown 解析
- ✅ HTML 内容处理
- ✅ 安全性验证
- ✅ 配置选项
- ✅ 可访问性
- ✅ 响应式设计
- ✅ 性能优化

## 注意事项

1. **代码复制功能**: 需要浏览器支持 Clipboard API
2. **图片懒加载**: 使用原生 `loading="lazy"` 属性
3. **样式集成**: 与项目的 Typography 系统完全集成
4. **安全性**: 自动过滤危险的 HTML 内容和脚本