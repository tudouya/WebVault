import { NextResponse } from "next/server"

import { categoriesService, type CategoryCreateInput } from "@/lib/services/categoriesService"
import { categoryCreateSchema } from "@/features/categories/schemas"
import type { CategoryStatus } from "@/features/categories/types"
import { ZodError } from "zod"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") ?? undefined
  const statusParam = (searchParams.get("status") ?? "all") as CategoryStatus | "all"
  const status = statusParam

  try {
    const data = await categoriesService.list({ search, status, countStatus: "all" })
    return NextResponse.json({
      code: 0,
      message: "ok",
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/categories", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取分类数据失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = categoryCreateSchema.safeParse(json)

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
    const payload: CategoryCreateInput = {
      name: data.name.trim(),
      parentId: data.parentId ?? null,
      displayOrder: data.displayOrder,
      status: data.status,
    }

    if (data.slug) payload.slug = data.slug
    if (data.description !== undefined) payload.description = data.description ?? undefined
    if (data.icon !== undefined) payload.icon = data.icon ?? undefined

    const result = await categoriesService.create(payload)

    return NextResponse.json(
      {
        code: 0,
        message: "created",
        data: result,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/admin/categories", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "创建分类失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
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
