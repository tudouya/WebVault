"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { WebsiteForm, type WebsiteFormPayload } from "./website-form"

export function WebsiteCreatePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (payload: WebsiteFormPayload) => {
    try {
      setSubmitting(true)

      const response = await fetch("/api/admin/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => null)) as { data?: { id: string }; message?: string } | null

      if (!response.ok || !result?.data?.id) {
        throw new Error(result?.message ?? "创建网站失败")
      }

      router.push(`/admin/websites?created=${result.data.id}`)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">新建网站</h1>
        <p className="text-sm text-muted-foreground">
          填写网站基础信息、关联标签与收藏集，并完成审核前的必备字段设置。
        </p>
      </header>

      <WebsiteForm
        mode="create"
        submitting={submitting}
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
        layout="page"
      />
    </div>
  )
}
