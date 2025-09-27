import { cn } from "@/lib/utils"

import type { WebsiteReviewStatus } from "@/features/websites/types/admin"
import type { WebsiteStatus } from "@/features/websites/types"

const STATUS_STYLES: Record<WebsiteStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
}

const STATUS_LABELS: Record<WebsiteStatus, string> = {
  active: "已上线",
  inactive: "已下线",
  pending: "待发布",
  rejected: "已拒绝",
}

const REVIEW_STYLES: Record<WebsiteReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-sky-100 text-sky-700 border-sky-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  changes_requested: "bg-violet-100 text-violet-700 border-violet-200",
}

const REVIEW_LABELS: Record<WebsiteReviewStatus, string> = {
  pending: "待审核",
  under_review: "审核中",
  approved: "已通过",
  rejected: "未通过",
  changes_requested: "需修改",
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

export function WebsiteReviewStatusBadge({
  status,
  className,
}: { status: WebsiteReviewStatus } & BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        REVIEW_STYLES[status],
        className
      )}
    >
      {REVIEW_LABELS[status] ?? status}
    </span>
  )
}

