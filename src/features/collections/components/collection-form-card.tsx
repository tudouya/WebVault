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
  collectionFormSchema,
  type CollectionFormInput,
  type CollectionFormValues,
  type CollectionUpdateSchema,
} from "@/features/collections/schemas"
import type { CollectionDetail } from "@/features/collections/types"

interface CollectionFormCardProps {
  mode: "create" | "edit"
  collection?: CollectionDetail | null
  onCancel: () => void
  onSuccess: (detail: CollectionDetail) => Promise<void> | void
}

function getDefaults(collection?: CollectionDetail | null): CollectionFormInput {
  return {
    name: collection?.name ?? "",
    slug: collection?.slug ?? "",
    description: collection?.description ?? "",
    coverImage: collection?.coverImage ?? "",
    isFeatured: collection?.isFeatured ?? false,
    displayOrder: collection ? String(collection.displayOrder) : "",
  }
}

export function CollectionFormCard({ mode, collection, onCancel, onSuccess }: CollectionFormCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CollectionFormInput, undefined, CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: getDefaults(collection),
  })

  useEffect(() => {
    form.reset(getDefaults(collection))
    setSubmitError(null)
  }, [collection, form])

  const dirtyFields = form.formState.dirtyFields
  const endpoint = mode === "create" ? "/api/admin/collections" : `/api/admin/collections/${collection?.id}`
  const method = mode === "create" ? "POST" : "PUT"

  const submitLabel = useMemo(() => (mode === "create" ? "创建收藏集" : "保存修改"), [mode])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload: Partial<CollectionUpdateSchema> & Record<string, unknown> = {}

      const normalizedName = values.name.trim()
      const normalizedSlug = values.slug?.trim() ?? ""
      const normalizedDescription = values.description?.trim() ?? ""
      const normalizedCover = values.coverImage?.trim() ?? ""

      if (mode === "create") {
        payload.name = normalizedName
        if (normalizedSlug) payload.slug = normalizedSlug
        if (normalizedDescription) payload.description = normalizedDescription
        if (normalizedCover) payload.coverImage = normalizedCover
        if (dirtyFields.displayOrder && typeof values.displayOrder === "number") {
          payload.displayOrder = values.displayOrder
        }
        payload.isFeatured = Boolean(values.isFeatured)
      } else {
        if (dirtyFields.name) payload.name = normalizedName
        if (dirtyFields.slug) payload.slug = normalizedSlug ? normalizedSlug : null
        if (dirtyFields.description) payload.description = normalizedDescription || null
        if (dirtyFields.coverImage) payload.coverImage = normalizedCover || null
        if (dirtyFields.displayOrder) payload.displayOrder =
          typeof values.displayOrder === "number" ? values.displayOrder : Number(values.displayOrder ?? 0)
        if (dirtyFields.isFeatured) payload.isFeatured = Boolean(values.isFeatured)

        if (Object.keys(payload).length === 0) {
          setSubmitError("没有检测到字段变更")
          setSubmitting(false)
          return
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => null)) as { data?: CollectionDetail; message?: string } | null

      if (mode === "create" && response.status === 201 && result?.data) {
        await onSuccess(result.data)
        form.reset(getDefaults(null))
        return
      }

      if (mode === "edit" && response.ok && result?.data) {
        await onSuccess(result.data)
        return
      }

      throw new Error(result?.message ?? (mode === "create" ? "创建收藏集失败" : "更新收藏集失败"))
    } catch (error) {
      console.error("提交收藏集失败", error)
      setSubmitError(error instanceof Error ? error.message : "提交失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{mode === "create" ? "新建收藏集" : `编辑收藏集：${collection?.name ?? ""}`}</CardTitle>
        <CardDescription>
          {mode === "create" ? "创建新的收藏集以便在前台聚合网站内容" : "调整收藏集的基础信息与展示状态"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="collection-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="collection-name">名称</Label>
            <Input id="collection-name" placeholder="收藏集名称" disabled={submitting} {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-slug">Slug</Label>
            <Input
              id="collection-slug"
              placeholder="可选，留空自动生成"
              disabled={submitting}
              {...form.register("slug")}
            />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-description">描述</Label>
            <Textarea
              id="collection-description"
              rows={3}
              placeholder="用于说明收藏集内容"
              disabled={submitting}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-cover">封面链接</Label>
            <Input
              id="collection-cover"
              placeholder="https://example.com/cover.png"
              disabled={submitting}
              {...form.register("coverImage")}
            />
            {form.formState.errors.coverImage ? (
              <p className="text-xs text-destructive">{form.formState.errors.coverImage.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collection-featured">精选</Label>
              <Select
                value={String(Boolean(form.watch("isFeatured")))}
                onValueChange={(value) => form.setValue("isFeatured", value === "true", { shouldDirty: true })}
                disabled={submitting}
              >
                <SelectTrigger id="collection-featured">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">否</SelectItem>
                  <SelectItem value="true">是</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-order">排序值</Label>
              <Input
                id="collection-order"
                type="number"
                inputMode="numeric"
                disabled={submitting}
                {...form.register("displayOrder")}
              />
              {form.formState.errors.displayOrder ? (
                <p className="text-xs text-destructive">{form.formState.errors.displayOrder.message}</p>
              ) : null}
            </div>
          </div>

          {submitError ? <p className="text-xs text-destructive">{submitError}</p> : null}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          取消
        </Button>
        <Button type="submit" form="collection-form" disabled={submitting}>
          {submitting ? "提交中..." : submitLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
