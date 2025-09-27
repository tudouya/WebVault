import { NextResponse } from "next/server"

import { collectionItemsReplaceSchema } from "@/features/collections/schemas"
import type { CollectionItemInput } from "@/features/collections/types"
import { collectionsService } from "@/lib/services/collectionsService"
import { ZodError } from "zod"

export const runtime = "edge"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let contextId: string | undefined
  try {
    const resolved = await params
    contextId = resolved.id
    const body = await request.json()
    const parsed = collectionItemsReplaceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "收藏集网站列表校验失败",
          timestamp: new Date().toISOString(),
          errors: formatZodErrors(parsed.error),
        },
        { status: 422 }
      )
    }

    const payload = parsed.data
    const items: CollectionItemInput[] = payload.items.map((item) => ({
      websiteId: item.websiteId,
      note: item.note ?? undefined,
      position: item.position,
    }))

    const updated = await collectionsService.replaceItems(resolved.id, items)

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "未找到对应的收藏集",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      )
    }

    if (isInvalidWebsiteError(error)) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "存在无效的网站 ID",
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    console.error(`PUT /api/admin/collections/${contextId ?? "unknown"}/items`, error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "更新收藏集网站列表失败",
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

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && /不存在/.test(error.message)
}

function isInvalidWebsiteError(error: unknown): boolean {
  return error instanceof Error && /无效的网站 ID/.test(error.message)
}
