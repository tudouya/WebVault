"use client"

import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { WebsiteReviewStatus } from "@/features/websites/types/admin"
import type { WebsiteStatus } from "@/features/websites/types"

const STATUS_OPTIONS: Array<{ value: WebsiteStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "已上线" },
  { value: "inactive", label: "已下线" },
  { value: "pending", label: "待发布" },
  { value: "rejected", label: "已拒绝" },
]

const REVIEW_OPTIONS: Array<{ value: WebsiteReviewStatus | "all"; label: string }> = [
  { value: "all", label: "全部审核" },
  { value: "pending", label: "待审核" },
  { value: "under_review", label: "审核中" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "未通过" },
  { value: "changes_requested", label: "需修改" },
]

const AD_FILTER_OPTIONS = [
  { value: "all", label: "全部类型" },
  { value: "organic", label: "普通网站" },
  { value: "ad", label: "广告投放" },
]

interface WebsiteFiltersProps {
  search: string
  status: WebsiteStatus | "all"
  reviewStatus: WebsiteReviewStatus | "all"
  adFilter: "all" | "ad" | "organic"
  loading?: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: WebsiteStatus | "all") => void
  onReviewStatusChange: (value: WebsiteReviewStatus | "all") => void
  onAdFilterChange: (value: "all" | "ad" | "organic") => void
  onApply: () => void
  onCreate: () => void
}

export function WebsiteFilters({
  search,
  status,
  reviewStatus,
  adFilter,
  loading,
  onSearchChange,
  onStatusChange,
  onReviewStatusChange,
  onAdFilterChange,
  onApply,
  onCreate,
}: WebsiteFiltersProps) {
  const disabled = loading ?? false

  const statusOptions = useMemo(() => STATUS_OPTIONS, [])
  const reviewOptions = useMemo(() => REVIEW_OPTIONS, [])

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="website-search">搜索关键词</Label>
          <Input
            id="website-search"
            placeholder="标题、URL 或描述"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>发布状态</Label>
          <Select
            value={status}
            onValueChange={(value: WebsiteStatus | "all") => onStatusChange(value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>审核状态</Label>
          <Select
            value={reviewStatus}
            onValueChange={(value: WebsiteReviewStatus | "all") => onReviewStatusChange(value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reviewOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>网站类型</Label>
          <Select
            value={adFilter}
            onValueChange={(value: "all" | "ad" | "organic") => onAdFilterChange(value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AD_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 md:mt-6 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-muted-foreground">
          提示：可组合状态与审核条件快速定位待处理网站。
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onApply} disabled={disabled}>
            {disabled ? "筛选中..." : "应用筛选"}
          </Button>
          <Button onClick={onCreate}>创建网站</Button>
        </div>
      </div>
    </div>
  )
}

