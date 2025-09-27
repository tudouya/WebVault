"use client"

import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { BlogPostListItem, BlogPostStatus } from "@/features/blog/types"
import { BlogPostStatusBadge } from "./blog-post-status-badge"
import { cn } from "@/lib/utils"

interface BlogPostTableProps {
  items: BlogPostListItem[]
  loading?: boolean
  error?: string | null
  page: number
  pageSize: number
  total: number
  selectedId?: string | null
  onSelect?: (post: BlogPostListItem) => void
  onEdit: (post: BlogPostListItem) => void
  onStatusChange: (post: BlogPostListItem, nextStatus: BlogPostStatus) => void
  onDelete: (post: BlogPostListItem) => void
  onPageChange: (page: number) => void
}

export function BlogPostTable({
  items,
  loading,
  error,
  page,
  pageSize,
  total,
  selectedId,
  onSelect,
  onEdit,
  onStatusChange,
  onDelete,
  onPageChange,
}: BlogPostTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageInfo = useMemo(() => ({ page, totalPages }), [page, totalPages])

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-10 bg-muted px-4 py-3 font-medium">标题</th>
                <th className="w-32 px-4 py-3 font-medium">状态</th>
                <th className="w-40 px-4 py-3 font-medium">标签</th>
                <th className="w-40 px-4 py-3 font-medium">发布时间</th>
                <th className="w-40 px-4 py-3 font-medium">最后更新</th>
                <th className="w-40 px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    正在加载文章数据...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    暂无文章，可点击右上角“新建文章”来创建。
                  </td>
                </tr>
              ) : (
                items.map((post) => (
                  <tr
                    key={post.id}
                    className={cn(
                      "border-b last:border-b-0 hover:bg-accent/40 cursor-pointer",
                      selectedId === post.id && "bg-accent/20"
                    )}
                    onClick={() => onSelect?.(post)}
                  >
                    <td className="sticky left-0 z-0 bg-background px-4 py-3 align-top">
                      <div className="font-medium text-foreground">{post.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">/{post.slug}</div>
                      {post.summary ? (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{post.summary}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <BlogPostStatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      {post.tags.length ? (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {post.publishedAt ? formatDate(post.publishedAt) : <span className="text-xs text-muted-foreground">未发布</span>}
                    </td>
                    <td className="px-4 py-3 align-top">{formatDate(post.updatedAt)}</td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {getStatusActions(post.status).map((action) => (
                          <Button
                            key={action.status}
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation()
                              onStatusChange(post, action.status)
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation()
                            onEdit(post)
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation()
                            onDelete(post)
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {error ? (
          <div className="border-t px-4 py-3 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <div>
            第 {pageInfo.page} / {pageInfo.totalPages} 页 · 共 {total} 篇文章
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string): string {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return value
  }
}

function getStatusActions(status: BlogPostStatus): Array<{ status: BlogPostStatus; label: string }> {
  switch (status) {
    case "draft":
      return [
        { status: "published", label: "发布" },
      ]
    case "published":
      return [
        { status: "draft", label: "设为草稿" },
        { status: "archived", label: "归档" },
      ]
    case "archived":
      return [
        { status: "draft", label: "恢复草稿" },
      ]
    default:
      return []
  }
}
