# WebVault

> 个人网站目录管理平台，用于收藏、分类和管理工作生活中发现的优质网站资源

## 🚀 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- npm 或 yarn
- Cloudflare 账户 (用于 D1 数据库)
- Clerk 账户 (用于用户认证)

### 环境变量配置

在开始之前，你需要设置环境变量：

1. 复制环境变量示例文件：
```bash
cp .env.example .env.local
```

2. 根据下面的配置指南填写实际值

#### 🔐 Clerk 认证配置

创建一个 [Clerk](https://clerk.dev) 账户并获取API密钥：

```bash
# 从 Clerk Dashboard > API Keys 获取
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### 🗄️ Cloudflare D1 数据库配置

在 [Cloudflare Dashboard](https://dash.cloudflare.com) 中：

1. 创建 D1 数据库
2. 获取必要的配置信息：

```bash
# 从 Cloudflare Dashboard > D1 > 你的数据库 > 设置
CLOUDFLARE_D1_DATABASE_ID=your-database-id
CLOUDFLARE_ACCOUNT_ID=your-account-id

# 从 Cloudflare Dashboard > My Profile > API Tokens
# 创建具有 D1:Edit 权限的 API Token
CLOUDFLARE_API_TOKEN=your-api-token
```

#### 📍 站点配置

```bash
# 本地开发
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 生产环境使用你的实际域名
# NEXT_PUBLIC_SITE_URL=https://your-domain.com
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### ⚙️ 迁移功能标记 (可选)

如果你需要同时支持旧的 Supabase 系统：

```bash
# 启用 Clerk + D1 迁移适配器
NEXT_PUBLIC_ENABLE_CLERK_MIGRATION=true
MIGRATION_ROLLOUT_PERCENTAGE=100
```

完整的环境变量配置请参考 [.env.example](.env.example) 文件。

### 数据库初始化

设置好环境变量后，初始化 D1 数据库：

```bash
# 运行数据库迁移
npm run db:migrate

# (可选) 填充示例数据
npm run db:seed
```

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

### 构建项目

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

## 📚 项目文档

详细的项目架构和开发指南请查看：

- [CLAUDE.md](./CLAUDE.md) - 完整项目架构文档
- [docs/](./docs/) - 详细开发文档

## 🛠️ 详细设置指南

### Clerk 认证设置

1. 访问 [Clerk Dashboard](https://dashboard.clerk.dev)
2. 创建新应用或使用现有应用
3. 在 **API Keys** 页面获取：
   - **Publishable key**: 用于前端（以 `pk_` 开头）
   - **Secret key**: 用于后端（以 `sk_` 开头）
4. 配置允许的重定向URL：
   - 开发环境: `http://localhost:3000`
   - 生产环境: `https://your-domain.com`

### Cloudflare D1 设置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 导航到 **Workers & Pages** > **D1**
3. 点击 **Create Database** 创建新数据库
4. 记录下数据库ID（在数据库详情页面）
5. 获取账户ID（Dashboard右侧边栏）
6. 创建API令牌：
   - 前往 **My Profile** > **API Tokens**
   - 点击 **Create Token**
   - 选择 **Custom token**
   - 权限设置：
     - `Account:D1:Edit`
     - `Zone:Zone:Read` (如果使用自定义域名)
     - `Account:Cloudflare Workers:Edit`

### 环境变量检查清单

在启动应用之前，确保以下环境变量已正确配置：

#### 必需的环境变量：
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY` 
- [ ] `CLOUDFLARE_D1_DATABASE_ID`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `NEXT_PUBLIC_SITE_URL`

#### 可选的环境变量：
- [ ] `NEXT_PUBLIC_ENABLE_CLERK_MIGRATION` (迁移标记)
- [ ] `MIGRATION_ROLLOUT_PERCENTAGE` (渐进式部署)
- [ ] `DEBUG` (调试模式)

### 故障排除

#### 常见问题

**问题**: "Database not found" 错误
**解决**: 确保 `CLOUDFLARE_D1_DATABASE_ID` 正确，并且API令牌有足够权限

**问题**: Clerk 认证失败
**解决**: 检查 `NEXT_PUBLIC_SITE_URL` 是否与Clerk仪表板中配置的重定向URL匹配

**问题**: 本地开发时的CORS错误
**解决**: 确保在Clerk仪表板中添加了 `http://localhost:3000` 作为允许的源

#### 验证配置

运行以下命令验证配置：

```bash
# 检查环境变量
npm run env:check

# 测试数据库连接
npm run db:test

# 验证认证配置
npm run auth:test
```

## 🏗️ 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Cloudflare D1 (SQLite) + Drizzle ORM
- **认证**: Clerk Authentication
- **状态管理**: Zustand
- **UI组件**: shadcn/ui
- **基础设施**: Cloudflare Pages + Workers

### 技术迁移说明

WebVault 已从 Supabase 技术栈迁移到 Clerk + Cloudflare D1，实现：
- ✅ **零成本运营**: 利用 Cloudflare 和 Clerk 的慷慨免费层
- ✅ **全球性能**: Cloudflare 的全球边缘网络
- ✅ **高可用性**: 避免数据库休眠问题
- ✅ **现代认证**: Clerk 提供更强大的用户管理功能

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
├── components/             # 共享UI组件
├── features/               # 功能模块化架构
│   ├── websites/           # 网站管理
│   ├── categories/         # 分类系统
│   ├── tags/              # 标签系统
│   ├── collections/        # 集合管理
│   ├── blog/              # 博客系统
│   └── admin/             # 管理功能
├── lib/                   # 核心工具库
└── stores/                # 全局状态管理
```

## 🎯 功能特性

### 前台功能（无需登录）
- 🔍 网站搜索和筛选
- 📂 分类浏览
- 🏷️ 标签筛选
- 📚 专题合集
- 📝 博客阅读
- ➕ 网站提交

### 后台管理（需要登录）
- 🌐 网站管理
- 📂 分类管理
- 🏷️ 标签管理
- 📚 集合管理
- 📝 博客管理
- ✅ 提交审核
- 📊 数据统计

## 📄 License

ISC