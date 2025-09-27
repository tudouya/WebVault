export interface CollectionListItem {
  id: string
  name: string
  slug: string
  description?: string
  coverImage?: string
  isFeatured: boolean
  displayOrder: number
  websiteCount: number
  createdAt: string
  updatedAt: string
}

export interface CollectionListParams {
  page?: number
  pageSize?: number
  search?: string
  featured?: boolean | "all"
  orderBy?: "recent" | "name" | "order"
}

export interface CollectionListResult {
  items: CollectionListItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface CollectionItemDetail {
  id: string
  websiteId: string
  position: number
  note?: string | null
  createdAt: string
  website?: {
    id: string
    title: string
    url: string
    faviconUrl?: string | null
  }
}

export interface CollectionDetail extends CollectionListItem {
  items: CollectionItemDetail[]
}

export interface CollectionItemInput {
  websiteId: string
  note?: string | null
  position?: number
}

export interface CollectionCreateInput {
  name: string
  slug?: string
  description?: string
  coverImage?: string
  isFeatured?: boolean
  displayOrder?: number
  items?: CollectionItemInput[]
}

export interface CollectionUpdateInput {
  name?: string
  slug?: string | null
  description?: string | null
  coverImage?: string | null
  isFeatured?: boolean
  displayOrder?: number
}

export interface CollectionItemsReplaceInput {
  items: CollectionItemInput[]
}

