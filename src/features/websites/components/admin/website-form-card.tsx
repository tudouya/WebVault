"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { WebsiteForm, type WebsiteFormPayload } from "./website-form"
import { WebsiteReviewStatusBadge, WebsiteStatusBadge } from "./website-status-badge"

import type { WebsiteAdminDetail } from "@/features/websites/types/admin"

interface WebsiteFormCardProps {
  mode: "create" | "edit"
  website?: WebsiteAdminDetail | null
  submitting?: boolean
  onCancel: () => void
  onSubmit: (payload: WebsiteFormPayload) => Promise<void>
}

export function WebsiteFormCard({ mode, website, submitting, onCancel, onSubmit }: WebsiteFormCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-lg font-semibold">
            {mode === "create" ? "创建新网站" : "编辑网站"}
          </CardTitle>
          {website ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <WebsiteStatusBadge status={website.status} />
              <WebsiteReviewStatusBadge status={website.reviewStatus} />
              {website.isFeatured ? (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  精选展示
                </span>
              ) : null}
              {website.isAd ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  广告位{website.adType ? ` · ${website.adType}` : ""}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {website ? (
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="truncate">{website.url}</span>
            <span>提交人：{website.submittedBy ?? "-"}</span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <WebsiteForm
          mode={mode}
          website={website}
          submitting={submitting}
          onCancel={onCancel}
          onSubmit={onSubmit}
          layout="card"
        />
      </CardContent>
    </Card>
  )
}

export type { WebsiteFormPayload }
