import { NextResponse } from "next/server"
import { ZodError } from "zod"

import {
  websiteAdminCreateSchema,
} from "@/features/websites/schemas"
import type { WebsiteAdminListParams } from "@/features/websites/types/admin"
import { WEBSITE_REVIEW_STATUSES } from "@/features/websites/types/admin"
import type { WebsiteStatus } from "@/features/websites/types"
import { websitesAdminService } from "@/lib/services/websitesAdminService"

export const runtime = "edge"

export async function GET(request: Request) {
  const params = parseListParams(request.url)

  try {
    const result = await websitesAdminService.list(params)
    const meta = buildMeta(result.page, result.pageSize, result.total)

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: result.items,
      meta,
      filters: params,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/websites", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取网站列表失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = websiteAdminCreateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "网站字段校验失败",
          errors: formatZodErrors(parsed.error),
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    const created = await websitesAdminService.create(parsed.data)

    return NextResponse.json(
      {
        code: 0,
        message: "created",
        data: created,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/admin/websites", error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "创建网站失败"),
        timestamp: new Date().toISOString(),
      },
      { status: resolveStatus(error) }
    )
  }
}

function buildMeta(page: number, perPage: number, total: number) {
  const totalPages = Math.ceil(total / perPage) || 1
  return {
    page,
    per_page: perPage,
    total,
    total_pages: totalPages,
    has_more: page < totalPages,
  }
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const pathKey = issue.path[0] ? String(issue.path[0]) : "root"
    if (!fieldErrors[pathKey]) {
      fieldErrors[pathKey] = []
    }
    fieldErrors[pathKey].push(issue.message)
  }
  return fieldErrors
}

function parseListParams(url: string): WebsiteAdminListParams {
  const { searchParams } = new URL(url)

  const status = parseStatus(searchParams.get("status"))
  const reviewStatus = parseReviewStatus(searchParams.get("reviewStatus"))

  const result: WebsiteAdminListParams = {
    search: normalize(searchParams.get("search")),
    status,
    reviewStatus,
    categoryId: normalize(searchParams.get("categoryId")),
    tagId: normalize(searchParams.get("tagId")),
    isFeatured: parseBoolean(searchParams.get("isFeatured")),
    isPublic: parseBoolean(searchParams.get("isPublic")),
    isAd: parseBoolean(searchParams.get("isAd")),
    includeAds: parseBoolean(searchParams.get("includeAds")),
    adType: normalize(searchParams.get("adType")) as WebsiteAdminListParams["adType"],
    minRating: parseNumber(searchParams.get("minRating")),
    submittedBy: normalize(searchParams.get("submittedBy")),
    orderBy: parseOrderBy(searchParams.get("orderBy")),
    sortDir: parseSortDir(searchParams.get("sortDir")),
    page: parseNumber(searchParams.get("page"), 1) ?? 1,
    pageSize: parseNumber(searchParams.get("perPage"), 20) ?? 20,
  }

  return result
}

function parseStatus(value: string | null): WebsiteStatus | "all" {
  if (!value) return "all"
  const normalized = value.trim().toLowerCase()
  if (["active", "inactive", "pending", "rejected"].includes(normalized)) {
    return normalized as WebsiteStatus
  }
  return "all"
}

function parseReviewStatus(value: string | null): WebsiteAdminListParams["reviewStatus"] {
  if (!value) return "all"
  const normalized = value.trim().toLowerCase()
  return WEBSITE_REVIEW_STATUSES.includes(normalized as (typeof WEBSITE_REVIEW_STATUSES)[number])
    ? (normalized as WebsiteAdminListParams["reviewStatus"])
    : "all"
}

function parseBoolean(value: string | null): boolean | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (["true", "1", "yes", "on"].includes(normalized)) return true
  if (["false", "0", "no", "off"].includes(normalized)) return false
  return undefined
}

function parseNumber(value: string | null, fallback?: number): number | undefined {
  if (!value || value === "") return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

function parseOrderBy(value: string | null): WebsiteAdminListParams["orderBy"] {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (["recent", "updated", "title", "visits", "rating"].includes(normalized)) {
    return normalized as WebsiteAdminListParams["orderBy"]
  }
  return undefined
}

function parseSortDir(value: string | null): WebsiteAdminListParams["sortDir"] {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "asc" || normalized === "desc") {
    return normalized as WebsiteAdminListParams["sortDir"]
  }
  return undefined
}

function normalize(value: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function resolveStatus(error: unknown): number {
  if (error instanceof Error) {
    if (/未找到网站/.test(error.message)) {
      return 404
    }
    if (/分类不存在/.test(error.message)) {
      return 400
    }
    if (/slug|唯一|unique|constraint/i.test(error.message)) {
      return 409
    }
  }
  return 500
}

function resolveErrorCode(error: unknown): string {
  if (error instanceof Error) {
    if (/未找到网站/.test(error.message)) {
      return "not_found"
    }
    if (/分类不存在/.test(error.message)) {
      return "invalid_category"
    }
    if (/slug|唯一|unique|constraint/i.test(error.message)) {
      return "duplicate_resource"
    }
  }
  return "internal_error"
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/未找到网站/.test(error.message)) {
      return "未找到对应的网站"
    }
    if (/分类不存在/.test(error.message)) {
      return "指定的分类不存在"
    }
    if (/slug|唯一|unique|constraint/i.test(error.message)) {
      return "slug 已存在，无法创建"
    }
  }
  return fallback
}

