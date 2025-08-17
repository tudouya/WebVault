# Requirements - Login Page UI

## Status
- **Phase**: Requirements  
- **Status**: Complete
- **Date Created**: 2025-08-17
- **Last Updated**: 2025-08-17

## Introduction

WebVault登录页面UI是用户访问平台的第一个交互入口。本功能实现基于设计图的登录界面，提供邮箱登录、社交认证和密码恢复功能，确保用户能够安全便捷地访问其个人网站收藏和管理功能。

## Alignment with Product Vision

登录功能是WebVault网站目录管理平台的核心基础设施，直接支持产品愿景的以下关键目标：

- **用户网站管理**：登录后用户可以提交、收藏和管理发现的优质网站资源
- **个性化体验**：认证用户可以创建个人收藏夹、管理订阅分类和自定义浏览偏好
- **内容贡献流程**：支持用户提交网站资源，管理员审核发布的完整工作流程
- **社区参与**：登录用户可以参与博客评论、分享推荐，构建活跃的网站发现社区

通过提供便捷的认证体验，降低用户参与门槛，促进平台内容生态的繁荣发展。

## Requirements

### Requirement 1: Email Authentication

**User Story:** 作为回访用户，我希望能够使用邮箱和密码登录，以便访问我保存的网站并继续管理我的个人收藏。

#### Acceptance Criteria

1. WHEN 用户输入有效邮箱和密码 THEN 系统 SHALL 成功认证并重定向到首页
2. IF 凭据无效 THEN 系统 SHALL 显示"邮箱或密码错误"错误信息
3. WHEN 用户提交空邮箱字段 THEN 系统 SHALL 显示"请输入邮箱地址"验证错误
4. IF 邮箱格式无效 THEN 系统 SHALL 显示"请输入有效的邮箱地址"错误
5. WHEN 认证进行中时 THEN 登录按钮 SHALL 显示加载状态并禁用点击
6. IF 网络错误发生 THEN 系统 SHALL 显示"连接失败，请重试"信息
7. WHEN 邮箱字段显示时 THEN 系统 SHALL 显示placeholder文字"name@example.com"（完全匹配设计图）
8. WHEN 密码字段显示时 THEN 系统 SHALL 显示6个圆点掩码"••••••"（完全匹配设计图）

### Requirement 2: Social Authentication

**User Story:** 作为用户，我希望能够使用Google或GitHub登录，以便快速访问平台而无需创建新账户。

#### Acceptance Criteria

1. WHEN 用户点击"Login with Google"按钮 THEN 系统 SHALL 启动Google OAuth流程
2. WHEN 用户点击"Login with GitHub"按钮 THEN 系统 SHALL 启动GitHub OAuth流程  
3. IF OAuth认证成功 THEN 用户 SHALL 被重定向到目标页面
4. IF 用户取消OAuth THEN 系统 SHALL 返回登录页面且无错误显示
5. WHEN OAuth提供商返回错误 THEN 系统 SHALL 显示"认证失败，请重试"信息
6. IF OAuth账户邮箱与现有账户冲突 THEN 系统 SHALL 建议账户关联
7. WHEN Google按钮显示时 THEN 系统 SHALL 显示Google图标和"Login with Google"文字（完全匹配设计图）
8. WHEN GitHub按钮显示时 THEN 系统 SHALL 显示GitHub图标和"Login with GitHub"文字（完全匹配设计图）

### Requirement 3: Password Recovery

**User Story:** 作为用户，我希望在忘记密码时能够重置密码，以便重新获得账户访问权限。

#### Acceptance Criteria

1. WHEN 用户点击"Forgot password?"链接 THEN 系统 SHALL 导航到密码重置页面
2. WHEN 密码重置被触发 THEN 系统 SHALL 在5分钟内发送重置邮件
3. IF 邮箱地址未找到 THEN 系统 SHALL 显示通用的"重置链接已发送"信息保护隐私
4. WHEN "Forgot password?"链接显示时 THEN 系统 SHALL 使用蓝色文字 `#2563EB` 并右对齐（完全匹配设计图）

### Requirement 4: Registration Navigation

**User Story:** 作为新用户，我希望能够轻松导航到注册页面，以便创建新账户。

#### Acceptance Criteria

1. WHEN 用户点击"Sign up"链接 THEN 系统 SHALL 导航到注册页面
2. WHEN 用户在登录页面时 THEN "Sign up"链接 SHALL 清晰可见
3. IF 用户在已认证状态访问登录页 THEN 系统 SHALL 重定向到首页
4. WHEN 底部导航文字显示时 THEN 系统 SHALL 显示"Don't have an account? Sign up"（完全匹配设计图）
5. WHEN "Sign up"链接显示时 THEN 系统 SHALL 使用蓝色文字突出显示

### Requirement 5: Session Management

**User Story:** 作为用户，我希望登录会话既安全又持久，以便在保持安全性的同时不需要频繁重新认证。

#### Acceptance Criteria

1. WHEN user successfully logs in THEN session SHALL persist for 30 days
2. IF user closes browser and returns THEN session SHALL remain active
3. WHEN user logs out explicitly THEN session SHALL be terminated immediately
4. IF multiple failed login attempts occur THEN account SHALL be temporarily locked for 15 minutes

## Non-Functional Requirements

### Performance
- Page load time SHALL be less than 2 seconds on 3G connection
- Form submission response time SHALL be less than 500ms
- Authentication API calls SHALL complete within 3 seconds

### Security
- All authentication flows SHALL use HTTPS encryption
- Form inputs SHALL include CSRF protection tokens
- OAuth redirects SHALL validate state parameters
- Password input SHALL never be logged or cached

### Reliability
- Login success rate SHALL exceed 95% under normal conditions
- System SHALL handle 1000 concurrent login attempts
- Authentication service SHALL maintain 99.9% uptime

### Usability
- Interface SHALL meet WCAG 2.1 AA accessibility standards
- All interactive elements SHALL support keyboard navigation
- Error messages SHALL be clear and actionable
- Form validation SHALL provide real-time feedback

## Visual Design Requirements

### Requirement 6: 精确配色系统和品牌展示

**User Story:** 作为用户，我希望看到与设计图完全一致的品牌标识和配色方案，以便获得专业统一的视觉体验。

#### Acceptance Criteria

1. WHEN 页面加载时 THEN 系统 SHALL 在左上角显示"dir"品牌Logo使用绿色强调色 `#10B981` 
2. WHEN 显示主标题时 THEN 系统 SHALL 使用"Welcome back"文字配合 `#111827` 颜色
3. WHEN 页面布局时 THEN 系统 SHALL 使用主背景色 `#F9FAFB` 和卡片背景色 `#FFFFFF`
4. WHEN 显示主要操作按钮时 THEN 系统 SHALL 使用紫色强调色 `#8B5CF6` (Login按钮)
5. WHEN 展示社交登录按钮时 THEN 系统 SHALL 使用白色背景 `#FFFFFF` 配合深色边框 `#E5E7EB`
6. WHEN 显示文本内容时 THEN 系统 SHALL 使用分层文本颜色：
   - 主标题：`#111827`
   - 正文文本：`#374151` 
   - 辅助文本：`#6B7281`
   - 占位符：`#9CA3AF`

### Requirement 7: 表单设计和视觉层次

**User Story:** 作为用户，我希望登录表单具有清晰的视觉层次和良好的用户体验，以便快速完成登录操作。

#### Acceptance Criteria

1. WHEN 显示邮箱输入框时 THEN 系统 SHALL 使用圆角边框 `8px` 和背景色 `#F3F4F6`
2. WHEN 邮箱输入框显示时 THEN 系统 SHALL 包含占位符文字"name@example.com"使用颜色 `#9CA3AF`
3. WHEN 显示密码输入框时 THEN 系统 SHALL 使用相同样式的圆角边框和掩码显示
4. WHEN 输入框获得焦点时 THEN 系统 SHALL 显示紫色聚焦环 `#8B5CF6` 边框高亮
5. WHEN 显示"Forgot password?"链接时 THEN 系统 SHALL 使用蓝色链接样式 `#2563EB`
6. WHEN 展示表单标签时 THEN 系统 SHALL 使用中等字重和适当的间距

### Requirement 8: 按钮设计和交互效果

**User Story:** 作为用户，我希望按钮设计美观且具有清晰的交互反馈，以便直观地理解可操作元素。

#### Acceptance Criteria

1. WHEN 显示主登录按钮时 THEN 系统 SHALL 使用全宽紫色按钮 `#8B5CF6` 配合白色文字
2. WHEN 用户悬停登录按钮时 THEN 系统 SHALL 显示颜色加深效果 `#7C3AED`
3. WHEN 显示Google登录按钮时 THEN 系统 SHALL 使用白色背景配合Google图标和"Login with Google"文字
4. WHEN 显示GitHub登录按钮时 THEN 系统 SHALL 使用白色背景配合GitHub图标和"Login with GitHub"文字
5. WHEN 社交登录按钮悬停时 THEN 系统 SHALL 显示subtle的背景色变化 `#F9FAFB`
6. WHEN 按钮处于加载状态时 THEN 系统 SHALL 显示旋转加载图标并禁用点击

### Requirement 9: 布局和间距系统

**User Story:** 作为用户，我希望页面布局整齐有序且适配不同屏幕尺寸，以便在任何设备上都能舒适使用。

#### Acceptance Criteria

1. WHEN 页面布局时 THEN 系统 SHALL 使用居中的单列布局，最大宽度 `400px`
2. WHEN 显示表单元素时 THEN 系统 SHALL 保持一致的垂直间距 `16px`
3. WHEN 展示Logo和标题时 THEN 系统 SHALL 在顶部留出适当的空白区域 `48px`
4. WHEN 显示社交登录按钮组时 THEN 系统 SHALL 使用按钮间距 `12px`
5. WHEN 用户在移动设备浏览时 THEN 系统 SHALL 自适应调整间距和字体大小
6. WHEN 页面右侧显示装饰图形时 THEN 系统 SHALL 在桌面端展示几何图形元素

### Requirement 10: 字体和排版规范

**User Story:** 作为用户，我希望看到清晰易读的字体排版，以便舒适地阅读和操作界面元素。

#### Acceptance Criteria

1. WHEN 显示"Welcome back"标题时 THEN 系统 SHALL 使用 `24px` 字号的semibold字重
2. WHEN 显示表单标签时 THEN 系统 SHALL 使用 `14px` 字号的medium字重
3. WHEN 显示输入框文字时 THEN 系统 SHALL 使用 `16px` 字号的regular字重
4. WHEN 显示按钮文字时 THEN 系统 SHALL 使用 `16px` 字号的medium字重
5. WHEN 显示链接文字时 THEN 系统 SHALL 使用 `14px` 字号配合下划线悬停效果
6. WHEN 设置行高时 THEN 系统 SHALL 确保文字具有良好的可读性（1.5倍行高）

### Requirement 11: 响应式设计和主题支持

**User Story:** 作为用户，我希望登录页面在不同设备和主题模式下都能正常显示，以便灵活使用。

#### Acceptance Criteria

1. WHEN 用户在移动设备访问时 THEN 系统 SHALL 隐藏右侧装饰图形，专注表单展示
2. WHEN 用户切换到暗色模式时 THEN 系统 SHALL 自动调整所有颜色为暗色主题变体
3. WHEN 在平板设备浏览时 THEN 系统 SHALL 保持合适的布局比例和间距
4. WHEN 屏幕宽度小于768px时 THEN 系统 SHALL 调整表单容器的外边距
5. WHEN 系统检测到用户的系统主题偏好时 THEN 系统 SHALL 自动应用相应的主题模式

## Design System Integration

### shadcn/ui HSL主题系统映射

```css
/* 登录页面专用配色 - 集成现有HSL主题系统 */
:root {
  /* WebVault 登录页面配色系统 - 基于设计图 8_Login.png */
  --background: 220 13% 98%;        /* #F9FAFB - 页面主背景 */
  --foreground: 220 23% 6%;         /* #111827 - Welcome back文字 */
  --card: 0 0% 100%;                /* #FFFFFF - 表单容器背景 */
  --card-foreground: 220 13% 23%;   /* #374151 - 表单标签文字 */
  
  /* 主要强调色 - 紫色登录按钮 */
  --primary: 262 83% 58%;           /* #8B5CF6 - Login按钮 */
  --primary-foreground: 0 0% 100%;  /* #FFFFFF - Login按钮文字 */
  
  /* 次要强调色 - 蓝色链接 */
  --secondary: 217 91% 60%;         /* #2563EB - Forgot password链接 */
  --secondary-foreground: 0 0% 100%; /* #FFFFFF */
  
  /* 中性色系 */
  --muted: 220 13% 96%;             /* #F3F4F6 - 输入框背景 */
  --muted-foreground: 220 9% 43%;   /* #6B7281 - 辅助文本 */
  --accent: 158 64% 52%;            /* #10B981 - dir Logo绿色 */
  --accent-foreground: 0 0% 100%;   /* #FFFFFF */
  
  /* 边框和输入框 */
  --border: 220 13% 91%;            /* #E5E7EB - 表单边框、社交按钮边框 */
  --input: 220 13% 91%;             /* #E5E7EB - 输入框边框 */
  --ring: 262 83% 58%;              /* #8B5CF6 - 聚焦环 */
  
  /* 占位符和图标 */
  --placeholder: 220 9% 69%;        /* #9CA3AF - 占位符文字 */
  --icon: 220 13% 32%;              /* #4B5563 - 社交图标 */
}

/* Tailwind 类名映射用于登录页面组件 */
.text-welcome     -> text-foreground      (#111827)
.text-label       -> text-card-foreground  (#374151)  
.text-helper      -> text-muted-foreground (#6B7281)
.text-placeholder -> text-placeholder      (#9CA3AF)
.bg-page         -> bg-background         (#F9FAFB)
.bg-form         -> bg-card              (#FFFFFF)
.bg-input        -> bg-muted             (#F3F4F6)
.border-form     -> border-border        (#E5E7EB)
.text-link       -> text-secondary       (#2563EB)
.text-logo       -> text-accent          (#10B981)
```

### 组件设计标准

```css
/* 基于8pt网格的间距系统 */
:root {
  /* 登录页面专用间距 */
  --login-container-width: 400px;
  --login-form-spacing: 16px;      /* 表单元素间距 */
  --login-button-height: 44px;     /* 按钮标准高度 */
  --login-input-height: 44px;      /* 输入框标准高度 */
  --login-border-radius: 8px;      /* 圆角半径 */
  --login-logo-size: 32px;         /* Logo图标尺寸 */
  
  /* 阴影系统 */
  --login-card-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --login-button-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

/* 响应式断点 */
@media (max-width: 768px) {
  :root {
    --login-container-width: 100%;
    --login-form-spacing: 12px;
  }
}
```