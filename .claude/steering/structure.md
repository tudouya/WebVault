# WebVault 项目结构文档

## 架构模式

**Feature First Architecture** - 按业务域垂直切分，功能模块自包含，共享代码统一管理。

## 目录结构规范

```
webvault/
├── .claude/                         # Claude Code配置
│   └── steering/                    # 引导文档
├── supabase/                        # Supabase配置
│   ├── migrations/                  # 数据库迁移文件
│   └── config.toml                  # 项目配置
├── public/                          # 静态资源
│   ├── assets/                      # 静态资源文件
│   │   ├── images/                  # 图片资源
│   │   ├── icons/                   # 图标文件
│   │   └── temp/                    # 临时文件
│   ├── favicon.svg                  # 网站图标
│   └── logo.svg                     # 项目Logo
├── docs/                            # 项目文档
├── scripts/                         # 工具脚本
│   ├── database/                    # 数据库操作脚本
│   ├── seed/                        # 种子数据脚本
│   └── migration/                   # 迁移工具脚本
├── tests/                           # 跨模块测试
│   ├── e2e/                         # 端到端测试
│   ├── integration/                 # 集成测试
│   └── manual/                      # 手动测试清单
└── src/                             # ⭐ 源代码主目录
    ├── app/                         # Next.js 15 App Router
    ├── components/                  # 共享UI组件
    ├── features/                    # ⭐ 功能模块目录
    ├── lib/                         # 核心工具库
    ├── stores/                      # 全局状态管理
    ├── hooks/                       # 自定义Hooks
    ├── config/                      # 应用配置
    ├── constants/                   # 常量定义
    └── types/                       # 全局类型定义
```

## App Router 结构 (src/app/)

```
src/app/
├── api/                             # API路由层
│   ├── auth/                        # 认证API
│   ├── websites/                    # 网站管理API
│   ├── categories/                  # 分类管理API
│   ├── tags/                        # 标签管理API
│   ├── collections/                 # 集合管理API
│   ├── blog/                        # 博客管理API
│   ├── submissions/                 # 提交审核API
│   └── admin/                       # 管理员API
├── (public)/                        # 公共页面组
│   ├── page.tsx                     # 首页（网站展示）
│   ├── search/                      # 搜索页面
│   ├── category/                    # 分类页面
│   ├── collection/                  # 集合详情页面
│   ├── blog/                        # 博客页面
│   └── submit/                      # 网站提交页面
├── admin/                           # 管理后台路由组
│   ├── dashboard/                   # 管理员仪表盘
│   ├── websites/                    # 网站管理页面
│   ├── categories/                  # 分类管理页面
│   ├── tags/                        # 标签管理页面
│   ├── collections/                 # 集合管理页面
│   ├── blog/                        # 博客管理页面
│   ├── submissions/                 # 提交审核页面
│   └── layout.tsx                   # 管理后台布局
├── globals.css                      # 全局样式
├── layout.tsx                       # 根布局
└── loading.tsx                      # 全局加载组件
```

## 功能模块结构 (src/features/)

每个功能模块包含完整的业务逻辑，遵循统一的目录结构：

```
src/features/[feature-name]/
├── components/                      # 功能专用组件
│   ├── [FeatureName]List.tsx       # 列表组件
│   ├── [FeatureName]Form.tsx       # 表单组件
│   ├── [FeatureName]Card.tsx       # 卡片组件
│   ├── [FeatureName]Modal.tsx      # 模态框组件
│   └── index.ts                    # 组件统一导出
├── hooks/                          # 功能专用Hooks
│   ├── use[FeatureName].ts         # 主要业务Hook
│   ├── use[FeatureName]Form.ts     # 表单处理Hook
│   ├── use[FeatureName]Search.ts   # 搜索功能Hook
│   └── index.ts                    # Hook统一导出
├── services/                       # 业务逻辑服务
│   ├── [feature-name].service.ts  # 主要业务服务
│   ├── [feature-name].api.ts      # API调用层
│   ├── [feature-name].utils.ts    # 工具函数
│   └── index.ts                    # 服务统一导出
├── stores/                         # 状态管理
│   ├── [feature-name].store.ts    # Zustand store
│   ├── [feature-name].queries.ts  # Tanstack Query配置
│   └── index.ts                    # Store统一导出
├── types/                          # 类型定义
│   ├── [feature-name].types.ts    # 核心类型
│   ├── api.types.ts                # API类型
│   └── index.ts                    # 类型统一导出
├── __tests__/                      # 模块测试（如果需要）
│   ├── components/                 # 组件测试
│   ├── hooks/                      # Hook测试
│   ├── services/                   # 服务测试
│   └── [feature-name]-integration.test.tsx
└── index.ts                        # 模块统一导出
```

### 当前功能模块

- **websites/**: 网站管理核心模块
- **categories/**: 分类系统模块
- **tags/**: 标签系统模块
- **collections/**: 集合管理模块
- **blog/**: 博客系统模块
- **submissions/**: 提交审核模块
- **admin/**: 管理员功能模块
- **shared/**: 跨模块共享功能

## 共享组件结构 (src/components/)

```
src/components/
├── ui/                              # shadcn/ui基础组件
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── magicui/                         # Magic UI动效组件
│   ├── animated-shiny-text.tsx
│   ├── border-beam.tsx
│   └── ...
├── layout/                          # 布局组件
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── Navigation.tsx
├── auth/                            # 认证相关组件
│   ├── LoginForm.tsx
│   ├── AuthProvider.tsx
│   └── ProtectedRoute.tsx
├── providers/                       # Context提供者
│   ├── ThemeProvider.tsx
│   ├── QueryProvider.tsx
│   └── index.tsx
└── shared/                          # 共享功能组件
    ├── SearchBox.tsx
    ├── DataTable.tsx
    ├── LoadingSpinner.tsx
    └── ErrorBoundary.tsx
```

## 核心工具库结构 (src/lib/)

```
src/lib/
├── auth/                            # 认证系统
│   ├── auth.service.ts              # 认证服务抽象
│   ├── supabase-auth.service.ts     # Supabase实现
│   ├── auth.context.tsx             # 认证Context
│   ├── auth.hooks.ts                # 认证Hooks
│   └── middleware.ts                # 路由保护中间件
├── services/                        # 业务服务层
│   ├── website.service.ts           # 网站服务
│   ├── category.service.ts          # 分类服务
│   ├── tag.service.ts               # 标签服务
│   └── ...
├── schemas/                         # Zod验证模式
│   ├── website.schema.ts
│   ├── category.schema.ts
│   └── common.schema.ts
├── security/                        # 安全相关工具
│   ├── input-validation.ts
│   ├── xss-protection.ts
│   └── rate-limiting.ts
├── types/                           # 全局类型定义
│   ├── database.types.ts
│   ├── api.types.ts
│   └── common.types.ts
├── utils/                           # 通用工具函数
│   ├── cn.ts                        # className合并工具
│   ├── format.ts                    # 格式化工具
│   ├── validation.ts                # 验证工具
│   └── constants.ts                 # 常量定义
├── supabase.ts                      # Supabase客户端
└── database.ts                      # 数据库服务层
```

## 状态管理结构 (src/stores/)

```
src/stores/
├── theme-store.ts                   # 主题状态管理
├── user-store.ts                    # 用户状态管理
├── dashboard-store.ts               # Dashboard状态
├── url-state-hooks.ts               # URL状态同步
└── index.ts                         # Store统一导出
```

## 命名约定

### 文件命名
- **组件文件**: PascalCase (e.g., `WebsiteCard.tsx`)
- **Hook文件**: camelCase，use前缀 (e.g., `useWebsites.ts`)
- **服务文件**: kebab-case，.service后缀 (e.g., `website.service.ts`)
- **类型文件**: kebab-case，.types后缀 (e.g., `website.types.ts`)
- **工具文件**: kebab-case (e.g., `format-date.ts`)

### 导入路径
```typescript
// 使用路径别名
import { Button } from '@/components/ui/button'
import { useWebsites } from '@/features/websites'
import { websiteService } from '@/lib/services'
import { DatabaseTypes } from '@/types'
```

### 组件命名模式
```typescript
// 功能组件：[FeatureName][ComponentType]
export const WebsiteCard = () => {}
export const WebsiteForm = () => {}
export const WebsiteList = () => {}

// Hook命名：use[FeatureName][Action]
export const useWebsites = () => {}
export const useWebsiteForm = () => {}
export const useWebsiteSearch = () => {}
```

## 代码组织原则

### 1. 就近原则
- 相关文件放在同一目录
- 测试文件靠近被测试代码
- 类型定义靠近使用代码

### 2. 统一导出
- 每个目录提供 `index.ts` 统一导出
- 避免深层嵌套的导入路径
- 保持导入语句简洁

### 3. 职责分离
- 组件只负责UI展示
- Hook处理状态逻辑
- Service处理业务逻辑
- Store管理全局状态

### 4. 依赖方向
- 组件依赖Hook和Service
- Hook依赖Service
- Service依赖底层工具和API
- 避免循环依赖

## 新功能开发流程

1. **创建功能模块目录结构**
2. **定义类型和接口** (types/)
3. **实现数据服务** (services/)
4. **创建状态管理** (stores/)
5. **开发业务Hook** (hooks/)
6. **构建UI组件** (components/)
7. **添加API路由** (app/api/)
8. **创建页面组件** (app/)
9. **编写测试用例** (__tests__/)
10. **更新文档**

## 重构和维护原则

- **渐进式重构**: 小步快跑，保持可编译状态
- **向后兼容**: 避免破坏性改动
- **测试先行**: 重构前确保测试覆盖
- **文档同步**: 代码变更时同步更新文档