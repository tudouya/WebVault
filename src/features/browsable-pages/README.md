# Browsable Pages 模块

> 可浏览页面的配置驱动统一架构，支持分类、标签、集合三种内容类型的统一展示

## 概述

Browsable Pages 模块是一个配置驱动的页面架构，通过统一的组件和配置系统，实现对分类页面、标签页面和集合页面的 90%+ 代码复用。

### 核心特性

- **配置驱动** - 通过 `BrowsablePageConfig` 实现页面逻辑复用
- **统一体验** - 三个页面使用相同的布局和交互模式
- **类型安全** - 完整的 TypeScript 类型定义和验证
- **性能优化** - 内置缓存、防抖、懒加载等优化策略
- **响应式设计** - 适配桌面和移动端的完整布局
- **URL状态同步** - 筛选参数与URL参数自动同步

### 支持的页面类型

- **分类页面** (`/category`) - 浏览按分类组织的网站内容
- **标签页面** (`/tag`) - 浏览按标签筛选的网站内容
- **集合页面** (`/collection`) - 浏览主题集合和相关网站

## 架构设计

### 核心组件结构

```
src/features/browsable-pages/
├── components/
│   ├── BrowsablePageLayout.tsx         # 统一页面布局
│   ├── CategoryPage.tsx                # 分类页面组件
│   ├── TagPage.tsx                     # 标签页面组件
│   ├── CollectionPage.tsx              # 集合页面组件
│   ├── ui/                             # UI子组件
│   │   ├── FilterControls.tsx          # 筛选控件
│   │   ├── ResultGrid.tsx              # 结果网格
│   │   ├── Pagination.tsx              # 分页组件
│   │   ├── LoadingState.tsx            # 加载状态
│   │   └── ErrorBoundary.tsx           # 错误边界
├── hooks/
│   ├── useBrowsablePageData.ts         # 主数据获取Hook
│   ├── useCategoryData.ts              # 分类数据Hook
│   ├── useTagData.ts                   # 标签数据Hook
│   └── useCollectionData.ts            # 集合数据Hook
├── stores/
│   └── browsable-page-store.ts         # 状态管理
├── types/
│   └── index.ts                        # 类型定义
├── utils/
│   ├── url-params.ts                   # URL参数处理
│   └── config-validation.ts            # 配置验证
└── __tests__/                          # 测试文件
```

### 设计模式

1. **配置驱动模式** - 通过配置对象驱动页面行为
2. **组合模式** - 组件通过组合实现功能复用
3. **策略模式** - 不同页面类型的数据获取策略
4. **观察者模式** - URL状态与组件状态的双向同步

## 快速开始

### 1. 基本使用

```tsx
import { CategoryPage } from '@/features/browsable-pages/components/CategoryPage'

export default function CategoryPageRoute() {
  return <CategoryPage />
}
```

### 2. 自定义配置

```tsx
import { BrowsablePageLayout } from '@/features/browsable-pages/components/BrowsablePageLayout'
import { customConfig } from './custom-config'

export default function CustomPage() {
  return <BrowsablePageLayout config={customConfig} />
}
```

## 配置系统

### BrowsablePageConfig 接口

```typescript
interface BrowsablePageConfig {
  // 页面基本信息
  type: 'category' | 'tag' | 'collection'
  title: string
  description?: string
  
  // 数据获取配置
  dataFetching: {
    itemsPerPage: number
    enableInfiniteScroll?: boolean
    cacheStrategy?: 'memory' | 'localStorage' | 'none'
  }
  
  // 筛选配置
  filtering: {
    enableSearch: boolean
    enableSorting: boolean
    sortOptions: SortOption[]
    filterOptions: FilterOption[]
  }
  
  // 显示配置
  display: {
    layout: 'grid' | 'list'
    gridColumns?: ResponsiveGridColumns
    showMetadata: boolean
    showDescription: boolean
  }
  
  // SEO配置
  seo?: {
    titleTemplate?: string
    descriptionTemplate?: string
    generateMetaTags?: boolean
  }
}
```

### 配置示例

#### 分类页面配置

```typescript
export const categoryPageConfig: BrowsablePageConfig = {
  type: 'category',
  title: '分类浏览',
  description: '按分类浏览精选网站资源',
  
  dataFetching: {
    itemsPerPage: 12,
    enableInfiniteScroll: true,
    cacheStrategy: 'memory'
  },
  
  filtering: {
    enableSearch: true,
    enableSorting: true,
    sortOptions: [
      { value: 'name', label: '名称', direction: 'asc' },
      { value: 'createdAt', label: '创建时间', direction: 'desc' },
      { value: 'websiteCount', label: '网站数量', direction: 'desc' }
    ],
    filterOptions: [
      {
        key: 'status',
        label: '状态',
        type: 'select',
        options: [
          { value: 'active', label: '启用' },
          { value: 'inactive', label: '禁用' }
        ]
      }
    ]
  },
  
  display: {
    layout: 'grid',
    gridColumns: { default: 1, sm: 2, md: 3, lg: 4 },
    showMetadata: true,
    showDescription: true
  },
  
  seo: {
    titleTemplate: '${name} - WebVault',
    descriptionTemplate: '浏览 ${name} 分类下的精选网站资源',
    generateMetaTags: true
  }
}
```

#### 标签页面配置

```typescript
export const tagPageConfig: BrowsablePageConfig = {
  type: 'tag',
  title: '标签浏览',
  description: '通过标签发现相关网站',
  
  dataFetching: {
    itemsPerPage: 20,
    enableInfiniteScroll: false, // 使用分页
    cacheStrategy: 'localStorage'
  },
  
  filtering: {
    enableSearch: true,
    enableSorting: true,
    sortOptions: [
      { value: 'name', label: '标签名', direction: 'asc' },
      { value: 'popularity', label: '热度', direction: 'desc' },
      { value: 'websiteCount', label: '关联网站数', direction: 'desc' }
    ],
    filterOptions: []
  },
  
  display: {
    layout: 'grid',
    gridColumns: { default: 2, sm: 3, md: 4, lg: 6 },
    showMetadata: true,
    showDescription: false
  }
}
```

#### 集合页面配置

```typescript
export const collectionPageConfig: BrowsablePageConfig = {
  type: 'collection',
  title: '主题集合',
  description: '探索精心策划的网站主题集合',
  
  dataFetching: {
    itemsPerPage: 8,
    enableInfiniteScroll: true,
    cacheStrategy: 'memory'
  },
  
  filtering: {
    enableSearch: true,
    enableSorting: true,
    sortOptions: [
      { value: 'name', label: '集合名', direction: 'asc' },
      { value: 'createdAt', label: '创建时间', direction: 'desc' },
      { value: 'websiteCount', label: '网站数量', direction: 'desc' },
      { value: 'views', label: '浏览量', direction: 'desc' }
    ],
    filterOptions: [
      {
        key: 'category',
        label: '分类',
        type: 'select',
        options: [] // 动态加载
      },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        options: [
          { value: 'published', label: '已发布' },
          { value: 'draft', label: '草稿' }
        ]
      }
    ]
  },
  
  display: {
    layout: 'grid',
    gridColumns: { default: 1, sm: 1, md: 2, lg: 3 },
    showMetadata: true,
    showDescription: true
  }
}
```

## 组件使用

### 1. BrowsablePageLayout

主布局组件，接受配置并渲染完整页面。

```tsx
interface BrowsablePageLayoutProps {
  config: BrowsablePageConfig
  initialData?: any[]
  error?: Error | null
  loading?: boolean
}

// 使用示例
<BrowsablePageLayout 
  config={categoryPageConfig}
  initialData={initialCategories}
  loading={isLoading}
  error={error}
/>
```

### 2. 页面特定组件

#### CategoryPage

```tsx
interface CategoryPageProps {
  initialData?: Category[]
  searchParams?: { [key: string]: string | string[] | undefined }
}

// 使用示例
<CategoryPage 
  initialData={categories}
  searchParams={searchParams}
/>
```

#### TagPage

```tsx
interface TagPageProps {
  initialData?: Tag[]
  searchParams?: { [key: string]: string | string[] | undefined }
}

// 使用示例
<TagPage 
  initialData={tags}
  searchParams={searchParams}
/>
```

#### CollectionPage

```tsx
interface CollectionPageProps {
  initialData?: Collection[]
  searchParams?: { [key: string]: string | string[] | undefined }
}

// 使用示例
<CollectionPage 
  initialData={collections}
  searchParams={searchParams}
/>
```

### 3. UI 子组件

#### FilterControls

```tsx
interface FilterControlsProps {
  config: BrowsablePageConfig
  onFiltersChange: (filters: FilterParams) => void
  currentFilters: FilterParams
}

// 使用示例
<FilterControls
  config={config}
  onFiltersChange={handleFiltersChange}
  currentFilters={currentFilters}
/>
```

#### ResultGrid

```tsx
interface ResultGridProps<T> {
  items: T[]
  config: BrowsablePageConfig
  loading: boolean
  error: Error | null
  renderItem: (item: T) => ReactNode
}

// 使用示例
<ResultGrid
  items={categories}
  config={config}
  loading={loading}
  error={error}
  renderItem={(category) => <CategoryCard category={category} />}
/>
```

#### Pagination

```tsx
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

// 使用示例
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  disabled={loading}
/>
```

## Hook 系统

### 1. useBrowsablePageData

主数据获取Hook，根据配置自动选择合适的数据获取策略。

```typescript
function useBrowsablePageData<T>(
  config: BrowsablePageConfig,
  initialData?: T[]
): {
  data: T[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
}

// 使用示例
const {
  data: categories,
  loading,
  error,
  hasMore,
  loadMore,
  refetch
} = useBrowsablePageData(categoryPageConfig, initialCategories)
```

### 2. 特定数据Hook

#### useCategoryData

```typescript
function useCategoryData(params?: FilterParams): {
  categories: Category[]
  loading: boolean
  error: Error | null
  total: number
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
}

// 使用示例
const { categories, loading, error, hasMore, loadMore } = useCategoryData({
  search: 'tech',
  sort: 'name',
  page: 1,
  limit: 12
})
```

#### useTagData

```typescript
function useTagData(params?: FilterParams): {
  tags: Tag[]
  loading: boolean
  error: Error | null
  total: number
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
}
```

#### useCollectionData

```typescript
function useCollectionData(params?: FilterParams): {
  collections: Collection[]
  loading: boolean
  error: Error | null
  total: number
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
}
```

## 状态管理

### browsable-page-store

全局状态管理，处理筛选参数、UI状态等。

```typescript
interface BrowsablePageState {
  // 筛选状态
  filters: Record<string, FilterParams>
  
  // UI状态
  layouts: Record<string, 'grid' | 'list'>
  loading: Record<string, boolean>
  
  // 操作方法
  setFilters: (pageType: string, filters: FilterParams) => void
  setLayout: (pageType: string, layout: 'grid' | 'list') => void
  setLoading: (pageType: string, loading: boolean) => void
  clearFilters: (pageType: string) => void
  reset: () => void
}

// 使用示例
import { useBrowsablePageStore } from '@/features/browsable-pages/stores/browsable-page-store'

const {
  filters,
  setFilters,
  setLayout,
  clearFilters
} = useBrowsablePageStore()

// 设置筛选条件
setFilters('category', {
  search: 'technology',
  sort: 'name',
  page: 1
})

// 切换布局
setLayout('category', 'list')

// 清除筛选
clearFilters('category')
```

## URL状态同步

模块自动处理URL参数与组件状态的双向同步。

### 支持的URL参数

```typescript
interface URLParams {
  search?: string      // 搜索关键词
  sort?: string        // 排序字段
  order?: 'asc' | 'desc' // 排序方向
  page?: number        // 当前页码
  limit?: number       // 每页数量
  layout?: 'grid' | 'list' // 布局模式
  [key: string]: any   // 自定义筛选参数
}
```

### URL示例

```
# 分类页面
/category?search=tech&sort=name&order=asc&page=2&layout=grid

# 标签页面
/tag?sort=popularity&order=desc&limit=20

# 集合页面
/collection?category=design&status=published&page=1
```

## 类型系统

### 核心类型定义

```typescript
// 筛选参数
interface FilterParams {
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
  [key: string]: any
}

// 排序选项
interface SortOption {
  value: string
  label: string
  direction: 'asc' | 'desc'
}

// 筛选选项
interface FilterOption {
  key: string
  label: string
  type: 'select' | 'checkbox' | 'radio' | 'range'
  options?: SelectOption[]
  placeholder?: string
}

// 选择选项
interface SelectOption {
  value: string
  label: string
  description?: string
}

// 响应式网格列数
interface ResponsiveGridColumns {
  default: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

// 数据项基础接口
interface BaseItem {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

// 分类接口
interface Category extends BaseItem {
  slug: string
  icon?: string
  color?: string
  websiteCount: number
  status: 'active' | 'inactive'
}

// 标签接口
interface Tag extends BaseItem {
  slug: string
  color?: string
  websiteCount: number
  popularity: number
}

// 集合接口
interface Collection extends BaseItem {
  slug: string
  description: string
  thumbnail?: string
  websiteCount: number
  views: number
  category?: Category
  status: 'published' | 'draft'
  websites: Website[]
}
```

## API 接口

### 数据获取API

```typescript
// 分类API
interface CategoryAPI {
  getCategories(params?: FilterParams): Promise<PaginatedResponse<Category>>
  getCategoryById(id: string): Promise<Category>
  getCategoryBySlug(slug: string): Promise<Category>
}

// 标签API
interface TagAPI {
  getTags(params?: FilterParams): Promise<PaginatedResponse<Tag>>
  getTagById(id: string): Promise<Tag>
  getTagBySlug(slug: string): Promise<Tag>
}

// 集合API
interface CollectionAPI {
  getCollections(params?: FilterParams): Promise<PaginatedResponse<Collection>>
  getCollectionById(id: string): Promise<Collection>
  getCollectionBySlug(slug: string): Promise<Collection>
}

// 分页响应接口
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}
```

### API使用示例

```typescript
import { categoryAPI } from '@/lib/api/category'

// 获取分类列表
const response = await categoryAPI.getCategories({
  search: 'tech',
  sort: 'name',
  order: 'asc',
  page: 1,
  limit: 12
})

// 响应结构
const {
  data: categories,
  pagination: {
    page,
    limit,
    total,
    totalPages,
    hasMore
  }
} = response
```

## 性能优化

### 1. 缓存策略

```typescript
// 内存缓存
cacheStrategy: 'memory' // 适用于频繁访问的数据

// 本地存储缓存
cacheStrategy: 'localStorage' // 适用于用户个人偏好

// 禁用缓存
cacheStrategy: 'none' // 适用于实时性要求高的数据
```

### 2. 懒加载

```typescript
// 启用无限滚动
enableInfiniteScroll: true

// 使用分页
enableInfiniteScroll: false
```

### 3. 防抖优化

搜索输入自动应用 300ms 防抖，减少API调用频率。

```typescript
// 在 useBrowsablePageData 中自动处理
const debouncedSearch = useDebouncedValue(filters.search, 300)
```

### 4. 组件懒加载

```typescript
// 大型组件懒加载
const LazyResultGrid = lazy(() => import('./ui/ResultGrid'))

// 使用 Suspense
<Suspense fallback={<LoadingState />}>
  <LazyResultGrid />
</Suspense>
```

## 自定义扩展

### 1. 添加新的页面类型

```typescript
// 1. 扩展配置类型
interface BrowsablePageConfig {
  type: 'category' | 'tag' | 'collection' | 'custom'
  // ...其他配置
}

// 2. 创建专用Hook
function useCustomData(params?: FilterParams) {
  // 实现数据获取逻辑
}

// 3. 创建页面组件
export function CustomPage() {
  return <BrowsablePageLayout config={customPageConfig} />
}

// 4. 添加到路由
// app/(public)/custom/page.tsx
```

### 2. 自定义筛选器

```typescript
// 扩展筛选选项类型
interface CustomFilterOption extends FilterOption {
  type: 'select' | 'checkbox' | 'radio' | 'range' | 'date' | 'custom'
  customComponent?: React.ComponentType<any>
}

// 实现自定义筛选组件
function CustomFilter({ option, value, onChange }: CustomFilterProps) {
  // 自定义筛选逻辑
}
```

### 3. 自定义布局

```typescript
// 扩展布局选项
interface DisplayConfig {
  layout: 'grid' | 'list' | 'card' | 'table' | 'custom'
  customLayoutComponent?: React.ComponentType<any>
}

// 实现自定义布局组件
function CustomLayout({ items, config }: CustomLayoutProps) {
  // 自定义布局逻辑
}
```

## 最佳实践

### 1. 配置管理

```typescript
// 创建配置常量文件
// configs/browsable-pages.ts
export const BROWSABLE_PAGE_CONFIGS = {
  category: categoryPageConfig,
  tag: tagPageConfig,
  collection: collectionPageConfig
} as const

// 使用配置验证
import { validateConfig } from '@/features/browsable-pages/utils/config-validation'

const config = validateConfig(categoryPageConfig)
```

### 2. 错误处理

```typescript
// 使用错误边界
<ErrorBoundary fallback={<ErrorFallback />}>
  <BrowsablePageLayout config={config} />
</ErrorBoundary>

// 实现重试机制
function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="error-container">
      <p>加载失败: {error.message}</p>
      <button onClick={retry}>重试</button>
    </div>
  )
}
```

### 3. 可访问性

```typescript
// 确保键盘导航
<button
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  筛选
</button>

// 提供屏幕阅读器支持
<div
  role="region"
  aria-label="搜索结果"
  aria-live="polite"
  aria-busy={loading}
>
  {results}
</div>
```

### 4. SEO 优化

```typescript
// 配置SEO模板
seo: {
  titleTemplate: '${name} - ${type} - WebVault',
  descriptionTemplate: '浏览 ${name} ${type}下的精选网站资源，发现优质内容',
  generateMetaTags: true
}

// 生成结构化数据
function generateStructuredData(items: any[], type: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${type}页面`,
    description: `浏览所有${type}`,
    numberOfItems: items.length
  }
}
```

### 5. 测试策略

```typescript
// 组件测试
describe('BrowsablePageLayout', () => {
  it('should render with config', () => {
    render(<BrowsablePageLayout config={testConfig} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
  
  it('should handle filter changes', () => {
    const onFiltersChange = jest.fn()
    render(<FilterControls onFiltersChange={onFiltersChange} />)
    // 测试筛选交互
  })
})

// Hook测试
describe('useBrowsablePageData', () => {
  it('should fetch data based on config', async () => {
    const { result } = renderHook(() => 
      useBrowsablePageData(testConfig)
    )
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(3)
    })
  })
})
```

## 故障排除

### 常见问题

#### 1. 数据不加载

**问题**: 页面显示空白或加载状态一直存在

**解决方案**:
```typescript
// 检查配置是否正确
console.log('Config:', config)

// 检查数据获取函数
console.log('Data fetching function:', config.dataFetching)

// 检查网络请求
console.log('API response:', await categoryAPI.getCategories())
```

#### 2. URL参数不同步

**问题**: URL参数变化但组件状态未更新

**解决方案**:
```typescript
// 确保正确使用 useSearchParams
import { useSearchParams } from 'next/navigation'

// 检查参数解析
const searchParams = useSearchParams()
console.log('URL params:', Object.fromEntries(searchParams.entries()))
```

#### 3. 筛选器不工作

**问题**: 筛选条件变化但结果未更新

**解决方案**:
```typescript
// 检查筛选配置
console.log('Filter options:', config.filtering.filterOptions)

// 检查回调函数
const handleFiltersChange = useCallback((filters) => {
  console.log('Filters changed:', filters)
  // 确保状态更新
}, [])
```

#### 4. 性能问题

**问题**: 页面加载缓慢或卡顿

**解决方案**:
```typescript
// 启用缓存
cacheStrategy: 'memory'

// 减少每页数量
itemsPerPage: 8

// 使用防抖
const debouncedSearch = useDebouncedValue(search, 500)

// 启用懒加载
const LazyComponent = lazy(() => import('./Component'))
```

### 调试工具

#### 1. 开发者工具

```typescript
// 添加调试信息
if (process.env.NODE_ENV === 'development') {
  console.group('BrowsablePage Debug')
  console.log('Config:', config)
  console.log('Filters:', filters)
  console.log('Data:', data)
  console.groupEnd()
}
```

#### 2. 状态检查器

```typescript
// 创建状态检查组件
function StateDebugger() {
  const store = useBrowsablePageStore()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <details className="debug-panel">
      <summary>Debug Info</summary>
      <pre>{JSON.stringify(store, null, 2)}</pre>
    </details>
  )
}
```

## 更新日志

### v1.0.0 (2025-08-16)
- ✅ 初始版本发布
- ✅ 实现配置驱动架构
- ✅ 支持分类、标签、集合三种页面类型
- ✅ 完整的筛选和排序功能
- ✅ URL状态同步
- ✅ 响应式设计
- ✅ 性能优化和缓存策略
- ✅ 完整的TypeScript类型支持
- ✅ 单元测试覆盖

## 贡献指南

### 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 类型检查
npm run type-check
```

### 代码规范

- 遵循项目的 ESLint 和 Prettier 配置
- 使用 TypeScript 严格模式
- 编写单元测试覆盖新功能
- 遵循现有的命名约定和文件组织结构

### 提交规范

```bash
# 功能开发
git commit -m "feat(browsable-pages): add new filter option"

# 问题修复
git commit -m "fix(browsable-pages): resolve URL sync issue"

# 文档更新
git commit -m "docs(browsable-pages): update configuration guide"
```

## 许可证

本模块遵循项目的整体许可证。