import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { blogPostCreateSchema } from "@/features/blog/schemas"
import type { BlogPostListFilters, BlogPostStatus } from "@/features/blog/types"
import { BLOG_POST_STATUSES } from "@/features/blog/types"
import { blogPostsService } from "@/lib/services/blogPostsService"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const filters: BlogPostListFilters = {
    search: normalizeNullable(searchParams.get("search")),
    status: parseStatus(searchParams.get("status")),
    tag: normalizeNullable(searchParams.get("tag")),
    page: parseNumber(searchParams.get("page"), 1),
    pageSize: parseNumber(searchParams.get("perPage"), 10),
    orderBy: parseOrder(searchParams.get("orderBy")),
  }

  try {
    const result = await blogPostsService.list(filters)
    const meta = buildMeta(result.page, result.pageSize, result.total)

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: result.items,
      meta,
      filters,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/blog-posts", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取博客文章列表失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = blogPostCreateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "博客文章字段校验失败",
          errors: formatZodErrors(parsed.error),
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    const created = await blogPostsService.create(parsed.data)

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
    console.error("POST /api/admin/blog-posts", error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "创建博客文章失败"),
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

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

function parseStatus(value: string | null): BlogPostStatus | "all" {
  if (!value) return "all"
  const normalized = value.trim().toLowerCase()
  return BLOG_POST_STATUSES.includes(normalized as BlogPostStatus) ? (normalized as BlogPostStatus) : "all"
}

function parseOrder(value: string | null): BlogPostListFilters["orderBy"] {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "recent" || normalized === "oldest" || normalized === "title") {
    return normalized as BlogPostListFilters["orderBy"]
  }
  return undefined
}

function normalizeNullable(value: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function resolveStatus(error: unknown): number {
  if (error instanceof Error && /unique|constraint/i.test(error.message)) {
    return 409
  }
  return 500
}

function resolveErrorCode(error: unknown): string {
  if (error instanceof Error && /unique|constraint/i.test(error.message)) {
    return "duplicate_resource"
  }
  return "internal_error"
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && /unique|constraint/i.test(error.message)) {
    return "slug 已存在，无法重复创建"
  }
  return fallback
}

