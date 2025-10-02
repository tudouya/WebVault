import type { AdType, WebsiteStatus } from "./website"

export interface WebsiteTagSummary {
  id: string
  name: string
  slug?: string
}

export interface WebsiteCategorySummary {
  id: string
  name: string
  slug?: string
}

export interface WebsiteCollectionSummary {
  id: string
  name: string
  position?: number
}

export interface WebsiteAdminListItem {
  id: string
  title: string
  slug?: string | null
  url: string
  description?: string | null
  category?: WebsiteCategorySummary | null
  tags: WebsiteTagSummary[]
  isAd: boolean
  adType?: AdType | null
  rating?: number | null
  visitCount: number
  isFeatured: boolean
  status: WebsiteStatus
  submittedBy?: string | null
  notes?: string | null
  faviconUrl?: string | null
  screenshotUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface WebsiteAdminDetail extends WebsiteAdminListItem {
  faviconUrl?: string | null
  screenshotUrl?: string | null
  collections: WebsiteCollectionSummary[]
  submissionId?: string | null
  submissionPayload?: unknown
}

export interface WebsiteAdminListParams {
  search?: string
  status?: WebsiteStatus | "all"
  categoryId?: string
  tagId?: string
  isFeatured?: boolean
  isAd?: boolean
  adType?: AdType | "all"
  includeAds?: boolean
  minRating?: number
  submittedBy?: string
  orderBy?: "recent" | "updated" | "title" | "visits" | "rating"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface WebsiteAdminListResult {
  items: WebsiteAdminListItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface WebsiteAdminCreateInput {
  title: string
  url: string
  slug?: string
  description?: string
  categoryId?: string | null
  tagIds?: string[]
  collectionIds?: string[]
  isAd?: boolean
  adType?: AdType
  rating?: number
  visitCount?: number
  isFeatured?: boolean
  status?: WebsiteStatus
  faviconUrl?: string | null
  screenshotUrl?: string | null
  notes?: string
  submittedBy?: string
  submissionId?: string
}

export type WebsiteAdminUpdateInput = Partial<WebsiteAdminCreateInput>

export interface WebsiteStatusUpdateInput {
  status?: WebsiteStatus
  isFeatured?: boolean
  notes?: string | null
}
