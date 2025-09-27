"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import type { CollectionDetail } from "@/features/collections/types"

interface CollectionDetailCardProps {
  collection: CollectionDetail | null
  loading: boolean
  onEdit: (collection: CollectionDetail) => void
  onDeleted: () => Promise<void> | void
  onUpdated: (collection: CollectionDetail) => Promise<void> | void
  onRefresh: () => Promise<void> | void
}

export function CollectionDetailCard({
  collection,
  loading,
  onEdit,
  onDeleted,
  onUpdated,
  onRefresh,
}: CollectionDetailCardProps) {
  const [submitting, setSubmitting] = useState(false)

  if (!collection) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>收藏集详情</CardTitle>
          <CardDescription>选择左侧列表中的收藏集查看详情或进行编辑。</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : <p className="text-sm text-muted-foreground">尚未选择收藏集。</p>}
        </CardContent>
      </Card>
    )
  }

  const handleToggleFeatured = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !collection.isFeatured }),
      })

      const result = (await response.json().catch(() => null)) as { data?: CollectionDetail; message?: string } | null

      if (!response.ok || !result?.data) {
        throw new Error(result?.message ?? "更新精选状态失败")
      }

      await onUpdated(result.data)
    } catch (error) {
      console.error("更新精选状态失败", error)
      window.alert(error instanceof Error ? error.message : "更新精选状态失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`确认删除收藏集“${collection.name}”？`)) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "DELETE",
      })

      if (!response.ok && response.status !== 204) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message ?? "删除收藏集失败")
      }

      await onDeleted()
    } catch (error) {
      console.error("删除收藏集失败", error)
      window.alert(error instanceof Error ? error.message : "删除失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefresh = async () => {
    setSubmitting(true)
    try {
      await onRefresh()
    } finally {
      setSubmitting(false)
    }
  }

  const featuredLabel = collection.isFeatured ? "精选" : "普通"

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">{collection.name}</CardTitle>
        <CardDescription>Slug：{collection.slug}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 text-sm">
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>精选状态</span>
            <span className={collection.isFeatured ? "text-amber-600" : undefined}>{featuredLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>排序值</span>
            <span>{collection.displayOrder}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>关联网址</span>
            <span>{collection.websiteCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>创建时间</span>
            <span>{formatTime(collection.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>更新时间</span>
            <span>{formatTime(collection.updatedAt)}</span>
          </div>
          {collection.coverImage ? (
            <div className="flex items-center justify-between">
              <span>封面</span>
              <a
                href={collection.coverImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                查看
              </a>
            </div>
          ) : null}
        </div>

        {collection.description ? (
          <div>
            <h3 className="text-sm font-medium text-foreground">描述</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{collection.description}</p>
          </div>
        ) : null}

        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">收录网站（按排序值）</h3>
          {collection.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">当前收藏集尚未关联任何网站。</p>
          ) : (
            <ul className="space-y-2">
              {collection.items.map((item) => (
                <li key={item.id} className="rounded-md border border-border px-3 py-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>排序：{item.position}</span>
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                  <div className="mt-1">
                    {item.website ? (
                      <a
                        href={item.website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {item.website.title}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-foreground">{item.websiteId}</span>
                    )}
                  </div>
                  {item.note ? <p className="mt-1 text-xs text-muted-foreground">备注：{item.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={handleRefresh} disabled={submitting}>
          刷新
        </Button>
        <Button variant="outline" onClick={() => onEdit(collection)} disabled={submitting}>
          编辑
        </Button>
        <Button variant="secondary" onClick={handleToggleFeatured} disabled={submitting}>
          {collection.isFeatured ? "设为普通" : "标记精选"}
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
          删除
        </Button>
      </CardFooter>
    </Card>
  )
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return isoString
    return date.toLocaleString()
  } catch {
    return isoString
  }
}

