"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { CollectionListItem } from "@/features/collections/types"

interface CollectionListProps {
  items: CollectionListItem[]
  loading: boolean
  error: string | null
  selectedId: string | null
  page: number
  pageSize: number
  total: number
  onSelect: (id: string) => void
  onCreate: () => void
  onRefresh: () => void
  onPageChange: (page: number) => void
}

export function CollectionList({
  items,
  loading,
  error,
  selectedId,
  page,
  pageSize,
  total,
  onSelect,
  onCreate,
  onRefresh,
  onPageChange,
}: CollectionListProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)))

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">收藏集列表</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
            {loading ? "刷新中..." : "刷新"}
          </Button>
          <Button size="sm" onClick={onCreate}>
            新建
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? <ErrorMessage message={error} /> : null}
        {!error && !items.length && !loading ? (
          <p className="text-sm text-muted-foreground">暂无收藏集，点击右上方“新建”开始创建。</p>
        ) : null}

        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left transition hover:border-primary",
                  selectedId === item.id ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  {item.isFeatured ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">精选</span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Slug：{item.slug}</span>
                  <span>网址数：{item.websiteCount}</span>
                  <span>排序值：{item.displayOrder}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          第 {page} / {totalPages} 页 · 共 {total} 条
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={loading || page <= 1}>
            上一页
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={loading || page >= totalPages}
          >
            下一页
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{message}</p>
}

