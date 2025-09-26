import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { and, eq, like, sql, gte, SQL } from 'drizzle-orm';
import { websites } from '@/lib/db/schema/websites';
import type { CloudflareEnv } from '@/types/env';

export function getD1Db() {
  const env = getRequestContext().env as CloudflareEnv;
  return drizzle(env.DB);
}

export interface ListParamsD1 {
  page: number;
  pageSize: number;
  query?: string;
  category?: string;
  featured?: boolean;
  includeAds?: boolean;
  minRating?: number;
}

export async function listWebsitesD1(params: ListParamsD1) {
  const { page, pageSize, query, category, featured, includeAds = true, minRating } = params;
  const db = getD1Db();

  const conds: SQL[] = [];
  if (query && query.trim()) {
    const q = `%${escapeLike(query.trim())}%`;
    conds.push(
      like(websites.title, q)
    );
  }
  if (category) conds.push(eq(websites.categoryId, category));
  if (featured !== undefined) conds.push(eq(websites.isFeatured, featured));
  if (!includeAds) conds.push(eq(websites.isAd, false));
  if (typeof minRating === 'number') conds.push(gte(websites.rating, minRating));

  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select()
    .from(websites)
    .where(where)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ c: total }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(websites)
    .where(where);

  return { rows, total: Number(total) };
}

export async function getWebsiteByIdD1(id: string) {
  const db = getD1Db();
  const rows = await db
    .select()
    .from(websites)
    .where(eq(websites.id, id))
    .limit(1);
  return rows[0] || null;
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}
