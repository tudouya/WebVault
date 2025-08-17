/**
 * Blog Detail Type Definitions
 * 
 * 扩展博客详情页面的类型定义，基于现有的 BlogCardData 接口
 * 提供完整的博客文章内容展示和交互功能所需的数据结构
 */

import { BlogCardData, BlogAuthor } from './index';

/**
 * 目录项结构接口
 * 支持文章内容的目录导航功能
 */
export interface TableOfContentsItem {
  /** 标题文本 */
  title: string;
  
  /** 标题层级 (h1=1, h2=2, h3=3, etc.) */
  level: number;
  
  /** 锚点ID，用于页面内跳转 */
  anchor: string;
  
  /** 子标题项（支持嵌套目录结构） */
  children?: TableOfContentsItem[];
}

/**
 * 扩展的博客作者详情接口
 * 在 BlogAuthor 基础上添加社交链接和统计数据
 */
export interface BlogAuthorDetail extends BlogAuthor {
  /** 作者简介 */
  bio?: string;
  
  /** 作者社交媒体链接 */
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    email?: string;
  };
  
  /** 作者统计数据 */
  stats?: {
    /** 发布文章总数 */
    postsCount: number;
    
    /** 获得点赞总数 */
    totalLikes: number;
    
    /** 粉丝数量 */
    followersCount: number;
  };
}

/**
 * 扩展的博客详情数据接口
 * 基于 BlogCardData 扩展，包含完整文章内容和详情页面所需的所有信息
 */
export interface BlogDetailData extends Omit<BlogCardData, 'author'> {
  // 继承 BlogCardData 的基础字段（除了 author，因为我们要扩展它）:
  // id, title, excerpt, slug, coverImage, category, publishedAt
  
  /** 扩展的作者信息 */
  author: BlogAuthorDetail;
  
  // ========== 详情页面扩展字段 ==========
  
  /** 完整文章内容 (Markdown 或 HTML 格式) */
  content: string;
  
  /** 内容格式类型 */
  contentType: 'markdown' | 'html';
  
  /** 预估阅读时间（分钟） */
  readingTime: number;
  
  /** 文章标签数组 */
  tags: string[];
  
  // ========== SEO 和元数据 ==========
  
  /** SEO 专用标题（可选，默认使用 title） */
  seoTitle?: string;
  
  /** SEO 专用描述（可选，默认使用 excerpt） */
  seoDescription?: string;
  
  /** 关键词数组，用于 SEO 优化 */
  keywords: string[];
  
  // ========== 内容结构 ==========
  
  /** 目录结构（可选，用于长文章的导航） */
  tableOfContents?: TableOfContentsItem[];
  
  /** 特色图片集合（可选，文章内的重要图片） */
  featuredImages?: string[];
  
  // ========== 统计数据 ==========
  
  /** 浏览量 */
  viewCount?: number;
  
  /** 点赞数 */
  likeCount?: number;
  
  /** 分享数 */
  shareCount?: number;
  
  // ========== 时间信息 ==========
  
  /** 最后更新时间（可选） */
  updatedAt?: string;
  
  // publishedAt 继承自 BlogCardData
  
  // ========== 关联数据 ==========
  
  /** 相关文章 ID 数组（用于推荐相关内容） */
  relatedPostIds?: string[];
  
  // ========== 状态标识 ==========
  
  /** 是否已发布 */
  isPublished: boolean;
  
  /** 是否为精选文章 */
  isFeatured?: boolean;
}

/**
 * 博客详情页面状态接口
 * 用于管理详情页面的交互状态
 */
export interface BlogDetailPageState {
  /** 当前文章数据 */
  currentPost: BlogDetailData | null;
  
  /** 相关文章列表 */
  relatedPosts: BlogCardData[];
  
  /** 加载状态 */
  isLoading: boolean;
  
  /** 错误信息 */
  error: string | null;
  
  /** 是否显示目录 */
  showTableOfContents: boolean;
  
  /** 当前激活的目录项 */
  activeHeading: string | null;
  
  /** 用户交互状态 */
  userInteractions: {
    hasLiked: boolean;
    hasBookmarked: boolean;
    hasShared: boolean;
  };
}

/**
 * 博客详情操作接口
 * 定义详情页面的可执行操作
 */
export interface BlogDetailActions {
  /** 加载文章详情 */
  loadPostDetail: (slug: string) => Promise<void>;
  
  /** 切换点赞状态 */
  toggleLike: () => Promise<void>;
  
  /** 切换收藏状态 */
  toggleBookmark: () => Promise<void>;
  
  /** 分享文章 */
  sharePost: (platform?: 'twitter' | 'facebook' | 'linkedin' | 'copy') => Promise<void>;
  
  /** 设置激活的标题 */
  setActiveHeading: (anchor: string) => void;
  
  /** 切换目录显示状态 */
  toggleTableOfContents: () => void;
  
  /** 重置状态 */
  reset: () => void;
}

/**
 * 博客详情数据验证工具
 */
export const BlogDetailDataUtils = {
  /**
   * 验证博客详情数据的完整性
   * @param data - 待验证的博客详情数据
   * @returns 验证结果和错误信息
   */
  validateBlogDetailData: (data: Partial<BlogDetailData>): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    // 检查必需字段
    if (!data.id) errors.push('文章 ID 不能为空');
    if (!data.title) errors.push('文章标题不能为空');
    if (!data.content) errors.push('文章内容不能为空');
    if (!data.slug) errors.push('文章 slug 不能为空');
    if (!data.author?.name) errors.push('作者名称不能为空');
    if (!data.category) errors.push('文章分类不能为空');
    if (!data.publishedAt) errors.push('发布时间不能为空');
    
    // 检查内容类型
    if (data.contentType && !['markdown', 'html'].includes(data.contentType)) {
      errors.push('内容类型必须是 markdown 或 html');
    }
    
    // 检查阅读时间
    if (data.readingTime !== undefined && data.readingTime <= 0) {
      errors.push('阅读时间必须大于 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  /**
   * 从博客详情数据提取博客卡片数据
   * @param detailData - 博客详情数据
   * @returns 博客卡片数据
   */
  extractCardData: (detailData: BlogDetailData): BlogCardData => {
    return {
      id: detailData.id,
      title: detailData.title,
      excerpt: detailData.excerpt,
      slug: detailData.slug,
      coverImage: detailData.coverImage,
      author: {
        name: detailData.author.name,
        avatar: detailData.author.avatar,
      },
      category: detailData.category,
      publishedAt: detailData.publishedAt,
    };
  },
  
  /**
   * 生成文章的预估阅读时间
   * @param content - 文章内容
   * @param wordsPerMinute - 每分钟阅读字数，默认 200
   * @returns 预估阅读时间（分钟）
   */
  calculateReadingTime: (content: string, wordsPerMinute: number = 200): number => {
    // 移除 HTML 标签和 Markdown 语法，计算纯文本字数
    const plainText = content
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/[#*`]/g, '') // 移除 Markdown 标记
      .trim();
    
    const wordCount = plainText.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    
    return Math.max(1, readingTime); // 最少 1 分钟
  },
} as const;