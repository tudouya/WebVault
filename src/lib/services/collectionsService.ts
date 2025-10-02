import { and, asc, desc, eq, inArray, ne, sql, type SQL } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"

import { getD1Db } from "@/lib/db/adapters/d1"
import { auditLogs } from "@/lib/db/schema/audit-logs"
import { collectionItems } from "@/lib/db/schema/collection-items"
import { collections } from "@/lib/db/schema/collections"
import { websites } from "@/lib/db/schema/websites"

import { generateCollectionSlug } from "@/features/collections/utils/slug"
import type {
  CollectionCreateInput,
  CollectionDetail,
  CollectionItemDetail,
  CollectionItemInput,
  CollectionListItem,
  CollectionListParams,
  CollectionListResult,
  CollectionUpdateInput,
} from "@/features/collections/types"

interface MutationOptions {
  actorId?: string
}

export const collectionsService = {
  async list(params: CollectionListParams = {}): Promise<CollectionListResult> {
    const db = getD1Db()

    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.max(1, Math.min(params.pageSize ?? 20, 100))
    const offset = (page - 1) * pageSize

    const filters: SQL[] = []

    if (params.search?.trim()) {
      const keyword = `%${escapeLike(params.search.trim())}%`
      filters.push(
        sql`(${collections.name} LIKE ${keyword} OR ${collections.slug} LIKE ${keyword} OR coalesce(${collections.description}, '') LIKE ${keyword})`
      )
    }

    if (params.featured === true) {
      filters.push(eq(collections.isFeatured, true))
    } else if (params.featured === false) {
      filters.push(eq(collections.isFeatured, false))
    }

    const where = filters.length ? and(...filters) : undefined

    const orderByClause = (() => {
      switch (params.orderBy) {
        case "name":
          return [asc(collections.name), asc(collections.displayOrder)] as const
        case "order":
          return [asc(collections.displayOrder), asc(collections.name)] as const
        default:
          return [desc(collections.updatedAt), asc(collections.name)] as const
      }
    })()

    const listQuery = db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        coverImage: collections.coverImage,
        isFeatured: collections.isFeatured,
        displayOrder: collections.displayOrder,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        websiteCount: sql<number>`count(${collectionItems.id})`,
      })
      .from(collections)
      .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
      .groupBy(collections.id)
      .orderBy(...orderByClause)
      .limit(pageSize)
      .offset(offset)

    const rows = await (where ? listQuery.where(where) : listQuery)

    const baseCountQuery = db.select({ value: sql<number>`count(*)` }).from(collections)
    const totalRow = await (where ? baseCountQuery.where(where) : baseCountQuery).get()

    const total = Number(totalRow?.value ?? 0)
    const items = rows.map(mapCollectionRecord)
    const hasMore = page * pageSize < total

    return {
      items,
      page,
      pageSize,
      total,
      hasMore,
    }
  },

  async getById(id: string): Promise<CollectionDetail | null> {
    const db = getD1Db()
    return loadCollectionDetail(db, id)
  },

  async create(input: CollectionCreateInput, options: MutationOptions = {}): Promise<CollectionDetail> {
    const db = getD1Db()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const desiredSlug = input.slug?.trim() || generateCollectionSlug(input.name)
    const slug = await ensureUniqueSlug(db, desiredSlug || id)

    const displayOrder = await resolveDisplayOrder(db, input.displayOrder)

    await db.insert(collections).values({
      id,
      name: input.name.trim(),
      slug,
      description: normalizeNullable(input.description),
      coverImage: normalizeNullable(input.coverImage),
      isFeatured: Boolean(input.isFeatured),
      displayOrder,
      createdAt: now,
      updatedAt: now,
    })

    if (input.items?.length) {
      await replaceCollectionItems(db, id, input.items, options.actorId)
    }

    await recordAuditLog(db, {
      actorId: options.actorId,
      action: "collection.create",
      entityId: id,
      changes: {
        name: input.name,
        slug,
        isFeatured: Boolean(input.isFeatured),
        displayOrder,
      },
    })

    const detail = await loadCollectionDetail(db, id)
    if (!detail) {
      throw new Error("创建集合失败")
    }
    return detail
  },

  async update(
    id: string,
    input: CollectionUpdateInput,
    options: MutationOptions = {}
  ): Promise<CollectionDetail> {
    const db = getD1Db()
    const existing = await ensureCollectionExists(db, id)

    const nextName = input.name?.trim() ?? existing.name
    const nextDescription = input.description === undefined ? existing.description : normalizeNullable(input.description)
    const nextCover = input.coverImage === undefined ? existing.coverImage : normalizeNullable(input.coverImage)
    const nextFeatured =
      input.isFeatured === undefined ? Boolean(existing.isFeatured) : Boolean(input.isFeatured)
    const nextDisplayOrder =
      input.displayOrder === undefined ? existing.displayOrder ?? 0 : Math.max(0, input.displayOrder)

    let nextSlug = existing.slug
    if (input.slug !== undefined) {
      const desiredSlug = input.slug?.trim() || generateCollectionSlug(nextName)
      nextSlug = await ensureUniqueSlug(db, desiredSlug || existing.slug, id)
    }

    const now = new Date().toISOString()

    await db
      .update(collections)
      .set({
        name: nextName,
        slug: nextSlug,
        description: nextDescription,
        coverImage: nextCover,
        isFeatured: nextFeatured,
        displayOrder: nextDisplayOrder,
        updatedAt: now,
      })
      .where(eq(collections.id, id))

    await recordAuditLog(db, {
      actorId: options.actorId,
      action: "collection.update",
      entityId: id,
      changes: {
        name: nextName,
        slug: nextSlug,
        isFeatured: nextFeatured,
        displayOrder: nextDisplayOrder,
      },
    })

    const detail = await loadCollectionDetail(db, id)
    if (!detail) {
      throw new Error("更新集合失败")
    }
    return detail
  },

  async delete(id: string, options: MutationOptions = {}): Promise<void> {
    const db = getD1Db()

    const existing = await db.select({ id: collections.id }).from(collections).where(eq(collections.id, id)).get()
    if (!existing) {
      throw new Error("集合不存在")
    }

    await db.delete(collectionItems).where(eq(collectionItems.collectionId, id))
    await db.delete(collections).where(eq(collections.id, id))

    await recordAuditLog(db, {
      actorId: options.actorId,
      action: "collection.delete",
      entityId: id,
      changes: null,
    })
  },

  async replaceItems(
    collectionId: string,
    items: CollectionItemInput[],
    options: MutationOptions = {}
  ): Promise<CollectionItemDetail[]> {
    const db = getD1Db()
    await ensureCollectionExists(db, collectionId)
    await replaceCollectionItems(db, collectionId, items, options.actorId)
    return loadCollectionItems(db, collectionId)
  },
}

type CollectionRow = InferSelectModel<typeof collections>

type CollectionRecord = CollectionRow & { websiteCount: number | null }

type CollectionItemRow = InferSelectModel<typeof collectionItems>

type CollectionItemWithWebsite = CollectionItemRow & {
  websiteTitle: string | null
  websiteUrl: string | null
  websiteFavicon: string | null
}

function mapCollectionRecord(row: CollectionRecord): CollectionListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    coverImage: row.coverImage ?? undefined,
    isFeatured: Boolean(row.isFeatured),
    displayOrder: typeof row.displayOrder === "number" ? row.displayOrder : 0,
    websiteCount: Number(row.websiteCount ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function loadCollectionDetail(db: ReturnType<typeof getD1Db>, id: string): Promise<CollectionDetail | null> {
  const row = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      coverImage: collections.coverImage,
      isFeatured: collections.isFeatured,
      displayOrder: collections.displayOrder,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
      websiteCount: sql<number>`(select count(*) from collection_items ci where ci.collection_id = ${collections.id})`,
    })
    .from(collections)
    .where(eq(collections.id, id))
    .get()

  if (!row) {
    return null
  }

  const items = await loadCollectionItems(db, id)
  const base = mapCollectionRecord(row)

  return {
    ...base,
    description: row.description ?? undefined,
    coverImage: row.coverImage ?? undefined,
    items,
  }
}

async function loadCollectionItems(
  db: ReturnType<typeof getD1Db>,
  collectionId: string
): Promise<CollectionItemDetail[]> {
  const rows = await db
    .select({
      id: collectionItems.id,
      collectionId: collectionItems.collectionId,
      websiteId: collectionItems.websiteId,
      note: collectionItems.note,
      position: collectionItems.position,
      createdAt: collectionItems.createdAt,
      websiteTitle: websites.title,
      websiteUrl: websites.url,
      websiteFavicon: websites.faviconUrl,
    })
    .from(collectionItems)
    .leftJoin(websites, eq(websites.id, collectionItems.websiteId))
    .where(eq(collectionItems.collectionId, collectionId))
    .orderBy(asc(collectionItems.position), asc(collectionItems.createdAt))

  return rows.map(mapCollectionItem)
}

function mapCollectionItem(row: CollectionItemWithWebsite): CollectionItemDetail {
  const hasWebsite = Boolean(row.websiteTitle) || Boolean(row.websiteUrl)
  return {
    id: row.id,
    websiteId: row.websiteId,
    position: typeof row.position === "number" ? row.position : 0,
    note: row.note ?? null,
    createdAt: row.createdAt,
    website: hasWebsite
      ? {
          id: row.websiteId,
          title: row.websiteTitle ?? row.websiteUrl ?? row.websiteId,
          url: row.websiteUrl ?? "",
          faviconUrl: row.websiteFavicon ?? undefined,
        }
      : undefined,
  }
}

async function ensureCollectionExists(
  db: ReturnType<typeof getD1Db>,
  id: string
): Promise<CollectionRow> {
  const existing = await db.select().from(collections).where(eq(collections.id, id)).get()
  if (!existing) {
    throw new Error("集合不存在")
  }
  return existing
}

async function resolveDisplayOrder(db: ReturnType<typeof getD1Db>, desired?: number): Promise<number> {
  if (typeof desired === "number") {
    return Math.max(0, desired)
  }

  const row = await db.select({ value: sql<number>`max(${collections.displayOrder})` }).from(collections).get()
  const maxOrder = Number(row?.value ?? 0)
  return maxOrder + 1
}

async function ensureUniqueSlug(
  db: ReturnType<typeof getD1Db>,
  desiredSlug: string,
  excludeId?: string
): Promise<string> {
  const base = generateCollectionSlug(desiredSlug) || crypto.randomUUID()
  let candidate = base
  let counter = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db
      .select({ id: collections.id })
      .from(collections)
      .where(excludeId ? and(eq(collections.slug, candidate), ne(collections.id, excludeId)) : eq(collections.slug, candidate))
      .get()

    if (!existing) {
      return candidate
    }

    candidate = `${base}-${counter}`
    counter += 1
  }
}

async function replaceCollectionItems(
  db: ReturnType<typeof getD1Db>,
  collectionId: string,
  items: CollectionItemInput[],
  actorId?: string
): Promise<void> {
  const normalized = normalizeItemsInput(items)

  const uniqueWebsiteIds = Array.from(new Set(normalized.map((item) => item.websiteId)))

  if (uniqueWebsiteIds.length) {
    const existing = await db
      .select({ id: websites.id })
      .from(websites)
      .where(inArray(websites.id, uniqueWebsiteIds))

    if (existing.length !== uniqueWebsiteIds.length) {
      throw new Error("存在无效的网站 ID")
    }
  }

  await db.delete(collectionItems).where(eq(collectionItems.collectionId, collectionId))

  const now = new Date().toISOString()

  if (normalized.length) {
    await db.insert(collectionItems).values(
      normalized.map((item) => ({
        id: crypto.randomUUID(),
        collectionId,
        websiteId: item.websiteId,
        note: item.note,
        position: item.position,
        createdAt: now,
      }))
    )
  }

  await db
    .update(collections)
    .set({ updatedAt: now })
    .where(eq(collections.id, collectionId))

  await recordAuditLog(db, {
    actorId,
    action: "collection.items.replace",
    entityId: collectionId,
    changes: { count: normalized.length },
  })
}

type NormalizedItem = {
  websiteId: string
  note: string | null
  position: number
}

function normalizeItemsInput(items: CollectionItemInput[]): NormalizedItem[] {
  const map = new Map<string, NormalizedItem>()

  items.forEach((item, index) => {
    const websiteId = item.websiteId?.trim()
    if (!websiteId) return
    if (map.has(websiteId)) return

    const note = item.note === undefined ? null : item.note === null ? null : item.note.trim() || null
    const position = typeof item.position === "number" ? item.position : index

    map.set(websiteId, {
      websiteId,
      note,
      position,
    })
  })

  return Array.from(map.values())
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({
      websiteId: item.websiteId,
      note: item.note,
      position: index,
    }))
}

async function recordAuditLog(
  db: ReturnType<typeof getD1Db>,
  payload: { actorId?: string | null; action: string; entityId: string; changes: unknown }
) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: payload.actorId || "system",
      action: payload.action,
      entityType: "collection",
      entityId: payload.entityId,
      changes: payload.changes ? JSON.stringify(payload.changes) : null,
      createdAt: new Date().toISOString(),
    })
  } catch {
    // Silently fail for audit log
  }
}

function normalizeNullable(value?: string | null): string | null {
  if (value === undefined) return null
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}
