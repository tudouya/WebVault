# D1 数据库访问指南

本文档介绍如何查看和管理 WebVault 项目的 D1 数据库。

## 方法 1：命令行查询

### 基本用法

```bash
# 本地数据库查询
wrangler d1 execute webvault-dev --local --command "SELECT * FROM websites"

# 远程数据库查询
wrangler d1 execute webvault --command "SELECT * FROM websites"

# 或使用 npm 脚本
npm run db:console:local "SELECT * FROM websites"
npm run db:console:remote "SELECT * FROM websites"
```

### 常用查询示例

```sql
-- 查看所有表
SELECT name FROM sqlite_master WHERE type='table';

-- 查看表结构
PRAGMA table_info(websites);

-- 查看前 10 条数据
SELECT * FROM websites LIMIT 10;

-- 统计总数
SELECT COUNT(*) as total FROM websites;

-- 查看特定条件的数据
SELECT * FROM websites WHERE is_featured = 1;
SELECT * FROM websites WHERE category = '开发工具';
```

## 方法 2：Cloudflare Dashboard（推荐）

这是最接近 phpMyAdmin 的体验：

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录你的账号
3. 导航到 **Workers & Pages** → **D1**
4. 点击 **webvault** 数据库
5. 使用 **Console** 标签页执行 SQL 查询

### 功能特点
- ✅ 可视化表格展示
- ✅ SQL 编辑器带语法高亮
- ✅ 查询历史记录
- ✅ 导出数据功能
- ✅ 表结构查看

## 方法 3：Drizzle Studio（本地开发）

Drizzle Studio 提供了类似 phpMyAdmin 的本地 Web 界面。

### 设置步骤

1. 首先需要配置环境变量（如果要访问远程数据库）：
```bash
export CLOUDFLARE_ACCOUNT_ID="你的账号ID"
export CLOUDFLARE_DATABASE_ID="0300606c-7656-4f1b-8279-be081621b727"
export CLOUDFLARE_API_TOKEN="你的API Token"
```

2. 启动 Drizzle Studio：
```bash
npx drizzle-kit studio
```

3. 访问 http://localhost:4983

### 注意事项
- 目前主要用于本地 SQLite 数据库
- 远程 D1 支持需要正确的 API Token

## 方法 4：自定义管理页面

项目内置了一个简单的数据库查看器：

1. 启动开发服务器：
```bash
npm run dev
```

2. 访问 http://localhost:3000/admin/db-viewer

3. 在界面中执行 SQL 查询

### 安全提示
⚠️ 这个页面仅供开发使用，生产环境需要添加认证保护。

## 方法 5：使用查询脚本

项目提供了一个便捷的查询脚本：

```bash
# 使用方法
./scripts/d1-query.sh [local|remote] "SQL查询"

# 示例
./scripts/d1-query.sh local "SELECT * FROM websites"
./scripts/d1-query.sh remote "SELECT COUNT(*) FROM websites"
```

## 快速参考

### 数据库信息
- **数据库名称**: webvault
- **数据库 ID**: 0300606c-7656-4f1b-8279-be081621b727
- **本地数据库**: webvault-dev

### 表结构

**websites 表**：
```sql
CREATE TABLE websites (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  favicon_url TEXT,
  screenshot_url TEXT,
  tags TEXT,  -- JSON 数组
  category TEXT,
  is_ad INTEGER DEFAULT 0,
  ad_type TEXT,
  rating INTEGER,
  visit_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 最佳实践

1. **开发环境**：使用命令行或 Cloudflare Dashboard
2. **快速查看**：使用命令行查询
3. **复杂操作**：使用 Cloudflare Dashboard
4. **批量操作**：编写 SQL 文件，使用 `wrangler d1 execute --file`

## 故障排查

### 问题：wrangler 未登录
```bash
wrangler login
```

### 问题：找不到数据库
确保 wrangler.toml 配置正确：
```toml
[[d1_databases]]
binding = "DB"
database_name = "webvault"
database_id = "0300606c-7656-4f1b-8279-be081621b727"
```

### 问题：本地数据库不存在
```bash
npm run db:setup:local
```

## 相关文档
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler D1 命令](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
- [Drizzle ORM 文档](https://orm.drizzle.team/)