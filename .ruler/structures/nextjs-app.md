# Next.js 项目结构规范

> 基于 [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) 最佳实践
> 参考项目：
> - [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) - 完整的 Next.js + shadcn/ui 仪表板模板
> - [nextjs/saas-starter](https://github.com/nextjs/saas-starter) - Next.js 官方 SaaS 模板
>
> 适用版本：Next.js 14+ (App Router)

## 标准目录结构

```
src/
├── app/                    # Next.js App Router [必需]
│   ├── (auth)/            # 认证路由组
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── dashboard/         # 应用主体页面
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── [...子页面]/
│   ├── api/               # API 路由
│   │   └── [...endpoint]/
│   ├── layout.tsx         # 根布局
│   ├── page.tsx          # 首页
│   ├── globals.css       # 全局样式
│   ├── not-found.tsx     # 404 页面
│   └── error.tsx         # 错误处理
│
├── features/              # 功能模块 [按需]
│   ├── auth/             # 认证功能
│   │   ├── components/   # 功能组件
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/        # 功能 Hooks
│   │   │   └── useAuth.ts
│   │   ├── services/     # 业务逻辑
│   │   │   └── auth.service.ts
│   │   ├── types/        # 类型定义
│   │   │   └── auth.types.ts
│   │   └── utils/        # 工具函数
│   │       └── validation.ts
│   └── [feature-name]/   # 其他功能模块
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
│
├── components/            # 共享组件 [必需]
│   ├── ui/               # 基础 UI 组件 (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── [...更多]/
│   ├── forms/            # 表单组件
│   │   ├── FormField.tsx
│   │   └── FormWrapper.tsx
│   ├── layout/           # 布局组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   └── shared/           # 业务共享组件
│       ├── DataTable.tsx
│       ├── SearchBar.tsx
│       └── UserAvatar.tsx
│
├── hooks/                 # 全局 Hooks [必需]
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── useFetch.ts
│
├── lib/                   # 核心库和工具 [必需]
│   ├── api-client.ts     # API 客户端
│   ├── auth.ts           # 认证配置
│   ├── db.ts             # 数据库连接
│   ├── utils.ts          # 工具函数
│   └── cn.ts             # className 工具
│
├── config/                # 配置文件 [必需]
│   ├── site.ts           # 网站配置
│   ├── navigation.ts     # 导航配置
│   └── constants.ts      # 常量配置
│
├── types/                 # 全局类型定义 [必需]
│   ├── index.ts          # 通用类型
│   ├── api.types.ts      # API 类型
│   └── database.types.ts # 数据库类型
│
└── styles/                # 样式文件 [可选]
    ├── globals.css        # 全局样式
    └── themes/            # 主题样式

根目录文件：
├── middleware.ts          # Next.js 中间件
├── instrumentation.ts     # 监控配置
└── .env.local            # 环境变量
```

## AI 文件放置规则

### 1. 页面文件
```yaml
规则: "所有页面组件"
文件: page.tsx, layout.tsx, error.tsx, loading.tsx, not-found.tsx
位置: app/[对应路径]/
示例:
  - 登录页面 → app/(auth)/login/page.tsx
  - 仪表板 → app/dashboard/page.tsx
```

### 2. API 路由
```yaml
规则: "所有 API 端点"
文件: route.ts, route.js
位置: app/api/[端点路径]/
示例:
  - 用户 API → app/api/users/route.ts
  - 认证 API → app/api/auth/[...]/route.ts
```

### 3. 功能模块
```yaml
规则: "相关功能组件群 (3+ 个相关文件)"
判断: 文件名包含相同业务词汇
位置: features/[功能名]/
示例:
  - LoginForm, LoginService → features/auth/
  - ProductList, ProductDetail → features/product/
  - CheckoutForm, PaymentService → features/checkout/
```

### 4. UI 组件
```yaml
规则: "可复用的展示组件"
判断: 无业务逻辑，纯展示
位置: components/ui/
示例:
  - Button, Card, Modal → components/ui/
  - 基于 shadcn/ui 的组件 → components/ui/
```

### 5. 共享组件
```yaml
规则: "包含业务逻辑的共享组件"
判断: 被多个功能使用
位置: components/shared/
示例:
  - UserAvatar → components/shared/
  - DataTable → components/shared/
```

### 6. 工具和配置
```yaml
规则: "工具函数和配置"
判断:
  - 工具函数 → lib/
  - React Hooks → hooks/
  - 类型定义 → types/
  - 配置文件 → config/
示例:
  - formatDate() → lib/utils.ts
  - useAuth() → hooks/useAuth.ts
  - User type → types/user.types.ts
```

## 何时创建 Feature 模块

### 创建 feature 的条件
✅ **应该创建**：
- 有 3+ 个相关组件
- 包含特定的业务逻辑
- 组件之间有依赖关系
- 可独立开发和测试

❌ **不需要创建**：
- 简单的 CRUD 页面
- 单个组件
- 纯工具函数

### Feature 内部结构
```
features/[name]/
├── components/    # 功能专用组件
├── hooks/        # 功能专用 Hooks (可选)
├── services/     # 业务逻辑 (可选)
├── types/        # 类型定义 (可选)
├── utils/        # 工具函数 (可选)
└── index.ts      # 导出入口 (可选)
```

## 命名规范

### 文件命名
| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `UserProfile.tsx` |
| 工具 | camelCase | `formatDate.ts` |
| Hook | camelCase + use前缀 | `useAuth.ts` |
| 服务 | camelCase + .service | `auth.service.ts` |
| 类型 | camelCase + .types | `user.types.ts` |
| 样式 | kebab-case + .module | `user-profile.module.css` |

### 目录命名
| 类型 | 规范 | 示例 |
|------|------|------|
| 功能模块 | kebab-case | `user-management` |
| 路由组 | 括号+kebab-case | `(marketing)` |
| 动态路由 | 方括号 | `[id]`, `[...slug]` |
| 普通目录 | kebab-case | `components` |

## 导入路径配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

## 最佳实践

### 1. 保持 app/ 目录简洁
- 只放页面相关文件
- 业务逻辑移到 features/ 或 lib/

### 2. Feature 模块独立性
- 每个 feature 应该能独立工作
- 避免 feature 之间相互依赖
- 共享代码放到 components/shared/

### 3. 组件分类清晰
- `ui/` - 纯 UI，无业务逻辑
- `forms/` - 表单相关
- `layout/` - 布局相关
- `shared/` - 业务共享组件

### 4. 渐进式采用 Features
- 项目初期可以不用 features/
- 当某个功能文件 >= 3 个时再创建
- 保持灵活，不要过度设计

## 示例：添加新功能

### 场景：添加购物车功能

```bash
# 1. 创建 feature 模块
features/cart/
├── components/
│   ├── CartItem.tsx
│   ├── CartSummary.tsx
│   └── CartDrawer.tsx
├── hooks/
│   └── useCart.ts
├── services/
│   └── cart.service.ts
└── types/
    └── cart.types.ts

# 2. 创建页面
app/cart/
├── page.tsx          # 导入 features/cart 组件
└── checkout/
    └── page.tsx

# 3. 添加 API
app/api/cart/
└── route.ts
```

## 迁移指南

### 从其他结构迁移到此结构

1. **第一步**：创建基础目录
   ```bash
   mkdir -p src/{app,components,hooks,lib,types,config}
   ```

2. **第二步**：移动文件
   - pages/* → app/*
   - components/* → 按类型分到 components/ui, components/shared
   - utils/* → lib/*
   - 相关功能组 → features/

3. **第三步**：更新导入路径

4. **第四步**：逐步重构
   - 不要一次性迁移所有文件
   - 按功能模块逐步迁移
   - 保持应用可运行状态

## 参考资源

### GitHub 项目
- [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) - 主要参考
- [nextjs/saas-starter](https://github.com/nextjs/saas-starter) - 官方模板参考

### 文档
- [Next.js 官方文档 - 项目结构](https://nextjs.org/docs/app/building-your-application/routing/project-organization)
- [shadcn/ui 文档](https://ui.shadcn.com/)

---

*此规范基于 Next.js 14+ App Router 和 shadcn/ui 最佳实践*