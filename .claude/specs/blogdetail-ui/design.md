# Design Document - Blog Detail UI

## Overview

博客详情页面UI是WebVault平台内容消费体系的核心组件，基于需求文档 `requirements.md` 和设计图 `design/6_blog_post.png` 的规格实现。该功能将扩展现有的博客系统 (`src/features/blog/`)，为用户提供完整的博客文章阅读体验，包含文章内容展示、作者信息、相关推荐和社交分享等功能。

设计采用Feature First Architecture模式，最大程度复用现有组件和类型定义，确保与平台整体架构的一致性。通过SSG/ISR策略实现高性能的SEO优化，同时支持完整的响应式设计和无障碍访问标准。

**关键设计原则**:
- 基于现有 `BlogCardData` 类型进行扩展，保持数据一致性
- 复用 shadcn/ui 设计系统和 Magic UI 动效组件
- 集成现有状态管理 (Zustand) 和路由架构 (Next.js 15 App Router)
- 实现精确的设计图规格匹配，包含代码块、作者卡片和相关文章推荐
- 提供完整的SEO优化和社交媒体分享支持

## Steering Document Alignment

### Technical Standards (tech.md)

**架构模式遵循**:
- **Feature First Architecture**: 在 `src/features/blog/` 模块内扩展，保持模块化组织
- **Next.js 15 App Router**: 使用 `/blog/[slug]/page.tsx` 动态路由结构
- **TypeScript 严格模式**: 所有组件和接口使用严格类型定义
- **Supabase 集成**: 扩展现有数据层，支持博客详情内容查询

**技术栈对齐**:
- **UI组件系统**: 基于 shadcn/ui + Radix UI 构建，复用现有设计令牌
- **动效增强**: 集成 Magic UI 组件（AnimatedShinyText, BorderBeam）
- **状态管理**: 扩展现有 Zustand store，支持文章详情状态
- **样式方案**: Tailwind CSS + CVA，复用现有 `theme.ts` 和 `typography.ts`

**性能和安全标准**:
- **SSG/ISR**: 利用 `generateStaticParams` 实现静态生成
- **XSS防护**: 富文本内容渲染安全处理
- **图片优化**: Next.js Image 组件懒加载和响应式适配

### Project Structure (structure.md)

**目录结构扩展**:
```
src/features/blog/
├── components/
│   ├── BlogDetailPage.tsx        # 新增：文章详情页面主组件
│   ├── BlogContentRenderer.tsx   # 新增：文章内容渲染组件
│   ├── AuthorCard.tsx            # 新增：作者信息卡片组件
│   ├── RelatedPosts.tsx          # 新增：相关文章推荐组件
│   ├── SocialShare.tsx           # 新增：社交分享组件
│   ├── BlogNavigation.tsx        # 新增：返回导航组件
│   └── __tests__/                # 新增：组件测试文件
├── types/
│   └── detail.ts                 # 新增：博客详情类型定义
├── services/
│   └── blog-detail.service.ts    # 新增：博客详情服务层
└── stores/
    └── blog-detail-store.ts      # 新增：博客详情状态管理

src/app/(public)/blog/
└── [slug]/
    ├── page.tsx                  # 新增：动态路由页面
    ├── loading.tsx               # 新增：加载状态页面
    └── not-found.tsx             # 新增：404页面
```

**集成策略**:
- **组件复用**: 继承现有 `HeaderNavigation`, `Footer`, `NewsletterSection`
- **类型扩展**: 基于 `BlogCardData` 扩展为 `BlogDetailData`
- **样式继承**: 复用 `animations.css`, `theme.ts`, `typography.ts`
- **测试策略**: 遵循现有 `__tests__/` 目录结构

## Code Reuse Analysis

### Existing Components to Leverage

**核心UI组件**:
- **`BlogCard`**: 复用作者信息展示逻辑和图片处理机制
- **`CategoryFilter`**: 复用分类标签样式和交互模式
- **`BlogLoadingStates`**: 复用加载状态组件和错误边界
- **`HeaderNavigation`, `Footer`, `NewsletterSection`**: 保持页面布局一致性

**共享UI库**:
- **shadcn/ui**: `Card`, `Button`, `Badge`, `Separator`, `Tooltip`
- **Magic UI**: `AnimatedShinyText`, `BorderBeam`, `NumberTicker`
- **图标系统**: Lucide React (`ArrowLeft`, `Share2`, `Copy`, `ExternalLink`)

**样式和动效系统**:
- **`animations.css`**: 复用 `blog-content-fade-in`, `blog-card-stagger-fade-in`
- **`theme.ts`**: 复用颜色令牌和间距系统
- **`typography.ts`**: 复用字体层级和排版规范

### Integration Points

**数据层集成**:
- **扩展 `BlogCardData`**: 添加完整文章内容、元数据和SEO字段
- **复用Mock数据服务**: 扩展 `mockBlogs.ts` 支持详情页面数据
- **Supabase集成**: 利用现有数据库连接和查询模式

**路由和导航**:
- **App Router**: 基于现有 `/blog` 路由结构，添加 `[slug]` 动态段
- **面包屑导航**: 集成现有导航系统，支持返回博客列表
- **URL状态同步**: 复用 Nuqs 库处理查询参数

**状态管理集成**:
- **Zustand Store**: 扩展现有 `blog-store.ts`，添加详情页面状态
- **主题系统**: 集成 `next-themes`，支持亮色/暗色模式切换
- **错误处理**: 复用现有错误边界和加载状态管理

## Architecture

本设计基于现有博客系统架构进行扩展，遵循Feature First Architecture和组件化设计原则，确保高内聚、低耦合的代码组织。

```mermaid
graph TD
    A[BlogDetailPage<br/>主页面组件] --> B[HeaderNavigation<br/>导航栏 - 复用]
    A --> C[BlogContentRenderer<br/>文章内容渲染]
    A --> D[AuthorCard<br/>作者信息卡片]
    A --> E[RelatedPosts<br/>相关文章推荐]
    A --> F[SocialShare<br/>社交分享组件]
    A --> G[BlogNavigation<br/>返回导航]
    A --> H[NewsletterSection<br/>订阅区域 - 复用]
    A --> I[Footer<br/>页脚 - 复用]
    
    C --> C1[ContentSection<br/>正文渲染]
    C --> C2[CodeBlock<br/>代码块高亮]
    C --> C3[ImageGallery<br/>图片展示]
    C --> C4[TableOfContents<br/>目录导航]
    
    D --> D1[AuthorInfo<br/>基本信息]
    D --> D2[AuthorStats<br/>统计数据]
    D --> D3[SocialLinks<br/>社交链接]
    
    E --> E1[RecommendationEngine<br/>推荐算法]
    E --> E2[BlogCard<br/>文章卡片 - 复用]
    
    F --> F1[ShareButtons<br/>分享按钮]
    F --> F2[CopyLink<br/>链接复制]
    
    subgraph "Data Layer"
        J[BlogDetailStore<br/>状态管理]
        K[BlogDetailService<br/>数据服务]
        L[Supabase Client<br/>数据库 - 复用]
    end
    
    A --> J
    J --> K
    K --> L
    
    subgraph "Route Layer"
        M["/blog/[slug]/page.tsx<br/>动态路由"]
        N[generateStaticParams<br/>静态生成]
        O[generateMetadata<br/>SEO元数据"]
    end
    
    M --> A
    M --> N
    M --> O
    
    classDef reuse fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef new fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef system fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class B,H,I,E2,L reuse
    class A,C,D,E,F,G,C1,C2,C3,C4,D1,D2,D3,E1,F1,F2,J,K new
    class M,N,O system
```

**架构分层说明**:

1. **路由层 (Route Layer)**: Next.js 15 App Router 动态路由，支持 SSG/ISR
2. **页面层 (Page Layer)**: 主页面组件，协调各子组件和状态管理
3. **组件层 (Component Layer)**: 功能组件，包含新增和复用组件
4. **数据层 (Data Layer)**: 状态管理和数据服务，扩展现有架构
5. **基础层 (Foundation Layer)**: UI库、样式系统和工具函数

## Components and Interfaces

### BlogDetailPage (主页面组件)
- **Purpose:** 博客详情页面的主容器，协调所有子组件和状态管理
- **Interfaces:**
  ```typescript
  interface BlogDetailPageProps {
    slug: string;
    className?: string;
  }
  ```
- **Dependencies:** HeaderNavigation, BlogContentRenderer, AuthorCard, RelatedPosts, SocialShare, Footer
- **Reuses:** 现有页面布局模式、主题系统、响应式断点

### BlogContentRenderer (文章内容渲染组件)
- **Purpose:** 渲染博客文章的富文本内容，支持Markdown、代码高亮和图片展示
- **Interfaces:**
  ```typescript
  interface BlogContentRendererProps {
    content: string;
    contentType: 'markdown' | 'html';
    tableOfContents?: boolean;
    onImageClick?: (imageUrl: string) => void;
  }
  ```
- **Dependencies:** CodeBlock, ImageGallery, TableOfContents
- **Reuses:** 现有typography样式、动画系统、主题变量

### AuthorCard (作者信息卡片组件)
- **Purpose:** 展示文章作者的详细信息，包含头像、简介、统计数据和社交链接
- **Interfaces:**
  ```typescript
  interface AuthorCardProps {
    author: BlogAuthorDetail;
    className?: string;
    showStats?: boolean;
    showSocialLinks?: boolean;
  }
  ```
- **Dependencies:** SocialLinks, Badge (shadcn/ui)
- **Reuses:** BlogCard的头像处理逻辑、Card组件样式、颜色令牌

### RelatedPosts (相关文章推荐组件)
- **Purpose:** 基于分类、标签或内容相似度推荐相关文章
- **Interfaces:**
  ```typescript
  interface RelatedPostsProps {
    currentPostId: string;
    maxItems?: number;
    algorithm?: 'category' | 'tags' | 'content';
    className?: string;
  }
  ```
- **Dependencies:** BlogCard (复用), RecommendationEngine
- **Reuses:** 现有BlogCard组件、网格布局系统、加载状态

### SocialShare (社交分享组件)
- **Purpose:** 提供多平台社交分享功能，支持链接复制和分享统计
- **Interfaces:**
  ```typescript
  interface SocialShareProps {
    title: string;
    url: string;
    description?: string;
    platforms?: SocialPlatform[];
    showCopyLink?: boolean;
  }
  ```
- **Dependencies:** Button (shadcn/ui), Tooltip, 复制到剪贴板API
- **Reuses:** 现有按钮样式、图标系统、动画效果

### BlogNavigation (返回导航组件)
- **Purpose:** 提供面包屑导航和返回博客列表的快捷方式
- **Interfaces:**
  ```typescript
  interface BlogNavigationProps {
    currentTitle: string;
    backUrl?: string;
    showBreadcrumb?: boolean;
    className?: string;
  }
  ```
- **Dependencies:** Button, ArrowLeft图标
- **Reuses:** 现有导航模式、路由处理、过渡动画

## Data Models

### BlogDetailData (扩展博客详情数据模型)
```typescript
interface BlogDetailData extends BlogCardData {
  // 继承现有BlogCardData的所有字段
  // id, title, excerpt, slug, coverImage, author, category, publishedAt
  
  // 详情页面扩展字段
  content: string;                    // 完整文章内容 (Markdown或HTML)
  contentType: 'markdown' | 'html';   // 内容格式类型
  readingTime: number;                // 预估阅读时间(分钟)
  tags: string[];                     // 文章标签
  
  // SEO和元数据
  seoTitle?: string;                  // SEO标题(可选，默认使用title)
  seoDescription?: string;            // SEO描述(可选，默认使用excerpt)
  keywords: string[];                 // 关键词数组
  
  // 内容结构
  tableOfContents?: TableOfContentsItem[]; // 目录结构
  featuredImages?: string[];          // 特色图片集合
  
  // 统计数据
  viewCount?: number;                 // 浏览量
  likeCount?: number;                 // 点赞数
  shareCount?: number;                // 分享数
  
  // 时间信息
  updatedAt?: string;                 // 最后更新时间
  publishedAt: string;                // 继承：发布时间
  
  // 关联数据
  relatedPostIds?: string[];          // 相关文章ID
  
  // 状态标识
  isPublished: boolean;               // 是否已发布
  isFeatured?: boolean;               // 是否为精选文章
}
```

### BlogAuthorDetail (扩展作者详细信息)
```typescript
interface BlogAuthorDetail extends BlogAuthor {
  // 继承现有BlogAuthor字段: name, avatar
  
  // 详细信息扩展
  bio?: string;                       // 作者简介
  title?: string;                     // 职位头衔
  location?: string;                  // 所在地
  company?: string;                   // 公司名称
  
  // 社交链接
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    email?: string;
  };
  
  // 统计数据
  stats?: {
    postsCount: number;               // 发布文章数
    followersCount: number;           // 关注者数
    likesReceived: number;            // 获得点赞数
  };
  
  // 专业信息
  expertise?: string[];               // 专业技能标签
  joinedAt?: string;                  // 加入时间
}
```

### TableOfContentsItem (目录项)
```typescript
interface TableOfContentsItem {
  id: string;                         // 锚点ID
  title: string;                      // 标题文本
  level: number;                      // 标题级别 (1-6)
  children?: TableOfContentsItem[];   // 子级目录
}
```

### SocialPlatform (社交平台)
```typescript
type SocialPlatform = 'twitter' | 'wechat' | 'weibo' | 'qq' | 'linkedin' | 'facebook' | 'copy';

interface SocialShareConfig {
  platform: SocialPlatform;
  label: string;                      // 显示标签
  icon: string;                       // 图标名称
  shareUrl: (params: ShareParams) => string; // 分享URL生成函数
  color: string;                      // 品牌颜色
}
```

### BlogDetailState (详情页面状态)
```typescript
interface BlogDetailState {
  // 当前文章数据
  currentPost: BlogDetailData | null;
  
  // 加载和错误状态
  loading: boolean;
  error: string | null;
  
  // 相关文章
  relatedPosts: BlogCardData[];
  relatedLoading: boolean;
  
  // 阅读状态
  readingProgress: number;            // 阅读进度 (0-100)
  currentSection: string | null;      // 当前阅读章节
  
  // 交互状态
  tocVisible: boolean;                // 目录是否可见
  shareModalOpen: boolean;            // 分享弹窗状态
  
  // 操作函数
  fetchPost: (slug: string) => Promise<void>;
  fetchRelatedPosts: (postId: string) => Promise<void>;
  updateReadingProgress: (progress: number) => void;
  toggleToc: () => void;
  toggleShareModal: () => void;
  reset: () => void;
}
```

## Error Handling

### Error Scenarios

1. **文章不存在 (404)**
   - **Handling:** 返回自定义404页面，提供搜索建议和热门文章链接
   - **User Impact:** 友好的错误页面，引导用户发现其他内容
   - **Implementation:** `not-found.tsx` 页面，集成搜索组件和推荐文章

2. **网络请求失败**
   - **Handling:** 显示重试按钮和错误信息，支持离线状态检测
   - **User Impact:** 清晰的错误提示和恢复选项
   - **Implementation:** Error Boundary 捕获，Toast 通知系统

3. **图片加载失败**
   - **Handling:** 显示占位图片，提供原图链接作为备选方案
   - **User Impact:** 不影响内容阅读，优雅降级
   - **Implementation:** 复用BlogCard的图片错误处理逻辑

4. **富文本内容渲染错误**
   - **Handling:** 安全渲染失败内容，显示原始文本作为备选
   - **User Impact:** 确保内容可读性，避免页面崩溃
   - **Implementation:** 内容解析器错误边界，XSS过滤器

5. **分享功能失败**
   - **Handling:** 提供链接复制作为备选方案，记录错误日志
   - **User Impact:** 始终可以复制链接分享，不阻断用户操作
   - **Implementation:** 分享API错误捕获，降级到剪贴板API

6. **相关文章加载失败**
   - **Handling:** 隐藏推荐区域或显示默认推荐，不影响主要内容
   - **User Impact:** 主要阅读体验不受影响
   - **Implementation:** 独立的数据获取和错误状态管理

### 错误处理策略

**分层错误处理**:
```typescript
// 页面级错误边界
export default function BlogDetailErrorBoundary({ 
  error, 
  reset 
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">文章加载失败</h2>
        <p className="text-muted-foreground">请稍后重试或返回博客列表</p>
        <div className="space-x-4">
          <Button onClick={reset}>重试</Button>
          <Button variant="outline" onClick={() => router.push('/blog')}>
            返回博客列表
          </Button>
        </div>
      </div>
    </div>
  );
}

// 组件级错误处理
const [error, setError] = useState<string | null>(null);

const handleAsyncOperation = async () => {
  try {
    setError(null);
    await riskyOperation();
  } catch (err) {
    setError(err instanceof Error ? err.message : '操作失败');
    // 记录错误用于调试
    console.error('BlogDetail operation failed:', err);
  }
};
```

## Testing Strategy

### Unit Testing

**组件测试覆盖**:
- **BlogDetailPage**: 页面渲染、状态管理、路由参数处理
- **BlogContentRenderer**: 内容解析、代码高亮、图片处理
- **AuthorCard**: 数据展示、社交链接、错误状态
- **RelatedPosts**: 推荐算法、加载状态、空状态处理
- **SocialShare**: 分享功能、链接生成、错误处理

**工具函数测试**:
- **内容解析器**: Markdown渲染、XSS过滤、目录生成
- **SEO工具**: 元数据生成、结构化数据
- **分享工具**: URL生成、平台适配

**测试实现示例**:
```typescript
// BlogContentRenderer.test.tsx
describe('BlogContentRenderer', () => {
  it('should render markdown content correctly', () => {
    const content = '# Test\nThis is a test.';
    render(<BlogContentRenderer content={content} contentType="markdown" />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test');
    expect(screen.getByText('This is a test.')).toBeInTheDocument();
  });

  it('should handle code blocks with syntax highlighting', () => {
    const content = '```javascript\nconst test = "hello";\n```';
    render(<BlogContentRenderer content={content} contentType="markdown" />);
    
    expect(screen.getByText('const test = "hello";')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should filter XSS attempts', () => {
    const maliciousContent = '<script>alert("xss")</script><p>Safe content</p>';
    render(<BlogContentRenderer content={maliciousContent} contentType="html" />);
    
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});
```

### Integration Testing

**页面级集成测试**:
- **路由导航**: 从博客列表到详情页的完整流程
- **状态管理**: URL状态同步、数据获取、错误处理
- **SEO验证**: 元数据生成、结构化数据、Open Graph

**组件交互测试**:
- **分享流程**: 点击分享→选择平台→成功分享
- **相关文章**: 点击推荐文章→导航到新页面
- **作者信息**: 点击作者→显示详细信息

**性能测试**:
- **首屏加载**: FCP < 1.5s, LCP < 2.5s
- **图片懒加载**: 视窗外图片延迟加载
- **代码分割**: 组件动态导入验证

### End-to-End Testing

**用户场景测试**:
1. **完整阅读流程**:
   - 从首页→博客列表→文章详情→相关文章
   - 验证导航、内容显示、交互功能
   
2. **分享功能测试**:
   - 点击分享按钮→选择平台→验证链接正确性
   - 测试链接复制功能和成功提示
   
3. **响应式体验**:
   - 移动端、平板、桌面设备的布局适配
   - 触摸交互和键盘导航

4. **SEO验证**:
   - 搜索引擎爬虫模拟
   - 社交媒体预览卡片
   - 结构化数据验证

**E2E测试实现**:
```typescript
// blog-detail.e2e.test.ts
test('complete blog reading flow', async ({ page }) => {
  // 从博客列表进入文章详情
  await page.goto('/blog');
  await page.click('[data-testid="blog-card"]:first-child');
  
  // 验证文章内容加载
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('[data-testid="author-card"]')).toBeVisible();
  
  // 测试分享功能
  await page.click('[data-testid="share-button"]');
  await page.click('[data-testid="copy-link"]');
  await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
  
  // 测试相关文章导航
  await page.click('[data-testid="related-post"]:first-child');
  await expect(page.url()).toMatch(/\/blog\/[\w-]+/);
});
```

**测试数据管理**:
- **Mock数据**: 扩展现有 `mockBlogs.ts`，添加详情内容
- **测试环境**: 独立的测试数据库和API端点
- **数据重置**: 每次测试后清理状态，确保测试独立性