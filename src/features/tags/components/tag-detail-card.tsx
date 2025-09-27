"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import type { TagItem } from "@/features/tags/types/tag"

interface TagDetailCardProps {
  tag: TagItem | null
  onEdit: (tag: TagItem) => void
  onDeleted: () => Promise<void> | void
  onStatusChanged: (tag: TagItem) => Promise<void> | void
}

export function TagDetailCard({ tag, onEdit, onDeleted, onStatusChanged }: TagDetailCardProps) {
  const [submitting, setSubmitting] = useState(false)

  if (!tag) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>标签详情</CardTitle>
          <CardDescription>选择左侧列表中的标签查看详情或进行编辑。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">尚未选择标签。</p>
        </CardContent>
      </Card>
    )
  }

  const statusLabel = tag.status === "active" ? "启用" : "停用"
  const toggleLabel = tag.status === "active" ? "停用" : "启用"

  const handleDelete = async () => {
    if (!window.confirm(`确认删除标签“${tag.name}”？`)) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/tags/${tag.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      })

      const result = (await response.json().catch(() => null)) as { message?: string } | null

      if (!response.ok) {
        const message = result?.message ?? "删除标签失败"
        window.alert(message)
        return
      }

      await onDeleted()
    } catch (error) {
      console.error("删除标签失败", error)
      window.alert("删除标签失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async () => {
    setSubmitting(true)
    try {
      const nextStatus = tag.status === "active" ? "inactive" : "active"
      const response = await fetch(`/api/admin/tags/${tag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })

      const result = (await response.json().catch(() => null)) as { data?: TagItem; message?: string } | null

      if (!response.ok || !result?.data) {
        throw new Error(result?.message ?? "更新标签状态失败")
      }

      await onStatusChanged(result.data)
    } catch (error) {
      console.error("更新标签状态失败", error)
      window.alert(error instanceof Error ? error.message : "更新状态失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <span
            className="inline-flex h-3 w-3 rounded-full"
            style={{ backgroundColor: tag.color || "var(--primary)" }}
          />
          {tag.name}
        </CardTitle>
        <CardDescription>Slug：{tag.slug}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">状态</span>
            <span>{statusLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">关联网址</span>
            <span>{tag.websiteCount} 个</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">创建时间</span>
            <span>{formatTime(tag.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">更新时间</span>
            <span>{formatTime(tag.updatedAt)}</span>
          </div>
        </div>

        {tag.description ? (
          <div>
            <h3 className="text-sm font-medium">描述</h3>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{tag.description}</p>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onEdit(tag)} disabled={submitting}>
          编辑
        </Button>
        <Button variant="secondary" onClick={handleToggle} disabled={submitting}>
          {submitting ? "处理中..." : `${toggleLabel}`}
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
