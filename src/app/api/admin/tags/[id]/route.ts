import { NextResponse } from "next/server"

import { tagsService } from "@/lib/services/tagsService"
import { tagUpdateSchema } from "@/features/tags/schemas"
import type { TagUpdateInput } from "@/features/tags/types/tag"
import { ZodError } from "zod"

export const runtime = "edge"

export async function PUT(request: Request) {
  const id = extractTagId(request.url)

  if (!id) {
    return NextResponse.json(
      {
        code: "bad_request",
        message: "缺少标签 ID",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  try {
    const json = await request.json()
    const parsed = tagUpdateSchema.safeParse(json)

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
    const payload: TagUpdateInput = {}

    if (data.name !== undefined) payload.name = data.name.trim()
    if (data.slug !== undefined) payload.slug = data.slug
    if (data.description !== undefined) payload.description = data.description ?? null
    if (data.color !== undefined) payload.color = data.color ?? null
    if (data.status !== undefined) payload.status = data.status

    const result = await tagsService.update(id, payload)

    return NextResponse.json({
      code: 0,
      message: "updated",
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`PUT /api/admin/tags/${id}`, error)
    const message = error instanceof Error ? error.message : "更新标签失败"
    const status = message.includes("未找到") ? 404 : 500

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
  const id = extractTagId(request.url)

  if (!id) {
    return NextResponse.json(
      {
        code: "bad_request",
        message: "缺少标签 ID",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  try {
    await tagsService.remove(id)
    return NextResponse.json({
      code: 0,
      message: "deleted",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`DELETE /api/admin/tags/${id}`, error)
    const message = error instanceof Error ? error.message : "删除标签失败"
    const status = message.includes("绑定的网址") ? 409 : message.includes("未找到") ? 404 : 500

    return NextResponse.json(
      {
        code:
          status === 409 ? "operation_conflict" : status === 404 ? "not_found" : "internal_error",
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

function extractTagId(url: string): string | null {
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
