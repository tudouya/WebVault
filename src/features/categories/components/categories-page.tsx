"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { mockCategoryStats, mockCategoryTree } from "../data/mock-categories"
import type { CategoryListPayload, CategoryNode, CategoryStatus } from "../types"
import { CategoryFormCard } from "./category-form-card"
import { CategoryDetailPanel } from "./category-detail-panel"
import { CategoryFilters } from "./category-filters"
import { CategoryStats } from "./category-stats"
import { CategoryTreePanel } from "./category-tree-panel"

type FormState =
  | { type: "create" }
  | { type: "edit"; category: CategoryNode }

export function CategoriesPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CategoryStatus | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandInstruction, setExpandInstruction] = useState<{ expand: boolean; nonce: number } | null>(null)
  const [data, setData] = useState<CategoryListPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)

  const fetchCategories = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      try {
        if (!options?.signal) {
          setLoading(true)
        }
        setError(null)

        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (status !== "all") params.set("status", status)

        const response = await fetch(`/api/admin/categories?${params.toString()}`, {
          signal: options?.signal,
        })

        if (!response.ok) {
          throw new Error(`请求失败：${response.status}`)
        }

        const payload = (await response.json()) as { data?: CategoryListPayload }
        const value: CategoryListPayload = payload?.data ?? { tree: mockCategoryTree, stats: mockCategoryStats }
        setData(value)
      } catch (fetchError) {
        if (isAbortError(fetchError)) return
        console.error(fetchError)
        setError("分类数据加载失败，将使用演示数据")
        setData({ tree: mockCategoryTree, stats: mockCategoryStats })
      } finally {
        if (!options?.signal) {
          setLoading(false)
        }
      }
    },
    [search, status]
  )

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchCategories({ signal: controller.signal }).finally(() => {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    })
    return () => controller.abort()
  }, [fetchCategories])

  const treeData = data?.tree ?? mockCategoryTree
  const stats = data?.stats ?? mockCategoryStats

  const selectedCategory = useMemo(() => {
    if (!selectedId) return null
    const stack = [...treeData]
    while (stack.length) {
      const node = stack.pop()!
      if (node.id === selectedId) return node
      if (node.children) stack.push(...node.children)
    }
    return null
  }, [selectedId, treeData])

  const selectedParentName = useMemo(() => {
    if (!selectedCategory?.parentId) return undefined
    const stack = [...treeData]
    while (stack.length) {
      const node = stack.pop()!
      if (node.id === selectedCategory.parentId) return node.name
      if (node.children) stack.push(...node.children)
    }
    return undefined
  }, [selectedCategory, treeData])

  useEffect(() => {
    if (!selectedId) return
    const exists = treeData.some((node) => findNode(node, selectedId))
    if (!exists) {
      setSelectedId(null)
    }
  }, [treeData, selectedId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">分类管理</h1>
          <p className="text-sm text-muted-foreground">维护分类树结构，为网站提交流程提供可选项。</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setFormState({ type: "create" })
            setSelectedId(null)
          }}
        >
          新建分类
        </Button>
      </div>

      <CategoryStats stats={stats} />

      <CategoryFilters
        onSearch={setSearch}
        onStatusChange={setStatus}
        onToggleExpandAll={(expand) => setExpandInstruction({ expand, nonce: Date.now() })}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>分类结构</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>加载分类数据中...</p>
              </div>
            ) : (
              <CategoryTreePanel
                categories={treeData}
                selectedId={selectedId}
                onSelect={(id) => {
                  setFormState(null)
                  setSelectedId(id)
                }}
                expandInstruction={expandInstruction}
              />
            )}
            {error ? <p className="mt-4 text-sm text-amber-600">{error}</p> : null}
          </CardContent>
        </Card>
        {formState ? (
          <CategoryFormCard
            mode={formState.type}
            category={formState.type === "edit" ? formState.category : undefined}
            categories={treeData}
            onCancel={() => setFormState(null)}
            onSuccess={async (updatedCategory) => {
              const isCreateMode = formState?.type === "create"
              await fetchCategories()
              if (isCreateMode) {
                setExpandInstruction({ expand: true, nonce: Date.now() })
              }
              setFormState(null)
              setSelectedId(updatedCategory.id)
            }}
          />
        ) : (
          <CategoryDetailPanel
            category={selectedCategory}
            parentName={selectedParentName}
            onEdit={(category) => setFormState({ type: "edit", category })}
            onDelete={async (category) => {
              const confirmDelete = window.confirm(
                `确认删除分类 “${category.name}” 吗？如果存在子分类，请先调整结构。`
              )
              if (!confirmDelete) return

              try {
                const response = await fetch(`/api/admin/categories/${category.id}`, {
                  method: "DELETE",
                  headers: {
                    Accept: "application/json",
                  },
                })

                const result = (await response.json().catch(() => null)) as { message?: string } | null

                if (!response.ok) {
                  const message = result?.message ?? "删除分类失败"
                  window.alert(message)
                  return
                }

                await fetchCategories()
                setSelectedId(null)
              } catch (deleteError) {
                console.error("删除分类失败", deleteError)
                window.alert("删除分类失败，请稍后再试")
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

function findNode(node: CategoryNode, targetId: string): boolean {
  if (node.id === targetId) return true
  if (!node.children) return false
  return node.children.some((child) => findNode(child, targetId))
}

function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === "AbortError"
}
