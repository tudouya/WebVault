"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { CategoryStatus } from "../types"

interface CategoryFiltersProps {
  onSearch?: (value: string) => void
  onStatusChange?: (status: CategoryStatus | "all") => void
  onToggleExpandAll?: (expand: boolean) => void
}

export function CategoryFilters({
  onSearch,
  onStatusChange,
  onToggleExpandAll,
}: CategoryFiltersProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CategoryStatus | "all">("all")

  return (
    <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <Label htmlFor="category-search">搜索分类</Label>
        <Input
          id="category-search"
          placeholder="输入分类名称或描述"
          className="mt-2"
          value={search}
          onChange={(event) => {
            const value = event.target.value
            setSearch(value)
            onSearch?.(value)
          }}
        />
      </div>

      <div>
        <Label htmlFor="category-status">状态过滤</Label>
        <Select
          value={status}
          onValueChange={(value) => {
            const next = value as CategoryStatus | "all"
            setStatus(next)
            onStatusChange?.(next)
          }}
        >
          <SelectTrigger id="category-status" className="mt-2">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
            <SelectItem value="hidden">隐藏</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => onToggleExpandAll?.(true)}
        >
          展开全部
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => onToggleExpandAll?.(false)}
        >
          收起全部
        </Button>
      </div>
    </div>
  )
}

