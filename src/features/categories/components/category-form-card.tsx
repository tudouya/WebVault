"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { categoryFormSchema, type CategoryFormInput, type CategoryFormValues } from "../schemas"
import type { CategoryNode, CategoryStatus } from "../types"
import { flattenCategoryTree, type CategoryOption } from "../utils/tree"

interface CategoryFormCardProps {
  mode: "create" | "edit"
  category?: CategoryNode | null
  categories: CategoryNode[]
  onCancel: () => void
  onSuccess: (category: CategoryNode) => void
}

const statusLabels: Record<CategoryStatus, string> = {
  active: "启用",
  inactive: "停用",
  hidden: "隐藏",
}

const ROOT_PARENT_VALUE = "__root__"

function renderIndentedLabel(option: CategoryOption) {
  if (option.level === 0) return option.label
  return `${"· ".repeat(option.level)}${option.label}`
}

function getFormDefaults(category?: CategoryNode | null): CategoryFormInput {
  const parentId = category?.parentId
  const normalizedParentId = typeof parentId === "string" && parentId.trim().length > 0 ? parentId.trim() : null

  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    parentId: normalizedParentId,
    displayOrder: category?.displayOrder ?? 0,
    icon: category?.icon ?? "",
    status: category?.status ?? "active",
  }
}

export function CategoryFormCard({ mode, category, categories, onCancel, onSuccess }: CategoryFormCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const parentOptions = useMemo<CategoryOption[]>(() => {
    const excludeId = mode === "edit" && category ? category.id : undefined
    return flattenCategoryTree(categories, { excludeId })
  }, [categories, category, mode])

  const form = useForm<CategoryFormInput, undefined, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: getFormDefaults(category),
  })

  useEffect(() => {
    form.reset(getFormDefaults(category))
    setSubmitError(null)
  }, [category, mode, form])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const normalizedDescription = values.description?.trim() ?? ""
      const normalizedIcon = values.icon?.trim() ?? ""

      const endpoint = mode === "create" ? "/api/admin/categories" : `/api/admin/categories/${category?.id}`
      const method = mode === "create" ? "POST" : "PUT"

      let payload: Record<string, unknown>

      const normalizedParentId = values.parentId && typeof values.parentId === "string"
        ? values.parentId.trim() || null
        : values.parentId ?? null

      if (mode === "create") {
        payload = {
          name: values.name.trim(),
          slug: values.slug?.trim() || undefined,
          description: normalizedDescription ? normalizedDescription : undefined,
          parentId: normalizedParentId,
          displayOrder: values.displayOrder,
          icon: normalizedIcon ? normalizedIcon : undefined,
          status: values.status,
        }
      } else {
        const dirtyFields = form.formState.dirtyFields
        const updatePayload: Record<string, unknown> = {}

        if (dirtyFields.name) updatePayload.name = values.name.trim()
        if (dirtyFields.slug) {
          updatePayload.slug = values.slug?.trim()
        }
        if (dirtyFields.description) {
          updatePayload.description = normalizedDescription.length ? normalizedDescription : null
        }
        if (dirtyFields.parentId) updatePayload.parentId = normalizedParentId
        if (dirtyFields.displayOrder) updatePayload.displayOrder = values.displayOrder
        if (dirtyFields.icon) {
          updatePayload.icon = normalizedIcon.length ? normalizedIcon : null
        }
        if (dirtyFields.status) updatePayload.status = values.status

        if (Object.keys(updatePayload).length === 0) {
          setSubmitError("没有检测到字段变更")
          return
        }

        payload = updatePayload
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => null)) as {
        data?: unknown
        message?: string
        errors?: Record<string, string[]>
      } | null

      if (!response.ok) {
        const errorMessage = result?.message ?? "提交失败，请稍后再试"
        setSubmitError(errorMessage)
        return
      }

      const newCategory = result?.data as CategoryNode | undefined
      if (newCategory) {
        onSuccess(newCategory)
        if (mode === "create") {
          form.reset(getFormDefaults(null))
        }
      }
    } catch (error) {
      console.error("category form submit failed", error)
      setSubmitError("提交失败，请检查网络或稍后再试")
    } finally {
      setSubmitting(false)
    }
  })

  const title = mode === "create" ? "新建分类" : `编辑：${category?.name ?? "分类"}`
  const description = mode === "create" ? "创建新的分类节点，为网站管理提供组织结构。" : "更新分类信息后会立即生效。"

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="category-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="category-name">名称 *</Label>
            <Input
              id="category-name"
              placeholder="请输入分类名称"
              disabled={submitting}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              placeholder="可选，留空将自动生成"
              disabled={submitting}
              {...form.register("slug")}
            />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-parent">父级分类</Label>
            <Controller
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={typeof field.value === "string" && field.value.trim().length > 0 ? field.value : ROOT_PARENT_VALUE}
                  onValueChange={(value) => field.onChange(value === ROOT_PARENT_VALUE ? null : value)}
                  disabled={submitting}
                >
                  <SelectTrigger id="category-parent">
                    <SelectValue placeholder="选择父级分类（默认顶层）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT_PARENT_VALUE}>顶层分类</SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {renderIndentedLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.parentId ? (
              <p className="text-xs text-destructive">{form.formState.errors.parentId.message as string}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">描述</Label>
            <Textarea
              id="category-description"
              rows={4}
              placeholder="可选，介绍该分类的用途"
              disabled={submitting}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category-display-order">排序</Label>
              <Input
                id="category-display-order"
                type="number"
                min={0}
                placeholder="0"
                disabled={submitting}
                {...form.register("displayOrder", { valueAsNumber: true })}
              />
              {form.formState.errors.displayOrder ? (
                <p className="text-xs text-destructive">{form.formState.errors.displayOrder.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-icon">图标</Label>
              <Input
                id="category-icon"
                placeholder="可选，如 Package、Layers"
                disabled={submitting}
                {...form.register("icon")}
              />
              {form.formState.errors.icon ? (
                <p className="text-xs text-destructive">{form.formState.errors.icon.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-status">状态</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                  <SelectTrigger id="category-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as CategoryStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
        <Button type="submit" form="category-form" disabled={submitting}>
          {submitting ? "保存中..." : mode === "create" ? "创建分类" : "保存修改"}
        </Button>
      </CardFooter>
    </Card>
  )
}
