# 筛选后分页和总数显示问题分析

## 问题描述
用户选择分类或标签筛选后，搜索结果更新了，但是：
1. 总条目数仍然是未筛选的总数
2. 分页也是基于未筛选的总数

## 问题排查

### 1. 前端请求参数检查

**useSearchPage.ts** - `loadResults()` 函数 (Line 817-879):
```typescript
const params = new URLSearchParams();
params.set('page', String(page));
params.set('pageSize', String(searchConfig.itemsPerPage));

if (normalizedQuery.length > 0) {
  params.set('query', normalizedQuery);
}

if (filters.category) {
  params.set('category', filters.category);
}

if (Array.isArray(filters.tags) && filters.tags.length > 0) {
  params.set('tags', filters.tags.join(','));  // ← tags 参数被发送
}

// ... 其他筛选参数 ...
```

**结论**: 前端正确发送了 `tags` 参数

### 2. API 路由参数处理检查

**src/app/api/websites/route.ts** (Line 25-76):
```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);

  const page = Math.max(1, parsedPage);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parsedPageSize));

  const query = url.searchParams.get('query') ?? url.searchParams.get('q') ?? undefined;
  const categoryRaw = url.searchParams.get('category');
  const category = (categoryRaw && categoryRaw !== 'undefined') ? categoryRaw : undefined;
  const featured = parseBool(url.searchParams.get('featured'));
  const includeAds = parseBool(url.searchParams.get('includeAds')) ?? true;
  const minRating = url.searchParams.get('minRating') ? Number(url.searchParams.get('minRating')) : undefined;

  // ← 问题：没有读取 tags 参数！

  const result = await websitesService.list(
    { page, pageSize, query, category, featured, includeAds, minRating }
    // ← 问题：没有传递 tags 参数给 service
  );
}
```

**问题1**: API 路由**没有读取** `tags` URL 参数
**问题2**: API 路由**没有传递** `tags` 给 `websitesService.list()`

### 3. Service 层接口检查

**src/lib/services/websitesService.ts** (Line 10-18):
```typescript
export interface ListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  featured?: boolean;
  includeAds?: boolean;
  minRating?: number;
  // ← 问题：接口中没有定义 tags 字段
}
```

**问题3**: `ListParams` 接口**缺少** `tags` 字段定义

### 4. 数据库查询层检查

需要检查 D1 adapter 的 `listWebsitesD1` 函数是否支持标签筛选。

## 问题根因

**核心问题**：标签筛选功能在后端**完全缺失**

1. **API 路由层**: 不读取 `tags` 参数
2. **Service 层**: 接口不支持 `tags` 参数
3. **数据库层**: 查询逻辑可能也不支持标签筛选

**数据流断点**:
```
前端发送 tags 参数 ✓
     ↓
API 路由接收 ✗ (被忽略)
     ↓
Service 查询 ✗ (未传入)
     ↓
数据库筛选 ✗ (未执行)
     ↓
返回未筛选的总数 ✗
```

## 解决方案

### 方案：补全标签筛选功能

需要在后端的三个层级添加标签筛选支持：

#### 1. 修改 Service 接口
```typescript
// src/lib/services/websitesService.ts
export interface ListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  tags?: string[];  // ← 添加 tags 字段
  featured?: boolean;
  includeAds?: boolean;
  minRating?: number;
}
```

#### 2. 修改 API 路由
```typescript
// src/app/api/websites/route.ts
export async function GET(request: Request) {
  // ... 现有代码 ...

  const category = (categoryRaw && categoryRaw !== 'undefined') ? categoryRaw : undefined;

  // 添加：读取 tags 参数
  const tagsRaw = url.searchParams.get('tags');
  const tags = tagsRaw ? tagsRaw.split(',').filter(Boolean) : undefined;

  const featured = parseBool(url.searchParams.get('featured'));

  // ... 其他代码 ...

  const result = await websitesService.list(
    {
      page,
      pageSize,
      query,
      category,
      tags,  // ← 添加 tags 参数
      featured,
      includeAds,
      minRating
    }
  );
}
```

#### 3. 修改 Service 实现
```typescript
// src/lib/services/websitesService.ts
export const websitesService = {
  async list(params: ListParams = {}): Promise<ListResult> {
    const {
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      query,
      category,
      tags,  // ← 添加 tags 解构
      featured,
      includeAds = true,
      minRating
    } = params;

    // ... 其他代码 ...

    const { rows, total, resolvedPage, pageSize: effectivePageSize } = await adapter.listWebsitesD1({
      page: normalizedPage,
      pageSize: normalizedPageSize,
      query,
      category,
      tags,  // ← 传递 tags 给 adapter
      featured,
      includeAds,
      minRating,
    });
  }
}
```

#### 4. 修改 D1 Adapter (如果需要)

需要检查并修改 `src/lib/db/adapters/d1.ts` 中的 `listWebsitesD1` 函数：
- 添加 `tags` 参数
- 实现 SQL 查询逻辑来筛选包含指定标签的网站
- 确保 COUNT 查询也应用标签筛选

**标签筛选的 SQL 逻辑**:
```sql
SELECT DISTINCT w.*
FROM websites w
INNER JOIN website_tags wt ON w.id = wt.website_id
WHERE wt.tag_id IN (tag1, tag2, ...)
-- 其他筛选条件 ...
```

## 实施步骤

1. **检查 D1 Adapter** - 确认是否已支持标签筛选
2. **修改 Service 接口** - 添加 `tags` 字段
3. **修改 API 路由** - 读取和传递 `tags` 参数
4. **修改 Service 实现** - 传递 `tags` 给 adapter
5. **测试标签筛选** - 验证结果数量和分页正确

## 测试验证

**测试场景**:
1. ✅ 选择单个标签 → 显示包含该标签的网站数量
2. ✅ 选择多个标签 → 显示包含任一标签的网站数量
3. ✅ 分类 + 标签组合筛选 → 显示同时满足条件的网站数量
4. ✅ 分页导航 → 基于筛选后的总数计算页数
5. ✅ URL 参数 → 正确反映标签筛选状态
