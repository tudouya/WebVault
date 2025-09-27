"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { WebsiteAdminDetail, WebsiteAdminListItem, WebsiteReviewStatus } from "@/features/websites/types/admin"
import type { WebsiteStatus } from "@/features/websites/types"

import { WebsiteDetailCard } from "./website-detail-card"
import { WebsiteFilters } from "./website-filters"
import { WebsiteFormCard, type WebsiteFormPayload } from "./website-form-card"
import { WebsiteTable } from "./website-table"

type AdFilter = "all" | "ad" | "organic"

interface ListResponse {
  data?: WebsiteAdminListItem[]
  meta?: {
    page: number
    per_page: number
    total: number
    total_pages?: number
  }
  message?: string
}

interface DetailResponse {
  data?: WebsiteAdminDetail
  message?: string
}

const DEFAULT_PAGE_SIZE = 20

type FormState = { mode: "create" } | { mode: "edit"; website: WebsiteAdminDetail }

export function WebsitesAdminPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<WebsiteStatus | "all">("all")
  const [reviewStatus, setReviewStatus] = useState<WebsiteReviewStatus | "all">("all")
  const [adFilter, setAdFilter] = useState<AdFilter>("all")

  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)

  const [items, setItems] = useState<WebsiteAdminListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<WebsiteAdminDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [formState, setFormState] = useState<FormState | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const filtersMemo = useMemo(
    () => ({ search, status, reviewStatus, adFilter }),
    [search, status, reviewStatus, adFilter]
  )

  const fetchWebsites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("perPage", String(pageSize))
      if (filtersMemo.search) params.set("search", filtersMemo.search)
      if (filtersMemo.status !== "all") params.set("status", filtersMemo.status)
      if (filtersMemo.reviewStatus !== "all") params.set("reviewStatus", filtersMemo.reviewStatus)
      if (filtersMemo.adFilter === "ad") params.set("isAd", "true")
      if (filtersMemo.adFilter === "organic") params.set("isAd", "false")

      const response = await fetch(`/api/admin/websites?${params.toString()}`)
      const payload = (await response.json().catch(() => null)) as ListResponse | null

      if (!response.ok || !payload?.data || !payload?.meta) {
        throw new Error(payload?.message ?? "获取网站列表失败")
      }

      setItems(payload.data)
      setTotal(payload.meta.total)

      if (payload.meta.page !== page) {
        setPage(payload.meta.page)
      }

      if (payload.data.length && selectedId) {
        const stillExists = payload.data.some((item) => item.id === selectedId)
        if (!stillExists) {
          setSelectedId(null)
          setSelectedDetail(null)
        }
      }
    } catch (fetchError) {
      console.error("加载网站列表失败", fetchError)
      setError(fetchError instanceof Error ? fetchError.message : "加载网站列表失败")
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filtersMemo, page, pageSize, selectedId])

  useEffect(() => {
    void fetchWebsites()
  }, [fetchWebsites])

  const loadDetail = useCallback(
    async (id: string, options?: { openForm?: boolean }) => {
      try {
        setDetailLoading(true)
        setSelectedId(id)
        const response = await fetch(`/api/admin/websites/${id}`)
        const payload = (await response.json().catch(() => null)) as DetailResponse | null

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.message ?? "加载网站详情失败")
        }

        setSelectedDetail(payload.data)
        if (options?.openForm) {
          setFormState({ mode: "edit", website: payload.data })
        }
      } catch (detailError) {
        console.error("加载网站详情失败", detailError)
        setSelectedDetail(null)
      } finally {
        setDetailLoading(false)
      }
    },
    []
  )

  const handleSelect = useCallback(
    (item: WebsiteAdminListItem) => {
      void loadDetail(item.id)
    },
    [loadDetail]
  )

  const handleEdit = useCallback(
    (item: WebsiteAdminListItem) => {
      void loadDetail(item.id, { openForm: true })
    },
    [loadDetail]
  )

  const handleDelete = useCallback(
    async (item: WebsiteAdminListItem | WebsiteAdminDetail) => {
      if (!window.confirm(`确认删除「${item.title}」吗？此操作不可撤销。`)) {
        return
      }

      try {
        const response = await fetch(`/api/admin/websites/${item.id}`, { method: "DELETE" })
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null
          throw new Error(payload?.message ?? "删除网站失败")
        }

        if (selectedId === item.id) {
          setSelectedId(null)
          setSelectedDetail(null)
        }

        await fetchWebsites()
      } catch (deleteError) {
        console.error("删除网站失败", deleteError)
        window.alert(deleteError instanceof Error ? deleteError.message : "删除网站失败")
      }
    },
    [fetchWebsites, selectedId]
  )

  const handleReviewChange = useCallback(
    async (detail: WebsiteAdminDetail, review: WebsiteReviewStatus) => {
      try {
        const response = await fetch(`/api/admin/websites/${detail.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewStatus: review }),
        })

        const payload = (await response.json().catch(() => null)) as DetailResponse | null

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.message ?? "更新审核状态失败")
        }

        setSelectedDetail(payload.data)
        await fetchWebsites()
      } catch (error) {
        console.error("更新审核状态失败", error)
        window.alert(error instanceof Error ? error.message : "更新审核状态失败")
      }
    },
    [fetchWebsites]
  )

  const handleSubmit = useCallback(
    async (payload: WebsiteFormPayload) => {
      const current = formState
      if (!current) return

      const isEdit = current.mode === "edit"
      const endpoint = isEdit ? `/api/admin/websites/${current.website.id}` : "/api/admin/websites"
      const method = isEdit ? "PUT" : "POST"

      try {
        setFormSubmitting(true)
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const result = (await response.json().catch(() => null)) as DetailResponse | null

        if (!response.ok || !result?.data) {
          throw new Error(result?.message ?? "保存网站失败")
        }

        setFormState(null)
        setSelectedId(result.data.id)
        setSelectedDetail(result.data)
        await fetchWebsites()
      } finally {
        setFormSubmitting(false)
      }
    },
    [fetchWebsites, formState]
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(Math.max(1, nextPage))
    },
    []
  )

  const handleApplyFilters = useCallback(() => {
    setPage(1)
  }, [])

  const handleCreate = useCallback(() => {
    setFormState({ mode: "create" })
  }, [])

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">网站管理</h1>
        <p className="text-sm text-muted-foreground">
          管理收录的网站资源，支持新增、编辑、审核与删除操作。
        </p>
      </header>

      <WebsiteFilters
        search={search}
        status={status}
        reviewStatus={reviewStatus}
        adFilter={adFilter}
        loading={loading}
        onSearchChange={setSearch}
        onStatusChange={(value) => {
          setStatus(value)
        }}
        onReviewStatusChange={(value) => {
          setReviewStatus(value)
        }}
        onAdFilterChange={(value) => {
          setAdFilter(value)
        }}
        onApply={handleApplyFilters}
        onCreate={handleCreate}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <WebsiteTable
            items={items}
            loading={loading}
            error={error}
            page={page}
            pageSize={pageSize}
            total={total}
            selectedId={selectedId}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        </div>

        {formState ? (
          <WebsiteFormCard
            mode={formState.mode}
            website={formState.mode === "edit" ? formState.website : undefined}
            submitting={formSubmitting}
            onCancel={() => setFormState(null)}
            onSubmit={handleSubmit}
          />
        ) : (
          <WebsiteDetailCard
            website={selectedDetail}
            loading={detailLoading}
            onEdit={(detail) => setFormState({ mode: "edit", website: detail })}
            onDelete={handleDelete}
            onReviewChange={handleReviewChange}
          />
        )}
      </div>
    </div>
  )
}
