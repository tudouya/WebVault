// Website type definitions

export interface Website {
  id: string
  title: string
  url: string
  description?: string
  favicon_url?: string
  screenshot_url?: string
  category_id?: string
  tags: string[]
  is_featured: boolean
  is_public: boolean
  status: 'active' | 'inactive' | 'pending'
  visit_count: number
  created_at: string
  updated_at: string
}

export interface WebsiteCreateInput {
  title: string
  url: string
  description?: string
  category_id?: string
  tags?: string[]
  is_featured?: boolean
  is_public?: boolean
}

export interface WebsiteUpdateInput extends Partial<WebsiteCreateInput> {
  id: string
}

export interface WebsiteFilters {
  category?: string
  tags?: string[]
  status?: string
  search?: string
  featured?: boolean
}

export interface WebsitePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}