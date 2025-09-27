import { NextResponse } from "next/server"

import { tagsService } from "@/lib/services/tagsService"
import { z } from "zod"

export const runtime = "edge"

const updateSchema = z.object({
  tagIds: z.array(z.string().min(1, "标签 ID 不可为空")).max(50, "标签数量超出限制"),
})

export async function GET(request: Request) {
  const id = extractWebsiteId(request.url)
  if (!id) {
    return NextResponse.json(
      {
        code: "bad_request",
        message: "缺少网站 ID",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  try {
    const tags = await tagsService.listByWebsite(id)
    return NextResponse.json({
      code: 0,
      message: "ok",
      data: tags,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`GET /api/admin/websites/${id}/tags`, error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "获取网站标签失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const id = extractWebsiteId(request.url)
  if (!id) {
    return NextResponse.json(
      {
        code: "bad_request",
        message: "缺少网站 ID",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  try {
    const json = await request.json()
    const parsed = updateSchema.safeParse(json)

    if (!parsed.success) {
      const errors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] ? String(issue.path[0]) : "root"
        if (!errors[key]) errors[key] = []
        errors[key].push(issue.message)
      }

      return NextResponse.json(
        {
          code: "validation_failed",
          message: "标签字段校验失败",
          errors,
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    await tagsService.updateWebsiteTags(id, parsed.data.tagIds)

    return NextResponse.json({
      code: 0,
      message: "updated",
      data: { tagIds: parsed.data.tagIds },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`PUT /api/admin/websites/${id}/tags`, error)
    const message = error instanceof Error ? error.message : "更新网站标签失败"
    const status = message.includes("无效的标签") ? 400 : 500

    return NextResponse.json(
      {
        code: status === 400 ? "bad_request" : "internal_error",
        message,
        timestamp: new Date().toISOString(),
      },
      { status }
    )
  }
}

function extractWebsiteId(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const segments = pathname.split("/").filter(Boolean)
    const idSegment = segments[segments.length - 2]
    return idSegment ? decodeURIComponent(idSegment) : null
  } catch {
    return null
  }
}
