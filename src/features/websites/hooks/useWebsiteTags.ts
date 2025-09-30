"use client"

import { useCallback, useEffect, useState } from "react"

import type { TagItem } from "@/features/tags/types/tag"
import { extractApiErrorMessage } from "../utils"

interface UseWebsiteTagsState {
  tags: TagItem[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useWebsiteTags(status: "active" | "inactive" | "all" = "active"): UseWebsiteTagsState {
  const [tags, setTags] = useState<TagItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1)
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchTags = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set("status", status)
        params.set("orderBy", "name")

        const response = await fetch(`/api/tags?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        })

        if (!isMounted) return

        const contentType = response.headers.get("content-type") ?? ""
        if (!contentType.includes("application/json")) {
          setTags([])
          setError("标签数据加载失败")
          return
        }

        const payload = await response.json()

        if (response.ok && payload && typeof payload === "object" && payload.code === 0) {
          const items = Array.isArray(payload.data?.items) ? (payload.data.items as TagItem[]) : []
          setTags(items)
          setError(null)
          return
        }

        const message = extractApiErrorMessage(payload) ?? "标签数据加载失败"
        setTags([])
        setError(message)
      } catch (err) {
        if (!isMounted) return
        if (err instanceof DOMException && err.name === "AbortError") {
          return
        }

        const message = err instanceof Error ? err.message : "标签数据加载失败"
        setTags([])
        setError(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchTags()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [status, refreshToken])

  return {
    tags,
    isLoading,
    error,
    refresh,
  }
}
