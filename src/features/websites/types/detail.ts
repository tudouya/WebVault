/**
 * Website detail page type definitions
 * 
 * Defines types for website detail page functionality including
 * comprehensive website information, publisher data, and navigation.
 */

import type { Website, WebsiteCardData } from './website'
import type { Category } from './category'

/**
 * Publisher/Author information interface
 * 
 * Contains information about who published or submitted the website
 */
export interface PublisherInfo {
  /** Publisher/Author unique identifier */
  id: string;
  
  /** Publisher display name */
  name: string;
  
  /** Publisher avatar URL */
  avatar_url?: string;
  
  /** Publisher bio/description */
  bio?: string;
  
  /** Publisher social/website links */
  website_url?: string;
  
  /** Number of websites published by this user */
  published_count: number;
  
  /** Publisher join/registration date */
  joined_at: string;
}

/**
 * Website detail data interface
 * 
 * Extended website information specifically for detail page display.
 * Includes all base website fields plus additional detail-specific data.
 */
export interface WebsiteDetailData extends Website {
  /** Extended description or content */
  content?: string;
  
  /** Website language */
  language?: string;
  
  /** Website traffic/popularity metrics */
  popularity_score?: number;
  
  /** Last verification/check timestamp */
  last_checked_at?: string;
  
  /** Whether the website is currently accessible */
  is_accessible: boolean;
  
  /** Publisher/Author information */
  publisher?: PublisherInfo;
  
  /** Category information (populated) */
  category?: Category;
  
  /** SEO metadata */
  meta_title?: string;
  meta_description?: string;
  
  /** Social media information */
  social_links?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
  };
  
  /** Website statistics */
  stats?: {
    total_visits: number;
    monthly_visits: number;
    weekly_visits: number;
    daily_visits: number;
    bounce_rate?: number;
    avg_session_duration?: number;
  };
  
  /** Similar or related websites */
  related_websites?: WebsiteCardData[];
  
  /** Alternative URLs or mirrors */
  alternative_urls?: string[];
  
  /** Website features/highlights */
  features?: string[];
  
  /** Pricing information if applicable */
  pricing?: {
    is_free: boolean;
    has_paid_plans: boolean;
    starting_price?: string;
    currency?: string;
  };
}

/**
 * Website detail page parameters interface
 * 
 * Route parameters for website detail pages
 */
export interface WebsiteDetailParams {
  /** Website ID from URL parameter */
  id: string;
}

/**
 * Website detail page props interface
 * 
 * Props for the main website detail page component
 */
export interface WebsiteDetailPageProps {
  /** Website detail data */
  website: WebsiteDetailData;
  
  /** Related websites for recommendations */
  relatedWebsites?: WebsiteCardData[];
  
  /** Whether user can edit this website (admin/publisher) */
  canEdit?: boolean;
  
  /** Whether to show admin actions */
  showAdminActions?: boolean;
}

/**
 * Website detail loading state interface
 * 
 * Loading states for different sections of the detail page
 */
export interface WebsiteDetailLoadingState {
  /** Main website data loading */
  website: boolean;
  
  /** Related websites loading */
  relatedWebsites: boolean;
  
  /** Publisher information loading */
  publisher: boolean;
  
  /** Visit count update loading */
  visitUpdate: boolean;
}

/**
 * Website detail error state interface
 * 
 * Error states for different sections of the detail page
 */
export interface WebsiteDetailErrorState {
  /** Website not found or access denied */
  website?: string;
  
  /** Failed to load related websites */
  relatedWebsites?: string;
  
  /** Failed to load publisher information */
  publisher?: string;
  
  /** Failed to update visit count */
  visitUpdate?: string;
}

/**
 * Website detail actions interface
 * 
 * Available actions on the website detail page
 */
export interface WebsiteDetailActions {
  /** Visit/open the website */
  onVisit: (websiteId: string, url: string) => void | Promise<void>;
  
  /** Share the website */
  onShare?: (websiteId: string, title: string, url: string) => void;
  
  /** Bookmark/save the website */
  onBookmark?: (websiteId: string) => void | Promise<void>;
  
  /** Report the website */
  onReport?: (websiteId: string, reason: string) => void | Promise<void>;
  
  /** Edit the website (admin/publisher only) */
  onEdit?: (websiteId: string) => void;
  
  /** Delete the website (admin only) */
  onDelete?: (websiteId: string) => void | Promise<void>;
}

/**
 * Website detail navigation interface
 * 
 * Navigation context for the detail page
 */
export interface WebsiteDetailNavigation {
  /** Previous website in list/category */
  previousWebsite?: {
    id: string;
    title: string;
  };
  
  /** Next website in list/category */
  nextWebsite?: {
    id: string;
    title: string;
  };
  
  /** Parent category breadcrumb */
  categoryBreadcrumb?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  
  /** Return URL for back navigation */
  returnUrl?: string;
  
  /** Return label for back navigation */
  returnLabel?: string;
}

/**
 * Website detail SEO data interface
 * 
 * SEO and metadata for the detail page
 */
export interface WebsiteDetailSEO {
  /** Page title for SEO */
  title: string;
  
  /** Page description for SEO */
  description: string;
  
  /** Canonical URL */
  canonical: string;
  
  /** Open Graph data */
  og: {
    title: string;
    description: string;
    image?: string;
    url: string;
    type: 'website';
  };
  
  /** Twitter Card data */
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    image?: string;
  };
  
  /** Structured data for search engines */
  structuredData?: object;
}

/**
 * Type guard to check if a Website has detail-specific properties
 */
export function isWebsiteDetailData(website: Website | WebsiteDetailData): website is WebsiteDetailData {
  return 'is_accessible' in website;
}

/**
 * Type utility to convert Website to WebsiteDetailData
 * 
 * Ensures backward compatibility when extending base Website type
 */
export type WebsiteToDetailData<T extends Website> = T & {
  is_accessible: boolean;
  publisher?: PublisherInfo;
  category?: Category;
};