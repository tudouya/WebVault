#!/usr/bin/env node

const { spawnSync } = require('node:child_process')
const { mkdtempSync, writeFileSync, rmSync, unlinkSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const DEFAULT_DATABASE = process.env.D1_DATABASE_NAME || 'webvault'

const args = process.argv.slice(2)
const mode = args.includes('--remote') ? 'remote' : 'local'
const shouldPrint = args.includes('--print') || args.includes('--preview')
const databaseName = getArgValue('--database') || DEFAULT_DATABASE

/**
 * 集合种子数据
 * 不使用 mock 数据，而是创建真实的示例集合
 */
const collections = [
  {
    id: 'collection-design-essentials',
    name: '设计师工具箱',
    slug: 'design-essentials',
    description: '精选UI/UX设计师必备的工具和资源平台，包含设计灵感、原型工具、素材库等。',
    coverImage: 'https://assets.webvault.dev/collections/design-essentials.webp',
    isFeatured: true,
    displayOrder: 1,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-02-10T15:30:00Z',
  },
  {
    id: 'collection-photography-spots',
    name: '摄影爱好者精选',
    slug: 'photography-collection',
    description: '汇聚全球优秀摄影作品、教程和取景地资源，帮助摄影师提升技艺和寻找灵感。',
    coverImage: 'https://assets.webvault.dev/collections/photography.webp',
    isFeatured: true,
    displayOrder: 2,
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-02-08T14:20:00Z',
  },
  {
    id: 'collection-productivity-boost',
    name: '效率提升套件',
    slug: 'productivity-boost',
    description: '时间管理、任务协作、自动化工具集合，帮助个人和团队提高工作效率。',
    coverImage: 'https://assets.webvault.dev/collections/productivity.webp',
    isFeatured: true,
    displayOrder: 3,
    createdAt: '2025-01-15T08:30:00Z',
    updatedAt: '2025-02-09T10:45:00Z',
  },
  {
    id: 'collection-frontend-dev',
    name: '前端开发资源',
    slug: 'frontend-development',
    description: '现代前端开发的框架、工具、设计系统和最佳实践合集。',
    coverImage: 'https://assets.webvault.dev/collections/frontend-dev.webp',
    isFeatured: true,
    displayOrder: 4,
    createdAt: '2025-01-18T11:00:00Z',
    updatedAt: '2025-02-07T16:00:00Z',
  },
  {
    id: 'collection-ai-tools',
    name: 'AI工具合集',
    slug: 'ai-powered-tools',
    description: 'AI驱动的创意、写作、开发和自动化工具，提升工作效率和创造力。',
    coverImage: 'https://assets.webvault.dev/collections/ai-tools.webp',
    isFeatured: true,
    displayOrder: 5,
    createdAt: '2025-01-20T09:30:00Z',
    updatedAt: '2025-02-10T09:15:00Z',
  },
  {
    id: 'collection-knowledge-mgmt',
    name: '知识管理系统',
    slug: 'knowledge-management',
    description: '笔记工具、知识库平台和第二大脑构建资源，助力个人知识体系建设。',
    coverImage: 'https://assets.webvault.dev/collections/knowledge.webp',
    isFeatured: false,
    displayOrder: 6,
    createdAt: '2025-01-22T10:15:00Z',
    updatedAt: '2025-02-06T11:30:00Z',
  },
  {
    id: 'collection-remote-work',
    name: '远程办公必备',
    slug: 'remote-work-essentials',
    description: '远程团队协作、异步沟通和在线会议工具集合。',
    coverImage: 'https://assets.webvault.dev/collections/remote-work.webp',
    isFeatured: false,
    displayOrder: 7,
    createdAt: '2025-01-25T09:00:00Z',
    updatedAt: '2025-02-05T08:45:00Z',
  },
  {
    id: 'collection-inspiration-hub',
    name: '创意灵感中心',
    slug: 'creative-inspiration',
    description: '艺术作品、设计案例和创意写作资源，激发无限灵感。',
    coverImage: 'https://assets.webvault.dev/collections/inspiration.webp',
    isFeatured: false,
    displayOrder: 8,
    createdAt: '2025-01-28T08:20:00Z',
    updatedAt: '2025-02-04T10:00:00Z',
  },
]

/**
 * 集合项目关联数据（collection_items）
 * 将网站关联到集合中
 */
const collectionItems = [
  // 设计师工具箱
  { collectionId: 'collection-design-essentials', websiteId: 'site-inspire-gallery', position: 0, note: 'UI/UX 设计灵感', createdAt: '2025-01-10T10:30:00Z' },
  { collectionId: 'collection-design-essentials', websiteId: 'site-creative-brew', position: 1, note: '设计师访谈', createdAt: '2025-01-10T10:31:00Z' },
  { collectionId: 'collection-design-essentials', websiteId: 'site-design-digest', position: 2, note: '设计系统案例', createdAt: '2025-01-10T10:32:00Z' },
  { collectionId: 'collection-design-essentials', websiteId: 'site-pixel-playground', position: 3, note: '组件生成工具', createdAt: '2025-01-10T10:33:00Z' },
  { collectionId: 'collection-design-essentials', websiteId: 'site-arcade-ui', position: 4, note: '复古UI元素', createdAt: '2025-01-10T10:34:00Z' },

  // 摄影爱好者精选
  { collectionId: 'collection-photography-spots', websiteId: 'site-lens-journal', position: 0, note: '摄影作品社群', createdAt: '2025-01-12T09:10:00Z' },
  { collectionId: 'collection-photography-spots', websiteId: 'site-photo-scout', position: 1, note: '取景地数据库', createdAt: '2025-01-12T09:11:00Z' },
  { collectionId: 'collection-photography-spots', websiteId: 'site-lens-lab', position: 2, note: '摄影教程', createdAt: '2025-01-12T09:12:00Z' },
  { collectionId: 'collection-photography-spots', websiteId: 'site-snapshot-map', position: 3, note: '全球摄影地点', createdAt: '2025-01-12T09:13:00Z' },

  // 效率提升套件
  { collectionId: 'collection-productivity-boost', websiteId: 'site-notion-flow', position: 0, note: 'Notion 模板', createdAt: '2025-01-15T08:40:00Z' },
  { collectionId: 'collection-productivity-boost', websiteId: 'site-focus-track', position: 1, note: '时间追踪', createdAt: '2025-01-15T08:41:00Z' },
  { collectionId: 'collection-productivity-boost', websiteId: 'site-task-bridge', position: 2, note: 'OKR协同', createdAt: '2025-01-15T08:42:00Z' },
  { collectionId: 'collection-productivity-boost', websiteId: 'site-shipmate', position: 3, note: '发布管理', createdAt: '2025-01-15T08:43:00Z' },
  { collectionId: 'collection-productivity-boost', websiteId: 'site-chrono-hub', position: 4, note: '习惯追踪', createdAt: '2025-01-15T08:44:00Z' },

  // 前端开发资源
  { collectionId: 'collection-frontend-dev', websiteId: 'site-dev-radar', position: 0, note: '前端生态周报', createdAt: '2025-01-18T11:10:00Z' },
  { collectionId: 'collection-frontend-dev', websiteId: 'site-frontier-docs', position: 1, note: '架构案例', createdAt: '2025-01-18T11:11:00Z' },
  { collectionId: 'collection-frontend-dev', websiteId: 'site-blueprint-dev', position: 2, note: '工程化指南', createdAt: '2025-01-18T11:12:00Z' },
  { collectionId: 'collection-frontend-dev', websiteId: 'site-stack-garden', position: 3, note: '开发工具集', createdAt: '2025-01-18T11:13:00Z' },

  // AI工具合集
  { collectionId: 'collection-ai-tools', websiteId: 'site-ai-sprint', position: 0, note: 'AI写作助手', createdAt: '2025-01-20T09:40:00Z' },
  { collectionId: 'collection-ai-tools', websiteId: 'site-ai-canvas', position: 1, note: 'AI艺术生成', createdAt: '2025-01-20T09:41:00Z' },
  { collectionId: 'collection-ai-tools', websiteId: 'site-cursor-lab', position: 2, note: 'AI代码助手', createdAt: '2025-01-20T09:42:00Z' },
  { collectionId: 'collection-ai-tools', websiteId: 'site-automation-lab', position: 3, note: '自动化脚本', createdAt: '2025-01-20T09:43:00Z' },

  // 知识管理系统
  { collectionId: 'collection-knowledge-mgmt', websiteId: 'site-notion-flow', position: 0, note: 'Notion 系统', createdAt: '2025-01-22T10:20:00Z' },
  { collectionId: 'collection-knowledge-mgmt', websiteId: 'site-clarity-notes', position: 1, note: '结构化笔记', createdAt: '2025-01-22T10:21:00Z' },

  // 远程办公必备
  { collectionId: 'collection-remote-work', websiteId: 'site-async-daily', position: 0, note: '异步协作', createdAt: '2025-01-25T09:10:00Z' },
  { collectionId: 'collection-remote-work', websiteId: 'site-task-bridge', position: 1, note: '团队任务', createdAt: '2025-01-25T09:11:00Z' },
  { collectionId: 'collection-remote-work', websiteId: 'site-sprint-stories', position: 2, note: '敏捷复盘', createdAt: '2025-01-25T09:12:00Z' },

  // 创意灵感中心
  { collectionId: 'collection-inspiration-hub', websiteId: 'site-inspire-gallery', position: 0, note: '品牌设计', createdAt: '2025-01-28T08:30:00Z' },
  { collectionId: 'collection-inspiration-hub', websiteId: 'site-ai-canvas', position: 1, note: 'AI艺术', createdAt: '2025-01-28T08:31:00Z' },
  { collectionId: 'collection-inspiration-hub', websiteId: 'site-contrast-club', position: 2, note: '创意对比', createdAt: '2025-01-28T08:32:00Z' },
  { collectionId: 'collection-inspiration-hub', websiteId: 'site-idea-forge', position: 3, note: '头脑风暴', createdAt: '2025-01-28T08:33:00Z' },
  { collectionId: 'collection-inspiration-hub', websiteId: 'site-pathfinder', position: 4, note: '产品路线图', createdAt: '2025-01-28T08:34:00Z' },
  { collectionId: 'collection-inspiration-hub', websiteId: 'site-aurora-press', position: 5, note: '品牌故事', createdAt: '2025-01-28T08:35:00Z' },
]

const sqlStatements = buildSeedSql()

if (shouldPrint) {
  console.log(sqlStatements)
  process.exit(0)
}

const tmpDir = mkdtempSync(join(tmpdir(), 'webvault-collections-seed-'))
const sqlFile = join(tmpDir, 'seed-collections.sql')

writeFileSync(sqlFile, sqlStatements, 'utf8')

const wranglerArgs = ['d1', 'execute', databaseName]
if (mode === 'local') {
  wranglerArgs.push('--local')
}
wranglerArgs.push('--file', sqlFile)

const result = spawnSync('wrangler', wranglerArgs, { stdio: 'inherit' })

cleanupTemp(sqlFile, tmpDir)

if (result.error) {
  console.error('执行 wrangler 时出错:', result.error.message)
  process.exit(1)
}

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status)
}

console.log(`✅ 集合数据已插入 ${mode === 'local' ? '本地' : '远程'} D1 数据库 (${databaseName})`)

function buildSeedSql() {
  const lines = []
  lines.push('PRAGMA foreign_keys = ON;')
  lines.push('BEGIN TRANSACTION;')

  // 清空现有集合数据
  lines.push('DELETE FROM collection_items;')
  lines.push('DELETE FROM collections;')

  // 插入集合数据
  for (const collection of collections) {
    lines.push(
      `INSERT INTO collections (id, name, slug, description, cover_image, is_featured, display_order, created_at, updated_at) VALUES (${sqlValue(collection.id)}, ${sqlValue(collection.name)}, ${sqlValue(collection.slug)}, ${sqlValue(collection.description)}, ${sqlValue(collection.coverImage)}, ${sqlValue(collection.isFeatured)}, ${sqlValue(collection.displayOrder)}, ${sqlValue(collection.createdAt)}, ${sqlValue(collection.updatedAt)});`
    )
  }

  // 插入集合项目数据
  for (const item of collectionItems) {
    const id = `item-${item.collectionId}-${item.websiteId}`
    lines.push(
      `INSERT INTO collection_items (id, collection_id, website_id, note, position, created_at) VALUES (${sqlValue(id)}, ${sqlValue(item.collectionId)}, ${sqlValue(item.websiteId)}, ${sqlValue(item.note)}, ${sqlValue(item.position)}, ${sqlValue(item.createdAt)});`
    )
  }

  lines.push('COMMIT;')
  return lines.join('\n') + '\n'
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL'
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

function getArgValue(flag) {
  const index = args.findIndex((arg) => arg === flag)
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1]
  }
  return null
}

function cleanupTemp(filePath, dirPath) {
  try {
    unlinkSync(filePath)
    rmSync(dirPath, { recursive: true, force: true })
  } catch (error) {
    console.warn('清理临时文件失败:', error)
  }
}