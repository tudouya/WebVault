import { NextResponse } from "next/server"

import type { CategoryStatus } from "@/features/categories/types"
import { categoriesService } from "@/lib/services/categoriesService"

export const runtime = "edge"

function normalizeStatus(value: string | null): CategoryStatus | "all" {
  if (!value) return "active"
  if (value === "all") return "all"
  if (value === "active" || value === "inactive" || value === "hidden") {
    return value
  }
  return "active"
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const status = normalizeStatus(url.searchParams.get("status"))
  const search = url.searchParams.get("search") ?? undefined
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID()

  try {
    const result = await categoriesService.list(
      {
        search,
        status,
      },
      { allowMockFallback: false }
    )

    return respondSuccess({
      requestId,
      data: { tree: result.tree },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载分类失败"

    return respondError({
      status: 500,
      requestId,
      code: "internal_error",
      message: "加载分类失败",
      errors: {
        detail: [message],
      },
    })
  }
}

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

function respondSuccess({
  requestId,
  data,
}: {
  requestId: string
  data: unknown
}) {
  return NextResponse.json(
    {
      code: 0,
      message: "ok",
      data,
      requestId,
      timestamp: formatTimestamp(),
    },
    {
      headers: {
        "X-Request-Id": requestId,
      },
    }
  )
}

function respondError({
  status,
  code,
  message,
  requestId,
  errors,
}: {
  status: number
  code: string
  message: string
  requestId: string
  errors?: Record<string, string[]>
}) {
  return NextResponse.json(
    {
      status,
      code,
      message,
      errors,
      requestId,
      timestamp: formatTimestamp(),
    },
    {
      status,
      headers: {
        "X-Request-Id": requestId,
      },
    }
  )
}

function formatTimestamp(): string {
  const parts = TIMESTAMP_FORMATTER.formatToParts(new Date())
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`
}
