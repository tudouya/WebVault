"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { BlogPostDetail, BlogPostStatus } from "@/features/blog/types"

interface BlogPostFormCardProps {
  mode: "create" | "edit"
  post?: BlogPostDetail | null
  submitting?: boolean
  onCancel: () => void
  onSubmit: (payload: BlogPostPayload) => Promise<void>
}

export interface BlogPostPayload {
  title: string
  slug?: string
  summary?: string
  content: string
  coverImage?: string
  authorId?: string
  tags: string[]
  status: BlogPostStatus
  publishedAt?: string
}

const formSchema = z.object({
  title: z
    .string()
    .min(1, "标题不能为空")
    .max(200, "标题长度需在 200 个字符内"),
  slug: z
    .string()
    .trim()
    .max(160, "slug 长度需在 160 个字符内")
    .regex(/^[a-z0-9-]*$/, "slug 仅能包含小写字母、数字与连字符")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  summary: z
    .string()
    .trim()
    .max(500, "摘要长度需在 500 个字符内")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  content: z.string().min(1, "内容不能为空"),
  coverImage: z
    .string()
    .trim()
    .max(500, "封面链接过长")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  authorId: z
    .string()
    .trim()
    .max(120, "作者标识长度需在 120 个字符内")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  tags: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? Array.from(
            new Set(
              value
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)
            )
          )
        : []
    ),
  status: z.enum(["draft", "published", "archived"] as const),
  publishedAt: z
    .string()
    .optional()
    .transform((value) => (value ? convertLocalToIso(value) : undefined)),
})

type BlogPostFormInput = z.input<typeof formSchema>
type BlogPostFormValues = z.output<typeof formSchema>

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
}

export function BlogPostFormCard({ mode, post, submitting: externalSubmitting, onCancel, onSubmit }: BlogPostFormCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const defaults: BlogPostFormInput = useMemo(() => {
    if (!post) {
      return {
        title: "",
        slug: "",
        summary: "",
        content: "",
        coverImage: "",
        authorId: "",
        tags: "",
        status: "draft",
        publishedAt: "",
      }
    }

    return {
      title: post.title,
      slug: post.slug,
      summary: post.summary ?? "",
      content: post.content,
      coverImage: post.coverImage ?? "",
      authorId: post.authorId ?? "",
      tags: post.tags.join(", "),
      status: post.status,
      publishedAt: post.publishedAt ? formatForInput(post.publishedAt) : "",
    }
  }, [post])

  const form = useForm<BlogPostFormInput, undefined, BlogPostFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    form.reset(defaults)
    setSubmitError(null)
  }, [defaults, form])

  const currentStatus = form.watch("status")
  const publishedAtValue = form.watch("publishedAt")

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload: BlogPostPayload = {
        title: values.title.trim(),
        slug: values.slug,
        summary: values.summary,
        content: values.content,
        coverImage: values.coverImage,
        authorId: values.authorId,
        tags: values.tags,
        status: values.status,
        publishedAt: values.status === "published" ? values.publishedAt ?? new Date().toISOString() : values.publishedAt,
      }

      await onSubmit(payload)
      if (mode === "create") {
        form.reset(defaults)
      }
    } catch (error) {
      console.error("提交博客文章失败", error)
      setSubmitError(error instanceof Error ? error.message : "提交失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  })

  const isSubmitting = submitting || externalSubmitting

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{mode === "create" ? "新建博客文章" : `编辑：${post?.title ?? ""}`}</CardTitle>
        <CardDescription>
          {mode === "create" ? "撰写新的博客文章，支持即时发布或保存草稿" : "更新文章内容、发布状态与元信息"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="blog-post-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="blog-title">标题</Label>
            <Input id="blog-title" placeholder="文章标题" disabled={isSubmitting} {...form.register("title")} />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-slug">Slug</Label>
            <Input id="blog-slug" placeholder="可选，留空自动生成" disabled={isSubmitting} {...form.register("slug")} />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-summary">摘要</Label>
            <Textarea
              id="blog-summary"
              rows={3}
              placeholder="用于列表展示的文章摘要"
              disabled={isSubmitting}
              {...form.register("summary")}
            />
            {form.formState.errors.summary ? (
              <p className="text-xs text-destructive">{form.formState.errors.summary.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-content">正文内容</Label>
            <Textarea
              id="blog-content"
              rows={10}
              placeholder="支持 Markdown 或 HTML 内容"
              disabled={isSubmitting}
              {...form.register("content")}
            />
            {form.formState.errors.content ? (
              <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="blog-cover">封面图 URL</Label>
              <Input id="blog-cover" placeholder="https://example.com/cover.jpg" disabled={isSubmitting} {...form.register("coverImage")} />
              {form.formState.errors.coverImage ? (
                <p className="text-xs text-destructive">{form.formState.errors.coverImage.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-author">作者标识</Label>
              <Input id="blog-author" placeholder="可选，用于存储作者 ID" disabled={isSubmitting} {...form.register("authorId")} />
              {form.formState.errors.authorId ? (
                <p className="text-xs text-destructive">{form.formState.errors.authorId.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-tags">标签</Label>
            <Input id="blog-tags" placeholder="使用逗号分隔多个标签" disabled={isSubmitting} {...form.register("tags")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="blog-status">文章状态</Label>
              <Select
                value={currentStatus}
                onValueChange={(value) => form.setValue("status", value as BlogPostStatus, { shouldDirty: true })}
                disabled={isSubmitting}
              >
                <SelectTrigger id="blog-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as BlogPostStatus[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-published-at">发布时间</Label>
              <Input
                id="blog-published-at"
                type="datetime-local"
                disabled={isSubmitting || currentStatus === "draft"}
                value={publishedAtValue ?? ""}
                onChange={(event) => form.setValue("publishedAt", event.target.value, { shouldDirty: true })}
              />
              <p className="text-xs text-muted-foreground">发布状态将使用此时间，空白时自动使用当前时间。</p>
            </div>
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          取消
        </Button>
        <Button type="submit" form="blog-post-form" disabled={isSubmitting}>
          {isSubmitting ? "提交中..." : mode === "create" ? "创建文章" : "保存修改"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function convertLocalToIso(value: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function formatForInput(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ""
    const tzOffset = date.getTimezoneOffset() * 60000
    const local = new Date(date.getTime() - tzOffset)
    return local.toISOString().slice(0, 16)
  } catch {
    return ""
  }
}

