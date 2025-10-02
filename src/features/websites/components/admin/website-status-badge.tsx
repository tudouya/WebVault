import { cn } from "@/lib/utils"

import type { WebsiteStatus } from "@/features/websites/types"

const STATUS_STYLES: Record<WebsiteStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
}

const STATUS_LABELS: Record<WebsiteStatus, string> = {
  draft: "草稿",
  published: "已发布",
}

interface BadgeProps {
  className?: string
}

export function WebsiteStatusBadge({ status, className }: { status: WebsiteStatus } & BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

