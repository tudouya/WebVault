import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { and, desc, eq, gte, inArray, sql, SQL } from 'drizzle-orm';
import { websites } from '@/lib/db/schema/websites';
import { websiteTags } from '@/lib/db/schema/website-tags';
import { categories } from '@/lib/db/schema/categories';
import type { CloudflareEnv } from '@/types/env';

const MAX_PAGE_SIZE = 48;

export function getD1Db() {
  const env = getRequestContext().env as CloudflareEnv;
  return drizzle(env.DB);
}

export interface ListParamsD1 {
  page: number;
  pageSize: number;
  query?: string;
  category?: string;
  tags?: string[];
  includeAds?: boolean;
}

export async function listWebsitesD1(params: ListParamsD1) {
  const { page, pageSize, query, category, tags, includeAds = true } = params;
  const db = getD1Db();

  const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize));
  const requestedPage = Math.max(1, page);

  const conds: SQL[] = [];

  // 只显示已发布的网站
  conds.push(eq(websites.status, 'published'));

  if (query && query.trim()) {
    const q = `%${escapeLike(query.trim())}%`;
    // 搜索 title、description 和 url 三个字段
    conds.push(
      sql`(
        ${websites.title} LIKE ${q} OR
        ${websites.description} LIKE ${q} OR
        ${websites.url} LIKE ${q}
      )`
    );
  }

  // 支持分类层级筛选：查询该分类及其所有子分类下的网站
  if (category) {
    const categoryIds = await getAllSubcategoryIdsD1(db, category);
    if (categoryIds.length === 1) {
      conds.push(eq(websites.categoryId, category));
    } else {
      conds.push(inArray(websites.categoryId, categoryIds));
    }
  }

  // includeAds 为 false 时排除广告
  if (!includeAds) {
    conds.push(eq(websites.isAd, false));
  }

  const where = conds.length ? and(...conds) : undefined;

  // 如果有标签筛选，需要使用 JOIN 查询
  if (tags && tags.length > 0) {
    // 使用 INNER JOIN 筛选包含指定标签的网站
    const [{ c: total }] = await db
      .select({ c: sql<number>`count(DISTINCT ${websites.id})` })
      .from(websites)
      .innerJoin(websiteTags, eq(websites.id, websiteTags.websiteId))
      .where(
        where
          ? and(where, inArray(websiteTags.tagId, tags))
          : inArray(websiteTags.tagId, tags)
      );

    const totalCount = Number(total ?? 0);

    if (totalCount === 0) {
      return { rows: [] as Array<typeof websites.$inferSelect>, total: 0, resolvedPage: 1, pageSize: safePageSize };
    }

    const totalPages = Math.ceil(totalCount / safePageSize);
    const resolvedPage = Math.min(requestedPage, totalPages);
    const offset = (resolvedPage - 1) * safePageSize;

    const rows = await db
      .selectDistinct()
      .from(websites)
      .innerJoin(websiteTags, eq(websites.id, websiteTags.websiteId))
      .where(
        where
          ? and(where, inArray(websiteTags.tagId, tags))
          : inArray(websiteTags.tagId, tags)
      )
      .orderBy(desc(websites.createdAt), desc(websites.id))
      .limit(safePageSize)
      .offset(offset);

    // 只返回 websites 表的数据
    const websiteRows = rows.map(row => row.websites);

    return { rows: websiteRows, total: totalCount, resolvedPage, pageSize: safePageSize };
  }

  // 没有标签筛选，使用原有逻辑
  const [{ c: total }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(websites)
    .where(where);

  const totalCount = Number(total ?? 0);

  if (totalCount === 0) {
    return { rows: [] as Array<typeof websites.$inferSelect>, total: 0, resolvedPage: 1, pageSize: safePageSize };
  }

  const totalPages = Math.ceil(totalCount / safePageSize);
  const resolvedPage = Math.min(requestedPage, totalPages);
  const offset = (resolvedPage - 1) * safePageSize;

  const rows = await db
    .select()
    .from(websites)
    .where(where)
    .orderBy(desc(websites.createdAt), desc(websites.id))
    .limit(safePageSize)
    .offset(offset);

  return { rows, total: totalCount, resolvedPage, pageSize: safePageSize };
}

export async function getWebsiteByIdD1(id: string) {
  const db = getD1Db();
  const rows = await db
    .select()
    .from(websites)
    .where(
      and(
        eq(websites.id, id),
        eq(websites.status, 'published')
      )
    )
    .limit(1);
  return rows[0] || null;
}

/**
 * 递归获取指定分类及其所有子分类的ID列表
 * @param db - Drizzle数据库实例
 * @param categoryId - 父分类ID
 * @returns 包含父分类及所有子分类的ID数组
 */
async function getAllSubcategoryIdsD1(db: ReturnType<typeof getD1Db>, categoryId: string): Promise<string[]> {
  const allIds = [categoryId];

  const getChildren = async (parentId: string) => {
    // 只查询 active 状态的子分类，与前端分类树保持一致
    const children = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.parentId, parentId),
          eq(categories.status, 'active')
        )
      );

    for (const child of children) {
      allIds.push(child.id);
      await getChildren(child.id);
    }
  };

  await getChildren(categoryId);
  return allIds;
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}
