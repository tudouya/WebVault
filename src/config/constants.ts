// 应用常量配置
export const APP_CONSTANTS = {
  // 网站配置
  SITE_NAME: "WebVault",
  SITE_DESCRIPTION: "网站目录管理平台，用于收藏、分类和管理工作生活中发现的优质网站资源",

  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 100,
  },

  // 搜索配置
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_QUERY_LENGTH: 100,
    DEBOUNCE_DELAY: 300,
  },

  // 文件上传配置
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  },

  // 网站元数据配置
  WEBSITE: {
    MAX_TITLE_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_TAGS: 10,
  },

  // 缓存配置
  CACHE: {
    FAVICON_TTL: 7 * 24 * 60 * 60, // 7天（秒）
    METADATA_TTL: 24 * 60 * 60,    // 1天（秒）
  },

  // API 配置
  API: {
    TIMEOUT: 10000, // 10秒
    RETRY_ATTEMPTS: 3,
  },

  // 评分配置
  RATING: {
    MIN_SCORE: 1,
    MAX_SCORE: 5,
    DEFAULT_SCORE: 3,
  },

  // 访问统计配置
  ANALYTICS: {
    BATCH_SIZE: 100,
    FLUSH_INTERVAL: 5 * 60 * 1000, // 5分钟（毫秒）
  },
} as const

// 网站状态枚举
export const WEBSITE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  BLOCKED: "blocked",
} as const

// 广告类型枚举
export const AD_TYPE = {
  NONE: "none",
  BANNER: "banner",
  SIDEBAR: "sidebar",
  PROMOTED: "promoted",
} as const

// 视图类型枚举
export const VIEW_MODE = {
  GRID: "grid",
  LIST: "list",
  COMPACT: "compact",
} as const

// 排序选项
export const SORT_OPTIONS = {
  CREATED_DESC: "created_desc",
  CREATED_ASC: "created_asc",
  UPDATED_DESC: "updated_desc",
  UPDATED_ASC: "updated_asc",
  RATING_DESC: "rating_desc",
  RATING_ASC: "rating_asc",
  VIEWS_DESC: "views_desc",
  VIEWS_ASC: "views_asc",
  ALPHABETICAL: "alphabetical",
} as const

export type WebsiteStatus = (typeof WEBSITE_STATUS)[keyof typeof WEBSITE_STATUS]
export type AdType = (typeof AD_TYPE)[keyof typeof AD_TYPE]
export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE]
export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS]