import { NextResponse } from "next/server"
import { ZodError } from "zod"

import {
  websiteAdminUpdateSchema,
  websiteStatusUpdateSchema,
} from "@/features/websites/schemas"
import { websitesAdminService } from "@/lib/services/websitesAdminService"

export const runtime = "edge"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const website = await websitesAdminService.getById(id)
    if (!website) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "未找到对应的网站",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: website,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`GET /api/admin/websites/${id}`, error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取网站详情失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const json = await request.json()
    const parsed = websiteAdminUpdateSchema.safeParse(json)

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

    const updated = await websitesAdminService.update(id, parsed.data)

    return NextResponse.json({
      code: 0,
      message: "updated",
      data: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`PUT /api/admin/websites/${id}`, error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "更新网站失败"),
        timestamp: new Date().toISOString(),
      },
      { status: resolveStatus(error) }
    )
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const json = await request.json()
    const parsed = websiteStatusUpdateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "状态更新字段校验失败",
          errors: formatZodErrors(parsed.error),
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    await websitesAdminService.updateStatus(id, parsed.data)
    const detail = await websitesAdminService.getById(id)

    return NextResponse.json({
      code: 0,
      message: "updated",
      data: detail,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`PATCH /api/admin/websites/${id}`, error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "更新网站状态失败"),
        timestamp: new Date().toISOString(),
      },
      { status: resolveStatus(error) }
    )
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    await websitesAdminService.remove(id)
    return NextResponse.json({
      code: 0,
      message: "deleted",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`DELETE /api/admin/websites/${id}`, error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "删除网站失败"),
        timestamp: new Date().toISOString(),
      },
      { status: resolveStatus(error) }
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
      return fallback.includes("状态") ? "无法更新至当前状态" : "slug 已存在，无法更新"
    }
  }
  return fallback
}

