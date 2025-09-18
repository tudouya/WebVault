# Setup Guide: Clerk Auth + Cloudflare D1

This guide sets up authentication (Clerk) and data (Cloudflare D1 + Drizzle) for WebVault.

Note: 已确认采用 D1-only 策略，开发与生产均使用 Cloudflare D1 与 Edge Runtime（不再使用本地 SQLite）。

## 1) Install Dependencies

Add core packages (run in project root):

```
npm i @clerk/nextjs drizzle-orm
npm i -D drizzle-kit
```

Notes
- 本项目为 D1-only：开发与生产均使用 Cloudflare Pages + D1。

## 2) Environment Variables

Copy `.env.local.example` to `.env.local` and fill the values:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID` (for D1)

Optional Clerk URLs if you customize auth routes:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## 3) Clerk Integration (App Router)

1. Wrap the app with `ClerkProvider` in `src/app/layout.tsx`:

```tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
```

2. Add `middleware.ts` at project root to protect routes:

```ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/api/health',
    '/website(.*)',
    '/api/favicon(.*)'
  ],
});

export const config = {
  matcher: [
    // Run Clerk on all routes except static files and Next internals
    '/((?!_next|.*\..*).*)',
  ],
};
```

3. Use server-side helpers where needed:

```ts
import { auth, currentUser } from '@clerk/nextjs/server';
```

## 4) Drizzle + D1 Setup

1. Drizzle config: we ship `drizzle.config.mjs` already.

2. Define schema: 已提供 `src/lib/db/schema/websites.ts`

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const websites = sqliteTable('websites', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  faviconUrl: text('favicon_url'),
  tags: text('tags'), // JSON string of string[]
  category: text('category'),
  isAd: integer('is_ad', { mode: 'boolean' }).notNull().default(false),
  adType: text('ad_type'),
  rating: integer('rating'),
  visitCount: integer('visit_count').notNull().default(0),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
```

3. Adapter: 已提供 D1 适配器 `src/lib/db/adapters/d1.ts`（基于 `drizzle-orm/d1` + `@cloudflare/next-on-pages`）。
   我们不再使用 SQLite 适配器。

4. Create a D1 client helper `src/lib/db/client.ts` (already present for channel detection). Later, update it to import the real adapters:

```ts
// For Cloudflare Pages runtime
import { drizzle } from 'drizzle-orm/d1';

export function getDbCF(env: { DB: D1Database }) {
  return drizzle(env.DB);
}
```

4. Migrations

```
npx drizzle-kit generate
npx drizzle-kit migrate
```

On Cloudflare, you can also manage D1 with `wrangler d1`.

## 5) First Minimal API

Implement read-only endpoints with JSend:

- `GET /api/websites` – list websites
- `GET /api/websites/[id]` – website detail

Make routes public first; add auth gating later when create/update is introduced.

## 6) Frontend Fetch Hook

Use the standardized `useApiData` hook (see `src/hooks/useApiData.ts`) to handle JSend responses and unify loading/error states.

## 7) Verification

Wrangler config: `wrangler.toml` 已包含 D1 绑定样例。将 `database_id` 与 `database_name` 替换为你的真实值。

本地开发（D1-only 推荐流程）

- 安装依赖：`npm i`（包含 drizzle-orm, drizzle-kit, @cloudflare/next-on-pages, wrangler）
- 种子数据：`npm run db:seed:d1`
- 启动开发：`npm run dev:cf`（包含 next-on-pages watch + wrangler pages dev）
- 访问：`/api/health`（应显示 `dataChannel: "d1"`）

- `GET /api/health` returns `{ clerkConfigured, d1Configured }` = true/false
- Run `npm run type-check` and basic pages still render.
- After you install deps, rename `middleware.example.ts` to `middleware.ts` and wrap app in `ClerkProvider`.
