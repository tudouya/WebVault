# WebVault

> 个人网站目录管理平台，用于收藏、分类和管理工作生活中发现的优质网站资源

## 🚀 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- npm 或 yarn

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

## 🏗️ 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **状态管理**: Zustand
- **UI组件**: shadcn/ui

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

## 🆕 标签模块增强

- 提供后台标签管理界面，支持创建、编辑、停用和删除标签，并可查看使用统计
- 新增标签 API（`/api/admin/tags`）与网站标签同步接口（`/api/admin/websites/[id]/tags`），用于后台集成
- 网站列表与详情数据现包含实际关联标签，便于前台展示与筛选

## 📄 License

ISC
