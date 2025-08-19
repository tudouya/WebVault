# WebVault 管理员CLI工具

这是一套完整的CLI工具，用于管理WebVault平台的管理员账户。包含创建、查询、更新、删除、密码重置等功能。

## 快速开始

查看所有可用命令：
```bash
npm run admin:help
```

## 环境变量要求

确保以下环境变量已在 `.env.local` 文件中配置：

```bash
# 必需的环境变量
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 可选的配置
NODE_ENV=development
ADMIN_CLI_LOG_LEVEL=info
ADMIN_CLI_AUDIT_LOG=true
```

## 命令详解

### 1. 创建管理员账户

```bash
npm run admin:create -- --email=admin@example.com --password=SecurePass123 --name="Admin User"
```

**参数说明**：
- `--email`: 管理员邮箱地址（必需）
  - 必须是有效的邮箱格式
  - 邮箱不能重复
- `--password`: 管理员密码（必需）
  - 最少8个字符
  - 必须包含至少一个大写字母、一个小写字母和一个数字
- `--name`: 管理员姓名（可选）
  - 最少2个字符，最多100个字符

**示例**：
```bash
npm run admin:create -- --email=admin@webvault.com --password=AdminPass123 --name="Super Admin"
```

### 2. 列出管理员账户

```bash
npm run admin:list [-- --format=table|json] [--limit=20] [--search=admin@example.com] [--page=1]
```

**参数说明**：
- `--format`: 输出格式，支持 `table`（默认）或 `json`
- `--limit`: 每页显示的记录数量，默认20
- `--search`: 按邮箱地址搜索
- `--page`: 页码，默认为1

**示例**：
```bash
# 显示所有管理员（表格格式）
npm run admin:list

# 以JSON格式显示前10个管理员
npm run admin:list -- --format=json --limit=10

# 搜索特定邮箱的管理员
npm run admin:list -- --search=admin@example.com
```

### 3. 更新管理员信息

```bash
npm run admin:update -- --id=uuid-here --name="New Name" [--email=new@email.com]
```

**参数说明**：
- `--id`: 管理员UUID（必需）
- `--name`: 新的管理员姓名（可选）
- `--email`: 新的邮箱地址（可选）

**示例**：
```bash
npm run admin:update -- --id=12345678-1234-1234-1234-123456789abc --name="Updated Admin" --email=updated@example.com
```

### 4. 删除管理员账户

```bash
npm run admin:delete -- --id=uuid-here [--confirm]
```

**参数说明**：
- `--id`: 管理员UUID（必需）
- `--confirm`: 跳过确认提示（可选）

**示例**：
```bash
# 交互式删除
npm run admin:delete -- --id=12345678-1234-1234-1234-123456789abc

# 无确认删除
npm run admin:delete -- --id=12345678-1234-1234-1234-123456789abc --confirm
```

### 5. 重置管理员密码

```bash
npm run admin:reset-password -- --email=admin@example.com [--password=NewPass123]
```

**参数说明**：
- `--email`: 管理员邮箱地址（必需）
- `--password`: 新密码（可选，未提供时自动生成）

**示例**：
```bash
# 手动指定新密码
npm run admin:reset-password -- --email=admin@example.com --password=NewSecurePass123

# 自动生成新密码
npm run admin:reset-password -- --email=admin@example.com
```

### 6. 检查管理员状态

```bash
npm run admin:status -- --email=admin@example.com
```

**参数说明**：
- `--email`: 管理员邮箱地址（必需）

**示例**：
```bash
npm run admin:status -- --email=admin@example.com
```

### 7. 解锁管理员账户

```bash
npm run admin:unlock -- --email=admin@example.com
```

**参数说明**：
- `--email`: 管理员邮箱地址（必需）

**示例**：
```bash
npm run admin:unlock -- --email=admin@example.com
```

## 输出示例

### 成功创建
```
✅ 管理员账户创建成功！邮箱: admin@webvault.com

📊 管理员信息:
   ID: 12345678-1234-1234-1234-123456789abc
   邮箱: admin@webvault.com
   姓名: Super Admin
   角色: admin
   创建时间: 2025-08-18T12:30:41.216Z
```

### 列表显示（表格格式）
```
📋 管理员账户列表 (总计: 3)

┌──────────────────────────────────────┬─────────────────────┬─────────────┬────────┬──────────────────────┐
│ 管理员ID                              │ 邮箱地址              │ 姓名         │ 状态    │ 创建时间              │
├──────────────────────────────────────┼─────────────────────┼─────────────┼────────┼──────────────────────┤
│ 12345678-1234-1234-1234-123456789abc │ admin@webvault.com  │ Super Admin │ 活跃   │ 2025-08-18T12:30:41Z │
│ 87654321-4321-4321-4321-cba987654321 │ user@webvault.com   │ Admin User  │ 活跃   │ 2025-08-18T14:15:22Z │
└──────────────────────────────────────┴─────────────────────┴─────────────┴────────┴──────────────────────┘
```

### 验证失败
```
❌ 输入验证失败
   详情: email: 邮箱格式无效; password: 密码至少需要8个字符
   字段: email
```

## 安全注意事项

- **Service Role Key具有高级权限**，只能在安全的服务器环境中使用
- 所有操作都会记录审计日志
- 密码不会在日志中显示
- 建议定期轮换Service Role Key
- 删除操作不可撤销，请谨慎操作
- 确保环境变量文件（.env.local）不被版本控制跟踪

## 故障排除

### 环境变量未找到
```bash
# 检查环境变量文件是否存在
ls -la .env.local

# 检查环境变量内容
cat .env.local
```

### dotenv-cli未安装
```bash
npm install --save-dev dotenv-cli
```

### TypeScript执行器问题
```bash
# 确保tsx已安装
npm install --save-dev tsx

# 或者全局安装
npm install -g tsx
```

### 数据库表不存在
确保数据库迁移已执行，`user_profiles` 表已创建。

### 邮箱已存在
每个邮箱地址只能创建一个管理员账户。使用 `npm run admin:list` 查看现有账户。

### 权限不足
确保使用的是Service Role Key而不是匿名密钥。

## 开发调试

如需查看详细的调试信息，可以在命令前添加调试标志：

```bash
DEBUG=* npm run admin:create -- --email=test@example.com --password=Test123456
```

或者设置环境变量：

```bash
export ADMIN_CLI_LOG_LEVEL=debug
npm run admin:status -- --email=admin@example.com
```

## 相关文档

- [WebVault项目文档](../../docs/)
- [数据库迁移文档](../database/)
- [Supabase文档](https://supabase.com/docs)