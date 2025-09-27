import { NextResponse } from "next/server"

import { categoriesService } from "@/lib/services/categoriesService"
import { collectionsService } from "@/lib/services/collectionsService"
import { tagsService } from "@/lib/services/tagsService"

import type { CategoryNode } from "@/features/categories/types"
import type { CollectionListItem } from "@/features/collections/types"

export const runtime = "edge"

interface OptionsPayload {
  categories: Array<{ id: string; name: string; path: string; depth: number }>
  tags: Array<{ id: string; name: string; slug?: string; description?: string; status: string }>
  collections: Array<{ id: string; name: string; websiteCount?: number }>
}

export async function GET() {
  try {
    const [categoryResult, tagsResult, allCollections] = await Promise.all([
      categoriesService.list({ status: "all" }),
      tagsService.list({ status: "all" }),
      fetchAllCollections(),
    ])

    const categories = flattenCategories(categoryResult.tree)
    const tags = tagsResult.items.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description ?? undefined,
      status: tag.status,
    }))
    const collections = allCollections.map((item) => ({
      id: item.id,
      name: item.name,
      websiteCount: item.websiteCount,
    }))

    const payload: OptionsPayload = {
      categories,
      tags,
      collections,
    }

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: payload,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/websites/options", error)
    return NextResponse.json(
      {
        code: "internal_error",
        message: "加载网站选项失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

function flattenCategories(nodes: CategoryNode[], trail: string[] = [], depth = 0) {
  const result: Array<{ id: string; name: string; path: string; depth: number }> = []

  for (const node of nodes) {
    const currentPath = [...trail, node.name]
    result.push({
      id: node.id,
      name: node.name,
      path: currentPath.join(" / "),
      depth,
    })

    if (node.children?.length) {
      result.push(...flattenCategories(node.children, currentPath, depth + 1))
    }
  }

  return result
}

async function fetchAllCollections() {
  const pageSize = 100
  let page = 1
  let hasMore = true
  const items: CollectionListItem[] = []

  while (hasMore) {
    const result = await collectionsService.list({ page, pageSize, orderBy: "name" })
    items.push(...result.items)
    hasMore = result.hasMore
    page += 1

    if (!hasMore) {
      break
    }
  }

  return items
}

