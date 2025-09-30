import type { WebsiteCardData } from "../types/website"
import type { WebsiteDTO } from "@/lib/validations/websites"

const VALID_AD_TYPES: WebsiteCardData["adType"][] = [
  "banner",
  "sponsored",
  "featured",
  "premium",
]

export interface WebsiteListMetaDefaults {
  page: number
  pageSize: number
  total: number
}

export interface WebsiteListMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

export function mapWebsiteDtoToCard(dto: WebsiteDTO): WebsiteCardData {
  const adType =
    typeof dto.adType === "string" && (VALID_AD_TYPES as string[]).includes(dto.adType)
      ? (dto.adType as WebsiteCardData["adType"])
      : undefined

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    url: dto.url,
    favicon_url: dto.favicon_url || undefined,
    image_url: dto.screenshot_url || undefined,
    tags: Array.isArray(dto.tags) ? dto.tags : [],
    category: dto.category,
    isAd: dto.isAd,
    adType,
    rating: dto.rating,
    visit_count: dto.visit_count,
    is_featured: dto.is_featured,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  }
}

export function normalizeWebsiteListMeta(
  meta: unknown,
  defaults: WebsiteListMetaDefaults
): WebsiteListMeta {
  const record = (typeof meta === "object" && meta !== null ? meta : {}) as Record<string, unknown>

  const rawPage = typeof record.page === "number" ? record.page : defaults.page
  const rawPageSize = typeof record.per_page === "number" ? record.per_page : defaults.pageSize
  const rawTotal = typeof record.total === "number" ? record.total : defaults.total
  const rawTotalPages = typeof record.total_pages === "number"
    ? record.total_pages
    : rawPageSize > 0
      ? Math.ceil(Math.max(rawTotal, 0) / rawPageSize)
      : 0
  const hasMore = typeof record.has_more === "boolean"
    ? record.has_more
    : rawTotalPages > 0 && rawPage < rawTotalPages

  return {
    page: Math.max(rawPage, 1),
    pageSize: rawPageSize > 0 ? rawPageSize : defaults.pageSize,
    total: Math.max(rawTotal, 0),
    totalPages: Math.max(rawTotalPages, 0),
    hasMore,
  }
}

export function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const record = payload as Record<string, unknown>

  if (typeof record.message === "string") return record.message
  if (typeof record.error === "string") return record.error

  if (record.errors && typeof record.errors === "object") {
    const errors = record.errors as Record<string, unknown>
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0]
      }
    }
  }

  return null
}
