"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { WebsiteAdminDetail } from "@/features/websites/types/admin"

import { WebsiteReviewStatusBadge, WebsiteStatusBadge } from "./website-status-badge"

export interface WebsiteFormPayload {
  title: string
  url: string
  slug?: string
  description?: string
  categoryId?: string
  tagIds?: string[]
  isAd?: boolean
  adType?: string
  rating?: number | null
  visitCount?: number
  isFeatured?: boolean
  isPublic?: boolean
  notes?: string
}

interface WebsiteFormCardProps {
  mode: "create" | "edit"
  website?: WebsiteAdminDetail | null
  submitting?: boolean
  onCancel: () => void
  onSubmit: (payload: WebsiteFormPayload) => Promise<void>
}

const AD_TYPES = ["banner", "sponsored", "featured", "premium"]

export function WebsiteFormCard({ mode, website, submitting, onCancel, onSubmit }: WebsiteFormCardProps) {
  const [title, setTitle] = useState(website?.title ?? "")
  const [url, setUrl] = useState(website?.url ?? "")
  const [slug, setSlug] = useState(website?.slug ?? "")
  const [description, setDescription] = useState(website?.description ?? "")
  const [categoryId, setCategoryId] = useState(website?.category?.id ?? "")
  const [tagInput, setTagInput] = useState(() => (website ? website.tags.map((tag) => tag.id).join(",") : ""))
  const [isAd, setIsAd] = useState(Boolean(website?.isAd))
  const [adType, setAdType] = useState(website?.adType ?? "")
  const [rating, setRating] = useState<string>(website?.rating != null ? String(website.rating) : "")
  const [visitCount, setVisitCount] = useState<string>(website?.visitCount != null ? String(website.visitCount) : "")
  const [isFeatured, setIsFeatured] = useState(Boolean(website?.isFeatured))
  const [isPublic, setIsPublic] = useState(website ? Boolean(website.isPublic) : true)
  const [notes, setNotes] = useState(website?.notes ?? "")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!website) {
      if (mode === "create") {
        setTitle("")
        setUrl("")
        setSlug("")
        setDescription("")
        setCategoryId("")
        setTagInput("")
        setIsAd(false)
        setAdType("")
        setRating("")
        setVisitCount("")
        setIsFeatured(false)
        setIsPublic(true)
        setNotes("")
        setError(null)
      }
      return
    }

    setTitle(website.title ?? "")
    setUrl(website.url ?? "")
    setSlug(website.slug ?? "")
    setDescription(website.description ?? "")
    setCategoryId(website.category?.id ?? "")
    setTagInput(website.tags.map((tag) => tag.id).join(","))
    setIsAd(Boolean(website.isAd))
    setAdType(website.adType ?? "")
    setRating(website.rating != null ? String(website.rating) : "")
    setVisitCount(website.visitCount != null ? String(website.visitCount) : "")
    setIsFeatured(Boolean(website.isFeatured))
    setIsPublic(Boolean(website.isPublic))
    setNotes(website.notes ?? "")
    setError(null)
  }, [mode, website])

  const cardTitle = mode === "create" ? "创建新网站" : "编辑网站"

  const tagSuggestions = useMemo(() => {
    if (!website) return [] as string[]
    return website.tags.map((tag) => `${tag.name} (${tag.id})`)
  }, [website])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!title.trim() || !url.trim()) {
      setError("网站标题和 URL 为必填项")
      return
    }

    const payload: WebsiteFormPayload = {
      title: title.trim(),
      url: url.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      categoryId: categoryId.trim() || undefined,
      tagIds: parseTagInput(tagInput),
      isAd,
      adType: isAd ? adType.trim() || undefined : undefined,
      rating: rating.trim() ? Number(rating) : undefined,
      visitCount: visitCount.trim() ? Number(visitCount) : undefined,
      isFeatured,
      isPublic,
      notes: notes.trim() || undefined,
    }

    if (payload.rating != null && (Number.isNaN(payload.rating) || payload.rating < 0 || payload.rating > 5)) {
      setError("评分需在 0-5 之间")
      return
    }

    if (payload.visitCount !== undefined && (Number.isNaN(payload.visitCount) || payload.visitCount < 0)) {
      setError("访问次数需为正整数")
      return
    }

    try {
      await onSubmit(payload)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败")
    }
  }

  return (
    <Card className="sticky top-24 h-fit">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {mode === "edit" && website ? (
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <WebsiteStatusBadge status={website.status} />
            <WebsiteReviewStatusBadge status={website.reviewStatus} />
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="website-title">网站标题</Label>
            <Input
              id="website-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：Next.js 官方文档"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-url">网站 URL</Label>
            <Input
              id="website-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-slug">slug（可选）</Label>
            <Input
              id="website-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="自动生成或自定义"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-description">网站描述</Label>
            <Textarea
              id="website-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="简要介绍该网站的用途、亮点等"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website-category">分类 ID（可选）</Label>
              <Input
                id="website-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                placeholder="输入分类 ID"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website-tags">标签 ID（逗号分隔）</Label>
              <Input
                id="website-tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="tag-1,tag-2,tag-3"
                disabled={submitting}
              />
              {tagSuggestions.length ? (
                <p className="text-[11px] text-muted-foreground">
                  建议：{tagSuggestions.join("、")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>是否广告位</Label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  id="website-ad"
                  type="checkbox"
                  checked={isAd}
                  onChange={(event) => setIsAd(event.target.checked)}
                  disabled={submitting}
                />
                <Label htmlFor="website-ad" className="cursor-pointer">广告投放</Label>
              </div>
              {isAd ? (
                <Input
                  value={adType}
                  onChange={(event) => setAdType(event.target.value)}
                  placeholder={`类型：${AD_TYPES.join(" / ")}`}
                  disabled={submitting}
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>精选展示</Label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  id="website-featured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  disabled={submitting}
                />
                <Label htmlFor="website-featured" className="cursor-pointer">首页精选展示</Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website-rating">评分（0-5）</Label>
              <Input
                id="website-rating"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                placeholder="例如：4.5"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website-visit">访问次数</Label>
              <Input
                id="website-visit"
                value={visitCount}
                onChange={(event) => setVisitCount(event.target.value)}
                placeholder="例如：120"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>公开可见</Label>
            <div className="flex items-center gap-2 text-sm">
              <input
                id="website-public"
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                disabled={submitting}
              />
              <Label htmlFor="website-public" className="cursor-pointer">允许在前台展示</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-notes">内部备注</Label>
            <Textarea
              id="website-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="记录审核备注、合作信息等内部备注"
              disabled={submitting}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中..." : mode === "create" ? "创建网站" : "保存修改"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function parseTagInput(value: string): string[] | undefined {
  if (!value) return undefined
  const segments = value
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  return segments.length ? Array.from(new Set(segments)) : undefined
}
