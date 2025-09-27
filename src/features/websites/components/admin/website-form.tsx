"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useWebsiteFormOptions } from "@/features/websites/hooks"
import type { WebsiteAdminDetail } from "@/features/websites/types/admin"

const AD_TYPES = ["banner", "sponsored", "featured", "premium"] as const
const UNASSIGNED_CATEGORY = "__unassigned__"

export interface WebsiteFormPayload {
  title: string
  url: string
  slug?: string
  description?: string
  categoryId?: string
  tagIds?: string[]
  collectionIds?: string[]
  faviconUrl?: string | null
  screenshotUrl?: string | null
  isAd?: boolean
  adType?: string
  rating?: number | null
  visitCount?: number
  isFeatured?: boolean
  isPublic?: boolean
  notes?: string
}

export interface WebsiteFormProps {
  mode: "create" | "edit"
  website?: WebsiteAdminDetail | null
  submitting?: boolean
  onCancel?: () => void
  onSubmit: (payload: WebsiteFormPayload) => Promise<void>
  layout?: "card" | "page"
}

interface MultiSelectOption {
  id: string
  name: string
  meta?: string
}

function sanitizeText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function sanitizeUrl(value: string): string | null | undefined {
  const trimmed = value.trim()
  if (!trimmed.length) return undefined
  return trimmed
}

export function WebsiteForm({ mode, website, submitting, onCancel, onSubmit, layout = "card" }: WebsiteFormProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [tagIds, setTagIds] = useState<string[]>([])
  const [collectionIds, setCollectionIds] = useState<string[]>([])
  const [faviconUrl, setFaviconUrl] = useState("")
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [isAd, setIsAd] = useState(false)
  const [adType, setAdType] = useState("")
  const [rating, setRating] = useState("")
  const [visitCount, setVisitCount] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { categories, tags, collections, loading: optionsLoading, error: optionsError, refresh } = useWebsiteFormOptions()

  useEffect(() => {
    if (mode === "create" && !website) {
      setTitle("")
      setUrl("")
      setSlug("")
      setDescription("")
      setCategoryId("")
      setTagIds([])
      setCollectionIds([])
      setFaviconUrl("")
      setScreenshotUrl("")
      setIsAd(false)
      setAdType("")
      setRating("")
      setVisitCount("")
      setIsFeatured(false)
      setIsPublic(true)
      setNotes("")
      setError(null)
      return
    }

    if (!website) return

    setTitle(website.title ?? "")
    setUrl(website.url ?? "")
    setSlug(website.slug ?? "")
    setDescription(website.description ?? "")
    setCategoryId(website.category?.id ?? "")
    setTagIds(website.tags.map((tag) => tag.id))
    setCollectionIds(website.collections.map((collection) => collection.id))
    setFaviconUrl(website.faviconUrl ?? "")
    setScreenshotUrl(website.screenshotUrl ?? "")
    setIsAd(Boolean(website.isAd))
    setAdType(website.adType ?? "")
    setRating(website.rating != null ? String(website.rating) : "")
    setVisitCount(website.visitCount != null ? String(website.visitCount) : "")
    setIsFeatured(Boolean(website.isFeatured))
    setIsPublic(Boolean(website.isPublic))
    setNotes(website.notes ?? "")
    setError(null)
  }, [mode, website?.id, website])

  useEffect(() => {
    if (!isAd) {
      setAdType("")
    }
  }, [isAd])

  const tagLabelMap = useMemo(() => {
    const map = new Map<string, MultiSelectOption>()
    for (const option of tags) {
      map.set(option.id, { id: option.id, name: option.name, meta: option.slug })
    }
    if (website) {
      for (const tag of website.tags) {
        if (!map.has(tag.id)) {
          map.set(tag.id, { id: tag.id, name: tag.name, meta: tag.slug })
        }
      }
    }
    return map
  }, [tags, website])

  const collectionLabelMap = useMemo(() => {
    const map = new Map<string, MultiSelectOption>()
    for (const option of collections) {
      map.set(option.id, {
        id: option.id,
        name: option.name,
        meta: option.websiteCount != null ? `${option.websiteCount} 个网站` : undefined,
      })
    }
    if (website) {
      for (const collection of website.collections) {
        if (!map.has(collection.id)) {
          map.set(collection.id, { id: collection.id, name: collection.name })
        }
      }
    }
    return map
  }, [collections, website])

  const categorySelectItems = useMemo(() => {
    return categories.map((category) => ({
      id: category.id,
      label: category.path ?? category.name,
    }))
  }, [categories])

  const toggleTag = (id: string) => {
    setTagIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    )
  }

  const toggleCollection = (id: string) => {
    setCollectionIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!title.trim() || !url.trim()) {
      setError("网站标题和 URL 为必填项")
      return
    }

    const normalizedRating = rating.trim()
    if (normalizedRating) {
      const parsedRating = Number(normalizedRating)
      if (Number.isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        setError("评分需在 0-5 之间")
        return
      }
    }

    const normalizedVisit = visitCount.trim()
    if (normalizedVisit) {
      const parsedVisit = Number(normalizedVisit)
      if (!Number.isFinite(parsedVisit) || parsedVisit < 0) {
        setError("访问次数需为非负整数")
        return
      }
    }

    if (isAd && !adType.trim()) {
      setError("广告网站需指定广告类型")
      return
    }

    const payload: WebsiteFormPayload = {
      title: title.trim(),
      url: url.trim(),
      slug: sanitizeText(slug),
      description: sanitizeText(description),
      categoryId: categoryId ? categoryId : undefined,
      tagIds: tagIds.length ? Array.from(new Set(tagIds)) : [],
      collectionIds: collectionIds.length ? Array.from(new Set(collectionIds)) : [],
      faviconUrl: sanitizeUrl(faviconUrl) ?? null,
      screenshotUrl: sanitizeUrl(screenshotUrl) ?? null,
      isAd,
      adType: isAd ? sanitizeText(adType) : undefined,
      rating: normalizedRating ? Number(normalizedRating) : undefined,
      visitCount: normalizedVisit ? Math.max(0, Math.floor(Number(normalizedVisit))) : undefined,
      isFeatured,
      isPublic,
      notes: sanitizeText(notes),
    }

    try {
      await onSubmit(payload)
    } catch (submitError) {
      console.error("WebsiteForm submit", submitError)
      setError(submitError instanceof Error ? submitError.message : "提交失败，请稍后再试")
    }
  }

  const formClassName = cn("space-y-6", layout === "page" ? "max-w-3xl w-full mx-auto" : "")

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      {optionsError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <div className="flex items-center justify-between gap-4">
            <span>{optionsError}</span>
            <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={optionsLoading || submitting}>
              重试
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website-title">网站标题</Label>
          <Input
            id="website-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：WebVault"
            disabled={submitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website-url">网站 URL</Label>
          <Input
            id="website-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            disabled={submitting}
            required
            type="url"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website-slug">自定义 Slug</Label>
          <Input
            id="website-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="可选，留空自动生成"
            disabled={submitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website-category">所属分类</Label>
          <Select
            value={categoryId ? categoryId : UNASSIGNED_CATEGORY}
            onValueChange={(value) => {
              if (value === UNASSIGNED_CATEGORY) {
                setCategoryId("")
              } else {
                setCategoryId(value)
              }
            }}
            disabled={submitting || optionsLoading}
          >
            <SelectTrigger id="website-category">
              <SelectValue placeholder={optionsLoading ? "加载中..." : "选择分类（可选）"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED_CATEGORY}>未分类</SelectItem>
              {categorySelectItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website-description">网站描述</Label>
        <Textarea
          id="website-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="用于说明网站的主要功能、亮点或用途"
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">将在前台详情页展示，建议 1-2 段简洁说明。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website-favicon">Favicon URL</Label>
          <Input
            id="website-favicon"
            type="url"
            value={faviconUrl}
            onChange={(event) => setFaviconUrl(event.target.value)}
            placeholder="https://example.com/favicon.ico"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">用于在卡片和详情页展示网站图标。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website-screenshot">截图 URL</Label>
          <Input
            id="website-screenshot"
            type="url"
            value={screenshotUrl}
            onChange={(event) => setScreenshotUrl(event.target.value)}
            placeholder="https://example.com/preview.png"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">可选，在详情页展示网站预览图。</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>标签</Label>
          <MultiSelectBox
            options={tags.map((tag) => ({ id: tag.id, name: tag.name, meta: tag.slug }))}
            selectedIds={tagIds}
            optionLabelMap={tagLabelMap}
            onToggle={toggleTag}
            placeholder={optionsLoading ? "标签加载中..." : "勾选可复用的标签"}
            disabled={submitting}
          />
        </div>

        <div className="space-y-2">
          <Label>收藏集合</Label>
          <MultiSelectBox
            options={collections.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.websiteCount != null ? `${item.websiteCount} 个网站` : undefined,
            }))}
            selectedIds={collectionIds}
            optionLabelMap={collectionLabelMap}
            onToggle={toggleCollection}
            placeholder={optionsLoading ? "集合加载中..." : "选择需要同步更新的收藏集"}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>广告设置</Label>
          <div className="flex items-center gap-2 text-sm">
            <input
              id="website-is-ad"
              type="checkbox"
              checked={isAd}
              onChange={(event) => setIsAd(event.target.checked)}
              disabled={submitting}
              className="h-4 w-4"
            />
            <Label htmlFor="website-is-ad" className="cursor-pointer">
              广告投放
            </Label>
          </div>
          {isAd ? (
            <Select value={adType} onValueChange={setAdType} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="选择广告类型" />
              </SelectTrigger>
              <SelectContent>
                {AD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>首页展示</Label>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
                disabled={submitting}
              />
              <span>精选展示</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                disabled={submitting}
              />
              <span>公开可见</span>
            </label>
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
          <Label htmlFor="website-visit-count">访问次数</Label>
          <Input
            id="website-visit-count"
            value={visitCount}
            onChange={(event) => setVisitCount(event.target.value)}
            placeholder="例如：120"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website-notes">内部备注</Label>
        <Textarea
          id="website-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="记录审核说明、合作信息等内部备注"
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">仅在后台可见，不会展示给前台用户。</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            取消
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : mode === "create" ? "创建网站" : "保存修改"}
        </Button>
      </div>
    </form>
  )
}

interface MultiSelectBoxProps {
  options: MultiSelectOption[]
  selectedIds: string[]
  onToggle: (id: string) => void
  placeholder?: string
  disabled?: boolean
  optionLabelMap?: Map<string, MultiSelectOption>
}

function MultiSelectBox({
  options,
  selectedIds,
  onToggle,
  placeholder,
  disabled,
  optionLabelMap,
}: MultiSelectBoxProps) {
  const selectedOptions = useMemo(() => {
    if (!optionLabelMap) {
      return selectedIds.map((id) => ({ id, name: id }))
    }

    return selectedIds.map((id) => optionLabelMap.get(id) ?? { id, name: id })
  }, [selectedIds, optionLabelMap])

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-background">
        {options.length ? (
          <ul className="max-h-48 divide-y overflow-y-auto">
            {options.map((option) => {
              const checked = selectedIds.includes(option.id)
              return (
                <li key={option.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => onToggle(option.id)}
                      disabled={disabled}
                    />
                    <span className="flex-1 truncate text-foreground">{option.name}</span>
                    {option.meta ? (
                      <span className="text-xs text-muted-foreground">{option.meta}</span>
                    ) : null}
                  </label>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">
            {placeholder ?? "暂无可选项"}
          </div>
        )}
      </div>
      {selectedOptions.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {option.name}
              <button
                type="button"
                onClick={() => onToggle(option.id)}
                className="text-muted-foreground/80 hover:text-destructive"
                aria-label={`移除 ${option.name}`}
                disabled={disabled}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{placeholder ?? "暂无可选项"}</p>
      )}
    </div>
  )
}
