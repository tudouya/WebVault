import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { websiteBulkReviewSchema } from "@/features/websites/schemas"
import { websitesAdminService } from "@/lib/services/websitesAdminService"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = websiteBulkReviewSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "validation_failed",
          message: "批量审核字段校验失败",
          errors: formatZodErrors(parsed.error),
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    await websitesAdminService.bulkReview(parsed.data)

    return NextResponse.json({
      code: 0,
      message: "updated",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("POST /api/admin/websites/bulk-review", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "批量审核操作失败",
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

