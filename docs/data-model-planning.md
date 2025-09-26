# WebVault 数据模型规划（阶段二）

> 目标：为后台管理与提交流程打好持久层基础，统一使用 Cloudflare D1 + Drizzle ORM。

## 设计原则

- **单一事实来源**：所有写操作经由 Drizzle Schema + API；前台展示与后台管理共用同一数据。
- **可扩展性**：保留分类层级、标签多选、收藏集、博客等功能的扩展空间。
- **可审计性**：记录关键变更以便回溯。
- **渐进迁移**：在保持现有 `websites` 表可用的前提下分阶段演进。

## 表结构概览

```
websites                categories             tags
└─ website_tags         └─ parent_id (self)    └─ is_active

collections             collection_items       blog_posts
└─ is_featured          └─ position            └─ status/published_at

submission_requests     audit_logs             users (由 Clerk 承担)
```

### 1. `websites`

最终字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text (PK) | UUID |
| `title` | text | 网站标题 |
| `description` | text | 描述 |
| `url` | text | 网址 |
| `slug` | text | 自定义路径（可选、唯一） |
| `favicon_url` | text | Favicon |
| `screenshot_url` | text | 截图 |
| `category_id` | text (FK → categories.id) | 分类引用 |
| `is_ad` | boolean | 是否广告位 |
| `ad_type` | text | 广告类型 |
| `rating` | integer | 评分 |
| `visit_count` | integer | 访问统计 |
| `is_featured` | boolean | 是否推荐 |
| `is_public` | boolean | 是否公开 |
| `status` | text | `active/inactive` 等业务状态 |
| `review_status` | text | 审核状态（`pending/approved/rejected`） |
| `notes` | text | 内部备注 |
| `submitted_by` | text | 提交人（Clerk user id / 邮箱） |
| `created_at` / `updated_at` | text | ISO 时间戳 |

### 2. `categories`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text (PK) | UUID 或 slug |
| `name` | text | 分类名称 |
| `slug` | text | 唯一标识，用于路由 |
| `description` | text | 描述 |
| `parent_id` | text (FK self) | 支持二级分类（可选） |
| `display_order` | integer | 排序 |
| `icon` | text | UI 展示图标（可选） |
| `is_active` | boolean | 是否启用 |
| `created_at` / `updated_at` | text | 时间戳 |

### 3. `tags`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text (PK) |
| `name` | text | 标签名称 |
| `slug` | text | 唯一标识 |
| `description` | text | 描述，可选 |
| `color` | text | UI 颜色标签 |
| `is_active` | boolean | 启用状态 |
| `created_at` / `updated_at` | text | 时间戳 |

### 4. `website_tags`

多对多中间表：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `website_id` | text (FK → websites.id) |
| `tag_id` | text (FK → tags.id) |
| `assigned_at` | text | 关联时间 |

联合唯一索引 `(website_id, tag_id)` 防止重复。

### 5. `collections`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text (PK) |
| `name` | text |
| `slug` | text |
| `description` | text |
| `cover_image` | text | 封面图 |
| `is_featured` | boolean | 是否首页推荐 |
| `display_order` | integer | 排序 |
| `created_at` / `updated_at` | text |

### 6. `collection_items`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text (PK) |
| `collection_id` | text (FK → collections.id) |
| `website_id` | text (FK → websites.id) |
| `note` | text | 自定义说明 |
| `position` | integer | 在集合中的顺序 |
| `created_at` | text |

### 7. `blog_posts`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text (PK) |
| `title` | text |
| `slug` | text | 唯一路由 |
| `summary` | text | 摘要 |
| `content` | text | Markdown/HTML |
| `status` | text | `draft/published/archived` |
| `published_at` | text | 发布时间 |
| `cover_image` | text | 封面图 |
| `author_id` | text | Clerk user id（单用户可固定） |
| `tags` | text | 可存 JSON 数组或拆分关联表（后续迭代） |
| `created_at` / `updated_at` | text |

### 8. `submission_requests`（可选）

用于记录外部提交或待审核项：

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `website_id` | 关联网站（通过审核后写入） |
| `payload` | 原始提交数据（JSON） |
| `submitted_by` | 邮箱或 Clerk user id |
| `status` | `pending/approved/rejected` |
| `reviewed_by` | 审核人 |
| `reviewed_at` | 时间 |
| `created_at` | 时间 |

### 9. `audit_logs`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `actor_id` | Clerk user id |
| `action` | 操作名称（如 `website.create`） |
| `entity_type` / `entity_id` | 目标资源 |
| `changes` | JSON，记录差异快照 |
| `created_at` | 时间 |

## 迁移策略

1. **初始化阶段**
   - 单一迁移脚本（`drizzle/0000_admin_schema.sql`）创建所有业务表与索引。
   - `websites` 已直接使用新字段定义，无需保留历史兼容列。

2. **数据导入**
   - 如需迁移旧数据，手动映射 `category_id`、`website_tags` 等表格。
   - 缺省情况下后台录入即按新结构存储。

3. **提交流程**
   - `/admin/submit` 初期直接写入 `websites`，将 `review_status` 标为 `pending`。
   - 审核完成后手动/自动改为 `approved` 并设置 `is_public`。
   - 若需要外部提交队列，启用 `submission_requests` 表供后续扩展。

4. **审计与权限**
   - 写操作统一记录 `audit_logs`，字段 `actor_id` 来自 Clerk。
   - 根据未来角色划分再扩展 `actor_role`、`metadata` 等。

## 下一步

1. 使用 Drizzle schema 定义上述新表，生成迁移文件（`drizzle-kit generate`）。
2. 更新 `src/lib/db/schema` 目录，按模块拆分（`categories.ts`, `tags.ts`, `collections.ts`, `blog.ts`, `audit.ts`）。
3. 调整服务层与 API 代码以使用新的关联结构，提供后台读取所需的查询函数。
4. 在 `/admin` 模块中依据新 schema 构建列表和表单组件。

> 本文档用于指导阶段二的数据库建设，后续如有字段调整需同步更新。
