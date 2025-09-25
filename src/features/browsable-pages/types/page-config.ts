/**
 * Browsable Page Configuration Types
 * 
 * Defines comprehensive configuration interfaces for the unified browsable
 * page system supporting collection detail, category browse, and tag browse pages.
 * 
 * Leverages configuration-driven architecture to maximize component reuse
 * while providing type-safe, flexible page customization options.
 */

import type { SortField, SortOrder } from '@/features/websites/types/filters';

/**
 * Available page types for browsable content
 */
export type PageType = 'collection' | 'category' | 'tag';

/**
 * Sort option configuration for dropdown components
 */
export interface SortOption {
  /** Sort field identifier */
  field: SortField;
  /** Human-readable label */
  label: string;
  /** Sort order */
  order: SortOrder;
  /** Icon for display (optional) */
  icon?: string;
  /** Description for tooltip (optional) */
  description?: string;
}

/**
 * Filter option configuration for various filter types
 */
export interface FilterOption {
  /** Unique filter identifier */
  id: string;
  /** Filter type */
  type: 'category' | 'tag' | 'rating' | 'status' | 'date' | 'custom';
  /** Human-readable label */
  label: string;
  /** Filter value */
  value: string | number | boolean;
  /** Item count for this filter (optional) */
  count?: number;
  /** Filter color/styling (optional) */
  color?: string;
  /** Icon for display (optional) */
  icon?: string;
  /** Whether this filter is active by default */
  defaultActive?: boolean;
  /** Whether this filter can be removed */
  removable?: boolean;
}

/**
 * Advanced filter configuration
 */
export interface AdvancedFilterConfig {
  /** Enable rating filter */
  ratingFilter: boolean;
  /** Enable date range filter */
  dateRangeFilter: boolean;
  /** Enable status filter */
  statusFilter: boolean;
  /** Enable featured items toggle */
  featuredToggle: boolean;
  /** Enable ads inclusion toggle */
  adsToggle: boolean;
  /** Custom filters specific to page type */
  customFilters: FilterOption[];
}

/**
 * Content display configuration options
 */
export interface ContentDisplayConfig {
  /** Default view mode */
  defaultViewMode: 'grid' | 'list';
  /** Allow view mode switching */
  viewModeToggle: boolean;
  /** Grid layout configuration */
  grid: {
    /** Default items per page */
    defaultItemsPerPage: number;
    /** Available items per page options */
    itemsPerPageOptions: number[];
    /** Grid columns configuration */
    columns: {
      /** Desktop columns */
      desktop: number;
      /** Tablet columns */
      tablet: number;
      /** Mobile columns */
      mobile: number;
    };
  };
  /** List layout configuration */
  list: {
    /** Default items per page in list view */
    defaultItemsPerPage: number;
    /** Show compact list option */
    compactMode: boolean;
  };
  /** Pagination configuration */
  pagination: {
    /** Enable infinite scroll */
    infiniteScroll: boolean;
    /** Load more button instead of pagination */
    loadMoreButton: boolean;
    /** Items to load per scroll/click */
    loadIncrement: number;
  };
}

/**
 * Hero section configuration
 */
export interface HeroConfig {
  /** Show hero section */
  enabled: boolean;
  /** Hero layout variant */
  layout: 'minimal' | 'standard' | 'detailed';
  /** Show entity statistics */
  showStats: boolean;
  /** Show breadcrumb navigation */
  showBreadcrumbs: boolean;
  /** Background styling */
  background: {
    /** Background type */
    type: 'gradient' | 'image' | 'solid' | 'pattern';
    /** Background color/theme */
    theme?: 'primary' | 'secondary' | 'accent' | 'neutral';
    /** Custom background image URL */
    imageUrl?: string;
  };
  /** Hero content configuration */
  content: {
    /** Show description */
    showDescription: boolean;
    /** Maximum description length */
    descriptionMaxLength: number;
    /** Show entity icon/image */
    showIcon: boolean;
    /** Show action buttons */
    showActions: boolean;
  };
}

/**
 * Navigation and sidebar configuration
 */
export interface NavigationConfig {
  /** Sidebar configuration */
  sidebar: {
    /** Show sidebar */
    enabled: boolean;
    /** Sidebar position */
    position: 'left' | 'right';
    /** Sidebar can be collapsed */
    collapsible: boolean;
    /** Default collapsed state */
    defaultCollapsed: boolean;
    /** Sidebar sections to show */
    sections: {
      /** Show related entities */
      related: boolean;
      /** Show hierarchy navigation */
      hierarchy: boolean;
      /** Show quick filters */
      quickFilters: boolean;
      /** Show recent items */
      recent: boolean;
    };
  };
  /** Breadcrumb configuration */
  breadcrumbs: {
    /** Enable breadcrumbs */
    enabled: boolean;
    /** Show home link */
    showHome: boolean;
    /** Maximum breadcrumb items */
    maxItems: number;
    /** Show dropdown for long paths */
    dropdown: boolean;
  };
  /** Related content configuration */
  related: {
    /** Show parent entities */
    showParents: boolean;
    /** Show child entities */
    showChildren: boolean;
    /** Show sibling/similar entities */
    showSimilar: boolean;
    /** Maximum related items to show */
    maxItems: number;
  };
}

/**
 * SEO and metadata configuration
 */
export interface SEOConfig {
  /** Generate meta description */
  metaDescription: boolean;
  /** Meta description max length */
  metaDescriptionLength: number;
  /** Generate structured data (JSON-LD) */
  structuredData: boolean;
  /** Canonical URL pattern */
  canonicalPattern: string;
  /** Open Graph configuration */
  openGraph: {
    /** Enable Open Graph tags */
    enabled: boolean;
    /** Default image URL */
    defaultImage?: string;
    /** Site name */
    siteName: string;
  };
  /** Twitter Card configuration */
  twitterCard: {
    /** Enable Twitter Card tags */
    enabled: boolean;
    /** Card type */
    cardType: 'summary' | 'summary_large_image';
    /** Twitter handle */
    handle?: string;
  };
}

/**
 * Performance optimization configuration
 */
export interface PerformanceConfig {
  /** Enable lazy loading for images */
  lazyImages: boolean;
  /** Enable content virtualization for large lists */
  virtualization: boolean;
  /** Prefetch related pages */
  prefetchRelated: boolean;
  /** Cache strategy */
  caching: {
    /** Enable client-side caching */
    enabled: boolean;
    /** Cache duration in seconds */
    duration: number;
    /** Cache key strategy */
    keyStrategy: 'url' | 'content' | 'hybrid';
  };
}

/**
 * Analytics and tracking configuration
 */
export interface AnalyticsConfig {
  /** Track page views */
  pageViews: boolean;
  /** Track filter usage */
  filterUsage: boolean;
  /** Track search queries */
  searchTracking: boolean;
  /** Track user interactions */
  interactions: boolean;
  /** Custom event tracking */
  customEvents: string[];
}

/**
 * Comprehensive browsable page configuration interface
 * 
 * Defines all configurable aspects of a browsable page, allowing
 * for maximum flexibility while maintaining consistent behavior
 * across different page types.
 */
export interface BrowsablePageConfig {
  /** Page type identifier */
  pageType: PageType;
  
  /** Page identification */
  id: string;
  
  /** Page title configuration */
  title: {
    /** Static title prefix */
    prefix?: string;
    /** Dynamic title from entity data */
    dynamic: boolean;
    /** Fallback title if entity not found */
    fallback: string;
    /** Title template for meta tags */
    template?: string;
  };
  
  /** Page description configuration */
  description: {
    /** Show description section */
    enabled: boolean;
    /** Description source */
    source: 'entity' | 'dynamic' | 'static';
    /** Static description text */
    static?: string;
    /** Maximum description length */
    maxLength: number;
    /** Fallback description */
    fallback?: string;
  };
  
  /** Hero section configuration */
  hero: HeroConfig;
  
  /** Filtering system configuration */
  filters: {
    /** Enable search functionality */
    searchEnabled: boolean;
    /** Search placeholder text */
    searchPlaceholder?: string;
    /** Enable category filtering */
    categoryEnabled: boolean;
    /** Enable tag filtering */
    tagEnabled: boolean;
    /** Enable sorting options */
    sortEnabled: boolean;
    /** Available sort options */
    availableSorts: SortOption[];
    /** Default sort option */
    defaultSort: SortOption;
    /** Advanced filters configuration */
    advanced: AdvancedFilterConfig;
    /** Filter persistence in URL */
    urlSync: boolean;
    /** Show filter count badges */
    showFilterCounts: boolean;
    /** Enable filter presets */
    presets: boolean;
  };
  
  /** Content display configuration */
  content: ContentDisplayConfig;
  
  /** Navigation configuration */
  navigation: NavigationConfig;
  
  /** SEO configuration */
  seo: SEOConfig;
  
  /** Performance configuration */
  performance: PerformanceConfig;
  
  /** Analytics configuration */
  analytics: AnalyticsConfig;
  
  /** Page-specific feature flags */
  features: {
    /** Enable sorting functionality */
    enableSorting: boolean;
    /** Enable pagination navigation */
    enablePagination: boolean;
    /** Show advertisement banner */
    showAdBanner: boolean;
    /** Enable export functionality */
    enableExport: boolean;
    /** Enable sharing functionality */
    enableSharing: boolean;
    /** Enable bookmarking */
    enableBookmarks: boolean;
    /** Enable user ratings */
    enableRatings: boolean;
    /** Enable comments/reviews */
    enableComments: boolean;
  };
  
  /** Custom configuration for page type extensions */
  custom?: Record<string, unknown>;
}

/**
 * Default page configuration to handle error cases and provide fallbacks
 */
export const DEFAULT_PAGE_CONFIG: BrowsablePageConfig = {
  pageType: 'collection',
  id: 'default',
  
  title: {
    dynamic: false,
    fallback: 'Page Not Found',
    template: '{title} | WebVault',
  },
  
  description: {
    enabled: true,
    source: 'static',
    static: 'Browse our curated collection of high-quality websites and resources.',
    maxLength: 200,
    fallback: 'Discover amazing websites and resources.',
  },
  
  hero: {
    enabled: false,
    layout: 'minimal',
    showStats: false,
    showBreadcrumbs: false,
    background: {
      type: 'solid',
      theme: 'neutral',
    },
    content: {
      showDescription: true,
      descriptionMaxLength: 150,
      showIcon: true,
      showActions: false,
    },
  },
  
  filters: {
    searchEnabled: true,
    searchPlaceholder: 'Search websites...',
    categoryEnabled: false,
    tagEnabled: false,
    sortEnabled: true,
    availableSorts: [
      { field: 'created_at', label: 'Recently Added', order: 'desc' },
      { field: 'title', label: 'Name (A-Z)', order: 'asc' },
    ],
    defaultSort: { field: 'created_at', label: 'Recently Added', order: 'desc' },
    advanced: {
      ratingFilter: false,
      dateRangeFilter: false,
      statusFilter: false,
      featuredToggle: false,
      adsToggle: false,
      customFilters: [],
    },
    urlSync: false,
    showFilterCounts: false,
    presets: false,
  },
  
  content: {
    defaultViewMode: 'grid',
    viewModeToggle: false,
    grid: {
      defaultItemsPerPage: 12,
      itemsPerPageOptions: [12, 24, 48],
      columns: {
        desktop: 4,
        tablet: 3,
        mobile: 1,
      },
    },
    list: {
      defaultItemsPerPage: 20,
      compactMode: false,
    },
    pagination: {
      infiniteScroll: false,
      loadMoreButton: false,
      loadIncrement: 12,
    },
  },
  
  navigation: {
    sidebar: {
      enabled: false,
      position: 'right',
      collapsible: true,
      defaultCollapsed: false,
      sections: {
        related: false,
        hierarchy: false,
        quickFilters: false,
        recent: false,
      },
    },
    breadcrumbs: {
      enabled: false,
      showHome: true,
      maxItems: 5,
      dropdown: true,
    },
    related: {
      showParents: false,
      showChildren: false,
      showSimilar: false,
      maxItems: 5,
    },
  },
  
  seo: {
    metaDescription: true,
    metaDescriptionLength: 160,
    structuredData: false,
    canonicalPattern: '/{pageType}/{slug}',
    openGraph: {
      enabled: true,
      siteName: 'WebVault',
    },
    twitterCard: {
      enabled: true,
      cardType: 'summary_large_image',
    },
  },
  
  performance: {
    lazyImages: true,
    virtualization: false,
    prefetchRelated: false,
    caching: {
      enabled: true,
      duration: 300, // 5 minutes
      keyStrategy: 'url',
    },
  },
  
  analytics: {
    pageViews: true,
    filterUsage: false,
    searchTracking: false,
    interactions: false,
    customEvents: [],
  },
  
  features: {
    enableSorting: true,
    enablePagination: true,
    showAdBanner: false,
    enableExport: false,
    enableSharing: false,
    enableBookmarks: false,
    enableRatings: false,
    enableComments: false,
  },
};

/**
 * Type guard to check if a configuration is valid
 */
export function isValidPageConfig(config: unknown): config is BrowsablePageConfig {
  return Boolean(
    config !== null &&
    typeof config === 'object' &&
    typeof (config as Record<string, unknown>).pageType === 'string' &&
    ['collection', 'category', 'tag'].includes((config as Record<string, unknown>).pageType as string) &&
    typeof (config as Record<string, unknown>).id === 'string' &&
    (config as Record<string, unknown>).title &&
    typeof (config as Record<string, unknown>).title === 'object' &&
    (config as Record<string, unknown>).filters &&
    typeof (config as Record<string, unknown>).filters === 'object' &&
    (config as Record<string, unknown>).content &&
    typeof (config as Record<string, unknown>).content === 'object'
  );
}

/**
 * Utility function to merge page configuration with defaults
 */
export function mergeWithDefaults(
  config: Partial<BrowsablePageConfig>
): BrowsablePageConfig {
  return {
    ...DEFAULT_PAGE_CONFIG,
    ...config,
    title: {
      ...DEFAULT_PAGE_CONFIG.title,
      ...config.title,
    },
    description: {
      ...DEFAULT_PAGE_CONFIG.description,
      ...config.description,
    },
    hero: {
      ...DEFAULT_PAGE_CONFIG.hero,
      ...config.hero,
      background: {
        ...DEFAULT_PAGE_CONFIG.hero.background,
        ...config.hero?.background,
      },
      content: {
        ...DEFAULT_PAGE_CONFIG.hero.content,
        ...config.hero?.content,
      },
    },
    filters: {
      ...DEFAULT_PAGE_CONFIG.filters,
      ...config.filters,
      advanced: {
        ...DEFAULT_PAGE_CONFIG.filters.advanced,
        ...config.filters?.advanced,
      },
    },
    content: {
      ...DEFAULT_PAGE_CONFIG.content,
      ...config.content,
      grid: {
        ...DEFAULT_PAGE_CONFIG.content.grid,
        ...config.content?.grid,
        columns: {
          ...DEFAULT_PAGE_CONFIG.content.grid.columns,
          ...config.content?.grid?.columns,
        },
      },
      list: {
        ...DEFAULT_PAGE_CONFIG.content.list,
        ...config.content?.list,
      },
      pagination: {
        ...DEFAULT_PAGE_CONFIG.content.pagination,
        ...config.content?.pagination,
      },
    },
    navigation: {
      ...DEFAULT_PAGE_CONFIG.navigation,
      ...config.navigation,
      sidebar: {
        ...DEFAULT_PAGE_CONFIG.navigation.sidebar,
        ...config.navigation?.sidebar,
        sections: {
          ...DEFAULT_PAGE_CONFIG.navigation.sidebar.sections,
          ...config.navigation?.sidebar?.sections,
        },
      },
      breadcrumbs: {
        ...DEFAULT_PAGE_CONFIG.navigation.breadcrumbs,
        ...config.navigation?.breadcrumbs,
      },
      related: {
        ...DEFAULT_PAGE_CONFIG.navigation.related,
        ...config.navigation?.related,
      },
    },
    seo: {
      ...DEFAULT_PAGE_CONFIG.seo,
      ...config.seo,
      openGraph: {
        ...DEFAULT_PAGE_CONFIG.seo.openGraph,
        ...config.seo?.openGraph,
      },
      twitterCard: {
        ...DEFAULT_PAGE_CONFIG.seo.twitterCard,
        ...config.seo?.twitterCard,
      },
    },
    performance: {
      ...DEFAULT_PAGE_CONFIG.performance,
      ...config.performance,
      caching: {
        ...DEFAULT_PAGE_CONFIG.performance.caching,
        ...config.performance?.caching,
      },
    },
    analytics: {
      ...DEFAULT_PAGE_CONFIG.analytics,
      ...config.analytics,
    },
    features: {
      ...DEFAULT_PAGE_CONFIG.features,
      ...config.features,
    },
  };
}