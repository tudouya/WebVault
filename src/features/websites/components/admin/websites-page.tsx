"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { WebsiteAdminListItem } from "@/features/websites/types/admin"
import type { WebsiteStatus } from "@/features/websites/types"

import { WebsiteFilters } from "./website-filters"
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

const DEFAULT_PAGE_SIZE = 20

export function WebsitesAdminPage() {
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<WebsiteStatus | "all">("all")
  const [adFilter, setAdFilter] = useState<AdFilter>("all")

  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)

  const [items, setItems] = useState<WebsiteAdminListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtersMemo = useMemo(
    () => ({ search, status, adFilter }),
    [search, status, adFilter]
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
    } catch (fetchError) {
      console.error("加载网站列表失败", fetchError)
      setError(fetchError instanceof Error ? fetchError.message : "加载网站列表失败")
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filtersMemo, page, pageSize])

  useEffect(() => {
    void fetchWebsites()
  }, [fetchWebsites])

  const handleSelect = useCallback(
    (item: WebsiteAdminListItem) => {
      setSelectedId(item.id)
      router.push(`/admin/websites/${item.id}`)
    },
    [router]
  )

  const handleEdit = useCallback(
    (item: WebsiteAdminListItem) => {
      router.push(`/admin/websites/${item.id}/edit`)
    },
    [router]
  )

  const handleDelete = useCallback(
    async (item: WebsiteAdminListItem) => {
      if (!window.confirm(`确认删除「${item.title}」吗？此操作不可撤销。`)) {
        return
      }

      try {
        const response = await fetch(`/api/admin/websites/${item.id}`, { method: "DELETE" })
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null
          throw new Error(payload?.message ?? "删除网站失败")
        }

        await fetchWebsites()
      } catch (deleteError) {
        console.error("删除网站失败", deleteError)
        window.alert(deleteError instanceof Error ? deleteError.message : "删除网站失败")
      }
    },
    [fetchWebsites]
  )

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage))
  }, [])

  const handleApplyFilters = useCallback(() => {
    setPage(1)
  }, [])

  const handleCreate = useCallback(() => {
    router.push("/admin/websites/new")
  }, [router])

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
        adFilter={adFilter}
        loading={loading}
        onSearchChange={setSearch}
        onStatusChange={(value) => setStatus(value)}
        onAdFilterChange={(value) => setAdFilter(value)}
        onApply={handleApplyFilters}
        onCreate={handleCreate}
      />

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
  )
}
