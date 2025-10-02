# 常用命令
- `npm run dev` / `pnpm dev`: 本地开发 (Next.js dev server)。
- `npm run dev:cf`: 使用 `next-on-pages` + Wrangler 在本地模拟 Cloudflare Pages。
- `npm run build`: 生产构建；`npm run start` 运行构建结果。
- `npm run build:cf`: 生成 Cloudflare Pages 所需产物。
- `npm run lint`: 运行 ESLint。
- `npm run type-check`: TS 类型检查。
- 测试: 项目包含 Jest/RTL 依赖，可通过 `npx jest` 或配置的 test 脚本（需按需补充）。