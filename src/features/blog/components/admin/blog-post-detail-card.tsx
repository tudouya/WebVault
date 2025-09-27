"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { BlogPostDetail, BlogPostStatus } from "@/features/blog/types"
import { BlogPostStatusBadge } from "./blog-post-status-badge"

interface BlogPostDetailCardProps {
  post: BlogPostDetail | null
  loading?: boolean
  onEdit: (post: BlogPostDetail) => void
  onStatusChange: (post: BlogPostDetail, nextStatus: BlogPostStatus) => void
  onDelete: (post: BlogPostDetail) => void
}

export function BlogPostDetailCard({ post, loading, onEdit, onStatusChange, onDelete }: BlogPostDetailCardProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>文章详情</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">正在加载文章详情...</p>
        </CardContent>
      </Card>
    )
  }

  if (!post) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>文章详情</CardTitle>
          <CardDescription>选择一篇文章查看详情或点击“新建文章”开始创作。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            支持草稿、发布与归档三种状态，右侧展示完整内容预览及元信息。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{post.title}</span>
          <BlogPostStatusBadge status={post.status} />
        </CardTitle>
        <CardDescription className="space-y-1 text-xs">
          <div>Slug：/{post.slug}</div>
          <div>创建时间：{formatDate(post.createdAt)}</div>
          <div>最后更新：{formatDate(post.updatedAt)}</div>
          <div>发布时间：{post.publishedAt ? formatDate(post.publishedAt) : "未发布"}</div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto">
        {post.summary ? (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">摘要</h3>
            <p className="rounded border border-dashed border-muted px-3 py-2 text-sm leading-relaxed">{post.summary}</p>
          </div>
        ) : null}

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">正文内容</h3>
          <div className="rounded border border-muted/50 bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <div>作者标识：{post.authorId ?? "未指定"}</div>
          <div>
            标签：
            {post.tags.length ? post.tags.join(", ") : "未设置"}
          </div>
          <div>封面地址：{post.coverImage ?? "未设置"}</div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2">
        {getStatusActions(post.status).map((action) => (
          <Button key={action.status} size="sm" variant="ghost" onClick={() => onStatusChange(post, action.status)}>
            {action.label}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => onEdit(post)}>
          编辑
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(post)}>
          删除
        </Button>
      </CardFooter>
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
      return [{ status: "published", label: "发布" }]
    case "published":
      return [
        { status: "draft", label: "设为草稿" },
        { status: "archived", label: "归档" },
      ]
    case "archived":
      return [{ status: "draft", label: "恢复草稿" }]
    default:
      return []
  }
}

