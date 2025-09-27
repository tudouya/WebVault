"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import type { WebsiteAdminDetail } from "@/features/websites/types/admin"

import { Button } from "@/components/ui/button"

import { WebsiteForm, type WebsiteFormPayload } from "./website-form"

interface DetailResponse {
  data?: WebsiteAdminDetail
  message?: string
}

interface WebsiteEditPageProps {
  websiteId: string
}

export function WebsiteEditPage({ websiteId }: WebsiteEditPageProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<WebsiteAdminDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/websites/${websiteId}`)
      const payload = (await response.json().catch(() => null)) as DetailResponse | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? "加载网站信息失败")
      }

      setDetail(payload.data)
    } catch (fetchError) {
      console.error(`加载网站 ${websiteId} 失败`, fetchError)
      setError(fetchError instanceof Error ? fetchError.message : "加载网站信息失败")
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [websiteId])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const handleSubmit = useCallback(
    async (payload: WebsiteFormPayload) => {
      try {
        setSubmitting(true)
        const response = await fetch(`/api/admin/websites/${websiteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const result = (await response.json().catch(() => null)) as DetailResponse | null

        if (!response.ok || !result?.data) {
          throw new Error(result?.message ?? "保存网站失败")
        }

        router.push(`/admin/websites/${websiteId}`)
        router.refresh()
      } catch (submitError) {
        console.error("更新网站失败", submitError)
        window.alert(submitError instanceof Error ? submitError.message : "更新网站失败")
      } finally {
        setSubmitting(false)
      }
    },
    [router, websiteId]
  )

  const handleCancel = useCallback(() => {
    if (detail) {
      router.push(`/admin/websites/${detail.id}`)
    } else {
      router.back()
    }
  }, [detail, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">编辑网站</h1>
          <p className="text-sm text-muted-foreground">正在加载网站信息...</p>
        </header>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">编辑网站</h1>
          <p className="text-sm text-destructive">{error ?? "未找到网站信息"}</p>
        </header>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/admin/websites")}>返回网站列表</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">编辑网站</h1>
        <p className="text-sm text-muted-foreground">更新网站基础信息、标签与收藏集。</p>
      </header>

      <WebsiteForm
        mode="edit"
        website={detail}
        submitting={submitting}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        layout="page"
      />
    </div>
  )
}

