# WebVault 技术栈文档

## 核心技术架构

### 前端框架
- **Next.js 15**: 使用 App Router，支持服务端渲染和静态生成
- **React 19**: 最新版本的React，使用客户端和服务端组件
- **TypeScript**: 严格模式，确保类型安全

### 样式和UI系统
- **Tailwind CSS**: Utility-first CSS框架
- **shadcn/ui**: 基于Radix UI的现代组件库
- **Radix UI**: 无样式的可访问组件库
- **Magic UI**: 动效组件库（AnimatedShinyText, BorderBeam, NumberTicker, RetroGrid）
- **Lucide React**: ✅ v0.539.0 已安装
- **next-themes**: 主题系统，支持亮暗模式切换
- **class-variance-authority (CVA)**: 组件变体管理

### 数据库和后端服务
- **Supabase**: ❌ 待集成
  - PostgreSQL数据库
  - 实时订阅功能
  - 内置认证系统
  - 行级安全策略（RLS）
- **@supabase/supabase-js**: ❌ 待添加
- **@supabase/auth-helpers-nextjs**: ❌ 待添加

### 状态管理和数据获取
- **Zustand**: ✅ v5.0.7 已安装
- **Nuqs**: ✅ v2.4.3 已安装
- **React Hook Form**: ✅ v7.62.0 已安装
- **Zod**: ✅ v4.0.17 已安装
- **@hookform/resolvers**: ✅ v5.2.1 已安装
- **Tanstack Query**: ❌ 待添加

### 数据展示和交互
- **@radix-ui/react-select**: ✅ v2.2.6 已安装
- **@radix-ui/react-collapsible**: ✅ v1.1.12 已安装
- **Tanstack Data Tables**: ❌ 待添加
- **Recharts**: ❌ 待添加
- **react-day-picker**: ❌ 待添加

### 开发工具和质量保证
- **ESLint**: 静态代码分析，Next.js配置
- **Prettier**: 代码格式化，包含Tailwind类排序
- **Husky**: Git hooks管理
- **lint-staged**: 暂存文件检查
- **TypeScript**: 严格类型检查

### 性能优化
- **SWC**: Next.js内置的快速编译器
- **Turbopack**: 开发模式性能优化
- **use-debounce**: 防抖处理Hook
- **Next.js Image**: 图片优化，支持WebP/AVIF格式

### 用户体验增强
- **Kbar**: ⌘+K命令面板
- **Sonner**: Toast通知系统
- **motion**: Framer Motion分支，动画效果

### 第三方集成需求

#### 必需集成
- **网站截图服务**: 自动生成网站预览图
  - 考虑方案: Puppeteer, Playwright, 或第三方API
- **网站元数据提取**: 自动获取标题、描述、图标
  - 考虑方案: Open Graph解析、自研爬虫服务

#### 搜索性能优化
- **全文搜索**: PostgreSQL内置全文搜索 + 自定义排序算法
- **搜索索引**: 针对网站标题、描述、标签的复合索引
- **搜索缓存**: Redis缓存热门搜索结果（后期考虑）

## 技术决策和原则

### 架构决策
1. **渐进式Web应用**: 支持离线功能和PWA特性（后期）
2. **服务端优先**: 利用Next.js的SSR/SSG优化SEO和性能
3. **类型安全**: 端到端TypeScript，包括API和数据库层
4. **组件化设计**: 可复用的UI组件和业务组件分离

### 性能要求
- **首页加载时间**: < 2秒（LCP）
- **搜索响应时间**: < 500ms
- **并发用户支持**: 100+ 同时在线用户
- **数据库查询优化**: 复杂查询 < 100ms

### 安全要求
- **认证机制**: Supabase Auth + JWT token
- **数据验证**: Zod schema验证所有输入
- **XSS防护**: 自动转义用户输入
- **CSRF防护**: Next.js内置CSRF保护
- **SQL注入防护**: Supabase参数化查询

### 可扩展性设计
- **微服务就绪**: 功能模块化架构便于后期拆分
- **数据库迁移**: Supabase migrations + 版本控制
- **CDN支持**: Vercel边缘网络 + 静态资源优化
- **缓存策略**: 多层缓存（浏览器、CDN、应用层）

## 开发环境配置

### 必需工具
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0",
  "typescript": "^5.9.2"
}
```

### 推荐VSCode扩展
- TypeScript Hero
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Thunder Client (API测试)

### 环境变量配置
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 第三方服务
SCREENSHOT_API_KEY=
METADATA_EXTRACTOR_API_KEY=

# 开发环境
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 测试策略

### 测试框架
- **Jest**: 单元测试框架
- **React Testing Library**: 组件测试
- **@testing-library/user-event**: 用户交互测试
- **@testing-library/jest-dom**: DOM断言扩展
- **jest-environment-jsdom**: 浏览器环境模拟

### 测试层级
1. **单元测试**: 工具函数、Hook、组件逻辑
2. **集成测试**: API端点、数据库交互
3. **E2E测试**: 关键用户路径（登录→管理→发布）

### 测试优先级
- **高优先级**: API端点、核心业务逻辑、认证流程
- **中优先级**: 复杂UI组件、表单验证、搜索功能
- **低优先级**: 静态页面、简单展示组件

## 部署和运维

### 部署策略
- **初期**: Vercel + Supabase (简单快速)
- **后期**: VPS + Docker (更多控制权和成本优化)

### 监控和日志
- **错误监控**: Vercel Analytics + 自定义错误边界
- **性能监控**: Next.js内置分析 + Core Web Vitals
- **用户行为**: 简单的自研统计（避免隐私问题）

### 备份和恢复
- **数据库备份**: Supabase自动备份 + 定期手动导出
- **代码备份**: Git版本控制 + GitHub仓库
- **静态资源**: Vercel CDN + 本地备份

## 技术债务管理

### 已知技术债务
- 测试覆盖率待提升
- 性能监控体系待完善
- API文档待补充

### 重构优先级
1. 统一错误处理机制
2. 完善类型定义
3. 优化数据库查询
4. 提升测试覆盖率

### 技术升级计划
- 定期更新依赖包（月度）
- 关注Next.js和React新特性
- 评估新的性能优化工具