/**
 * Mock website data for development and preview purposes
 * 
 * 提供示例网站数据，用于开发和预览效果
 * 包含各种类型的网站，展示不同的标签、评分和广告类型
 */

import { WebsiteCardData, SearchPageFilters, PaginationState } from '../types/website';

/**
 * Search result interface for getMockWebsites function
 */
export interface MockWebsiteSearchResult {
  websites: WebsiteCardData[];
  pagination: PaginationState;
  totalResults: number;
}

/**
 * 示例网站数据列表
 * 包含各种类型和类别的网站，用于展示首页效果
 */
export const mockWebsites: WebsiteCardData[] = [
  {
    id: '1',
    title: 'GitHub',
    description: '全球最大的代码托管平台，为开发者提供版本控制和协作开发服务。超过1亿个项目托管于此，是开源社区的重要基础设施。',
    url: 'https://github.com',
    favicon_url: '/api/favicon?domain=github.com',
    tags: ['开发工具', '代码托管', '开源', 'Git'],
    category: '开发工具',
    isAd: false,
    rating: 4.9,
    visit_count: 125420,
    is_featured: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-08-10T15:30:00Z'
  },
  {
    id: '2',
    title: 'Stack Overflow',
    description: '程序员问答社区，汇集全球开发者智慧。无论遇到什么编程问题，这里都能找到专业的解答和讨论。',
    url: 'https://stackoverflow.com',
    favicon_url: '/api/favicon?domain=stackoverflow.com',
    tags: ['问答', '编程', '社区', '学习'],
    category: '开发社区',
    isAd: false,
    rating: 4.8,
    visit_count: 89340,
    is_featured: true,
    created_at: '2024-02-20T14:20:00Z',
    updated_at: '2024-08-12T09:15:00Z'
  },
  {
    id: '3',
    title: 'Figma',
    description: '协作式设计工具，让设计师和产品团队能够实时协作创建用户界面和用户体验设计。支持原型制作和设计系统管理。',
    url: 'https://figma.com',
    favicon_url: '/api/favicon?domain=figma.com',
    tags: ['设计工具', 'UI/UX', '协作', '原型'],
    category: '设计工具',
    isAd: true,
    adType: 'sponsored',
    rating: 4.7,
    visit_count: 67890,
    is_featured: false,
    created_at: '2024-03-05T11:45:00Z',
    updated_at: '2024-08-08T16:20:00Z'
  },
  {
    id: '4',
    title: 'Notion',
    description: '一体化工作空间，结合笔记、知识库、项目管理和协作功能。帮助个人和团队更好地组织信息和提高生产力。',
    url: 'https://notion.so',
    favicon_url: '/api/favicon?domain=notion.so',
    tags: ['生产力', '笔记', '项目管理', '协作'],
    category: '生产力工具',
    isAd: false,
    rating: 4.6,
    visit_count: 45670,
    is_featured: false,
    created_at: '2024-01-28T13:30:00Z',
    updated_at: '2024-08-05T12:45:00Z'
  },
  {
    id: '5',
    title: 'Dribbble',
    description: '设计师作品展示平台，汇集全球优秀的UI/UX设计、平面设计和创意作品。是寻找设计灵感的绝佳地点。',
    url: 'https://dribbble.com',
    favicon_url: '/api/favicon?domain=dribbble.com',
    tags: ['设计', '作品集', '创意', '灵感'],
    category: '设计社区',
    isAd: false,
    rating: 4.5,
    visit_count: 34560,
    is_featured: false,
    created_at: '2024-02-10T16:15:00Z',
    updated_at: '2024-07-30T10:30:00Z'
  },
  {
    id: '6',
    title: 'Behance',
    description: 'Adobe旗下创意作品展示平台，展示摄影、设计、插画等各类创意作品。连接创意人才与品牌合作机会。',
    url: 'https://behance.net',
    favicon_url: '/api/favicon?domain=behance.net',
    tags: ['创意', 'Adobe', '作品集', '摄影'],
    category: '设计社区',
    isAd: false,
    rating: 4.4,
    visit_count: 28900,
    is_featured: false,
    created_at: '2024-03-18T09:25:00Z',
    updated_at: '2024-08-02T14:10:00Z'
  },
  {
    id: '7',
    title: 'Vercel',
    description: '现代化的前端部署平台，为React、Next.js等框架提供最优的部署体验。支持自动部署、边缘网络和无服务器函数。',
    url: 'https://vercel.com',
    favicon_url: '/api/favicon?domain=vercel.com',
    tags: ['部署', '前端', 'Next.js', '无服务器'],
    category: '开发工具',
    isAd: true,
    adType: 'featured',
    rating: 4.8,
    visit_count: 56780,
    is_featured: true,
    created_at: '2024-04-02T08:40:00Z',
    updated_at: '2024-08-14T11:55:00Z'
  },
  {
    id: '8',
    title: 'Unsplash',
    description: '免费高质量图片库，提供数百万张由全球摄影师贡献的精美照片。支持商业使用，是设计师的必备资源。',
    url: 'https://unsplash.com',
    favicon_url: '/api/favicon?domain=unsplash.com',
    tags: ['图片', '摄影', '免费', '素材'],
    category: '资源库',
    isAd: false,
    rating: 4.7,
    visit_count: 78560,
    is_featured: true,
    created_at: '2024-01-12T07:20:00Z',
    updated_at: '2024-08-06T13:25:00Z'
  },
  {
    id: '9',
    title: 'CodePen',
    description: '前端代码在线编辑器和社区，可以快速创建和分享HTML、CSS、JavaScript代码片段。是学习前端技术的优秀平台。',
    url: 'https://codepen.io',
    favicon_url: '/api/favicon?domain=codepen.io',
    tags: ['前端', '代码', '在线编辑器', '学习'],
    category: '开发工具',
    isAd: false,
    rating: 4.6,
    visit_count: 43210,
    is_featured: false,
    created_at: '2024-02-25T15:50:00Z',
    updated_at: '2024-07-28T17:40:00Z'
  },
  {
    id: '10',
    title: 'Linear',
    description: '现代化项目管理和问题跟踪工具，专为高性能团队设计。提供快速、直观的界面和强大的项目管理功能。',
    url: 'https://linear.app',
    favicon_url: '/api/favicon?domain=linear.app',
    tags: ['项目管理', '敏捷', '团队协作', '效率'],
    category: '生产力工具',
    isAd: true,
    adType: 'premium',
    rating: 4.8,
    visit_count: 32450,
    is_featured: false,
    created_at: '2024-03-12T12:35:00Z',
    updated_at: '2024-08-01T18:15:00Z'
  },
  {
    id: '11',
    title: 'Tailwind CSS',
    description: 'Utility-first CSS框架，提供低级实用程序类来构建自定义设计。无需离开HTML即可快速构建现代用户界面。',
    url: 'https://tailwindcss.com',
    favicon_url: '/api/favicon?domain=tailwindcss.com',
    tags: ['CSS框架', '前端', '设计系统', '工具'],
    category: '开发工具',
    isAd: false,
    rating: 4.9,
    visit_count: 98760,
    is_featured: true,
    created_at: '2024-01-08T19:10:00Z',
    updated_at: '2024-08-13T08:30:00Z'
  },
  {
    id: '12',
    title: 'Product Hunt',
    description: '新产品发现平台，每天展示最新、最酷的科技产品。创业者和产品爱好者分享和发现优秀产品的社区。',
    url: 'https://producthunt.com',
    favicon_url: '/api/favicon?domain=producthunt.com',
    tags: ['产品', '创业', '社区', '发现'],
    category: '产品社区',
    isAd: false,
    rating: 4.5,
    visit_count: 54320,
    is_featured: false,
    created_at: '2024-04-20T10:05:00Z',
    updated_at: '2024-08-09T14:50:00Z'
  }
];

/**
 * 搜索网站（支持标题、描述、标签、URL搜索）
 */
function searchWebsites(
  websites: WebsiteCardData[],
  query: string,
  filters: Partial<SearchPageFilters>
): WebsiteCardData[] {
  if (!query.trim()) return websites;

  const searchTerm = query.toLowerCase().trim();
  const scope = filters.searchScope || 'all';
  const exactMatch = filters.exactMatch || false;
  const requiredTerms = filters.requiredTerms || [];
  const excludeTerms = filters.excludeTerms || [];

  return websites.filter(website => {
    // 检查排除词
    if (excludeTerms.length > 0) {
      const excludeMatch = excludeTerms.some(term => {
        const lowerTerm = term.toLowerCase();
        return (
          website.title.toLowerCase().includes(lowerTerm) ||
          website.description?.toLowerCase().includes(lowerTerm) ||
          website.tags.some(tag => tag.toLowerCase().includes(lowerTerm)) ||
          website.url.toLowerCase().includes(lowerTerm)
        );
      });
      if (excludeMatch) return false;
    }

    // 检查必需词
    if (requiredTerms.length > 0) {
      const allRequiredFound = requiredTerms.every(term => {
        const lowerTerm = term.toLowerCase();
        return (
          website.title.toLowerCase().includes(lowerTerm) ||
          website.description?.toLowerCase().includes(lowerTerm) ||
          website.tags.some(tag => tag.toLowerCase().includes(lowerTerm)) ||
          website.url.toLowerCase().includes(lowerTerm)
        );
      });
      if (!allRequiredFound) return false;
    }

    // 主搜索逻辑
    const searchFn = exactMatch ? 
      (text: string) => text.toLowerCase() === searchTerm :
      (text: string) => text.toLowerCase().includes(searchTerm);

    switch (scope) {
      case 'title':
        return searchFn(website.title);
      case 'description':
        return website.description ? searchFn(website.description) : false;
      case 'url':
        return searchFn(website.url);
      case 'tags':
        return website.tags.some(tag => searchFn(tag));
      case 'all':
      default:
        return (
          searchFn(website.title) ||
          (website.description && searchFn(website.description)) ||
          website.tags.some(tag => searchFn(tag)) ||
          searchFn(website.url)
        );
    }
  });
}

/**
 * 应用筛选器
 */
function applyFilters(
  websites: WebsiteCardData[],
  filters: Partial<SearchPageFilters>
): WebsiteCardData[] {
  let filtered = websites;

  // 分类筛选
  if (filters.category) {
    filtered = filtered.filter(website => website.category === filters.category);
  }

  // 标签筛选
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(website =>
      filters.tags!.some(filterTag =>
        website.tags.some(websiteTag =>
          websiteTag.toLowerCase().includes(filterTag.toLowerCase())
        )
      )
    );
  }

  // 特色网站筛选
  if (filters.featured !== undefined) {
    filtered = filtered.filter(website => 
      filters.featured ? website.is_featured : !website.is_featured
    );
  }

  // 广告筛选
  if (filters.includeAds === false) {
    filtered = filtered.filter(website => !website.isAd);
  } else if (filters.includeAds === true && filters.adType) {
    filtered = filtered.filter(website => 
      website.isAd && website.adType === filters.adType
    );
  }

  // 评分筛选
  if (filters.minRating !== undefined) {
    filtered = filtered.filter(website => 
      website.rating !== undefined && website.rating >= filters.minRating!
    );
  }

  // 日期范围筛选
  if (filters.dateRange) {
    const { from, to } = filters.dateRange;
    if (from || to) {
      filtered = filtered.filter(website => {
        if (!website.created_at) return false;
        const websiteDate = new Date(website.created_at);
        if (from && websiteDate < new Date(from)) return false;
        if (to && websiteDate > new Date(to)) return false;
        return true;
      });
    }
  }

  return filtered;
}

/**
 * 排序网站列表
 */
function sortWebsites(
  websites: WebsiteCardData[],
  sortBy: SearchPageFilters['sortBy'] = 'relevance',
  sortOrder: SearchPageFilters['sortOrder'] = 'desc'
): WebsiteCardData[] {
  const sorted = [...websites];
  const isAsc = sortOrder === 'asc';

  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => {
        const result = a.title.localeCompare(b.title, 'zh-CN');
        return isAsc ? result : -result;
      });

    case 'visit_count':
      return sorted.sort((a, b) => {
        const aCount = a.visit_count || 0;
        const bCount = b.visit_count || 0;
        const result = aCount - bCount;
        return isAsc ? result : -result;
      });

    case 'rating':
      return sorted.sort((a, b) => {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        const result = aRating - bRating;
        return isAsc ? result : -result;
      });

    case 'created_at':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.created_at || '1970-01-01');
        const bDate = new Date(b.created_at || '1970-01-01');
        const result = aDate.getTime() - bDate.getTime();
        return isAsc ? result : -result;
      });

    case 'updated_at':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.updated_at || '1970-01-01');
        const bDate = new Date(b.updated_at || '1970-01-01');
        const result = aDate.getTime() - bDate.getTime();
        return isAsc ? result : -result;
      });

    case 'featured':
      return sorted.sort((a, b) => {
        const aFeatured = a.is_featured || false;
        const bFeatured = b.is_featured || false;
        if (aFeatured === bFeatured) return 0;
        const result = aFeatured ? 1 : -1;
        return isAsc ? result : -result;
      });

    case 'relevance':
    default:
      // 相关性排序：特色网站 > 评分 > 访问量
      return sorted.sort((a, b) => {
        // 特色网站优先
        if (a.is_featured !== b.is_featured) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        
        // 评分次之
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        if (aRating !== bRating) {
          return bRating - aRating;
        }
        
        // 访问量最后
        const aVisits = a.visit_count || 0;
        const bVisits = b.visit_count || 0;
        return bVisits - aVisits;
      });
  }
}

/**
 * 获取模拟网站数据，支持搜索、筛选、排序和分页
 * @param options 搜索选项
 * @returns 搜索结果，包含网站列表、分页信息和总数
 */
export const getMockWebsitesWithSearch = (options: {
  query?: string;
  filters?: Partial<SearchPageFilters>;
  page?: number;
  limit?: number;
} = {}): MockWebsiteSearchResult => {
  const {
    query = '',
    filters = {},
    page = 1,
    limit = 12
  } = options;

  // 1. 搜索过滤
  let filteredWebsites = searchWebsites(mockWebsites, query, filters);

  // 2. 应用筛选器
  filteredWebsites = applyFilters(filteredWebsites, filters);

  // 3. 排序
  filteredWebsites = sortWebsites(filteredWebsites, filters.sortBy, filters.sortOrder);

  // 4. 分页
  const totalResults = filteredWebsites.length;
  const totalPages = Math.ceil(totalResults / limit);
  const offset = (page - 1) * limit;
  const paginatedWebsites = filteredWebsites.slice(offset, offset + limit);

  return {
    websites: paginatedWebsites,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: totalResults,
      totalPages
    },
    totalResults
  };
};

/**
 * 向后兼容的 getMockWebsites 函数
 * 支持旧API（传入数量参数）和新API（传入选项对象）
 */
export function getMockWebsites(count: number, offset?: number): WebsiteCardData[];
export function getMockWebsites(options: {
  query?: string;
  filters?: Partial<SearchPageFilters>;
  page?: number;
  limit?: number;
}): MockWebsiteSearchResult;
export function getMockWebsites(
  countOrOptions: number | {
    query?: string;
    filters?: Partial<SearchPageFilters>;
    page?: number;
    limit?: number;
  },
  offset: number = 0
): WebsiteCardData[] | MockWebsiteSearchResult {
  if (typeof countOrOptions === 'number') {
    // 旧API：返回数组（向后兼容）
    return mockWebsites.slice(offset, offset + countOrOptions);
  } else {
    // 新API：返回完整结果
    return getMockWebsitesWithSearch(countOrOptions);
  }
}

/**
 * 简化版本的 getMockWebsites，仅返回网站列表（保持向后兼容）
 */
export const getMockWebsitesList = (count: number = 12, offset: number = 0): WebsiteCardData[] => {
  return mockWebsites.slice(offset, offset + count);
};

/**
 * 根据标签筛选模拟网站数据
 * @param tags 标签列表
 * @returns 筛选后的网站数据
 */
export const filterMockWebsitesByTags = (tags: string[]): WebsiteCardData[] => {
  if (tags.length === 0) return mockWebsites;
  
  return mockWebsites.filter(website => 
    tags.some(tag => 
      website.tags.some(websiteTag => 
        websiteTag.toLowerCase().includes(tag.toLowerCase())
      )
    )
  );
};

/**
 * 根据搜索关键词筛选模拟网站数据
 * @param query 搜索关键词
 * @returns 筛选后的网站数据
 */
export const searchMockWebsites = (query: string): WebsiteCardData[] => {
  if (!query.trim()) return mockWebsites;
  
  const searchTerm = query.toLowerCase();
  return mockWebsites.filter(website => 
    website.title.toLowerCase().includes(searchTerm) ||
    website.description?.toLowerCase().includes(searchTerm) ||
    website.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * 获取搜索建议（基于现有数据）
 */
export const getSearchSuggestions = (query: string, limit: number = 5): string[] => {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  const suggestions = new Set<string>();
  
  // 从标题中提取建议
  mockWebsites.forEach(website => {
    if (website.title.toLowerCase().includes(searchTerm)) {
      suggestions.add(website.title);
    }
  });
  
  // 从标签中提取建议
  mockWebsites.forEach(website => {
    website.tags.forEach(tag => {
      if (tag.toLowerCase().includes(searchTerm)) {
        suggestions.add(tag);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, limit);
};

/**
 * 获取所有可用的分类
 */
export const getAllMockCategories = (): string[] => {
  const categorySet = new Set<string>();
  mockWebsites.forEach(website => {
    if (website.category) {
      categorySet.add(website.category);
    }
  });
  return Array.from(categorySet).sort();
};

/**
 * 获取所有可用的标签
 * @returns 标签列表
 */
export const getAllMockTags = (): string[] => {
  const tagSet = new Set<string>();
  mockWebsites.forEach(website => {
    website.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
};

/**
 * 获取标签使用统计
 */
export const getTagUsageStats = (): Array<{ tag: string; count: number }> => {
  const tagCount = new Map<string, number>();
  
  mockWebsites.forEach(website => {
    website.tags.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });
  
  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};