# WebVault 开发文档

## 📋 文档导航

- [开发指南](./development.md) - 本地开发环境搭建和开发流程
- [API文档](./api.md) - 后端API接口文档
- [部署指南](./deployment.md) - 生产环境部署说明
- [管理员认证系统部署指南](./admin-auth-deployment.md) - 管理员专用认证系统完整部署和使用文档
- [Supabase Admin配置指南](./supabase-admin-config-guide.md) - Supabase项目管理员专用配置说明
- [架构设计](../CLAUDE.md) - 完整项目架构文档

## 🏗️ 项目架构概览

WebVault 采用 **Feature First Architecture**（功能优先架构），将相关功能组织在一起，便于维护和扩展。

### 核心模块

- **websites** - 网站管理核心模块
- **categories** - 分类系统
- **tags** - 标签系统
- **collections** - 主题合集
- **blog** - 博客系统
- **submissions** - 提交审核
- **admin** - 管理功能

### 技术选型

- **前端框架**: Next.js 15 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **认证系统**: Supabase Auth + 抽象认证接口
- **状态管理**: Zustand + Nuqs
- **UI组件**: shadcn/ui + Tailwind CSS
- **开发语言**: TypeScript (严格模式)

## 🚀 开发流程

1. **需求分析** - 明确功能需求和技术要求
2. **架构设计** - 设计模块结构和数据流
3. **功能开发** - 按Feature模块进行开发
4. **测试验证** - 单元测试和集成测试
5. **文档更新** - 及时更新相关文档

## 📝 编码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 组件和函数使用有意义的命名
- 及时添加类型注解和注释
- 遵循 Feature 模块化组织方式

## 🔧 开发工具

- **代码编辑器**: VS Code (推荐)
- **版本控制**: Git
- **包管理**: npm
- **调试工具**: Next.js Dev Tools
- **类型检查**: TypeScript

## 📚 学习资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Supabase 官方文档](https://supabase.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com/)

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 GitHub Issue
- 发送邮件到项目维护者

---

更新时间: 2025-08-14