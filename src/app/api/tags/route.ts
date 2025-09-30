import { NextResponse } from "next/server"

import { tagsService } from "@/lib/services/tagsService"

export const runtime = "edge"

function normalizeStatus(value: string | null): "active" | "inactive" | "all" {
  if (value === "inactive") return "inactive"
  if (value === "all") return "all"
  return "active"
}

function normalizeOrder(value: string | null): "recent" | "name" {
  if (value === "recent") return "recent"
  return "name"
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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID()
  const search = url.searchParams.get("search") ?? undefined
  const status = normalizeStatus(url.searchParams.get("status"))
  const orderBy = normalizeOrder(url.searchParams.get("orderBy"))

  try {
    const result = await tagsService.list({
      search,
      status,
      orderBy,
    })

    return respondSuccess({
      requestId,
      data: {
        items: result.items,
        total: result.total,
        active: result.active,
        inactive: result.inactive,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载标签数据失败"

    return respondError({
      status: 500,
      code: "internal_error",
      message: "加载标签数据失败",
      requestId,
      errors: {
        detail: [message],
      },
    })
  }
}

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
