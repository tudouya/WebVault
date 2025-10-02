export type CategoryStatus = "active" | "inactive" | "hidden"

export interface CategoryNode {
  id: string
  name: string
  slug: string
  description?: string
  parentId: string | null
  icon?: string
  color?: string
  displayOrder: number
  status: CategoryStatus
  children?: CategoryNode[]
  directWebsiteCount?: number
  websiteCount?: number
  createdAt: string
  updatedAt: string
}

export interface CategoryStatsSummary {
  total: number
  active: number
  topLevel: number
  hidden: number
}

export interface CategoryListPayload {
  tree: CategoryNode[]
  stats: CategoryStatsSummary
}
