"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { CollectionDetail, CollectionListItem } from "@/features/collections/types"

import { CollectionDetailCard } from "./collection-detail-card"
import { CollectionFormCard } from "./collection-form-card"
import { CollectionList } from "./collection-list"

type FeaturedFilter = "all" | "featured" | "regular"

type FormState = { mode: "create" } | { mode: "edit"; collection: CollectionDetail }

const ORDER_OPTIONS: Array<{ label: string; value: "recent" | "name" | "order" }> = [
  { label: "最近更新", value: "recent" },
  { label: "名称排序", value: "name" },
  { label: "排序值", value: "order" },
]

const FEATURE_OPTIONS: Array<{ label: string; value: FeaturedFilter }> = [
  { label: "全部", value: "all" },
  { label: "精选", value: "featured" },
  { label: "普通", value: "regular" },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50]

interface CollectionsResponse {
  data: CollectionListItem[]
  meta: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
}

export function CollectionsPage() {
  const [search, setSearch] = useState("")
  const [featured, setFeatured] = useState<FeaturedFilter>("all")
  const [orderBy, setOrderBy] = useState<"recent" | "name" | "order">("recent")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [items, setItems] = useState<CollectionListItem[]>([])
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, hasMore: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CollectionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [formState, setFormState] = useState<FormState | null>(null)

  const fetchCollections = useCallback(
    async (options?: { signal?: AbortSignal; keepSelection?: boolean }) => {
      try {
        if (!options?.signal) setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("pageSize", String(pageSize))
        params.set("orderBy", orderBy)
        if (search.trim()) params.set("search", search.trim())
        if (featured !== "all") params.set("featured", featured === "featured" ? "true" : "false")

        const response = await fetch(`/api/admin/collections?${params.toString()}`, {
          signal: options?.signal,
        })

        const payload = (await response.json().catch(() => null)) as CollectionsResponse | null

        if (!response.ok || !payload?.data || !payload.meta) {
          throw new Error("收藏集数据加载失败")
        }

        setItems(payload.data)
        setMeta(payload.meta)
        setPage(payload.meta.page)
        setPageSize(payload.meta.pageSize)

        if (!options?.keepSelection) {
          if (payload.data.length === 0) {
            setSelectedId(null)
            setDetail(null)
          } else if (!selectedId || !payload.data.some((item) => item.id === selectedId)) {
            setSelectedId(payload.data[0].id)
          }
        }
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return
        console.error("获取收藏集列表失败", fetchError)
        setError(fetchError instanceof Error ? fetchError.message : "收藏集数据加载失败")
        setItems([])
        setMeta({ page: 1, pageSize, total: 0, hasMore: false })
      } finally {
        if (!options?.signal) setLoading(false)
      }
    },
    [featured, orderBy, page, pageSize, search, selectedId]
  )

  const fetchDetail = useCallback(async (id: string, options?: { signal?: AbortSignal }) => {
    try {
      if (!options?.signal) setDetailLoading(true)
      const response = await fetch(`/api/admin/collections/${id}`, {
        signal: options?.signal,
      })

      if (response.status === 404) {
        setDetail(null)
        return
      }

      const payload = (await response.json().catch(() => null)) as { data?: CollectionDetail } | null
      if (!response.ok || !payload?.data) {
        throw new Error("收藏集详情加载失败")
      }

      setDetail(payload.data)
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") return
      console.error("获取收藏集详情失败", fetchError)
      setDetail(null)
    } finally {
      if (!options?.signal) setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchCollections({ signal: controller.signal })
    return () => controller.abort()
  }, [fetchCollections])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    const controller = new AbortController()
    fetchDetail(selectedId, { signal: controller.signal })
    return () => controller.abort()
  }, [fetchDetail, selectedId])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setFormState(null)
  }

  const handleCreate = () => {
    setFormState({ mode: "create" })
    setSelectedId(null)
    setDetail(null)
  }

  const handleEdit = (current: CollectionDetail) => {
    setFormState({ mode: "edit", collection: current })
  }

  const handleRefreshList = () => fetchCollections({ keepSelection: true })

  const handleFormSuccess = async (created: CollectionDetail) => {
    setFormState(null)
    await fetchCollections({ keepSelection: true })
    setSelectedId(created.id)
    setDetail(created)
  }

  const handleDeleted = async () => {
    setFormState(null)
    await fetchCollections({ keepSelection: false })
  }

  const handleUpdated = async (updated: CollectionDetail) => {
    setDetail(updated)
    setSelectedId(updated.id)
    await fetchCollections({ keepSelection: true })
  }

  const handleRefreshDetail = async () => {
    if (!selectedId) return
    await fetchDetail(selectedId)
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(meta.total / Math.max(meta.pageSize, 1))), [meta])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-2">
            <Label htmlFor="collection-search">搜索</Label>
            <Input
              id="collection-search"
              placeholder="按名称或 slug 搜索"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-featured-filter">精选筛选</Label>
            <Select value={featured} onValueChange={(value) => { setFeatured(value as FeaturedFilter); setPage(1) }}>
              <SelectTrigger id="collection-featured-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEATURE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-order">排序</Label>
            <Select value={orderBy} onValueChange={(value) => setOrderBy(value as "recent" | "name" | "order") }>
              <SelectTrigger id="collection-order">
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
          <div className="space-y-2">
            <Label htmlFor="collection-page-size">每页数量</Label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger id="collection-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} 条/页
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPage(1)} disabled={loading}>
              重置分页
            </Button>
            <Button onClick={() => fetchCollections()} disabled={loading}>
              {loading ? "加载中..." : "应用筛选"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)]">
        <CollectionList
          items={items}
          loading={loading}
          error={error}
          selectedId={selectedId}
          page={page}
          pageSize={pageSize}
          total={meta.total}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onRefresh={handleRefreshList}
          onPageChange={(nextPage) => {
            const safePage = Math.min(Math.max(1, nextPage), totalPages)
            setPage(safePage)
          }}
        />

        {formState ? (
          <CollectionFormCard
            mode={formState.mode}
            collection={formState.mode === "edit" ? formState.collection : null}
            onCancel={() => {
              setFormState(null)
              if (!selectedId && items.length) setSelectedId(items[0].id)
            }}
            onSuccess={handleFormSuccess}
          />
        ) : (
          <CollectionDetailCard
            collection={detail}
            loading={detailLoading}
            onEdit={(current) => handleEdit(current)}
            onDeleted={handleDeleted}
            onUpdated={handleUpdated}
            onRefresh={handleRefreshDetail}
          />
        )}
      </div>
    </div>
  )
}
