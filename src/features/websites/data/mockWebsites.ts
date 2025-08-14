/**
 * Mock website data for development and preview purposes
 * 
 * 提供示例网站数据，用于开发和预览效果
 * 包含各种类型的网站，展示不同的标签、评分和广告类型
 */

import { WebsiteCardData } from '../types/website';

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
    isAd: false,
    rating: 4.9,
    visitCount: 125420
  },
  {
    id: '2',
    title: 'Stack Overflow',
    description: '程序员问答社区，汇集全球开发者智慧。无论遇到什么编程问题，这里都能找到专业的解答和讨论。',
    url: 'https://stackoverflow.com',
    favicon_url: '/api/favicon?domain=stackoverflow.com',
    tags: ['问答', '编程', '社区', '学习'],
    isAd: false,
    rating: 4.8,
    visitCount: 89340
  },
  {
    id: '3',
    title: 'Figma',
    description: '协作式设计工具，让设计师和产品团队能够实时协作创建用户界面和用户体验设计。支持原型制作和设计系统管理。',
    url: 'https://figma.com',
    favicon_url: '/api/favicon?domain=figma.com',
    tags: ['设计工具', 'UI/UX', '协作', '原型'],
    isAd: true,
    adType: 'sponsored',
    rating: 4.7,
    visitCount: 67890
  },
  {
    id: '4',
    title: 'Notion',
    description: '一体化工作空间，结合笔记、知识库、项目管理和协作功能。帮助个人和团队更好地组织信息和提高生产力。',
    url: 'https://notion.so',
    favicon_url: '/api/favicon?domain=notion.so',
    tags: ['生产力', '笔记', '项目管理', '协作'],
    isAd: false,
    rating: 4.6,
    visitCount: 45670
  },
  {
    id: '5',
    title: 'Dribbble',
    description: '设计师作品展示平台，汇集全球优秀的UI/UX设计、平面设计和创意作品。是寻找设计灵感的绝佳地点。',
    url: 'https://dribbble.com',
    favicon_url: '/api/favicon?domain=dribbble.com',
    tags: ['设计', '作品集', '创意', '灵感'],
    isAd: false,
    rating: 4.5,
    visitCount: 34560
  },
  {
    id: '6',
    title: 'Behance',
    description: 'Adobe旗下创意作品展示平台，展示摄影、设计、插画等各类创意作品。连接创意人才与品牌合作机会。',
    url: 'https://behance.net',
    favicon_url: '/api/favicon?domain=behance.net',
    tags: ['创意', 'Adobe', '作品集', '摄影'],
    isAd: false,
    rating: 4.4,
    visitCount: 28900
  },
  {
    id: '7',
    title: 'Vercel',
    description: '现代化的前端部署平台，为React、Next.js等框架提供最优的部署体验。支持自动部署、边缘网络和无服务器函数。',
    url: 'https://vercel.com',
    favicon_url: '/api/favicon?domain=vercel.com',
    tags: ['部署', '前端', 'Next.js', '无服务器'],
    isAd: true,
    adType: 'featured',
    rating: 4.8,
    visitCount: 56780
  },
  {
    id: '8',
    title: 'Unsplash',
    description: '免费高质量图片库，提供数百万张由全球摄影师贡献的精美照片。支持商业使用，是设计师的必备资源。',
    url: 'https://unsplash.com',
    favicon_url: '/api/favicon?domain=unsplash.com',
    tags: ['图片', '摄影', '免费', '素材'],
    isAd: false,
    rating: 4.7,
    visitCount: 78560
  },
  {
    id: '9',
    title: 'CodePen',
    description: '前端代码在线编辑器和社区，可以快速创建和分享HTML、CSS、JavaScript代码片段。是学习前端技术的优秀平台。',
    url: 'https://codepen.io',
    favicon_url: '/api/favicon?domain=codepen.io',
    tags: ['前端', '代码', '在线编辑器', '学习'],
    isAd: false,
    rating: 4.6,
    visitCount: 43210
  },
  {
    id: '10',
    title: 'Linear',
    description: '现代化项目管理和问题跟踪工具，专为高性能团队设计。提供快速、直观的界面和强大的项目管理功能。',
    url: 'https://linear.app',
    favicon_url: '/api/favicon?domain=linear.app',
    tags: ['项目管理', '敏捷', '团队协作', '效率'],
    isAd: true,
    adType: 'premium',
    rating: 4.8,
    visitCount: 32450
  },
  {
    id: '11',
    title: 'Tailwind CSS',
    description: 'Utility-first CSS框架，提供低级实用程序类来构建自定义设计。无需离开HTML即可快速构建现代用户界面。',
    url: 'https://tailwindcss.com',
    favicon_url: '/api/favicon?domain=tailwindcss.com',
    tags: ['CSS框架', '前端', '设计系统', '工具'],
    isAd: false,
    rating: 4.9,
    visitCount: 98760
  },
  {
    id: '12',
    title: 'Product Hunt',
    description: '新产品发现平台，每天展示最新、最酷的科技产品。创业者和产品爱好者分享和发现优秀产品的社区。',
    url: 'https://producthunt.com',
    favicon_url: '/api/favicon?domain=producthunt.com',
    tags: ['产品', '创业', '社区', '发现'],
    isAd: false,
    rating: 4.5,
    visitCount: 54320
  }
];

/**
 * 获取指定数量的模拟网站数据
 * @param count 需要获取的网站数量
 * @param offset 起始偏移量
 * @returns 网站数据列表
 */
export const getMockWebsites = (count: number = 12, offset: number = 0): WebsiteCardData[] => {
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