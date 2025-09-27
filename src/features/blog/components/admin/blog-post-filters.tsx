"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BlogPostListFilters, BlogPostStatus } from "@/features/blog/types"

const STATUS_OPTIONS: Array<{ label: string; value: BlogPostStatus | "all" }> = [
  { label: "全部", value: "all" },
  { label: "草稿", value: "draft" },
  { label: "已发布", value: "published" },
  { label: "已归档", value: "archived" },
]

const ORDER_OPTIONS: Array<{ label: string; value: NonNullable<BlogPostListFilters["orderBy"]> }> = [
  { label: "最近更新", value: "recent" },
  { label: "最早更新", value: "oldest" },
  { label: "标题 A-Z", value: "title" },
]

interface BlogPostFiltersProps {
  search: string
  status: BlogPostStatus | "all"
  orderBy: BlogPostListFilters["orderBy"]
  loading?: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: BlogPostStatus | "all") => void
  onOrderChange: (value: NonNullable<BlogPostListFilters["orderBy"]>) => void
  onApply: () => Promise<void> | void
  onCreate: () => void
}

export function BlogPostFilters({
  search,
  status,
  orderBy,
  loading,
  onSearchChange,
  onStatusChange,
  onOrderChange,
  onApply,
  onCreate,
}: BlogPostFiltersProps) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <Label htmlFor="blog-search">搜索</Label>
          <Input
            id="blog-search"
            placeholder="按标题或摘要搜索"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="blog-status">状态</Label>
          <Select value={status} onValueChange={(value) => onStatusChange(value as BlogPostStatus | "all")}>
            <SelectTrigger id="blog-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blog-order">排序</Label>
          <Select
            value={orderBy ?? "recent"}
            onValueChange={(value) => onOrderChange(value as NonNullable<BlogPostListFilters["orderBy"]>)}
          >
            <SelectTrigger id="blog-order">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
          <Button variant="outline" onClick={onCreate} type="button">
            新建文章
          </Button>
          <Button onClick={() => void onApply()} disabled={loading} type="button">
            {loading ? "加载中..." : "应用"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

