"use client"

import { cn } from "@/lib/utils"
import type { BlogPostStatus } from "@/features/blog/types"

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
}

const STATUS_VARIANTS: Record<BlogPostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  archived: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
}

export interface BlogPostStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BlogPostStatus
}

export function BlogPostStatusBadge({ status, className, ...props }: BlogPostStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_VARIANTS[status],
        className
      )}
      {...props}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

