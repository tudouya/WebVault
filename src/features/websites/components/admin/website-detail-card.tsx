"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { WebsiteAdminDetail } from "@/features/websites/types/admin"

import { WebsiteStatusBadge } from "./website-status-badge"

interface WebsiteDetailCardProps {
  website: WebsiteAdminDetail | null
  loading?: boolean
  onEdit: (website: WebsiteAdminDetail) => void
  onDelete: (website: WebsiteAdminDetail) => void
}

export function WebsiteDetailCard({
  website,
  loading,
  onEdit,
  onDelete,
}: WebsiteDetailCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>网站详情</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          正在加载详情...
        </CardContent>
      </Card>
    )
  }

  if (!website) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>网站详情</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          请选择左侧网站查看详情
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex flex-col gap-2">
          <span className="text-lg font-semibold">{website.title}</span>
          <span className="text-xs text-muted-foreground break-all">{website.url}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <WebsiteStatusBadge status={website.status} />
            {website.isAd ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                广告位 {website.adType ? `· ${website.adType}` : ""}
              </span>
            ) : null}
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">分类：</span>
              {website.category ? website.category.name : "未分类"}
            </div>
            <div>
              <span className="font-semibold text-foreground">访问次数：</span>
              {website.visitCount ?? 0}
            </div>
            <div>
              <span className="font-semibold text-foreground">创建时间：</span>
              {formatDate(website.createdAt)}
            </div>
            <div>
              <span className="font-semibold text-foreground">更新时间：</span>
              {formatDate(website.updatedAt)}
            </div>
            {website.submittedBy ? (
              <div>
                <span className="font-semibold text-foreground">提交人：</span>
                {website.submittedBy}
              </div>
            ) : null}
          </div>
        </section>

        {website.description ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">网站描述</h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {website.description}
            </p>
          </section>
        ) : null}

        {website.tags.length ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">标签</h3>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {website.tags.map((tag) => (
                <span key={tag.id} className="rounded-full bg-muted px-2 py-0.5">
                  {tag.name}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {website.collections.length ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">所在收藏集</h3>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {website.collections.map((collection) => (
                <span key={collection.id} className="rounded-md border bg-background px-2 py-1">
                  {collection.name}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {website.notes ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">备注</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{website.notes}</p>
          </section>
        ) : null}

        <section className="flex flex-wrap gap-2">
          <Button variant="default" onClick={() => onEdit(website)}>
            编辑信息
          </Button>
          <Button variant="ghost" className="text-destructive" onClick={() => onDelete(website)}>
            删除网站
          </Button>
        </section>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  try {
    return new Date(value).toLocaleString()
  } catch (_error) {
    return value
  }
}
