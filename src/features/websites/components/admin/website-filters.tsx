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

import type { WebsiteStatus } from "@/features/websites/types"

const STATUS_OPTIONS: Array<{ value: WebsiteStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
]

const AD_FILTER_OPTIONS = [
  { value: "all", label: "全部类型" },
  { value: "organic", label: "普通网站" },
  { value: "ad", label: "广告投放" },
]

interface WebsiteFiltersProps {
  search: string
  status: WebsiteStatus | "all"
  adFilter: "all" | "ad" | "organic"
  loading?: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: WebsiteStatus | "all") => void
  onAdFilterChange: (value: "all" | "ad" | "organic") => void
  onApply: () => void
  onCreate: () => void
}

export function WebsiteFilters({
  search,
  status,
  adFilter,
  loading,
  onSearchChange,
  onStatusChange,
  onAdFilterChange,
  onApply,
  onCreate,
}: WebsiteFiltersProps) {
  const disabled = loading ?? false

  const statusOptions = useMemo(() => STATUS_OPTIONS, [])

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
          提示：可按发布状态筛选草稿或已发布的网站。
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

