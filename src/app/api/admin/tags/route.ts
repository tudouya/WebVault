import { NextResponse } from "next/server"

import { tagsService, type TagListParams } from "@/lib/services/tagsService"
import { tagCreateSchema } from "@/features/tags/schemas"
import type { TagCreateInput, TagStatus } from "@/features/tags/types/tag"
import { ZodError } from "zod"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") ?? undefined
  const statusParam = (searchParams.get("status") ?? "all") as TagStatus | "all"
  const orderBy = (searchParams.get("orderBy") ?? "recent") as TagListParams["orderBy"]

  try {
    const data = await tagsService.list({
      search,
      status: statusParam,
      orderBy,
    })

    return NextResponse.json({
      code: 0,
      message: "ok",
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/tags", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取标签数据失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = tagCreateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "标签字段校验失败",
          timestamp: new Date().toISOString(),
          errors: formatZodErrors(parsed.error),
        },
        { status: 422 }
      )
    }

    const data = parsed.data
    const payload: TagCreateInput = {
      name: data.name.trim(),
      status: data.status,
    }

    if (data.slug) payload.slug = data.slug
    if (data.description !== undefined) payload.description = data.description ?? undefined
    if (data.color !== undefined) payload.color = data.color ?? undefined

    const result = await tagsService.create(payload)

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
    console.error("POST /api/admin/tags", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "创建标签失败",
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
