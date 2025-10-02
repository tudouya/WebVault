# WebVault 项目概览
- **定位**: 个人/单用户的网站目录管理平台（网址收藏、分类、搜索、内容发现、博客阅读）。
- **部署目标**: Cloudflare Pages（静态导出 + Pages Functions）。
- **后端能力**: Cloudflare D1 + Drizzle ORM；API 采用 REST + JSend 格式，部分路由运行于 Edge Runtime。
- **主要模块**: websites、categories、collections、tags、blog 等，对应 `src/features` 下的功能划分。
- **前端框架**: Next.js App Router（15.x）+ React 19 + Tailwind CSS + Radix UI 组件体系。
- **认证**: 计划使用 Clerk（单用户密码保护）。