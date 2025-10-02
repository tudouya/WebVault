# 任务完成检查
- 代码通过 `npm run lint` / `npm run type-check`（若有改动涉及）。
- Edge/API 逻辑符合 REST + JSend 规范，错误码/信息对齐 `specs`。
- 前端遵循 feature 目录分层，保持组件无冗余 mock，避免破坏现有样式交互。
- 若涉及数据库改动，通过 Drizzle 迁移管理并更新相关 schema。
- 视情况更新 README/文档，确保接入 Cloudflare Pages 相关配置不被破坏。