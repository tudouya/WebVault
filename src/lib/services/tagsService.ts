import { and, asc, desc, eq, inArray, like, ne, sql, type SQL } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"

import { tags } from "@/lib/db/schema/tags"
import { websiteTags } from "@/lib/db/schema/website-tags"
import { getD1Db } from "@/lib/db/adapters/d1"

import { generateTagSlug } from "@/features/tags/utils/slug"
import type {
  TagCreateInput,
  TagFilters,
  TagItem,
  TagListPayload,
  TagStatus,
  TagUpdateInput,
} from "@/features/tags/types/tag"

export interface TagListParams extends TagFilters {
  orderBy?: "recent" | "name"
}

export const tagsService = {
  async list(params: TagListParams = {}): Promise<TagListPayload> {
    const db = getD1Db()
    const filters: SQL[] = []

    if (params.search) {
      const keyword = `%${params.search.trim()}%`
      filters.push(like(tags.name, keyword))
    }

    if (params.status && params.status !== "all") {
      filters.push(eq(tags.isActive, params.status === "active"))
    }

    const where = filters.length ? and(...filters) : undefined
    const order = params.orderBy === "name" ? asc(tags.name) : desc(tags.updatedAt)

    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        color: tags.color,
        isActive: tags.isActive,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        websiteCount: sql<number>`count(${websiteTags.websiteId})`,
      })
      .from(tags)
      .leftJoin(websiteTags, eq(websiteTags.tagId, tags.id))
      .where(where)
      .groupBy(tags.id)
      .orderBy(order)

    const items = rows.map(mapRow)
    const total = items.length
    const active = items.filter((item) => item.status === "active").length
    const inactive = total - active

    return {
      items,
      total,
      active,
      inactive,
    }
  },

  async create(input: TagCreateInput): Promise<TagItem> {
    const db = getD1Db()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const normalizedStatus = normalizeStatus(input.status)

    const desiredSlug = input.slug?.trim() || generateTagSlug(input.name)
    const slug = await ensureUniqueSlug(db, desiredSlug || id)

    await db.insert(tags).values({
      id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      color: normalizeColor(input.color),
      isActive: normalizedStatus === "active",
      createdAt: now,
      updatedAt: now,
    })

    const created = await db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .get()

    if (!created) {
      throw new Error("标签创建失败")
    }

    return mapRow({ ...created, websiteCount: 0 })
  },

  async update(id: string, input: TagUpdateInput): Promise<TagItem> {
    const db = getD1Db()

    const existing = await db.select().from(tags).where(eq(tags.id, id)).get()
    if (!existing) {
      throw new Error("未找到标签")
    }

    const status = input.status ? normalizeStatus(input.status) : existing.isActive ? "active" : "inactive"

    let nextSlug = existing.slug
    if (input.slug !== undefined) {
      const desiredSlug = input.slug?.trim() || generateTagSlug(input.name ?? existing.name)
      nextSlug = await ensureUniqueSlug(db, desiredSlug || existing.slug, id)
    }

    await db
      .update(tags)
      .set({
        name: input.name?.trim() ?? existing.name,
        slug: nextSlug,
        description: input.description === undefined ? existing.description : input.description?.trim() || null,
        color: input.color === undefined ? existing.color : normalizeColor(input.color),
        isActive: status === "active",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tags.id, id))

    const updated = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        color: tags.color,
        isActive: tags.isActive,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        websiteCount: sql<number>`count(${websiteTags.websiteId})`,
      })
      .from(tags)
      .leftJoin(websiteTags, eq(websiteTags.tagId, tags.id))
      .where(eq(tags.id, id))
      .groupBy(tags.id)
      .get()

    if (!updated) {
      throw new Error("标签更新失败")
    }

    return mapRow(updated)
  },

  async remove(id: string): Promise<void> {
    const db = getD1Db()

    const existing = await db.select().from(tags).where(eq(tags.id, id)).get()
    if (!existing) {
      throw new Error("未找到标签")
    }

    const assignments = await db
      .select({ count: sql<number>`count(*)` })
      .from(websiteTags)
      .where(eq(websiteTags.tagId, id))
      .get()

    const usage = assignments?.count ? Number(assignments.count) : 0
    if (usage > 0) {
      throw new Error("存在绑定的网址，无法删除标签")
    }

    await db.delete(tags).where(eq(tags.id, id))
  },

  async listByWebsite(websiteId: string): Promise<TagItem[]> {
    if (!websiteId) return []
    const db = getD1Db()

    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        color: tags.color,
        isActive: tags.isActive,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        websiteCount: sql<number>`(select count(*) from website_tags wt where wt.tag_id = ${tags.id})`,
      })
      .from(tags)
      .innerJoin(websiteTags, eq(websiteTags.tagId, tags.id))
      .where(eq(websiteTags.websiteId, websiteId))

    return rows.map(mapRow)
  },

  async updateWebsiteTags(websiteId: string, tagIds: string[]): Promise<void> {
    if (!websiteId) {
      throw new Error("缺少网站 ID")
    }

    const db = getD1Db()
    const uniqueTagIds = Array.from(
      new Set(
        tagIds
          .filter((id) => typeof id === "string")
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
      )
    )

    if (uniqueTagIds.length) {
      const existing = await db
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.id, uniqueTagIds))

      if (existing.length !== uniqueTagIds.length) {
        throw new Error("存在无效的标签 ID")
      }
    }

    await db.delete(websiteTags).where(eq(websiteTags.websiteId, websiteId))

    if (!uniqueTagIds.length) {
      return
    }

    const now = new Date().toISOString()
    await db.insert(websiteTags).values(
      uniqueTagIds.map((tagId) => ({
        websiteId,
        tagId,
        assignedAt: now,
      }))
    )
  },
}

type TagRow = InferSelectModel<typeof tags>

type TagRowWithCount = TagRow & { websiteCount: number | null }

function mapRow(row: TagRowWithCount): TagItem {
  const status: TagStatus = row.isActive ? "active" : "inactive"
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    status,
    websiteCount: Number(row.websiteCount ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function normalizeStatus(status?: TagStatus | null): TagStatus {
  if (status === "inactive") return "inactive"
  return "active"
}

function normalizeColor(color?: string | null): string | null {
  if (!color) return null
  const value = color.startsWith("#") ? color : `#${color}`
  return value.slice(0, 7).toLowerCase()
}

async function ensureUniqueSlug(db: ReturnType<typeof getD1Db>, desiredSlug: string, excludeId?: string): Promise<string> {
  const base = generateTagSlug(desiredSlug) || crypto.randomUUID()
  let candidate = base
  let counter = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        excludeId ? and(eq(tags.slug, candidate), ne(tags.id, excludeId)) : eq(tags.slug, candidate)
      )
      .get()

    if (!existing) {
      return candidate
    }

    candidate = `${base}-${counter}`
    counter += 1
  }
}
