# Clerk 认证配置指南

## 配置步骤

### 1. 注册 Clerk 账号
1. 访问 [https://clerk.com](https://clerk.com)
2. 点击 "Get Started" 注册账号
3. 创建一个新的应用，选择 "Next.js" 作为框架

### 2. 获取 API Keys
在 Clerk Dashboard 中：
1. 进入你的应用
2. 在左侧菜单选择 "API Keys"
3. 复制以下两个密钥：
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (公开密钥)
   - `CLERK_SECRET_KEY` (私密密钥)

### 3. 配置环境变量
1. 复制环境变量示例文件：
```bash
cp .env.local.example .env.local
```

2. 编辑 `.env.local` 文件，填入你的 Clerk 密钥：
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="你的公开密钥"
CLERK_SECRET_KEY="你的私密密钥"
```

### 4. 配置单用户模式（必选）
WebVault 仅提供单用户（或受限多用户）登录，注册入口已关闭：

1. 在 Clerk Dashboard 中，进入 "Users" 页面
2. 手动创建一个用户账号（你的邮箱）
3. 在 "Settings" > "Restrictions" 中：
   - 关闭 "Allow sign-ups"（禁止新用户注册）
   - 或者使用 "Allowlist" 功能，只允许特定邮箱域名

### 5. 启动开发服务器
```bash
npm run dev
```

### 6. 测试登录流程
1. 访问 http://localhost:3000
2. 点击任何需要认证的页面（如 "/submit"）
3. 系统会自动重定向到登录页面
4. 使用你的邮箱登录
5. 登录成功后会自动跳转到 /submit 页面

## 当前已实现的功能

✅ **已完成：**
- Clerk SDK 集成
- 登录页面（注册入口已移除）
- 路由中间件保护
- Submit 页面认证保护
- 用户信息显示
- 登出功能

⏳ **待实现：**
- API 端点认证
- 管理员仪表板
- 编辑/删除权限控制

## 受保护的路由

### 需要登录才能访问：
- `/submit` - 提交新网站
- `/admin/*` - 管理后台（待开发）
- `/dashboard/*` - 仪表板（待开发）

### 公开访问：
- `/` - 首页
- `/search` - 搜索
- `/website/*` - 网站详情
- `/blog/*` - 博客
- `/category` - 分类浏览
- `/tag` - 标签浏览
- `/collection` - 收藏集

## 故障排查

### 常见问题

1. **"Invalid API Key" 错误**
   - 检查 `.env.local` 中的密钥是否正确
   - 确保密钥前后没有多余的空格

2. **登录后没有跳转**
   - 检查 `middleware.ts` 配置是否正确
   - 确认环境变量中的重定向URL设置

3. **样式问题**
   - Clerk 组件使用了自己的样式
   - 可以通过 `appearance` prop 自定义样式

## 下一步

1. 实现 API 认证保护
2. 创建管理员仪表板
3. 添加更多用户管理功能
