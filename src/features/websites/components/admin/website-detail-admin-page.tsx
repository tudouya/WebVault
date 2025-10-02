"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import type { WebsiteAdminDetail } from "@/features/websites/types/admin"

import { Button } from "@/components/ui/button"

import { WebsiteDetailCard } from "./website-detail-card"

interface DetailResponse {
  data?: WebsiteAdminDetail
  message?: string
}

interface WebsiteDetailAdminPageProps {
  websiteId: string
}

export function WebsiteDetailAdminPage({ websiteId }: WebsiteDetailAdminPageProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<WebsiteAdminDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/websites/${websiteId}`)
      const payload = (await response.json().catch(() => null)) as DetailResponse | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? "加载网站详情失败")
      }

      setDetail(payload.data)
    } catch (fetchError) {
      console.error(`加载网站 ${websiteId} 详情失败`, fetchError)
      setError(fetchError instanceof Error ? fetchError.message : "加载网站详情失败")
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [websiteId])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const handleDelete = useCallback(
    async (current: WebsiteAdminDetail) => {
      if (!window.confirm(`确认删除「${current.title}」吗？此操作不可撤销。`)) {
        return
      }

      try {
        setActionPending(true)
        const response = await fetch(`/api/admin/websites/${current.id}`, { method: "DELETE" })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null
          throw new Error(payload?.message ?? "删除网站失败")
        }

        router.push("/admin/websites")
        router.refresh()
      } catch (deleteError) {
        console.error("删除网站失败", deleteError)
        window.alert(deleteError instanceof Error ? deleteError.message : "删除网站失败")
      } finally {
        setActionPending(false)
      }
    },
    [router]
  )

  const handleEdit = useCallback(() => {
    if (!detail) return
    router.push(`/admin/websites/${detail.id}/edit`)
  }, [detail, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">网站详情</h1>
          <p className="text-sm text-muted-foreground">正在加载网站信息...</p>
        </header>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">网站详情</h1>
          <p className="text-sm text-destructive">{error ?? "未找到网站信息"}</p>
        </header>
        <Button variant="outline" onClick={() => router.push("/admin/websites")}>返回网站列表</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{detail.title}</h1>
            <p className="text-sm text-muted-foreground">最后更新 {new Date(detail.updatedAt).toLocaleString()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/websites")}>返回列表</Button>
            <Button onClick={handleEdit} disabled={actionPending}>编辑</Button>
          </div>
        </div>
      </header>

      <WebsiteDetailCard
        website={detail}
        loading={false}
        onEdit={(current) => router.push(`/admin/websites/${current.id}/edit`)}
        onDelete={(current) => handleDelete(current)}
      />
    </div>
  )
}
