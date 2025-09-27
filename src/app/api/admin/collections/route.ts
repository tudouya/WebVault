import { NextResponse } from "next/server"

import { collectionCreateSchema, collectionQuerySchema } from "@/features/collections/schemas"
import type { CollectionCreateInput, CollectionListParams } from "@/features/collections/types"
import { collectionsService } from "@/lib/services/collectionsService"
import { ZodError } from "zod"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = Object.fromEntries(searchParams.entries())

  try {
    const parsed = collectionQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "查询参数校验失败",
          timestamp: new Date().toISOString(),
          errors: formatZodErrors(parsed.error),
        },
        { status: 422 }
      )
    }

    const query = parsed.data
    const params: CollectionListParams = {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      featured: query.featured,
      orderBy: query.orderBy,
    }

    const result = await collectionsService.list(params)

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        hasMore: result.hasMore,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/collections", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取收藏集列表失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = collectionCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "收藏集字段校验失败",
          timestamp: new Date().toISOString(),
          errors: formatZodErrors(parsed.error),
        },
        { status: 422 }
      )
    }

    const payload = parsed.data
    const input: CollectionCreateInput = {
      name: payload.name.trim(),
      slug: payload.slug ?? undefined,
      description: payload.description ?? undefined,
      coverImage: payload.coverImage ?? undefined,
      isFeatured: payload.isFeatured ?? false,
      displayOrder: payload.displayOrder,
      items: payload.items?.map((item) => ({
        websiteId: item.websiteId,
        note: item.note ?? undefined,
        position: item.position,
      })),
    }

    const created = await collectionsService.create(input)

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
    console.error("POST /api/admin/collections", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "创建收藏集失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : "root"
    if (!fieldErrors[key]) {
      fieldErrors[key] = []
    }
    fieldErrors[key].push(issue.message)
  }
  return fieldErrors
}

