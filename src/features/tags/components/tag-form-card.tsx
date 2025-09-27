"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  tagFormSchema,
  type TagFormInput,
  type TagFormValues,
  type TagUpdateSchema,
} from "@/features/tags/schemas"
import type { TagItem, TagStatus } from "@/features/tags/types/tag"

interface TagFormCardProps {
  mode: "create" | "edit"
  tag?: TagItem | null
  onCancel: () => void
  onSuccess: (item: TagItem) => Promise<void> | void
  onCreated?: (item: TagItem) => void
}

const STATUS_LABELS: Record<TagStatus, string> = {
  active: "启用",
  inactive: "停用",
}

function getDefaults(tag?: TagItem | null): TagFormInput {
  return {
    name: tag?.name ?? "",
    slug: tag?.slug ?? "",
    description: tag?.description ?? "",
    color: tag?.color ?? "",
    status: tag?.status ?? "active",
  }
}

export function TagFormCard({ mode, tag, onCancel, onSuccess, onCreated }: TagFormCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<TagFormInput, undefined, TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: getDefaults(tag),
  })

  useEffect(() => {
    form.reset(getDefaults(tag))
    setSubmitError(null)
  }, [tag, form])

  const dirtyFields = form.formState.dirtyFields

  const endpoint = mode === "create" ? "/api/admin/tags" : `/api/admin/tags/${tag?.id}`
  const method = mode === "create" ? "POST" : "PUT"

  const submitLabel = useMemo(() => (mode === "create" ? "创建标签" : "保存修改"), [mode])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload: Partial<TagUpdateSchema> & Record<string, unknown> = {}

      const normalizedDescription = values.description?.trim() ?? ""
      const normalizedColor = values.color?.trim() ?? ""
      const normalizedSlug = values.slug?.trim() ?? ""

      if (mode === "create") {
        payload.name = values.name.trim()
        if (normalizedSlug) payload.slug = normalizedSlug
        if (normalizedDescription) payload.description = normalizedDescription
        if (normalizedColor) payload.color = normalizedColor.startsWith("#") ? normalizedColor : `#${normalizedColor}`
        payload.status = values.status
      } else {
        if (dirtyFields.name) payload.name = values.name.trim()
        if (dirtyFields.slug) payload.slug = normalizedSlug || null
        if (dirtyFields.description) payload.description = normalizedDescription || null
        if (dirtyFields.color) {
          payload.color = normalizedColor ? (normalizedColor.startsWith("#") ? normalizedColor : `#${normalizedColor}`) : null
        }
        if (dirtyFields.status) payload.status = values.status

        if (Object.keys(payload).length === 0) {
          setSubmitError("没有检测到字段变更")
          setSubmitting(false)
          return
        }
      }

      if (mode === "create") {
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const result = (await response.json().catch(() => null)) as { data?: TagItem; message?: string } | null

        if (!response.ok || !result?.data) {
          throw new Error(result?.message ?? "创建标签失败")
        }

        onCreated?.(result.data)
        await onSuccess(result.data)
        form.reset(getDefaults(null))
      } else {
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const result = (await response.json().catch(() => null)) as { data?: TagItem; message?: string } | null

        if (!response.ok || !result?.data) {
          throw new Error(result?.message ?? "更新标签失败")
        }

        await onSuccess(result.data)
      }
    } catch (error) {
      console.error("提交标签失败", error)
      setSubmitError(error instanceof Error ? error.message : "提交失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{mode === "create" ? "新建标签" : `编辑标签：${tag?.name ?? ""}`}</CardTitle>
        <CardDescription>
          {mode === "create" ? "创建新的标签以便在网站与内容中复用" : "调整标签的基础信息与状态"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="tag-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="tag-name">名称</Label>
            <Input id="tag-name" placeholder="标签名称" disabled={submitting} {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-slug">Slug</Label>
            <Input id="tag-slug" placeholder="可选，留空自动生成" disabled={submitting} {...form.register("slug")} />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-description">描述</Label>
            <Textarea
              id="tag-description"
              rows={3}
              placeholder="用于说明标签用途"
              disabled={submitting}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-color">颜色</Label>
            <Input id="tag-color" placeholder="#10b981" disabled={submitting} {...form.register("color")} />
            {form.formState.errors.color ? (
              <p className="text-xs text-destructive">{form.formState.errors.color.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-status">状态</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as TagStatus, { shouldDirty: true })}
              disabled={submitting}
            >
              <SelectTrigger id="tag-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as TagStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.status ? (
              <p className="text-xs text-destructive">{form.formState.errors.status.message}</p>
            ) : null}
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          取消
        </Button>
        <Button type="submit" form="tag-form" disabled={submitting}>
          {submitting ? "提交中..." : submitLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
