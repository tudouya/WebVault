import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import type { CategoryNode } from "../types"

interface CategoryDetailPanelProps {
  category?: CategoryNode | null
  parentName?: string
  onEdit?: (category: CategoryNode) => void
  onDelete?: (category: CategoryNode) => void
}

export function CategoryDetailPanel({ category, parentName, onEdit, onDelete }: CategoryDetailPanelProps) {
  if (!category) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>分类详情</CardTitle>
          <CardDescription>从左侧选择分类以查看详情和管理操作。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription className="mt-2 text-sm text-muted-foreground">
            {category.description || "暂无描述"}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(category)}>
            编辑
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete?.(category)}>
            删除
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <DetailRow label="Slug" value={category.slug} />
        <DetailRow label="父级分类" value={parentName ?? (category.parentId ? category.parentId : "无")} />
        <DetailRow label="排序值" value={String(category.displayOrder)} />
        <DetailRow label="状态" value={statusLabel(category.status)} />
        <DetailRow label="站点数量" value={String(category.websiteCount ?? 0)} />
        <DetailRow label="创建时间" value={formatDate(category.createdAt)} />
        <DetailRow label="更新时间" value={formatDate(category.updatedAt)} />
      </CardContent>
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  )
}

function statusLabel(status: CategoryNode["status"]): string {
  switch (status) {
    case "active":
      return "启用"
    case "inactive":
      return "停用"
    case "hidden":
      return "隐藏"
    default:
      return status
  }
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("zh-CN", {
      hour12: false,
    })
  } catch {
    return value
  }
}
