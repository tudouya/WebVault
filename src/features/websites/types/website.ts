/**
 * Website data type definitions
 * 
 * Defines the complete Website interface with all business fields
 * including advertisement, rating, and visit tracking capabilities.
 */

/**
 * Advertisement type enumeration
 */
export type AdType = 'banner' | 'sponsored' | 'featured' | 'premium';

/**
 * Website status enumeration
 */
export type WebsiteStatus = 'active' | 'inactive' | 'pending' | 'rejected';

/**
 * Core Website interface
 * 
 * Contains all fields required for website display, management,
 * and business operations including ads and analytics.
 */
export interface Website {
  /** Unique website identifier */
  id: string;
  
  /** Website display title */
  title: string;
  
  /** Website description text */
  description?: string;
  
  /** Website URL */
  url: string;
  
  /** Associated tags for categorization */
  tags: string[];
  
  /** Website favicon/icon URL */
  favicon_url?: string;
  
  /** Website screenshot URL */
  screenshot_url?: string;
  
  /** Category identifier */
  category_id?: string;
  
  /** Publication status */
  status: WebsiteStatus;
  
  /** Advertisement flag */
  isAd: boolean;
  
  /** Advertisement type (when isAd is true) */
  adType?: AdType;
  
  /** Website rating (0-5 scale) */
  rating?: number;
  
  /** Visit count tracking */
  visitCount: number;
  
  /** Featured website flag */
  is_featured: boolean;
  
  /** Public visibility flag */
  is_public: boolean;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Website creation input interface
 */
export interface WebsiteCreateInput {
  title: string;
  url: string;
  description?: string;
  category_id?: string;
  tags?: string[];
  isAd?: boolean;
  adType?: AdType;
  rating?: number;
  is_featured?: boolean;
  is_public?: boolean;
}

/**
 * Website update input interface
 */
export interface WebsiteUpdateInput extends Partial<WebsiteCreateInput> {
  id: string;
  status?: WebsiteStatus;
  visitCount?: number;
}

/**
 * Website display card props interface
 * 
 * Optimized for UI component consumption
 */
export interface WebsiteCardData {
  id: string;
  title: string;
  description?: string;
  url: string;
  favicon_url?: string;
  tags: string[];
  isAd: boolean;
  adType?: AdType;
  rating?: number;
  visitCount: number;
}

/**
 * Website filters interface for search and filtering
 */
export interface WebsiteFilters {
  category?: string;
  tags?: string[];
  status?: WebsiteStatus;
  search?: string;
  featured?: boolean;
  isAd?: boolean;
  adType?: AdType;
  minRating?: number;
}

/**
 * Website pagination interface
 */
export interface WebsitePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Website list response interface
 */
export interface WebsiteListResponse {
  websites: Website[];
  pagination: WebsitePagination;
  filters: WebsiteFilters;
}