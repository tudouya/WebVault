"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { TagDetailCard } from "./tag-detail-card"
import { TagFormCard } from "./tag-form-card"
import { TagList } from "./tag-list"
import { TagStats } from "./tag-stats"
import type { TagItem, TagStatus } from "@/features/tags/types/tag"

type FormState = { mode: "create" } | { mode: "edit"; tag: TagItem }

const STATUS_OPTIONS: Array<{ label: string; value: TagStatus | "all" }> = [
  { label: "全部", value: "all" },
  { label: "启用", value: "active" },
  { label: "停用", value: "inactive" },
]

const ORDER_OPTIONS: Array<{ label: string; value: "recent" | "name" }> = [
  { label: "最近更新", value: "recent" },
  { label: "名称排序", value: "name" },
]

interface TagListResponse {
  items: TagItem[]
  total: number
  active: number
  inactive: number
}

export function TagsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<TagStatus | "all">("all")
  const [orderBy, setOrderBy] = useState<"recent" | "name">("recent")
  const [data, setData] = useState<TagListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, inactive: 0 }
    return {
      total: data.total,
      active: data.active,
      inactive: data.inactive,
    }
  }, [data])

  const fetchTags = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      try {
        if (!options?.signal) setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (status !== "all") params.set("status", status)
        if (orderBy) params.set("orderBy", orderBy)

        const response = await fetch(`/api/admin/tags?${params.toString()}`, {
          signal: options?.signal,
        })

        if (!response.ok) {
          throw new Error(`请求失败：${response.status}`)
        }

        const payload = (await response.json().catch(() => null)) as { data?: TagListResponse } | null

        if (!payload?.data) {
          throw new Error("响应数据缺失")
        }

        setData(payload.data)
      } catch (fetchError) {
        if (isAbortError(fetchError)) return
        console.error("获取标签列表失败", fetchError)
        setError("标签数据加载失败，请稍后重试")
        setData(null)
      } finally {
        if (!options?.signal) setLoading(false)
      }
    },
    [orderBy, search, status]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchTags({ signal: controller.signal })
    return () => controller.abort()
  }, [fetchTags])

  useEffect(() => {
    if (!data) {
      setSelectedId(null)
      return
    }
    if (!selectedId) return
    const exists = data.items.some((item) => item.id === selectedId)
    if (!exists) {
      setSelectedId(null)
    }
  }, [data, selectedId])

  const selectedTag = useMemo(() => data?.items.find((item) => item.id === selectedId) ?? null, [data, selectedId])

  const handleSelect = (tag: TagItem) => {
    setSelectedId(tag.id)
    setFormState(null)
  }

  const handleCreate = () => {
    setFormState({ mode: "create" })
    setSelectedId(null)
  }

  const handleEdit = (tag: TagItem) => {
    setFormState({ mode: "edit", tag })
  }

  const handleRefresh = async () => {
    await fetchTags()
  }

  const handleFormSuccess = async (tag: TagItem) => {
    await fetchTags()
    setFormState(null)
    setSelectedId(tag.id)
  }

  const handleDelete = async () => {
    await fetchTags()
    setSelectedId(null)
    setFormState(null)
  }

  const handleStatusChange = async (tag: TagItem) => {
    await fetchTags()
    setSelectedId(tag.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">标签管理</h1>
          <p className="text-sm text-muted-foreground">维护标签库，为网址和内容提供多维度标记能力。</p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          新建标签
        </Button>
      </div>

      <TagStats total={stats.total} active={stats.active} inactive={stats.inactive} />

      <FilterBar
        search={search}
        status={status}
        orderBy={orderBy}
        onSearchChange={setSearch}
        onStatusChange={(value) => setStatus(value)}
        onOrderChange={(value) => setOrderBy(value)}
        onSubmit={fetchTags}
        loading={loading}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <TagList
          tags={data?.items ?? []}
          loading={loading}
          error={error}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onRefresh={handleRefresh}
        />

        {formState ? (
          <TagFormCard
            mode={formState.mode}
            tag={formState.mode === "edit" ? formState.tag : null}
            onCancel={() => setFormState(null)}
            onSuccess={handleFormSuccess}
            onCreated={(tag) => {
              setData((prev) => {
                if (!prev) {
                  return {
                    items: [tag],
                    total: 1,
                    active: tag.status === "active" ? 1 : 0,
                    inactive: tag.status === "inactive" ? 1 : 0,
                  }
                }

                return {
                  items: [tag, ...prev.items],
                  total: prev.total + 1,
                  active: prev.active + (tag.status === "active" ? 1 : 0),
                  inactive: prev.inactive + (tag.status === "inactive" ? 1 : 0),
                }
              })
            }}
          />
        ) : (
          <TagDetailCard tag={selectedTag} onEdit={handleEdit} onDeleted={handleDelete} onStatusChanged={handleStatusChange} />
        )}
      </div>
    </div>
  )
}

interface FilterBarProps {
  search: string
  status: TagStatus | "all"
  orderBy: "recent" | "name"
  loading: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: TagStatus | "all") => void
  onOrderChange: (value: "recent" | "name") => void
  onSubmit: () => Promise<void>
}

function FilterBar({
  search,
  status,
  orderBy,
  loading,
  onSearchChange,
  onStatusChange,
  onOrderChange,
  onSubmit,
}: FilterBarProps) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <Label htmlFor="tag-search">搜索</Label>
          <Input
            id="tag-search"
            placeholder="按名称或 slug 搜索"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tag-status-filter">状态</Label>
          <Select value={status} onValueChange={(value) => onStatusChange(value as TagStatus | "all") }>
            <SelectTrigger id="tag-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tag-order">排序</Label>
          <Select value={orderBy} onValueChange={(value) => onOrderChange(value as "recent" | "name")}>
            <SelectTrigger id="tag-order">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button className="w-full" onClick={onSubmit} disabled={loading}>
            {loading ? "加载中..." : "应用"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === "AbortError"
}
