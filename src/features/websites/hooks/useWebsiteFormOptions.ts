"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

interface CategoryOption {
  id: string
  name: string
  path: string
  depth: number
}

interface TagOption {
  id: string
  name: string
  slug?: string
  description?: string
  status?: string
}

interface CollectionOption {
  id: string
  name: string
  websiteCount?: number
}

interface WebsiteFormOptions {
  categories: CategoryOption[]
  tags: TagOption[]
  collections: CollectionOption[]
}

interface OptionsResponse {
  code?: number | string
  message?: string
  data?: WebsiteFormOptions
}

const EMPTY_OPTIONS: WebsiteFormOptions = {
  categories: [],
  tags: [],
  collections: [],
}

export function useWebsiteFormOptions() {
  const [options, setOptions] = useState<WebsiteFormOptions>(EMPTY_OPTIONS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/websites/options")
      const payload = (await response.json().catch(() => null)) as OptionsResponse | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? "加载网站选项失败")
      }

      setOptions({
        categories: payload.data.categories ?? [],
        tags: payload.data.tags ?? [],
        collections: payload.data.collections ?? [],
      })
    } catch (fetchError) {
      setOptions(EMPTY_OPTIONS)
      setError(fetchError instanceof Error ? fetchError.message : "加载选项失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOptions()
  }, [fetchOptions])

  const memoized = useMemo(
    () => ({
      categories: options.categories,
      tags: options.tags,
      collections: options.collections,
    }),
    [options.categories, options.tags, options.collections]
  )

  return {
    ...memoized,
    loading,
    error,
    refresh: fetchOptions,
  }
}

export type {
  CategoryOption as WebsiteFormCategoryOption,
  TagOption as WebsiteFormTagOption,
  CollectionOption as WebsiteFormCollectionOption,
}
