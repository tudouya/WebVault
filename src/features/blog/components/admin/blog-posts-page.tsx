"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { BlogPostDetail, BlogPostListFilters, BlogPostListItem, BlogPostStatus } from "@/features/blog/types"

import { BlogPostDetailCard } from "./blog-post-detail-card"
import { BlogPostFilters } from "./blog-post-filters"
import { BlogPostFormCard, type BlogPostPayload } from "./blog-post-form-card"
import { BlogPostTable } from "./blog-post-table"

type FormState = { mode: "create" } | { mode: "edit"; post: BlogPostDetail }

interface ListResponse {
  data?: BlogPostListItem[]
  meta?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  message?: string
}

interface DetailResponse {
  data?: BlogPostDetail
  message?: string
}

const DEFAULT_PAGE_SIZE = 10

export function BlogPostsAdminPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<BlogPostStatus | "all">("all")
  const [orderBy, setOrderBy] = useState<NonNullable<BlogPostListFilters["orderBy"]>>("recent")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)

  const [items, setItems] = useState<BlogPostListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<BlogPostDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [formState, setFormState] = useState<FormState | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (status !== "all") params.set("status", status)
      if (orderBy) params.set("orderBy", orderBy)
      params.set("page", String(page))
      params.set("perPage", String(pageSize))

      const response = await fetch(`/api/admin/blog-posts?${params.toString()}`)
      const payload = (await response.json().catch(() => null)) as ListResponse | null

      if (!response.ok || !payload?.data || !payload.meta) {
        throw new Error(payload?.message ?? "获取文章列表失败")
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
      console.error("加载博客文章列表失败", fetchError)
      setError(fetchError instanceof Error ? fetchError.message : "加载博客文章失败")
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [orderBy, page, pageSize, search, selectedId, status])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  const loadDetail = useCallback(
    async (id: string, options?: { openForm?: boolean }) => {
      try {
        setDetailLoading(true)
        setSelectedId(id)
        const response = await fetch(`/api/admin/blog-posts/${id}`)
        const payload = (await response.json().catch(() => null)) as DetailResponse | null

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.message ?? "加载文章详情失败")
        }

        setSelectedDetail(payload.data)
        if (options?.openForm) {
          setFormState({ mode: "edit", post: payload.data })
        }
      } catch (detailError) {
        console.error("加载文章详情失败", detailError)
        setSelectedDetail(null)
      } finally {
        setDetailLoading(false)
      }
    },
    []
  )

  const handleSelect = useCallback(
    (item: BlogPostListItem) => {
      void loadDetail(item.id)
    },
    [loadDetail]
  )

  const handleCreate = () => {
    setFormState({ mode: "create" })
    setSelectedDetail(null)
    setSelectedId(null)
  }

  const handleEdit = (item: BlogPostListItem) => {
    void loadDetail(item.id, { openForm: true })
  }

  const handleEditFromDetail = (detail: BlogPostDetail) => {
    setSelectedDetail(detail)
    setFormState({ mode: "edit", post: detail })
  }

  const handleStatusChange = async (item: BlogPostListItem | BlogPostDetail, nextStatus: BlogPostStatus) => {
    const confirmed = nextStatus === "published" ? true : window.confirm(`确定将文章状态修改为“${STATUS_MESSAGES[nextStatus]}”吗？`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/blog-posts/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          publishedAt: nextStatus === "published" ? new Date().toISOString() : undefined,
        }),
      })

      const payload = (await response.json().catch(() => null)) as DetailResponse | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? "更新文章状态失败")
      }

      await fetchPosts()
      setSelectedDetail(payload.data)
      setSelectedId(payload.data.id)
    } catch (error) {
      console.error("更新文章状态失败", error)
      window.alert(error instanceof Error ? error.message : "更新文章状态失败")
    }
  }

  const handleDelete = async (item: BlogPostListItem | BlogPostDetail) => {
    const confirmed = window.confirm(`确定删除文章“${item.title}”吗？操作不可逆。`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/blog-posts/${item.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message ?? "删除文章失败")
      }

      if (selectedId === item.id) {
        setSelectedId(null)
        setSelectedDetail(null)
      }

      await fetchPosts()
    } catch (error) {
      console.error("删除文章失败", error)
      window.alert(error instanceof Error ? error.message : "删除文章失败")
    }
  }

  const handleSubmit = async (payload: BlogPostPayload) => {
    const isEdit = formState?.mode === "edit" && formState.post
    const endpoint = isEdit ? `/api/admin/blog-posts/${formState.post.id}` : "/api/admin/blog-posts"
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
        throw new Error(result?.message ?? "保存文章失败")
      }

      setFormState(null)
      await fetchPosts()
      setSelectedDetail(result.data)
      setSelectedId(result.data.id)
    } catch (error) {
      console.error("提交文章失败", error)
      throw error instanceof Error ? error : new Error("提交文章失败")
    } finally {
      setFormSubmitting(false)
    }
  }

  const filtersMeta = useMemo(
    () => ({ search, status, orderBy }),
    [orderBy, search, status]
  )

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">博客文章管理</h1>
        <p className="text-sm text-muted-foreground">
          管理博客文章的内容、发布状态与标签信息，支持草稿保存与即时发布。
        </p>
      </header>

      <BlogPostFilters
        search={filtersMeta.search}
        status={filtersMeta.status}
        orderBy={filtersMeta.orderBy}
        loading={loading}
        onSearchChange={(value) => {
          setSearch(value)
        }}
        onStatusChange={(value) => {
          setStatus(value)
          setPage(1)
        }}
        onOrderChange={(value) => {
          setOrderBy(value)
          setPage(1)
        }}
        onApply={() => fetchPosts()}
        onCreate={handleCreate}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <BlogPostTable
          items={items}
          loading={loading}
          error={error}
          page={page}
          pageSize={pageSize}
          total={total}
          selectedId={selectedId}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onPageChange={(nextPage) => {
            setPage(nextPage)
          }}
        />

        {formState ? (
          <BlogPostFormCard
            mode={formState.mode}
            post={formState.mode === "edit" ? formState.post : undefined}
            submitting={formSubmitting}
            onCancel={() => setFormState(null)}
            onSubmit={handleSubmit}
          />
        ) : (
          <BlogPostDetailCard
            post={selectedDetail}
            loading={detailLoading}
            onEdit={handleEditFromDetail}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

const STATUS_MESSAGES: Record<BlogPostStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
}
