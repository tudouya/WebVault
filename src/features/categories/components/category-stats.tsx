import { Activity, EyeOff, Layers, ListTree } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { CategoryStatsSummary } from "../types"

const statsIconMap = {
  total: Layers,
  active: Activity,
  topLevel: ListTree,
  hidden: EyeOff,
}

const statsLabelMap: Record<keyof CategoryStatsSummary, string> = {
  total: "分类总数",
  active: "启用分类",
  topLevel: "一级分类",
  hidden: "隐藏分类",
}

interface CategoryStatsProps {
  stats: CategoryStatsSummary
}

export function CategoryStats({ stats }: CategoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(stats) as (keyof CategoryStatsSummary)[]).map((key) => {
        const Icon = statsIconMap[key]
        return (
          <Card key={key} className="border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {statsLabelMap[key]}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stats[key]}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

