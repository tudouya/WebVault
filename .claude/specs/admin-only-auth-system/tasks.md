# Implementation Plan - Admin Only Auth System

## Task Overview

将WebVault从开放式用户注册转变为封闭式管理员认证系统的实现计划。通过原子化任务分解，确保每个步骤可独立完成、测试和验证，最小化系统风险并保持现有功能的稳定性。

## Steering Document Compliance

### Structure.md 遵循
- **Feature First Architecture**: 所有任务按功能模块垂直组织，认证功能保持自包含
- **数据库迁移**: 遵循 `supabase/migrations/` 标准目录结构
- **CLI工具**: 放置在 `scripts/admin/` 目录，符合项目脚本管理约定
- **中间件扩展**: 基于现有 `src/middleware.ts` 进行增量修改

### Tech.md 模式
- **TypeScript严格模式**: 所有新增代码包含完整类型定义
- **Supabase集成**: 复用现有认证基础设施，扩展而非替换
- **Zod验证**: 所有输入验证使用项目标准验证库
- **shadcn/ui一致性**: UI组件更新保持设计系统一致性

## Atomic Task Requirements

**每个任务遵循原子化标准**:
- **文件范围**: 每个任务操作1-3个相关文件
- **时间限制**: 15-30分钟内可完成
- **单一目的**: 一个可测试的功能点
- **具体文件**: 明确指定要创建或修改的文件路径
- **代理友好**: 输入输出明确，上下文依赖最小

## Tasks

### Phase 1: Database Foundation (高优先级)

- [x] 1. 创建数据库迁移文件结构
  - File: `supabase/migrations/20250118120000_admin_auth_system.sql`
  - 创建完整的数据库迁移文件，包含user_profiles和auth_lockouts表定义
  - 添加索引优化和RLS策略配置
  - 包含清理函数和定期任务设置
  - _Leverage: 现有的Supabase数据库连接和迁移系统_
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. 更新数据库类型定义
  - File: `src/lib/types/database.types.ts`
  - 添加UserProfile和AuthLockout接口定义
  - 更新现有数据库类型，确保与新表结构匹配
  - 导出新增类型供其他模块使用
  - _Leverage: 现有的类型定义结构和命名约定_
  - _Requirements: 1.1, 1.5_

- [x] 3. 运行数据库迁移并验证表结构
  - File: 数据库表结构验证
  - 使用Supabase CLI执行迁移文件
  - 验证user_profiles和auth_lockouts表创建成功
  - 测试RLS策略和索引性能
  - _Leverage: Supabase CLI工具和现有数据库连接_
  - _Requirements: 1.1, 1.3_

### Phase 2: Authentication Service Updates (高优先级)

- [x] 4. 移除SupabaseAuthService中的注册方法
  - File: `src/features/auth/services/SupabaseAuthService.ts`
  - 删除或注释signUp方法实现
  - 保留signIn和所有会话管理方法
  - 更新错误处理，对注册尝试返回明确错误
  - _Leverage: 现有的SupabaseAuthService架构和错误处理机制_
  - _Requirements: 4.4, 4.5_

- [x] 5. 更新AuthService接口定义
  - File: `src/features/auth/services/AuthService.interface.ts`
  - 从接口中移除signUp方法签名
  - 保持其他所有方法签名不变
  - 更新接口文档注释，说明管理员专用特性
  - _Leverage: 现有的接口定义结构和文档约定_
  - _Requirements: 4.4_

- [x] 6. 更新认证状态管理store
  - File: `src/features/auth/stores/auth-store.ts`
  - 调整用户角色检查逻辑，专注admin角色验证
  - 移除注册相关的状态管理
  - 保持现有登录状态和会话管理逻辑
  - _Leverage: 现有的Zustand状态管理模式_
  - _Requirements: 4.5_

### Phase 3: Admin Management CLI Tools (中优先级)

- [x] 7. 创建管理员创建CLI脚本
  - File: `scripts/admin/create-admin.ts`
  - 实现管理员账户创建功能，包含邮箱和密码验证
  - 使用Supabase Service Role Client创建用户
  - 添加错误处理和成功反馈
  - _Leverage: src/lib/supabase.ts中的supabaseServiceRole客户端_
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 8. 创建管理员列表和查询CLI脚本
  - File: `scripts/admin/list-admins.ts`
  - 实现管理员列表显示功能，支持表格和JSON格式
  - 添加搜索和分页功能
  - 包含管理员状态检查（活跃/锁定）
  - _Leverage: 现有的数据库查询模式和输出格式_
  - _Requirements: 2.5_

- [x] 9. 创建管理员管理CLI脚本
  - File: `scripts/admin/manage-admin.ts`
  - 实现更新、删除、密码重置功能
  - 添加账户解锁功能
  - 包含确认提示和安全检查
  - _Leverage: 现有的Service Role权限和事务管理_
  - _Requirements: 2.5_

- [x] 10. 创建CLI工具的npm scripts配置
  - File: `package.json`
  - 添加admin:create, admin:list, admin:update等npm命令
  - 配置参数传递和环境变量检查
  - 添加使用说明和示例
  - _Leverage: 现有的npm scripts结构和约定_
  - _Requirements: 2.1, 2.5_

### Phase 4: Route Protection & Middleware Updates (中优先级)

- [x] 11. 更新中间件路由配置
  - File: `src/middleware.ts`
  - 将/submit路由从requiresAuth:false改为requiresAuth:true,requiredRole:'admin'
  - 保持其他路由配置不变
  - 测试路由保护逻辑的正确性
  - _Leverage: 现有的ROUTE_CONFIGS数组和验证函数_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 12. 测试中间件权限检查功能
  - File: 创建测试用例验证中间件行为
  - 验证非认证用户访问/submit的重定向行为
  - 测试admin角色用户的正常访问
  - 确认其他公共路由不受影响
  - _Leverage: 现有的中间件测试模式_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Phase 5: UI Component Updates (中优先级)

- [x] 13. 更新LoginPage组件配置
  - File: `src/features/auth/components/LoginPage.tsx`
  - 设置showFooter=false，隐藏注册相关UI
  - 更新页面标题和描述为管理员专用
  - 保持所有登录功能和社交登录选项
  - _Leverage: 现有的LoginPage组件架构和prop系统_
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 14. 更新LoginPageFooter组件逻辑
  - File: `src/features/auth/components/LoginPageFooter.tsx`
  - 设置showSignUp=false，移除注册链接
  - 保留法律条款链接和其他页脚内容
  - 更新文案为管理员专用提示
  - _Leverage: 现有的组件prop系统和样式规范_
  - _Requirements: 5.2, 5.4_

- [x] 15. 更新登录页面路由元数据
  - File: `src/app/(auth)/login/page.tsx`
  - 更新页面title为"WebVault - 管理员登录"
  - 调整description和keywords为管理员专用
  - 设置robots.index=false，避免搜索引擎索引
  - _Leverage: 现有的Next.js元数据系统_
  - _Requirements: 5.5_

- [x] 16. 增强AuthGuard组件的admin权限检查
  - File: `src/features/auth/components/AuthGuard.tsx`
  - 添加requiredRole prop支持
  - 实现admin角色的特定权限检查逻辑
  - 提供管理员专用的错误提示信息
  - _Leverage: 现有的AuthGuard组件结构和权限验证模式_
  - _Requirements: 3.2, 6.3_

- [x] 17. 优化AuthErrorBoundary错误处理
  - File: `src/features/auth/components/AuthErrorBoundary.tsx`
  - 添加管理员专用的错误信息处理
  - 优化权限不足时的用户提示
  - 提供联系管理员的明确指导
  - _Leverage: 现有的错误边界模式和UI组件_
  - _Requirements: 5.3, 5.4_

### Phase 6: Supabase Project Configuration (中优先级)

- [x] 18. 配置Supabase项目禁用公开注册
  - File: Supabase Dashboard配置
  - 在Supabase Dashboard中禁用用户注册选项
  - 更新邮件模板，移除注册确认模板
  - 配置密码策略和会话管理设置
  - _Leverage: 现有的Supabase项目配置_
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 19. 验证RLS策略生效
  - File: 数据库权限测试
  - 测试user_profiles表的RLS策略
  - 验证只有admin角色能访问敏感数据
  - 确认非认证用户被正确阻止
  - _Leverage: 现有的数据库安全测试方法_
  - _Requirements: 7.5_

### Phase 7: Integration Testing & Validation (低优先级)

- [x] 20. 创建管理员认证集成测试
  - File: `src/features/auth/__tests__/admin-auth-integration.test.tsx`
  - 测试完整的管理员登录到访问/submit页面流程
  - 验证权限检查和会话管理的集成
  - 包含错误场景和边界条件测试
  - _Leverage: 现有的测试框架和测试工具_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 21. 测试访客用户体验不受影响
  - File: 创建访客体验测试用例
  - 验证首页、搜索、分类浏览等功能正常
  - 确认访客用户访问管理功能时的友好提示
  - 测试所有公共页面的无障碍访问
  - _Leverage: 现有的E2E测试框架_
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 22. 验证现有系统功能集成
  - File: 跨模块集成测试
  - 测试网站管理、博客推荐系统的admin权限限制
  - 验证搜索发现功能对访客用户的完整性
  - 确认分类标签管理的管理员专用访问
  - _Leverage: 现有的功能模块测试套件_
  - _Requirements: Integration Requirements中的所有项_

### Phase 8: Performance Testing & Documentation (低优先级)

- [x] 23. 性能测试和优化验证
  - File: 性能测试用例
  - 测试登录验证响应时间 < 500ms
  - 验证中间件认证检查 < 100ms
  - 测试CLI脚本执行时间 < 5秒
  - _Leverage: 现有的性能测试工具和基准_
  - _Requirements: Performance requirements中的所有项_

- [x] 24. 创建部署和使用文档
  - File: `docs/admin-auth-deployment.md`
  - 编写管理员账户创建和管理指南
  - 记录环境变量配置要求
  - 提供故障排除和维护说明
  - _Leverage: 现有的文档模板和结构_
  - _Requirements: Maintainability requirements_

## Implementation Order

### 关键路径 (必须按顺序执行)
1. **数据库基础** (Tasks 1-3): 为所有后续功能提供数据存储基础
2. **认证服务更新** (Tasks 4-6): 确保核心认证逻辑正确修改
3. **CLI工具开发** (Tasks 7-10): 提供管理员账户管理能力
4. **路由保护更新** (Tasks 11-12): 实施访问控制策略
5. **UI组件清理** (Tasks 13-17): 完成用户界面的专用化改造

### 并行执行组 (可同时进行)
- **Group A**: Tasks 7-10 (CLI工具) 和 Tasks 13-17 (UI更新) 可并行开发
- **Group B**: Tasks 18-19 (Supabase配置) 可在数据库迁移完成后立即开始
- **Group C**: Tasks 20-24 (测试和文档) 可在所有功能完成后并行执行

### 验证检查点
- **Checkpoint 1** (Task 3 完成): 数据库结构验证通过
- **Checkpoint 2** (Task 6 完成): 认证服务功能验证通过  
- **Checkpoint 3** (Task 12 完成): 路由保护功能验证通过
- **Checkpoint 4** (Task 19 完成): 完整系统安全验证通过
- **Checkpoint 5** (Task 24 完成): 生产环境部署就绪

## Risk Mitigation

### 高风险任务
- **Task 4**: 移除认证方法可能影响现有功能，需要充分测试
- **Task 11**: 中间件更新影响路由访问，需要逐步验证
- **Task 18**: Supabase配置更改不可逆，需要备份和回滚计划

### 回滚策略
- 每个阶段完成后创建数据库备份点
- 保留原始代码的git分支
- CLI脚本包含撤销功能
- 分阶段部署，可快速回退到上一稳定版本