"use client"

import { useCallback, useEffect, useState } from "react"

import type { CategoryNode } from "@/features/categories/types"

interface UseHomepageCategoryTreeState {
  categories: CategoryNode[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useHomepageCategoryTree(): UseHomepageCategoryTreeState {
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1)
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function fetchCategories() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/categories?status=active", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!isMounted) return

        await handleResponse(response)
      } catch (err) {
        if (!isMounted) return
        if (err instanceof DOMException && err.name === "AbortError") {
          return
        }

        const message = err instanceof Error ? err.message : "分类数据加载失败"
        setCategories([])
        setError(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    const handleResponse = async (response: Response) => {
      if (!isMounted) return

      const contentType = response.headers.get("content-type") ?? ""
      const isJSON = contentType.includes("application/json")

      if (!isJSON) {
        setCategories([])
        setError("分类数据加载失败")
        return
      }

      const payload = await response.json()

      if (response.ok && payload && typeof payload === "object" && payload.code === 0) {
        const tree = Array.isArray(payload.data?.tree) ? payload.data.tree : []
        setCategories(tree)
        setError(null)
        return
      }

      const message = extractMessage(payload) ?? "分类数据加载失败"
      setCategories([])
      setError(message)
    }

    fetchCategories()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [refreshToken])

  return {
    categories,
    isLoading,
    error,
    refresh,
  }
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const record = data as Record<string, unknown>
  if (typeof record.code === "number" && record.code !== 0 && typeof record.message === "string") {
    return record.message
  }
  if (typeof record.message === "string") return record.message
  if (typeof record.detail === "string") return record.detail
  if (typeof record.error === "string") return record.error
  if (record.errors && typeof record.errors === "object") {
    const errors = record.errors as Record<string, unknown>
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && value[0] && typeof value[0] === "string") {
        return value[0]
      }
    }
  }
  return null
}
