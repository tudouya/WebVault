import type { CategoryNode } from "../types"

export interface CategoryOption {
  value: string
  label: string
  level: number
}

export function flattenCategoryTree(
  nodes: CategoryNode[],
  options: { excludeId?: string } = {}
): CategoryOption[] {
  const result: CategoryOption[] = []
  const normalizedExcludeId = typeof options.excludeId === "string" ? options.excludeId.trim() : options.excludeId

  const walk = (items: CategoryNode[], level: number, ancestors: string[]) => {
    for (const item of items) {
      const rawId = typeof item.id === "string" ? item.id.trim() : item.id
      const value = rawId != null && rawId !== "" ? String(rawId) : null
      if (!value) {
        continue
      }

      const nextAncestors = [...ancestors, value]
      const isExcluded = Boolean(
        normalizedExcludeId && (value === normalizedExcludeId || ancestors.includes(normalizedExcludeId))
      )

      if (isExcluded) {
        continue
      }

      result.push({ value, label: item.name, level })

      if (item.children?.length) {
        walk(item.children, level + 1, nextAncestors)
      }
    }
  }

  walk(nodes, 0, [])
  return result
}
