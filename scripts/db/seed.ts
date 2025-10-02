/**
 * Database Seed Script
 *
 * This script populates the database with realistic test data:
 * - 50+ websites with real URLs and metadata
 * - 10 categories with 2-level hierarchy
 * - 20 tags with color coding
 * - 8 collections
 * - 20+ blog posts with real content
 * - Relationships between all entities
 */

import { drizzle } from 'drizzle-orm/d1';
import Database from 'better-sqlite3';
import { categories } from '@/lib/db/schema/categories';
import { tags } from '@/lib/db/schema/tags';
import { collections } from '@/lib/db/schema/collections';
import { websites } from '@/lib/db/schema/websites';
import { websiteTags } from '@/lib/db/schema/website-tags';
import { collectionItems } from '@/lib/db/schema/collection-items';
import { blogPosts } from '@/lib/db/schema/blog-posts';

// Helper: Generate ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Helper: Generate timestamp
function generateTimestamp(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// Helper: Random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Random items from array
function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

// ============= CATEGORIES DATA =============
const categoriesData = [
  // Top-level categories
  {
    id: generateId('cat'),
    name: '开发工具',
    slug: 'dev-tools',
    description: '开发人员必备的工具和平台',
    parentId: null,
    displayOrder: 1,
    icon: 'Code',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(90),
    updatedAt: generateTimestamp(90),
  },
  {
    id: generateId('cat'),
    name: '设计资源',
    slug: 'design-resources',
    description: '设计师喜爱的设计资源和工具',
    parentId: null,
    displayOrder: 2,
    icon: 'Palette',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(85),
    updatedAt: generateTimestamp(85),
  },
  {
    id: generateId('cat'),
    name: '学习平台',
    slug: 'learning-platforms',
    description: '在线学习和教育资源',
    parentId: null,
    displayOrder: 3,
    icon: 'GraduationCap',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(80),
    updatedAt: generateTimestamp(80),
  },
  {
    id: generateId('cat'),
    name: 'AI 工具',
    slug: 'ai-tools',
    description: '人工智能和机器学习工具',
    parentId: null,
    displayOrder: 4,
    icon: 'Brain',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(75),
    updatedAt: generateTimestamp(75),
  },
  {
    id: generateId('cat'),
    name: '生产力工具',
    slug: 'productivity',
    description: '提升工作效率的工具',
    parentId: null,
    displayOrder: 5,
    icon: 'Zap',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(70),
    updatedAt: generateTimestamp(70),
  },
];

// Child categories
const childCategories = [
  {
    id: generateId('cat'),
    name: '代码托管',
    slug: 'code-hosting',
    description: 'Git 代码仓库和托管服务',
    parentId: categoriesData[0].id, // 开发工具
    displayOrder: 1,
    icon: 'GitBranch',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(60),
    updatedAt: generateTimestamp(60),
  },
  {
    id: generateId('cat'),
    name: 'API 工具',
    slug: 'api-tools',
    description: 'API 开发和测试工具',
    parentId: categoriesData[0].id, // 开发工具
    displayOrder: 2,
    icon: 'Server',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(55),
    updatedAt: generateTimestamp(55),
  },
  {
    id: generateId('cat'),
    name: 'UI 组件库',
    slug: 'ui-libraries',
    description: '前端 UI 组件和框架',
    parentId: categoriesData[1].id, // 设计资源
    displayOrder: 1,
    icon: 'Layers',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(50),
    updatedAt: generateTimestamp(50),
  },
  {
    id: generateId('cat'),
    name: '图标库',
    slug: 'icon-libraries',
    description: '免费图标资源',
    parentId: categoriesData[1].id, // 设计资源
    displayOrder: 2,
    icon: 'Star',
    isActive: true,
    status: 'published',
    createdAt: generateTimestamp(45),
    updatedAt: generateTimestamp(45),
  },
  {
    id: generateId('cat'),
    name: '废弃分类',
    slug: 'deprecated-category',
    description: '此分类已不再使用',
    parentId: null,
    displayOrder: 99,
    icon: 'Archive',
    isActive: false,
    status: 'inactive',
    createdAt: generateTimestamp(40),
    updatedAt: generateTimestamp(40),
  },
];

const allCategories = [...categoriesData, ...childCategories];

// ============= TAGS DATA =============
const tagsData = [
  { name: '前端', slug: 'frontend', color: '#3b82f6', description: '前端开发相关' },
  { name: '后端', slug: 'backend', color: '#10b981', description: '后端开发相关' },
  { name: 'React', slug: 'react', color: '#61dafb', description: 'React 技术栈' },
  { name: 'Vue', slug: 'vue', color: '#42b883', description: 'Vue.js 技术栈' },
  { name: 'TypeScript', slug: 'typescript', color: '#3178c6', description: 'TypeScript 语言' },
  { name: 'JavaScript', slug: 'javascript', color: '#f7df1e', description: 'JavaScript 语言' },
  { name: 'CSS', slug: 'css', color: '#264de4', description: 'CSS 样式' },
  { name: 'UI/UX', slug: 'ui-ux', color: '#ec4899', description: '用户界面和体验' },
  { name: '设计', slug: 'design', color: '#8b5cf6', description: '设计资源' },
  { name: 'AI', slug: 'ai', color: '#f59e0b', description: '人工智能' },
  { name: '开源', slug: 'open-source', color: '#059669', description: '开源项目' },
  { name: '工具', slug: 'tools', color: '#6366f1', description: '开发工具' },
  { name: '学习', slug: 'learning', color: '#14b8a6', description: '学习资源' },
  { name: '文档', slug: 'documentation', color: '#64748b', description: '技术文档' },
  { name: 'API', slug: 'api', color: '#0891b2', description: 'API 服务' },
  { name: '云服务', slug: 'cloud', color: '#06b6d4', description: '云计算服务' },
  { name: '数据库', slug: 'database', color: '#84cc16', description: '数据库技术' },
  { name: '测试', slug: 'testing', color: '#a855f7', description: '测试工具' },
  { name: '部署', slug: 'deployment', color: '#f97316', description: '部署和运维' },
  { name: '免费', slug: 'free', color: '#22c55e', description: '免费资源' },
].map((tag, index) => ({
  id: generateId('tag'),
  name: tag.name,
  slug: tag.slug,
  description: tag.description,
  color: tag.color,
  isActive: true,
  createdAt: generateTimestamp(90 - index),
  updatedAt: generateTimestamp(90 - index),
}));

// ============= COLLECTIONS DATA =============
const collectionsData = [
  {
    id: generateId('col'),
    name: '前端必备工具',
    slug: 'frontend-essentials',
    description: '前端开发者必备的工具和资源集合',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    isFeatured: true,
    displayOrder: 1,
    createdAt: generateTimestamp(60),
    updatedAt: generateTimestamp(60),
  },
  {
    id: generateId('col'),
    name: 'React 生态',
    slug: 'react-ecosystem',
    description: 'React 相关的优秀库和工具',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    isFeatured: true,
    displayOrder: 2,
    createdAt: generateTimestamp(55),
    updatedAt: generateTimestamp(55),
  },
  {
    id: generateId('col'),
    name: 'AI 工具箱',
    slug: 'ai-toolbox',
    description: '最新最热的 AI 工具和平台',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    isFeatured: true,
    displayOrder: 3,
    createdAt: generateTimestamp(50),
    updatedAt: generateTimestamp(50),
  },
  {
    id: generateId('col'),
    name: '设计师收藏夹',
    slug: 'designer-favorites',
    description: '设计师常用的设计资源和工具',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
    isFeatured: false,
    displayOrder: 4,
    createdAt: generateTimestamp(45),
    updatedAt: generateTimestamp(45),
  },
  {
    id: generateId('col'),
    name: '学习资源精选',
    slug: 'learning-resources',
    description: '精选的在线学习平台和课程',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    isFeatured: false,
    displayOrder: 5,
    createdAt: generateTimestamp(40),
    updatedAt: generateTimestamp(40),
  },
  {
    id: generateId('col'),
    name: '开源项目推荐',
    slug: 'open-source-picks',
    description: '值得学习和使用的开源项目',
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498',
    isFeatured: false,
    displayOrder: 6,
    createdAt: generateTimestamp(35),
    updatedAt: generateTimestamp(35),
  },
  {
    id: generateId('col'),
    name: '生产力工具',
    slug: 'productivity-tools',
    description: '提升工作效率的实用工具',
    coverImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    isFeatured: false,
    displayOrder: 7,
    createdAt: generateTimestamp(30),
    updatedAt: generateTimestamp(30),
  },
  {
    id: generateId('col'),
    name: 'API 和云服务',
    slug: 'api-cloud-services',
    description: '常用的 API 服务和云平台',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
    isFeatured: false,
    displayOrder: 8,
    createdAt: generateTimestamp(25),
    updatedAt: generateTimestamp(25),
  },
];

// ============= WEBSITES DATA =============
const websitesData = [
  // 开发工具分类 (25+ websites)
  {
    title: 'GitHub',
    url: 'https://github.com',
    description: '全球最大的代码托管平台，开源项目的家园',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: true,
    visitCount: 5000,
    status: 'published',
  },
  {
    title: 'GitLab',
    url: 'https://gitlab.com',
    description: '完整的 DevOps 平台，支持 CI/CD',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 2800,
    status: 'published',
  },
  {
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    description: '程序员问答社区，解决编程问题的第一站',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: true,
    visitCount: 4200,
    status: 'published',
  },
  {
    title: 'VS Code',
    url: 'https://code.visualstudio.com',
    description: '微软出品的免费代码编辑器',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: true,
    visitCount: 3900,
    status: 'published',
  },
  {
    title: 'Postman',
    url: 'https://www.postman.com',
    description: 'API 开发和测试工具',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 2100,
    status: 'published',
  },
  {
    title: 'npm',
    url: 'https://www.npmjs.com',
    description: 'Node.js 包管理器',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 1800,
    status: 'published',
  },
  {
    title: 'Docker Hub',
    url: 'https://hub.docker.com',
    description: '容器镜像仓库',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1500,
    status: 'published',
  },
  {
    title: 'Vercel',
    url: 'https://vercel.com',
    description: '前端应用部署平台',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: true,
    visitCount: 2600,
    status: 'published',
  },
  {
    title: 'Netlify',
    url: 'https://www.netlify.com',
    description: '静态网站托管和自动化部署',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1900,
    status: 'published',
  },
  {
    title: 'CodePen',
    url: 'https://codepen.io',
    description: '前端代码在线编辑器和社区',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 1200,
    status: 'published',
  },
  {
    title: 'CodeSandbox',
    url: 'https://codesandbox.io',
    description: '在线代码编辑器，支持完整的开发环境',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1400,
    status: 'published',
  },
  {
    title: 'Replit',
    url: 'https://replit.com',
    description: '协作式在线 IDE',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 980,
    status: 'published',
  },
  {
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    description: 'Web 开发者最全面的文档资源',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: true,
    visitCount: 3200,
    status: 'published',
  },
  {
    title: 'Can I Use',
    url: 'https://caniuse.com',
    description: '浏览器特性兼容性查询',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1600,
    status: 'published',
  },
  {
    title: 'Regex101',
    url: 'https://regex101.com',
    description: '正则表达式测试和调试工具',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 850,
    status: 'published',
  },
  {
    title: 'JSONPlaceholder',
    url: 'https://jsonplaceholder.typicode.com',
    description: '免费的 REST API 测试服务',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 720,
    status: 'published',
  },
  {
    title: 'Insomnia',
    url: 'https://insomnia.rest',
    description: 'REST 和 GraphQL API 客户端',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 650,
    status: 'published',
  },
  {
    title: 'Sourcetree',
    url: 'https://www.sourcetreeapp.com',
    description: '免费的 Git 图形化客户端',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 580,
    status: 'published',
  },
  {
    title: 'DBeaver',
    url: 'https://dbeaver.io',
    description: '通用数据库管理工具',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 520,
    status: 'published',
  },
  {
    title: 'Prettier',
    url: 'https://prettier.io',
    description: '代码格式化工具',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1100,
    status: 'published',
  },
  {
    title: 'ESLint',
    url: 'https://eslint.org',
    description: 'JavaScript 代码检查工具',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 980,
    status: 'published',
  },
  {
    title: 'Webpack',
    url: 'https://webpack.js.org',
    description: '模块打包工具',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 890,
    status: 'published',
  },
  {
    title: 'Vite',
    url: 'https://vitejs.dev',
    description: '下一代前端构建工具',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: true,
    visitCount: 1800,
    status: 'published',
  },
  {
    title: 'Babel',
    url: 'https://babeljs.io',
    description: 'JavaScript 编译器',
    categoryId: categoriesData[0].id,
    rating: 4,
    isFeatured: false,
    visitCount: 760,
    status: 'published',
  },
  {
    title: 'Jest',
    url: 'https://jestjs.io',
    description: 'JavaScript 测试框架',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 920,
    status: 'published',
  },
  {
    title: 'Cypress',
    url: 'https://www.cypress.io',
    description: '端到端测试框架',
    categoryId: categoriesData[0].id,
    rating: 5,
    isFeatured: false,
    visitCount: 840,
    status: 'published',
  },

  // 设计资源分类
  {
    title: 'Figma',
    url: 'https://www.figma.com',
    description: '协作式界面设计工具',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: true,
    visitCount: 3500,
    status: 'published',
  },
  {
    title: 'Dribbble',
    url: 'https://dribbble.com',
    description: '设计师作品展示社区',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: true,
    visitCount: 2400,
    status: 'published',
  },
  {
    title: 'Behance',
    url: 'https://www.behance.net',
    description: 'Adobe 旗下的设计作品平台',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1800,
    status: 'published',
  },
  {
    title: 'Unsplash',
    url: 'https://unsplash.com',
    description: '免费高质量图片素材',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: true,
    visitCount: 2800,
    status: 'published',
  },
  {
    title: 'Pexels',
    url: 'https://www.pexels.com',
    description: '免费图片和视频素材',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1600,
    status: 'published',
  },
  {
    title: 'Coolors',
    url: 'https://coolors.co',
    description: '配色方案生成器',
    categoryId: categoriesData[1].id,
    rating: 4,
    isFeatured: false,
    visitCount: 980,
    status: 'published',
  },
  {
    title: 'Font Awesome',
    url: 'https://fontawesome.com',
    description: '最流行的图标库',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1400,
    status: 'published',
  },
  {
    title: 'Lucide',
    url: 'https://lucide.dev',
    description: '美观的开源图标库',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: false,
    visitCount: 850,
    status: 'published',
  },
  {
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: '实用优先的 CSS 框架',
    categoryId: categoriesData[1].id,
    rating: 5,
    isFeatured: true,
    visitCount: 3200,
    status: 'published',
  },

  // 学习平台分类
  {
    title: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org',
    description: '免费学习编程',
    categoryId: categoriesData[2].id,
    rating: 5,
    isFeatured: true,
    visitCount: 2200,
    status: 'published',
  },
  {
    title: 'Coursera',
    url: 'https://www.coursera.org',
    description: '在线课程学习平台',
    categoryId: categoriesData[2].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1600,
    status: 'published',
  },
  {
    title: 'Udemy',
    url: 'https://www.udemy.com',
    description: '在线技能学习市场',
    categoryId: categoriesData[2].id,
    rating: 4,
    isFeatured: false,
    visitCount: 1400,
    status: 'published',
  },
  {
    title: 'LeetCode',
    url: 'https://leetcode.com',
    description: '算法题练习平台',
    categoryId: categoriesData[2].id,
    rating: 5,
    isFeatured: true,
    visitCount: 2800,
    status: 'published',
  },
  {
    title: 'HackerRank',
    url: 'https://www.hackerrank.com',
    description: '编程挑战和技能认证',
    categoryId: categoriesData[2].id,
    rating: 4,
    isFeatured: false,
    visitCount: 980,
    status: 'published',
  },

  // AI 工具分类
  {
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    description: 'OpenAI 的对话式 AI',
    categoryId: categoriesData[3].id,
    rating: 5,
    isFeatured: true,
    visitCount: 4800,
    status: 'published',
    isAd: true,
    adType: 'sponsored',
  },
  {
    title: 'Claude',
    url: 'https://claude.ai',
    description: 'Anthropic 的 AI 助手',
    categoryId: categoriesData[3].id,
    rating: 5,
    isFeatured: true,
    visitCount: 3200,
    status: 'published',
  },
  {
    title: 'Midjourney',
    url: 'https://www.midjourney.com',
    description: 'AI 图像生成工具',
    categoryId: categoriesData[3].id,
    rating: 5,
    isFeatured: true,
    visitCount: 2800,
    status: 'published',
    isAd: true,
    adType: 'sponsored',
  },
  {
    title: 'Stable Diffusion',
    url: 'https://stability.ai',
    description: '开源 AI 图像生成',
    categoryId: categoriesData[3].id,
    rating: 4,
    isFeatured: false,
    visitCount: 1600,
    status: 'published',
  },
  {
    title: 'GitHub Copilot',
    url: 'https://github.com/features/copilot',
    description: 'AI 代码助手',
    categoryId: categoriesData[3].id,
    rating: 5,
    isFeatured: true,
    visitCount: 2400,
    status: 'published',
    isAd: true,
    adType: 'sponsored',
  },

  // 生产力工具分类
  {
    title: 'Notion',
    url: 'https://www.notion.so',
    description: '一体化工作空间',
    categoryId: categoriesData[4].id,
    rating: 5,
    isFeatured: true,
    visitCount: 3600,
    status: 'published',
    isAd: true,
    adType: 'sponsored',
  },
  {
    title: 'Obsidian',
    url: 'https://obsidian.md',
    description: '知识管理工具',
    categoryId: categoriesData[4].id,
    rating: 5,
    isFeatured: false,
    visitCount: 1800,
    status: 'published',
  },
  {
    title: 'Trello',
    url: 'https://trello.com',
    description: '看板式项目管理',
    categoryId: categoriesData[4].id,
    rating: 4,
    isFeatured: false,
    visitCount: 1200,
    status: 'published',
  },

  // Pending and rejected websites
  {
    title: '待审核网站 1',
    url: 'https://example-pending1.com',
    description: '这是一个待审核的网站',
    categoryId: categoriesData[0].id,
    rating: 3,
    isFeatured: false,
    visitCount: 0,
    status: 'draft',
  },
  {
    title: '待审核网站 2',
    url: 'https://example-pending2.com',
    description: '这是另一个待审核的网站',
    categoryId: categoriesData[1].id,
    rating: 3,
    isFeatured: false,
    visitCount: 0,
    status: 'draft',
  },
  {
    title: '已拒绝网站',
    url: 'https://example-rejected.com',
    description: '这个网站被拒绝了',
    categoryId: categoriesData[0].id,
    rating: 2,
    isFeatured: false,
    visitCount: 0,
    status: 'draft',
  },

  // Inactive websites
  {
    title: '已下线网站',
    url: 'https://example-inactive.com',
    description: '这个网站已经不再活跃',
    categoryId: categoriesData[4].id,
    rating: 3,
    isFeatured: false,
    visitCount: 120,
    status: 'draft',
  },
].map((site, index) => ({
  id: generateId('web'),
  title: site.title,
  description: site.description,
  url: site.url,
  slug: site.url.replace(/https?:\/\/(www\.)?/, '').replace(/\//g, '-').toLowerCase(),
  faviconUrl: `${site.url}/favicon.ico`,
  screenshotUrl: null,
  categoryId: site.categoryId,
  isAd: site.isAd || false,
  adType: site.adType || null,
  rating: site.rating,
  visitCount: site.visitCount,
  isFeatured: site.isFeatured,
  status: site.status || 'published',
  notes: null,
  submittedBy: null,
  createdAt: generateTimestamp(90 - index),
  updatedAt: generateTimestamp(90 - index),
}));

// ============= BLOG POSTS DATA =============
const blogPostsData = [
  {
    title: 'Next.js 15 新特性详解',
    slug: 'nextjs-15-new-features',
    summary: '深入了解 Next.js 15 带来的重大更新和改进',
    content: `# Next.js 15 新特性详解

Next.js 15 带来了许多令人兴奋的新特性，让我们一起来看看这些改进如何提升开发体验。

## 主要更新

### 1. React 19 支持
Next.js 15 完全支持 React 19，包括新的 Server Components 功能。

### 2. 改进的缓存策略
新的缓存系统更加智能和灵活。

### 3. Turbopack 稳定版
构建速度提升 10 倍以上。

## 结论
Next.js 15 是一个重大升级，值得所有开发者尝试。`,
    status: 'published',
    publishedAt: generateTimestamp(5),
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    tags: 'Next.js,React,前端',
  },
  {
    title: 'React 19 新特性预览',
    slug: 'react-19-preview',
    summary: 'React 19 即将到来，了解新的 Hooks 和特性',
    content: `# React 19 新特性预览

React 19 即将发布，让我们预览一下即将到来的新特性。

## 新增 Hooks

### use() Hook
新的 use() Hook 可以更优雅地处理异步数据。

### useOptimistic()
乐观更新变得更加简单。

## Server Components
服务端组件成为默认选项。`,
    status: 'published',
    publishedAt: generateTimestamp(8),
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    tags: 'React,前端,JavaScript',
  },
  {
    title: 'TypeScript 5.0 完全指南',
    slug: 'typescript-5-guide',
    summary: '掌握 TypeScript 5.0 的新特性和最佳实践',
    content: `# TypeScript 5.0 完全指南

TypeScript 5.0 引入了许多改进，让我们一起学习如何使用这些新特性。

## 装饰器
新的装饰器语法更加标准化。

## 性能提升
编译速度显著提升。`,
    status: 'published',
    publishedAt: generateTimestamp(12),
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
    tags: 'TypeScript,编程语言',
  },
  {
    title: 'Tailwind CSS 实战技巧',
    slug: 'tailwind-css-tips',
    summary: '提升 Tailwind CSS 使用效率的 10 个技巧',
    content: `# Tailwind CSS 实战技巧

分享一些 Tailwind CSS 的实用技巧。

## 1. 自定义主题
如何配置自己的设计系统。

## 2. 响应式设计
移动优先的开发策略。`,
    status: 'published',
    publishedAt: generateTimestamp(15),
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2',
    tags: 'CSS,Tailwind,前端',
  },
  {
    title: '构建可扩展的 React 应用',
    slug: 'scalable-react-apps',
    summary: '大型 React 应用的架构设计和最佳实践',
    content: `# 构建可扩展的 React 应用

探讨如何构建可维护和可扩展的 React 应用。

## 项目结构
功能模块化的目录组织。

## 状态管理
选择合适的状态管理方案。`,
    status: 'published',
    publishedAt: generateTimestamp(18),
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    tags: 'React,架构,最佳实践',
  },
  {
    title: 'Drizzle ORM 入门教程',
    slug: 'drizzle-orm-tutorial',
    summary: '从零开始学习 Drizzle ORM',
    content: `# Drizzle ORM 入门教程

Drizzle 是一个轻量级的 TypeScript ORM。

## 为什么选择 Drizzle
- 类型安全
- 性能优秀
- 简单易用

## 快速开始
安装和基本配置。`,
    status: 'published',
    publishedAt: generateTimestamp(22),
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
    tags: '数据库,TypeScript,后端',
  },
  {
    title: 'Cloudflare Pages 部署指南',
    slug: 'cloudflare-pages-deployment',
    summary: '使用 Cloudflare Pages 部署 Next.js 应用',
    content: `# Cloudflare Pages 部署指南

Cloudflare Pages 提供快速的全球部署。

## 配置步骤
1. 连接 Git 仓库
2. 配置构建命令
3. 设置环境变量

## 性能优化
利用 Cloudflare CDN 加速。`,
    status: 'published',
    publishedAt: generateTimestamp(25),
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
    tags: '部署,Cloudflare,DevOps',
  },
  {
    title: 'Web 性能优化实战',
    slug: 'web-performance-optimization',
    summary: '全面提升网站性能的策略和技巧',
    content: `# Web 性能优化实战

性能优化是前端开发的重要课题。

## 加载优化
- 代码分割
- 懒加载
- 预加载

## 渲染优化
减少重排和重绘。`,
    status: 'published',
    publishedAt: generateTimestamp(30),
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    tags: '性能优化,前端,最佳实践',
  },
  {
    title: 'GraphQL vs REST API',
    slug: 'graphql-vs-rest',
    summary: '对比两种 API 设计方式的优劣',
    content: `# GraphQL vs REST API

深入对比 GraphQL 和 REST API。

## REST API
传统的 API 设计方式。

## GraphQL
更灵活的数据查询。

## 如何选择
根据项目需求做出决策。`,
    status: 'published',
    publishedAt: generateTimestamp(35),
    coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
    tags: 'API,GraphQL,后端',
  },
  {
    title: 'Docker 容器化最佳实践',
    slug: 'docker-best-practices',
    summary: '构建高效的 Docker 镜像',
    content: `# Docker 容器化最佳实践

Docker 是现代应用部署的标准。

## 镜像优化
减小镜像体积。

## 多阶段构建
提升构建效率。`,
    status: 'published',
    publishedAt: generateTimestamp(40),
    coverImage: 'https://images.unsplash.com/photo-1605745341112-85968b19335b',
    tags: 'Docker,DevOps,容器化',
  },
  {
    title: 'Git 工作流最佳实践',
    slug: 'git-workflow',
    summary: '团队协作中的 Git 使用技巧',
    content: `# Git 工作流最佳实践

规范的 Git 工作流提升团队效率。

## 分支策略
- main/master
- develop
- feature

## 提交规范
写好 commit message。`,
    status: 'published',
    publishedAt: generateTimestamp(45),
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498',
    tags: 'Git,团队协作,DevOps',
  },
  {
    title: 'CSS Grid 完全指南',
    slug: 'css-grid-guide',
    summary: '掌握现代 CSS 布局技术',
    content: `# CSS Grid 完全指南

CSS Grid 是最强大的布局系统。

## 基础概念
网格容器和网格项。

## 实战案例
常见布局的实现方式。`,
    status: 'published',
    publishedAt: generateTimestamp(50),
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2',
    tags: 'CSS,布局,前端',
  },
  {
    title: 'JavaScript 设计模式',
    slug: 'javascript-design-patterns',
    summary: '常用的 JavaScript 设计模式详解',
    content: `# JavaScript 设计模式

设计模式帮助我们写出更好的代码。

## 单例模式
确保类只有一个实例。

## 观察者模式
实现发布订阅机制。`,
    status: 'published',
    publishedAt: generateTimestamp(55),
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
    tags: 'JavaScript,设计模式,编程',
  },
  {
    title: 'Web 安全最佳实践',
    slug: 'web-security-best-practices',
    summary: '保护你的 Web 应用免受攻击',
    content: `# Web 安全最佳实践

Web 安全是开发者的责任。

## 常见攻击
- XSS
- CSRF
- SQL 注入

## 防护措施
多层次的安全策略。`,
    status: 'published',
    publishedAt: generateTimestamp(60),
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
    tags: '安全,Web,最佳实践',
  },
  {
    title: 'Serverless 架构入门',
    slug: 'serverless-architecture',
    summary: '了解 Serverless 的优势和应用场景',
    content: `# Serverless 架构入门

Serverless 改变了应用部署方式。

## 什么是 Serverless
无需管理服务器的架构。

## 优势
- 自动扩展
- 按需付费
- 快速部署`,
    status: 'published',
    publishedAt: generateTimestamp(65),
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
    tags: 'Serverless,云计算,架构',
  },

  // Draft posts
  {
    title: 'Web3 开发入门（草稿）',
    slug: 'web3-development-draft',
    summary: '探索 Web3 和区块链开发',
    content: `# Web3 开发入门

这是一篇正在编写的文章...`,
    status: 'draft',
    publishedAt: null,
    coverImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0',
    tags: 'Web3,区块链',
  },
  {
    title: 'AI 辅助编程工具对比（草稿）',
    slug: 'ai-coding-tools-draft',
    summary: '对比主流 AI 编程助手',
    content: `# AI 辅助编程工具对比

待完善的内容...`,
    status: 'draft',
    publishedAt: null,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    tags: 'AI,工具',
  },
  {
    title: '微前端架构实践（草稿）',
    slug: 'micro-frontend-draft',
    summary: '大型前端项目的微前端方案',
    content: `# 微前端架构实践

正在整理...`,
    status: 'draft',
    publishedAt: null,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    tags: '架构,前端',
  },
  {
    title: 'GraphQL 性能优化（草稿）',
    slug: 'graphql-performance-draft',
    summary: '提升 GraphQL API 性能',
    content: `# GraphQL 性能优化

待编写...`,
    status: 'draft',
    publishedAt: null,
    coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
    tags: 'GraphQL,性能',
  },
  {
    title: 'Rust 入门指南（草稿）',
    slug: 'rust-getting-started-draft',
    summary: '学习 Rust 编程语言',
    content: `# Rust 入门指南

准备中...`,
    status: 'draft',
    publishedAt: null,
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
    tags: 'Rust,编程语言',
  },
].map((post, index) => ({
  id: generateId('post'),
  title: post.title,
  slug: post.slug,
  summary: post.summary,
  content: post.content,
  status: post.status,
  publishedAt: post.publishedAt,
  coverImage: post.coverImage,
  authorId: 'admin',
  tags: post.tags,
  createdAt: generateTimestamp(70 - index),
  updatedAt: generateTimestamp(70 - index),
}));

// ============= MAIN SEED FUNCTION =============
async function seed() {
  console.log('🌱 Starting database seed...\n');

  // Connect to local SQLite database
  const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/7c968727857f2b701a601cb9bf07a0f6265551b3f14086987d5a0076cecabc0c.sqlite');
  const db = drizzle(sqlite as any);

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.delete(collectionItems);
    await db.delete(websiteTags);
    await db.delete(blogPosts);
    await db.delete(websites);
    await db.delete(collections);
    await db.delete(tags);
    await db.delete(categories);
    console.log('✅ Cleared all tables\n');

    // 1. Insert Categories
    console.log('📁 Seeding categories...');
    await db.insert(categories).values(allCategories);
    console.log(`✅ Inserted ${allCategories.length} categories\n`);

    // 2. Insert Tags
    console.log('🏷️  Seeding tags...');
    await db.insert(tags).values(tagsData);
    console.log(`✅ Inserted ${tagsData.length} tags\n`);

    // 3. Insert Collections
    console.log('📚 Seeding collections...');
    await db.insert(collections).values(collectionsData);
    console.log(`✅ Inserted ${collectionsData.length} collections\n`);

    // 4. Insert Websites
    console.log('🌐 Seeding websites...');
    await db.insert(websites).values(websitesData);
    console.log(`✅ Inserted ${websitesData.length} websites\n`);

    // 5. Create Website-Tag Relationships
    console.log('🔗 Creating website-tag relationships...');
    const websiteTagsData: Array<{
      websiteId: string;
      tagId: string;
      assignedAt: string;
    }> = [];

    // Find specific tags for targeted relationships
    const frontendTag = tagsData.find((t) => t.slug === 'frontend');
    const reactTag = tagsData.find((t) => t.slug === 'react');
    const typescriptTag = tagsData.find((t) => t.slug === 'typescript');
    const toolsTag = tagsData.find((t) => t.slug === 'tools');
    const freeTag = tagsData.find((t) => t.slug === 'free');
    const openSourceTag = tagsData.find((t) => t.slug === 'open-source');

    // Assign 2-3 tags to each website
    websitesData.forEach((website) => {
      const tagCount = 2 + Math.floor(Math.random() * 2); // 2-3 tags
      const selectedTags = randomItems(tagsData, tagCount);

      // Ensure "frontend" tag has 25+ websites
      if (frontendTag && website.categoryId === categoriesData[0].id && websiteTagsData.filter(wt => wt.tagId === frontendTag.id).length < 25) {
        if (!selectedTags.find(t => t.id === frontendTag.id)) {
          selectedTags.push(frontendTag);
        }
      }

      selectedTags.forEach((tag) => {
        websiteTagsData.push({
          websiteId: website.id,
          tagId: tag.id,
          assignedAt: website.createdAt,
        });
      });
    });

    await db.insert(websiteTags).values(websiteTagsData);
    console.log(`✅ Created ${websiteTagsData.length} website-tag relationships\n`);

    // 6. Create Collection Items
    console.log('📦 Creating collection items...');
    const collectionItemsData: Array<{
      id: string;
      collectionId: string;
      websiteId: string;
      note: string | null;
      position: number;
      createdAt: string;
    }> = [];

    // "前端必备工具" collection should have 20+ items
    const frontendCollection = collectionsData[0];
    const frontendWebsites = websitesData
      .filter((w) => w.categoryId === categoriesData[0].id || w.categoryId === categoriesData[1].id)
      .slice(0, 22);

    frontendWebsites.forEach((website, index) => {
      collectionItemsData.push({
        id: generateId('ci'),
        collectionId: frontendCollection.id,
        websiteId: website.id,
        note: index < 3 ? '强烈推荐' : null,
        position: index,
        createdAt: generateTimestamp(50 - index),
      });
    });

    // Add 6-10 items to other collections
    collectionsData.slice(1).forEach((collection, colIndex) => {
      const itemCount = 6 + Math.floor(Math.random() * 5); // 6-10 items
      const selectedWebsites = randomItems(websitesData.filter(w => w.status === 'published'), itemCount);

      selectedWebsites.forEach((website, index) => {
        collectionItemsData.push({
          id: generateId('ci'),
          collectionId: collection.id,
          websiteId: website.id,
          note: null,
          position: index,
          createdAt: generateTimestamp(45 - colIndex * 5 - index),
        });
      });
    });

    await db.insert(collectionItems).values(collectionItemsData);
    console.log(`✅ Created ${collectionItemsData.length} collection items\n`);

    // 7. Insert Blog Posts
    console.log('📝 Seeding blog posts...');
    await db.insert(blogPosts).values(blogPostsData);
    console.log(`✅ Inserted ${blogPostsData.length} blog posts\n`);

    // Summary
    console.log('🎉 Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Categories: ${allCategories.length} (${categoriesData.length} top-level, ${childCategories.length} children)`);
    console.log(`   - Tags: ${tagsData.length}`);
    console.log(`   - Collections: ${collectionsData.length}`);
    console.log(`   - Websites: ${websitesData.length}`);
    console.log(`     * Published: ${websitesData.filter(w => w.status === 'published').length}`);
    console.log(`     * Draft: ${websitesData.filter(w => w.status === 'draft').length}`);
    console.log(`     * Featured: ${websitesData.filter(w => w.isFeatured).length}`);
    console.log(`     * Ads: ${websitesData.filter(w => w.isAd).length}`);
    console.log(`   - Website-Tag relationships: ${websiteTagsData.length}`);
    console.log(`   - Collection items: ${collectionItemsData.length}`);
    console.log(`   - Blog posts: ${blogPostsData.length}`);
    console.log(`     * Published: ${blogPostsData.filter(p => p.status === 'published').length}`);
    console.log(`     * Draft: ${blogPostsData.filter(p => p.status === 'draft').length}`);
    console.log('\n✨ Database is ready for testing!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    sqlite.close();
  }
}

// Run seed
seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});