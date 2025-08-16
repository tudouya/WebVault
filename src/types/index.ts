/**
 * Global Type Definitions for WebVault
 * 
 * This module serves as the central export point for commonly used types
 * across the WebVault application. It provides easy access to core types
 * from various feature modules while maintaining proper namespace organization.
 * 
 * @version 1.0.0
 * @created 2025-08-16
 */

// ============================================================================
// Browsable Pages Types
// ============================================================================

/**
 * Browsable Pages Module - Core Types
 * 
 * Re-exports essential types from the browsable-pages feature module
 * for use across the application. These types support the unified
 * browsable page system for collections, categories, and tags.
 */

// Core page configuration types
export type {
  BrowsablePageConfig,
  PageType,
  SortOption,
  FilterOption,
  AdvancedFilterConfig,
  ContentDisplayConfig,
  HeroConfig,
  NavigationConfig,
  SEOConfig,
  PerformanceConfig,
  AnalyticsConfig,
} from '@/features/browsable-pages/types/page-config';

// Main browsable pages types
export type {
  FilterParams,
  BrowsablePageData,
  BrowsablePageURLParams,
  BrowsablePageState,
  CollectionMetadata,
  CategoryMetadata,
  TagMetadata,
} from '@/features/browsable-pages/types';

// Configuration utilities and defaults
export {
  DEFAULT_PAGE_CONFIG,
  isValidPageConfig,
  mergeWithDefaults,
} from '@/features/browsable-pages/types/page-config';

// ============================================================================
// Future Module Type Exports
// ============================================================================

/**
 * Website Management Types
 * 
 * Placeholder for website-related types that may need global access.
 * Currently, these types are accessed directly from the websites feature module.
 */
// TODO: Add website types when needed globally
// export type { Website, WebsiteCardData, WebsiteFilters } from '@/features/websites/types';

/**
 * Authentication Types
 * 
 * Placeholder for auth-related types that may need global access.
 */
// TODO: Add auth types when needed globally
// export type { User, AuthState, LoginCredentials } from '@/features/auth/types';

/**
 * Admin Types
 * 
 * Placeholder for admin-related types that may need global access.
 */
// TODO: Add admin types when needed globally
// export type { AdminConfig, DashboardMetrics } from '@/features/admin/types';

// ============================================================================
// Type Compatibility & Version Management
// ============================================================================

/**
 * Legacy type aliases for backward compatibility
 * 
 * These aliases ensure that existing code using older type names
 * continues to work while new code can use the updated names.
 */

// Browsable Pages - Legacy compatibility
export type {
  BrowsablePageConfig as PageConfig,
  FilterParams as BrowsableFilterParams,
  BrowsablePageData as PageData,
} from '@/features/browsable-pages/types';

/**
 * Version information for type definitions
 * 
 * Helps track type system evolution and manage breaking changes.
 */
export const TYPE_SYSTEM_VERSION = '1.0.0';

/**
 * Feature module type versions
 * 
 * Tracks the version of types exported from each feature module.
 */
export const MODULE_TYPE_VERSIONS = {
  'browsable-pages': '1.0.0',
  // 'websites': '1.0.0',
  // 'auth': '1.0.0',
  // 'admin': '1.0.0',
} as const;

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Utility types for common patterns across the application
 */

/** Generic API response wrapper */
export type ApiResponse<T = any> = {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
};

/** Generic pagination wrapper */
export type PaginatedResponse<T = any> = {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/** Common loading state pattern */
export type LoadingState = {
  isLoading: boolean;
  error?: string;
  lastUpdated?: string;
};

/** Generic entity identifier */
export type EntityId = string | number;

/** Common entity metadata */
export type EntityMetadata = {
  id: EntityId;
  createdAt: string;
  updatedAt: string;
  version?: number;
};

// ============================================================================
// Type Guards & Validators
// ============================================================================

/**
 * Type guard utilities for runtime type checking
 */

/** Check if value is a valid entity ID */
export function isValidEntityId(value: unknown): value is EntityId {
  return typeof value === 'string' || typeof value === 'number';
}

/** Check if value is a valid API response */
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  );
}

/** Check if value is a valid paginated response */
export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'totalCount' in value &&
    'currentPage' in value &&
    Array.isArray((value as any).items) &&
    typeof (value as any).totalCount === 'number' &&
    typeof (value as any).currentPage === 'number'
  );
}