# Requirements Document - Admin Only Auth System

## Introduction

WebVault管理员专用认证系统旨在创建一个封闭式内容管理平台，只允许管理员用户登录、提交和管理网站资源。此系统将移除所有用户注册功能，简化认证流程，并确保只有预定义的管理员账户能够访问系统的管理功能。

## Alignment with Product Vision

### 支持的核心价值主张
- **高质量内容策展**：通过限制内容创建权限，确保只有受训管理员能添加网站资源，直接提升整体内容质量和一致性
- **用户友好体验**：简化认证流程，访客用户无需注册即可享受完整的浏览和搜索体验，降低使用门槛
- **内容推荐专业化**：管理员作为内容专家，能够提供更专业的网站推荐和分类管理
- **安全性和稳定性**：减少攻击面和系统复杂性，提供更稳定可靠的服务

### 影响的核心功能模块
- **网站管理系统**：简化为管理员专用，提升操作效率和内容质量
- **提交审核工作流**：转变为管理员直接提交模式，无需复杂的审核流程
- **用户认证系统**：从开放式用户注册转为封闭式管理员认证
- **搜索和发现**：保持访客用户的完整搜索和筛选功能，无需认证
- **博客推荐系统**：确保只有专业管理员能创建和管理推荐内容

### 关键成功指标的影响
- **网站收录数量和质量**：通过专业管理员策展，预期质量评分提升20%
- **用户活跃度**：访客用户体验简化，预期月访问量（MAU）提升15%
- **系统安全性**：减少用户账户管理复杂性，降低安全事件风险90%

## Requirements

### Requirement 1: 数据库结构完善

**User Story:** 作为系统管理员，我需要完善的用户数据表和认证锁定机制，以便安全地管理管理员账户并防止暴力破解攻击。

#### Acceptance Criteria

1. WHEN 系统初始化时 THEN 数据库 SHALL 包含 user_profiles 表，支持管理员用户信息存储
2. WHEN 用户登录失败时 THEN 系统 SHALL 在 auth_lockouts 表中记录失败尝试
3. IF 用户连续登录失败超过5次 THEN 系统 SHALL 锁定该邮箱账户15分钟
4. WHEN 管理员成功登录时 THEN 系统 SHALL 清除该账户的失败尝试记录
5. WHEN 查询用户信息时 THEN user_profiles 表 SHALL 只包含 role='admin' 的用户记录

### Requirement 2: 管理员账户管理脚本

**User Story:** 作为系统管理员，我需要命令行工具来创建和管理管理员账户，因为系统不提供注册界面。

#### Acceptance Criteria

1. WHEN 执行创建管理员脚本时 THEN 系统 SHALL 创建新的管理员账户含邮箱和密码
2. WHEN 创建管理员账户时 THEN 系统 SHALL 验证邮箱格式和密码强度
3. IF 邮箱已存在 THEN 脚本 SHALL 返回错误信息不允许重复创建
4. WHEN 管理员账户创建成功时 THEN 系统 SHALL 在Supabase auth.users和user_profiles表中创建对应记录
5. WHEN 执行脚本时 THEN 系统 SHALL 提供列表、更新、删除管理员账户的功能

### Requirement 3: 路由保护中间件更新

**User Story:** 作为系统管理员，我需要限制/submit页面只对管理员开放，确保只有管理员能提交网站资源。

#### Acceptance Criteria

1. WHEN 非认证用户访问/submit页面时 THEN 系统 SHALL 重定向到登录页面
2. WHEN 认证用户访问/submit页面但角色不是admin时 THEN 系统 SHALL 重定向到首页
3. WHEN admin角色用户访问/submit页面时 THEN 系统 SHALL 允许正常访问
4. IF 用户会话过期 THEN 系统 SHALL 重定向到登录页面保留returnUrl参数
5. WHEN 中间件验证失败时 THEN 系统 SHALL 记录日志并提供适当的错误信息

### Requirement 4: 禁用用户注册功能

**User Story:** 作为系统管理员，我需要完全禁用用户注册功能，确保系统为封闭式管理平台。

#### Acceptance Criteria

1. WHEN 用户访问注册相关路径时 THEN 系统 SHALL 重定向到登录页面
2. WHEN 调用注册相关API时 THEN 系统 SHALL 返回404或403错误
3. IF Supabase项目启用了用户注册 THEN 系统配置 SHALL 禁用公开注册
4. WHEN SupabaseAuthService调用signUp方法时 THEN 系统 SHALL 抛出错误或移除该方法
5. WHEN 系统运行时 THEN 不 SHALL 存在任何用户自主注册的入口

### Requirement 5: 认证UI界面清理

**User Story:** 作为管理员用户，我需要简洁的登录界面，不包含注册选项和相关提示。

#### Acceptance Criteria

1. WHEN 用户访问登录页面时 THEN 界面 SHALL 只显示邮箱、密码输入框和登录按钮
2. WHEN 登录界面加载时 THEN 不 SHALL 显示注册链接、注册按钮或相关提示文本
3. IF 登录失败 THEN 界面 SHALL 显示具体错误信息（"邮箱不存在"或"密码错误"或"账户已锁定"）且响应时间不超过500ms，不提供注册建议
4. WHEN 用户忘记密码时 THEN 界面 SHALL 显示"请联系系统管理员重置密码"说明，不显示注册链接或自助注册选项
5. WHEN 界面显示时 THEN 应明确标识为"管理员登录"页面

### Requirement 6: 访客用户体验优化

**User Story:** 作为访客用户，我希望能直接浏览和搜索网站而无需注册，以便快速获取所需资源而不受认证系统复杂性影响。

#### Acceptance Criteria

1. WHEN 访客用户访问首页时 THEN 系统 SHALL 显示完整的网站内容而无需登录提示
2. WHEN 访客用户使用搜索功能时 THEN 系统 SHALL 提供完整的搜索结果和筛选选项
3. IF 访客用户尝试访问管理功能 THEN 系统 SHALL 清晰说明此功能仅限管理员使用
4. WHEN 访客用户浏览分类和集合时 THEN 系统 SHALL 提供无障碍的浏览体验
5. WHEN 系统显示界面时 THEN 不 SHALL 包含注册提示或注册相关的用户引导

### Requirement 7: Supabase项目配置

**User Story:** 作为系统管理员，我需要Supabase项目配置为禁用公开注册，确保数据库层面的安全性。

#### Acceptance Criteria

1. WHEN Supabase项目配置时 THEN 公开注册选项 SHALL 被禁用
2. WHEN 用户尝试通过Supabase客户端直接注册时 THEN 操作 SHALL 被拒绝
3. IF 需要创建用户 THEN 只能 通过service role key使用管理员权限创建
4. WHEN 配置邮件模板时 THEN 只保留密码重置模板移除注册确认模板
5. WHEN 系统运行时 THEN RLS策略 SHALL 确保只有admin角色用户能访问敏感数据

## Integration Requirements

### 现有系统集成点

#### 网站管理系统集成
- **提交页面访问控制**：移除公开访问，添加管理员角色验证
- **网站CRUD操作**：确保所有创建、编辑、删除操作需要admin权限
- **批量操作安全性**：管理员批量导入和管理功能的权限控制

#### 博客推荐系统集成
- **内容创建权限**：只有admin角色能创建和编辑博客文章
- **文章发布控制**：移除草稿状态，管理员文章直接发布
- **评论系统影响**：如果有评论功能，确保访客能正常评论但无需注册

#### 搜索和发现系统集成
- **搜索功能保持**：访客用户保持完整的搜索和筛选功能
- **分类浏览权限**：所有分类和标签浏览功能对访客开放
- **集合展示**：访客能正常浏览和访问所有公开集合

#### 现有认证系统集成
- **会话管理兼容性**：与现有的Supabase认证会话管理保持兼容
- **中间件集成**：更新现有路由保护中间件，不破坏现有的API保护逻辑
- **认证Hook更新**：现有的useAuth等Hook需要适配新的管理员专用模式

## Non-Functional Requirements

### Performance
- 登录验证响应时间 < 500ms
- 中间件认证检查 < 100ms
- 管理员创建脚本执行时间 < 5秒
- 数据库查询优化，复合索引支持

### Security
- 密码必须符合强度要求（最少8位，包含大小写字母和数字）
- 会话token使用JWT格式，30天有效期
- 账户锁定机制防止暴力破解攻击
- 所有API输入使用Zod验证防止注入攻击
- 敏感操作记录审计日志

### Reliability
- 认证服务99%可用性
- 数据库连接池管理防止连接泄漏
- 优雅错误处理，不暴露系统内部信息
- 自动重试机制处理临时网络问题

### Usability
- 登录界面响应式设计，支持移动端和桌面端
- 清晰的错误信息提示
- 记住登录状态，减少重复登录
- 管理员脚本提供友好的命令行界面

### Maintainability
- 代码遵循项目TypeScript严格模式
- 单元测试覆盖率 > 80%
- API文档完整，支持开发和维护
- 配置外部化，支持不同环境部署