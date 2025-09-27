import { NextResponse } from "next/server"
import { ZodError } from "zod"

import {
  blogPostCreateSchema,
  blogPostStatusSchema,
} from "@/features/blog/schemas"
import { blogPostsService } from "@/lib/services/blogPostsService"

export const runtime = "edge"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const post = await blogPostsService.getById(id)
    if (!post) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "未找到对应的博客文章",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: post,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`GET /api/admin/blog-posts/${id}`, error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取博客文章失败",
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

    const updated = await blogPostsService.update(id, parsed.data)

    return NextResponse.json({
      code: 0,
      message: "updated",
      data: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`PUT /api/admin/blog-posts/${id}`, error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "更新博客文章失败"),
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
    const parsed = blogPostStatusSchema.safeParse(json)

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

    const updated = await blogPostsService.updateStatus(id, parsed.data)

    return NextResponse.json({
      code: 0,
      message: "updated",
      data: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`PATCH /api/admin/blog-posts/${id}`, error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "更新博客文章状态失败"),
        timestamp: new Date().toISOString(),
      },
      { status: resolveStatus(error) }
    )
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    await blogPostsService.remove(id)
    return NextResponse.json(
      {
        code: 0,
        message: "deleted",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`DELETE /api/admin/blog-posts/${id}`, error)
    return NextResponse.json(
      {
        code: resolveErrorCode(error),
        message: errorMessage(error, "删除博客文章失败"),
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
    if (/未找到博客文章/.test(error.message)) {
      return 404
    }
    if (/unique|constraint/i.test(error.message)) {
      return 409
    }
  }
  return 500
}

function resolveErrorCode(error: unknown): string {
  if (error instanceof Error) {
    if (/未找到博客文章/.test(error.message)) {
      return "not_found"
    }
    if (/unique|constraint/i.test(error.message)) {
      return "duplicate_resource"
    }
  }
  return "internal_error"
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/未找到博客文章/.test(error.message)) {
      return "未找到对应的博客文章"
    }
    if (/unique|constraint/i.test(error.message)) {
      return "slug 已存在，无法更新"
    }
  }
  return fallback
}
