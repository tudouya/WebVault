# Supabase Admin-Only 系统配置指南

> **任务18**: 配置Supabase项目禁用公开注册
> **规范**: admin-only-auth-system
> **更新日期**: 2025-08-18

## 概述

此指南帮助您在Supabase Dashboard中配置管理员专用认证系统，禁用所有用户注册功能，确保只有通过Service Role Key创建的管理员账户能够访问系统。

## 配置步骤

### 1. 访问Supabase Dashboard

1. 登录到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的WebVault项目
3. 进入左侧导航的 **Authentication** 部分

### 2. 禁用用户注册 (必需)

**路径**: Authentication > Settings > User signups

配置以下选项：

```
✅ 配置步骤:
□ 将 "Enable email confirmations" 设置为 **关闭**
□ 将 "Enable phone confirmations" 设置为 **关闭** 
□ 将 "Allow new users to sign up" 设置为 **关闭**
```

**重要**: 这是核心配置，确保没有用户可以自行注册。

### 3. 配置邮件模板 (必需)

**路径**: Authentication > Email Templates

管理邮件模板：

```
✅ 保留的模板:
□ **Password reset** - 管理员密码重置
□ **Magic link** - 管理员魔法链接登录(可选)

❌ 禁用的模板:
□ **Confirm signup** - 注册确认模板(删除或禁用)
□ **Invite user** - 邀请用户模板(使用CLI工具替代)
□ **Email change** - 邮箱变更(改为管理员操作)
```

### 4. 密码策略配置 (推荐)

**路径**: Authentication > Settings > Password policy

```
推荐配置:
□ **最小长度**: 8字符
□ **复杂度要求**: 至少包含大小写字母和数字
□ **密码历史**: 防止重复使用最近5个密码
□ **密码过期**: 90天(管理员账户)
```

### 5. 会话管理设置 (必需)

**路径**: Authentication > Settings > Session

```
推荐配置:
□ **会话超时**: 30天 (已在config.toml中配置为2592000秒)
□ **刷新令牌轮换**: 启用
□ **同时会话数**: 3个(管理员多设备访问)
□ **安全会话**: 启用HTTPS only
```

### 6. API和安全设置 (必需)

**路径**: Settings > API

```
安全检查:
□ **RLS (Row Level Security)**: 确保启用
□ **API Gateway**: 限制未经授权的访问
□ **Service Role Key**: 确保安全存储(不在代码中硬编码)
□ **JWT Secret**: 定期轮换(建议每90天)
```

## 配置验证

### 验证公开注册已禁用

使用以下方法测试：

```javascript
// 在浏览器控制台中测试
const { createClient } = supabase;
const supabaseClient = createClient('YOUR_URL', 'YOUR_ANON_KEY');

// 尝试注册 - 应该失败
const { data, error } = await supabaseClient.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
});

console.log('Error (Expected):', error); 
// 期望结果: "Signups not allowed for this instance"
```

### 验证管理员CLI工具

测试管理员创建功能：

```bash
# 在项目根目录运行
npm run admin:create

# 应该成功创建管理员账户
# 验证只有Service Role Key能创建用户
```

### 验证邮件模板

```bash
# 触发密码重置测试
npm run admin:test-password-reset

# 确认邮件正常发送，内容符合管理员专用风格
```

## 环境变量配置

确保以下环境变量在您的 `.env.local` 中正确配置：

```env
# Supabase配置 (必需)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 安全配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 安全审计

### 定期检查项目

```
每月检查清单:
□ 检查Service Role Key的使用情况
□ 监控异常的认证尝试
□ 验证RLS策略是否正常工作  
□ 检查管理员账户活动日志
□ 轮换JWT Secret和API密钥
```

### 监控和告警

建议设置以下监控：

```
监控项目:
□ 异常登录尝试
□ Service Role Key使用情况
□ 管理员账户创建/删除活动
□ API访问模式
```

## 故障排除

### 常见问题

1. **现有管理员无法登录**
   - 检查JWT过期设置
   - 验证会话配置
   - 确认用户在user_profiles表中存在且role='admin'

2. **管理员CLI工具失败**
   - 验证SUPABASE_SERVICE_ROLE_KEY正确配置
   - 检查网络连接和防火墙设置
   - 确认Supabase项目状态正常

3. **邮件模板不工作**
   - 检查SMTP配置
   - 验证邮件模板语法
   - 确认邮件服务提供商设置

## 配置完成确认

完成所有配置后，请确认：

```
最终检查清单:
□ 用户注册功能已完全禁用
□ 只有管理员CLI工具可以创建用户
□ 邮件模板只保留管理员需要的
□ 密码策略符合安全要求
□ 会话管理配置正确
□ 所有现有管理员账户正常工作
□ 环境变量正确配置
□ 安全监控已设置
```

## 注意事项

- **备份**: 在进行任何配置更改前，请备份当前设置
- **测试**: 配置完成后进行充分测试，确保现有管理员账户不受影响
- **文档**: 记录所有配置更改和安全设置，便于后续维护
- **权限**: 确保只有授权人员能访问Supabase Dashboard
- **定期审核**: 建议每月审核一次配置和安全设置

---

**配置完成后，请运行以下命令标记任务完成：**

```bash
claude-code-spec-workflow get-tasks admin-only-auth-system 18 --mode complete
```