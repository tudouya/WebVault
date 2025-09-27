"use client"

import { Card, CardContent } from "@/components/ui/card"

interface TagStatsProps {
  total: number
  active: number
  inactive: number
}

const STAT_ITEMS: Array<{ key: keyof TagStatsProps; label: string }> = [
  { key: "total", label: "标签总数" },
  { key: "active", label: "启用中" },
  { key: "inactive", label: "停用中" },
]

export function TagStats({ total, active, inactive }: TagStatsProps) {
  const values: TagStatsProps = { total, active, inactive }
  return (
    <Card>
      <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
        {STAT_ITEMS.map((item) => (
          <div key={item.key} className="space-y-1">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-semibold">{values[item.key]}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
