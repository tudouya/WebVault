"use client"

import { memo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { TagItem } from "@/features/tags/types/tag"

interface TagListProps {
  tags: TagItem[]
  loading: boolean
  error?: string | null
  selectedId: string | null
  onSelect: (tag: TagItem) => void
  onCreate: () => void
  onRefresh: () => Promise<void>
}

export const TagList = memo(function TagList({
  tags,
  loading,
  error,
  selectedId,
  onSelect,
  onCreate,
  onRefresh,
}: TagListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">标签列表</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            刷新
          </Button>
          <Button size="sm" onClick={onCreate}>
            新建
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">数据加载中...</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!loading && !tags.length ? (
          <p className="text-sm text-muted-foreground">暂无标签，请先创建。</p>
        ) : null}

        <div className="space-y-2">
          {tags.map((tag) => {
            const isActive = tag.status === "active"
            const isSelected = selectedId === tag.id
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onSelect(tag)}
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.color || "var(--primary)" }}
                    />
                    <p className="font-medium text-sm">{tag.name}</p>
                    <span className="text-xs text-muted-foreground">/{tag.slug}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{isActive ? "启用" : "停用"}</span>
                    <span>{tag.websiteCount} 个网址</span>
                  </div>
                </div>
                {tag.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{tag.description}</p>
                ) : null}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
