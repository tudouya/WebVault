# CLAUDE.MD - WebVault

> 个人网站目录管理平台，用于收藏、分类和管理工作生活中发现的优质网站资源
> 版本: v1.0.0 | 最后更新: 2025-08-14

## 1. Project High-Level Goal

创建一个功能完善的网站目录管理平台，支持用户提交、管理员审核、内容分类和博客推荐的完整工作流程

- **项目类型**: Web应用, 内容管理系统 (初期 Vercel + Supabase，后期可迁移VPS)
- **核心功能**:
  - **网站管理** (Website Management) - 网站的增删改查、分类标记、状态管理
  - **分类系统** (Category System) - 分类创建、管理、筛选导航
  - **标签系统** (Tag System) - 标签创建、管理、多维度筛选
  - **集合管理** (Collection Management) - 主题合集创建和展示
  - **博客系统** (Blog System) - 网站推荐文章的创作和发布
  - **提交审核** (Submission Review) - 用户提交网站，管理员审核发布
  - **用户管理** (User & RBAC Management) - 管理员权限、认证系统
  - **仪表盘** (Dashboard) - 系统概览、数据分析、关键指标监控
  - **系统设置** (System Configuration) - 平台配置、内容管理
- **目标用户**:
  - 访客用户 / 浏览网站、搜索筛选、提交网站资源
  - 管理员 / 内容审核、网站管理、博客创作
  - 系统管理员 / 平台运维、用户权限、数据统计
- **关键指标**:
  - 网站收录数量和质量
  - 用户提交和审核通过率
  - 访客浏览量和搜索使用率
  - 平台用户活跃度 (DAU/MAU)

## 2. Tech Stack & Versions

### 🏗️ **核心技术栈**

- **Language**: TypeScript (严格模式)
- **Framework**: Next.js 15 (App Router)
- **Runtime**: React (客户端/服务端组件)
- **Package Manager**: npm
- **Database**: Supabase (PostgreSQL + 实时订阅)
- **Authentication**: Supabase Auth + 抽象认证接口

### 🎨 **UI & 组件系统**

- **设计系统**: shadcn/ui (Radix UI + Tailwind CSS)
- **动效组件**: Magic UI (AnimatedShinyText, BorderBeam, NumberTicker, RetroGrid)
- **图标系统**: Lucide React + Radix UI Icons + Tabler Icons
- **主题系统**: next-themes (亮色/暗色模式)
- **样式方案**: Tailwind CSS + CVA (组件变体管理)
- **图表可视化**: Recharts

### 📊 **状态管理 & 数据层**

- **全局状态**: Zustand (轻量级状态管理)
- **URL状态同步**: Nuqs (Type-safe search params)
- **服务端状态**: Tanstack Query (异步数据获取和缓存)
- **表单管理**: React Hook Form + Zod (表单验证)
- **表格组件**: Tanstack Data Tables (服务端分页、搜索、过滤)

### 🎯 **核心业务库**

- **网站目录管理**:
  - `@supabase/supabase-js` (Supabase客户端)
  - `@supabase/auth-helpers-nextjs` (Next.js认证集成)
  
- **安全与认证**:
  - 自研抽象认证系统 (`src/lib/auth/`)
  - Supabase RLS (行级安全策略)
  - 输入验证和XSS防护 (Zod验证)

- **数据处理与分析**:
  - ❌ 自研网站分析服务 (`src/lib/services/website-analytics.ts`)
  - ❌ 自研内容提取器 (`src/lib/services/website-extractors/`)
  - ❌ 自研搜索引擎 (全文搜索和筛选服务)
  - ❌ 自研提交审核系统 (状态管理和工作流)

- **业务领域服务** (自研):
  - ❌ 网站服务 (`src/lib/services/website-service.ts`)
  - ❌ 分类服务 (`src/lib/services/category-service.ts`)
  - ❌ 标签服务 (`src/lib/services/tag-service.ts`)
  - ❌ 集合服务 (`src/lib/services/collection-service.ts`)
  - ❌ 博客服务 (`src/lib/services/blog-service.ts`)
  - ❌ 提交服务 (`src/lib/services/submission-service.ts`)
  - ❌ 认证服务 (`src/lib/services/auth.service.ts`)

**状态说明**:

- ✅ **已实现** - 当前项目中正在使用
- ❌ **计划中/待实现** - 文档中规划但尚未实现的功能

### 🧪 **测试工具链** (后期实现)

- **测试框架**: Jest + React Testing Library
- **测试环境**: jest-environment-jsdom (浏览器环境模拟)
- **TypeScript支持**: ts-jest (TypeScript测试转换)
- **用户交互测试**: @testing-library/user-event
- **DOM断言**: @testing-library/jest-dom
- **Mock工具**: 内置Mock服务 (Supabase、Router等)

### 🛠️ **开发工具**

- **代码质量**:
  - ESLint (静态代码分析，Next.js配置)
  - Prettier (代码格式化，Tailwind类排序)
- **Git工作流**:
  - Husky (Git Hooks)
  - lint-staged (暂存文件检查)
- **构建工具**:
  - Next.js Built-in (SWC编译器)
  - Turbopack (开发模式性能优化)
- **用户体验**:
  - Kbar (⌘+K命令面板)
  - Sonner (Toast通知系统)

### 📦 **UI扩展库**

- **日期选择**: react-day-picker (日期选择器)
- **防抖处理**: use-debounce (性能优化Hook)
- **样式工具**:
  - clsx (条件类名拼接)
  - class-variance-authority (组件变体管理)
  - tailwind-merge (Tailwind类合并)
- **动画系统**: motion (Framer Motion分支)
- **类型支持**: TypeScript类型定义包 (@types/\*)

## 3. Project Structure

> **架构选择**: Feature First Architecture
> **架构参考**: 基于 [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) 的功能模块化架构设计

```
webvault/
├── supabase/                        # Supabase配置和迁移
│   ├── migrations/                  # 数据库迁移文件
│   └── config.toml                  # Supabase项目配置
│
├── public/                          # 静态资源
│   ├── favicon.svg                  # 网站图标
│   ├── logo.svg                     # 项目Logo
│   └── assets/                      # 🔥 静态资源文件
│       ├── images/                  # 图片资源
│       ├── icons/                   # 图标文件
│       └── temp/                    # 临时文件
│
├── docs/                            # 🔥 项目文档
│   ├── api.md                       # API文档
│   ├── deployment.md                # 部署指南
│   └── development.md               # 开发指南
│
├── scripts/                         # 数据库管理脚本
│   ├── database/                    # 数据库操作脚本
│   ├── seed/                        # 种子数据脚本
│   └── migration/                   # 迁移工具脚本
│
├── src/                             # ⭐ 源代码（功能模块化架构）
│   ├── app/                         # Next.js 15 App Router
│   │   ├── api/                     # API路由层
│   │   │   ├── auth/                # 认证API
│   │   │   ├── websites/            # 🔥 网站管理API
│   │   │   ├── categories/          # 🔥 分类管理API
│   │   │   ├── tags/                # 🔥 标签管理API
│   │   │   ├── collections/         # 🔥 集合管理API
│   │   │   ├── blog/                # 🔥 博客管理API
│   │   │   ├── submissions/         # 🔥 提交审核API
│   │   │   └── admin/               # 管理员API
│   │   ├── (public)/                # 公共页面组
│   │   │   ├── page.tsx             # 首页（网站展示）
│   │   │   ├── search/              # 搜索页面
│   │   │   ├── category/            # 🔥 分类页面
│   │   │   ├── collection/          # 🔥 集合详情页面
│   │   │   ├── blog/                # 🔥 博客页面
│   │   │   └── submit/              # 🔥 网站提交页面
│   │   ├── admin/                   # 管理后台
│   │   │   ├── dashboard/           # 管理员仪表盘
│   │   │   ├── websites/            # 🔥 网站管理页面
│   │   │   ├── categories/          # 🔥 分类管理页面
│   │   │   ├── tags/                # 🔥 标签管理页面
│   │   │   ├── collections/         # 🔥 集合管理页面
│   │   │   ├── blog/                # 🔥 博客管理页面
│   │   │   ├── submissions/         # 🔥 提交审核页面
│   │   │   └── layout.tsx           # 管理后台布局
│   │   ├── globals.css              # 全局样式
│   │   ├── layout.tsx               # 根布局
│   │   └── loading.tsx              # 全局加载组件
│   │
│   ├── components/                  # 共享UI组件层
│   │   ├── ui/                      # shadcn/ui基础组件
│   │   ├── magicui/                 # Magic UI动效组件
│   │   ├── layout/                  # 布局组件
│   │   ├── auth/                    # 认证组件
│   │   ├── providers/               # Context提供者
│   │   └── shared/                  # 共享功能组件
│   │
│   ├── features/                    # ⭐ 功能模块（按业务域组织）
│   │   ├── websites/                # 🔥 网站管理模块
│   │   │   ├── components/          # 网站相关组件
│   │   │   ├── hooks/               # 网站相关Hooks
│   │   │   ├── services/            # 网站业务逻辑服务
│   │   │   ├── stores/              # 网站状态管理
│   │   │   ├── types/               # 网站类型定义
│   │   │   └── index.ts             # 模块统一导出
│   │   ├── categories/              # 🔥 分类管理模块
│   │   ├── tags/                    # 🔥 标签系统模块
│   │   ├── collections/             # 🔥 集合管理模块
│   │   ├── blog/                    # 🔥 博客系统模块
│   │   ├── submissions/             # 🔥 提交审核模块
│   │   ├── admin/                   # 🔥 管理员功能模块
│   │   └── shared/                  # 📦 共享功能模块
│   │
│   ├── lib/                         # 核心工具库
│   │   ├── auth/                    # 🔥 认证系统
│   │   │   ├── auth.service.ts      # 认证服务抽象
│   │   │   ├── supabase-auth.service.ts # Supabase实现
│   │   │   ├── auth.context.tsx     # 认证Context
│   │   │   ├── auth.hooks.ts        # 认证Hooks
│   │   │   └── middleware.ts        # 路由保护中间件
│   │   ├── supabase.ts              # 🔥 Supabase客户端
│   │   ├── database.ts              # 🔥 数据库服务层
│   │   ├── services/                # 业务服务层
│   │   │   ├── website.service.ts   # 网站服务
│   │   │   ├── category.service.ts  # 分类服务
│   │   │   └── *.service.ts         # 其他业务服务
│   │   ├── content-engine/          # 🔥 内容处理引擎
│   │   ├── search-system/           # 🔥 搜索系统
│   │   ├── schemas/                 # Zod验证模式
│   │   ├── security/                # 🔥 安全相关工具
│   │   ├── types/                   # TypeScript类型定义
│   │   └── utils/                   # 通用工具函数
│   │
│   ├── stores/                      # ⭐ 全局状态管理
│   │   ├── theme-store.ts           # 主题状态管理
│   │   ├── user-store.ts            # 用户状态管理
│   │   ├── dashboard-store.ts       # Dashboard状态
│   │   ├── url-state-hooks.ts       # URL状态同步
│   │   └── index.ts                 # Store统一导出
│   │
│   ├── hooks/                       # 自定义React Hooks
│   ├── config/                      # 应用配置
│   ├── constants/                   # 常量定义
│   └── types/                       # 全局类型定义
│
├── tests/                           # ⭐ 测试目录（后期实现）
│   ├── e2e/                         # 端到端测试
│   ├── integration/                 # 集成测试（跨模块）
│   └── manual/                      # 手动测试清单
│
├── components.json                  # shadcn/ui配置
├── next.config.js                   # Next.js配置
├── tailwind.config.js               # Tailwind CSS配置
├── middleware.ts                    # Next.js中间件
└── tsconfig.json                    # TypeScript配置
```

## 4. Development Philosophy & Standards

> **参考来源**: 基于 [Getting Good Results from Claude Code](https://www.dzombak.com/blog/2025/08/getting-good-results-from-claude-code/) 整合网站目录管理工具开发需求

### 🎯 **核心开发理念**

**基础信念**:

- **渐进式改进胜过大爆炸** - 小步快跑，每次变更可编译并通过测试
- **从现有代码中学习** - 深入研究项目模式，遵循既有约定
- **实用主义胜过教条主义** - 适应项目现实，选择最适合的方案
- **清晰意图胜过聪明代码** - 代码要boring和明显，避免过度设计

**简洁性原则**:

- 单一职责：每个函数/类只负责一件事
- 避免过早抽象：先实现，再优化
- 选择boring的解决方案：避免聪明的技巧
- 如果需要解释，说明太复杂了

### 📋 **开发流程标准**

#### 1. **规划与分阶段**

复杂工作分解为3-5个阶段，明确每个阶段的交付物和成功标准。

#### 2. **实现流程**

1. **理解** - 研究代码库中的现有模式
2. **测试** - 先写测试用例 (红灯)
3. **实现** - 最小代码通过测试 (绿灯)
4. **重构** - 在测试通过的前提下清理代码
5. **提交** - 明确的提交信息关联到计划

#### 3. **遇到困难时的处理策略**

**卡住时的处理方式**:

1. **记录当前状态**:
   - 尝试了什么方法
   - 具体错误信息
   - 当前的理解和假设

2. **寻求不同视角**:
   - 搜索类似问题的解决方案
   - 询问团队成员意见
   - 查看相关文档和示例

3. **考虑简化方案**:
   - 能否拆分成更小的问题？
   - 是否过度设计了？
   - 有没有更直接的实现方式？

### 🏗️ **技术标准**

#### **架构原则**

- **组合胜过继承** - 使用依赖注入
- **接口胜过单例** - 便于测试和灵活性
- **显式胜过隐式** - 清晰的数据流和依赖关系
- **测试优先思维** - 修复失败测试优于跳过，但允许临时标记

#### **代码质量要求**

**每次提交必须**:

- ✅ 编译成功
- ✅ 通过所有现有测试
- ✅ 为新功能包含测试
- ✅ 遵循项目格式/检查规范

**提交前检查清单**:

- [ ] 运行格式化工具和检查工具
- [ ] 自我审查变更内容
- [ ] 确保提交信息解释了"为什么"

#### **错误处理标准**

- **快速失败** - 提供描述性错误信息
- **包含调试上下文** - 便于问题定位
- **适当层级处理** - 在合适的层次处理错误
- **永不静默吞异常** - 避免隐藏问题

### ⚖️ **决策框架**

当存在多个有效方法时，按以下优先级选择：

1. **🧪 可测试性** - 我能轻松测试这个吗？
2. **📖 可读性** - 6个月后有人能理解这个吗？
3. **🔄 一致性** - 这符合项目模式吗？
4. **✨ 简洁性** - 这是最简单可行的方案吗？
5. **↩️ 可逆性** - 后续修改有多困难？

### 🎯 **质量门禁**

#### **完成定义 (Definition of Done)**

- [ ] 测试编写完成并通过
- [ ] 代码遵循项目约定
- [ ] 无linter/formatter警告
- [ ] 提交信息清晰明确
- [ ] 实现符合计划
- [ ] 无TODO项（除非有issue编号）

#### **测试指导原则** (后期实现)

- **测试行为，不测试实现** - 关注功能而非内部细节
- **一个测试一个断言** - 便于快速定位问题
- **清晰的测试命名** - 描述具体场景
- **使用现有测试工具** - 遵循项目测试模式
- **测试必须确定性** - 每次运行结果一致

### 📂 **测试目录标准化** (后期实现) ⚠️

**测试目录策略** (就近原则):

```
src/features/websites/__tests__/        # 功能模块测试
├── components/                         # 组件测试
├── hooks/                             # Hook测试
├── services/                          # 服务测试
└── websites-integration.test.tsx      # 模块集成测试

tests/                                 # 跨模块测试
├── e2e/                              # 端到端测试
└── integration/                      # 跨功能集成测试
```

**理由**: 单元测试放在功能模块内便于维护，跨模块测试统一管理。

**命名规范**:

- ✅ 单元测试: `*.test.ts` / `*.test.tsx`
- ✅ 集成测试: `*-integration.test.ts` / `*-integration.test.tsx`
- ✅ E2E测试: `*.test.ts` (在tests/e2e/下)

**测试优先级策略**:

1. **API端点测试** - 优先保证接口可用性
2. **核心业务逻辑测试** - 网站管理、内容审核等关键功能
3. **关键用户路径E2E** - 登录→内容管理→审核发布→前台展示
4. **组件单元测试** - 复杂交互组件和工具函数

### ⚠️ **重要提醒**

**避免的做法**:

- ❌ 随意绕过提交钩子 (除非紧急情况)
- ❌ 长期忽略失败测试
- ❌ 提交无法编译的代码
- ❌ 基于假设工作 - 先验证现有代码
- ❌ 在根目录创建 `__tests__/` 目录 (使用规范结构)

**推荐的做法**:

- ✅ 小步提交可工作的代码
- ✅ 及时更新相关文档
- ✅ 从现有实现中学习模式
- ✅ 卡住时寻求帮助或换思路
- ✅ 遵循项目测试目录结构

---

## 📚 扩展文档

更多详细文档请参考 **[docs/README.md](docs/README.md)** - 完整的文档导航和专业指南。