/**
 * Mock blog data for development and preview purposes
 * 
 * 提供示例博客数据，用于开发和预览效果
 * 包含6篇不同分类的博客文章，符合BlogCardData接口规范
 */

import { BlogCardData, BlogCategoryType, BlogCategoryUtils } from '../types';

/**
 * Mock博客文章数据列表
 * 
 * 涵盖6个预定义分类（Lifestyle, Technologies, Design, Travel, Growth）
 * 每篇文章包含完整的展示信息：标题、摘要、作者、封面图等
 */
export const mockBlogs: BlogCardData[] = [
  {
    id: '1',
    title: 'Building a Modern Design System That Scales',
    excerpt: 'Learn how to create a comprehensive design system that grows with your product and team. From component libraries to design tokens, we cover everything you need to know.',
    slug: 'building-modern-design-system-scales',
    coverImage: '/assets/images/blog/design-system-cover.jpg',
    author: {
      name: 'Sarah Chen',
      avatar: '/assets/images/avatars/sarah-chen.jpg'
    },
    category: 'Design',
    publishedAt: '2024-08-01T10:00:00Z'
  },
  {
    id: '2', 
    title: 'The Future of Web Development: React Server Components',
    excerpt: 'Explore the revolutionary React Server Components and how they are changing the way we build modern web applications. A deep dive into performance and user experience.',
    slug: 'future-web-development-react-server-components',
    coverImage: '/assets/images/blog/react-server-components.jpg',
    author: {
      name: 'Alex Rodriguez',
      avatar: '/assets/images/avatars/alex-rodriguez.jpg'
    },
    category: 'Technologies',
    publishedAt: '2024-07-28T14:30:00Z'
  },
  {
    id: '3',
    title: 'Digital Nomad Guide: Working from Bali',
    excerpt: 'Discover the best coworking spaces, cafes, and lifestyle tips for digital nomads in Bali. Complete guide to balancing work and tropical paradise.',
    slug: 'digital-nomad-guide-working-from-bali',
    coverImage: '/assets/images/blog/bali-nomad-cover.jpg',
    author: {
      name: 'Emma Thompson',
      avatar: '/assets/images/avatars/emma-thompson.jpg'
    },
    category: 'Travel',
    publishedAt: '2024-07-25T08:15:00Z'
  },
  {
    id: '4',
    title: 'Mindful Productivity: Working Smarter, Not Harder',
    excerpt: 'Transform your work habits with mindfulness techniques. Learn practical strategies to boost focus, reduce stress, and achieve sustainable productivity.',
    slug: 'mindful-productivity-working-smarter-not-harder',
    coverImage: '/assets/images/blog/mindful-productivity.jpg',
    author: {
      name: 'Dr. James Wilson',
      avatar: '/assets/images/avatars/james-wilson.jpg'
    },
    category: 'Growth',
    publishedAt: '2024-07-22T16:45:00Z'
  },
  {
    id: '5',
    title: 'Creating a Minimalist Home Office Setup',
    excerpt: 'Design a clean, functional workspace that inspires creativity and focus. Tips for organizing your home office with minimalist principles.',
    slug: 'creating-minimalist-home-office-setup',
    coverImage: '/assets/images/blog/minimalist-office.jpg',
    author: {
      name: 'Maya Patel',
      avatar: '/assets/images/avatars/maya-patel.jpg'
    },
    category: 'Lifestyle',
    publishedAt: '2024-07-20T11:20:00Z'
  },
  {
    id: '6',
    title: 'Machine Learning in Frontend Development',
    excerpt: 'Discover how AI and ML are being integrated into frontend applications. From smart recommendations to automated testing, explore the cutting edge.',
    slug: 'machine-learning-frontend-development',
    coverImage: '/assets/images/blog/ml-frontend.jpg',
    author: {
      name: 'David Kim',
      avatar: '/assets/images/avatars/david-kim.jpg'
    },
    category: 'Technologies',
    publishedAt: '2024-07-18T13:10:00Z'
  }
];

/**
 * 获取博客卡片数据（用于UI组件显示）
 * @param blogs 完整的博客数据
 * @returns 优化的卡片数据
 */
export const getBlogCardData = (blogs: BlogCardData[]): BlogCardData[] => {
  return blogs.map(blog => ({
    id: blog.id,
    title: blog.title,
    excerpt: blog.excerpt,
    slug: blog.slug,
    coverImage: blog.coverImage,
    author: blog.author,
    category: blog.category,
    publishedAt: blog.publishedAt
  }));
};

/**
 * 获取指定数量的Mock博客数据
 * @param count 返回的博客数量，默认全部
 * @param offset 起始偏移量，默认0
 * @returns 博客数据数组
 */
export const getMockBlogs = (count?: number, offset: number = 0): BlogCardData[] => {
  if (count === undefined) {
    return mockBlogs.slice(offset);
  }
  return mockBlogs.slice(offset, offset + count);
};

/**
 * 获取指定数量的Mock博客卡片数据
 * @param count 返回的博客数量，默认6篇
 * @param offset 起始偏移量，默认0
 * @returns 博客卡片数据数组
 */
export const getMockBlogCards = (count: number = 6, offset: number = 0): BlogCardData[] => {
  const blogs = getMockBlogs(count, offset);
  return getBlogCardData(blogs);
};

/**
 * 根据分类筛选博客数据
 * @param category 博客分类
 * @returns 筛选后的博客数据
 */
export const filterMockBlogsByCategory = (category: BlogCategoryType): BlogCardData[] => {
  return BlogCategoryUtils.filterByCategory(mockBlogs, category);
};

/**
 * 根据搜索关键词筛选博客数据
 * @param query 搜索关键词
 * @returns 筛选后的博客数据
 */
export const searchMockBlogs = (query: string): BlogCardData[] => {
  if (!query.trim()) return mockBlogs;
  
  const searchTerm = query.toLowerCase();
  return mockBlogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm) ||
    blog.excerpt.toLowerCase().includes(searchTerm) ||
    blog.category.toLowerCase().includes(searchTerm) ||
    blog.author.name.toLowerCase().includes(searchTerm)
  );
};

/**
 * 获取所有可用的博客分类
 * @returns 分类列表（已去重和排序）
 */
export const getAllMockBlogCategories = (): string[] => {
  const categorySet = new Set<string>();
  mockBlogs.forEach(blog => {
    categorySet.add(blog.category);
  });
  return Array.from(categorySet).sort();
};

/**
 * 获取博客分类使用统计
 * @returns 分类使用统计数组
 */
export const getBlogCategoryUsageStats = (): Array<{ category: string; count: number }> => {
  const categoryCount = new Map<string, number>();
  
  mockBlogs.forEach(blog => {
    categoryCount.set(blog.category, (categoryCount.get(blog.category) || 0) + 1);
  });
  
  return Array.from(categoryCount.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * 获取博客基础统计信息
 * @returns 博客统计数据
 */
export const getMockBlogStats = () => {
  const totalBlogs = mockBlogs.length;
  const categoriesUsed = getAllMockBlogCategories().length;
  const categoryStats = getBlogCategoryUsageStats();
  const mostPopularCategory = categoryStats[0];
  const averageTitleLength = Math.round(
    mockBlogs.reduce((sum, blog) => sum + blog.title.length, 0) / totalBlogs
  );

  return {
    totalBlogs,
    categoriesUsed,
    mostPopularCategory,
    averageTitleLength,
    categoryStats
  };
};

/**
 * 根据分页参数获取博客数据
 * @param page 页码（从1开始）
 * @param limit 每页数量，默认6
 * @param category 筛选分类，默认All
 * @returns 分页博客数据和分页信息
 */
export const getMockBlogsPaginated = (
  page: number = 1,
  limit: number = 6,
  category: BlogCategoryType = 'All'
) => {
  // 首先根据分类筛选
  const filteredBlogs = filterMockBlogsByCategory(category);
  
  // 计算分页信息
  const totalBlogs = filteredBlogs.length;
  const totalPages = Math.ceil(totalBlogs / limit);
  const validPage = Math.max(1, Math.min(page, totalPages));
  const offset = (validPage - 1) * limit;
  
  // 获取当前页数据
  const blogs = filteredBlogs.slice(offset, offset + limit);
  
  return {
    blogs,
    pagination: {
      currentPage: validPage,
      totalPages,
      totalBlogs,
      limit,
      hasNextPage: validPage < totalPages,
      hasPrevPage: validPage > 1
    },
    category
  };
};

/**
 * 模拟相对时间格式化（如 "20d AHEAD"）
 * @param publishedAt ISO时间字符串
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (publishedAt: string): string => {
  const now = new Date();
  const published = new Date(publishedAt);
  const diffMs = now.getTime() - published.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return '1d ago';
  } else if (diffDays < 30) {
    return `${diffDays}d ago`;
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } else {
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  }
};

/**
 * 为博客数据添加格式化的相对时间
 * @param blogs 博客数据数组
 * @returns 包含相对时间的博客数据
 */
export const addRelativeTimeToBlogs = (blogs: BlogCardData[]): (BlogCardData & { relativeTime: string })[] => {
  return blogs.map(blog => ({
    ...blog,
    relativeTime: formatRelativeTime(blog.publishedAt)
  }));
};

/**
 * 验证博客数据的完整性
 * @param blog 博客数据
 * @returns 是否为有效的博客数据
 */
export const isValidBlogData = (blog: any): blog is BlogCardData => {
  return (
    typeof blog === 'object' &&
    typeof blog.id === 'string' &&
    typeof blog.title === 'string' &&
    typeof blog.excerpt === 'string' &&
    typeof blog.slug === 'string' &&
    typeof blog.coverImage === 'string' &&
    typeof blog.author === 'object' &&
    typeof blog.author.name === 'string' &&
    typeof blog.category === 'string' &&
    typeof blog.publishedAt === 'string' &&
    BlogCategoryUtils.isValidCategory(blog.category)
  );
};

/**
 * 过滤和验证博客数据数组
 * @param blogs 博客数据数组
 * @returns 有效的博客数据数组
 */
export const validateBlogDataArray = (blogs: any[]): BlogCardData[] => {
  return blogs.filter(isValidBlogData);
};