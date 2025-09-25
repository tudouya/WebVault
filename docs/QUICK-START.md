# WebVault 快速开始指南

## 1. 获取 Cloudflare API Token

### 创建 Token

1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 "Create Token"
3. 选择模板 "Edit Cloudflare Workers" 或使用 "Custom token"
4. 设置权限：
   - **Account** → **Cloudflare D1** → **Edit**
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
5. 点击 "Continue to summary" → "Create Token"
6. **保存 Token**（只显示一次！）

### 获取 Account ID

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 右侧栏找到 "Account ID"
3. 复制保存

## 2. 配置项目

### 设置环境变量

```bash
# 复制配置模板
cp .env.local.example .env.local

# 编辑 .env.local，填入你的值
CLOUDFLARE_ACCOUNT_ID="你的-account-id"
CLOUDFLARE_API_TOKEN="你的-api-token"
```

### 验证配置

```bash
# 测试 wrangler 是否能正常工作
wrangler whoami

# 应该显示你的邮箱和账号信息
# ✅ You are logged in with an API Token, associated with the email xxx@xxx.com
```

## 3. 初始化数据库

### 创建数据库（如果还没有）

```bash
# 创建远程 D1 数据库
wrangler d1 create webvault

# 创建本地开发数据库
wrangler d1 create webvault-dev --local
```

### 运行迁移

```bash
# 远程数据库
wrangler d1 execute webvault --file drizzle/0000_light_nico_minoru.sql

# 本地数据库
wrangler d1 execute webvault-dev --local --file drizzle/0000_light_nico_minoru.sql
```

### 导入种子数据

```bash
# 远程数据库
wrangler d1 execute webvault --file scripts/seeds/d1-websites.sql

# 本地数据库
wrangler d1 execute webvault-dev --local --file scripts/seeds/d1-websites.sql
```

## 4. 启动开发

### 普通开发模式

```bash
npm run dev
# 访问 http://localhost:3000
```

### Cloudflare 模式（测试 D1）

```bash
npm run dev:cf
# 访问 http://localhost:8788
```

## 5. 查看数据库

### 方法 1：命令行

```bash
# 查看表
wrangler d1 execute webvault --command "SELECT name FROM sqlite_master WHERE type='table'"

# 查看数据
wrangler d1 execute webvault --command "SELECT * FROM websites LIMIT 10"
```

### 方法 2：Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages → D1
3. 点击 "webvault" 数据库
4. 使用 Console 执行查询

## 6. 部署到生产

### 构建项目

```bash
npm run build:cf
```

### 部署到 Cloudflare Pages

```bash
wrangler pages deploy .vercel/output/static --project-name webvault
```

## 常见问题

### Q: wrangler 提示未认证

确保环境变量已设置：
```bash
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

### Q: 找不到数据库

检查 wrangler.toml 中的 database_id：
```toml
[[d1_databases]]
binding = "DB"
database_name = "webvault"
database_id = "你的-database-id"
```

### Q: dev:cf 启动失败

确保先构建：
```bash
npm run build:cf
npm run dev:cf
```

## 有用的命令

```bash
# 查看所有 D1 数据库
wrangler d1 list

# 查看 Pages 项目
wrangler pages project list

# 查看部署历史
wrangler pages deployment list --project-name webvault

# 查看日志
wrangler pages deployment tail --project-name webvault
```

## 下一步

- 配置 Clerk 认证：参考 [Clerk Setup Guide](./CLERK-SETUP.md)
- 了解数据库操作：参考 [D1 Database Access](./D1-DATABASE-ACCESS.md)
- 自定义配置：编辑 `wrangler.toml` 和 `.env.local`