# 代码风格与约定
- **结构**: 遵循 `src/app` + `src/features/<module>` + `components/ui|layout|shared` 的分层；功能文件数≥3时建立 feature 模块。
- **风格**: 强调“渐进式迭代”“无聊而明显”的实现；组件/函数聚焦单一职责；遵循 App Router 规范。
- **类型/命名**: TypeScript 全覆盖；hooks 使用 `use` 前缀，组件 PascalCase，工具函数 camelCase。
- **API**: RESTful，响应遵循 JSend/项目 `specs/api-response.md`；错误码遵循 `specs/error-codes.md`。
- **数据库**: 迁移通过 Drizzle Kit 管理 (`drizzle/` 目录)。
- **CSS/UI**: Tailwind 4.x + Radix UI；公共组件在 `components/ui|shared`，业务组件放在对应 feature。