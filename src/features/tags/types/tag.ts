export type TagStatus = "active" | "inactive";

export interface TagItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  status: TagStatus;
  websiteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagListPayload {
  items: TagItem[];
  total: number;
  active: number;
  inactive: number;
}

export interface TagCreateInput {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  status?: TagStatus;
}

export interface TagUpdateInput {
  name?: string;
  slug?: string | null;
  description?: string | null;
  color?: string | null;
  status?: TagStatus;
}

export interface TagFilters {
  search?: string;
  status?: TagStatus | "all";
}
