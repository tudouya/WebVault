"use client"

import { Button } from "@/components/ui/button"

import type { WebsiteAdminListItem } from "@/features/websites/types/admin"

import { WebsiteStatusBadge } from "./website-status-badge"

interface WebsiteTableProps {
  items: WebsiteAdminListItem[]
  loading?: boolean
  error?: string | null
  page: number
  pageSize: number
  total: number
  selectedId: string | null
  onSelect: (item: WebsiteAdminListItem) => void
  onEdit: (item: WebsiteAdminListItem) => void
  onDelete: (item: WebsiteAdminListItem) => void
  onPageChange: (page: number) => void
}

export function WebsiteTable({
  items,
  loading,
  error,
  page,
  pageSize,
  total,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onPageChange,
}: WebsiteTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasMore = page < totalPages

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left font-medium">网站信息</th>
            <th className="px-4 py-2 text-left font-medium">分类</th>
            <th className="px-4 py-2 text-left font-medium">状态</th>
            <th className="px-4 py-2 text-left font-medium">访问/评分</th>
            <th className="px-4 py-2 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                正在加载网站数据...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td className="px-4 py-6 text-center text-destructive" colSpan={5}>
                {error}
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                暂无数据
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const isSelected = selectedId === item.id
              return (
                <tr
                  key={item.id}
                  className={isSelected ? "bg-primary/5" : "hover:bg-muted/40"}
                >
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => onSelect(item)}
                    >
                      <div className="font-medium text-foreground line-clamp-1">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.url}</div>
                      {item.tags.length ? (
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="rounded-full bg-muted px-2 py-0.5">
                              {tag.name}
                            </span>
                          ))}
                          {item.tags.length > 3 ? <span>…</span> : null}
                        </div>
                      ) : null}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {item.category ? (
                      <div className="text-sm text-foreground">{item.category.name}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">未分类</span>
                    )}
                    {item.isAd ? (
                      <div className="mt-1 text-[11px] text-amber-600">广告位</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <WebsiteStatusBadge status={item.status} />
                    {item.submittedBy ? (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        提交人：{item.submittedBy}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm text-foreground">{item.visitCount ?? 0} 次访问</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      更新：{new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(item)}>
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <div>
          第 {items.length ? page : 0}/{Math.max(1, Math.ceil(total / pageSize))} 页，共 {total} 条记录
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !hasMore}
            onClick={() => onPageChange(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
