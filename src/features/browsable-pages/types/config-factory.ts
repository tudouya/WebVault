/**
 * Browsable Page Configuration Factory
 * 
 * Provides factory functions to generate type-safe configuration objects
 * for collection detail, category browse, and tag browse pages.
 * 
 * Implements configuration-driven architecture with validation
 * and default value handling for consistent page behavior.
 */

import type { Collection } from '@/features/websites/types/collection';
import type { Category } from '@/features/websites/types/category';
import type { Tag } from '@/features/tags/types/tag';
import type { 
  BrowsablePageConfig, 
  SortOption,
  FilterOption 
} from './page-config';
import { DEFAULT_PAGE_CONFIG, mergeWithDefaults } from './page-config';

/**
 * Configuration options for collection page factory
 */
export interface CollectionPageOptions {
  /** Collection entity data */
  collection: Collection;
  /** Override default configuration */
  overrides?: Partial<BrowsablePageConfig>;
  /** Enable advanced features */
  features?: {
    /** Enable export functionality */
    enableExport?: boolean;
    /** Enable sharing functionality */
    enableSharing?: boolean;
    /** Show curator information */
    showCurator?: boolean;
    /** Enable collection bookmarking */
    enableBookmarks?: boolean;
    /** Enable pagination navigation */
    enablePagination?: boolean;
  };
}

/**
 * Configuration options for category page factory
 */
export interface CategoryPageOptions {
  /** Category entity data */
  category: Category;
  /** Override default configuration */
  overrides?: Partial<BrowsablePageConfig>;
  /** Enable advanced features */
  features?: {
    /** Show subcategory navigation */
    showSubcategories?: boolean;
    /** Show parent category breadcrumb */
    showParentNav?: boolean;
    /** Enable category following */
    enableFollowing?: boolean;
    /** Enable pagination navigation */
    enablePagination?: boolean;
  };
}

/**
 * Configuration options for tag page factory
 */
export interface TagPageOptions {
  /** Tag entity data */
  tag: Tag;
  /** Override default configuration */
  overrides?: Partial<BrowsablePageConfig>;
  /** Enable advanced features */
  features?: {
    /** Show related tags */
    showRelatedTags?: boolean;
    /** Show tag trending indicator */
    showTrending?: boolean;
    /** Enable tag following */
    enableFollowing?: boolean;
    /** Show tag statistics */
    showStats?: boolean;
    /** Enable pagination navigation */
    enablePagination?: boolean;
  };
}

/**
 * Default sort options for collection pages
 */
const COLLECTION_SORT_OPTIONS: SortOption[] = [
  { field: 'created_at', label: 'Recently Added', order: 'desc', icon: 'clock' },
  { field: 'title', label: 'Name (A-Z)', order: 'asc', icon: 'alphabetical' },
  { field: 'title', label: 'Name (Z-A)', order: 'desc', icon: 'alphabetical' },
  { field: 'updated_at', label: 'Recently Updated', order: 'desc', icon: 'refresh' },
  { field: 'visit_count', label: 'Most Popular', order: 'desc', icon: 'trending-up' },
];

/**
 * Default sort options for category pages
 */
const CATEGORY_SORT_OPTIONS: SortOption[] = [
  { field: 'created_at', label: 'Recently Added', order: 'desc', icon: 'clock' },
  { field: 'title', label: 'Name (A-Z)', order: 'asc', icon: 'alphabetical' },
  { field: 'title', label: 'Name (Z-A)', order: 'desc', icon: 'alphabetical' },
  { field: 'updated_at', label: 'Recently Updated', order: 'desc', icon: 'refresh' },
  { field: 'rating', label: 'Highest Rated', order: 'desc', icon: 'star' },
];

/**
 * Default sort options for tag pages
 */
const TAG_SORT_OPTIONS: SortOption[] = [
  { field: 'created_at', label: 'Recently Added', order: 'desc', icon: 'clock' },
  { field: 'title', label: 'Name (A-Z)', order: 'asc', icon: 'alphabetical' },
  { field: 'updated_at', label: 'Recently Updated', order: 'desc', icon: 'refresh' },
  { field: 'rating', label: 'Highest Rated', order: 'desc', icon: 'star' },
  { field: 'visit_count', label: 'Most Popular', order: 'desc', icon: 'trending-up' },
];

/**
 * Create configuration for collection detail page
 * 
 * Generates a complete BrowsablePageConfig optimized for collection browsing
 * with collection-specific features like curator info and collection stats.
 */
export function createCollectionPageConfig(options: CollectionPageOptions): BrowsablePageConfig {
  const { collection, overrides = {}, features = {} } = options;
  
  // Validate required collection data
  if (!collection?.id || !collection?.title || !collection?.slug) {
    throw new Error('Invalid collection data: missing required fields (id, title, slug)');
  }

  const baseConfig: Partial<BrowsablePageConfig> = {
    pageType: 'collection',
    id: `collection-${collection.id}`,
    
    title: {
      prefix: 'Collection:',
      dynamic: true,
      fallback: collection.title,
      template: `${collection.title} Collection | WebVault`,
    },
    
    description: {
      enabled: true,
      source: 'entity',
      maxLength: 250,
      fallback: `Explore websites in the ${collection.title} collection`,
    },
    
    hero: {
      enabled: true,
      layout: 'detailed',
      showStats: true,
      showBreadcrumbs: true,
      background: {
        type: 'gradient',
        theme: 'primary',
      },
      content: {
        showDescription: true,
        descriptionMaxLength: 200,
        showIcon: true,
        showActions: features.enableSharing || features.enableBookmarks || false,
      },
    },
    
    filters: {
      searchEnabled: true,
      searchPlaceholder: `Search ${collection.title} collection...`,
      categoryEnabled: true,
      tagEnabled: true,
      sortEnabled: true,
      availableSorts: COLLECTION_SORT_OPTIONS,
      defaultSort: COLLECTION_SORT_OPTIONS[0],
      advanced: {
        ratingFilter: true,
        dateRangeFilter: true,
        statusFilter: false,
        featuredToggle: true,
        adsToggle: true,
        customFilters: [],
      },
      urlSync: true,
      showFilterCounts: true,
      presets: false,
    },
    
    content: {
      defaultViewMode: 'grid',
      viewModeToggle: true,
      grid: {
        defaultItemsPerPage: 12,
        itemsPerPageOptions: [12, 24, 48],
        columns: {
          desktop: 3,
          tablet: 2,
          mobile: 1,
        },
      },
      list: {
        defaultItemsPerPage: 20,
        compactMode: true,
      },
      pagination: {
        infiniteScroll: false,
        loadMoreButton: true,
        loadIncrement: 12,
      },
    },
    
    navigation: {
      sidebar: {
        enabled: true,
        position: 'right',
        collapsible: true,
        defaultCollapsed: false,
        sections: {
          related: true,
          hierarchy: false,
          quickFilters: true,
          recent: true,
        },
      },
      breadcrumbs: {
        enabled: true,
        showHome: true,
        maxItems: 4,
        dropdown: true,
      },
      related: {
        showParents: false,
        showChildren: false,
        showSimilar: true,
        maxItems: 6,
      },
    },
    
    seo: {
      metaDescription: true,
      metaDescriptionLength: 160,
      structuredData: true,
      canonicalPattern: '/collection/{slug}',
      openGraph: {
        enabled: true,
        siteName: 'WebVault',
      },
      twitterCard: {
        enabled: true,
        cardType: 'summary_large_image',
      },
    },
    
    features: {
      enableSorting: true,
      enablePagination: features.enablePagination !== false, // 默认启用分页
      showAdBanner: false,
      enableExport: features.enableExport || false,
      enableSharing: features.enableSharing || true,
      enableBookmarks: features.enableBookmarks || true,
      enableRatings: false,
      enableComments: false,
    },
    
    custom: {
      collection: {
        showCurator: features.showCurator || true,
        showWebsiteCount: true,
        showCreatedDate: true,
        showUpdatedDate: true,
        allowCuration: false,
      },
    },
  };

  return mergeWithDefaults({ ...baseConfig, ...overrides });
}

/**
 * Create configuration for category browse page
 * 
 * Generates a complete BrowsablePageConfig optimized for category browsing
 * with hierarchical navigation and subcategory support.
 */
export function createCategoryPageConfig(options: CategoryPageOptions): BrowsablePageConfig {
  const { category, overrides = {}, features = {} } = options;
  
  // Validate required category data
  if (!category?.id || !category?.name || !category?.slug) {
    throw new Error('Invalid category data: missing required fields (id, name, slug)');
  }

  const baseConfig: Partial<BrowsablePageConfig> = {
    pageType: 'category',
    id: `category-${category.id}`,
    
    title: {
      prefix: 'Category:',
      dynamic: true,
      fallback: category.name,
      template: `${category.name} Websites | WebVault`,
    },
    
    description: {
      enabled: true,
      source: category.description ? 'entity' : 'dynamic',
      maxLength: 200,
      fallback: `Discover websites in the ${category.name} category`,
    },
    
    hero: {
      enabled: true,
      layout: 'standard',
      showStats: true,
      showBreadcrumbs: features.showParentNav !== false,
      background: {
        type: category.color ? 'solid' : 'gradient',
        theme: 'secondary',
      },
      content: {
        showDescription: true,
        descriptionMaxLength: 150,
        showIcon: true,
        showActions: features.enableFollowing || false,
      },
    },
    
    filters: {
      searchEnabled: true,
      searchPlaceholder: `Search ${category.name} websites...`,
      categoryEnabled: features.showSubcategories !== false,
      tagEnabled: true,
      sortEnabled: true,
      availableSorts: CATEGORY_SORT_OPTIONS,
      defaultSort: CATEGORY_SORT_OPTIONS[0],
      advanced: {
        ratingFilter: true,
        dateRangeFilter: true,
        statusFilter: false,
        featuredToggle: true,
        adsToggle: true,
        customFilters: [],
      },
      urlSync: true,
      showFilterCounts: true,
      presets: false,
    },
    
    content: {
      defaultViewMode: 'grid',
      viewModeToggle: true,
      grid: {
        defaultItemsPerPage: 15,
        itemsPerPageOptions: [15, 30, 60],
        columns: {
          desktop: 3,
          tablet: 2,
          mobile: 1,
        },
      },
      list: {
        defaultItemsPerPage: 25,
        compactMode: true,
      },
      pagination: {
        infiniteScroll: false,
        loadMoreButton: true,
        loadIncrement: 15,
      },
    },
    
    navigation: {
      sidebar: {
        enabled: true,
        position: 'left',
        collapsible: true,
        defaultCollapsed: false,
        sections: {
          related: true,
          hierarchy: true,
          quickFilters: true,
          recent: false,
        },
      },
      breadcrumbs: {
        enabled: true,
        showHome: true,
        maxItems: 5,
        dropdown: true,
      },
      related: {
        showParents: category.parentId !== null,
        showChildren: features.showSubcategories !== false,
        showSimilar: true,
        maxItems: 8,
      },
    },
    
    seo: {
      metaDescription: true,
      metaDescriptionLength: 160,
      structuredData: true,
      canonicalPattern: '/category/{slug}',
      openGraph: {
        enabled: true,
        siteName: 'WebVault',
      },
      twitterCard: {
        enabled: true,
        cardType: 'summary_large_image',
      },
    },
    
    features: {
      enableSorting: true,
      enablePagination: features.enablePagination !== false, // 默认启用分页
      showAdBanner: false,
      enableExport: false,
      enableSharing: true,
      enableBookmarks: false,
      enableRatings: true,
      enableComments: false,
    },
    
    custom: {
      category: {
        showSubcategories: features.showSubcategories !== false,
        showParentNav: features.showParentNav !== false,
        enableFollowing: features.enableFollowing || false,
        showHierarchy: true,
        expandableTree: true,
      },
    },
  };

  return mergeWithDefaults({ ...baseConfig, ...overrides });
}

/**
 * Create configuration for tag browse page
 * 
 * Generates a complete BrowsablePageConfig optimized for tag-based browsing
 * with related tag suggestions and trending indicators.
 */
export function createTagPageConfig(options: TagPageOptions): BrowsablePageConfig {
  const { tag, overrides = {}, features = {} } = options;
  
  // Validate required tag data
  if (!tag?.id || !tag?.name || !tag?.slug) {
    throw new Error('Invalid tag data: missing required fields (id, name, slug)');
  }

  const baseConfig: Partial<BrowsablePageConfig> = {
    pageType: 'tag',
    id: `tag-${tag.id}`,
    
    title: {
      prefix: 'Tag:',
      dynamic: true,
      fallback: tag.name,
      template: `#${tag.name} Websites | WebVault`,
    },
    
    description: {
      enabled: true,
      source: tag.description ? 'entity' : 'dynamic',
      maxLength: 180,
      fallback: `Explore websites tagged with #${tag.name}`,
    },
    
    hero: {
      enabled: true,
      layout: 'minimal',
      showStats: features.showStats !== false,
      showBreadcrumbs: true,
      background: {
        type: tag.color ? 'solid' : 'pattern',
        theme: 'accent',
      },
      content: {
        showDescription: true,
        descriptionMaxLength: 120,
        showIcon: false,
        showActions: features.enableFollowing || features.showTrending || false,
      },
    },
    
    filters: {
      searchEnabled: true,
      searchPlaceholder: `Search #${tag.name} websites...`,
      categoryEnabled: true,
      tagEnabled: features.showRelatedTags !== false,
      sortEnabled: true,
      availableSorts: TAG_SORT_OPTIONS,
      defaultSort: TAG_SORT_OPTIONS[0],
      advanced: {
        ratingFilter: true,
        dateRangeFilter: true,
        statusFilter: false,
        featuredToggle: true,
        adsToggle: true,
        customFilters: tag.trending ? [{
          id: 'trending',
          type: 'custom',
          label: 'Trending',
          value: true,
          icon: 'trending-up',
          defaultActive: false,
          removable: true,
        }] : [],
      },
      urlSync: true,
      showFilterCounts: true,
      presets: false,
    },
    
    content: {
      defaultViewMode: 'grid',
      viewModeToggle: true,
      grid: {
        defaultItemsPerPage: 18,
        itemsPerPageOptions: [18, 36, 72],
        columns: {
          desktop: 3,
          tablet: 2,
          mobile: 1,
        },
      },
      list: {
        defaultItemsPerPage: 30,
        compactMode: true,
      },
      pagination: {
        infiniteScroll: true,
        loadMoreButton: false,
        loadIncrement: 18,
      },
    },
    
    navigation: {
      sidebar: {
        enabled: features.showRelatedTags !== false,
        position: 'right',
        collapsible: true,
        defaultCollapsed: false,
        sections: {
          related: features.showRelatedTags !== false,
          hierarchy: false,
          quickFilters: true,
          recent: false,
        },
      },
      breadcrumbs: {
        enabled: true,
        showHome: true,
        maxItems: 3,
        dropdown: false,
      },
      related: {
        showParents: false,
        showChildren: false,
        showSimilar: features.showRelatedTags !== false,
        maxItems: 10,
      },
    },
    
    seo: {
      metaDescription: true,
      metaDescriptionLength: 160,
      structuredData: true,
      canonicalPattern: '/tag/{slug}',
      openGraph: {
        enabled: true,
        siteName: 'WebVault',
      },
      twitterCard: {
        enabled: true,
        cardType: 'summary',
      },
    },
    
    features: {
      enableSorting: true,
      enablePagination: features.enablePagination !== false, // 默认启用分页
      showAdBanner: false,
      enableExport: false,
      enableSharing: true,
      enableBookmarks: false,
      enableRatings: false,
      enableComments: false,
    },
    
    custom: {
      tag: {
        showRelatedTags: features.showRelatedTags !== false,
        showTrending: features.showTrending !== false,
        enableFollowing: features.enableFollowing || false,
        showStats: features.showStats !== false,
        showUsageCount: true,
        showGroup: !!tag.group,
      },
    },
  };

  return mergeWithDefaults({ ...baseConfig, ...overrides });
}

/**
 * Validate configuration object
 * 
 * Performs runtime validation of generated configuration to ensure
 * all required fields are present and valid.
 */
export function validatePageConfig(config: BrowsablePageConfig): boolean {
  try {
    // Basic structure validation
    if (!config.pageType || !['collection', 'category', 'tag'].includes(config.pageType)) {
      throw new Error('Invalid pageType');
    }
    
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('Invalid id');
    }
    
    if (!config.title || typeof config.title !== 'object') {
      throw new Error('Invalid title configuration');
    }
    
    if (!config.filters || typeof config.filters !== 'object') {
      throw new Error('Invalid filters configuration');
    }
    
    if (!config.content || typeof config.content !== 'object') {
      throw new Error('Invalid content configuration');
    }
    
    // Validate sort options
    if (config.filters.availableSorts && Array.isArray(config.filters.availableSorts)) {
      for (const sortOption of config.filters.availableSorts) {
        if (!sortOption.field || !sortOption.label || !sortOption.order) {
          throw new Error('Invalid sort option configuration');
        }
      }
    }
    
    // Validate grid configuration
    if (config.content.grid) {
      if (!config.content.grid.columns || typeof config.content.grid.columns !== 'object') {
        throw new Error('Invalid grid columns configuration');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}

/**
 * Generate configuration with error handling
 * 
 * Wrapper function that safely generates configuration with fallback
 * to default configuration on error.
 */
export function safeCreatePageConfig(
  type: 'collection' | 'category' | 'tag',
  entity: Collection | Category | Tag,
  options: any = {}
): BrowsablePageConfig {
  try {
    let config: BrowsablePageConfig;
    
    switch (type) {
      case 'collection':
        config = createCollectionPageConfig({
          collection: entity as Collection,
          ...options
        });
        break;
      case 'category':
        config = createCategoryPageConfig({
          category: entity as Category,
          ...options
        });
        break;
      case 'tag':
        config = createTagPageConfig({
          tag: entity as Tag,
          ...options
        });
        break;
      default:
        throw new Error(`Unsupported page type: ${type}`);
    }
    
    // Validate generated configuration
    if (!validatePageConfig(config)) {
      throw new Error('Generated configuration failed validation');
    }
    
    return config;
  } catch (error) {
    console.error(`Failed to create ${type} page configuration:`, error);
    
    // Return default configuration with minimal entity data
    return mergeWithDefaults({
      pageType: type,
      id: `${type}-${entity?.id || 'unknown'}`,
      title: {
        dynamic: true,
        fallback: (entity as any)?.name || (entity as any)?.title || 'Unknown',
      },
    });
  }
}