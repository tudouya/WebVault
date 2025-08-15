/**
 * Mock collection data for development and preview purposes
 * 
 * 提供示例集合数据，用于开发和预览效果
 * 包含不同主题的集合，展示各种彩色图标和描述内容
 */

import { Collection, CollectionCardData, CollectionStatus, CollectionIcon } from '../types/collection';

/**
 * 预定义的集合图标颜色配置
 * 使用不同的背景色区分不同类型的集合
 */
const COLLECTION_COLORS = {
  red: {
    backgroundColor: '#EF4444',
    textColor: '#FFFFFF'
  },
  blue: {
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF'
  },
  yellow: {
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF'
  },
  green: {
    backgroundColor: '#10B981',
    textColor: '#FFFFFF'
  },
  purple: {
    backgroundColor: '#8B5CF6',
    textColor: '#FFFFFF'
  },
  orange: {
    backgroundColor: '#F97316',
    textColor: '#FFFFFF'
  },
  pink: {
    backgroundColor: '#EC4899',
    textColor: '#FFFFFF'
  },
  indigo: {
    backgroundColor: '#6366F1',
    textColor: '#FFFFFF'
  },
  teal: {
    backgroundColor: '#14B8A6',
    textColor: '#FFFFFF'
  }
} as const;

/**
 * 创建集合图标配置的辅助函数
 */
const createIcon = (character: string, colorKey: keyof typeof COLLECTION_COLORS): CollectionIcon => ({
  character,
  ...COLLECTION_COLORS[colorKey]
});

/**
 * Mock集合数据列表
 * 涵盖开发工具、设计资源、学习平台、生产力工具等不同领域
 */
export const mockCollections: Collection[] = [
  {
    id: '1',
    title: '开发者必备工具',
    description: '精选的开发工具和资源，包括代码编辑器、版本控制、调试工具等，提升开发效率的必备工具集合。',
    icon: createIcon('💻', 'blue'),
    websiteCount: 24,
    status: 'active' as CollectionStatus,
    tags: ['开发工具', '编程', '效率'],
    sortOrder: 1,
    slug: 'developer-essential-tools',
    metaDescription: '开发者必备工具合集，涵盖代码编辑、版本控制、调试等各个环节的优质工具',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-10T15:30:00Z',
    createdBy: 'admin'
  },
  {
    id: '2',
    title: '设计师灵感库',
    description: '汇集优秀的设计作品展示平台、色彩搭配工具、字体资源等，为设计师提供源源不断的创作灵感。',
    icon: createIcon('🎨', 'red'),
    websiteCount: 18,
    status: 'active' as CollectionStatus,
    tags: ['设计', '创意', '灵感', 'UI/UX'],
    sortOrder: 2,
    slug: 'designer-inspiration',
    metaDescription: '设计师灵感资源合集，包含作品展示、工具资源、创意平台等',
    createdAt: '2024-02-01T14:20:00Z',
    updatedAt: '2024-08-12T09:15:00Z',
    createdBy: 'admin'
  },
  {
    id: '3',
    title: '学习资源平台',
    description: '优质的在线学习平台和教育资源，涵盖编程、设计、商业等多个领域的课程和教程。',
    icon: createIcon('📚', 'green'),
    websiteCount: 32,
    status: 'active' as CollectionStatus,
    tags: ['学习', '教育', '课程', '技能'],
    sortOrder: 3,
    slug: 'learning-platforms',
    metaDescription: '在线学习资源平台合集，提供编程、设计、商业等领域的优质课程',
    createdAt: '2024-02-15T11:45:00Z',
    updatedAt: '2024-08-08T16:20:00Z',
    createdBy: 'admin'
  },
  {
    id: '4',
    title: '生产力工具箱',
    description: '提升个人和团队生产力的工具集合，包括项目管理、时间管理、协作沟通等实用工具。',
    icon: createIcon('⚡', 'yellow'),
    websiteCount: 21,
    status: 'active' as CollectionStatus,
    tags: ['生产力', '项目管理', '协作', '效率'],
    sortOrder: 4,
    slug: 'productivity-tools',
    metaDescription: '生产力工具合集，帮助提升个人和团队的工作效率',
    createdAt: '2024-03-01T13:30:00Z',
    updatedAt: '2024-08-05T12:45:00Z',
    createdBy: 'admin'
  },
  {
    id: '5',
    title: '免费素材资源',
    description: '收集高质量的免费素材资源，包括图片、图标、字体、音频等，为创作项目提供丰富素材。',
    icon: createIcon('🎁', 'purple'),
    websiteCount: 15,
    status: 'active' as CollectionStatus,
    tags: ['素材', '免费', '资源', '设计'],
    sortOrder: 5,
    slug: 'free-resources',
    metaDescription: '免费素材资源合集，提供图片、图标、字体等高质量创作素材',
    createdAt: '2024-03-10T16:15:00Z',
    updatedAt: '2024-07-30T10:30:00Z',
    createdBy: 'admin'
  },
  {
    id: '6',
    title: '前端开发框架',
    description: '现代前端开发框架和库的精选合集，包括React、Vue、Angular等主流框架及其生态工具。',
    icon: createIcon('⚛️', 'orange'),
    websiteCount: 28,
    status: 'active' as CollectionStatus,
    tags: ['前端', '框架', 'React', 'Vue', 'JavaScript'],
    sortOrder: 6,
    slug: 'frontend-frameworks',
    metaDescription: '前端开发框架合集，涵盖React、Vue、Angular等主流技术栈',
    createdAt: '2024-03-20T09:25:00Z',
    updatedAt: '2024-08-02T14:10:00Z',
    createdBy: 'admin'
  },
  {
    id: '7',
    title: 'AI 工具大全',
    description: '人工智能工具和服务的综合合集，包括AI写作、图像生成、代码助手等前沿AI应用。',
    icon: createIcon('🤖', 'pink'),
    websiteCount: 19,
    status: 'active' as CollectionStatus,
    tags: ['AI', '人工智能', '工具', '自动化'],
    sortOrder: 7,
    slug: 'ai-tools',
    metaDescription: 'AI工具合集，汇集写作、图像、代码等领域的人工智能应用',
    createdAt: '2024-04-01T08:40:00Z',
    updatedAt: '2024-08-14T11:55:00Z',
    createdBy: 'admin'
  },
  {
    id: '8',
    title: '数据可视化平台',
    description: '专业的数据分析和可视化工具平台，帮助将复杂数据转化为直观的图表和报告。',
    icon: createIcon('📊', 'indigo'),
    websiteCount: 12,
    status: 'active' as CollectionStatus,
    tags: ['数据', '可视化', '分析', '图表'],
    sortOrder: 8,
    slug: 'data-visualization',
    metaDescription: '数据可视化平台合集，提供专业的数据分析和图表制作工具',
    createdAt: '2024-04-15T12:20:00Z',
    updatedAt: '2024-08-06T13:25:00Z',
    createdBy: 'admin'
  },
  {
    id: '9',
    title: '开源项目精选',
    description: '精心挑选的优秀开源项目，涵盖各个技术领域的高质量开源软件和工具库。',
    icon: createIcon('🌟', 'teal'),
    websiteCount: 35,
    status: 'active' as CollectionStatus,
    tags: ['开源', 'GitHub', '项目', '社区'],
    sortOrder: 9,
    slug: 'awesome-opensource',
    metaDescription: '开源项目精选合集，汇集各技术领域的优秀开源软件',
    createdAt: '2024-04-25T15:50:00Z',
    updatedAt: '2024-07-28T17:40:00Z',
    createdBy: 'admin'
  }
];

/**
 * 获取集合卡片数据（用于UI组件显示）
 * @param collections 完整的集合数据
 * @returns 优化的卡片数据
 */
export const getCollectionCardData = (collections: Collection[]): CollectionCardData[] => {
  return collections.map(collection => ({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    icon: collection.icon,
    websiteCount: collection.websiteCount,
    status: collection.status,
    tags: collection.tags,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt
  }));
};

/**
 * 获取指定数量的Mock集合数据
 * @param count 返回的集合数量，默认全部
 * @param offset 起始偏移量，默认0
 * @returns 集合数据数组
 */
export const getMockCollections = (count?: number, offset: number = 0): Collection[] => {
  if (count === undefined) {
    return mockCollections.slice(offset);
  }
  return mockCollections.slice(offset, offset + count);
};

/**
 * 获取指定数量的Mock集合卡片数据
 * @param count 返回的集合数量，默认全部
 * @param offset 起始偏移量，默认0
 * @returns 集合卡片数据数组
 */
export const getMockCollectionCards = (count?: number, offset: number = 0): CollectionCardData[] => {
  const collections = getMockCollections(count, offset);
  return getCollectionCardData(collections);
};

/**
 * 根据状态筛选集合数据
 * @param status 集合状态
 * @returns 筛选后的集合数据
 */
export const filterMockCollectionsByStatus = (status: CollectionStatus): Collection[] => {
  return mockCollections.filter(collection => collection.status === status);
};

/**
 * 根据标签筛选集合数据
 * @param tags 标签列表
 * @returns 筛选后的集合数据
 */
export const filterMockCollectionsByTags = (tags: string[]): Collection[] => {
  if (tags.length === 0) return mockCollections;
  
  return mockCollections.filter(collection => 
    collection.tags?.some(tag => 
      tags.some(filterTag => 
        tag.toLowerCase().includes(filterTag.toLowerCase())
      )
    )
  );
};

/**
 * 根据搜索关键词筛选集合数据
 * @param query 搜索关键词
 * @returns 筛选后的集合数据
 */
export const searchMockCollections = (query: string): Collection[] => {
  if (!query.trim()) return mockCollections;
  
  const searchTerm = query.toLowerCase();
  return mockCollections.filter(collection => 
    collection.title.toLowerCase().includes(searchTerm) ||
    collection.description.toLowerCase().includes(searchTerm) ||
    collection.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * 获取所有可用的集合标签
 * @returns 标签列表（已去重和排序）
 */
export const getAllMockCollectionTags = (): string[] => {
  const tagSet = new Set<string>();
  mockCollections.forEach(collection => {
    collection.tags?.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
};

/**
 * 获取集合标签使用统计
 * @returns 标签使用统计数组
 */
export const getCollectionTagUsageStats = (): Array<{ tag: string; count: number }> => {
  const tagCount = new Map<string, number>();
  
  mockCollections.forEach(collection => {
    collection.tags?.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });
  
  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * 获取集合基础统计信息
 * @returns 集合统计数据
 */
export const getMockCollectionStats = () => {
  const totalCollections = mockCollections.length;
  const activeCollections = mockCollections.filter(c => c.status === 'active').length;
  const totalWebsites = mockCollections.reduce((sum, c) => sum + c.websiteCount, 0);
  const averageWebsitesPerCollection = totalCollections > 0 ? Math.round(totalWebsites / totalCollections) : 0;
  const mostPopularTags = getCollectionTagUsageStats().slice(0, 5);

  return {
    totalCollections,
    activeCollections,
    totalWebsites,
    averageWebsitesPerCollection,
    mostPopularTags
  };
};