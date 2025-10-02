import { and, asc, desc, eq, exists, gte, inArray, ne, sql, type InferSelectModel, type SQL } from "drizzle-orm"

import { getD1Db } from "@/lib/db/adapters/d1"
import { auditLogs } from "@/lib/db/schema/audit-logs"
import { categories } from "@/lib/db/schema/categories"
import { collectionItems } from "@/lib/db/schema/collection-items"
import { collections } from "@/lib/db/schema/collections"
import { submissionRequests } from "@/lib/db/schema/submission-requests"
import { tags } from "@/lib/db/schema/tags"
import { websiteTags } from "@/lib/db/schema/website-tags"
import { websites } from "@/lib/db/schema/websites"

import {
  type WebsiteAdminDetail,
  type WebsiteAdminListItem,
  type WebsiteAdminListParams,
  type WebsiteAdminListResult,
  type WebsiteTagSummary,
} from "@/features/websites/types/admin"
import {
  type WebsiteAdminCreateInput,
  type WebsiteAdminUpdateInput,
  type WebsiteStatusUpdateInput,
} from "@/features/websites/schemas"
import type { WebsiteStatus, AdType } from "@/features/websites/types"
import { generateWebsiteSlug } from "@/features/websites/utils"
import { tagsService } from "@/lib/services/tagsService"

type WebsiteRow = InferSelectModel<typeof websites>

interface WebsiteJoinedRow extends WebsiteRow {
  categoryName: string | null
  categorySlug: string | null
  faviconUrl: string | null
  screenshotUrl: string | null
}

interface MutationOptions {
  actorId?: string
}

export const websitesAdminService = {
  async list(params: WebsiteAdminListParams = {}): Promise<WebsiteAdminListResult> {
    const db = getD1Db()

    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.max(1, Math.min(params.pageSize ?? 20, 100))
    const offset = (page - 1) * pageSize

    const filters: SQL[] = []

    if (params.search?.trim()) {
      const keyword = `%${escapeLike(params.search.trim())}%`
      filters.push(
        sql`(${websites.title} LIKE ${keyword} OR coalesce(${websites.description}, '') LIKE ${keyword} OR ${websites.url} LIKE ${keyword})`
      )
    }

    if (params.status && params.status !== "all") {
      filters.push(eq(websites.status, params.status))
    }

    if (params.categoryId) {
      filters.push(eq(websites.categoryId, params.categoryId))
    }

    if (params.isFeatured !== undefined) {
      filters.push(eq(websites.isFeatured, params.isFeatured))
    }

    if (params.isAd !== undefined) {
      filters.push(eq(websites.isAd, params.isAd))
    }

    if (params.includeAds === false) {
      filters.push(eq(websites.isAd, false))
    }

    if (params.adType && params.adType !== "all") {
      filters.push(eq(websites.adType, params.adType))
    }

    if (typeof params.minRating === "number") {
      filters.push(gte(websites.rating, params.minRating))
    }

    if (params.submittedBy?.trim()) {
      filters.push(eq(websites.submittedBy, params.submittedBy.trim()))
    }

    if (params.tagId) {
      filters.push(
        exists(
          db
            .select({ id: websiteTags.tagId })
            .from(websiteTags)
            .where(and(eq(websiteTags.websiteId, websites.id), eq(websiteTags.tagId, params.tagId)))
        )
      )
    }

    const where = filters.length ? and(...filters) : undefined

    const orderBy = resolveOrder(params.orderBy, params.sortDir)

    const listQuery = db
      .select({
        id: websites.id,
        title: websites.title,
        slug: websites.slug,
        url: websites.url,
        description: websites.description,
        categoryId: websites.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        isAd: websites.isAd,
        adType: websites.adType,
        rating: websites.rating,
        visitCount: websites.visitCount,
        isFeatured: websites.isFeatured,
        status: websites.status,
        submittedBy: websites.submittedBy,
        notes: websites.notes,
        faviconUrl: websites.faviconUrl,
        screenshotUrl: websites.screenshotUrl,
        createdAt: websites.createdAt,
        updatedAt: websites.updatedAt,
      })
      .from(websites)
      .leftJoin(categories, eq(websites.categoryId, categories.id))
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset)

    const rows = await (where ? listQuery.where(where) : listQuery)

    const countQuery = db.select({ value: sql<number>`count(*)` }).from(websites)
    const totalRow = await (where ? countQuery.where(where) : countQuery).get()
    const total = Number(totalRow?.value ?? 0)

    const tagMap = await loadTagSummaries(db, rows.map((row) => row.id))

    const items = rows.map((row) => mapToListItem(row, tagMap.get(row.id) ?? []))
    const hasMore = page * pageSize < total

    return {
      items,
      page,
      pageSize,
      total,
      hasMore,
    }
  },

  async getById(id: string): Promise<WebsiteAdminDetail | null> {
    if (!id) return null

    const db = getD1Db()
    const row = await db
      .select({
        id: websites.id,
        title: websites.title,
        slug: websites.slug,
        url: websites.url,
        description: websites.description,
        categoryId: websites.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        isAd: websites.isAd,
        adType: websites.adType,
        rating: websites.rating,
        visitCount: websites.visitCount,
        isFeatured: websites.isFeatured,
        status: websites.status,
        submittedBy: websites.submittedBy,
        notes: websites.notes,
        faviconUrl: websites.faviconUrl,
        screenshotUrl: websites.screenshotUrl,
        createdAt: websites.createdAt,
        updatedAt: websites.updatedAt,
      })
      .from(websites)
      .leftJoin(categories, eq(websites.categoryId, categories.id))
      .where(eq(websites.id, id))
      .get()

    if (!row) return null

    const [tagsForWebsite, collectionsForWebsite, submission] = await Promise.all([
      loadTagSummaries(db, [id]).then((map) => map.get(id) ?? []),
      loadCollections(db, id),
      loadLatestSubmission(db, id),
    ])

    return {
      ...mapToListItem(row, tagsForWebsite),
      faviconUrl: row.faviconUrl ?? null,
      screenshotUrl: row.screenshotUrl ?? null,
      collections: collectionsForWebsite,
      submissionId: submission?.id ?? null,
      submissionPayload: submission?.payload ?? null,
    }
  },

  async create(input: WebsiteAdminCreateInput, options: MutationOptions = {}): Promise<WebsiteAdminDetail> {
    const db = getD1Db()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const categoryId = await resolveCategory(db, input.categoryId)
    const slug = await ensureUniqueSlug(db, input.slug ?? generateWebsiteSlug(input.title))

    await db.insert(websites).values({
      id,
      title: input.title.trim(),
      description: normalizeNullable(input.description),
      url: input.url.trim(),
      slug,
      faviconUrl: normalizeNullable(input.faviconUrl),
      screenshotUrl: normalizeNullable(input.screenshotUrl),
      categoryId,
      isAd: Boolean(input.isAd),
      adType: input.isAd ? input.adType ?? null : null,
      rating: input.rating ?? null,
      visitCount: input.visitCount ?? 0,
      isFeatured: Boolean(input.isFeatured),
      status: normalizeStatus(input.status),
      notes: normalizeNullable(input.notes),
      submittedBy: normalizeNullable(input.submittedBy),
      createdAt: now,
      updatedAt: now,
    })

    if (input.tagIds?.length) {
      await tagsService.updateWebsiteTags(id, input.tagIds)
    }

    await updateWebsiteCollections(db, id, input.collectionIds ?? [])

    if (input.submissionId) {
      await linkSubmission(db, input.submissionId, id, options.actorId)
    }

    await recordAuditLog(db, {
      actorId: options.actorId,
      action: "website.create",
      entityId: id,
      changes: { title: input.title, url: input.url },
    })

    const detail = await this.getById(id)
    if (!detail) {
      throw new Error("网站创建失败")
    }
    return detail
  },

  async update(id: string, input: WebsiteAdminUpdateInput, options: MutationOptions = {}): Promise<WebsiteAdminDetail> {
    const db = getD1Db()
    const existing = await db.select().from(websites).where(eq(websites.id, id)).get()
    if (!existing) {
      throw new Error("未找到网站")
    }

    const now = new Date().toISOString()

    const payload: Partial<WebsiteRow> = {}

    if (input.title !== undefined) {
      payload.title = input.title.trim()
    }

    if (input.description !== undefined) {
      payload.description = normalizeNullable(input.description)
    }

    if (input.url !== undefined) {
      payload.url = input.url.trim()
    }

    if (input.slug !== undefined) {
      const desiredSlug = input.slug ?? generateWebsiteSlug(input.title ?? existing.title)
      payload.slug = await ensureUniqueSlug(db, desiredSlug, id)
    }

    if (input.categoryId !== undefined) {
      payload.categoryId = await resolveCategory(db, input.categoryId)
    }

    if (input.isAd !== undefined) {
      payload.isAd = Boolean(input.isAd)
      payload.adType = input.isAd ? input.adType ?? existing.adType ?? null : null
    } else if (input.adType !== undefined) {
      payload.adType = input.adType ?? null
    }

    if (input.rating !== undefined) {
      payload.rating = input.rating ?? null
    }

    if (input.visitCount !== undefined) {
      payload.visitCount = input.visitCount ?? existing.visitCount ?? 0
    }

    if (input.isFeatured !== undefined) {
      payload.isFeatured = Boolean(input.isFeatured)
    }

    if (input.status !== undefined) {
      payload.status = normalizeStatus(input.status)
    }

    if (input.faviconUrl !== undefined) {
      payload.faviconUrl = normalizeNullable(input.faviconUrl)
    }

    if (input.screenshotUrl !== undefined) {
      payload.screenshotUrl = normalizeNullable(input.screenshotUrl)
    }

    if (input.notes !== undefined) {
      payload.notes = normalizeNullable(input.notes)
    }

    if (input.submittedBy !== undefined) {
      payload.submittedBy = normalizeNullable(input.submittedBy)
    }

    payload.updatedAt = now

    await db.update(websites).set(payload).where(eq(websites.id, id))

    if (input.tagIds !== undefined) {
      await tagsService.updateWebsiteTags(id, input.tagIds ?? [])
    }

    if (input.collectionIds !== undefined) {
      await updateWebsiteCollections(db, id, input.collectionIds ?? [])
    }

    if (input.submissionId) {
      await linkSubmission(db, input.submissionId, id, options.actorId)
    }

    await recordAuditLog(db, {
      actorId: options.actorId,
      action: "website.update",
      entityId: id,
      changes: input,
    })

    const detail = await this.getById(id)
    if (!detail) {
      throw new Error("网站更新失败")
    }
    return detail
  },

  async updateStatus(id: string, input: WebsiteStatusUpdateInput, options: MutationOptions = {}) {
    const db = getD1Db()
    const existing = await db.select().from(websites).where(eq(websites.id, id)).get()
    if (!existing) {
      throw new Error("未找到网站")
    }

    const payload: Partial<WebsiteRow> = {}

    if (input.status !== undefined) {
      payload.status = normalizeStatus(input.status)
    }

    if (input.isFeatured !== undefined) {
      payload.isFeatured = Boolean(input.isFeatured)
    }

    if (input.notes !== undefined) {
      payload.notes = normalizeNullable(input.notes)
    }

    if (!Object.keys(payload).length) {
      return
    }

    payload.updatedAt = new Date().toISOString()

    await db.update(websites).set(payload).where(eq(websites.id, id))

    await recordAuditLog(db, {
      actorId: options.actorId,
      action: "website.updateStatus",
      entityId: id,
      changes: input,
    })
  },

  async remove(id: string, options: MutationOptions = {}) {
    const db = getD1Db()
    const existing = await db.select({ id: websites.id }).from(websites).where(eq(websites.id, id)).get()
    if (!existing) {
      throw new Error("未找到网站")
    }

    await db.delete(websites).where(eq(websites.id, id))

    await recordAuditLog(db, {
      actorId: options.actorId,
      action: "website.delete",
      entityId: id,
      changes: null,
    })
  },
}

function resolveOrder(
  orderBy: WebsiteAdminListParams["orderBy"],
  sortDir: WebsiteAdminListParams["sortDir"]
): SQL<unknown>[] {
  const direction = sortDir === "asc" ? asc : desc

  switch (orderBy) {
    case "title":
      return [direction(websites.title)]
    case "visits":
      return [direction(websites.visitCount), desc(websites.updatedAt)]
    case "rating":
      return [direction(websites.rating), desc(websites.updatedAt)]
    case "updated":
      return [direction(websites.updatedAt), desc(websites.createdAt)]
    case "recent":
    default:
      return [desc(websites.createdAt), desc(websites.updatedAt)]
  }
}

async function resolveCategory(db: ReturnType<typeof getD1Db>, categoryId?: string | null) {
  if (!categoryId) return null
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).get()
  if (!existing) {
    throw new Error("指定的分类不存在")
  }
  return categoryId
}

async function ensureUniqueSlug(
  db: ReturnType<typeof getD1Db>,
  desiredSlug: string | undefined,
  excludeId?: string
): Promise<string | null> {
  if (!desiredSlug) {
    return null
  }

  const base = generateWebsiteSlug(desiredSlug) || crypto.randomUUID()
  let candidate = base
  let counter = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db
      .select({ id: websites.id })
      .from(websites)
      .where(excludeId ? and(eq(websites.slug, candidate), ne(websites.id, excludeId)) : eq(websites.slug, candidate))
      .get()

    if (!existing) {
      return candidate
    }

    candidate = `${base}-${counter}`
    counter += 1
  }
}

async function loadTagSummaries(
  db: ReturnType<typeof getD1Db>,
  websiteIds: string[]
): Promise<Map<string, WebsiteTagSummary[]>> {
  const map = new Map<string, WebsiteTagSummary[]>()
  if (!websiteIds.length) return map

  const rows = await db
    .select({
      websiteId: websiteTags.websiteId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(websiteTags)
    .innerJoin(tags, eq(tags.id, websiteTags.tagId))
    .where(inArray(websiteTags.websiteId, websiteIds))

  for (const row of rows) {
    const list = map.get(row.websiteId) ?? []
    list.push({ id: row.id, name: row.name, slug: row.slug ?? undefined })
    map.set(row.websiteId, list)
  }

  return map
}

async function loadCollections(db: ReturnType<typeof getD1Db>, websiteId: string) {
  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      position: collectionItems.position,
    })
    .from(collectionItems)
    .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
    .where(eq(collectionItems.websiteId, websiteId))
    .orderBy(asc(collectionItems.position), asc(collections.name))

  return rows.map((row) => ({ id: row.id, name: row.name, position: row.position ?? undefined }))
}

async function updateWebsiteCollections(
  db: ReturnType<typeof getD1Db>,
  websiteId: string,
  collectionIds: string[]
) {
  const uniqueIds = Array.from(new Set(collectionIds.filter((id) => id && id.trim().length)))

  if (!uniqueIds.length) {
    await db.delete(collectionItems).where(eq(collectionItems.websiteId, websiteId))
    return
  }

  const existingCollections = await db
    .select({ id: collections.id })
    .from(collections)
    .where(inArray(collections.id, uniqueIds))

  if (existingCollections.length !== uniqueIds.length) {
    throw new Error("存在无效的收藏集 ID")
  }

  await db.delete(collectionItems).where(eq(collectionItems.websiteId, websiteId))

  const now = new Date().toISOString()

  await db.insert(collectionItems).values(
    uniqueIds.map((collectionId, index) => ({
      id: crypto.randomUUID(),
      collectionId,
      websiteId,
      note: null,
      position: index,
      createdAt: now,
    }))
  )

  await db
    .update(collections)
    .set({ updatedAt: now })
    .where(inArray(collections.id, uniqueIds))
}

async function loadLatestSubmission(db: ReturnType<typeof getD1Db>, websiteId: string) {
  const submission = await db
    .select({
      id: submissionRequests.id,
      payload: submissionRequests.payload,
    })
    .from(submissionRequests)
    .where(eq(submissionRequests.websiteId, websiteId))
    .orderBy(desc(sql`coalesce(${submissionRequests.reviewedAt}, ${submissionRequests.createdAt})`))
    .limit(1)
    .get()

  if (!submission) return null

  return {
    id: submission.id,
    payload: parseJson(submission.payload),
  }
}

async function linkSubmission(
  db: ReturnType<typeof getD1Db>,
  submissionId: string,
  websiteId: string,
  actorId?: string
) {
  const submission = await db
    .select({ id: submissionRequests.id })
    .from(submissionRequests)
    .where(eq(submissionRequests.id, submissionId))
    .get()

  if (!submission) {
    throw new Error("指定的提交流程不存在")
  }

  await db
    .update(submissionRequests)
    .set({
      websiteId,
      status: "approved",
      reviewedBy: actorId ?? "system",
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(submissionRequests.id, submissionId))
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
      entityType: "website",
      entityId: payload.entityId,
      changes: payload.changes ? JSON.stringify(payload.changes) : null,
      createdAt: new Date().toISOString(),
    })
  } catch {
    // Silently fail for audit log
  }
}

function mapToListItem(row: WebsiteJoinedRow, tagsSummary: WebsiteTagSummary[]): WebsiteAdminListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug ?? null,
    url: row.url,
    description: row.description ?? null,
    category: row.categoryId
      ? {
          id: row.categoryId,
          name: row.categoryName ?? "",
          slug: row.categorySlug ?? undefined,
        }
      : null,
    tags: tagsSummary,
    isAd: coerceBool(row.isAd),
    adType: normalizeAdType(row.adType),
    rating: typeof row.rating === "number" ? row.rating : null,
    visitCount: typeof row.visitCount === "number" ? row.visitCount : 0,
    isFeatured: coerceBool(row.isFeatured),
    status: normalizeStatus(row.status),
    submittedBy: row.submittedBy ?? null,
    notes: row.notes ?? null,
    faviconUrl: row.faviconUrl ?? null,
    screenshotUrl: row.screenshotUrl ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function normalizeStatus(status?: string | null): WebsiteStatus {
  if (status === "draft" || status === "published") {
    return status
  }
  return "draft"
}

function normalizeAdType(value?: string | null): AdType | null {
  if (!value) return null
  const allowed: readonly AdType[] = ["banner", "sponsored", "featured", "premium"]
  if (allowed.includes(value as AdType)) {
    return value as AdType
  }
  return null
}

function normalizeNullable(value?: string | null): string | null {
  if (value === undefined) {
    return null
  }
  if (value === null) return null
  const trimmed = value.trim()
  if (!trimmed.length) return null
  return trimmed
}

function coerceBool(value: unknown, defaultValue = false): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.toLowerCase()
    if (["true", "1", "yes", "on"].includes(normalized)) return true
    if (["false", "0", "no", "off"].includes(normalized)) return false
  }
  return defaultValue
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

function parseJson(value?: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
