# Cloudflare D1 迁移与环境区分指南

> 本文档说明 WebVault 项目在本地与远程环境下使用 Cloudflare D1 的方式，并提供迁移与验证的完整命令清单。

## 术语与环境

- **远程 D1**：部署在 Cloudflare 平台的正式数据库，配置由 `.env.local` 中的 `CLOUDFLARE_*` 环境变量提供。所有线上运行（Cloudflare Pages Functions）都会使用远程 D1。
- **本地 D1 副本**：Wrangler 在开发模式下自动维护的 SQLite 文件，位于 `.wrangler/state/v3/d1/<database>.sqlite`。不带 `--remote` 的 wrangler 命令默认操作本地副本。

## 常用命令对照表

| 场景 | 命令示例 | 说明 |
| ---- | -------- | ---- |
| 查看远程所有表 | `wrangler d1 execute webvault --remote --command "SELECT name FROM sqlite_master WHERE type='table';"` | 需 Cloudflare API token，直接查询线上结构 |
| 查看本地所有表 | `wrangler d1 execute webvault --local --command "SELECT name FROM sqlite_master WHERE type='table';"` | 在本地 SQLite 副本执行 |
| 远程执行 SQL 文件 | `wrangler d1 execute webvault --remote --file drizzle/0000_admin_schema.sql` | 将迁移脚本灌入远程库（推荐 Wrangler ≥ 4.28）|
| 本地执行 SQL 文件 | `wrangler d1 execute webvault --local --file drizzle/0000_admin_schema.sql` | 重建本地副本结构 |
| 清空本地副本 | `rm -rf .wrangler` | 删除本地 D1 文件后需重新初始化 |

## 迁移流程

### 1. 准备环境变量

`.env.local` 中需要提供以下 Cloudflare 凭证：

```env
CLOUDFLARE_ACCOUNT_ID="..."
CLOUDFLARE_DATABASE_ID="..."
CLOUDFLARE_API_TOKEN="..."
```

若在命令行临时运行，可使用：

```bash
export CLOUDFLARE_ACCOUNT_ID="..."
export CLOUDFLARE_DATABASE_ID="..."
export CLOUDFLARE_API_TOKEN="..."
```

### 2. 应用 Schema

项目已将所有表结构汇总到 `drizzle/0000_admin_schema.sql`，可按需执行：

#### 远程数据库

```bash
wrangler d1 execute webvault --remote --file drizzle/0000_admin_schema.sql
```

#### 本地副本

```bash
rm -rf .wrangler                # 若需重置
wrangler d1 execute webvault --local --file drizzle/0000_admin_schema.sql
```

### 3. 验证结果

#### 远程

```bash
wrangler d1 execute webvault --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
wrangler d1 execute webvault --remote --command "PRAGMA table_info(websites);"
```

#### 本地

```bash
wrangler d1 execute webvault --local --command "SELECT name FROM sqlite_master WHERE type='table';"
wrangler d1 execute webvault --local --command "PRAGMA table_info(websites);"
```

如果输出包含 `categories`、`websites`、`tags`、`website_tags`、`collections`、`collection_items`、`blog_posts`、`submission_requests`、`audit_logs` 等表名，即表示迁移成功。

## 本地开发建议

- 默认使用 **本地 D1 副本** 进行调试，避免误操作远程数据。
- 启动 Cloudflare Pages 模拟器时：
  - `npm run dev:cf` → 使用本地副本。
  - 若需连接远程，可改为 `wrangler pages dev ... --remote`。
- 在重要里程碑或部署前，可运行远程验证命令确认结构一致。

## 故障排查

- **报错 “Please provide required params for D1 HTTP driver”**：检查 `CLOUDFLARE_DATABASE_ID`、`CLOUDFLARE_API_TOKEN` 是否已导出。
- **执行 `.read` 语句时报语法错误**：远程 D1 不支持 `.read`，应使用 `--file` 上传 SQL。
- **提示在本地执行**：说明命令缺少 `--remote`，可根据需要重试。
- **网络错误 `ENOTFOUND api.cloudflare.com`**：当前环境无法访问 Cloudflare API，需在具备网络权限的终端中执行。

> 若对迁移有更复杂的需求，可按阶段拆分 SQL 文件，或使用 `drizzle-kit generate` + `drizzle-kit migrate` 在本地生成并执行。此文档记录了当前项目的约定流程，供团队成员参考。

