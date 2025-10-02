import { and, asc, desc, eq, ne, sql, type InferSelectModel, type SQL } from "drizzle-orm"

import { getD1Db } from "@/lib/db/adapters/d1"
import { blogPosts } from "@/lib/db/schema/blog-posts"

import type {
  BlogPostDetail,
  BlogPostListFilters,
  BlogPostListItem,
  BlogPostListResult,
  BlogPostStatus,
} from "@/features/blog/types"
import { generateBlogSlug } from "@/features/blog/utils"
import type {
  BlogPostCreateInput,
  BlogPostStatusInput,
  BlogPostUpdateInput,
} from "@/features/blog/schemas"

export const blogPostsService = {
  async list(params: BlogPostListFilters = {}): Promise<BlogPostListResult> {
    const db = getD1Db()
    const page = Math.max(1, params.page ?? 1)
    const pageSize = clampPageSize(params.pageSize)

    const filters: SQL[] = []

    if (params.search) {
      const keyword = `%${escapeLike(params.search.trim().toLowerCase())}%`
      filters.push(
        sql`(lower(${blogPosts.title}) LIKE ${keyword} OR lower(COALESCE(${blogPosts.summary}, '')) LIKE ${keyword})`
      )
    }

    if (params.status && params.status !== "all") {
      filters.push(eq(blogPosts.status, normalizeStatus(params.status)))
    }

    if (params.tag) {
      const tag = params.tag.trim().toLowerCase()
      if (tag.length > 0) {
        filters.push(
          sql`EXISTS (SELECT 1 FROM json_each(COALESCE(${blogPosts.tags}, '[]')) WHERE lower(json_each.value) = ${tag})`
        )
      }
    }

    const where = filters.length ? and(...filters) : undefined

    const order = resolveOrder(params.orderBy)

    const baseListQuery = db.select().from(blogPosts)
    const listQuery = where ? baseListQuery.where(where) : baseListQuery

    const rows = await listQuery.orderBy(...order).limit(pageSize).offset((page - 1) * pageSize)

    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(blogPosts)
    const countQuery = where ? baseCountQuery.where(where) : baseCountQuery

    const countRow = await countQuery.get()

    const total = Number(countRow?.count ?? 0)
    const items = rows.map(mapRowToListItem)

    return {
      items,
      page,
      pageSize,
      total,
    }
  },

  async getById(id: string): Promise<BlogPostDetail | null> {
    const db = getD1Db()
    const row = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
    if (!row) return null
    return mapRowToDetail(row)
  },

  async create(input: BlogPostCreateInput): Promise<BlogPostDetail> {
    const db = getD1Db()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const desiredSlug = input.slug ? generateBlogSlug(input.slug) : generateBlogSlug(input.title)
    const slug = await ensureUniqueSlug(db, desiredSlug || id)

    const status = normalizeStatus(input.status)
    const publishedAt = resolvePublishedAt(status, input.publishedAt)
    const tags = serializeTags(input.tags)

    await db.insert(blogPosts).values({
      id,
      title: input.title.trim(),
      slug,
      summary: input.summary?.trim() ?? null,
      content: input.content,
      status,
      publishedAt,
      coverImage: input.coverImage?.trim() ?? null,
      authorId: input.authorId?.trim() ?? null,
      tags,
      createdAt: now,
      updatedAt: now,
    })

    const created = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
    if (!created) {
      throw new Error("博客文章创建失败")
    }
    return mapRowToDetail(created)
  },

  async update(id: string, input: BlogPostUpdateInput): Promise<BlogPostDetail> {
    const db = getD1Db()
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
    if (!existing) {
      throw new Error("未找到博客文章")
    }

    const nextStatus = input.status ? normalizeStatus(input.status) : normalizeStatus(existing.status)

    let nextSlug = existing.slug
    if (input.slug !== undefined) {
      const desiredSlug = input.slug ? generateBlogSlug(input.slug) : generateBlogSlug(input.title ?? existing.title)
      nextSlug = await ensureUniqueSlug(db, desiredSlug || existing.slug, id)
    }

    const nextPublishedAt = resolvePublishedAt(nextStatus, input.publishedAt, existing.publishedAt ?? undefined)
    const nextTags = input.tags !== undefined ? serializeTags(input.tags) : existing.tags
    const now = new Date().toISOString()

    await db
      .update(blogPosts)
      .set({
        title: input.title?.trim() ?? existing.title,
        slug: nextSlug,
        summary: input.summary === undefined ? existing.summary : input.summary?.trim() ?? null,
        content: input.content ?? existing.content,
        status: nextStatus,
        publishedAt: nextPublishedAt,
        coverImage: input.coverImage === undefined ? existing.coverImage : input.coverImage?.trim() ?? null,
        authorId: input.authorId === undefined ? existing.authorId : input.authorId?.trim() ?? null,
        tags: nextTags,
        updatedAt: now,
      })
      .where(eq(blogPosts.id, id))

    const updated = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
    if (!updated) {
      throw new Error("博客文章更新失败")
    }
    return mapRowToDetail(updated)
  },

  async updateStatus(id: string, input: BlogPostStatusInput): Promise<BlogPostDetail> {
    return blogPostsService.update(id, input)
  },

  async remove(id: string): Promise<void> {
    const db = getD1Db()
    await db.delete(blogPosts).where(eq(blogPosts.id, id))
  },
}

type BlogPostRow = InferSelectModel<typeof blogPosts>

function mapRowToListItem(row: BlogPostRow): BlogPostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: normalizeStatus(row.status),
    summary: row.summary ?? undefined,
    coverImage: row.coverImage ?? undefined,
    authorId: row.authorId ?? undefined,
    publishedAt: row.publishedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: parseTags(row.tags),
  }
}

function mapRowToDetail(row: BlogPostRow): BlogPostDetail {
  return {
    ...mapRowToListItem(row),
    content: row.content,
  }
}

function parseTags(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((tag): tag is string => typeof tag === "string")
  } catch {
    return []
  }
}

function serializeTags(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null
  const normalized = Array.from(new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)))
  return normalized.length ? JSON.stringify(normalized) : null
}

function normalizeStatus(status: string | null | undefined): BlogPostStatus {
  if (status === "published" || status === "archived") {
    return status
  }
  return "draft"
}

function resolvePublishedAt(
  status: BlogPostStatus,
  provided?: string,
  previous?: string
): string | null {
  if (status === "published") {
    return provided ?? previous ?? new Date().toISOString()
  }
  if (status === "archived") {
    return previous ?? provided ?? null
  }
  return null
}

async function ensureUniqueSlug(
  db: ReturnType<typeof getD1Db>,
  desiredSlug: string,
  excludeId?: string
): Promise<string> {
  const base = generateBlogSlug(desiredSlug) || crypto.randomUUID()
  let candidate = base
  let counter = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(
        excludeId
          ? and(eq(blogPosts.slug, candidate), ne(blogPosts.id, excludeId))
          : eq(blogPosts.slug, candidate)
      )
      .get()

    if (!existing) {
      return candidate
    }

    candidate = `${base}-${counter}`
    counter += 1
  }
}

function clampPageSize(size?: number): number {
  const value = typeof size === "number" && Number.isFinite(size) ? Math.floor(size) : 10
  return Math.max(1, Math.min(value, 100))
}

function resolveOrder(orderBy?: BlogPostListFilters["orderBy"]) {
  switch (orderBy) {
    case "title":
      return [asc(blogPosts.title), desc(blogPosts.updatedAt)] as const
    case "oldest":
      return [asc(blogPosts.updatedAt), asc(blogPosts.id)] as const
    default:
      return [desc(blogPosts.updatedAt), desc(blogPosts.id)] as const
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}
