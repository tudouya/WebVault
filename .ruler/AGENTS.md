# AGENTS.md - WebVault

## 1. Mission（使命）

为个人和团队提供网站收藏管理平台，快速整理、分类和分享优质网络资源，将手工管理时间从2小时降到10分钟。

## 2. Boundaries（边界）

**核心功能：**

- 网站收录 - 完整记录网站信息、标签分类、状态管理
- 内容管理 - 分类系统、标签系统、集合管理
- 审核发布 - 用户提交、管理员审核、内容发布
- 博客系统 - 网站推荐文章创作和展示

**平台定位：**
这是一个网站目录管理平台，专注于：

- 记录和组织发现的优质网站
- 安全存储网站信息和标签
- 协作和知识共享
- 自动化内容分类

**明确边界：**

- 不是搜索引擎 - 不执行网络爬虫或索引
- 不是监控工具 - 不检测网站状态或性能
- 不是通用CMS - 专注于网站目录管理场景

## 3. Tech Stack（技术栈）

**核心**: Next.js 15 (App Router) / TypeScript / React
**数据**: Cloudflare D1 + Drizzle ORM
**认证**: Clerk
**UI**: shadcn/ui + Tailwind CSS + React Hook Form + Zod
**状态**: Zustand (全局) + Nuqs (URL)
**部署**: Cloudflare Pages
**开发工具**: ESLint + Prettier + Husky

## 4. Philosophy & Architecture（理念与架构原则）

### 核心理念

1. **渐进式改进** - 优先选择可通过编译和测试的小步变更。
2. **从现有代码学习** - 在实现前，先研究和规划。
3. **实用主义** - 适应项目现实，而非拘泥于教条。
4. **清晰意图** - 代码应清晰直白，避免过度聪明的技巧。

### 核心编程准则

1. **DRY (Don't Repeat Yourself)** - 避免重复。任何一段知识在系统中都应该有单一、明确、权威的表示。优先选择复用，而不是复制粘贴。
2. **YAGNI (You Ain't Gonna Need It)** - 保持简单。只实现当前阶段真正需要的功能，避免为未来可能的需求进行过度设计。

### 架构原则

1. **组合优于继承** - 优先使用依赖注入和组合模式。
2. **显式优于隐式** - 保证清晰的数据流和依赖关系。
3. **服务层直接操作** - 无需Repository层，Service直接操作数据库。
4. **统一响应格式** - 所有API使用JSend标准响应。

## 5. Decision Framework（决策框架）

当存在多个有效方法时，按以下优先级选择：

1. **可测试性** - 我能轻松地为它编写测试吗？
2. **可读性** - 六个月后，其他人能理解这段代码吗？
3. **一致性** - 这是否符合项目现有的模式和约定？
4. **简洁性** - 这是能解决问题的最简单的方案吗？
5. **可逆性** - 如果未来需要修改，这个决策的成本有多高？

## 6. Development Conventions（开发约定）

### 文件组织

```
src/
├── app/                   # Next.js 15 App Router
│   ├── api/               # API路由 (后端控制器层)
│   ├── (auth)/            # 认证页面路由组
│   └── (dashboard)/       # 主应用页面路由组
├── features/              # 功能模块 (特定业务域的代码)
├── components/            # 共享UI组件 (跨功能复用)
├── lib/                   # 核心共享库
│   ├── auth/              # Clerk认证配置和工具
│   ├── db/                # D1数据库连接 (Drizzle)
│   ├── validations/       # 共享的数据验证 schemas (Zod)
│   ├── services/          # 共享的业务服务层
│   └── utils/             # 通用工具函数
├── hooks/                 # 共享的自定义React Hooks
└── types/                 # 全局TypeScript类型定义
```

### 命名规范

- **文件名**: `kebab-case` (如 `website-form.tsx`)
- **组件导出**: named export + PascalCase (如 `export function WebsiteForm`)
- **工具函数**: named export + camelCase (如 `export function formatDate`)
- **常量**: named export + UPPER_SNAKE_CASE (如 `export const MAX_FILE_SIZE`)
- **数据库表**: `snake_case`
- **TypeScript类型/DTO**: `PascalCase`

### 导入约定

- **使用绝对导入**: 始终使用 `@/` 前缀，避免相对导入
- **UI组件路径**: `@/components/ui/`
- **Feature组件路径**: `@/features/[feature]/components/`
- **工具函数路径**: `@/lib/utils/`

## 7. Backend Essentials（后端要点）

### API 约定

- **JSend响应格式** + DTO模式（禁止直接暴露数据库模型）
- **认证**: Clerk + 服务层权限检查

### 代码结构

```typescript
// API路由：仅做控制器，返回JSend格式
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ status: 'fail', data: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const data = await websiteService.create(userId, body);
    return Response.json({ status: 'success', data });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ status: 'fail', data: error.errors }, { status: 400 });
    }
    return Response.json({ status: 'error', message: '服务器错误' }, { status: 500 });
  }
}

// 服务层：业务逻辑 + DTO转换
export const websiteService = {
  async create(userId: string, input: CreateWebsiteDTO): Promise<WebsiteDTO> {
    const website = await db.insert(websites).values({
      ...input,
      userId,
      status: 'pending',
      createdAt: new Date()
    }).returning();
    return toWebsiteDTO(website[0]);
  }
}
```

### 环境配置

```bash
# .env.local（必需变量）
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_DATABASE_ID=""
```

## 8. Frontend Essentials（前端要点）

### 状态管理

- **本地状态**: React内置 `useState/useReducer`
- **全局状态**: Zustand（用户会话、API数据、配置）
- **URL状态**: Nuqs（筛选器、分页等可分享状态）

### 数据获取规范

- **必须使用** `/docs/hooks.md` 中定义的标准Hook模板
- **禁止** 直接在组件中调用fetch或自行实现数据获取逻辑
- **所有API调用** 必须通过标准化Hook处理JSend响应格式
- **错误处理** 必须使用统一的错误类型和显示组件

### 代码结构示例

```typescript
// ✅ 正确：使用标准Hook模板
import { useApiData } from '@/hooks/useApiData';

export function WebsiteList() {
  const { data, loading, error, refetch } = useApiData<Website[]>(
    '/api/websites',
    { immediate: true }
  );

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;

  return <div>{/* 渲染数据 */}</div>;
}

// ❌ 错误：直接使用fetch
export function BadExample() {
  useEffect(() => {
    fetch('/api/websites').then(/* ... */); // 禁止这样做
  }, []);
}
```

## 9. Testing Strategy（测试策略）

### 核心原则

- **测试行为而非实现** - 关注功能是否正常，而非内部细节
- **就近原则** - 测试文件放在被测代码的 `__tests__` 目录
- **命名清晰** - 测试描述应说明场景和预期结果

### 测试命令

```bash
# 运行测试
npm test                 # 运行所有测试
npm test -- --watch     # 监听模式
npm test -- --coverage  # 生成覆盖率报告
```

### 文件命名

- 单元/集成测试: `*.test.ts(x)`
- 组件测试: `*.component.test.tsx`
- E2E测试: `*.e2e.test.ts`

## 10. Performance Essentials（性能要点）

### 核心目标
- **快速加载** - 首屏内容 < 2.5s，交互响应 < 100ms
- **代码分割** - Next.js 15 按页面路由自动分割，保持 feature 模块内聚性
- **图片优化** - 统一使用 `next/image`，WebP格式优先
- **分页加载** - 避免一次性加载大量网站数据
- **搜索优化** - 输入防抖，减少不必要的API调用

### 监控指标
- Core Web Vitals (LCP, FID, CLS)
- 关键页面加载时间：网站列表、搜索结果

## 11. Key Commands（关键命令）

```bash
npm run dev              # 开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run db:push          # 同步数据库schema
npm run db:studio        # 打开Drizzle Studio
npm run db:migrate       # 运行迁移

# 代码质量
npm run lint             # 运行ESLint
npm run lint:fix         # 修复ESLint问题
npm run format           # 运行Prettier

# 测试
npm test                 # 运行测试
npm run test:watch       # 监听模式
npm run test:coverage    # 覆盖率报告
```

## 12. Quick Links（快速链接）

### 开发资源

- **Hook模板**: `/docs/hooks.md` - 必须使用的数据获取模板
- **JSend规范**: 统一的API响应格式标准
- **Clerk文档**: [https://clerk.dev/docs](https://clerk.dev/docs)
- **Drizzle文档**: [https://orm.drizzle.team/](https://orm.drizzle.team/)
- **shadcn/ui**: [https://ui.shadcn.com/](https://ui.shadcn.com/)

### 部署相关

- **Cloudflare Pages**: 前端部署平台
- **Cloudflare D1**: 边缘数据库服务
- **环境变量**: 确保生产环境配置正确
