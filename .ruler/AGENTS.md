# WebVault Agent 开发指南

## 项目概览

**WebVault** 是一个网站目录管理平台，提供网址收藏、分类管理、内容发现等功能。项目定位为"网站目录管理平台"，支持网址管理、博客内容、分类组织、搜索筛选等核心功能。

**项目信息**：
- 项目名称：WebVault
- 项目类型：网站目录管理平台
- 开发阶段：开发阶段（前端已完成）
- 部署目标：Cloudflare Pages
- 使用场景：网站收藏和管理、内容发现、博客阅读

**核心功能模块**：
1. 🔗 网址管理 - 快速添加、自动获取元数据、有效性检测、评分系统
2. 📁 分类系统 - 分类管理、智能建议、标签支持、收藏集合
3. 🔍 搜索与筛选 - 全文搜索、多维度筛选、访问统计
4. 🎨 界面定制 - 多视图切换（网格/列表视图）
5. 📝 博客系统 - 博客内容管理、分类浏览、详情页面
6. 💼 商业功能 - 广告管理、推广位、访问统计
7. 🔐 用户认证 - 单用户密码保护（计划使用 Clerk）
8. 📊 数据管理 - 后续版本实现导入导出、备份恢复

## 技术栈约定

基于 Next.js SaaS 架构，适配 Cloudflare 生态环境。

- 详细规范：`stacks/nextjs-saas-stack.md` ✅
- 语言：TypeScript 5.8+
- 框架：Next.js 15.4-canary + React 19.1
- 数据库：Cloudflare D1（SQLite 兼容）
- ORM：Drizzle ORM 0.43.1 + Drizzle Kit 0.31.1
- 样式：Tailwind CSS 4.1+ + Radix UI 1.4.2
- 部署：Cloudflare Pages（静态导出模式）
- 关键依赖：
  - Zod 4.0+ - 数据验证
  - Zustand 5.0+ - 状态管理
  - nuqs 2.4+ - URL 状态同步
  - use-debounce 10.0+ - 防抖处理
  - Lucide React 0.539+ - 图标库
  - react-hook-form 7.62+ - 表单处理
  - SWR 2.3+ - 数据获取和缓存（后续可能使用）
  - jose 6.0+ - JWT 处理（后续可能使用）
  - bcryptjs 3.0+ - 密码加密（后续可能使用）

**Cloudflare 适配要点**：
- 使用 `@cloudflare/workers-types` 类型支持
- 数据库连接配置适配 D1
- 构建输出配置为静态导出
- API 路由适配 Cloudflare Pages Functions

## 目录结构与约束

基于 Next.js App Router 标准结构，采用功能模块化组织方式。

- 详细规范：`structures/nextjs-app.md` ✅

```
src/
├── app/                    # Next.js App Router [必需]
│   ├── (auth)/            # 认证路由组（可选）
│   ├── (public)/          # 公开页面路由组（可选）
│   ├── api/              # API 路由
│   │   └── [endpoint]/   # 具体端点根据功能需求创建
│   ├── layout.tsx        # 根布局
│   ├── page.tsx         # 首页
│   └── globals.css      # 全局样式
│
├── features/              # 功能模块 [按需创建]
│   └── [feature-name]/   # 具体功能模块根据需求创建
│       ├── components/   # 功能专用组件
│       ├── hooks/        # 功能专用 Hooks（可选）
│       ├── services/     # 业务逻辑（可选）
│       ├── stores/       # 状态管理（可选）
│       ├── types/        # 类型定义（可选）
│       └── utils/        # 工具函数（可选）
│
├── components/            # 共享组件 [必需]
│   ├── ui/               # Radix UI 基础组件
│   ├── layout/           # Header, Sidebar, Navigation
│   └── shared/           # 业务共享组件
│
├── hooks/                 # 全局 Hooks [必需]
├── lib/                   # 核心库和工具 [必需]
│   ├── db.ts             # D1 数据库连接配置
│   └── utils.ts          # 工具函数
│
├── config/                # 配置文件 [必需]
└── types/                 # 全局类型定义 [必需]

根目录：
├── drizzle/              # 数据库 Schema 和迁移
├── middleware.ts         # Next.js 中间件
└── .env.local           # 环境变量
```

**结构约束**：
- features/ 模块当相关文件数量 >= 3 时创建
- 具体的功能模块划分在开发过程中根据实际需求确定
- 保持 app/ 目录简洁，业务逻辑放入 features/
- API 路由使用 Cloudflare Pages Functions 规范

**当前已实现的功能模块**：
- `websites/` - 网站管理功能模块
- `blog/` - 博客功能模块
- `browsable-pages/` - 可浏览页面功能模块
- `tags/` - 标签功能模块

**当前路由结构示例**：
- `(auth)/` - 认证相关页面
- `(public)/` - 公开访问页面（blog, search, category 等）
- `api/` - 包含 websites, favicon, health 等 API 端点

## API 与数据约定

- 响应格式规范：`specs/api-response.md` ✅
- 错误码定义：`specs/error-codes.md` ✅

**WebVault 特定 API 约定**：
- 所有 API 采用 RESTful 设计原则
- API 路由结构：`/api/[resource]` - 具体资源在开发时确定
- 数据库操作通过 Drizzle ORM 执行
- 环境变量：`DATABASE_URL`（D1 连接）、`NEXT_PUBLIC_APP_URL`

**数据模型设计**：
- 网站表：包含基础信息、评分、访问统计、广告标识等字段
- 分类系统：支持标签和收藏集合
- 博客内容：独立的内容管理系统
- 用户认证：单用户模式的简化认证

## 开发流程提示

- 开发理念与标准：`docs/development-philosophy.md` ✅
- Git 工作流：渐进式迭代，小步提交，保持每次变更可编译运行
- 测试策略：功能模块内单元测试（`features/<module>/__tests__/`），跨模块集成测试（`tests/`）
- 代码质量要求：
  - 编译成功、Lint/Format 通过
  - 新增逻辑具备相应测试
  - 遵循项目结构与命名约定
  - 代码"无聊而明显"，可读性优先

## Agent 注意事项

- 严格遵循引用的规范文档，特别是 `structures/nextjs-app.md` 的文件放置规则
- 使用 ruler apply 命令会根据 ruler.toml 配置生成各 Agent 所需的文档
- Cloudflare D1 使用 SQLite 语法，注意与 PostgreSQL 的差异
- 平台化应用场景，认证系统使用 Clerk 实现单用户密码保护
- 优先实现核心功能，避免过度设计
- 所有外部依赖需验证是否与 Cloudflare Pages 兼容
- 遵循 "向现有代码学习" 原则，参考 nextjs-saas-stack 现有模式
- 数据库 Schema 变更需通过 Drizzle Kit 管理迁移文件

## 文档位置说明
本文档及所有引用文档均位于项目的 `.ruler/` 目录下：
```
webvault/.ruler/
├── AGENTS.md (本文档)
├── PROJECT.md
├── ruler.toml
├── specs/
├── stacks/
├── structures/
└── docs/
```