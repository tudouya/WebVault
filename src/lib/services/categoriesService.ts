import { and, eq, like, ne, sql, type SQL } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"

import { categories } from "@/lib/db/schema/categories"
import { websites } from "@/lib/db/schema/websites"
import { getD1Db } from "@/lib/db/adapters/d1"

import type { CategoryNode, CategoryStatsSummary, CategoryStatus } from "@/features/categories/types"

import { generateCategorySlug } from "@/features/categories/utils/slug"
import { getRequestContext } from "@cloudflare/next-on-pages"
import type { CloudflareEnv } from "@/types/env"

export type CategoryListParams = {
  search?: string
  status?: CategoryStatus | "all"
  countStatus?: "published" | "all"
}

export interface CategoryListResponse {
  tree: CategoryNode[]
  stats: CategoryStatsSummary
}

export interface CategoryCreateInput {
  name: string
  slug?: string
  description?: string
  parentId?: string | null
  displayOrder?: number
  icon?: string
  status?: CategoryStatus
}

export interface CategoryUpdateInput {
  name?: string
  slug?: string
  description?: string | null
  parentId?: string | null
  displayOrder?: number
  icon?: string | null
  status?: CategoryStatus
}

/**
 * 递归获取指定分类及其所有子分类的ID列表
 * @param categoryId - 父分类ID
 * @returns 包含父分类及所有子分类的ID数组
 */
export async function getAllSubcategoryIds(categoryId: string): Promise<string[]> {
  const db = getD1Db()
  const allIds = [categoryId]

  const getChildren = async (parentId: string) => {
    const children = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, parentId))

    for (const child of children) {
      allIds.push(child.id)
      await getChildren(child.id)
    }
  }

  await getChildren(categoryId)
  return allIds
}

export const categoriesService = {
  async list(params: CategoryListParams = {}): Promise<CategoryListResponse> {
    try {
      await ensureStatusColumn()
      const db = getD1Db()
      const filters: SQL[] = []
      const countStatus = params.countStatus ?? "published"

      if (params.search) {
        const query = `%${params.search.trim()}%`
        filters.push(like(categories.name, query))
      }

      if (params.status && params.status !== "all") {
        filters.push(eq(categories.status, params.status))
      }

      const where = filters.length ? and(...filters) : undefined

      const rows = await db.select().from(categories).where(where)

      // 计算每个分类的网站数量
      const websiteCountConditions: SQL[] = []
      if (countStatus === "published") {
        websiteCountConditions.push(eq(websites.status, "published"))
      }

      const websiteCounts = await db
        .select({
          categoryId: websites.categoryId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(websites)
        .where(websiteCountConditions.length ? and(...websiteCountConditions) : undefined)
        .groupBy(websites.categoryId)

      const countMap = new Map<string, number>()
      websiteCounts.forEach((item) => {
        if (item.categoryId) {
          countMap.set(item.categoryId, item.count)
        }
      })

      const tree = buildTree(rows, countMap)
      const stats = calculateStats(rows)

      return { tree, stats }
    } catch (error) {
      throw error instanceof Error ? error : new Error("Failed to load categories")
    }
  },

  async create(input: CategoryCreateInput): Promise<CategoryNode> {
    await ensureStatusColumn()
    const db = getD1Db()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const status = normalizeStatus(input.status)
    const slug = await ensureUniqueSlug(db, input.slug || generateCategorySlug(input.name))

    await db.insert(categories).values({
      id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      parentId: input.parentId ?? null,
      displayOrder: input.displayOrder ?? 0,
      icon: input.icon?.trim() || null,
      isActive: status === "active",
      status,
      createdAt: now,
      updatedAt: now,
    })

    const inserted = await db.select().from(categories).where(eq(categories.id, id)).get()
    if (!inserted) {
      throw new Error("Category creation failed")
    }
    return mapRow(inserted)
  },

  async update(id: string, input: CategoryUpdateInput): Promise<CategoryNode> {
    await ensureStatusColumn()
    const db = getD1Db()

    const existing = await db.select().from(categories).where(eq(categories.id, id)).get()
    if (!existing) {
      throw new Error("未找到分类")
    }

    const nextStatus = input.status ? normalizeStatus(input.status) : normalizeStatus(existing.status)
    const nextSlug = input.slug
      ? await ensureUniqueSlug(db, input.slug, id)
      : existing.slug

    const parentId = input.parentId !== undefined ? input.parentId : existing.parentId ?? null

    await db
      .update(categories)
      .set({
        name: input.name?.trim() ?? existing.name,
        slug: nextSlug,
        description: input.description !== undefined ? input.description?.trim() || null : existing.description,
        parentId,
        displayOrder: input.displayOrder ?? existing.displayOrder ?? 0,
        icon: input.icon !== undefined ? input.icon?.trim() || null : existing.icon,
        isActive: nextStatus === "active",
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))

    const updated = await db.select().from(categories).where(eq(categories.id, id)).get()
    if (!updated) {
      throw new Error("分类更新失败")
    }
    return mapRow(updated)
  },

  async remove(id: string): Promise<void> {
    await ensureStatusColumn()
    const db = getD1Db()

    const hasChildren = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).get()
    if (hasChildren) {
      throw new Error("存在子分类，无法删除。请先移动或删除其子分类。")
    }

    await db.delete(categories).where(eq(categories.id, id))
  },
}

type CategoryRow = InferSelectModel<typeof categories>

async function ensureStatusColumn() {
  try {
    const env = getRequestContext().env as CloudflareEnv | undefined
    const d1 = env?.DB
    if (!d1?.prepare) return

    const pragma = await d1.prepare("PRAGMA table_info('categories')").all()
    const columns = Array.isArray(pragma.results)
      ? (pragma.results as Array<{ name?: string | null }>)
      : []
    const hasStatusColumn = columns.some((column) => column?.name === "status")

    if (!hasStatusColumn) {
      await d1.prepare("ALTER TABLE categories ADD COLUMN status TEXT DEFAULT 'active' NOT NULL").run()
      await d1
        .prepare(
          "UPDATE categories SET status = CASE WHEN COALESCE(is_active, 0) = 1 THEN 'active' ELSE 'inactive' END"
        )
        .run()
    }
  } catch {
    // Silently fail if column already exists
  }
}

function buildTree(rows: CategoryRow[], countMap: Map<string, number>): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  const roots: CategoryNode[] = []

  rows.forEach((row) => {
    map.set(row.id, mapRow(row, countMap.get(row.id) || 0))
  })

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    nodes.forEach((child) => child.children && sortNodes(child.children))
  }

  const aggregateCounts = (node: CategoryNode): number => {
    const direct = node.directWebsiteCount ?? node.websiteCount ?? 0
    const children = node.children ?? []
    const childrenTotal = children.reduce((sum, child) => sum + aggregateCounts(child), 0)
    const total = direct + childrenTotal
    node.websiteCount = total
    return total
  }

  sortNodes(roots)
  roots.forEach(aggregateCounts)
  return roots
}

function mapRow(row: CategoryRow, websiteCount: number = 0): CategoryNode {
  const status = normalizeStatus(row.status)
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    parentId: row.parentId ?? null,
    icon: row.icon ?? undefined,
    displayOrder: row.displayOrder ?? 0,
    status,
    color: undefined,
    directWebsiteCount: websiteCount,
    websiteCount,
    children: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function calculateStats(rows: CategoryRow[]): CategoryStatsSummary {
  const topLevel = rows.filter((row) => !row.parentId).length
  const active = rows.filter((row) => normalizeStatus(row.status) === "active").length
  const hidden = rows.filter((row) => {
    const status = normalizeStatus(row.status)
    return status === "hidden" || status === "inactive"
  }).length

  return {
    total: rows.length,
    active,
    topLevel,
    hidden,
  }
}

function normalizeStatus(status: string | null | undefined): CategoryStatus {
  if (status === "inactive" || status === "hidden" || status === "active") {
    return status
  }
  return "active"
}

async function ensureUniqueSlug(db: ReturnType<typeof getD1Db>, desiredSlug: string, excludeId?: string): Promise<string> {
  const base = generateCategorySlug(desiredSlug) || crypto.randomUUID()
  let candidate = base
  let counter = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        excludeId
          ? and(eq(categories.slug, candidate), ne(categories.id, excludeId))
          : eq(categories.slug, candidate)
      )
      .get()

    if (!existing) {
      return candidate
    }

    candidate = `${base}-${counter}`
    counter += 1
  }
}
