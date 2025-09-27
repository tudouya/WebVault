import { NextResponse } from "next/server"

import { collectionUpdateSchema } from "@/features/collections/schemas"
import type { CollectionUpdateInput } from "@/features/collections/types"
import { collectionsService } from "@/lib/services/collectionsService"
import { ZodError } from "zod"

export const runtime = "edge"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let contextId: string | undefined
  try {
    const resolved = await params
    contextId = resolved.id
    const detail = await collectionsService.getById(resolved.id)
    if (!detail) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "未找到对应的收藏集",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: detail,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`GET /api/admin/collections/${contextId ?? "unknown"}`, error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取收藏集详情失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let contextId: string | undefined
  try {
    const resolved = await params
    contextId = resolved.id
    const body = await request.json()
    const parsed = collectionUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "收藏集更新参数校验失败",
          timestamp: new Date().toISOString(),
          errors: formatZodErrors(parsed.error),
        },
        { status: 422 }
      )
    }

    const payload = parsed.data
    const input: CollectionUpdateInput = {
      name: payload.name?.trim(),
      slug: payload.slug ?? undefined,
      description: payload.description ?? undefined,
      coverImage: payload.coverImage ?? undefined,
      isFeatured: payload.isFeatured,
      displayOrder: payload.displayOrder,
    }

    const updated = await collectionsService.update(resolved.id, input)

    return NextResponse.json({
      code: 0,
      message: "updated",
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

    console.error(`PUT /api/admin/collections/${contextId ?? "unknown"}`, error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "更新收藏集失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let contextId: string | undefined
  try {
    const resolved = await params
    contextId = resolved.id
    await collectionsService.delete(resolved.id)
    return new NextResponse(null, { status: 204 })
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

    console.error(`DELETE /api/admin/collections/${contextId ?? "unknown"}`, error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "删除收藏集失败",
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
