import { NextResponse } from "next/server"

import { categoriesService, type CategoryUpdateInput } from "@/lib/services/categoriesService"
import { categoryUpdateSchema } from "@/features/categories/schemas"
import { ZodError } from "zod"

export const runtime = "edge"

export async function PUT(request: Request) {
  const id = extractCategoryId(request.url)

  if (!id) {
    return NextResponse.json(
      {
        code: "bad_request",
        message: "缺少分类 ID",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  try {
    const json = await request.json()
    const parsed = categoryUpdateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "分类字段校验失败",
          timestamp: new Date().toISOString(),
          errors: formatZodErrors(parsed.error),
        },
        { status: 422 }
      )
    }

    const data = parsed.data
    const payload: CategoryUpdateInput = {}

    if (data.name !== undefined) payload.name = data.name.trim()
    if (data.slug !== undefined) payload.slug = data.slug ?? undefined
    if (data.description !== undefined) payload.description = data.description ?? null
    if (data.parentId !== undefined) payload.parentId = data.parentId ?? null
    if (data.displayOrder !== undefined) payload.displayOrder = data.displayOrder
    if (data.icon !== undefined) payload.icon = data.icon ?? null
    if (data.status !== undefined) payload.status = data.status as CategoryUpdateInput["status"]

    const result = await categoriesService.update(id, payload)

    return NextResponse.json({
      code: 0,
      message: "updated",
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`PUT /api/admin/categories/${id}`, error)
    const message = error instanceof Error ? error.message : "更新分类失败"
    const status = message.includes("未找到分类") ? 404 : 500

    return NextResponse.json(
      {
        code: status === 404 ? "not_found" : "internal_error",
        message,
        timestamp: new Date().toISOString(),
      },
      { status }
    )
  }
}

export async function DELETE(request: Request) {
  const id = extractCategoryId(request.url)

  if (!id) {
    return NextResponse.json(
      {
        code: "bad_request",
        message: "缺少分类 ID",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  try {
    await categoriesService.remove(id)
    return NextResponse.json({
      code: 0,
      message: "deleted",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`DELETE /api/admin/categories/${id}`, error)
    const message = error instanceof Error ? error.message : "删除分类失败"
    const status = message.includes("子分类") ? 409 : 500

    return NextResponse.json(
      {
        code: status === 409 ? "operation_conflict" : "internal_error",
        message,
        timestamp: new Date().toISOString(),
      },
      { status }
    )
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

function extractCategoryId(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const segments = pathname.split("/").filter(Boolean)
    const idSegment = segments.pop()
    if (!idSegment || idSegment === "route.ts") {
      return null
    }
    return decodeURIComponent(idSegment)
  } catch {
    return null
  }
}
