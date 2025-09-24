# Next.js SaaS 技术栈

> 基于 [nextjs/saas-starter](https://github.com/nextjs/saas-starter) 项目
>
> 这是一个精简的全栈 SaaS 技术栈，适用于构建需要认证、支付和数据库的 SaaS 应用。

## 适用场景

- 🚀 SaaS 产品开发
- 💳 需要订阅支付功能
- 🔐 需要用户认证系统
- 💾 需要数据持久化
- 🏢 小型团队项目
- ⚡ MVP 快速验证

## 技术栈清单

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 15.4.0-canary.47 | 全栈 React 框架 |
| **React** | 19.1.0 | UI 框架 |
| **React DOM** | 19.1.0 | React DOM 渲染 |
| **TypeScript** | 5.8.3 | 类型安全 |

### 数据库 & ORM

| 技术 | 版本 | 用途 |
|------|------|------|
| **PostgreSQL** | 通过 postgres 3.4.5 | 关系型数据库 |
| **Drizzle ORM** | 0.43.1 | 轻量级 TypeScript ORM |
| **Drizzle Kit** | 0.31.1 | 数据库迁移工具 |

### 样式 & UI

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 4.1.7 | 原子化 CSS 框架 |
| **@tailwindcss/postcss** | 4.1.7 | PostCSS 处理 |
| **tw-animate-css** | 1.3.0 | Tailwind 动画扩展 |
| **Radix UI** | 1.4.2 | 无样式 UI 组件库 |
| **Lucide React** | 0.511.0 | 图标库 |
| **tailwind-merge** | 3.3.0 | 合并 Tailwind 类名 |
| **clsx** | 2.1.1 | 条件类名工具 |
| **class-variance-authority** | 0.7.1 | 组件变体管理 |

### 认证 & 安全

| 技术 | 版本 | 用途 |
|------|------|------|
| **bcryptjs** | 3.0.2 | 密码哈希加密 |
| **jose** | 6.0.11 | JWT 生成和验证 |
| **server-only** | 0.0.1 | 服务端代码保护 |

### 支付集成

| 技术 | 版本 | 用途 |
|------|------|------|
| **Stripe** | 18.1.0 | 支付处理 |

### 数据获取

| 技术 | 版本 | 用途 |
|------|------|------|
| **SWR** | 2.3.3 | 数据获取和缓存 |

### 数据验证

| 技术 | 版本 | 用途 |
|------|------|------|
| **Zod** | 3.24.4 | 运行时类型验证 |

### 构建工具

| 技术 | 版本 | 用途 |
|------|------|------|
| **Turbopack** | 内置 | 快速打包工具 |
| **PostCSS** | 8.5.3 | CSS 处理 |
| **Autoprefixer** | 10.4.21 | CSS 前缀自动添加 |

### 环境配置

| 技术 | 版本 | 用途 |
|------|------|------|
| **dotenv** | 16.5.0 | 环境变量管理 |

## 项目脚本

```json
{
  "scripts": {
    "dev": "next dev --turbopack",      // 开发服务器（使用 Turbopack）
    "build": "next build",               // 生产构建
    "start": "next start",               // 生产服务器
    "db:setup": "npx tsx lib/db/setup.ts",     // 数据库设置
    "db:seed": "npx tsx lib/db/seed.ts",       // 数据库填充
    "db:generate": "drizzle-kit generate",     // 生成迁移
    "db:migrate": "drizzle-kit migrate",       // 运行迁移
    "db:studio": "drizzle-kit studio"          // 数据库可视化工具
  }
}
```

## 技术栈特点

### 优势
- ✅ **最小化依赖**：只包含必要的依赖，减少复杂度
- ✅ **现代技术栈**：使用最新版本的 Next.js 和 React
- ✅ **类型安全**：TypeScript + Drizzle ORM 提供端到端类型安全
- ✅ **性能优秀**：Turbopack + PostgreSQL + Drizzle 性能组合
- ✅ **自主可控**：自建认证系统，不依赖第三方服务
- ✅ **成本可控**：除 Stripe 外无其他付费服务

### 限制
- ⚠️ **认证功能基础**：只支持邮箱密码登录，无 OAuth、2FA
- ⚠️ **无状态管理库**：复杂状态管理需要额外添加
- ⚠️ **开发工具简单**：无 ESLint、Prettier、Husky 等配置
- ⚠️ **无错误监控**：生产环境需要额外配置
- ⚠️ **UI 组件有限**：需要自行构建或添加组件

## 适配建议

### 可选增强

如果需要增强某些功能，可以考虑添加：

| 需求 | 推荐方案 |
|------|---------|
| **状态管理** | Zustand (轻量) 或 Redux Toolkit (复杂) |
| **错误监控** | Sentry 或 LogRocket |
| **代码规范** | ESLint + Prettier + Husky |
| **测试框架** | Vitest + Testing Library |
| **更多 UI 组件** | shadcn/ui 或 Ant Design |
| **OAuth 认证** | NextAuth.js 或升级到 Clerk |
| **邮件服务** | Resend 或 SendGrid |

### 不建议修改

以下核心技术栈不建议替换：
- Next.js → 其他框架（会失去全栈能力）
- Drizzle → Prisma（除非团队更熟悉 Prisma）
- PostgreSQL → MySQL（PostgreSQL 功能更强大）
- Tailwind CSS → 其他 CSS 方案（生态最好）

## 开发流程

### 初始化项目

```bash
# 1. 克隆项目
git clone https://github.com/nextjs/saas-starter
cd saas-starter

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local

# 4. 设置数据库
pnpm db:setup
pnpm db:migrate
pnpm db:seed

# 5. 启动开发服务器
pnpm dev
```

### 部署建议

- **托管平台**：Vercel（最佳）或 Railway
- **数据库**：Vercel Postgres 或 Supabase
- **环境变量**：通过平台管理，不要提交 .env 文件


## Steering 输出插槽
| 插槽 | 建议填充值 | 说明 |
| ---- | ---------- | ---- |
| `stack_id` | `nextjs-saas` | 供 steering 生成器识别当前技术栈 |
| `core_dependencies` | `Next.js 15.4-canary`, `React 19.1`, `TypeScript 5.8+`, `PostgreSQL`, `Drizzle ORM`, `Drizzle Kit`, `Tailwind CSS 4.1+`, `Zod`, `Stripe`, `SWR`, `jose`, `bcryptjs`, `dotenv` | Steering 文档中的依赖摘要 |
| `dev_commands` | `pnpm dev --turbopack` | 默认开发启动命令 |
| `build_commands` | `pnpm build`, `pnpm start` | 构建与生产启动 |
| `test_commands` | （按需补充，默认留空） | 如项目有测试命令可覆盖 |
| `db_commands` | `pnpm db:setup`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:generate`, `pnpm db:studio` | 数据库脚本合集 |
| `env_required` | `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` | 核心环境变量清单 |
| `development_philosophy` | `docs/development-philosophy.md` | 统一的开发理念与质量标准 |
| `agent_notes` | 邮箱 + 密码认证（自建），使用 Drizzle 管理 PostgreSQL；生产部署需配置 Stripe Webhook；默认包管理器为 `pnpm` | 对 AI Agent 的额外提醒 |

## 参考资源

- [Next.js SaaS Starter 源码](https://github.com/nextjs/saas-starter)
- [Next.js 文档](https://nextjs.org/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Stripe 文档](https://stripe.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

*此技术栈基于 nextjs/saas-starter 项目，适用于构建精简高效的 SaaS 应用*